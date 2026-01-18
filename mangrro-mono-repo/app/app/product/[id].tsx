import { useMemo } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useLocalSearchParams } from "expo-router";

export default function ProductScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const itemId = params?.id ?? "";

  const productName = useMemo(() => {
    if (!itemId) return "Product";
    return `Product ${itemId}`;
  }, [itemId]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.heroImage}>
        <Text style={styles.heroText}>Image placeholder</Text>
      </View>

      <Text style={styles.title}>{productName}</Text>
      <Text style={styles.subtitle}>Premium item details and pricing.</Text>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Details</Text>
        <Text style={styles.bodyText}>Description: TODO</Text>
        <Text style={styles.bodyText}>Price: TODO</Text>
        <Text style={styles.bodyText}>Availability: TODO</Text>
      </View>

      <TouchableOpacity style={styles.primaryButton}>
        <Text style={styles.primaryButtonText}>Add to cart</Text>
      </TouchableOpacity>

      <Text style={styles.todo}>TODO: Load item details from API.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    gap: 16,
    backgroundColor: "#f9fafb",
  },
  heroImage: {
    height: 220,
    borderRadius: 24,
    backgroundColor: "#e5e7eb",
    alignItems: "center",
    justifyContent: "center",
  },
  heroText: {
    color: "#6b7280",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
  },
  subtitle: {
    color: "#6b7280",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 16,
    gap: 8,
  },
  sectionTitle: {
    fontWeight: "600",
  },
  bodyText: {
    color: "#374151",
  },
  primaryButton: {
    backgroundColor: "#4f46e5",
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#ffffff",
    fontWeight: "600",
  },
  todo: {
    color: "#9ca3af",
    fontSize: 12,
  },
});
