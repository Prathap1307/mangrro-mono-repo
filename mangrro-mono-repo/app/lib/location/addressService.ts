type MapboxSuggestion = {
  id: string;
  label: string;
  session: string;
};

type MapboxRetrieveResult = {
  name?: string;
  address?: string;
  postcode?: string;
  latitude?: number;
  longitude?: number;
};

type GeocodeSuggestion = {
  label: string;
  fullLabel: string;
  latitude: number;
  longitude: number;
};

type AddressResult = {
  line1: string;
  line2?: string;
  town: string;
  postcode: string;
  latitude?: number;
  longitude?: number;
};

type IdealPostcodeSuggestion = {
  id: string;
  label: string;
};

type SearchOptions = {
  latitude?: number;
  longitude?: number;
  session?: string;
  signal?: AbortSignal;
};

type RequestOptions = {
  signal?: AbortSignal;
};

const IDEAL_POSTCODES_BASE = "https://api.ideal-postcodes.co.uk/v1";

const normalizeQuery = (q: string) =>
  q
    .toLowerCase()
    .replace(/\band\b/g, "&")
    .replace(/\s+/g, " ")
    .trim();

const createSessionToken = () => {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return `session_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
};

const mapboxToken = process.env.EXPO_PUBLIC_MAPBOX_TOKEN;
const idealPostcodesKey = process.env.EXPO_PUBLIC_IDEALPOSTCODES_KEY;

export const searchAddress = async (
  query: string,
  options: SearchOptions = {}
): Promise<MapboxSuggestion[]> => {
  const trimmed = query.trim();
  if (!mapboxToken || trimmed.length < 2) return [];

  const normalized = normalizeQuery(trimmed);
  const session = options.session ?? createSessionToken();

  const url = new URL("https://api.mapbox.com/search/searchbox/v1/suggest");
  url.searchParams.set("q", normalized);
  url.searchParams.set("access_token", mapboxToken);
  url.searchParams.set("session_token", session);
  url.searchParams.set("country", "GB");
  url.searchParams.set("language", "en-GB");
  url.searchParams.set("limit", "8");
  url.searchParams.set("types", "poi");
  url.searchParams.set(
    "poi_category",
    "supermarket,groceries,discount_store,home_improvement"
  );

  if (options.latitude != null && options.longitude != null) {
    url.searchParams.set("proximity", `${options.longitude},${options.latitude}`);
  }

  const res = await fetch(url.toString(), { signal: options.signal });
  if (!res.ok) return [];

  const data = await res.json();

  return (
    data.suggestions?.map((suggestion: any) => ({
      id: suggestion.mapbox_id,
      label: suggestion.name,
      session,
    })) ?? []
  );
};

export const retrieveAddress = async (
  id: string,
  session?: string,
  options: RequestOptions = {}
): Promise<MapboxRetrieveResult | null> => {
  if (!mapboxToken || !id || !session) return null;

  const url = new URL(
    `https://api.mapbox.com/search/searchbox/v1/retrieve/${id}`
  );
  url.searchParams.set("access_token", mapboxToken);
  url.searchParams.set("session_token", session);

  const res = await fetch(url.toString(), { signal: options.signal });
  if (!res.ok) return null;

  const data = await res.json();
  const feature = data.features?.[0];
  if (!feature) return null;

  return {
    name: feature.properties?.name,
    address: feature.properties?.full_address,
    postcode: feature.properties?.postcode,
    latitude: feature.geometry?.coordinates?.[1],
    longitude: feature.geometry?.coordinates?.[0],
  };
};

export const geocodePostcode = async (
  postcode: string,
  options: SearchOptions = {}
): Promise<GeocodeSuggestion[]> => {
  const trimmed = postcode.trim();
  if (!mapboxToken || trimmed.length < 3) return [];

  const normalized = normalizeQuery(trimmed);
  const url = new URL(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
      normalized
    )}.json`
  );

  url.searchParams.set("access_token", mapboxToken);
  url.searchParams.set("country", "GB");
  url.searchParams.set("language", "en-GB");
  url.searchParams.set("types", "poi,address,postcode");
  url.searchParams.set("limit", "5");

  if (options.latitude != null && options.longitude != null) {
    url.searchParams.set("proximity", `${options.longitude},${options.latitude}`);
  }

  const res = await fetch(url.toString(), { signal: options.signal });
  if (!res.ok) return [];

  const data = await res.json();

  return (
    data.features?.map((feature: any) => ({
      label: feature.text,
      fullLabel: feature.place_name,
      latitude: feature.center?.[1],
      longitude: feature.center?.[0],
    })) ?? []
  );
};

export const reverseGeocode = async (
  latitude: number,
  longitude: number,
  options: RequestOptions = {}
): Promise<AddressResult | null> => {
  if (!mapboxToken) return null;

  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?types=address&limit=1&access_token=${mapboxToken}`;
  const res = await fetch(url, { signal: options.signal });
  if (!res.ok) return null;

  const data = await res.json();
  const place = data.features?.[0];
  if (!place) return null;

  const postcode =
    place.context?.find((context: any) => context.id?.startsWith("postcode"))
      ?.text ?? "";

  return {
    line1: place.text,
    line2: place.address,
    town:
      place.context?.find((context: any) => context.id?.startsWith("place"))
        ?.text ?? "",
    postcode,
    latitude,
    longitude,
  };
};

export const searchIdealPostcodes = async (
  query: string,
  options: RequestOptions = {}
): Promise<IdealPostcodeSuggestion[]> => {
  const trimmed = query.trim();
  if (!idealPostcodesKey || trimmed.length < 3) return [];

  const res = await fetch(
    `${IDEAL_POSTCODES_BASE}/autocomplete/addresses?q=${encodeURIComponent(
      trimmed
    )}&api_key=${idealPostcodesKey}`,
    { signal: options.signal }
  );

  if (!res.ok) return [];

  const data = await res.json();
  if (!data?.result) return [];

  let results: any[] = [];

  if (Array.isArray(data.result)) {
    results = data.result;
  } else if (Array.isArray(data.result?.hits)) {
    results = data.result.hits;
  }

  return results.map((item) => ({
    id: item.id,
    label: item.text || item.suggestion || item.label,
  }));
};

export const retrieveIdealPostcode = async (
  id: string,
  options: RequestOptions = {}
): Promise<AddressResult | null> => {
  if (!idealPostcodesKey || !id) return null;

  const udprn = id.startsWith("paf_") ? id.replace("paf_", "") : null;

  const endpoint = udprn
    ? `${IDEAL_POSTCODES_BASE}/udprn/${udprn}?api_key=${idealPostcodesKey}`
    : `${IDEAL_POSTCODES_BASE}/addresses/${id}?api_key=${idealPostcodesKey}`;

  const res = await fetch(endpoint, { signal: options.signal });
  if (!res.ok) return null;

  const data = await res.json();
  if (!data?.result) return null;

  const addr = data.result;

  return {
    line1: addr.line_1,
    line2: addr.line_2,
    town: addr.post_town,
    postcode: addr.postcode,
    latitude: addr.latitude,
    longitude: addr.longitude,
  };
};
