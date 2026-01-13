"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/components/context/CartContext";

export default function MiniCartBar() {
  const { itemCount, subtotal } = useCart();
  const pathname = usePathname();

  // Hide on cart page or when empty
  if (itemCount === 0 || pathname === "/cart") return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40">
      <div className="mx-auto max-w-7xl px-4 pb-4">
        <div className="rounded-full bg-gray-900 text-white flex items-center justify-between px-5 py-3 shadow-2xl animate-slideUp">
          <div>
            <p className="text-sm font-semibold">
              {itemCount} item{itemCount > 1 ? "s" : ""} in your cart
            </p>
            <p className="text-xs text-gray-300">
              Subtotal £{subtotal.toFixed(2)}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/cart"
              className="rounded-full border border-white/30 px-4 py-2 text-sm font-semibold hover:bg-white/10"
            >
              View cart
            </Link>
            <button className="rounded-full bg-purple-500 px-4 py-2 text-sm font-semibold hover:bg-purple-600">
              Checkout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
