"use client";

import { useEffect, useMemo, useState } from "react";
import AdminBadge from "./AdminBadge";
import AdminCard from "./AdminCard";
import AdminPageTitle from "./AdminPageTitle";
import AdminShell from "./AdminShell";
import AdminTable from "./AdminTable";

import type { AdminItem, SchedulerSelection } from "@/lib/admin/catalog";

/* -------------------------------------------------------
   TYPES
------------------------------------------------------- */

type Day =
  | "Monday"
  | "Tuesday"
  | "Wednesday"
  | "Thursday"
  | "Friday"
  | "Saturday"
  | "Sunday";

const DAYS: Day[] = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

type TimeRange = { start: string; end: string };
type TimeslotMap = Record<Day, TimeRange[]>;

interface ItemSchedule {
  id?: string;
  itemId: string;
  timeslots: TimeslotMap;
}

interface Props {
  initialItems: AdminItem[];
  initialSelection: SchedulerSelection;
}

/* -------------------------------------------------------
   DEFAULT SLOTS
------------------------------------------------------- */

const DEFAULT_SLOTS: TimeRange[] = [
  { start: "08:00", end: "12:00" },
  { start: "16:00", end: "22:00" },
];

function buildDefaultTimeslots(): TimeslotMap {
  return DAYS.reduce((acc, day) => {
    acc[day] = DEFAULT_SLOTS.map((slot) => ({ ...slot }));
    return acc;
  }, {} as TimeslotMap);
}

/* -------------------------------------------------------
   COMPONENT
------------------------------------------------------- */

export default function ItemSchedulerClient({
  initialItems,
  initialSelection,
}: Props) {
  const [items, setItems] = useState<AdminItem[]>(initialItems);
  const [selectedItems, setSelectedItems] = useState<string[]>(
    initialSelection.ids ?? []
  );

  const [activeItemId, setActiveItemId] = useState<string | null>(
    initialSelection.ids[0] || initialItems[0]?.id || null
  );

  const [schedules, setSchedules] = useState<Record<string, ItemSchedule>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved" | "error">(
    "idle"
  );

  /* -------------------------------------------------------
     LOAD SCHEDULES FROM API
  ------------------------------------------------------- */
  const loadSchedules = async () => {
    try {
      const res = await fetch("/api/admin/item-scheduler");
      const json = await res.json();
      const data: ItemSchedule[] = json.data ?? [];

      const map: Record<string, ItemSchedule> = {};
      for (const sched of data) {
        if (sched.itemId) map[sched.itemId] = sched;
      }
      setSchedules(map);

    } catch (err) {
      console.error("Failed to load schedules", err);
    }
  };

  useEffect(() => {
    void loadSchedules();
  }, []);

  const deleteSchedule = async (itemId: string) => {
    const schedule = schedules[itemId];
    if (!schedule?.id) {
      setSchedules((prev) => {
        if (!prev[itemId]) return prev;
        const { [itemId]: _removed, ...rest } = prev;
        return rest;
      });
      return;
    }

    try {
      await fetch("/api/admin/item-scheduler", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: schedule.id }),
      });
    } catch (err) {
      console.error("Failed to delete schedule", err);
    }

    setSchedules((prev) => {
      const { [itemId]: _removed, ...rest } = prev;
      return rest;
    });
  };

  /* -------------------------------------------------------
     ACTIVE SCHEDULE (computed)
  ------------------------------------------------------- */
  const activeSchedule = useMemo(() => {
    if (!activeItemId) return null;

    return (
      schedules[activeItemId] ?? {
        itemId: activeItemId,
        timeslots: buildDefaultTimeslots(),
      }
    );
  }, [activeItemId, schedules]);

  /* -------------------------------------------------------
     MODIFY SLOT
  ------------------------------------------------------- */
  const handleSlotChange = (
    day: Day,
    slotIndex: number,
    field: "start" | "end",
    value: string
  ) => {
    if (!activeItemId) return;

    setSchedules((prev) => {
      const current =
        prev[activeItemId] ??
        ({
          itemId: activeItemId,
          timeslots: buildDefaultTimeslots(),
        } as ItemSchedule);

      const daySlots = [...current.timeslots[day]];
      daySlots[slotIndex] = { ...daySlots[slotIndex], [field]: value };

      return {
        ...prev,
        [activeItemId]: {
          ...current,
          timeslots: {
            ...current.timeslots,
            [day]: daySlots,
          },
        },
      };
    });
  };

  /* -------------------------------------------------------
     COPY MONDAY TO ALL DAYS
  ------------------------------------------------------- */
  const applyToAll = () => {
    if (!activeSchedule || !activeItemId) return;
    const monday = activeSchedule.timeslots.Monday;

    setSchedules((prev) => ({
      ...prev,
      [activeItemId]: {
        ...activeSchedule,
        timeslots: DAYS.reduce((acc, day) => {
          acc[day] =
            day === "Monday"
              ? monday
              : monday.map((slot) => ({ ...slot }));
          return acc;
        }, {} as TimeslotMap),
      },
    }));
  };

  /* -------------------------------------------------------
     SAVE SCHEDULE
  ------------------------------------------------------- */
  const handleSave = async () => {
    try {
      setIsSaving(true);
      setSaveStatus("idle");
      await fetch("/api/admin/settings/item-schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedItems }),
      });

      if (!activeItemId || !activeSchedule) {
        setSaveStatus("saved");
        return;
      }

      const res = await fetch("/api/admin/item-scheduler", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(activeSchedule),
      });

      const json = await res.json();
      const saved = json.data ?? activeSchedule;

      setSchedules((prev) => ({
        ...prev,
        [activeItemId]: saved,
      }));
      setSaveStatus("saved");
    } catch (err) {
      console.error("Failed to save", err);
      setSaveStatus("error");
    } finally {
      setIsSaving(false);
    }
  };

  /* -------------------------------------------------------
     TABLE COLUMNS
  ------------------------------------------------------- */

  const columns = [
    { key: "name", label: "Item" },
    { key: "category", label: "Category" },
    { key: "active", label: "Status" },
    { key: "actions", label: "Select" },
  ];

  /* -------------------------------------------------------
     RENDER
  ------------------------------------------------------- */

  return (
    <AdminShell>
      <AdminPageTitle
        title="Item Scheduler"
        description="Control weekly availability for menu items."
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

      {/* ITEMS TABLE */}
      <AdminCard title="Choose items" description="Select an item to edit its schedule.">
        <AdminTable
          columns={columns}
          data={items}
          renderCell={(item, key) => {
            if (key === "active")
              return item.active ? (
                <AdminBadge label="Active" tone="success" />
              ) : (
                <AdminBadge label="Inactive" tone="warning" />
              );

            if (key === "actions") {
              const checked = selectedItems.includes(item.id);
              const isActive = activeItemId === item.id;

              return (
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => {
                      const isChecked = e.target.checked;
                      const nextSelected = isChecked
                        ? [...selectedItems, item.id]
                        : selectedItems.filter((x) => x !== item.id);

                      setSelectedItems(nextSelected);

                      if (isChecked) {
                        setActiveItemId(item.id);
                        return;
                      }

                      if (activeItemId === item.id) {
                        setActiveItemId(nextSelected[0] ?? null);
                      }

                      void deleteSchedule(item.id);
                    }}
                  />

                  <button
                    className={`rounded-lg px-2 py-1 text-xs font-semibold ${
                      isActive
                        ? "bg-blue-600 text-white"
                        : "bg-slate-100 text-slate-700"
                    }`}
                    onClick={() => setActiveItemId(item.id)}
                  >
                    {isActive ? "Active" : "Set active"}
                  </button>
                </div>
              );
            }

            return (item as any)[key] ?? "";
          }}
        />
      </AdminCard>

      {/* WEEKLY SCHEDULE */}
      {activeSchedule && (
        <AdminCard
          title="Weekly Schedule"
          description="Edit the two time slots per day."
        >
          <div className="mb-3 flex justify-end">
            <button
              className="rounded-lg bg-white border px-3 py-1 text-xs"
              onClick={applyToAll}
            >
              Copy Monday → All
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border bg-white">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-100">
                <tr>
                  <th className="px-4 py-2">Day</th>
                  <th className="px-4 py-2">Slot 1</th>
                  <th className="px-4 py-2">Slot 2</th>
                </tr>
              </thead>
              <tbody>
                {DAYS.map((day) => {
                  const slots = activeSchedule.timeslots[day];

                  return (
                    <tr key={day} className="border-t">
                      <td className="px-4 py-3 font-medium">{day}</td>

                      {[0, 1].map((i) => (
                        <td key={i} className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <input
                              type="time"
                              value={slots[i].start}
                              onChange={(e) =>
                                handleSlotChange(day, i, "start", e.target.value)
                              }
                            />
                            <span>–</span>
                            <input
                              type="time"
                              value={slots[i].end}
                              onChange={(e) =>
                                handleSlotChange(day, i, "end", e.target.value)
                              }
                            />
                          </div>
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </AdminCard>
      )}
    </AdminShell>
  );
}
