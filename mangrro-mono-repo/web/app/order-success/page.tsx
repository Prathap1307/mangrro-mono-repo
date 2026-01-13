"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("id");

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-white text-center">
      {/* 🎉 Animated Checkmark */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
        className="w-24 h-24 flex items-center justify-center rounded-full bg-green-500 text-white shadow-lg mb-6"
      >
        <motion.svg
          width="50"
          height="50"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
        >
          <motion.path d="M5 13l4 4L19 7" />
        </motion.svg>
      </motion.div>

      {/* Text animation */}
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-3xl font-bold"
      >
        🎉 Order placed!
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="mt-2 text-gray-600 text-base"
      >
        We're confirming with the restaurant.
      </motion.p>

      {/* Track Order button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        {orderId ? (
          <Link
            href={`/track?id=${orderId}`}
            className="mt-6 inline-block px-8 py-3 rounded-full bg-indigo-600 text-white font-semibold text-lg shadow-md hover:bg-indigo-700 transition"
          >
            Track Order →
          </Link>
        ) : (
          <p className="mt-6 text-sm text-gray-500">
            Order ID missing from URL.
          </p>
        )}
      </motion.div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}> 
      <SuccessContent />
    </Suspense>
  );
}
