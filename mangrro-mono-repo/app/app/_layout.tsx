import { Stack } from "expo-router";

export default function RootLayout() {
  // TODO: Add providers (auth/cart/favourites/delivery) to match web layout.
  return <Stack screenOptions={{ headerShown: false }} />;
}
  
