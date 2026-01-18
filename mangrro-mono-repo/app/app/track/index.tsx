import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";

const STATUS_FLOW = [
  "pending",
  "accepted",
  "restaurant-preparing",
  "prepared",
  "picked-up",
  "on-the-way",
  "delivered",
];

export default function TrackScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const orderId = useMemo(() => params?.id ?? "", [params]);

  const statusIndex = 2;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {orderId ? `Track Order ${orderId}` : "Track your order"}
      </Text>
      <Text style={styles.subtitle}>Live updates & delivery status</Text>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Customer</Text>
        <Text style={styles.bodyText}>Name: TODO</Text>
        <Text style={styles.bodyText}>Phone: TODO</Text>
        <Text style={styles.bodyText}>Email: TODO</Text>

        <Text style={[styles.sectionTitle, styles.sectionSpacing]}>
          Delivery address
        </Text>
        <Text style={styles.bodyText}>TODO</Text>

        <Text style={[styles.sectionTitle, styles.sectionSpacing]}>Items</Text>
        <Text style={styles.bodyText}>TODO</Text>

        <Text style={[styles.sectionTitle, styles.sectionSpacing]}>
          Order status
        </Text>
        {STATUS_FLOW.map((step, idx) => (
          <View key={step} style={styles.statusRow}>
            <View
              style={[
                styles.statusDot,
                idx <= statusIndex && styles.statusDotActive,
              ]}
            />
            <Text
              style={
                idx <= statusIndex ? styles.statusActive : styles.statusInactive
              }
            >
              {step.replace(/-/g, " ").toUpperCase()}
            </Text>
          </View>
        ))}
      </View>

      <Text style={styles.todo}>
        TODO: Poll order status every 10 seconds.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    gap: 16,
    backgroundColor: "#f9fafb",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
  },
  subtitle: {
    color: "#6b7280",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 16,
    gap: 8,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  sectionTitle: {
    fontWeight: "600",
    color: "#111827",
  },
  sectionSpacing: {
    marginTop: 8,
  },
  bodyText: {
    color: "#374151",
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#d1d5db",
  },
  statusDotActive: {
    backgroundColor: "#16a34a",
  },
  statusActive: {
    fontWeight: "600",
    color: "#111827",
  },
  statusInactive: {
    color: "#9ca3af",
  },
  todo: {
    fontSize: 12,
    color: "#9ca3af",
  },
});
