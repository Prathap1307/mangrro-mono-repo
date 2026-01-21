"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import type { Product } from "@/data/products";

export interface FoodCartItem {
  id: string;
  name: string;
  price: number;
  basePrice: number;
  quantity: number;
  image: string;
  addons?: FoodCartAddon[];
}

export interface FoodCartAddon {
  id: string;
  name: string;
  price: number;
  categoryId?: string;
}

interface FoodCartContextValue {
  items: FoodCartItem[];
  addItem: (product: FoodCartProduct) => void;
  increase: (id: string) => void;
  decrease: (id: string) => void;
  remove: (id: string) => void;
  clear: () => void;
  getItemQuantity: (id: string) => number;
  itemCount: number;
  subtotal: number;
}

const FoodCartContext = createContext<FoodCartContextValue | undefined>(undefined);

export function useFoodCart() {
  const ctx = useContext(FoodCartContext);
  if (!ctx) throw new Error("useFoodCart must be used within FoodCartProvider");
  return ctx;
}

const STORAGE_KEY = "food-cart";

export interface FoodCartProduct extends Product {
  basePrice?: number;
  addons?: FoodCartAddon[];
}

export function FoodCartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<FoodCartItem[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setItems(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = useCallback((product: FoodCartProduct) => {
    setItems((current) => {
      const existing = current.find((item) => item.id === product.id);
      if (existing) {
        return current.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }

      const basePrice = product.basePrice ?? product.price;
      return [
        ...current,
        {
          id: product.id,
          name: product.name,
          price: product.price,
          basePrice,
          quantity: 1,
          image:
            product.image ||
            product.imageUrl ||
            product.img ||
            "/placeholder.webp",
          addons: product.addons,
        },
      ];
    });
  }, []);

  const increase = (id: string) => {
    setItems((current) =>
      current.map((item) =>
        item.id === id ? { ...item, quantity: item.quantity + 1 } : item,
      ),
    );
  };

  const decrease = (id: string) => {
    setItems((current) =>
      current
        .map((item) =>
          item.id === id ? { ...item, quantity: item.quantity - 1 } : item,
        )
        .filter((item) => item.quantity > 0),
    );
  };

  const remove = (id: string) => {
    setItems((current) => current.filter((item) => item.id !== id));
  };

  const clear = () => setItems([]);

  const getItemQuantity = (id: string) =>
    items.find((item) => item.id === id)?.quantity ?? 0;

  const subtotal = useMemo(
    () => items.reduce((total, item) => total + item.price * item.quantity, 0),
    [items],
  );

  const itemCount = useMemo(
    () => items.reduce((total, item) => total + item.quantity, 0),
    [items],
  );

  return (
    <FoodCartContext.Provider
      value={{
        items,
        addItem,
        increase,
        decrease,
        remove,
        clear,
        getItemQuantity,
        subtotal,
        itemCount,
      }}
    >
      {children}
    </FoodCartContext.Provider>
  );
}
