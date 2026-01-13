import { useUser } from "@clerk/nextjs";

const hasClerkKey = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

export function useSafeUser() {
  if (!hasClerkKey) {
    return {
      isLoaded: true,
      isSignedIn: false,
      user: null,
    } as const;
  }

  return useUser();
}
