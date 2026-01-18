import { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Link } from "expo-router";

const statusSteps = [
  "pending",
  "accepted",
  "preparing",
  "completed",
  "delivered",
];

const mockOrders = [
  {
    id: "DS-1024",
    email: "guest@example.com",
    status: "preparing",
    total: "24.90",
    items: [
      { name: "Spicy wings", quantity: 1 },
      { name: "Loaded fries", quantity: 2 },
    ],
  },
];

export default function AccountScreen() {
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.eyebrow}>Profile</Text>
      <Text style={styles.title}>Account</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Profile details</Text>
        <Text style={styles.muted}>Name: TODO</Text>
        <Text style={styles.muted}>Email: TODO</Text>
        <Text style={styles.muted}>Phone: TODO</Text>
        <Text style={styles.muted}>Primary address: TODO</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Order history</Text>
        {/* TODO: Fetch customer + order history from API */}

        {mockOrders.length === 0 ? (
          <Text style={styles.muted}>No past orders found.</Text>
        ) : (
          mockOrders.map((order) => {
            const isOpen = expandedOrder === order.id;
            return (
              <View key={order.id} style={styles.orderCard}>
                <View style={styles.orderHeader}>
                  <View>
                    <Text style={styles.orderId}>Order {order.id}</Text>
                    <Text style={styles.muted}>{order.email}</Text>
                    <Text style={styles.status}>Status: {order.status}</Text>
                  </View>
                  <View style={styles.orderHeaderRight}>
                    <Text style={styles.total}>£{order.total}</Text>
                    <TouchableOpacity
                      onPress={() =>
                        setExpandedOrder(isOpen ? null : order.id)
                      }
                    >
                      <Text style={styles.linkText}>
                        {isOpen ? "Hide" : "Details"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {isOpen ? (
                  <View style={styles.orderDetails}>
                    <Text style={styles.sectionTitle}>Items</Text>
                    {order.items.map((item) => (
                      <Text key={item.name} style={styles.muted}>
                        {item.name} × {item.quantity}
                      </Text>
                    ))}

                    <Text style={[styles.sectionTitle, styles.sectionSpacing]}>
                      Status timeline
                    </Text>
                    {statusSteps.map((step) => (
                      <Text
                        key={step}
                        style={
                          step === order.status
                            ? styles.activeStatus
                            : styles.muted
                        }
                      >
                        {step}
                      </Text>
                    ))}

                    <Link href={{ pathname: "/track", params: { id: order.id } }}>
                      <Text style={[styles.linkText, styles.sectionSpacing]}>
                        Track order →
                      </Text>
                    </Link>
                  </View>
                ) : null}
              </View>
            );
          })
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    gap: 16,
    backgroundColor: "#f9fafb",
  },
  eyebrow: {
    textTransform: "uppercase",
    letterSpacing: 2,
    fontSize: 12,
    color: "#6b7280",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111827",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  muted: {
    color: "#6b7280",
    fontSize: 14,
  },
  orderCard: {
    backgroundColor: "#f3f4f6",
    borderRadius: 16,
    padding: 14,
    marginTop: 12,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  orderHeaderRight: {
    alignItems: "flex-end",
    gap: 6,
  },
  orderId: {
    fontWeight: "600",
    color: "#111827",
  },
  status: {
    fontSize: 12,
    color: "#6b7280",
  },
  total: {
    fontWeight: "600",
    color: "#111827",
  },
  orderDetails: {
    marginTop: 12,
  },
  sectionTitle: {
    fontWeight: "600",
    color: "#111827",
  },
  sectionSpacing: {
    marginTop: 8,
  },
  activeStatus: {
    color: "#4f46e5",
    fontWeight: "600",
  },
  linkText: {
    color: "#4f46e5",
    fontWeight: "600",
  },
});
