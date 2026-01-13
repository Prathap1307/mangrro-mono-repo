"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { useSafeUser } from "@/lib/auth/useSafeUser";

export default function CompleteProfilePage() {
  const { user } = useSafeUser();
  const router = useRouter();

  const [name, setName] = useState(user?.fullName || "");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setError("");
    setSaving(true);

    if (!name.trim() || !phone.trim()) {
      setError("Please fill in all required fields.");
      setSaving(false);
      return;
    }

    try {
      // 1️⃣ Save to DynamoDB
      const res = await fetch("/api/customer/phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          email: user?.primaryEmailAddress?.emailAddress,
        }),
      });

      if (!res.ok) throw new Error("Failed to save record");

      // 2️⃣ Mark profile as complete in Clerk Metadata
      await user?.update({
        unsafeMetadata: { profileCompleted: true },
      });

      router.push("/");
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
    }

    setSaving(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
      <div className="w-full max-w-lg bg-white p-8 rounded-3xl shadow-xl">
        <h2 className="text-2xl font-bold text-center mb-4">Complete Your Profile</h2>
        <p className="text-sm text-gray-600 text-center mb-6">
          We need a few details before you can continue.
        </p>

        <label className="block text-sm font-medium">Email</label>
        <input
          disabled
          value={user?.primaryEmailAddress?.emailAddress || ""}
          className="w-full mt-1 mb-4 p-3 rounded-xl border bg-gray-100"
        />

        <label className="block text-sm font-medium">Full Name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full mt-1 mb-4 p-3 rounded-xl border"
        />

        <label className="block text-sm font-medium">Phone Number</label>
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full mt-1 mb-4 p-3 rounded-xl border"
        />

        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full rounded-full bg-purple-600 text-white py-3 font-semibold"
        >
          {saving ? "Saving..." : "Save & Continue"}
        </button>
      </div>
    </div>
  );
}
