import { useEffect, useMemo, useState } from "react";
import { useLocalSearchParams } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { fetchItemsData, resolveCategoryId } from "../../lib/aws/items";
import {
  isItemListVisible,
  isSubcategoryVisible,
} from "../../lib/visibility/items";
import type { ItemSchedule, SubcategorySchedule } from "../../types/catalog";
import type { DayName } from "../../types/homepage";

type ItemState = {
  items: Awaited<ReturnType<typeof fetchItemsData>>["items"];
  categories: Awaited<ReturnType<typeof fetchItemsData>>["categories"];
  subcategories: Awaited<ReturnType<typeof fetchItemsData>>["subcategories"];
  mainCategories: Awaited<ReturnType<typeof fetchItemsData>>["mainCategories"];
  schedules: Awaited<ReturnType<typeof fetchItemsData>>["schedules"];
};

type ItemMeta = ItemState["items"][number];
type Category = ItemState["categories"][number];
type Subcategory = ItemState["subcategories"][number];
type MainCategory = ItemState["mainCategories"][number];

const getTodayInfo = (): { dayName: DayName; minutes: number } => {
  const now = new Date();
  const dayName = now
    .toLocaleDateString("en-GB", { weekday: "long" })
    .toString() as DayName;
  const minutes = now.getHours() * 60 + now.getMinutes();
  return { dayName, minutes };
};

const resolveSubcategory = (
  item: ItemMeta,
  subsById: Map<string, Subcategory>,
  subsByName: Map<string, Subcategory>
): Subcategory | undefined => {
  if (item.subcategoryId) return subsById.get(item.subcategoryId);
  if (item.subcategoryName) return subsByName.get(item.subcategoryName.toLowerCase());
  return undefined;
};

const resolveSubcategorySchedule = (
  subcategory: Subcategory | undefined,
  item: ItemMeta,
  scheduleById: Map<string, SubcategorySchedule>,
  scheduleByName: Map<string, SubcategorySchedule>
): SubcategorySchedule | undefined => {
  const id = subcategory?.id ?? item.subcategoryId;
  if (id) return scheduleById.get(id);
  const name = subcategory?.name ?? item.subcategoryName;
  return name ? scheduleByName.get(name.toLowerCase()) : undefined;
};

export default function CategoryPage() {
  const { categoryId } = useLocalSearchParams();
  const [data, setData] = useState<ItemState>({
    items: [],
    categories: [],
    subcategories: [],
    mainCategories: [],
    schedules: {
      categorySchedules: [],
      subcategorySchedules: [],
      mainCategorySchedules: [],
      itemSchedules: [],
    },
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
          mainCategories: payload.mainCategories,
          schedules: payload.schedules,
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

  const { dayName, minutes } = getTodayInfo();
  const nowDate = useMemo(() => new Date(), [dayName, minutes]);

  const scheduleMaps = useMemo(() => {
    return {
      catMap: new Map<string, Category>(
        data.categories.map((category) => [category.id, category])
      ),
      mainCategoryMap: new Map<string, MainCategory>(
        data.mainCategories.map((category) => [category.id, category])
      ),
      subcategoryMap: new Map<string, Subcategory>(
        data.subcategories.map((subcategory) => [subcategory.id, subcategory])
      ),
      subcategoryNameMap: new Map<string, Subcategory>(
        data.subcategories.map((subcategory) => [
          subcategory.name.toLowerCase(),
          subcategory,
        ])
      ),
      mainCategoryScheduleMap: new Map(
        data.schedules.mainCategorySchedules.map((schedule) => [
          schedule.mainCategoryId,
          schedule,
        ])
      ),
      catScheduleMap: new Map(
        data.schedules.categorySchedules.map((schedule) => [
          schedule.categoryId,
          schedule,
        ])
      ),
      subcategoryScheduleById: new Map(
        data.schedules.subcategorySchedules.map((schedule) => [
          schedule.subcategoryId,
          schedule,
        ])
      ),
      subcategoryScheduleByName: (() => {
        const map = new Map<string, SubcategorySchedule>();
        data.schedules.subcategorySchedules.forEach((schedule) => {
          const subcategory = data.subcategories.find(
            (entry) => entry.id === schedule.subcategoryId
          );
          if (subcategory?.name) {
            map.set(subcategory.name.toLowerCase(), schedule);
          }
        });
        return map;
      })(),
      itemScheduleMap: new Map<string, ItemSchedule>(
        data.schedules.itemSchedules.map((schedule) => [
          schedule.itemId,
          schedule,
        ])
      ),
    };
  }, [
    data.categories,
    data.mainCategories,
    data.subcategories,
    data.schedules.categorySchedules,
    data.schedules.mainCategorySchedules,
    data.schedules.subcategorySchedules,
    data.schedules.itemSchedules,
  ]);

  const subcategoryLabels = useMemo(() => {
    if (!resolvedCategoryId) return ["All"];
    const { catMap, subcategoryScheduleById } = scheduleMaps;
    const labels = data.subcategories
      .filter((subcategory) => {
        if (subcategory.categoryId !== resolvedCategoryId) return false;
        const parentCategory = subcategory.categoryId
          ? catMap.get(subcategory.categoryId)
          : undefined;
        const schedule = subcategoryScheduleById.get(subcategory.id);
        return isSubcategoryVisible(
          subcategory,
          schedule,
          dayName,
          minutes,
          parentCategory,
          nowDate
        );
      })
      .map((subcategory) => subcategory.name);
    return ["All", ...labels];
  }, [
    data.subcategories,
    dayName,
    minutes,
    nowDate,
    resolvedCategoryId,
    scheduleMaps,
  ]);

  const visibleItems = useMemo(() => {
    const {
      catMap,
      mainCategoryMap,
      subcategoryMap,
      subcategoryNameMap,
      mainCategoryScheduleMap,
      catScheduleMap,
      subcategoryScheduleById,
      subcategoryScheduleByName,
      itemScheduleMap,
    } = scheduleMaps;

    return data.items.filter((item) => {
      const categoryId = resolveCategoryId(item, data.categories);
      if (resolvedCategoryId && categoryId !== resolvedCategoryId) return false;

      const category = categoryId ? catMap.get(categoryId) : undefined;
      const categorySchedule = categoryId ? catScheduleMap.get(categoryId) : undefined;
      const mainCategory = category?.mainCategoryId
        ? mainCategoryMap.get(category.mainCategoryId)
        : undefined;
      const mainCategorySchedule = mainCategory
        ? mainCategoryScheduleMap.get(mainCategory.id)
        : undefined;
      const subcategory = resolveSubcategory(
        item,
        subcategoryMap,
        subcategoryNameMap
      );
      const subcategorySchedule = resolveSubcategorySchedule(
        subcategory,
        item,
        subcategoryScheduleById,
        subcategoryScheduleByName
      );
      const itemSchedule = itemScheduleMap.get(item.itemId);

      return isItemListVisible({
        item,
        category,
        subcategory,
        mainCategory,
        schedules: {
          category: categorySchedule,
          subcategory: subcategorySchedule,
          mainCategory: mainCategorySchedule,
          item: itemSchedule,
        },
        dayName,
        minutes,
        now: nowDate,
      });
    });
  }, [
    data.categories,
    data.items,
    dayName,
    minutes,
    nowDate,
    resolvedCategoryId,
    scheduleMaps,
  ]);

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
