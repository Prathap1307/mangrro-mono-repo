"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import type { Product } from "@/data/products";

interface FavouritesContextValue {
  favourites: Product[];
  unavailableFavouriteIds: Record<string, boolean>;
  toggleFavourite: (p: Product) => void;
  isFavourite: (id: string) => boolean;
  reconcileAvailability: (availableIds: string[]) => void;
  isFavouriteAvailable: (id: string) => boolean;
}

const FavouritesContext = createContext<FavouritesContextValue | undefined>(undefined);

export function useFavourites() {
  const ctx = useContext(FavouritesContext);
  if (!ctx) throw new Error("useFavourites must be used within FavouritesProvider");
  return ctx;
}

export function FavouritesProvider({ children }: { children: ReactNode }) {
  const [favourites, setFavourites] = useState<Product[]>([]);
  const [unavailableFavouriteIds, setUnavailableFavouriteIds] = useState<
    Record<string, boolean>
  >({});

  useEffect(() => {
    const saved = localStorage.getItem("favourites");
    if (saved) setFavourites(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem("favourites", JSON.stringify(favourites));
  }, [favourites]);

  const toggleFavourite = (product: Product) => {
    setFavourites((prev) => {
      const exists = prev.some((x) => x.id === product.id);
      if (exists) {
        setUnavailableFavouriteIds((current) => {
          if (!current[product.id]) return current;
          const next = { ...current };
          delete next[product.id];
          return next;
        });
        return prev.filter((x) => x.id !== product.id);
      }
      return [...prev, product];
    });
  };

  const isFavourite = (id: string) => favourites.some((x) => x.id === id);

  const reconcileAvailability = useCallback(
    (availableIds: string[]) => {
      if (!availableIds.length) return;
      const availableSet = new Set(availableIds);
      // Preserve favourites on list refreshes; we only flag availability so users
      // don't lose saved items when schedules update.
      setUnavailableFavouriteIds((prev) => {
        const next: Record<string, boolean> = {};
        for (const item of favourites) {
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
    [favourites],
  );

  const isFavouriteAvailable = (id: string) => !unavailableFavouriteIds[id];

  return (
    <FavouritesContext.Provider
      value={{
        favourites,
        unavailableFavouriteIds,
        toggleFavourite,
        isFavourite,
        reconcileAvailability,
        isFavouriteAvailable,
      }}
    >
      {children}
    </FavouritesContext.Provider>
  );
}
