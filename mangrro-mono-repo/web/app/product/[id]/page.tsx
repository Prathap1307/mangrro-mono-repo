"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { FiHeart, FiShoppingBag } from "react-icons/fi";
import { useCart } from "@/components/context/CartContext";
import Navbar from "@/components/Navbar";
import type { Product } from "@/data/products";

type ItemResponse = {
  item: ItemPayload;
  available: boolean;
  status: "active" | "inactive";
  isAdmin: boolean;
};

type ItemPayload = {
  itemId: string;
  name: string;
  price: number;
  description?: string;
  imageUrl?: string;
  imageKey?: string;
  ageRestricted?: boolean;
  keywords?: string[];
  active: boolean;
};

export default function ProductPage() {
  const { addItem } = useCart();
  const params = useParams<{ id: string }>();
  const itemId = params?.id;
  const [item, setItem] = useState<ItemPayload | null>(null);
  const [available, setAvailable] = useState(false);
  const [status, setStatus] = useState<"active" | "inactive">("inactive");
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadItem = async () => {
      if (!itemId) return;
      setLoading(true);
      setError("");

      try {
        const res = await fetch(`/api/items/${itemId}`, { cache: "no-store" });
        if (!res.ok) {
          throw new Error(res.status === 404 ? "Item not found" : "Failed to load item");
        }

        const data = (await res.json()) as ItemResponse;
        if (!isMounted) return;
        setItem(data.item);
        setAvailable(data.available);
        setStatus(data.status);
        setIsAdmin(data.isAdmin);
      } catch (err) {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : "Failed to load item");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadItem();

    return () => {
      isMounted = false;
    };
  }, [itemId]);

  const imageSrc = item?.imageKey
    ? `/api/image-proxy?key=${encodeURIComponent(item.imageKey)}`
    : item?.imageUrl || "/placeholder.webp";

  const product = useMemo(() => {
    if (!item) return null;
    return {
      id: item.itemId,
      name: item.name,
      price: item.price,
      description: item.description,
      image: imageSrc,
      available,
    } satisfies Product;
  }, [available, imageSrc, item]);

  const showUnavailable = !isAdmin && status === "inactive";
  // Deep links bypass list scheduler rules, so we only rely on direct access status here.

  let content: ReactNode = null;

  if (loading) {
    content = (
      <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
        <h1 className="text-3xl font-bold text-gray-900">Loading item…</h1>
        <p className="text-gray-600">Fetching the latest details.</p>
      </div>
    );
  } else if (error) {
    content = (
      <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
        <h1 className="text-3xl font-bold text-gray-900">Unable to load item</h1>
        <p className="text-gray-600">{error}</p>
        <Link
          href="/"
          className="rounded-full bg-purple-600 px-5 py-3 font-semibold text-white shadow hover:bg-purple-700"
        >
          Return home
        </Link>
      </div>
    );
  } else if (!item || !product) {
    content = (
      <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
        <h1 className="text-3xl font-bold text-gray-900">Product not found</h1>
        <p className="text-gray-600">
          The item you are looking for might have been removed or is unavailable.
        </p>
        <Link
          href="/"
          className="rounded-full bg-purple-600 px-5 py-3 font-semibold text-white shadow hover:bg-purple-700"
        >
          Return home
        </Link>
      </div>
    );
  } else if (showUnavailable) {
    // Deep links ignore list scheduler rules, but inactive items are still blocked for customers.
    content = (
      <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
        <h1 className="text-3xl font-bold text-gray-900">Currently unavailable</h1>
        <p className="text-gray-600">
          This item is temporarily unavailable. Please check back later.
        </p>
        <Link
          href="/"
          className="rounded-full bg-purple-600 px-5 py-3 font-semibold text-white shadow hover:bg-purple-700"
        >
          Browse other items
        </Link>
      </div>
    );
  } else {
    content = (
      <ProductDetails
        product={product}
        onAddToCart={() => addItem(product)}
        showInactiveBadge={isAdmin && status === "inactive"}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="mx-auto max-w-6xl p-6 lg:p-12">{content}</div>
    </div>
  );
}

function ProductDetails({
  product,
  onAddToCart,
  showInactiveBadge,
}: {
  product: Product;
  onAddToCart: () => void;
  showInactiveBadge: boolean;
}) {
  const imageSrc = product.image ?? "/placeholder.webp";
  const canAddToCart = product.available || showInactiveBadge;

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="relative h-[420px] overflow-hidden rounded-3xl bg-white shadow-xl">
          <Image
            src={imageSrc}
            alt={product.name}
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
        </div>
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-purple-500">
              Featured
            </p>
            {showInactiveBadge && (
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                Inactive
              </span>
            )}
          </div>
          <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
          <p className="text-lg text-gray-600 leading-relaxed">
            {product.description}
          </p>
          <p className="text-4xl font-extrabold text-gray-900">
            ${product.price.toFixed(2)}
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <button
              onClick={onAddToCart}
              disabled={!canAddToCart}
              className="flex items-center gap-2 rounded-full bg-purple-600 px-6 py-3 text-base font-semibold text-white shadow-lg transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:bg-purple-400"
            >
              <FiShoppingBag /> Add to cart
            </button>
            <button className="flex items-center gap-2 rounded-full border border-gray-200 px-6 py-3 text-base font-semibold text-gray-700 hover:border-purple-500 hover:text-purple-600">
              <FiHeart /> Add to favourites
            </button>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-inner">
            <p className="text-sm font-semibold text-gray-700">Delivery promise</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-600">
              <li>Under 60 minutes in metro areas</li>
              <li>Eco-packaging and contactless handoff</li>
              <li>Live rider updates with every order</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="text-center text-sm text-gray-500">
        <Link href="/">Back to home</Link>
      </div>
    </div>
  );
}
