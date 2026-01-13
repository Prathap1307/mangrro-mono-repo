// app/layout.tsx
import type { ReactNode } from "react";
import type { Metadata } from "next";

import { ClerkProvider } from "@clerk/nextjs";
import { CartProvider } from "@/components/context/CartContext";
import { FavouritesProvider } from "@/components/context/FavouritesContext";
import { DeliveryProvider } from "@/components/context/DeliveryContext";

import AppShell from "@/components/AppShell";
import MiniCartBar from "@/components/MiniCartBar";
import ActiveOrderBar from "@/components/ActiveOrderBar";

import "./globals.css";

// ⭐ Add favicon metadata here
export const metadata: Metadata = {
  title: "Delivery Star",
  description: "Fast food delivery app",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
};

const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

function OptionalClerkProvider({ children }: { children: ReactNode }) {
  if (!clerkPublishableKey) {
    if (process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console
      console.warn("Clerk publishable key is missing; rendering without Clerk.");
    }

    return <>{children}</>;
  }

  return (
    <ClerkProvider publishableKey={clerkPublishableKey}>{children}</ClerkProvider>
  );
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <OptionalClerkProvider>
      <CartProvider>
        <FavouritesProvider>
          <DeliveryProvider>
            <html lang="en">
              <body className="overflow-x-hidden">
                <AppShell>{children}</AppShell>

                {/* Live tracking bar */}
                <ActiveOrderBar />

                {/* Mini cart 
                <MiniCartBar /> */}
              </body>
            </html>
          </DeliveryProvider>
        </FavouritesProvider>
      </CartProvider>
    </OptionalClerkProvider>
  );
}
