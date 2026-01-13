// components/AddressMap.tsx
"use client";

interface AddressMapProps {
  latitude: number;
  longitude: number;
  className?: string;
}

export default function AddressMap({
  latitude,
  longitude,
  className = "",
}: AddressMapProps) {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  if (!token) {
    return (
      <div
        className={
          "flex h-40 items-center justify-center rounded-xl bg-gray-100 text-xs text-gray-500 " +
          className
        }
      >
        Mapbox token missing (set NEXT_PUBLIC_MAPBOX_TOKEN)
      </div>
    );
  }

  const lng = longitude;
  const lat = latitude;

  const src = `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/pin-s+ff0000(${lng},${lat})/${lng},${lat},14,0/600x300?access_token=${token}`;

  return (
    <div className={"overflow-hidden rounded-xl " + className}>
      <img
        src={src}
        alt="Delivery location map"
        className="h-40 w-full object-cover"
      />
    </div>
  );
}
