import { useEffect, useMemo, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
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
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState("featured");
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

  const itemCountLabel = `${filteredItems.length} item${
    filteredItems.length === 1 ? "" : "s"
  }`;

  const subcategoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    visibleItems.forEach((item) => {
      const key =
        item.subcategoryId ??
        (item.subcategoryName ? slugify(item.subcategoryName) : "all");
      counts.set(key, (counts.get(key) ?? 0) + 1);
    });
    return counts;
  }, [visibleItems]);

  const banners = [
    {
      id: "banner-1",
      title: "Limited seasonal bundles",
      subtitle: "Save up to 25% across signature items",
      image:
        "https://images.unsplash.com/photo-1473093226795-af9932fe5856?auto=format&fit=crop&w=900&q=80",
    },
    {
      id: "banner-2",
      title: "Fresh picks for today",
      subtitle: "Handpicked produce, delivered fast",
      image:
        "https://images.unsplash.com/photo-1485962398705-ef6a13c41e8f?auto=format&fit=crop&w=900&q=80",
    },
  ];

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
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </Pressable>
        <View style={styles.headerTitle}>
          <Text style={styles.title}>{activeCategoryLabel}</Text>
          <Text style={styles.subtitle}>Fresh picks curated for you</Text>
        </View>
        <Pressable style={styles.searchButton} accessibilityRole="button">
          <Text style={styles.searchText}>🔍</Text>
        </Pressable>
      </View>

      <View style={styles.content}>
        <ScrollView style={styles.left} contentContainerStyle={styles.leftContent}>
          {subcategoryOptions.map((subcategory) => {
            const active = subcategory.id === activeSubcategoryId;
            const count =
              subcategory.id === "all"
                ? visibleItems.length
                : subcategoryCounts.get(subcategory.id) ?? 0;
            return (
              <Pressable
                key={subcategory.id}
                onPress={() => setActiveSubcategoryId(subcategory.id)}
                style={[styles.subcategoryChip, active && styles.subcategoryChipActive]}
              >
                <View
                  style={[
                    styles.subcategoryIcon,
                    active && styles.subcategoryIconActive,
                  ]}
                >
                  <Text style={styles.subcategoryIconText}>
                    {subcategory.name.slice(0, 1).toUpperCase()}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.subcategoryText,
                    active && styles.subcategoryTextActive,
                  ]}
                  numberOfLines={2}
                >
                  {subcategory.name}
                </Text>
                <Text style={styles.subcategoryCount}>{count} items</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <ScrollView style={styles.right} contentContainerStyle={styles.rightContent}>
          {loading && <Text style={styles.status}>Loading items...</Text>}
          {error && <Text style={[styles.status, styles.error]}>{error}</Text>}
          {!loading && !error && (
            <>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.bannerRow}
              >
                {banners.map((banner) => (
                  <View key={banner.id} style={styles.bannerCard}>
                    <Image
                      source={{ uri: banner.image }}
                      style={styles.bannerImage}
                      contentFit="cover"
                    />
                    <View style={styles.bannerOverlay} />
                    <View style={styles.bannerContent}>
                      <Text style={styles.bannerTitle}>{banner.title}</Text>
                      <Text style={styles.bannerSubtitle}>{banner.subtitle}</Text>
                      <View style={styles.bannerButton}>
                        <Text style={styles.bannerButtonText}>Shop now</Text>
                      </View>
                    </View>
                  </View>
                ))}
              </ScrollView>
              <View style={styles.bannerDots}>
                {banners.map((banner, index) => (
                  <View
                    key={banner.id}
                    style={[
                      styles.bannerDot,
                      index === 0 && styles.bannerDotActive,
                    ]}
                  />
                ))}
              </View>
              <View style={styles.filterRow}>
                {[
                  { id: "featured", label: "Featured" },
                  { id: "price-low", label: "Price: Low" },
                  { id: "price-high", label: "Price: High" },
                ].map((filter) => {
                  const active = filter.id === activeFilter;
                  return (
                    <Pressable
                      key={filter.id}
                      onPress={() => setActiveFilter(filter.id)}
                      style={[styles.filterChip, active && styles.filterChipActive]}
                    >
                      <Text
                        style={[
                          styles.filterText,
                          active && styles.filterTextActive,
                        ]}
                      >
                        {filter.label}
                      </Text>
                    </Pressable>
                  );
                })}
                <View style={styles.itemCountPill}>
                  <Text style={styles.itemCountText}>{itemCountLabel}</Text>
                </View>
              </View>
            </>
          )}
          {!loading && !error && filteredItems.length === 0 && (
            <Text style={styles.status}>No items available.</Text>
          )}
          {!loading &&
            !error &&
            filteredItems.length > 0 && (
              <View style={styles.itemGrid}>
                {filteredItems.map((item) => (
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
                      <Pressable style={styles.itemBookmark}>
                        <Text style={styles.itemBookmarkText}>☆</Text>
                      </Pressable>
                      <Pressable style={styles.itemAdd}>
                        <Text style={styles.itemAddText}>＋</Text>
                      </Pressable>
                    </View>
                    <View style={styles.itemMeta}>
                      <Text style={styles.itemName} numberOfLines={2}>
                        {item.name}
                      </Text>
                      {item.description ? (
                        <Text style={styles.itemDescription} numberOfLines={2}>
                          {item.description}
                        </Text>
                      ) : null}
                      <Text style={styles.itemUnit}>1 Unit</Text>
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
              </View>
            )}
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
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#f8fafc",
  },
  backButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  backText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  headerTitle: {
    flex: 1,
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },
  subtitle: {
    marginTop: 2,
    fontSize: 12,
    color: "#94a3b8",
  },
  searchButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    alignItems: "center",
    justifyContent: "center",
  },
  searchText: {
    fontSize: 16,
  },
  content: {
    flex: 1,
    flexDirection: "row",
  },
  left: {
    width: 120,
    backgroundColor: "#f8fafc",
    borderRightWidth: 1,
    borderRightColor: "#e5e7eb",
  },
  leftContent: {
    paddingVertical: 16,
    paddingHorizontal: 12,
    gap: 14,
  },
  subcategoryChip: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 18,
    backgroundColor: "#fff",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  subcategoryChipActive: {
    borderColor: "#111827",
    shadowColor: "#0f172a",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  subcategoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
  },
  subcategoryIconActive: {
    backgroundColor: "#e2e8f0",
  },
  subcategoryIconText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  subcategoryText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#334155",
    textAlign: "center",
  },
  subcategoryTextActive: {
    color: "#111827",
  },
  subcategoryCount: {
    fontSize: 11,
    color: "#94a3b8",
  },
  right: { flex: 1 },
  rightContent: {
    padding: 16,
    gap: 16,
  },
  status: { color: "#6b7280", marginBottom: 12 },
  error: { color: "#dc2626" },
  bannerRow: {
    gap: 14,
    paddingRight: 16,
  },
  bannerCard: {
    width: 260,
    height: 180,
    borderRadius: 24,
    overflow: "hidden",
  },
  bannerImage: {
    width: "100%",
    height: "100%",
  },
  bannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 23, 42, 0.35)",
  },
  bannerContent: {
    position: "absolute",
    bottom: 16,
    left: 16,
    right: 16,
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
  },
  bannerSubtitle: {
    marginTop: 6,
    fontSize: 12,
    color: "#e2e8f0",
  },
  bannerButton: {
    marginTop: 12,
    alignSelf: "flex-start",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: "#fff",
  },
  bannerButtonText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#0f172a",
  },
  bannerDots: {
    flexDirection: "row",
    gap: 6,
    justifyContent: "center",
  },
  bannerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#cbd5f5",
  },
  bannerDotActive: {
    backgroundColor: "#111827",
  },
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    alignItems: "center",
  },
  filterChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  filterChipActive: {
    backgroundColor: "#111827",
    borderColor: "#111827",
  },
  filterText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#475569",
  },
  filterTextActive: {
    color: "#fff",
  },
  itemCountPill: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: "#f1f5f9",
  },
  itemCountText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748b",
  },
  itemGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },
  itemCard: {
    width: "47%",
    padding: 12,
    borderRadius: 18,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    gap: 8,
  },
  itemImageWrap: {
    width: "100%",
    height: 120,
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
    fontSize: 32,
  },
  itemBookmark: {
    position: "absolute",
    top: 8,
    left: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.9)",
    alignItems: "center",
    justifyContent: "center",
  },
  itemBookmarkText: {
    fontSize: 12,
    color: "#111827",
  },
  itemAdd: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#e0f2fe",
    alignItems: "center",
    justifyContent: "center",
  },
  itemAddText: {
    fontSize: 14,
    color: "#0284c7",
    fontWeight: "700",
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
  itemUnit: {
    marginTop: 4,
    fontSize: 11,
    color: "#94a3b8",
  },
  itemFooter: {
    marginTop: 8,
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
