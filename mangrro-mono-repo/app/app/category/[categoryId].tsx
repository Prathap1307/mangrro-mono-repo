import { useEffect, useMemo, useState } from "react";
import { useLocalSearchParams } from "expo-router";
import { Image } from "expo-image";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { fetchItemsData, resolveCategoryId } from "../../lib/aws/items";
import { resolveImageUri } from "../../lib/images";
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

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

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
  const [activeSubcategoryId, setActiveSubcategoryId] = useState("all");

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

  useEffect(() => {
    setActiveSubcategoryId("all");
  }, [resolvedCategoryId]);

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

  const subcategoryOptions = useMemo(() => {
    if (!resolvedCategoryId) return [{ id: "all", name: "All" }];
    const { catMap, subcategoryScheduleById } = scheduleMaps;
    const options = data.subcategories
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
      .map((subcategory) => ({
        id: subcategory.id || slugify(subcategory.name),
        name: subcategory.name,
      }));
    return [{ id: "all", name: "All" }, ...options];
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

  const filteredItems = useMemo(() => {
    if (activeSubcategoryId === "all") return visibleItems;
    return visibleItems.filter((item) => {
      const key =
        item.subcategoryId ??
        (item.subcategoryName ? slugify(item.subcategoryName) : "");
      return key === activeSubcategoryId;
    });
  }, [activeSubcategoryId, visibleItems]);

  const activeCategoryLabel = useMemo(() => {
    if (!resolvedCategoryId) return "Items";
    return (
      data.categories.find((category) => category.id === resolvedCategoryId)
        ?.name ?? "Items"
    );
  }, [data.categories, resolvedCategoryId]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{activeCategoryLabel}</Text>
        <Text style={styles.subtitle}>Fresh picks curated for you</Text>
      </View>

      <View style={styles.content}>
        <ScrollView style={styles.left} contentContainerStyle={styles.leftContent}>
          {subcategoryOptions.map((subcategory) => {
            const active = subcategory.id === activeSubcategoryId;
            return (
              <Pressable
                key={subcategory.id}
                onPress={() => setActiveSubcategoryId(subcategory.id)}
                style={[styles.subcategoryChip, active && styles.subcategoryChipActive]}
              >
                <Text
                  style={[
                    styles.subcategoryText,
                    active && styles.subcategoryTextActive,
                  ]}
                >
                  {subcategory.name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <ScrollView style={styles.right} contentContainerStyle={styles.rightContent}>
          {loading && <Text style={styles.status}>Loading items...</Text>}
          {error && <Text style={[styles.status, styles.error]}>{error}</Text>}
          {!loading && !error && filteredItems.length === 0 && (
            <Text style={styles.status}>No items available.</Text>
          )}
          {!loading &&
            !error &&
            filteredItems.map((item) => (
              <View key={item.itemId || item.id} style={styles.itemCard}>
                <View style={styles.itemImageWrap}>
                  {resolveImageUri(item.imageUrl, item.imageKey) ? (
                    <Image
                      source={{
                        uri: resolveImageUri(item.imageUrl, item.imageKey) ?? "",
                      }}
                      style={styles.itemImage}
                      contentFit="cover"
                    />
                  ) : (
                    <Text style={styles.itemEmoji}>🥕</Text>
                  )}
                </View>
                <View style={styles.itemMeta}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  {item.description ? (
                    <Text style={styles.itemDescription} numberOfLines={2}>
                      {item.description}
                    </Text>
                  ) : null}
                  <View style={styles.itemFooter}>
                    <Text style={styles.itemPrice}>
                      £{Number.isFinite(item.price) ? item.price.toFixed(2) : "0.00"}
                    </Text>
                    {item.tag ? (
                      <View style={styles.itemTag}>
                        <Text style={styles.itemTagText}>{item.tag}</Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              </View>
            ))}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: {
    paddingTop: 54,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#111827",
  },
  subtitle: {
    marginTop: 6,
    fontSize: 13,
    color: "#6b7280",
  },
  content: {
    flex: 1,
    flexDirection: "row",
  },
  left: {
    width: 120,
    backgroundColor: "#f1f5f9",
  },
  leftContent: {
    paddingVertical: 16,
    paddingHorizontal: 10,
    gap: 10,
  },
  subcategoryChip: {
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 16,
    backgroundColor: "#e2e8f0",
  },
  subcategoryChipActive: {
    backgroundColor: "#111827",
  },
  subcategoryText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#334155",
  },
  subcategoryTextActive: {
    color: "#fff",
  },
  right: { flex: 1 },
  rightContent: {
    padding: 16,
    gap: 14,
  },
  status: { color: "#6b7280", marginBottom: 12 },
  error: { color: "#dc2626" },
  itemCard: {
    flexDirection: "row",
    gap: 12,
    padding: 12,
    borderRadius: 16,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  itemImageWrap: {
    width: 72,
    height: 72,
    borderRadius: 16,
    backgroundColor: "#f8fafc",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  itemImage: {
    width: "100%",
    height: "100%",
  },
  itemEmoji: {
    fontSize: 28,
  },
  itemMeta: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0f172a",
  },
  itemDescription: {
    marginTop: 4,
    fontSize: 12,
    color: "#64748b",
  },
  itemFooter: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: "700",
    color: "#16a34a",
  },
  itemTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#fef3c7",
  },
  itemTagText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#92400e",
    textTransform: "uppercase",
  },
});
