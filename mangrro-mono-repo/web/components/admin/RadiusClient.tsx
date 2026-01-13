"use client";

import { useEffect, useState } from "react";
import { FiPlus } from "react-icons/fi";

import AdminBadge from "./AdminBadge";
import AdminCard from "./AdminCard";
import AdminFormField from "./AdminFormField";
import AdminPageTitle from "./AdminPageTitle";
import AdminShell from "./AdminShell";

interface Zone {
  id: string;
  name: string;
  centerLatitude: string;
  centerLongitude: string;
  radiusMiles: string;
  active: boolean;
}

interface RadiusClientProps {
  initialZones: Zone[];
}

export default function RadiusClient({ initialZones }: RadiusClientProps) {
  const [zones, setZones] = useState<Zone[]>(initialZones);

  const [draft, setDraft] = useState<Zone>(() => ({
    id: crypto.randomUUID(),
    name: "",
    centerLatitude: "",
    centerLongitude: "",
    radiusMiles: "",
    active: true,
  }));

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Zone | null>(null);

  // Reload zones from API
  const loadZones = async () => {
    try {
      const res = await fetch("/api/admin/radius");
      const json = await res.json();

      const data = Array.isArray(json?.data) ? json.data : [];

      setZones(
        data.map((z: any) => ({
          id: z.id,
          name: z.name,
          centerLatitude: String(z.centerLatitude),
          centerLongitude: String(z.centerLongitude),
          radiusMiles: String(z.radiusMiles),
          active: Boolean(z.active),
        }))
      );
    } catch (err) {
      console.error("Failed to load radius zones", err);
    }
  };

  // Save new zone
  const saveZone = async (zone: Zone) => {
    const payload = {
      id: zone.id,
      name: zone.name,
      centerLatitude: Number(zone.centerLatitude),
      centerLongitude: Number(zone.centerLongitude),
      radiusMiles: Number(zone.radiusMiles),
      active: true,
    };

    await fetch("/api/admin/radius", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  };

  // Delete zone
  const removeZone = async (id: string) => {
    await fetch(`/api/admin/radius/${id}`, {
      method: "DELETE",
    });

    setZones((prev) => prev.filter((z) => z.id !== id));
  };

  const updateZone = async (zone: Zone) => {
    const payload = {
      name: zone.name,
      centerLatitude: Number(zone.centerLatitude),
      centerLongitude: Number(zone.centerLongitude),
      radiusMiles: Number(zone.radiusMiles),
    };

    await fetch(`/api/admin/radius/${zone.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setZones((prev) => prev.map((z) => (z.id === zone.id ? zone : z)));
    setEditingId(null);
    setEditDraft(null);
  };

  return (
    <AdminShell>
      <AdminPageTitle
        title="Radius"
        description="Define named delivery zones with center points."
        action={
          <button
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-md"
            onClick={loadZones}
          >
            Reload
          </button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ADD ZONE CARD */}
        <AdminCard title="Create zone" description="Name, center point & radius miles">
          <div className="space-y-4">

            <AdminFormField
              label="Name"
              placeholder="Luton Interchange Zone"
              value={draft.name}
              onChange={(e) => setDraft((prev) => ({ ...prev, name: e.target.value }))}
            />

            <AdminFormField
              label="Center latitude"
              placeholder="51.8787"
              value={draft.centerLatitude}
              onChange={(e) =>
                setDraft((prev) => ({ ...prev, centerLatitude: e.target.value }))
              }
            />

            <AdminFormField
              label="Center longitude"
              placeholder="-0.4200"
              value={draft.centerLongitude}
              onChange={(e) =>
                setDraft((prev) => ({ ...prev, centerLongitude: e.target.value }))
              }
            />

            <AdminFormField
              label="Radius (miles)"
              placeholder="5"
              value={draft.radiusMiles}
              onChange={(e) =>
                setDraft((prev) => ({ ...prev, radiusMiles: e.target.value }))
              }
            />

            <button
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-md"
              onClick={async () => {
                const zone = { ...draft };
                await saveZone(zone);

                setZones((prev) => [...prev, zone]);

                setDraft({
                  id: crypto.randomUUID(),
                  name: "",
                  centerLatitude: "",
                  centerLongitude: "",
                  radiusMiles: "",
                  active: true,
                });
              }}
            >
              <FiPlus /> Add zone
            </button>
          </div>
        </AdminCard>

        {/* ZONES LIST */}
        <AdminCard title="Saved delivery zones" description="Stored delivery zones">
          <div className="space-y-3">
            {zones.map((zone) => (
              <div
                key={zone.id}
                className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm"
              >
                {editingId === zone.id && editDraft ? (
                  <div className="flex w-full flex-col gap-3">
                    <div className="grid gap-3 md:grid-cols-3">
                      <AdminFormField
                        label="Name"
                        value={editDraft.name}
                        onChange={(e) => setEditDraft((prev) => (prev ? { ...prev, name: e.target.value } : prev))}
                      />
                      <AdminFormField
                        label="Center latitude"
                        value={editDraft.centerLatitude}
                        onChange={(e) =>
                          setEditDraft((prev) => (prev ? { ...prev, centerLatitude: e.target.value } : prev))
                        }
                      />
                      <AdminFormField
                        label="Center longitude"
                        value={editDraft.centerLongitude}
                        onChange={(e) =>
                          setEditDraft((prev) => (prev ? { ...prev, centerLongitude: e.target.value } : prev))
                        }
                      />
                    </div>

                    <div className="grid gap-3 md:grid-cols-3">
                      <AdminFormField
                        label="Radius (miles)"
                        value={editDraft.radiusMiles}
                        onChange={(e) =>
                          setEditDraft((prev) => (prev ? { ...prev, radiusMiles: e.target.value } : prev))
                        }
                      />
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
                        onClick={() => editDraft && updateZone(editDraft)}
                      >
                        Save changes
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{zone.name}</p>
                      <p className="text-xs text-slate-500">
                        Lat {zone.centerLatitude}, Lng {zone.centerLongitude}
                      </p>
                      <p className="text-xs text-slate-500">
                        Radius: {zone.radiusMiles} miles
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <AdminBadge label={zone.active ? "Active" : "Inactive"} tone="info" />

                      <button
                        className="rounded-lg bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-800"
                        onClick={() => {
                          setEditingId(zone.id);
                          setEditDraft(zone);
                        }}
                      >
                        Edit
                      </button>
                      <button
                        className="rounded-lg bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                        onClick={() => removeZone(zone.id)}
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
