type AddressResult = {
  line1: string;
  line2?: string;
  town?: string;
  postcode?: string;
  latitude?: number;
  longitude?: number;
};

const IDEAL_POSTCODES_BASE = "https://api.ideal-postcodes.co.uk/v1";

export const searchAddresses = async (query: string) => {
  const apiKey = process.env.IDEALPOSTCODES_KEY;
  if (!apiKey || query.trim().length < 3) return [];

  const res = await fetch(
    `${IDEAL_POSTCODES_BASE}/autocomplete/addresses?q=${encodeURIComponent(
      query
    )}&api_key=${apiKey}`
  );
  const data = await res.json();
  if (!data?.result) return [];
  const results = Array.isArray(data.result)
    ? data.result
    : Array.isArray(data.result?.hits)
    ? data.result.hits
    : [];
  return results.map((item: any) => ({
    id: item.id,
    label: item.text || item.suggestion || item.label,
  }));
};

export const fetchAddressDetails = async (id: string) => {
  const apiKey = process.env.IDEALPOSTCODES_KEY;
  if (!apiKey || !id) return null;

  const udprn = id.startsWith("paf_") ? id.replace("paf_", "") : null;
  const endpoint = udprn
    ? `${IDEAL_POSTCODES_BASE}/udprn/${udprn}?api_key=${apiKey}`
    : `${IDEAL_POSTCODES_BASE}/addresses/${id}?api_key=${apiKey}`;
  const res = await fetch(endpoint);
  const data = await res.json();
  const addr = data?.result;
  if (!addr) return null;

  return {
    line1: addr.line_1,
    line2: addr.line_2,
    town: addr.post_town,
    postcode: addr.postcode,
    latitude: addr.latitude,
    longitude: addr.longitude,
  } as AddressResult;
};

export const reverseGeocode = async (latitude: number, longitude: number) => {
  const token = process.env.MAPBOX_TOKEN;
  if (!token) return null;

  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?types=address&limit=1&access_token=${token}`;
  const res = await fetch(url);
  const data = await res.json();
  const place = data?.features?.[0];
  if (!place) return null;

  const postcode =
    place.context?.find((c: any) => c.id?.startsWith("postcode"))?.text ?? "";
  return {
    line1: place.text,
    line2: place.address,
    town: place.context?.find((c: any) => c.id?.startsWith("place"))?.text ?? "",
    postcode,
    latitude,
    longitude,
  } as AddressResult;
};
