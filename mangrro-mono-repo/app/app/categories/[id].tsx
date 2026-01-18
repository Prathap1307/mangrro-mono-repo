import { useMemo } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useLocalSearchParams } from "expo-router";

const filters = ["Featured", "Price: Low", "Price: High"];

const mockItems = [
  { id: "1", name: "Signature wraps", price: "9.80" },
  { id: "2", name: "Family bundle", price: "24.00" },
  { id: "3", name: "Dessert combo", price: "6.50" },
];

export default function CategoryScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const categoryId = params?.id ?? "";

  const title = useMemo(() => {
    if (!categoryId) return "Category";
    return `Category: ${categoryId}`;
  }, [categoryId]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>Browse curated items and offers.</Text>

      <View style={styles.banner}>
        <Text style={styles.bannerTitle}>Today’s top picks</Text>
        <Text style={styles.bannerSubtitle}>
          Fresh drops curated for you.
        </Text>
      </View>

      <View style={styles.filterRow}>
        {filters.map((filter) => (
          <TouchableOpacity key={filter} style={styles.filterChip}>
            <Text style={styles.filterText}>{filter}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.cardGrid}>
        {mockItems.map((item) => (
          <View key={item.id} style={styles.itemCard}>
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.itemPrice}>£{item.price}</Text>
            <TouchableOpacity style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>View</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      <Text style={styles.todoText}>
        TODO: Fetch category, subcategory, and item schedule data.
      </Text>
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
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
  },
  subtitle: {
    color: "#6b7280",
  },
  banner: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 16,
    gap: 6,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 12,
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  bannerSubtitle: {
    color: "#6b7280",
  },
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  filterChip: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: "#ffffff",
  },
  filterText: {
    fontSize: 12,
    color: "#111827",
  },
  cardGrid: {
    gap: 12,
  },
  itemCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    gap: 8,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  itemPrice: {
    color: "#6b7280",
  },
  primaryButton: {
    backgroundColor: "#4f46e5",
    paddingVertical: 10,
    borderRadius: 999,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#ffffff",
    fontWeight: "600",
  },
  todoText: {
    color: "#9ca3af",
    fontSize: 12,
  },
});
