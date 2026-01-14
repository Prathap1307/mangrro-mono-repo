import { useEffect, useMemo, useState } from "react";
import { useLocalSearchParams } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { fetchItemsData, resolveCategoryId } from "../../lib/aws/items";

type ItemState = {
  items: Awaited<ReturnType<typeof fetchItemsData>>["items"];
  categories: Awaited<ReturnType<typeof fetchItemsData>>["categories"];
  subcategories: Awaited<ReturnType<typeof fetchItemsData>>["subcategories"];
};

export default function CategoryPage() {
  const { categoryId } = useLocalSearchParams();
  const [data, setData] = useState<ItemState>({
    items: [],
    categories: [],
    subcategories: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const resolvedCategoryId = Array.isArray(categoryId)
    ? categoryId[0]
    : categoryId;

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    fetchItemsData()
      .then((payload) => {
        if (!active) return;
        setData({
          items: payload.items,
          categories: payload.categories,
          subcategories: payload.subcategories,
        });
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Failed to load items.");
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const subcategoryLabels = useMemo(() => {
    if (!resolvedCategoryId) return ["All"];
    const labels = data.subcategories
      .filter((subcategory) => subcategory.categoryId === resolvedCategoryId)
      .map((subcategory) => subcategory.name);
    return ["All", ...labels];
  }, [data.subcategories, resolvedCategoryId]);

  const visibleItems = useMemo(() => {
    if (!resolvedCategoryId) return data.items;
    return data.items.filter(
      (item) => resolveCategoryId(item, data.categories) === resolvedCategoryId
    );
  }, [data.categories, data.items, resolvedCategoryId]);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.left}>
        {subcategoryLabels.map((s) => (
          <Text key={s} style={styles.sub}>{s}</Text>
        ))}
      </ScrollView>

      <ScrollView style={styles.right}>
        {loading && <Text style={styles.status}>Loading items...</Text>}
        {error && <Text style={[styles.status, styles.error]}>{error}</Text>}
        {!loading && !error && visibleItems.length === 0 && (
          <Text style={styles.status}>No items available.</Text>
        )}
        {!loading &&
          !error &&
          visibleItems.map((item) => (
            <View key={item.itemId || item.id} style={styles.item}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.price}>
                £{Number.isFinite(item.price) ? item.price.toFixed(2) : "0.00"}
              </Text>
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
  status: { color: "#6b7280", marginBottom: 12 },
  error: { color: "#dc2626" },
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
