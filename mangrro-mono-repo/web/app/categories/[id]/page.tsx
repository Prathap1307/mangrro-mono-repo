"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { FiArrowLeft, FiSearch } from "react-icons/fi";

import BannerCarousel from "@/components/BannerCarousel";
import ProductCard from "@/components/ProductCard";
import CategorySidebar from "@/components/CategorySidebar";
import Navbar from "@/components/Navbar";
import { useCart } from "@/components/context/CartContext";
import { useFavourites } from "@/components/context/FavouritesContext";
import type { Product } from "@/data/products";
import type { Item } from "@/types";
import type {
  CategorySchedule,
  CategoryTimeslotDay,
  DayName,
  ItemSchedule,
  ItemSlot,
  MainCategorySchedule,
  SubcategorySchedule,
} from "@/lib/visibility/items";
import {
  isCategoryOpen,
  isEntityActive,
  isItemListVisible,
  isScheduleOpen,
  isSubcategoryVisible,
} from "@/lib/visibility/items";

const bannerSlides = [
  {
    title: "Today’s top picks",
    subtitle: "Fresh drops curated for you",
    image:
      "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1600&q=80",
    href: "/categories/top-picks",
  },
  {
    title: "Limited seasonal bundles",
    subtitle: "Save up to 25% across signature items",
    image:
      "https://images.unsplash.com/photo-1546069901-eacef0df6022?auto=format&fit=crop&w=1600&q=80",
    href: "/categories/seasonal-bundles",
  },
  {
    title: "Daily essentials, delivered",
    subtitle: "Restock your favourites in minutes",
    image:
      "https://images.unsplash.com/photo-1481391032119-d89fee407e44?auto=format&fit=crop&w=1600&q=80",
    href: "/categories/daily-essentials",
  },
];

const sortOptions = [
  { id: "featured", label: "Featured" },
  { id: "price-low", label: "Price: Low" },
  { id: "price-high", label: "Price: High" },
];

const priceOptions = [
  { id: "all", label: "Any price" },
  { id: "under-10", label: "Under $10" },
  { id: "10-15", label: "$10 - $15" },
  { id: "15-plus", label: "$15+" },
];

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

interface CategoryRaw {
  id?: string;
  categoryId?: string;
  name?: string;
  active?: boolean;
  position?: number | string;
  highlightText?: string | null;
  imageUrl?: string | null;
  imageKey?: string | null;
  subcategoryName?: string | null;
  parentCategoryId?: string | null;
  mainCategoryId?: string | null;
  reactivateOn?: string | null;
}

interface MainCategoryRaw {
  id?: string;
  mainCategoryId?: string;
  name?: string;
  active?: boolean;
  position?: number | string;
  highlightText?: string | null;
  reactivateOn?: string | null;
}

interface MainCategory {
  id: string;
  name: string;
  active: boolean;
  position: number;
  highlightText?: string;
  reactivateOn?: string;
}

interface Category {
  id: string;
  name: string;
  active: boolean;
  position: number;
  highlightText?: string;
  imageUrl?: string;
  imageKey?: string;
  subcategoryName?: string;
  mainCategoryId?: string;
  reactivateOn?: string;
}

interface SubcategoryRaw {
  id?: string;
  subcategoryId?: string;
  name?: string;
  active?: boolean;
  position?: number | string;
  highlightText?: string | null;
  imageUrl?: string | null;
  imageKey?: string | null;
  categoryId?: string | null;
  parentCategoryId?: string | null;
  reactivateOn?: string | null;
}

interface Subcategory {
  id: string;
  name: string;
  active: boolean;
  position: number;
  highlightText?: string;
  imageUrl?: string;
  imageKey?: string;
  categoryId?: string;
  reactivateOn?: string;
}

const normalizeScheduleTimeslots = (
  rawTimeslots: any,
): Record<DayName, CategoryTimeslotDay | undefined> => {
  if (!rawTimeslots || typeof rawTimeslots !== "object") {
    return {} as Record<DayName, CategoryTimeslotDay | undefined>;
  }

  return Object.fromEntries(
    Object.entries(rawTimeslots).map(([day, slotObj]) => {
      if (!slotObj || typeof slotObj !== "object") {
        return [day, undefined];
      }
      const m = "M" in slotObj ? slotObj.M ?? {} : slotObj;
      return [
        day,
        {
          slot1Start: m.slot1Start?.S ?? m.slot1Start,
          slot1End: m.slot1End?.S ?? m.slot1End,
          slot2Start: m.slot2Start?.S ?? m.slot2Start,
          slot2End: m.slot2End?.S ?? m.slot2End,
        },
      ];
    }),
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

const normalizeSubcategorySchedule = (raw: any): SubcategorySchedule | null => {
  const subcategoryId = raw?.subcategoryId ?? raw?.subcategoryID;
  if (!subcategoryId) return null;
  return {
    subcategoryId: String(subcategoryId),
    timeslots: normalizeScheduleTimeslots(raw?.timeslots),
  };
};

interface SchedulerSelection {
  ids: string[];
}

interface ItemMeta extends Omit<Item, "categoryId"> {
  id?: string;
  category?: string;
  categoryId?: string;
  imageKey?: string;
  description?: string;
  keywords?: string[];
  subcategoryId?: string;
  subcategoryName?: string;
  tag?: string;
}

interface ItemAvailability extends ItemMeta {
  available: boolean;
}

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

function getTodayInfo(): { dayName: DayName; minutes: number } {
  const now = new Date();
  const dayName = now
    .toLocaleDateString("en-GB", { weekday: "long" })
    .toString() as DayName;
  const minutes = now.getHours() * 60 + now.getMinutes();
  return { dayName, minutes };
}

function toMin(t?: string): number | null {
  if (!t) return null;
  const [h, m] = t.split(":").map(Number);
  return isNaN(h) ? null : h * 60 + m;
}

const inRange = (now: number, s?: string, e?: string) => {
  const S = toMin(s);
  const E = toMin(e);
  return S !== null && E !== null && now >= S && now < E;
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

const normalizeSubcategory = (raw: SubcategoryRaw): Subcategory | null => {
  const id = raw.id ?? raw.subcategoryId;
  if (!id || !raw.name) return null;
  const highlight = raw.highlightText?.trim();
  const categoryId = raw.categoryId?.trim() ?? raw.parentCategoryId?.trim();
  return {
    id: String(id),
    name: String(raw.name),
    active: normalizeActive(raw.active, true),
    position: parsePosition(raw.position),
    highlightText: highlight || undefined,
    imageUrl: raw.imageUrl ?? undefined,
    imageKey: raw.imageKey ?? undefined,
    categoryId: categoryId || undefined,
    reactivateOn: raw.reactivateOn?.trim() || undefined,
  };
};

const normalizeItem = (raw: any): ItemMeta => ({
  itemId: raw.itemId ?? raw.id ?? "",
  name: raw.name ?? "",
  price: Number(raw.price ?? 0),
  active: normalizeActive(raw.active, true),
  ageRestricted: Boolean(raw.ageRestricted),
  vegType: raw.vegType ?? "veg",
  description: raw.description ?? "",
  keywords: Array.isArray(raw.keywords) ? raw.keywords : [],
  imageUrl: raw.imageUrl,
  imageKey: raw.imageKey,
  categoryId: raw.categoryId,
  category: raw.category,
  subcategoryId: raw.subcategoryId,
  subcategoryName: raw.subcategoryName,
  schedule: raw.schedule,
  tag: raw.tag,
});

function resolveCategory(item: ItemMeta, cats: Category[]): string | undefined {
  if (item.categoryId) return item.categoryId;
  if (item.category) {
    const matchById = cats.find((x) => x.id === item.category);
    if (matchById) return matchById.id;
    const matchByName = cats.find((x) => x.name === item.category);
    if (matchByName) return matchByName.id;
  }
  return undefined;
}

function resolveSubcategory(
  item: ItemMeta,
  subsById: Map<string, Subcategory>,
  subsByName: Map<string, Subcategory>,
): Subcategory | undefined {
  if (item.subcategoryId) return subsById.get(item.subcategoryId);
  if (item.subcategoryName) return subsByName.get(item.subcategoryName.toLowerCase());
  return undefined;
}

const resolveSubcategorySchedule = (
  subcategory: Subcategory | undefined,
  item: ItemMeta,
  scheduleById: Map<string, SubcategorySchedule>,
  scheduleByName: Map<string, SubcategorySchedule>,
): SubcategorySchedule | undefined => {
  const id = subcategory?.id ?? item.subcategoryId;
  if (id) return scheduleById.get(id);
  const name = subcategory?.name ?? item.subcategoryName;
  return name ? scheduleByName.get(name.toLowerCase()) : undefined;
};

const mapToProduct = (
  item: ItemAvailability,
  cat?: Category,
  closingInfo?: { closingSoon?: boolean; closingMinutes?: number },
): Product => {
  const image = item.imageKey
    ? `/api/image-proxy?key=${encodeURIComponent(item.imageKey)}`
    : item.imageUrl || "/placeholder.webp";

  return {
    id: item.itemId,
    name: item.name,
    price: item.price,
    image,
    category: cat?.name ?? item.category ?? "",
    description: item.description ?? "",
    ageRestricted: item.ageRestricted ?? false,
    keywords: item.keywords ?? [],
    tag: item.tag,
    available: item.available,
    closingSoon: closingInfo?.closingSoon,
    closingMinutes: closingInfo?.closingMinutes,
  };
};

const toItemSlots = (daySlots?: CategoryTimeslotDay): ItemSlot[] => {
  if (!daySlots) return [];
  const slots: ItemSlot[] = [];
  if (daySlots.slot1Start && daySlots.slot1End) {
    slots.push({ start: daySlots.slot1Start, end: daySlots.slot1End });
  }
  if (daySlots.slot2Start && daySlots.slot2End) {
    slots.push({ start: daySlots.slot2Start, end: daySlots.slot2End });
  }
  return slots;
};

const getClosingMinutes = (now: number, slots?: ItemSlot[]): number | null => {
  if (!slots?.length) return null;
  for (const slot of slots) {
    if (inRange(now, slot.start, slot.end)) {
      const endMinutes = toMin(slot.end);
      return endMinutes === null ? null : endMinutes - now;
    }
  }
  return null;
};

const filterProductsByQuery = (products: Product[], q: string) => {
  const query = q.trim().toLowerCase();
  if (!query) return products;

  return products.filter((product) =>
    [product.name, product.description ?? "", ...(product.keywords ?? [])]
      .join(" ")
      .toLowerCase()
      .includes(query),
  );
};

export default function CategoryListingPage() {
  const params = useParams<{ id?: string }>();
  const router = useRouter();
  const { itemCount, reconcileAvailability: reconcileCartAvailability } = useCart();
  const { reconcileAvailability: reconcileFavouritesAvailability } = useFavourites();
  const [timeInfo, setTimeInfo] = useState(getTodayInfo());
  const [sortOption, setSortOption] = useState(sortOptions[0].id);
  const [typeFilter, setTypeFilter] = useState("all");
  const [priceFilter, setPriceFilter] = useState(priceOptions[0].id);
  const [trendingOnly, setTrendingOnly] = useState(false);
  const [activeSubcategoryId, setActiveSubcategoryId] = useState("all");
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);

  const [items, setItems] = useState<ItemMeta[]>([]);
  const [mainCategories, setMainCategories] = useState<MainCategory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [mainCategorySchedules, setMainCategorySchedules] = useState<
    MainCategorySchedule[]
  >([]);
  const [catSchedules, setCatSchedules] = useState<CategorySchedule[]>([]);
  const [subcategorySchedules, setSubcategorySchedules] = useState<
    SubcategorySchedule[]
  >([]);
  const [itemSchedules, setItemSchedules] = useState<ItemSchedule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeInfo(getTodayInfo());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [
        itemsResponse,
        mainCategoriesResponse,
        categoriesResponse,
        subcategoriesResponse,
        mainCategoryScheduleResponse,
        subcategoryScheduleResponse,
        categoryScheduleResponse,
        itemScheduleResponse,
        mainCategorySelectionResponse,
        subcategorySelectionResponse,
        categorySelectionResponse,
        itemSelectionResponse,
      ] =
        await Promise.all([
        fetch("/api/items"),
        fetch("/api/main-categories"),
        fetch("/api/categories"),
        fetch("/api/subcategories"),
        fetch("/api/schedule/main-category"),
        fetch("/api/schedule/subcategory"),
        fetch("/api/schedule/category"),
        fetch("/api/schedule/item"),
        fetch("/api/admin/settings/main-category-schedule"),
        fetch("/api/admin/settings/subcategory-schedule"),
        fetch("/api/admin/settings/category-schedule"),
        fetch("/api/admin/settings/item-schedule"),
      ]);

      const [
        itemsJson,
        mainCategoriesJson,
        categoriesJson,
        subcategoriesJson,
        mainCategoryScheduleJson,
        subcategoryScheduleJson,
        categoryScheduleJson,
        itemScheduleJson,
        mainCategorySelectionJson,
        subcategorySelectionJson,
        categorySelectionJson,
        itemSelectionJson,
      ] = await Promise.all([
        itemsResponse.json(),
        mainCategoriesResponse.json(),
        categoriesResponse.json(),
        subcategoriesResponse.json(),
        mainCategoryScheduleResponse.ok ? mainCategoryScheduleResponse.json() : [],
        subcategoryScheduleResponse.ok ? subcategoryScheduleResponse.json() : [],
        categoryScheduleResponse.ok ? categoryScheduleResponse.json() : [],
        itemScheduleResponse.ok ? itemScheduleResponse.json() : [],
        mainCategorySelectionResponse.ok
          ? mainCategorySelectionResponse.json()
          : { ids: [] },
        subcategorySelectionResponse.ok
          ? subcategorySelectionResponse.json()
          : { ids: [] },
        categorySelectionResponse.ok
          ? categorySelectionResponse.json()
          : { ids: [] },
        itemSelectionResponse.ok
          ? itemSelectionResponse.json()
          : { ids: [] },
      ]);

      const normalizedMainCategories = (Array.isArray(mainCategoriesJson)
        ? mainCategoriesJson
        : []
      )
        .map(normalizeMainCategory)
        .filter(Boolean) as MainCategory[];

      const normalizedCategories = (Array.isArray(categoriesJson)
        ? categoriesJson
        : []
      )
        .map(normalizeCategory)
        .filter(Boolean) as Category[];

      const normalizedSubcategories = (Array.isArray(subcategoriesJson)
        ? subcategoriesJson
        : []
      )
        .map(normalizeSubcategory)
        .filter(Boolean) as Subcategory[];

      const mainCategorySelectionIds = Array.isArray(
        (mainCategorySelectionJson as SchedulerSelection)?.ids,
      )
        ? (mainCategorySelectionJson as SchedulerSelection).ids
        : [];
      const subcategorySelectionIds = Array.isArray(
        (subcategorySelectionJson as SchedulerSelection)?.ids,
      )
        ? (subcategorySelectionJson as SchedulerSelection).ids
        : [];
      const categorySelectionIds = Array.isArray(
        (categorySelectionJson as SchedulerSelection)?.ids,
      )
        ? (categorySelectionJson as SchedulerSelection).ids
        : [];
      const itemSelectionIds = Array.isArray(
        (itemSelectionJson as SchedulerSelection)?.ids,
      )
        ? (itemSelectionJson as SchedulerSelection).ids
        : [];

      const filteredMainCategorySchedules = Array.isArray(mainCategoryScheduleJson)
        ? mainCategorySelectionIds.length
          ? mainCategoryScheduleJson.filter((schedule) =>
              mainCategorySelectionIds.includes(schedule.mainCategoryId),
            )
          : mainCategoryScheduleJson
        : [];
      const filteredSubcategorySchedules = Array.isArray(subcategoryScheduleJson)
        ? subcategorySelectionIds.length
          ? subcategoryScheduleJson.filter((schedule) =>
              subcategorySelectionIds.includes(schedule.subcategoryId),
            )
          : subcategoryScheduleJson
        : [];
      const filteredCategorySchedules = Array.isArray(categoryScheduleJson)
        ? categorySelectionIds.length
          ? categoryScheduleJson.filter((schedule) =>
              categorySelectionIds.includes(schedule.categoryId),
            )
          : categoryScheduleJson
        : [];
      const filteredItemSchedules = Array.isArray(itemScheduleJson)
        ? itemSelectionIds.length
          ? itemScheduleJson.filter((schedule) =>
              itemSelectionIds.includes(schedule.itemId),
            )
          : itemScheduleJson
        : [];

      const normalizedMainCategorySchedules = filteredMainCategorySchedules
        .map(normalizeMainCategorySchedule)
        .filter(Boolean) as MainCategorySchedule[];
      const normalizedSubcategorySchedules = filteredSubcategorySchedules
        .map(normalizeSubcategorySchedule)
        .filter(Boolean) as SubcategorySchedule[];

      setMainCategories(normalizedMainCategories);
      setCategories(normalizedCategories);
      setSubcategories(normalizedSubcategories);
      setItems((Array.isArray(itemsJson) ? itemsJson : []).map(normalizeItem));
      setMainCategorySchedules(normalizedMainCategorySchedules);
      setCatSchedules(filteredCategorySchedules);
      setSubcategorySchedules(normalizedSubcategorySchedules);
      setItemSchedules(filteredItemSchedules);
      setLoading(false);
    })();
  }, []);

  const { dayName, minutes } = timeInfo;
  const nowDate = useMemo(() => new Date(), [dayName, minutes]);

  const scheduleMaps = useMemo(() => {
    return {
      catMap: new Map(categories.map((category) => [category.id, category])),
      mainCategoryMap: new Map(
        mainCategories.map((category) => [category.id, category]),
      ),
      subcategoryMap: new Map(
        subcategories.map((subcategory) => [subcategory.id, subcategory]),
      ),
      subcategoryNameMap: new Map(
        subcategories.map((subcategory) => [
          subcategory.name.toLowerCase(),
          subcategory,
        ]),
      ),
      mainCategoryScheduleMap: new Map(
        mainCategorySchedules.map((schedule) => [schedule.mainCategoryId, schedule]),
      ),
      catScheduleMap: new Map(
        catSchedules.map((schedule) => [schedule.categoryId, schedule]),
      ),
      subcategoryScheduleById: new Map(
        subcategorySchedules.map((schedule) => [schedule.subcategoryId, schedule]),
      ),
      subcategoryScheduleByName: (() => {
        const map = new Map<string, SubcategorySchedule>();
        subcategorySchedules.forEach((schedule) => {
          const subcategory = subcategories.find(
            (entry) => entry.id === schedule.subcategoryId,
          );
          if (subcategory?.name) {
            map.set(subcategory.name.toLowerCase(), schedule);
          }
        });
        return map;
      })(),
      itemScheduleMap: new Map(
        itemSchedules.map((schedule) => [schedule.itemId, schedule]),
      ),
    };
  }, [
    categories,
    mainCategories,
    subcategories,
    mainCategorySchedules,
    catSchedules,
    subcategorySchedules,
    itemSchedules,
  ]);

  const itemsWithAvailability = useMemo(() => {
    if (loading) return [];
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

    return items
      .map((item) => {
      const categoryId = resolveCategory(item, categories);
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
        subcategoryNameMap,
      );
      const subcategorySchedule = resolveSubcategorySchedule(
        subcategory,
        item,
        subcategoryScheduleById,
        subcategoryScheduleByName,
      );
      const itemSchedule = itemScheduleMap.get(item.itemId);
      // List visibility uses schedule windows; direct access checks are separate.
      const available = isItemListVisible({
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
        return available ? { ...item, available } : null;
      })
      .filter(Boolean) as ItemAvailability[];
  }, [
    catSchedules,
    categories,
    dayName,
    itemSchedules,
    items,
    loading,
    minutes,
    mainCategories,
    mainCategorySchedules,
    subcategories,
    subcategorySchedules,
    nowDate,
    scheduleMaps,
  ]);

  const availableItemIds = useMemo(
    () =>
      itemsWithAvailability
        .filter((item) => item.available)
        .map((item) => item.itemId),
    [itemsWithAvailability],
  );

  const mainCategoriesSorted = useMemo(() => {
    const normalized = mainCategories
      .filter((category) => {
        if (!isEntityActive(category.active, category.reactivateOn, nowDate)) {
          return false;
        }
        return isScheduleOpen(
          mainCategorySchedules.find(
            (schedule) => schedule.mainCategoryId === category.id,
          ),
          dayName,
          minutes,
        );
      })
      .sort((a, b) => a.position - b.position);
    if (normalized.length) return normalized;
    const fallback = categories.filter((category) => !category.mainCategoryId);
    return fallback.map((category, index) => ({
      id: category.id,
      name: category.name,
      active: isEntityActive(category.active, category.reactivateOn, nowDate),
      position: Number.isFinite(category.position) ? category.position : index,
      highlightText: category.highlightText,
    }));
  }, [categories, dayName, mainCategories, mainCategorySchedules, minutes, nowDate]);

  const mainCategoryScheduleMap = useMemo(
    () =>
      new Map(
        mainCategorySchedules.map((schedule) => [schedule.mainCategoryId, schedule]),
      ),
    [mainCategorySchedules],
  );

  const categoryScheduleMap = useMemo(
    () => new Map(catSchedules.map((schedule) => [schedule.categoryId, schedule])),
    [catSchedules],
  );

  const mainCategoryMap = useMemo(
    () => new Map(mainCategories.map((category) => [category.id, category])),
    [mainCategories],
  );

  const isMainCategoryAvailable = (category: MainCategory) =>
    isEntityActive(category.active, category.reactivateOn, nowDate) &&
    isScheduleOpen(mainCategoryScheduleMap.get(category.id), dayName, minutes);

  const isCategoryAvailable = (category: Category) => {
    const mainCategory = category.mainCategoryId
      ? mainCategoryMap.get(category.mainCategoryId)
      : undefined;
    const mainCategorySchedule = mainCategory
      ? mainCategoryScheduleMap.get(mainCategory.id)
      : undefined;
    return isCategoryOpen(
      category,
      categoryScheduleMap.get(category.id),
      dayName,
      minutes,
      mainCategory,
      mainCategorySchedule,
      nowDate,
    );
  };

  const availableCategories = useMemo(
    () =>
      categories
        .filter((category) => isCategoryAvailable(category))
        .sort((a, b) => a.position - b.position),
    [
      categories,
      dayName,
      minutes,
      nowDate,
      mainCategoryMap,
      mainCategoryScheduleMap,
      categoryScheduleMap,
    ],
  );

  const firstActiveMainCategory = mainCategoriesSorted[0] ?? null;
  const firstActiveCategory = availableCategories[0] ?? null;

  const activeMainCategory =
    mainCategoriesSorted.find((category) => category.id === params?.id) ?? null;

  const activeCategoryCandidate =
    categories.find((category) => category.id === params?.id) ??
    (activeMainCategory ? null : categories[0] ?? null);

  const activeCategory =
    activeCategoryCandidate && isCategoryAvailable(activeCategoryCandidate)
      ? activeCategoryCandidate
      : null;

  const requestedMainCategory =
    mainCategories.find((category) => category.id === params?.id) ?? null;
  const requestedCategory =
    categories.find((category) => category.id === params?.id) ?? null;
  const requestedMainActive = requestedMainCategory
    ? isMainCategoryAvailable(requestedMainCategory)
    : false;
  const requestedCategoryActive = requestedCategory
    ? isCategoryAvailable(requestedCategory)
    : false;
  const requestedInvalid =
    !loading &&
    Boolean(params?.id) &&
    (requestedMainCategory
      ? !requestedMainActive
      : requestedCategory
        ? !requestedCategoryActive
        : true);

  const redirectTargetId = firstActiveMainCategory?.id ?? firstActiveCategory?.id ?? null;
  const showUnavailable = requestedInvalid && !redirectTargetId;

  useEffect(() => {
    if (!requestedInvalid) return;
    if (!redirectTargetId || redirectTargetId === params?.id) return;
    router.replace(`/categories/${redirectTargetId}`);
  }, [params?.id, redirectTargetId, requestedInvalid, router]);

  useEffect(() => {
    setActiveSubcategoryId("all");
  }, [activeCategory?.id, activeMainCategory?.id]);

  const activeCategoryIds = useMemo(() => {
    if (showUnavailable) return [];
    if (activeMainCategory) {
      return categories
        .filter((category) => category.mainCategoryId === activeMainCategory.id)
        .map((category) => category.id);
    }
    if (activeCategory) return [activeCategory.id];
    return categories.map((category) => category.id);
  }, [activeCategory, activeMainCategory, categories, showUnavailable]);

  const typeOptions = useMemo(() => {
    const names = new Set<string>();
    for (const item of itemsWithAvailability) {
      const categoryId = resolveCategory(item, categories);
      if (activeCategoryIds.length && categoryId && !activeCategoryIds.includes(categoryId)) {
        continue;
      }
      if (item.subcategoryName) {
        names.add(item.subcategoryName);
      } else if (item.category) {
        names.add(item.category);
      }
    }

    return ["all", ...Array.from(names).map(slugify)];
  }, [activeCategory?.id, activeCategoryIds.length, categories, itemsWithAvailability]);

  const categoryItems = useMemo(() => {
    if (showUnavailable) return [];
    if (!activeCategoryIds.length) return itemsWithAvailability;
    return itemsWithAvailability.filter((item) => {
      const categoryId = resolveCategory(item, categories);
      return categoryId ? activeCategoryIds.includes(categoryId) : false;
    });
  }, [activeCategoryIds, categories, itemsWithAvailability, showUnavailable]);

  const subcategoryOptions = useMemo(() => {
    if (!activeCategoryIds.length) {
      return [{ id: "all", name: "All", count: itemsWithAvailability.length }];
    }

    const { catMap, subcategoryScheduleById } = scheduleMaps;
    const subcategoryMap = new Map<
      string,
      { id: string; name: string; count: number; imageUrl?: string; imageKey?: string }
    >();
    const subcategoryLookup = new Map<string, Subcategory>();
    const subcategorySlugLookup = new Map<string, Subcategory>();

    for (const subcategory of subcategories) {
      if (!subcategory.categoryId) continue;
      if (!activeCategoryIds.includes(subcategory.categoryId)) continue;
      const parentCategory = catMap.get(subcategory.categoryId);
      const subcategorySchedule = subcategoryScheduleById.get(subcategory.id);
      if (
        !isSubcategoryVisible(
          subcategory,
          subcategorySchedule,
          dayName,
          minutes,
          parentCategory,
          nowDate,
        )
      )
        continue;
      subcategoryLookup.set(subcategory.id, subcategory);
      subcategorySlugLookup.set(slugify(subcategory.name), subcategory);
      subcategoryMap.set(subcategory.id, {
        id: subcategory.id,
        name: subcategory.name,
        count: 0,
        imageUrl: subcategory.imageUrl,
        imageKey: subcategory.imageKey,
      });
    }

    for (const item of categoryItems) {
      const key =
        item.subcategoryId ??
        (item.subcategoryName ? slugify(item.subcategoryName) : undefined);
      if (!key) continue;
      const existing = subcategoryMap.get(key);
      if (existing) {
        existing.count += 1;
      } else {
        const match = subcategoryLookup.get(key) ?? subcategorySlugLookup.get(key);
        subcategoryMap.set(key, {
          id: key,
          name: item.subcategoryName ?? key,
          count: 1,
          imageUrl: match?.imageUrl,
          imageKey: match?.imageKey,
        });
      }
    }

    const list = Array.from(subcategoryMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name),
    );

    return [{ id: "all", name: "All", count: categoryItems.length }, ...list];
  }, [
    activeCategoryIds,
    categoryItems,
    dayName,
    itemsWithAvailability.length,
    minutes,
    nowDate,
    scheduleMaps,
    subcategories,
  ]);

  const filteredBySubcategory = useMemo(() => {
    if (activeSubcategoryId === "all") return categoryItems;
    return categoryItems.filter((item) => {
      const key =
        item.subcategoryId ??
        (item.subcategoryName ? slugify(item.subcategoryName) : undefined);
      return key === activeSubcategoryId;
    });
  }, [activeSubcategoryId, categoryItems]);

  const getItemClosingInfo = useCallback(
    (item: ItemMeta) => {
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
      const categoryId = resolveCategory(item, categories);
      const category = categoryId ? catMap.get(categoryId) : undefined;
      const categorySchedule = categoryId ? catScheduleMap.get(categoryId) : undefined;
      const mainCategory = category?.mainCategoryId
        ? mainCategoryMap.get(category.mainCategoryId)
        : undefined;
      const mainCategorySchedule = mainCategory
        ? mainCategoryScheduleMap.get(mainCategory.id)
        : undefined;
      const subcategory = resolveSubcategory(item, subcategoryMap, subcategoryNameMap);
      const subcategorySchedule = resolveSubcategorySchedule(
        subcategory,
        item,
        subcategoryScheduleById,
        subcategoryScheduleByName,
      );
      const itemSchedule = itemScheduleMap.get(item.itemId);

    const scheduleCandidates: Array<ItemSlot[] | undefined> = [
      itemSchedule?.timeslots[dayName],
      toItemSlots(subcategorySchedule?.timeslots[dayName]),
      toItemSlots(categorySchedule?.timeslots[dayName]),
      toItemSlots(mainCategorySchedule?.timeslots[dayName]),
    ];

    for (const slots of scheduleCandidates) {
      if (!slots?.length) continue;
      const minutesToClose = getClosingMinutes(minutes, slots);
      if (minutesToClose !== null) {
        return {
          closingSoon: minutesToClose <= 10,
          closingMinutes: minutesToClose,
        };
      }
      return { closingSoon: false, closingMinutes: undefined };
    }

    return { closingSoon: false, closingMinutes: undefined };
    },
    [categories, dayName, minutes, scheduleMaps],
  );

  const visibleProducts = useMemo(() => {
    const typeFiltered =
      typeFilter === "all"
        ? filteredBySubcategory
        : filteredBySubcategory.filter((item) => {
            const candidate = item.subcategoryName ?? item.category ?? "";
            return slugify(candidate) === typeFilter;
          });

    const priceFiltered = typeFiltered.filter((product) => {
      if (priceFilter === "under-10") return product.price < 10;
      if (priceFilter === "10-15") return product.price >= 10 && product.price <= 15;
      if (priceFilter === "15-plus") return product.price > 15;
      return true;
    });

    const trendingFiltered = trendingOnly
      ? priceFiltered.filter((product) => product.tag === "Trending")
      : priceFiltered;

    const productList = trendingFiltered.map((item) => {
      const category = categories.find(
        (cat) => cat.id === resolveCategory(item, categories),
      );
      const closingInfo = getItemClosingInfo(item);
      return mapToProduct(item, category, closingInfo);
    });

    const sorted = [...filterProductsByQuery(productList, search)];
    if (sortOption === "price-low") {
      sorted.sort((a, b) => a.price - b.price);
    } else if (sortOption === "price-high") {
      sorted.sort((a, b) => b.price - a.price);
    }

    return sorted;
  }, [
    activeCategory,
    categories,
    dayName,
    filteredBySubcategory,
    getItemClosingInfo,
    minutes,
    priceFilter,
    search,
    sortOption,
    trendingOnly,
    typeFilter,
  ]);

  useEffect(() => {
    if (loading || !itemsWithAvailability.length) return;
    reconcileCartAvailability(availableItemIds);
    reconcileFavouritesAvailability(availableItemIds);
  }, [
    availableItemIds,
    itemsWithAvailability.length,
    loading,
    reconcileCartAvailability,
    reconcileFavouritesAvailability,
  ]);

  const handleClearFilters = () => {
    setSortOption(sortOptions[0].id);
    setTypeFilter("all");
    setPriceFilter(priceOptions[0].id);
    setTrendingOnly(false);
    setSearch("");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="px-4 pb-16 pt-10 sm:px-6 lg:px-12">
        <div className="mx-auto w-full max-w-6xl">
          <div className="grid w-full gap-5 grid-cols-[minmax(96px,20%)_1fr] lg:gap-6">
            <CategorySidebar
              categories={subcategoryOptions}
              activeId={activeSubcategoryId}
              onSelect={setActiveSubcategoryId}
              title="Subcategories"
            />

            <main className="min-w-0 space-y-5 pb-24">
              <header className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="rounded-full border border-gray-200 bg-white p-2 text-gray-600"
                  aria-label="Go back"
                >
                  <FiArrowLeft size={18} />
                </button>
                <h1 className="text-base font-semibold text-gray-900">
                  {activeMainCategory?.name ?? activeCategory?.name ?? "All"}
                </h1>
                <button
                  type="button"
                  onClick={() => setSearchOpen((value) => !value)}
                  className="rounded-full border border-gray-200 bg-white p-2 text-gray-600"
                  aria-label="Search"
                >
                  <FiSearch size={18} />
                </button>
              </header>

              {searchOpen && (
                <div>
                  <input
                    type="search"
                    placeholder="Search products"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    className="h-9 w-full rounded-full border border-gray-200 bg-white px-4 text-xs font-medium text-gray-700"
                  />
                </div>
              )}

              {showUnavailable ? (
                <div className="rounded-3xl border border-dashed border-gray-200 bg-white px-6 py-12 text-center">
                  <p className="text-sm font-semibold text-gray-900">
                    Currently unavailable
                  </p>
                  <p className="mt-2 text-xs text-gray-500">
                    Please check back later for availability.
                  </p>
                </div>
              ) : (
                <>
                  <BannerCarousel slides={bannerSlides} />

                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {sortOptions.map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => setSortOption(option.id)}
                        className={`h-8 shrink-0 rounded-full border px-3 text-[11px] font-semibold ${
                          sortOption === option.id
                            ? "border-transparent bg-gray-900 text-white"
                            : "border-gray-200 bg-white text-gray-600"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                    {typeOptions.map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setTypeFilter(option)}
                        className={`h-8 shrink-0 rounded-full border px-3 text-[11px] font-semibold ${
                          typeFilter === option
                            ? "border-transparent bg-gray-900 text-white"
                            : "border-gray-200 bg-white text-gray-600"
                        }`}
                      >
                        {option === "all" ? "All types" : option.replace(/-/g, " ")}
                      </button>
                    ))}
                    {priceOptions.map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => setPriceFilter(option.id)}
                        className={`h-8 shrink-0 rounded-full border px-3 text-[11px] font-semibold ${
                          priceFilter === option.id
                            ? "border-transparent bg-gray-900 text-white"
                            : "border-gray-200 bg-white text-gray-600"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setTrendingOnly((value) => !value)}
                      className={`h-8 shrink-0 rounded-full border px-3 text-[11px] font-semibold ${
                        trendingOnly
                          ? "border-transparent bg-gray-900 text-white"
                          : "border-gray-200 bg-white text-gray-600"
                      }`}
                    >
                      Trending
                    </button>
                    <button
                      type="button"
                      onClick={handleClearFilters}
                      className="h-8 shrink-0 rounded-full border border-gray-200 bg-white px-3 text-[11px] font-semibold text-gray-600"
                    >
                      Clear filters
                    </button>
                  </div>

                  <section className="space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
                      {loading ? "Loading..." : `${visibleProducts.length} items`}
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      {visibleProducts.map((product) => (
                        <ProductCard key={product.id} product={product} />
                      ))}
                    </div>
                  </section>
                </>
              )}
            </main>
          </div>
        </div>
      </div>
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-gray-200 bg-white px-4 py-3">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-gray-400">Cart</p>
            <p className="text-sm font-semibold text-gray-900">
              {itemCount} item{itemCount === 1 ? "" : "s"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => router.push("/cart")}
            className="rounded-full bg-gray-900 px-5 py-2 text-sm font-semibold text-white"
          >
            View Cart
          </button>
        </div>
      </div>
    </div>
  );
}
