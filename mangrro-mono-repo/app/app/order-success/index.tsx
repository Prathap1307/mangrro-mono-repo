import { useMemo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Link, useLocalSearchParams } from "expo-router";

export default function OrderSuccessScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const orderId = useMemo(() => params?.id ?? "", [params]);

  return (
    <View style={styles.container}>
      <View style={styles.checkmark}>
        <Text style={styles.checkmarkText}>✓</Text>
      </View>
      <Text style={styles.title}>Order placed!</Text>
      <Text style={styles.subtitle}>We’re confirming with the restaurant.</Text>

      {orderId ? (
        <Link href={{ pathname: "/track", params: { id: orderId } }}>
          <TouchableOpacity style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Track order →</Text>
          </TouchableOpacity>
        </Link>
      ) : (
        <Text style={styles.muted}>Order ID missing from URL.</Text>
      )}

      <Text style={styles.todo}>TODO: Display actual order confirmation data.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 12,
    backgroundColor: "#ffffff",
  },
  checkmark: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#22c55e",
    alignItems: "center",
    justifyContent: "center",
  },
  checkmarkText: {
    color: "#ffffff",
    fontSize: 36,
    fontWeight: "700",
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
  },
  subtitle: {
    color: "#6b7280",
    textAlign: "center",
  },
  primaryButton: {
    backgroundColor: "#4f46e5",
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  primaryButtonText: {
    color: "#ffffff",
    fontWeight: "600",
  },
  muted: {
    color: "#9ca3af",
  },
  todo: {
    fontSize: 12,
    color: "#9ca3af",
    marginTop: 8,
  },
});
