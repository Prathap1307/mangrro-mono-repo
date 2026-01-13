'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { useCart } from '@/components/context/CartContext';
import { useFavourites } from '@/components/context/FavouritesContext';
import { FiHeart, FiShoppingCart, FiUser, FiMenu, FiX } from 'react-icons/fi';

export default function Navbar({ onSearchChange }: { onSearchChange?: (value: string) => void }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  // Build cartQuantity manually so it NEVER becomes undefined
  const { items } = useCart();
  const cartQuantity = items.reduce((n, item) => n + (item.quantity || 1), 0);
  const { favourites } = useFavourites();
  const favouritesCount = favourites.length;

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-gray-100">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-6">

        {/* LEFT: Logo */}
        <Link href="/" className="flex items-center gap-3">
          <div className="relative h-10 w-10">
            <Image src="/brand.png" alt="Delivery Star" fill className="object-contain" />
          </div>
          <span className="text-xl font-bold text-gray-900">Delivery Star</span>
        </Link>

        {/* RIGHT ICONS (Desktop) */}
        <div className="hidden md:flex items-center gap-4">

          {/* Cart with badge */}
          <Link href="/cart" className="relative p-2 rounded-full hover:bg-gray-100">
            <FiShoppingCart size={24} />

            {cartQuantity > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 
                               flex items-center justify-center rounded-full">
                {cartQuantity}
              </span>
            )}
          </Link>
          <Link href="/favourites" className="relative p-2 rounded-full hover:bg-gray-100">
            <FiHeart size={20} />
            {favouritesCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 
                               flex items-center justify-center rounded-full">
                {favouritesCount}
              </span>
            )}
          </Link>
          <Link href="/account" className="p-2 rounded-full hover:bg-gray-100">
            <FiUser size={20} />
          </Link>

        </div>

        {/* MOBILE MENU BUTTON */}
        <button
          className="md:hidden p-2 rounded-full border"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <FiX size={22} /> : <FiMenu size={22} />}
        </button>
      </div>

      {/* MOBILE MENU */}
      {mobileOpen && (
        <div className="md:hidden p-4 bg-white shadow space-y-2">
          
          <Link
            href="/cart"
            className="flex items-center gap-3 p-2 rounded hover:bg-gray-100"
            onClick={() => setMobileOpen(false)}
          >
            <FiShoppingCart /> Cart ({cartQuantity})
          </Link>

          <Link
            href="/favourites"
            className="flex items-center gap-3 p-2 rounded hover:bg-gray-100"
            onClick={() => setMobileOpen(false)}
          >
            <FiHeart /> Wishlist ({favouritesCount})
          </Link>

          <Link
            href="/account"
            className="flex items-center gap-3 p-2 rounded hover:bg-gray-100"
            onClick={() => setMobileOpen(false)}
          >
            <FiUser /> Account
          </Link>

        </div>
      )}
    </header>
  );
}
