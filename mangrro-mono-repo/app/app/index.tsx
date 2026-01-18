import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const categories = [
  { id: "popular", label: "Popular" },
  { id: "top-picks", label: "Top picks" },
  { id: "daily-essentials", label: "Daily essentials" },
];

export default function HomeScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>Delivery Star</Text>
        <Text style={styles.heroSubtitle}>
          Fast food delivery, tailored for you.
        </Text>
        <TouchableOpacity style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Start order</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Browse categories</Text>
      <View style={styles.categoryRow}>
        {categories.map((category) => (
          <View key={category.id} style={styles.categoryTile}>
            <Text style={styles.categoryLabel}>{category.label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Delivery address</Text>
        <Text style={styles.bodyText}>TODO: Detect and confirm location.</Text>
        <TouchableOpacity style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>Set address</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.todo}>TODO: Load homepage data.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    gap: 16,
    backgroundColor: "#f9fafb",
  },
  hero: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 20,
    gap: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: "700",
  },
  heroSubtitle: {
    color: "#6b7280",
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  categoryRow: {
    flexDirection: "row",
    gap: 10,
  },
  categoryTile: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
  },
  categoryLabel: {
    color: "#111827",
    fontWeight: "600",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 16,
    gap: 10,
  },
  cardTitle: {
    fontWeight: "600",
  },
  bodyText: {
    color: "#6b7280",
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    paddingVertical: 10,
    borderRadius: 999,
    alignItems: "center",
  },
  secondaryButtonText: {
    fontWeight: "600",
  },
  todo: {
    color: "#9ca3af",
    fontSize: 12,
  },
});
