"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import { useSafeUser } from "@/lib/auth/useSafeUser";

const BLOCKED_FOR_GUESTS = ["/cart", "/food-cart", "/account", "/checkout"];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user, isLoaded } = useSafeUser();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;

    // 0️⃣ Completely ignore admin pages
    if (pathname.startsWith("/admin")) {
      return; // ⬅ IMPORTANT FIX — admin pages skip all Clerk checks
    }

    // 1️⃣ Guest restriction (customers only)
    if (!user) {
      const needsLogin = BLOCKED_FOR_GUESTS.some((p) =>
        pathname.startsWith(p)
      );
      if (needsLogin) {
        router.push(`/sign-in?redirect=${pathname}`);
      }
      return;
    }

    // 2️⃣ Customer profile completion requirement
    const profileCompleted = user.unsafeMetadata?.profileCompleted === true;

    const exemptPages = [
      "/sign-in",
      "/sign-up",
      "/complete-profile",
      "/complete-address",
    ];

    const isExempt = exemptPages.some((p) => pathname.startsWith(p));

    if (!profileCompleted && !isExempt) {
      router.push("/complete-profile");
    }
  }, [user, isLoaded, pathname, router]);

  return <>{children}</>;
}
