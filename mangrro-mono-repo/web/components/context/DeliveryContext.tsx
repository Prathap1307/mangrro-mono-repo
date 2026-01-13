"use client";

import { createContext, useContext, useEffect, useState } from "react";

export interface DeliveryAddress {
  line1: string;
  line2?: string;
  town: string;
  postcode: string;
  latitude?: number;
  longitude?: number;
}

interface DeliveryContextValue {
  address: DeliveryAddress | null;
  setAddress: (addr: DeliveryAddress | null) => void;

  locationSheetOpen: boolean;
  setLocationSheetOpen: (open: boolean) => void;
}

const DeliveryContext = createContext<DeliveryContextValue | undefined>(
  undefined
);

export function DeliveryProvider({ children }: { children: React.ReactNode }) {
  const [address, setAddressState] = useState<DeliveryAddress | null>(null);
  const [locationSheetOpen, setLocationSheetOpen] = useState(false);

  // Load from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem("delivery-address");
      if (raw) setAddressState(JSON.parse(raw));
    } catch {
      // ignore
    }
  }, []);

  // Save when address changes
  useEffect(() => {
    if (address) {
      localStorage.setItem("delivery-address", JSON.stringify(address));
    }
  }, [address]);

  const setAddress = (addr: DeliveryAddress | null) => {
    setAddressState(addr);
    if (addr) {
      localStorage.setItem("delivery-address", JSON.stringify(addr));
    } else {
      localStorage.removeItem("delivery-address");
    }
  };

  return (
    <DeliveryContext.Provider
      value={{
        address,
        setAddress,
        locationSheetOpen,
        setLocationSheetOpen,
      }}
    >
      {children}
    </DeliveryContext.Provider>
  );
}

export function useDelivery() {
  const ctx = useContext(DeliveryContext);
  if (!ctx)
    throw new Error("useDelivery must be used within DeliveryProvider");
  return ctx;
}
