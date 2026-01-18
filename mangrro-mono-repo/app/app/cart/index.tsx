import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const mockItems = [
  { id: "item-1", name: "Crispy chicken burger", qty: 1, price: 8.95 },
  { id: "item-2", name: "Sweet potato fries", qty: 2, price: 3.5 },
];

export default function CartScreen() {
  const subtotal = mockItems.reduce(
    (total, item) => total + item.qty * item.price,
    0
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Your cart</Text>
      <Text style={styles.subtitle}>Review items and delivery details.</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Items</Text>
        {mockItems.map((item) => (
          <View key={item.id} style={styles.rowBetween}>
            <Text style={styles.bodyText}>
              {item.name} × {item.qty}
            </Text>
            <Text style={styles.bodyText}>
              £{(item.qty * item.price).toFixed(2)}
            </Text>
          </View>
        ))}
        <View style={styles.divider} />
        <View style={styles.rowBetween}>
          <Text style={styles.totalLabel}>Subtotal</Text>
          <Text style={styles.totalLabel}>£{subtotal.toFixed(2)}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Delivery details</Text>
        <Text style={styles.bodyText}>Address: TODO</Text>
        <Text style={styles.bodyText}>Instructions: TODO</Text>
        <TouchableOpacity style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>Edit address</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Payment</Text>
        {/* TODO: Hook up Square / Apple Pay / Google Pay */}
        <TouchableOpacity style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Place order</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>Pay with Apple Pay</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>Pay with Google Pay</Text>
        </TouchableOpacity>
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
  title: {
    fontSize: 26,
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
    gap: 10,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  bodyText: {
    color: "#374151",
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  divider: {
    height: 1,
    backgroundColor: "#e5e7eb",
    marginVertical: 8,
  },
  totalLabel: {
    fontWeight: "600",
  },
  primaryButton: {
    backgroundColor: "#4f46e5",
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: "center",
    marginTop: 8,
  },
  primaryButtonText: {
    color: "#ffffff",
    fontWeight: "600",
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    paddingVertical: 12,
    borderRadius: 999,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#111827",
    fontWeight: "600",
  },
});
