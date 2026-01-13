"use client";

import { useEffect, useState } from "react";
import { FiPlus } from "react-icons/fi";

import AdminBadge from "./AdminBadge";
import AdminCard from "./AdminCard";
import AdminFormField from "./AdminFormField";
import AdminPageTitle from "./AdminPageTitle";
import AdminShell from "./AdminShell";

import type { SurchargeRule } from "@/lib/admin/catalog";  // ✅ Use backend type

interface SurchargeClientProps {
  initialRules: SurchargeRule[];
}

export default function SurchargeClient({ initialRules }: SurchargeClientProps) {
  // Convert backend rules → UI rules
  const [rules, setRules] = useState(
    initialRules.map(r => ({
      id: r.id,
      reason: r.reason,
      price: String(r.price),    // convert to string for input
      location: r.location ?? "", // normalize
    }))
  );

  const [locations, setLocations] = useState<{ id: string; name: string }[]>([]);

  const [draft, setDraft] = useState({
    id: crypto.randomUUID(),
    reason: "",
    price: "",
    location: "",
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<typeof draft | null>(null);

  // Load radius zones
  const loadLocations = async () => {
    try {
      const res = await fetch("/api/admin/radius");
      const json = await res.json();
      const data = Array.isArray(json?.data) ? json.data : [];

      setLocations(
        data.map((z: any) => ({
          id: z.id,
          name: z.name,
        }))
      );
    } catch (err) {
      console.error("Failed to load locations", err);
    }
  };

  useEffect(() => {
    void loadLocations();
  }, []);

  // Save surcharge rule
  const saveRule = async (rule: typeof draft) => {
    const payload = {
      id: rule.id,
      reason: rule.reason,
      price: Number(rule.price),
      location: rule.location || null,
      active: true,
    };

    await fetch("/api/admin/surcharge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  };

  // Delete surcharge rule
  const removeRule = async (id: string) => {
    await fetch(`/api/admin/surcharge/${id}`, {
      method: "DELETE",
    });

    setRules(prev => prev.filter(r => r.id !== id));
  };

  const updateRule = async (rule: typeof draft) => {
    const payload = {
      reason: rule.reason,
      price: Number(rule.price),
      location: rule.location || null,
    };

    await fetch(`/api/admin/surcharge/${rule.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setRules((prev) => prev.map((r) => (r.id === rule.id ? rule : r)));
    setEditingId(null);
    setEditDraft(null);
  };

  return (
    <AdminShell>
      <AdminPageTitle
        title="Surcharge"
        description="Configure additional charges for weather or conditions."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Add Surcharge */}
        <AdminCard title="Add surcharge condition" description="Reason and additional price">
          <div className="space-y-4">

            <AdminFormField
              label="Reason"
              placeholder="Rain"
              value={draft.reason}
              onChange={(e) => setDraft(prev => ({ ...prev, reason: e.target.value }))}
            />

            <AdminFormField
              label="Additional price"
              type="number"
              placeholder="1.50"
              value={draft.price}
              onChange={(e) => setDraft(prev => ({ ...prev, price: e.target.value }))}
            />

            {/* Location Dropdown */}
            <div>
              <label className="text-sm font-semibold text-slate-800">
                Location (optional)
              </label>
              <select
                className="mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm"
                value={draft.location}
                onChange={(e) => setDraft(prev => ({ ...prev, location: e.target.value }))}
              >
                <option value="">Select location</option>
                {locations.map(loc => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm text-white"
              onClick={async () => {
                await saveRule(draft);
                setRules(prev => [...prev, draft]);
                setDraft({ id: crypto.randomUUID(), reason: "", price: "", location: "" });
              }}
            >
              <FiPlus /> Add surcharge
            </button>
          </div>
        </AdminCard>

        {/* Existing Surcharges */}
        <AdminCard title="Existing surcharges" description="Stored surcharge rules">
          <div className="space-y-3">
            {rules.map(rule => (
              <div
                key={rule.id}
                className="flex items-center justify-between rounded-xl border bg-white px-4 py-3 shadow-sm"
              >
                {editingId === rule.id && editDraft ? (
                  <div className="flex w-full flex-col gap-3">
                    <div className="grid gap-3 md:grid-cols-3">
                      <AdminFormField
                        label="Reason"
                        value={editDraft.reason}
                        onChange={(e) => setEditDraft((prev) => (prev ? { ...prev, reason: e.target.value } : prev))}
                      />
                      <AdminFormField
                        label="Additional price"
                        type="number"
                        value={editDraft.price}
                        onChange={(e) => setEditDraft((prev) => (prev ? { ...prev, price: e.target.value } : prev))}
                      />
                      <div>
                        <label className="text-sm font-semibold text-slate-800">Location</label>
                        <select
                          className="mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm"
                          value={editDraft.location}
                          onChange={(e) =>
                            setEditDraft((prev) => (prev ? { ...prev, location: e.target.value } : prev))
                          }
                        >
                          <option value="">Select location</option>
                          {locations.map((loc) => (
                            <option key={loc.id} value={loc.id}>
                              {loc.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="flex flex-wrap justify-end gap-2 text-xs font-semibold">
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
                      <p className="text-sm font-semibold text-slate-900">{rule.reason}</p>
                      <p className="text-xs text-slate-500">+£{rule.price}</p>

                      {rule.location && (
                        <p className="text-xs text-slate-500">
                          Location: {locations.find(l => l.id === rule.location)?.name ?? "Unknown"}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <AdminBadge label="Surcharge" tone="danger" />
                      <button
                        className="rounded bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-800"
                        onClick={() => {
                          setEditingId(rule.id);
                          setEditDraft(rule);
                        }}
                      >
                        Edit
                      </button>
                      <button
                        className="rounded bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700"
                        onClick={() => removeRule(rule.id)}
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
