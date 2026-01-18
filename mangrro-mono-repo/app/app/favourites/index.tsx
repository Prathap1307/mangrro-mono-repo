import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const mockFavourites: Array<{ id: string; name: string; price: string }> = [];

export default function FavouritesScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.eyebrow}>Saved</Text>
      <Text style={styles.title}>Favourites</Text>

      {mockFavourites.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No favourites yet</Text>
          <Text style={styles.emptySubtitle}>
            Tap the heart on any product to save it for later.
          </Text>
          <TouchableOpacity style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Explore products</Text>
          </TouchableOpacity>
        </View>
      ) : (
        mockFavourites.map((item) => (
          <View key={item.id} style={styles.card}>
            <Text style={styles.cardTitle}>{item.name}</Text>
            <Text style={styles.muted}>£{item.price}</Text>
            <TouchableOpacity style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>Add to cart</Text>
            </TouchableOpacity>
          </View>
        ))
      )}

      <Text style={styles.todo}>TODO: Load favourites from state.</Text>
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
    fontSize: 26,
    fontWeight: "700",
  },
  emptyState: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 20,
    gap: 10,
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  emptySubtitle: {
    color: "#6b7280",
    textAlign: "center",
  },
  primaryButton: {
    backgroundColor: "#4f46e5",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 999,
  },
  primaryButtonText: {
    color: "#ffffff",
    fontWeight: "600",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 16,
    gap: 8,
  },
  cardTitle: {
    fontWeight: "600",
    fontSize: 16,
  },
  muted: {
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
    fontSize: 12,
    color: "#9ca3af",
  },
});
