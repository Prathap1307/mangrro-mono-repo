import { ScanCommand } from "@aws-sdk/lib-dynamodb";

import { docClient } from "./client";
import { TABLES } from "./tables";
import type { CategoryTimeslotDay, DayName } from "../../types/homepage";

const apiBaseUrl =
  process.env.EXPO_PUBLIC_WEB_BASE_URL ?? process.env.EXPO_PUBLIC_API_BASE_URL;

interface MainCategoryRaw {
  id?: string;
  mainCategoryId?: string;
  name?: string;
  active?: boolean;
  reactivateOn?: string | null;
}

interface CategoryRaw {
  id?: string;
  categoryId?: string;
  name?: string;
  active?: boolean;
  subcategoryName?: string | null;
  parentCategoryId?: string | null;
  mainCategoryId?: string | null;
  reactivateOn?: string | null;
}

interface SubcategoryRaw {
  id?: string;
  subcategoryId?: string;
  name?: string;
  active?: boolean;
  categoryId?: string | null;
  parentCategoryId?: string | null;
  reactivateOn?: string | null;
}

export interface MainCategory {
  id: string;
  name: string;
  active: boolean;
  reactivateOn?: string;
}

export interface Category {
  id: string;
  name: string;
  active: boolean;
  mainCategoryId?: string;
  reactivateOn?: string;
}

export interface Subcategory {
  id: string;
  name: string;
  active: boolean;
  categoryId?: string;
  reactivateOn?: string;
}

export interface ItemMeta {
  id?: string;
  itemId: string;
  name: string;
  price: number;
  active: boolean;
  ageRestricted: boolean;
  vegType?: string;
  description?: string;
  keywords?: string[];
  imageKey?: string;
  imageUrl?: string;
  category?: string;
  categoryId?: string;
  subcategoryId?: string;
  subcategoryName?: string;
  tag?: string;
}

interface MainCategorySchedule {
  mainCategoryId: string;
  timeslots: Record<DayName, CategoryTimeslotDay | undefined>;
}

interface CategorySchedule {
  categoryId: string;
  timeslots: Record<DayName, CategoryTimeslotDay | undefined>;
}

interface SubcategorySchedule {
  subcategoryId: string;
  timeslots: Record<DayName, CategoryTimeslotDay | undefined>;
}

interface ItemSlot {
  start?: string;
  end?: string;
}

interface ItemSchedule {
  itemId: string;
  timeslots: Record<DayName, ItemSlot[] | undefined>;
}

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
  return {
    id: String(id),
    name: String(raw.name),
    active: normalizeActive(raw.active, true),
    reactivateOn: raw.reactivateOn?.trim() || undefined,
  };
};

const normalizeCategory = (raw: CategoryRaw): Category | null => {
  const id = raw.id ?? raw.categoryId;
  if (!id || !raw.name) return null;
  const mainCategoryId = raw.mainCategoryId?.trim() ?? raw.parentCategoryId?.trim();
  return {
    id: String(id),
    name: String(raw.name),
    active: normalizeActive(raw.active, true),
    mainCategoryId: mainCategoryId || undefined,
    reactivateOn: raw.reactivateOn?.trim() || undefined,
  };
};

const normalizeSubcategory = (raw: SubcategoryRaw): Subcategory | null => {
  const id = raw.id ?? raw.subcategoryId;
  if (!id || !raw.name) return null;
  const categoryId = raw.categoryId?.trim() ?? raw.parentCategoryId?.trim();
  return {
    id: String(id),
    name: String(raw.name),
    active: normalizeActive(raw.active, true),
    categoryId: categoryId || undefined,
    reactivateOn: raw.reactivateOn?.trim() || undefined,
  };
};

const normalizeItem = (raw: any): ItemMeta => ({
  id: raw.id ?? raw.itemId ?? undefined,
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
  categoryId: raw.categoryId?.trim?.() ?? raw.categoryId,
  category: raw.category,
  subcategoryId: raw.subcategoryId?.trim?.() ?? raw.subcategoryId,
  subcategoryName: raw.subcategoryName?.trim?.() ?? raw.subcategoryName,
  tag: raw.tag,
});

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
    })
  ) as Record<DayName, CategoryTimeslotDay | undefined>;
};

const normalizeItemScheduleTimeslots = (
  rawTimeslots: any
): Record<DayName, ItemSlot[] | undefined> => {
  if (!rawTimeslots || typeof rawTimeslots !== "object") {
    return {} as Record<DayName, ItemSlot[] | undefined>;
  }

  const timeslots = {} as Record<DayName, ItemSlot[] | undefined>;

  for (const [day, list] of Object.entries(rawTimeslots)) {
    const slots = Array.isArray(list) ? list : list?.L ?? [];
    timeslots[day as DayName] = slots.map((slot: any) => ({
      start: slot?.M?.start?.S ?? slot?.start,
      end: slot?.M?.end?.S ?? slot?.end,
    }));
  }

  return timeslots;
};

const normalizeCategorySchedule = (raw: any): CategorySchedule | null => {
  const categoryId = raw?.categoryId ?? raw?.categoryID;
  if (!categoryId) return null;
  return {
    categoryId: String(categoryId),
    timeslots: normalizeScheduleTimeslots(raw?.timeslots),
  };
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

const normalizeItemSchedule = (raw: any): ItemSchedule | null => {
  const itemId = raw?.itemId ?? raw?.itemID;
  if (!itemId) return null;
  return {
    itemId: String(itemId),
    timeslots: normalizeItemScheduleTimeslots(raw?.timeslots),
  };
};

const scanTable = async (tableName?: string) => {
  if (!tableName) return [];
  const { Items } = await docClient.send(new ScanCommand({ TableName: tableName }));
  return Array.isArray(Items) ? Items : [];
};

export const resolveCategoryId = (
  item: ItemMeta,
  categories: Category[]
): string | undefined => {
  if (item.categoryId) return item.categoryId;
  if (item.category) {
    const matchById = categories.find((x) => x.id === item.category);
    if (matchById) return matchById.id;
    const matchByName = categories.find((x) => x.name === item.category);
    if (matchByName) return matchByName.id;
  }
  return undefined;
};

export const fetchItemsData = async () => {
  const apiData = await (async () => {
    if (!apiBaseUrl) return null;
    const base = apiBaseUrl.replace(/\/+$/, "");

    try {
      const [
        itemsRes,
        categoriesRes,
        subcategoriesRes,
        mainCategoriesRes,
        categorySchedulesRes,
        subcategorySchedulesRes,
        mainCategorySchedulesRes,
        itemSchedulesRes,
      ] = await Promise.all([
        fetch(`${base}/api/items`),
        fetch(`${base}/api/categories`),
        fetch(`${base}/api/subcategories`),
        fetch(`${base}/api/main-categories`),
        fetch(`${base}/api/schedule/category`),
        fetch(`${base}/api/schedule/subcategory`),
        fetch(`${base}/api/schedule/main-category`),
        fetch(`${base}/api/schedule/item`),
      ]);

      if (!itemsRes.ok || !categoriesRes.ok) return null;

      const [
        rawItems,
        rawCategories,
        rawSubcategories,
        rawMainCategories,
        rawCategorySchedules,
        rawSubcategorySchedules,
        rawMainCategorySchedules,
        rawItemSchedules,
      ] = await Promise.all([
        itemsRes.json(),
        categoriesRes.json(),
        subcategoriesRes.ok ? subcategoriesRes.json() : [],
        mainCategoriesRes.ok ? mainCategoriesRes.json() : [],
        categorySchedulesRes.ok ? categorySchedulesRes.json() : [],
        subcategorySchedulesRes.ok ? subcategorySchedulesRes.json() : [],
        mainCategorySchedulesRes.ok ? mainCategorySchedulesRes.json() : [],
        itemSchedulesRes.ok ? itemSchedulesRes.json() : [],
      ]);

      return {
        rawItems: Array.isArray(rawItems) ? rawItems : [],
        rawCategories: Array.isArray(rawCategories) ? rawCategories : [],
        rawSubcategories: Array.isArray(rawSubcategories) ? rawSubcategories : [],
        rawMainCategories: Array.isArray(rawMainCategories) ? rawMainCategories : [],
        rawCategorySchedules: Array.isArray(rawCategorySchedules)
          ? rawCategorySchedules
          : [],
        rawSubcategorySchedules: Array.isArray(rawSubcategorySchedules)
          ? rawSubcategorySchedules
          : [],
        rawMainCategorySchedules: Array.isArray(rawMainCategorySchedules)
          ? rawMainCategorySchedules
          : [],
        rawItemSchedules: Array.isArray(rawItemSchedules) ? rawItemSchedules : [],
      };
    } catch {
      return null;
    }
  })();

  const [
    rawItems,
    rawCategories,
    rawSubcategories,
    rawMainCategories,
    rawCategorySchedules,
    rawSubcategorySchedules,
    rawMainCategorySchedules,
    rawItemSchedules,
  ] = apiData
    ? [
        apiData.rawItems,
        apiData.rawCategories,
        apiData.rawSubcategories,
        apiData.rawMainCategories,
        apiData.rawCategorySchedules,
        apiData.rawSubcategorySchedules,
        apiData.rawMainCategorySchedules,
        apiData.rawItemSchedules,
      ]
    : await Promise.all([
        scanTable(TABLES.ITEMS),
        scanTable(TABLES.CATEGORIES),
        scanTable(TABLES.SUBCATEGORIES),
        scanTable(TABLES.MAIN_CATEGORIES),
        scanTable(TABLES.CATEGORY_SCHEDULES),
        scanTable(TABLES.SUBCATEGORY_SCHEDULES),
        scanTable(TABLES.MAIN_CATEGORY_SCHEDULES),
        scanTable(TABLES.ITEM_SCHEDULES),
      ]);

  const items = rawItems.map(normalizeItem);
  const categories = rawCategories.map(normalizeCategory).filter(Boolean) as Category[];
  const subcategories = rawSubcategories
    .map(normalizeSubcategory)
    .filter(Boolean) as Subcategory[];
  const mainCategories = rawMainCategories
    .map(normalizeMainCategory)
    .filter(Boolean) as MainCategory[];
  const categorySchedules = rawCategorySchedules
    .map(normalizeCategorySchedule)
    .filter(Boolean) as CategorySchedule[];
  const subcategorySchedules = rawSubcategorySchedules
    .map(normalizeSubcategorySchedule)
    .filter(Boolean) as SubcategorySchedule[];
  const mainCategorySchedules = rawMainCategorySchedules
    .map(normalizeMainCategorySchedule)
    .filter(Boolean) as MainCategorySchedule[];
  const itemSchedules = rawItemSchedules
    .map(normalizeItemSchedule)
    .filter(Boolean) as ItemSchedule[];

  return {
    items,
    categories,
    subcategories,
    mainCategories,
    schedules: {
      categorySchedules,
      subcategorySchedules,
      mainCategorySchedules,
      itemSchedules,
    },
  };
};
