"use client";

import type React from "react";
import { useEffect, useState } from "react";

import AdminBadge from "./AdminBadge";
import AdminCard from "./AdminCard";
import AdminPageTitle from "./AdminPageTitle";
import AdminShell from "./AdminShell";
import AdminTable from "./AdminTable";
import type { AdminCategory, SchedulerSelection } from "@/lib/admin/catalog";

interface Props {
  initialCategories: AdminCategory[];
  initialSelection: SchedulerSelection;
}

const days = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

type DayKey = (typeof days)[number];

type DaySlots = {
  slot1Start: string;
  slot1End: string;
  slot2Start: string;
  slot2End: string;
};

type TimeslotMap = Record<DayKey, DaySlots>;

interface MainCategorySchedule {
  id?: string;
  scheduleId?: string;
  mainCategoryId: string;
  timeslots: TimeslotMap;
}

function createDefaultTimeslots(): TimeslotMap {
  const obj: Partial<TimeslotMap> = {};
  for (const day of days) {
    obj[day] = {
      slot1Start: "08:00",
      slot1End: "12:00",
      slot2Start: "16:00",
      slot2End: "22:00",
    };
  }
  return obj as TimeslotMap;
}

export default function MainCategorySchedulerClient({
  initialCategories,
  initialSelection,
}: Props) {
  const [categories, setCategories] = useState<AdminCategory[]>(
    initialCategories
  );

  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    initialSelection.ids
  );

  const [schedules, setSchedules] = useState<
    Record<string, MainCategorySchedule>
  >({});

  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(
    initialSelection.ids[0] ?? null
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved" | "error">(
    "idle"
  );

  const loadCategories = async () => {
    const res = await fetch("/api/admin/main-categories");
    const json = await res.json();
    const data = json.data ?? json ?? [];
    setCategories(Array.isArray(data) ? data : []);
  };

  const loadSchedules = async () => {
    try {
      const res = await fetch("/api/admin/main-category-scheduler");
      const json = await res.json();
      const arr: any[] = json.data ?? json ?? [];

      const mapped: Record<string, MainCategorySchedule> = {};
      for (const raw of arr) {
        if (!raw.mainCategoryId) continue;

        mapped[raw.mainCategoryId] = {
          id: raw.id,
          scheduleId: raw.scheduleId,
          mainCategoryId: raw.mainCategoryId,
          timeslots: raw.timeslots ?? createDefaultTimeslots(),
        };
      }

      setSchedules(mapped);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    void (async () => {
      await Promise.all([loadCategories(), loadSchedules()]);
    })();
  }, []);

  const deleteSchedule = async (categoryId: string) => {
    const schedule = schedules[categoryId];
    if (!schedule?.id) {
      setSchedules((prev) => {
        if (!prev[categoryId]) return prev;
        const { [categoryId]: _removed, ...rest } = prev;
        return rest;
      });
      return;
    }

    try {
      await fetch("/api/admin/main-category-scheduler", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: schedule.id }),
      });
    } catch {
      // ignore
    }

    setSchedules((prev) => {
      const { [categoryId]: _removed, ...rest } = prev;
      return rest;
    });
  };

  const getActiveSchedule = () => {
    if (!activeCategoryId) return null;

    return (
      schedules[activeCategoryId] ?? {
        id: undefined,
        mainCategoryId: activeCategoryId,
        timeslots: createDefaultTimeslots(),
      }
    );
  };

  const activeSchedule = getActiveSchedule();
  const activeCategory = categories.find((c) => c.id === activeCategoryId);

  const handleSlotChange = (
    day: DayKey,
    slot: 1 | 2,
    field: "start" | "end",
    value: string
  ) => {
    if (!activeCategoryId) return;

    setSchedules((prev) => {
      const existing =
        prev[activeCategoryId] ?? {
          mainCategoryId: activeCategoryId,
          timeslots: createDefaultTimeslots(),
        };

      const daySlots = existing.timeslots[day];

      const keyName =
        slot === 1
          ? field === "start"
            ? "slot1Start"
            : "slot1End"
          : field === "start"
          ? "slot2Start"
          : "slot2End";

      return {
        ...prev,
        [activeCategoryId]: {
          ...existing,
          timeslots: {
            ...existing.timeslots,
            [day]: { ...daySlots, [keyName]: value },
          },
        },
      };
    });
  };

  const applyToAll = () => {
    if (!activeCategoryId) return;

    setSchedules((prev) => {
      const current = getActiveSchedule();
      if (!current) return prev;

      const monday = current.timeslots["Monday"];

      const newTimeslots: TimeslotMap = {} as TimeslotMap;
      for (const d of days) {
        newTimeslots[d] = { ...monday };
      }

      return {
        ...prev,
        [activeCategoryId]: {
          ...current,
          timeslots: newTimeslots,
        },
      };
    });
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setSaveStatus("idle");

      await fetch("/api/admin/settings/main-category-schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedCategories }),
      });

      if (!activeCategoryId) {
        setSaveStatus("saved");
        return;
      }

      const current = getActiveSchedule();
      if (!current) {
        setSaveStatus("saved");
        return;
      }

      const id = current.id ?? crypto.randomUUID();

      await fetch("/api/admin/main-category-scheduler", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          mainCategoryId: activeCategoryId,
          timeslots: current.timeslots,
        }),
      });

      setSchedules((prev) => ({
        ...prev,
        [activeCategoryId]: { ...current, id },
      }));
      setSaveStatus("saved");
    } catch {
      setSaveStatus("error");
    } finally {
      setIsSaving(false);
    }
  };

  const columns = [
    { key: "name", label: "Main Category" },
    { key: "active", label: "Status" },
    { key: "actions", label: "Select" },
  ];

  return (
    <AdminShell>
      <AdminPageTitle
        title="Main Category Scheduler"
        description="Choose main categories and apply weekly opening windows."
        action={
          <div className="flex items-center gap-3">
            {saveStatus === "saved" && (
              <span className="text-sm font-semibold text-emerald-600">
                Saved
              </span>
            )}
            {saveStatus === "error" && (
              <span className="text-sm font-semibold text-rose-600">
                Save failed
              </span>
            )}
            <button
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-md disabled:cursor-not-allowed disabled:opacity-60"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "Save schedule"}
            </button>
          </div>
        }
      />

      <AdminCard
        title="Choose main categories"
        description="Pick which main categories to schedule"
      >
        <AdminTable
          columns={columns}
          data={categories}
          renderCell={(category, key) => {
            if (key === "active")
              return category.active ? (
                <AdminBadge label="Active" tone="success" />
              ) : (
                <AdminBadge label="Inactive" tone="warning" />
              );

            if (key === "actions")
              return (
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300 text-blue-600"
                  checked={selectedCategories.includes(category.id)}
                  onChange={(e) => {
                    const checked = e.target.checked;

                    const nextSelected = checked
                      ? [...selectedCategories, category.id]
                      : selectedCategories.filter((id) => id !== category.id);

                    setSelectedCategories(nextSelected);

                    if (checked) {
                      setActiveCategoryId(category.id);
                      return;
                    }

                    if (activeCategoryId === category.id) {
                      setActiveCategoryId(nextSelected[0] ?? null);
                    }

                    void deleteSchedule(category.id);
                  }}
                />
              );

            return (category[key as keyof AdminCategory] ?? "") as React.ReactNode;
          }}
        />
      </AdminCard>
      {activeCategoryId && (
        <div className="mb-4">
          <button
            onClick={applyToAll}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white font-semibold shadow-sm hover:bg-blue-700"
          >
            Apply Monday to all days
          </button>
        </div>
      )}

      <AdminCard
        title="Weekly schedule"
        description={
          activeCategory
            ? `Two time slots per day for ${activeCategory.name}`
            : "Select a main category above to edit schedule"
        }
      >
        {!activeCategoryId ? (
          <p className="text-sm text-slate-500">
            No main category selected. Choose one above.
          </p>
        ) : (
          <div className="space-y-4">
            {days.map((day) => {
              const ds = activeSchedule!.timeslots[day];

              return (
                <div
                  key={day}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {day}
                      </p>
                      <p className="text-xs text-slate-500">
                        Applies to the selected main category
                      </p>
                    </div>
                    <AdminBadge label="2 slots" tone="info" />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="flex items-center justify-between rounded-xl bg-white px-3 py-2 shadow-sm">
                      <span className="text-sm font-semibold text-slate-800">
                        Slot 1
                      </span>
                      <div className="flex items-center gap-2">
                        <input
                          type="time"
                          value={ds.slot1Start}
                          onChange={(e) =>
                            handleSlotChange(day, 1, "start", e.target.value)
                          }
                          className="rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-900"
                        />
                        <span className="text-xs text-slate-500">to</span>
                        <input
                          type="time"
                          value={ds.slot1End}
                          onChange={(e) =>
                            handleSlotChange(day, 1, "end", e.target.value)
                          }
                          className="rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-900"
                        />
                      </div>
                    </label>

                    <label className="flex items-center justify-between rounded-xl bg-white px-3 py-2 shadow-sm">
                      <span className="text-sm font-semibold text-slate-800">
                        Slot 2
                      </span>
                      <div className="flex items-center gap-2">
                        <input
                          type="time"
                          value={ds.slot2Start}
                          onChange={(e) =>
                            handleSlotChange(day, 2, "start", e.target.value)
                          }
                          className="rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-900"
                        />
                        <span className="text-xs text-slate-500">to</span>
                        <input
                          type="time"
                          value={ds.slot2End}
                          onChange={(e) =>
                            handleSlotChange(day, 2, "end", e.target.value)
                          }
                          className="rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-900"
                        />
                      </div>
                    </label>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </AdminCard>
    </AdminShell>
  );
}
