"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { FiEdit2, FiMapPin, FiX } from "react-icons/fi";

/* ================= TYPES ================= */

interface AddressValue {
  label: string;
  latitude: number;
  longitude: number;
  source: "mapbox" | "manual";
  shopOrDoor?: string;
  postcode?: string;
}

interface SearchSuggestion {
  id: string;
  label: string;
  session?: string;
}

interface SearchResponse {
  suggestions?: SearchSuggestion[];
}

interface GeocodeResponse {
  suggestions?: {
    latitude: number;
    longitude: number;
    fullLabel: string;
  }[];
}

interface Props {
  label: string;
  onSelect: (addr: AddressValue) => void;
}

/* ================= CONSTANTS ================= */

const MIN_SEARCH_CHARS = 2;
const MIN_MANUAL_TRIGGER = 3;

/* ================= COMPONENT ================= */

export default function MapboxAddressAutocomplete({ label, onSelect }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [locked, setLocked] = useState(false);

  const [hasSearched, setHasSearched] = useState(false);

  // Manual mode
  const [manualMode, setManualMode] = useState(false);
  const [shopOrDoor, setShopOrDoor] = useState("");
  const [postcode, setPostcode] = useState("");

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestIdRef = useRef(0);

  /* ================= MAIN AUTOCOMPLETE ================= */

  useEffect(() => {
    if (locked) return;

    const trimmed = query.trim();

    if (trimmed.length < MIN_SEARCH_CHARS) {
      setResults([]);
      setLoading(false);
      setHasSearched(false);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      const currentRequestId = ++requestIdRef.current;
      setLoading(true);
      setHasSearched(true);

      try {
        const res = await fetch(
          `/api/address/mapbox-search?q=${encodeURIComponent(trimmed)}`
        );

        if (!res.ok) {
          if (requestIdRef.current === currentRequestId) {
            setResults([]);
          }
          return;
        }

        const data = (await res.json()) as SearchResponse;

        if (requestIdRef.current === currentRequestId && !locked) {
          setResults(data.suggestions ?? []);
        }
      } catch {
        if (requestIdRef.current === currentRequestId) {
          setResults([]);
        }
      } finally {
        if (requestIdRef.current === currentRequestId) {
          setLoading(false);
        }
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, locked]);

  /* ================= CONDITIONS ================= */

  const showManualPrompt = useMemo(() => {
    return (
      hasSearched &&
      !locked &&
      !manualMode &&
      !loading &&
      query.trim().length >= MIN_MANUAL_TRIGGER &&
      results.length === 0
    );
  }, [hasSearched, locked, manualMode, loading, query, results.length]);

  /* ================= HANDLERS ================= */

  async function selectSuggestion(item: SearchSuggestion) {
    const res = await fetch(
      `/api/address/mapbox-retrieve?id=${encodeURIComponent(
        item.id
      )}&session=${encodeURIComponent(item.session ?? "")}`
    );

    if (!res.ok) return;

    const data = (await res.json()) as {
      name?: string;
      address?: string;
      postcode?: string;
      latitude?: number;
      longitude?: number;
    };

    if (
      typeof data.latitude !== "number" ||
      typeof data.longitude !== "number"
    ) {
      return;
    }

    const labelValue = [data.name, data.address, data.postcode]
      .filter(Boolean)
      .join(", ");

    onSelect({
      label: labelValue || item.label,
      latitude: data.latitude,
      longitude: data.longitude,
      source: "mapbox",
    });

    setQuery(labelValue || item.label);
    setLocked(true);
    setResults([]);
  }

  async function resolveManualAddress() {
    if (!postcode.trim()) return;

    // 🔑 Use postcode centroid (ideal for pricing)
    const res = await fetch(
      `/api/address/mapbox-geocode?q=${encodeURIComponent(postcode.trim())}`
    );

    if (!res.ok) return;

    const data = (await res.json()) as GeocodeResponse;
    const first = data.suggestions?.[0];
    if (!first) return;

    const labelValue = [shopOrDoor, postcode.toUpperCase()]
      .filter(Boolean)
      .join(", ");

    onSelect({
      label: labelValue,
      latitude: first.latitude,
      longitude: first.longitude,
      source: "manual",
      shopOrDoor: shopOrDoor || undefined,
      postcode: postcode.toUpperCase(),
    });

    setQuery(labelValue);
    setLocked(true);
    setManualMode(false);
    setResults([]);
  }

  function reset() {
    setQuery("");
    setResults([]);
    setLocked(false);
    setManualMode(false);
    setShopOrDoor("");
    setPostcode("");
    setHasSearched(false);
  }

  /* ================= RENDER ================= */

  return (
    <div className="relative mt-4">
      <label className="text-sm font-semibold">{label}</label>

      <div className="relative">
        <input
          value={query}
          disabled={locked}
          onChange={(e) => setQuery(e.target.value)}
          className="mt-2 w-full rounded-xl border px-3 py-2 pr-10"
          placeholder="Search place, postcode or address"
        />
        {locked && (
          <button
            type="button"
            onClick={reset}
            className="absolute right-2 top-3"
            aria-label="Change address"
          >
            <FiX />
          </button>
        )}
      </div>

      {/* AUTOCOMPLETE RESULTS */}
      {!locked && results.length > 0 && (
        <div className="absolute z-20 mt-1 w-full rounded-xl border bg-white shadow">
          {results.map((result) => (
            <button
              key={result.id}
              type="button"
              onClick={() => selectSuggestion(result)}
              className="flex w-full gap-2 px-3 py-2 text-left hover:bg-gray-50"
            >
              <FiMapPin className="mt-1 text-purple-600" />
              {result.label}
            </button>
          ))}
        </div>
      )}

      {/* MANUAL CTA */}
      {showManualPrompt && (
        <button
          type="button"
          onClick={() => setManualMode(true)}
          className="mt-2 flex items-center gap-2 text-sm text-purple-600"
        >
          <FiEdit2 />
          Add address manually
        </button>
      )}

      {/* MANUAL FORM */}
      {manualMode && !locked && (
        <div className="mt-3 space-y-2 rounded-xl border bg-gray-50 p-3">
          <input
            placeholder="Shop name / Door number"
            value={shopOrDoor}
            onChange={(e) => setShopOrDoor(e.target.value)}
            className="w-full rounded border px-3 py-2"
          />

          <input
            placeholder="Postcode"
            value={postcode}
            onChange={(e) => setPostcode(e.target.value)}
            className="w-full rounded border px-3 py-2"
          />

          <button
            type="button"
            onClick={resolveManualAddress}
            className="w-full rounded bg-purple-600 py-2 text-white"
          >
            Use this address
          </button>
        </div>
      )}
    </div>
  );
}
