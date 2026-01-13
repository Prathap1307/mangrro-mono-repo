"use client";

import {
  createContext,
  useContext,
  useState,
  useMemo,
  useEffect,
  useCallback,
} from "react";
import type { ReactNode } from "react";
import type { Product } from "@/data/products";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

interface CartContextValue {
  items: CartItem[];
  unavailableItemIds: Record<string, boolean>;
  addItem: (product: Product) => void;
  increase: (id: string) => void;
  decrease: (id: string) => void;
  remove: (id: string) => void;
  clear: () => void;
  reconcileAvailability: (availableIds: string[]) => void;
  getItemQuantity: (id: string) => number;
  isItemAvailable: (id: string) => boolean;
  itemCount: number;
  subtotal: number;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [unavailableItemIds, setUnavailableItemIds] = useState<
    Record<string, boolean>
  >({});

  // Load cart from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("cart");
    if (saved) setItems(JSON.parse(saved));
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(items));
  }, [items]);

  /* Add item or increase qty */
  const addItem = (product: Product) => {
    setItems((current) => {
      const existing = current.find((item) => item.id === product.id);

      if (existing) {
        return current.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [
        ...current,
        {
          id: product.id,
          name: product.name,
          price: product.price,
          quantity: 1,
          image:
            product.image ||
            product.imageUrl ||
            product.img ||
            "/placeholder.webp",
        },
      ];
    });
  };

  const increase = (id: string) => {
    setItems((current) =>
      current.map((item) =>
        item.id === id ? { ...item, quantity: item.quantity + 1 } : item
      )
    );
  };

  const decrease = (id: string) => {
    setItems((current) =>
      current
        .map((item) =>
          item.id === id ? { ...item, quantity: item.quantity - 1 } : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const remove = (id: string) => {
    setItems((current) => current.filter((item) => item.id !== id));
    setUnavailableItemIds((current) => {
      if (!current[id]) return current;
      const next = { ...current };
      delete next[id];
      return next;
    });
  };

  const clear = () => {
    setItems([]);
    setUnavailableItemIds({});
  };

  const reconcileAvailability = useCallback(
    (availableIds: string[]) => {
      if (!availableIds.length) return;
      const availableSet = new Set(availableIds);
      // Keep cart items intact on availability refreshes; we just mark what's
      // unavailable so users don't lose selections mid-session.
      setUnavailableItemIds((prev) => {
        const next: Record<string, boolean> = {};
        for (const item of items) {
          if (!availableSet.has(item.id)) {
            next[item.id] = true;
          }
        }
        const prevKeys = Object.keys(prev);
        const nextKeys = Object.keys(next);
        if (prevKeys.length !== nextKeys.length) {
          return next;
        }
        for (const key of nextKeys) {
          if (!prev[key]) {
            return next;
          }
        }
        return prev;
      });
    },
    [items],
  );

  const getItemQuantity = (id: string) =>
    items.find((item) => item.id === id)?.quantity ?? 0;

  const isItemAvailable = (id: string) => !unavailableItemIds[id];

  const subtotal = useMemo(
    () => items.reduce((total, item) => total + item.price * item.quantity, 0),
    [items]
  );

  const itemCount = useMemo(
    () => items.reduce((total, item) => total + item.quantity, 0),
    [items]
  );

  return (
    <CartContext.Provider
      value={{
        items,
        unavailableItemIds,
        addItem,
        increase,
        decrease,
        remove,
        clear,
        reconcileAvailability,
        getItemQuantity,
        isItemAvailable,
        subtotal,
        itemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
