"use client";

import { FiBookmark } from "react-icons/fi";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";

import { useFavourites } from "@/components/context/FavouritesContext";
import { useCart } from "@/components/context/CartContext";
import type { Product } from "@/data/products";

interface Props {
  product: Product;
  onAddToCart?: (product: Product) => void;
  onToggleFavourite?: (product: Product) => void;
  isFavourite?: boolean;
}

export default function ProductCard({
  product,
  onAddToCart,
  onToggleFavourite,
  isFavourite,
}: Props) {
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const { toggleFavourite, isFavourite: ctxIsFavourite } = useFavourites();
  const { addItem, increase, decrease, getItemQuantity } = useCart();
  const isAvailable = product.available !== false;

  const isFav = isFavourite ?? ctxIsFavourite(product.id);
  const handleToggleFavourite = () => {
    if (onToggleFavourite) return onToggleFavourite(product);
    return toggleFavourite(product);
  };

  const handleAddToCart = () => {
    if (!ensureLoggedIn()) return;
    if (!isAvailable) return;
    (onAddToCart ?? addItem)(product);
  };

  const handleIncrease = () => {
    if (!ensureLoggedIn()) return;
    if (!isAvailable) return;
    increase(product.id);
  };

  const handleDecrease = () => {
    if (!ensureLoggedIn()) return;
    decrease(product.id);
  };

  const quantityLabel = "1 Unit";
  const quantity = getItemQuantity(product.id);

  const ensureLoggedIn = () => {
    if (!isSignedIn) {
      router.push("/sign-in");
      return false;
    }
    return true;
  };

  return (
    <div className="group relative flex flex-col rounded-2xl bg-white shadow-sm">
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-gray-100">
        <img
          src={
            product.image ||
            (product as any).imageUrl ||
            (product as any).img ||
            "/placeholder.webp"
          }
          alt={product.name}
          className={`h-full w-full object-cover ${
            isAvailable ? "" : "grayscale"
          }`}
        />
        <div className="absolute left-2 top-2 flex items-center gap-2">
          <button
            type="button"
            onClick={handleToggleFavourite}
            className={`rounded-full border px-2 py-1 text-xs ${
              isFav
                ? "border-gray-300 bg-white text-gray-700"
                : "border-transparent bg-white/80 text-gray-500"
            }`}
            aria-label="Save item"
          >
            <FiBookmark size={14} />
          </button>
        </div>
        {!isAvailable && (
          <div className="absolute right-2 top-2 rounded-full bg-gray-800/90 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-white shadow-sm">
            Unavailable
          </div>
        )}
        {isAvailable && product.closingSoon && (
          <div className="absolute right-2 top-2 rounded-full bg-amber-500 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-white shadow-sm">
            {product.closingMinutes !== undefined
              ? `Closing in ${Math.max(0, product.closingMinutes)}m`
              : "Closing soon"}
          </div>
        )}
      </div>

      <div className="space-y-1 p-3">
        <p className="text-xs text-gray-500">{quantityLabel}</p>
        <h3 className="text-sm font-semibold text-gray-900">{product.name}</h3>
        {product.description && (
          <p className="text-xs text-gray-500 line-clamp-2">
            {product.description}
          </p>
        )}
        <span className="text-sm font-semibold text-gray-900">
          £{product.price.toFixed(2)}
        </span>
        <div className="pt-2">
          {quantity === 0 ? (
            <button
              type="button"
              onClick={handleAddToCart}
              className={`w-full rounded-full px-4 py-2 text-sm font-semibold shadow-sm transition ${
                isAvailable
                  ? "bg-green-600 text-white hover:bg-green-700"
                  : "cursor-not-allowed bg-gray-200 text-gray-500"
              }`}
              disabled={!isAvailable}
            >
              {isAvailable ? "Add" : "Unavailable"}
            </button>
          ) : (
            <div className="space-y-1">
              <div className="flex items-center justify-between rounded-full border border-gray-200 bg-gray-50 px-2 py-1.5">
                <button
                  type="button"
                  onClick={handleDecrease}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-base font-semibold text-white shadow-sm transition hover:bg-red-600"
                  aria-label="Decrease quantity"
                >
                  -
                </button>
                <span className="text-lg font-semibold text-gray-900">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={handleIncrease}
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-base font-semibold text-white shadow-sm transition ${
                    isAvailable
                      ? "bg-green-500 hover:bg-green-600"
                      : "cursor-not-allowed bg-gray-300"
                  }`}
                  aria-label="Increase quantity"
                  disabled={!isAvailable}
                >
                  +
                </button>
              </div>
              <p className="text-center text-xs font-medium text-gray-500">
                Added to cart
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
