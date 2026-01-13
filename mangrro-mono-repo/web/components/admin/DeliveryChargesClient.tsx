"use client";

import { useState, useEffect } from "react";
import AdminShell from "./AdminShell";
import AdminCard from "./AdminCard";
import AdminPageTitle from "./AdminPageTitle";
import AdminFormField from "./AdminFormField";
import { FiPlus } from "react-icons/fi";

interface Rule {
  id: string;
  milesStart: string;
  milesEnd: string;
  price: string;
  timeStart: string;
  timeEnd: string;
  location: string;
}

// 🔥🔥 FIX: Explicit Props definition
interface DeliveryChargesClientProps {
  initialRules: Rule[];
}

// 🔥🔥 FIX: Component now accepts props
export default function DeliveryChargesClient({ initialRules }: DeliveryChargesClientProps) {
  const [rules, setRules] = useState<Rule[]>(initialRules);
  const [locations, setLocations] = useState<{ id: string; name: string }[]>([]);

  const [draft, setDraft] = useState<Rule>({
    id: crypto.randomUUID(),
    milesStart: "",
    milesEnd: "",
    price: "",
    timeStart: "",
    timeEnd: "",
    location: "",
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Rule | null>(null);

  useEffect(() => {
    loadLocations();
  }, []);

  const loadLocations = async () => {
    const res = await fetch("/api/admin/radius");
    const json = await res.json();

    setLocations(
      (json?.data ?? []).map((z: any) => ({ id: z.id, name: z.name }))
    );
  };

  const saveRule = async (rule: Rule) => {
    await fetch("/api/admin/delivery-charges", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(rule),
    });
  };

  const removeRule = async (id: string) => {
    await fetch(`/api/admin/delivery-charges/${id}`, {
      method: "DELETE",
    });

    setRules((prev) => prev.filter((r) => r.id !== id));
  };

  const updateRule = async (rule: Rule) => {
    await fetch(`/api/admin/delivery-charges/${rule.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(rule),
    });

    setRules((prev) => prev.map((r) => (r.id === rule.id ? rule : r)));
    setEditingId(null);
    setEditDraft(null);
  };

  return (
    <AdminShell>
      <AdminPageTitle title="Delivery Charges" description="Edit delivery rules" />

      <div className="grid gap-6 lg:grid-cols-2">

        {/* ADD RULE CARD */}
        <AdminCard title="Add rule">
          <div className="space-y-4">

            <AdminFormField
              label="Miles Start"
              type="number"
              value={draft.milesStart}
              onChange={(e) =>
                setDraft({ ...draft, milesStart: e.target.value })
              }
            />

            <AdminFormField
              label="Miles End"
              type="number"
              value={draft.milesEnd}
              onChange={(e) =>
                setDraft({ ...draft, milesEnd: e.target.value })
              }
            />

            <AdminFormField
              label="Price"
              type="number"
              value={draft.price}
              onChange={(e) =>
                setDraft({ ...draft, price: e.target.value })
              }
            />

            <AdminFormField
              label="Time Start"
              type="time"
              value={draft.timeStart}
              onChange={(e) =>
                setDraft({ ...draft, timeStart: e.target.value })
              }
            />

            <AdminFormField
              label="Time End"
              type="time"
              value={draft.timeEnd}
              onChange={(e) =>
                setDraft({ ...draft, timeEnd: e.target.value })
              }
            />

            <div>
              <label className="text-sm font-semibold">Location</label>
              <select
                value={draft.location}
                onChange={(e) =>
                  setDraft({ ...draft, location: e.target.value })
                }
                className="mt-1 w-full border rounded-xl p-2"
              >
                <option value="">Any</option>
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              className="bg-blue-600 text-white px-4 py-2 rounded-xl inline-flex items-center gap-2"
              onClick={async () => {
                await saveRule(draft);
                setRules((p) => [...p, draft]);

                setDraft({
                  id: crypto.randomUUID(),
                  milesStart: "",
                  milesEnd: "",
                  price: "",
                  timeStart: "",
                  timeEnd: "",
                  location: "",
                });
              }}
            >
              <FiPlus /> Add rule
            </button>
          </div>
        </AdminCard>

        {/* SAVED RULES */}
        <AdminCard title="Saved rules">
          <div className="space-y-3">
            {rules.map((r) => (
              <div
                key={r.id}
                className="flex justify-between items-center border p-3 rounded-xl"
              >
                {editingId === r.id && editDraft ? (
                  <div className="flex w-full flex-col gap-3">
                    <div className="grid gap-3 md:grid-cols-3">
                      <AdminFormField
                        label="Miles Start"
                        type="number"
                        value={editDraft.milesStart}
                        onChange={(e) => setEditDraft((prev) => (prev ? { ...prev, milesStart: e.target.value } : prev))}
                      />
                      <AdminFormField
                        label="Miles End"
                        type="number"
                        value={editDraft.milesEnd}
                        onChange={(e) => setEditDraft((prev) => (prev ? { ...prev, milesEnd: e.target.value } : prev))}
                      />
                      <AdminFormField
                        label="Price"
                        type="number"
                        value={editDraft.price}
                        onChange={(e) => setEditDraft((prev) => (prev ? { ...prev, price: e.target.value } : prev))}
                      />
                    </div>

                    <div className="grid gap-3 md:grid-cols-3">
                      <AdminFormField
                        label="Time Start"
                        type="time"
                        value={editDraft.timeStart}
                        onChange={(e) => setEditDraft((prev) => (prev ? { ...prev, timeStart: e.target.value } : prev))}
                      />
                      <AdminFormField
                        label="Time End"
                        type="time"
                        value={editDraft.timeEnd}
                        onChange={(e) => setEditDraft((prev) => (prev ? { ...prev, timeEnd: e.target.value } : prev))}
                      />
                      <div>
                        <label className="text-sm font-semibold">Location</label>
                        <select
                          value={editDraft.location}
                          onChange={(e) =>
                            setEditDraft((prev) => (prev ? { ...prev, location: e.target.value } : prev))
                          }
                          className="mt-1 w-full border rounded-xl p-2"
                        >
                          <option value="">Any</option>
                          {locations.map((l) => (
                            <option key={l.id} value={l.id}>
                              {l.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 text-xs font-semibold">
                      <button
                        className="rounded-lg bg-slate-100 px-3 py-1 text-slate-800"
                        onClick={() => {
                          setEditingId(null);
                          setEditDraft(null);
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        className="rounded-lg bg-blue-600 px-3 py-1 text-white"
                        onClick={() => editDraft && updateRule(editDraft)}
                      >
                        Save changes
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div>
                      <p className="font-semibold">
                        {r.milesStart}–{r.milesEnd} miles
                      </p>
                      <p className="text-sm text-gray-500">£{r.price}</p>
                      {r.location && (
                        <p className="text-xs text-gray-500">
                          Location: {locations.find((l) => l.id === r.location)?.name ?? "Unknown"}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setEditingId(r.id);
                          setEditDraft(r);
                        }}
                        className="text-xs font-semibold text-slate-800"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => removeRule(r.id)}
                        className="text-red-600 text-xs font-semibold"
                      >
                        Remove
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </AdminCard>

      </div>
    </AdminShell>
  );
}
