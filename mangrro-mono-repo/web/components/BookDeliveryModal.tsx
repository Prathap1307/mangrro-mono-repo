"use client";

import { useEffect, useMemo, useState } from "react";
import TimePicker from "./TimePicker";
import AddressPicker from "./AddressPicker";

interface AddressValue {
  label: string;
  latitude: number;
  longitude: number;
  source: "mapbox" | "manual";
  shopOrDoor?: string;
  postcode?: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
}

type ParcelSize = "small" | "medium" | "large";
type PickupType = "now" | "schedule";

export default function BookDeliveryModal({ open, onClose }: Props) {
  const [pickupAddress, setPickupAddress] = useState<AddressValue | null>(null);
  const [dropAddress, setDropAddress] = useState<AddressValue | null>(null);

  const [pickupType, setPickupType] = useState<PickupType>("now");
  const [pickupTime, setPickupTime] = useState<string>("");

  const [receipt, setReceipt] = useState<File | null>(null);
  const [parcelSize, setParcelSize] = useState<ParcelSize | "">("");
  const [instructions, setInstructions] = useState("");

  const [price, setPrice] = useState<number | null>(null);
  const [priceError, setPriceError] = useState<string | null>(null);
  const [loadingPrice, setLoadingPrice] = useState(false);
  const [booking, setBooking] = useState<"idle" | "saving" | "success">("idle");
  const [bookingError, setBookingError] = useState<string | null>(null);

  const readyForPrice = useMemo(() => {
    return Boolean(pickupAddress && dropAddress && parcelSize);
  }, [pickupAddress, dropAddress, parcelSize]);

  useEffect(() => {
    setPrice(null);
    setPriceError(null);
    setBooking("idle");
    setBookingError(null);
  }, [pickupAddress, dropAddress, parcelSize]);

  /* ---------------------------------
     Calculate delivery price
  --------------------------------- */
  async function calculatePrice() {
    if (!pickupAddress || !dropAddress || !parcelSize) return;

    setLoadingPrice(true);
    setPriceError(null);

    try {
      const res = await fetch("/api/delivery-calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from: pickupAddress,
          to: dropAddress,
          location: "pickup",
          parcelSize,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setPriceError(data.error ?? "Failed to calculate price.");
        return;
      }

      if (!data.available) {
        setPriceError(data.message ?? "Sorry, we don’t deliver to this location.");
        return;
      }

      if (typeof data.finalPrice !== "number") {
        setPriceError("Failed to calculate price.");
        return;
      }

      setPrice(data.finalPrice);
    } catch (err) {
      setPriceError("Failed to calculate price. Try again.");
    } finally {
      setLoadingPrice(false);
    }
  }

  async function uploadReceipt(file: File) {
    const res = await fetch(
      `/api/upload-url?file=${encodeURIComponent(file.name)}&type=${file.type}`
    );
    if (!res.ok) {
      throw new Error("Failed to get upload URL.");
    }
    const { uploadUrl, key } = (await res.json()) as {
      uploadUrl: string;
      key: string;
    };

    await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: file,
    });

    return {
      s3Key: key,
      s3Url: `/api/image?key=${encodeURIComponent(key)}`,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
    };
  }

  function buildIsoTime(timeValue: string) {
    if (!timeValue) return undefined;
    const [hours, minutes] = timeValue.split(":").map(Number);
    if (Number.isNaN(hours) || Number.isNaN(minutes)) return undefined;

    const scheduled = new Date();
    scheduled.setHours(hours, minutes, 0, 0);
    return scheduled.toISOString();
  }

  async function handleBookDelivery() {
    if (!pickupAddress || !dropAddress || price === null) return;
    if (pickupType === "schedule" && !pickupTime) {
      setBookingError("Please select a pickup time.");
      return;
    }

    setBooking("saving");
    setBookingError(null);

    try {
      const image = receipt ? await uploadReceipt(receipt) : undefined;
      const payload = {
        pickupAddress,
        dropoffAddress: dropAddress,
        parcelSize:
          parcelSize === "small"
            ? "Small"
            : parcelSize === "medium"
              ? "Medium"
              : "Large",
        pickupTime:
          pickupType === "now"
            ? new Date().toISOString()
            : buildIsoTime(pickupTime),
        dropTime: undefined,
        instructions,
        image,
        price,
      };

      const res = await fetch("/api/pickups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to book delivery.");
      }

      setBooking("success");
    } catch (error) {
      setBookingError(
        error instanceof Error ? error.message : "Failed to book delivery."
      );
      setBooking("idle");
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-t-3xl md:rounded-3xl bg-white p-5 shadow-2xl max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">Book Pickup & Delivery</h2>
          <button onClick={onClose} className="text-sm text-gray-400">
            Close
          </button>
        </div>

        <AddressPicker
          label="Pickup location"
          value={pickupAddress}
          onChange={setPickupAddress}
        />

        <AddressPicker
          label="Drop-off location"
          value={dropAddress}
          onChange={setDropAddress}
        />

        <TimePicker
          pickupType={pickupType}
          setPickupType={setPickupType}
          pickupTime={pickupTime}
          setPickupTime={setPickupTime}
        />

        {/* Receipt */}
        <div className="mt-4">
          <label className="text-sm font-semibold">
            Upload receipt (if store pickup)
          </label>
          <input
            type="file"
            accept="image/*,application/pdf"
            onChange={(e) => setReceipt(e.target.files?.[0] ?? null)}
            className="mt-2 block w-full text-sm"
          />
        </div>

        {/* Parcel size */}
        <div className="mt-4">
          <label className="text-sm font-semibold">Parcel size</label>
          <select
            value={parcelSize}
            onChange={(e) =>
              setParcelSize(e.target.value as ParcelSize | "")
            }
            className="mt-2 w-full rounded-xl border px-3 py-2"
          >
            <option value="">Select parcel size</option>
            <option value="small">Small (bag)</option>
            <option value="medium">Medium (box)</option>
            <option value="large">Large / bulky</option>
          </select>
        </div>

        {/* Instructions */}
        <div className="mt-4">
          <label className="text-sm font-semibold">Instructions</label>
          <input
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            className="mt-2 w-full rounded-xl border px-3 py-2"
            placeholder="Add delivery notes (optional)"
          />
        </div>

        {/* Price output */}
        {loadingPrice && (
          <p className="mt-4 text-sm text-gray-500">
            Calculating price…
          </p>
        )}

        {priceError && (
          <p className="mt-4 text-sm text-red-500">
            {priceError}
          </p>
        )}

        {typeof price === "number" && (
          <p className="mt-4 text-lg font-bold">
            Delivery Price: £{price.toFixed(2)}
          </p>
        )}

        {bookingError && (
          <p className="mt-4 text-sm text-red-500">{bookingError}</p>
        )}

        {booking === "success" && (
          <p className="mt-4 rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700">
            Booking confirmed! We’ll notify you shortly with the courier details.
          </p>
        )}

        {/* CTA */}
        {price === null ? (
          <button
            type="button"
            onClick={calculatePrice}
            disabled={!readyForPrice || loadingPrice}
            className="mt-6 w-full rounded-xl bg-purple-600 py-3 font-semibold text-white disabled:opacity-60"
          >
            Calculate Price
          </button>
        ) : (
          <button
            type="button"
            onClick={handleBookDelivery}
            disabled={booking === "saving" || booking === "success"}
            className="mt-6 w-full rounded-xl bg-purple-600 py-3 font-semibold text-white disabled:opacity-60"
          >
            {booking === "saving"
              ? "Booking..."
              : booking === "success"
                ? "Booked"
                : "Book Delivery"}
          </button>
        )}
      </div>
    </div>
  );
}
