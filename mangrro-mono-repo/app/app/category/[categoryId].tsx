import { useLocalSearchParams } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { items } from "../../data/mock";

export default function CategoryPage() {
  const { categoryId } = useLocalSearchParams();

  return (
    <View style={styles.container}>
      <ScrollView style={styles.left}>
        {["All", "Root Veg", "Leafy Veg", "Exotic Veg"].map((s) => (
          <Text key={s} style={styles.sub}>{s}</Text>
        ))}
      </ScrollView>

      <ScrollView style={styles.right}>
        {items.map((i) => (
          <View key={i.id} style={styles.item}>
            <Text style={styles.name}>{i.name}</Text>
            <Text style={styles.price}>{i.price}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: "row" },
  left: { width: 100, backgroundColor: "#f3f4f6" },
  sub: { padding: 12, fontWeight: "600" },
  right: { flex: 1, padding: 16 },
  item: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
  },
  name: { fontWeight: "700" },
  price: { marginTop: 6, color: "#16a34a" },
});
