"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { FiEdit2, FiMapPin, FiX } from "react-icons/fi";
import { HiCheckCircle, HiExclamationCircle } from "react-icons/hi2";

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

interface GeocodeSuggestion {
  fullLabel: string;
  latitude: number;
  longitude: number;
}

interface GeocodeResponse {
  suggestions?: GeocodeSuggestion[];
}

interface AddressPickerProps {
  label: string;
  value: AddressValue | null;
  onChange: (value: AddressValue | null) => void;
}

const MIN_SEARCH_CHARS = 2;
const MIN_MANUAL_TRIGGER = 3;

type PostcodeStatus = "idle" | "validating" | "valid" | "invalid";

export default function AddressPicker({
  label,
  value,
  onChange,
}: AddressPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchAttempted, setSearchAttempted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [manualMode, setManualMode] = useState(false);
  const [shopOrDoor, setShopOrDoor] = useState("");
  const [postcode, setPostcode] = useState("");
  const [postcodeStatus, setPostcodeStatus] = useState<PostcodeStatus>("idle");
  const [manualCoords, setManualCoords] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestIdRef = useRef(0);

  const showManualPrompt = useMemo(() => {
    return (
      open &&
      !manualMode &&
      !loading &&
      searchAttempted &&
      query.trim().length >= MIN_MANUAL_TRIGGER &&
      results.length === 0
    );
  }, [open, manualMode, loading, searchAttempted, query, results.length]);

  useEffect(() => {
    if (!open || value) return;

    const trimmed = query.trim();
    if (trimmed.length < MIN_SEARCH_CHARS) {
      setResults([]);
      setLoading(false);
      setSearchAttempted(false);
      return;
    }

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(async () => {
      const currentRequestId = ++requestIdRef.current;
      setLoading(true);
      setSearchAttempted(false);

      try {
        const res = await fetch(
          `/api/address/mapbox-search?q=${encodeURIComponent(trimmed)}`
        );

        if (!res.ok) {
          if (requestIdRef.current === currentRequestId) {
            setResults([]);
            setSearchAttempted(true);
          }
          return;
        }

        const data = (await res.json()) as SearchResponse;
        if (requestIdRef.current === currentRequestId) {
          setResults(data.suggestions ?? []);
          setSearchAttempted(true);
        }
      } catch {
        if (requestIdRef.current === currentRequestId) {
          setResults([]);
          setSearchAttempted(true);
        }
      } finally {
        if (requestIdRef.current === currentRequestId) {
          setLoading(false);
        }
      }
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [open, query, value]);

  useEffect(() => {
    if (!manualMode) return;

    const trimmed = postcode.trim().toUpperCase();
    if (trimmed.length < MIN_MANUAL_TRIGGER) {
      setPostcodeStatus("idle");
      setManualCoords(null);
      return;
    }

    const timer = setTimeout(async () => {
      setPostcodeStatus("validating");
      try {
        const res = await fetch(
          `/api/address/mapbox-geocode?q=${encodeURIComponent(trimmed)}`
        );

        if (!res.ok) {
          setPostcodeStatus("invalid");
          setManualCoords(null);
          return;
        }

        const data = (await res.json()) as GeocodeResponse;
        const first = data.suggestions?.[0];

        if (!first) {
          setPostcodeStatus("invalid");
          setManualCoords(null);
          return;
        }

        setPostcodeStatus("valid");
        setManualCoords({
          latitude: first.latitude,
          longitude: first.longitude,
        });
      } catch {
        setPostcodeStatus("invalid");
        setManualCoords(null);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [manualMode, postcode]);

  useEffect(() => {
    setErrorMessage(null);
  }, [query, manualMode, shopOrDoor, postcode]);

  async function selectSuggestion(item: SearchSuggestion) {
    try {
      const res = await fetch(
        `/api/address/mapbox-retrieve?id=${encodeURIComponent(
          item.id
        )}&session=${encodeURIComponent(item.session ?? "")}`
      );

      if (!res.ok) {
        setErrorMessage("We couldn't load that location. Please try again.");
        return;
      }

      const data = (await res.json()) as {
        name?: string;
        address?: string;
        postcode?: string;
        latitude?: number;
        longitude?: number;
      };

      if (typeof data.latitude !== "number" || typeof data.longitude !== "number") {
        setErrorMessage("We couldn't resolve that location. Try another option.");
        return;
      }

      const labelValue = [data.name, data.address, data.postcode]
        .filter(Boolean)
        .join(", ");

      onChange({
        label: labelValue || item.label,
        latitude: data.latitude,
        longitude: data.longitude,
        source: "mapbox",
      });

      setQuery(labelValue || item.label);
      setOpen(true);
      setResults([]);
    } catch {
      setErrorMessage("We couldn't load that location. Please try again.");
    }
  }

  function handleManualConfirm() {
    if (postcodeStatus !== "valid" || !manualCoords) {
      setErrorMessage("Please enter a valid postcode.");
      return;
    }

    const normalizedPostcode = postcode.trim().toUpperCase();
    const labelValue = [shopOrDoor.trim(), normalizedPostcode]
      .filter(Boolean)
      .join(", ");

    onChange({
      label: labelValue || normalizedPostcode,
      latitude: manualCoords.latitude,
      longitude: manualCoords.longitude,
      source: "manual",
      shopOrDoor: shopOrDoor.trim() || undefined,
      postcode: normalizedPostcode,
    });

    setQuery(labelValue || normalizedPostcode);
    setManualMode(false);
    setResults([]);
  }

  function reset() {
    setOpen(false);
    setQuery("");
    setResults([]);
    setLoading(false);
    setSearchAttempted(false);
    setManualMode(false);
    setShopOrDoor("");
    setPostcode("");
    setPostcodeStatus("idle");
    setManualCoords(null);
    setErrorMessage(null);
    onChange(null);
  }

  return (
    <div className="relative mt-4">
      <label className="text-sm font-semibold">{label}</label>

      {value ? (
        <div className="relative mt-2">
          <input
            value={value.label}
            disabled
            className="w-full rounded-xl border px-3 py-2 pr-10 bg-gray-50"
          />
          <button
            type="button"
            onClick={reset}
            className="absolute right-2 top-3 text-gray-500"
            aria-label={`Change ${label}`}
          >
            <FiX />
          </button>
        </div>
      ) : (
        <>
          {!open ? (
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="mt-2 w-full rounded-xl border border-dashed px-3 py-2 text-sm text-gray-600"
            >
              Add address
            </button>
          ) : (
            <div className="relative">
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="mt-2 w-full rounded-xl border px-3 py-2 pr-10"
                placeholder="Search place, postcode or address"
              />
              {loading && (
                <span className="absolute right-3 top-4 text-xs text-gray-400">
                  Searching…
                </span>
              )}
            </div>
          )}
        </>
      )}

      {!value && open && results.length > 0 && (
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

      {!value && showManualPrompt && (
        <button
          type="button"
          onClick={() => setManualMode(true)}
          className="mt-2 flex items-center gap-2 text-sm text-purple-600"
        >
          <FiEdit2 />
          Add address manually
        </button>
      )}

      {!value && manualMode && (
        <div className="mt-3 space-y-2 rounded-xl border bg-gray-50 p-3">
          <input
            placeholder="Shop name / Door number"
            value={shopOrDoor}
            onChange={(event) => setShopOrDoor(event.target.value)}
            className="w-full rounded border px-3 py-2"
          />

          <div className="relative">
            <input
              placeholder="Postcode"
              value={postcode}
              onChange={(event) => setPostcode(event.target.value)}
              className="w-full rounded border px-3 py-2 pr-10"
            />
            {postcodeStatus === "valid" && (
              <HiCheckCircle className="absolute right-3 top-3 text-green-500" />
            )}
            {postcodeStatus === "invalid" && (
              <HiExclamationCircle className="absolute right-3 top-3 text-red-500" />
            )}
          </div>

          {postcodeStatus === "invalid" && (
            <p className="text-sm text-red-500">Invalid postcode</p>
          )}

          <button
            type="button"
            onClick={handleManualConfirm}
            disabled={postcodeStatus !== "valid"}
            className="w-full rounded bg-purple-600 py-2 text-white disabled:opacity-60"
          >
            Use this address
          </button>
        </div>
      )}

      {errorMessage && (
        <p className="mt-2 text-sm text-red-500">{errorMessage}</p>
      )}
    </div>
  );
}
