import Constants from "expo-constants";
import { Stack } from "expo-router";
// eslint-disable-next-line import/no-unresolved
import { ClerkProvider } from "@clerk/clerk-expo";

export default function RootLayout() {
  const clerkPublishableKey =
    process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ??
    (Constants.expoConfig?.extra as { clerkPublishableKey?: string } | undefined)
      ?.clerkPublishableKey;

  if (!clerkPublishableKey) {
    console.warn("Clerk publishable key is missing; rendering without Clerk.");
    return <Stack screenOptions={{ headerShown: false }} />;
  }

  return (
    <ClerkProvider publishableKey={clerkPublishableKey}>
      <Stack screenOptions={{ headerShown: false }} />
    </ClerkProvider>
  );
}
