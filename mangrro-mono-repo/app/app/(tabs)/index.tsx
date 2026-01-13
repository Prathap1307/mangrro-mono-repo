import { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { fetchHomepageData } from "../../lib/aws/homepage";
import {
  isCategoryOpen,
  isEntityActive,
  isScheduleOpen,
} from "../../lib/visibility/items";
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

  const [mainCategories, setMainCategories] = useState<MainCategory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [mainCatSched, setMainCatSched] = useState<MainCategorySchedule[]>([]);
  const [catSched, setCatSched] = useState<CategorySchedule[]>([]);

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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Mangrro</Text>
        <Text style={styles.subtitle}>
          Browse what&apos;s available right now.
        </Text>
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
                  <View style={styles.categoryGrid}>
                    {childCategories.map((child) => (
                      <View key={child.id} style={styles.categoryCard}>
                        <Text style={styles.categoryName}>{child.name}</Text>
                        {child.highlightText ? (
                          <Text style={styles.categoryHint}>
                            {child.highlightText}
                          </Text>
                        ) : null}
                      </View>
                    ))}
                  </View>
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
    paddingTop: 56,
    paddingBottom: 16,
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
    color: "#0f172a",
  },
  subtitle: {
    marginTop: 6,
    fontSize: 14,
    color: "#64748b",
  },
  placeholderGrid: {
    paddingHorizontal: 20,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  placeholderCard: {
    width: "47%",
    height: 96,
    borderRadius: 16,
    backgroundColor: "#e2e8f0",
    marginBottom: 16,
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
  },
  section: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
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
    color: "#0f172a",
    flex: 1,
  },
  sectionHighlight: {
    fontSize: 11,
    fontWeight: "700",
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 12,
  },
  categoryCard: {
    width: "47%",
    minHeight: 88,
    borderRadius: 16,
    padding: 12,
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    justifyContent: "center",
  },
  categoryName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0f172a",
  },
  categoryHint: {
    marginTop: 6,
    fontSize: 11,
    color: "#64748b",
    textTransform: "uppercase",
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
