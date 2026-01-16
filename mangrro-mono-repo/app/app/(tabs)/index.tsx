import { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { Image } from "expo-image";
import { Link } from "expo-router";

import { fetchHomepageData } from "../../lib/aws/homepage";
import { resolveImageUri } from "../../lib/images";
import {
  isCategoryOpen,
  isEntityActive,
  isScheduleOpen,
} from "../../lib/visibility/items";
import { reverseGeocode } from "../../lib/address";
import type {
  Category,
  CategoryRaw,
  CategorySchedule,
  CategoryTimeslotDay,
  DayName,
  MainCategory,
  MainCategoryRaw,
  MainCategorySchedule,
} from "../../types/homepage";

const getTodayInfo = (): { dayName: DayName; minutes: number } => {
  const now = new Date();
  const dayName = now
    .toLocaleDateString("en-GB", { weekday: "long" })
    .toString() as DayName;
  const minutes = now.getHours() * 60 + now.getMinutes();
  return { dayName, minutes };
};

const parsePosition = (value?: number | string) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : Number.MAX_SAFE_INTEGER;
};

const normalizeActive = (value: unknown, fallback = true): boolean => {
  if (typeof value === "boolean") return value;
  if (value && typeof value === "object" && "BOOL" in value) {
    return Boolean((value as { BOOL?: boolean }).BOOL);
  }
  if (typeof value === "string") {
    const lowered = value.toLowerCase();
    if (lowered === "true") return true;
    if (lowered === "false") return false;
  }
  return fallback;
};

const normalizeMainCategory = (raw: MainCategoryRaw): MainCategory | null => {
  const id = raw.id ?? raw.mainCategoryId;
  if (!id || !raw.name) return null;
  const highlight = raw.highlightText?.trim();
  return {
    id: String(id),
    name: String(raw.name),
    active: normalizeActive(raw.active, true),
    position: parsePosition(raw.position),
    highlightText: highlight || undefined,
    reactivateOn: raw.reactivateOn?.trim() || undefined,
  };
};

const normalizeCategory = (raw: CategoryRaw): Category | null => {
  const id = raw.id ?? raw.categoryId;
  if (!id || !raw.name) return null;
  const highlight = raw.highlightText?.trim();
  const subcategoryName = raw.subcategoryName?.trim();
  const mainCategoryId = raw.mainCategoryId?.trim() ?? raw.parentCategoryId?.trim();
  return {
    id: String(id),
    name: String(raw.name),
    active: normalizeActive(raw.active, true),
    position: parsePosition(raw.position),
    highlightText: highlight || undefined,
    imageUrl: raw.imageUrl ?? undefined,
    imageKey: raw.imageKey ?? undefined,
    subcategoryName: subcategoryName || undefined,
    mainCategoryId: mainCategoryId || undefined,
    reactivateOn: raw.reactivateOn?.trim() || undefined,
  };
};

const normalizeScheduleTimeslots = (
  rawTimeslots: any
): Record<DayName, CategoryTimeslotDay | undefined> => {
  if (!rawTimeslots || typeof rawTimeslots !== "object") {
    return {} as Record<DayName, CategoryTimeslotDay | undefined>;
  }

  return Object.fromEntries(
    Object.entries(rawTimeslots).map(([day, slotObj]) => {
      if (!slotObj || typeof slotObj !== "object") {
        return [day, undefined];
      }
      const mapValue = "M" in slotObj ? slotObj.M ?? {} : slotObj;
      return [
        day,
        {
          slot1Start: mapValue.slot1Start?.S ?? mapValue.slot1Start,
          slot1End: mapValue.slot1End?.S ?? mapValue.slot1End,
          slot2Start: mapValue.slot2Start?.S ?? mapValue.slot2Start,
          slot2End: mapValue.slot2End?.S ?? mapValue.slot2End,
        },
      ];
    })
  ) as Record<DayName, CategoryTimeslotDay | undefined>;
};

const normalizeMainCategorySchedule = (raw: any): MainCategorySchedule | null => {
  const mainCategoryId = raw?.mainCategoryId ?? raw?.mainCategoryID;
  if (!mainCategoryId) return null;
  return {
    mainCategoryId: String(mainCategoryId),
    timeslots: normalizeScheduleTimeslots(raw?.timeslots),
  };
};

const normalizeCategorySchedule = (raw: any): CategorySchedule | null => {
  const categoryId = raw?.categoryId ?? raw?.categoryID;
  if (!categoryId) return null;
  return {
    categoryId: String(categoryId),
    timeslots: normalizeScheduleTimeslots(raw?.timeslots),
  };
};

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { width } = useWindowDimensions();

  const [mainCategories, setMainCategories] = useState<MainCategory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [mainCatSched, setMainCatSched] = useState<MainCategorySchedule[]>([]);
  const [catSched, setCatSched] = useState<CategorySchedule[]>([]);
  const [locationLabel, setLocationLabel] = useState("Detecting location...");
  const [locationDetail, setLocationDetail] = useState("");

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await fetchHomepageData();
        if (!mounted) return;

        const normalizedMain = (Array.isArray(data.mainCategories)
          ? data.mainCategories
          : []
        )
          .map(normalizeMainCategory)
          .filter(Boolean) as MainCategory[];

        const normalizedCategories = (Array.isArray(data.categories)
          ? data.categories
          : []
        )
          .map(normalizeCategory)
          .filter(Boolean) as Category[];

        const normalizedMainSchedules = (Array.isArray(data.mainCategorySchedules)
          ? data.mainCategorySchedules
          : []
        )
          .map(normalizeMainCategorySchedule)
          .filter(Boolean) as MainCategorySchedule[];

        const normalizedCategorySchedules = (Array.isArray(data.categorySchedules)
          ? data.categorySchedules
          : []
        )
          .map(normalizeCategorySchedule)
          .filter(Boolean) as CategorySchedule[];

        setMainCategories(normalizedMain);
        setCategories(normalizedCategories);
        setMainCatSched(normalizedMainSchedules);
        setCatSched(normalizedCategorySchedules);
      } catch (err) {
        if (mounted) {
          setError("We couldn't load categories right now.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    const loadLocation = async () => {
      if (!navigator?.geolocation) {
        if (active) {
          setLocationLabel("Set your location");
          setLocationDetail("Location services unavailable");
        }
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            const address = await reverseGeocode(latitude, longitude);
            if (!active) return;
            if (address) {
              setLocationLabel(address.line1 || "Your location");
              setLocationDetail(
                [address.town, address.postcode].filter(Boolean).join(", ")
              );
            } else {
              setLocationLabel("Set your location");
              setLocationDetail("Tap to update");
            }
          } catch (error) {
            if (active) {
              setLocationLabel("Set your location");
              setLocationDetail("Tap to update");
            }
          }
        },
        () => {
          if (active) {
            setLocationLabel("Set your location");
            setLocationDetail("Enable location access");
          }
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
      );
    };

    loadLocation();

    return () => {
      active = false;
    };
  }, []);

  const { dayName, minutes } = getTodayInfo();
  const nowDate = useMemo(() => new Date(), [dayName, minutes]);

  const sortedMainCategories = useMemo(() => {
    return [...mainCategories]
      .filter((category) => {
        if (!isEntityActive(category.active, category.reactivateOn, nowDate)) {
          return false;
        }
        return isScheduleOpen(
          mainCatSched.find((sched) => sched.mainCategoryId === category.id),
          dayName,
          minutes
        );
      })
      .map((cat) => ({
        ...cat,
        position: Number.isFinite(cat.position)
          ? cat.position
          : Number.MAX_SAFE_INTEGER,
      }))
      .sort((a, b) => a.position - b.position);
  }, [dayName, mainCategories, mainCatSched, minutes, nowDate]);

  const sortedCategories = useMemo(() => {
    return [...categories]
      .filter((category) =>
        isCategoryOpen(
          category,
          catSched.find((sched) => sched.categoryId === category.id),
          dayName,
          minutes,
          category.mainCategoryId
            ? mainCategories.find(
                (mainCategory) => mainCategory.id === category.mainCategoryId
              )
            : undefined,
          category.mainCategoryId
            ? mainCatSched.find(
                (sched) => sched.mainCategoryId === category.mainCategoryId
              )
            : undefined,
          nowDate
        )
      )
      .map((cat) => ({
        ...cat,
        position: Number.isFinite(cat.position)
          ? cat.position
          : Number.MAX_SAFE_INTEGER,
      }))
      .sort((a, b) => a.position - b.position);
  }, [catSched, categories, dayName, mainCatSched, mainCategories, minutes, nowDate]);

  const derivedMainCategories = useMemo(() => {
    if (sortedMainCategories.length) return sortedMainCategories;
    const fallback = sortedCategories.filter((category) => !category.mainCategoryId);
    return fallback.map((category, index) => ({
      id: category.id,
      name: category.name,
      active: category.active,
      position: Number.isFinite(category.position) ? category.position : index,
      highlightText: category.highlightText,
    }));
  }, [sortedCategories, sortedMainCategories]);

  const childCategoriesByParent = useMemo(() => {
    const map = new Map<string, Category[]>();
    sortedCategories
      .filter((category) => category.mainCategoryId)
      .forEach((category) => {
        const parentId = category.mainCategoryId as string;
        const current = map.get(parentId) ?? [];
        current.push(category);
        map.set(parentId, current);
      });

    map.forEach((children) => children.sort((a, b) => a.position - b.position));

    return map;
  }, [sortedCategories]);

  const visibleMainCategories = derivedMainCategories;
  const categoryCardSize = useMemo(() => {
    const horizontalPadding = 40;
    const sectionPadding = 32;
    const columnGap = 12;
    const available =
      width - horizontalPadding - sectionPadding - columnGap * 3;
    return Math.max(64, Math.floor(available / 4));
  }, [width]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.locationRow}>
          <View>
            <Text style={styles.locationBadge}>Delivering to</Text>
            <Text style={styles.locationText}>{locationLabel}</Text>
            {locationDetail ? (
              <Text style={styles.locationSubtext}>{locationDetail}</Text>
            ) : null}
          </View>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>M</Text>
          </View>
        </View>
        <View style={styles.searchRow}>
          <View style={styles.searchInput}>
            <Text style={styles.searchHint}>Search for Eggs</Text>
          </View>
          <View style={styles.bookmark}>
            <Text style={styles.bookmarkText}>★</Text>
          </View>
        </View>
      </View>

      <View style={styles.banner}>
        <View style={styles.bannerText}>
          <Text style={styles.bannerTitle}>Coming soon to your area!</Text>
          <Text style={styles.bannerSubtitle}>Try changing your location</Text>
        </View>
        <View style={styles.bannerBadge}>
          <Text style={styles.bannerBadgeText}>🚫</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.placeholderGrid}>
          {Array.from({ length: 6 }).map((_, index) => (
            <View key={`placeholder-${index}`} style={styles.placeholderCard} />
          ))}
        </View>
      ) : error ? (
        <View style={styles.noticeCard}>
          <Text style={styles.noticeText}>{error}</Text>
        </View>
      ) : visibleMainCategories.length === 0 ? (
        <View style={styles.noticeCard}>
          <Text style={styles.noticeText}>
            No categories available right now. Please check back soon.
          </Text>
        </View>
      ) : (
        <View style={styles.sectionStack}>
          {visibleMainCategories.map((category) => {
            const childCategories =
              childCategoriesByParent.get(category.id) ?? [];

            return (
              <View key={category.id} style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>{category.name}</Text>
                  {category.highlightText ? (
                    <Text style={styles.sectionHighlight}>
                      {category.highlightText}
                    </Text>
                  ) : null}
                </View>

                {childCategories.length === 0 ? (
                  <View style={styles.emptyChildCard}>
                    <Text style={styles.emptyChildText}>
                      No subcategories available right now.
                    </Text>
                  </View>
                ) : (
                  <FlatList
                    data={childCategories}
                    keyExtractor={(item) => item.id}
                    numColumns={4}
                    scrollEnabled={false}
                    columnWrapperStyle={styles.categoryRow}
                    renderItem={({ item }) => (
                      <Link href={`/category/${item.id}`} asChild>
                        <Pressable
                          style={[
                            styles.categoryCard,
                            {
                              width: categoryCardSize,
                              height: categoryCardSize,
                            },
                          ]}
                          accessibilityRole="button"
                          accessibilityLabel={`Open ${item.name} category`}
                        >
                          <View style={styles.categoryImage}>
                            {resolveImageUri(item.imageUrl, item.imageKey) ? (
                              <Image
                                source={{
                                  uri:
                                    resolveImageUri(
                                      item.imageUrl,
                                      item.imageKey
                                    ) ?? "",
                                }}
                                style={styles.categoryImageAsset}
                                contentFit="cover"
                              />
                            ) : (
                              <Text style={styles.categoryEmoji}>🥬</Text>
                            )}
                          </View>
                          <Text style={styles.categoryName} numberOfLines={2}>
                            {item.name}
                          </Text>
                          {item.highlightText ? (
                            <Text style={styles.categoryHint} numberOfLines={1}>
                              {item.highlightText}
                            </Text>
                          ) : null}
                        </Pressable>
                      </Link>
                    )}
                  />
                )}
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  content: { paddingBottom: 32 },
  header: {
    paddingHorizontal: 20,
    paddingTop: 54,
    paddingBottom: 12,
    gap: 16,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  locationBadge: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  locationText: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  locationSubtext: {
    marginTop: 2,
    fontSize: 12,
    color: "#6b7280",
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#e5e7eb",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontWeight: "700",
    color: "#374151",
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  searchInput: {
    flex: 1,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  searchHint: {
    fontSize: 14,
    color: "#9ca3af",
  },
  bookmark: {
    width: 48,
    height: 48,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  bookmarkText: {
    fontSize: 18,
    color: "#111827",
  },
  banner: {
    marginHorizontal: 20,
    marginTop: 8,
    padding: 18,
    borderRadius: 20,
    backgroundColor: "#fdecec",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  bannerText: {
    flex: 1,
    paddingRight: 12,
  },
  bannerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1f2937",
  },
  bannerSubtitle: {
    marginTop: 6,
    fontSize: 13,
    color: "#6b7280",
  },
  bannerBadge: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  bannerBadgeText: {
    fontSize: 20,
  },
  placeholderGrid: {
    paddingHorizontal: 20,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  placeholderCard: {
    width: "22%",
    aspectRatio: 1,
    borderRadius: 14,
    backgroundColor: "#e2e8f0",
  },
  noticeCard: {
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 16,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  noticeText: {
    color: "#64748b",
    fontSize: 14,
    lineHeight: 20,
  },
  sectionStack: {
    paddingHorizontal: 20,
    gap: 20,
    marginTop: 16,
  },
  section: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    flex: 1,
  },
  sectionHighlight: {
    fontSize: 11,
    fontWeight: "700",
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  categoryRow: {
    justifyContent: "space-between",
    marginBottom: 12,
  },
  categoryCard: {
    borderRadius: 16,
    padding: 8,
    backgroundColor: "#f8fbff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    justifyContent: "flex-start",
    alignItems: "center",
  },
  categoryImage: {
    width: 40,
    height: 40,
    borderRadius: 18,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    overflow: "hidden",
  },
  categoryImageAsset: {
    width: "100%",
    height: "100%",
  },
  categoryEmoji: {
    fontSize: 28,
  },
  categoryName: {
    fontSize: 11,
    fontWeight: "600",
    color: "#111827",
    textAlign: "center",
  },
  categoryHint: {
    marginTop: 2,
    fontSize: 9,
    color: "#64748b",
    textTransform: "uppercase",
    textAlign: "center",
  },
  emptyChildCard: {
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  emptyChildText: {
    fontSize: 13,
    color: "#94a3b8",
  },
});
