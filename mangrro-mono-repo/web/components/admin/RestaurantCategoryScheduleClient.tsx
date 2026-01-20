"use client";

import { useEffect, useMemo, useState } from "react";
import AdminCard from "./AdminCard";
import AdminPageTitle from "./AdminPageTitle";
import type { RestaurantCategory, RestaurantCategoryScheduleDay } from "@/lib/admin/restaurants";

interface RestaurantCategoryScheduleClientProps {
  restaurantName: string;
}

const buildDefaultSchedule = (): RestaurantCategoryScheduleDay[] => [
  { day: "Monday", slots: [{ start: "08:00", end: "12:00" }, { start: "16:00", end: "22:00" }] },
  { day: "Tuesday", slots: [{ start: "08:00", end: "12:00" }, { start: "16:00", end: "22:00" }] },
  { day: "Wednesday", slots: [{ start: "08:00", end: "12:00" }, { start: "16:00", end: "22:00" }] },
  { day: "Thursday", slots: [{ start: "08:00", end: "12:00" }, { start: "16:00", end: "22:00" }] },
  { day: "Friday", slots: [{ start: "08:00", end: "12:00" }, { start: "16:00", end: "22:00" }] },
  { day: "Saturday", slots: [{ start: "08:00", end: "12:00" }, { start: "16:00", end: "22:00" }] },
  { day: "Sunday", slots: [{ start: "08:00", end: "12:00" }, { start: "16:00", end: "22:00" }] },
];

export default function RestaurantCategoryScheduleClient({
  restaurantName,
}: RestaurantCategoryScheduleClientProps) {
  const [categories, setCategories] = useState<RestaurantCategory[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [schedule, setSchedule] = useState<RestaurantCategoryScheduleDay[]>(buildDefaultSchedule());

  const endpoint = useMemo(
    () => `/api/admin/restaurants/${encodeURIComponent(restaurantName)}/categories`,
    [restaurantName],
  );

  const loadCategories = async () => {
    const res = await fetch(endpoint);
    const data = await res.json();
    setCategories(Array.isArray(data) ? data : []);
  };

  useEffect(() => {
    void loadCategories();
  }, [endpoint]);

  useEffect(() => {
    if (!selectedId && categories.length > 0) {
      setSelectedId(categories[0].id);
    }
  }, [categories, selectedId]);

  useEffect(() => {
    const selected = categories.find((category) => category.id === selectedId);
    setSchedule(selected?.schedule?.length ? selected.schedule : buildDefaultSchedule());
  }, [categories, selectedId]);

  const updateSlot = (dayIndex: number, slotIndex: number, field: "start" | "end", value: string) => {
    setSchedule((prev) =>
      prev.map((day, idx) =>
        idx === dayIndex
          ? {
              ...day,
              slots: day.slots.map((slot, slotIdx) =>
                slotIdx === slotIndex ? { ...slot, [field]: value } : slot,
              ),
            }
          : day,
      ),
    );
  };

  const handleSave = async () => {
    const nextCategories = categories.map((category) =>
      category.id === selectedId ? { ...category, schedule } : category,
    );
    await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categories: nextCategories }),
    });
    await loadCategories();
  };

  return (
    <div className="space-y-6">
      <AdminPageTitle
        title="Categories schedule"
        description={`Schedule category visibility for ${restaurantName}.`}
        action={
          <button
            onClick={handleSave}
            className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-200"
          >
            Save Schedule
          </button>
        }
      />

      <AdminCard>
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-3">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedId(category.id)}
                className={`rounded-full px-4 py-2 text-xs font-semibold ${
                  category.id === selectedId
                    ? "bg-blue-600 text-white"
                    : "border border-slate-200 text-slate-600"
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <h3 className="text-lg font-semibold text-slate-900">Weekly schedule</h3>
            <p className="text-sm text-slate-500">
              Two time slots per day for the selected category.
            </p>

            <div className="mt-4 space-y-4">
              {schedule.map((day, dayIndex) => (
                <div key={day.day} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{day.day}</p>
                      <p className="text-xs text-slate-500">Applies to the selected category</p>
                    </div>
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">
                      {day.slots.length} Slots
                    </span>
                  </div>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    {day.slots.map((slot, slotIndex) => (
                      <div
                        key={`${day.day}-${slotIndex}`}
                        className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700"
                      >
                        <span className="font-semibold">Slot {slotIndex + 1}</span>
                        <div className="flex items-center gap-2">
                          <input
                            type="time"
                            value={slot.start}
                            onChange={(event) =>
                              updateSlot(dayIndex, slotIndex, "start", event.target.value)
                            }
                            className="rounded-lg border border-slate-200 px-2 py-1 text-xs"
                          />
                          <span className="text-xs text-slate-400">to</span>
                          <input
                            type="time"
                            value={slot.end}
                            onChange={(event) =>
                              updateSlot(dayIndex, slotIndex, "end", event.target.value)
                            }
                            className="rounded-lg border border-slate-200 px-2 py-1 text-xs"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </AdminCard>
    </div>
  );
}
