"use client";

import { Dispatch, SetStateAction, useMemo } from "react";

type PickupType = "now" | "schedule";

interface TimePickerProps {
  pickupType: PickupType;
  setPickupType: Dispatch<SetStateAction<PickupType>>;
  pickupTime: string;
  setPickupTime: Dispatch<SetStateAction<string>>;
}

function buildTimeOptions() {
  const options: string[] = [];
  for (let hour = 0; hour < 24; hour += 1) {
    for (let minute = 0; minute < 60; minute += 30) {
      const value = `${String(hour).padStart(2, "0")}:${String(minute).padStart(
        2,
        "0"
      )}`;
      options.push(value);
    }
  }
  return options;
}

export default function TimePicker({
  pickupType,
  setPickupType,
  pickupTime,
  setPickupTime,
}: TimePickerProps) {
  const timeOptions = useMemo(() => buildTimeOptions(), []);

  return (
    <div className="mt-4 space-y-3">
      <label className="text-sm font-semibold">Pickup time</label>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => setPickupType("now")}
          className={`flex-1 rounded-xl py-2 ${
            pickupType === "now" ? "bg-purple-600 text-white" : "border"
          }`}
        >
          Now
        </button>

        <button
          type="button"
          onClick={() => setPickupType("schedule")}
          className={`flex-1 rounded-xl py-2 ${
            pickupType === "schedule" ? "bg-purple-600 text-white" : "border"
          }`}
        >
          Schedule
        </button>
      </div>

      {pickupType === "schedule" && (
        <select
          value={pickupTime}
          onChange={(e) => setPickupTime(e.target.value)}
          className="w-full rounded-xl border px-3 py-2"
        >
          <option value="">Select a time</option>
          {timeOptions.map((time) => (
            <option key={time} value={time}>
              {time}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
