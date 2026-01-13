import { PutCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import {
  getCategorySchedulerSelection,
  getItemSchedulerSelection,
  getMainCategorySchedulerSelection,
  getSubcategorySchedulerSelection,
} from "@/lib/admin/catalog";
import { dynamo } from "@/lib/db/client";
import { TABLES } from "@/lib/db/tables";
import { uploadImage } from "@/lib/storage/s3";
import type {
  CategorySchedule,
  CategoryTimeslotDay,
  DayName,
  ItemSchedule,
  ItemSlot,
  MainCategorySchedule,
  SubcategorySchedule,
} from "@/lib/visibility/items";
import { isItemListVisible } from "@/lib/visibility/items";
import { Item } from "@/types";

export const dynamic = "force-dynamic";

type ImageUploadResult = {
  imageUrl?: string;
  imageKey?: string;
};

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

interface MainCategory {
  id: string;
  name: string;
  active: boolean;
  reactivateOn?: string;
}

interface Category {
  id: string;
  name: string;
  active: boolean;
  mainCategoryId?: string;
  reactivateOn?: string;
}

interface Subcategory {
  id: string;
  name: string;
  active: boolean;
  categoryId?: string;
  reactivateOn?: string;
}

interface ItemMeta extends Omit<Item, "categoryId"> {
  id?: string;
  category?: string;
  categoryId?: string;
  description?: string;
  keywords?: string[];
  imageKey?: string;
  imageUrl?: string;
  subcategoryId?: string;
  subcategoryName?: string;
  tag?: string;
}

const getTodayInfo = (): { dayName: DayName; minutes: number } => {
  const now = new Date();
  const dayName = now
    .toLocaleDateString("en-GB", { weekday: "long" })
    .toString() as DayName;
  const minutes = now.getHours() * 60 + now.getMinutes();
  return { dayName, minutes };
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

const resolveCategory = (item: ItemMeta, cats: Category[]): string | undefined => {
  if (item.categoryId) return item.categoryId;
  if (item.category) {
    const matchById = cats.find((x) => x.id === item.category);
    if (matchById) return matchById.id;
    const matchByName = cats.find((x) => x.name === item.category);
    if (matchByName) return matchByName.id;
  }
  return undefined;
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

const toCustomerSafeItem = (item: ItemMeta) => ({
  id: item.id,
  itemId: item.itemId,
  name: item.name,
  price: item.price,
  categoryId: item.categoryId,
  category: item.category,
  subcategoryId: item.subcategoryId,
  subcategoryName: item.subcategoryName,
  vegType: item.vegType,
  ageRestricted: item.ageRestricted,
  active: item.active,
  description: item.description,
  keywords: item.keywords,
  imageUrl: item.imageUrl,
  imageKey: item.imageKey,
  tag: item.tag,
});

const scanTable = async (tableName?: string) => {
  if (!tableName) return [];
  const { Items } = await dynamo.send(new ScanCommand({ TableName: tableName }));
  return Array.isArray(Items) ? Items : [];
};

async function handleImageUpload(body: any): Promise<ImageUploadResult> {
  if (!body.imageBase64) {
    return {
      imageUrl: body.imageUrl,
      imageKey: body.imageKey,
    };
  }
  if (!body.imageName || !body.imageMimeType) {
    throw new Error("Image name and mime type are required for uploads");
  }

  const buffer = Buffer.from(body.imageBase64, "base64");
  const key = `${Date.now()}-${body.imageName}`;
  const imageUrl = await uploadImage(buffer, key, body.imageMimeType);
  return { imageUrl, imageKey: key };
}

export async function GET() {
  try {
    const [
      rawItems,
      rawCategories,
      rawSubcategories,
      rawMainCategories,
      rawCategorySchedules,
      rawSubcategorySchedules,
      rawMainCategorySchedules,
      rawItemSchedules,
      itemSelection,
      categorySelection,
      mainCategorySelection,
      subcategorySelection,
    ] = await Promise.all([
      scanTable(TABLES.ITEMS),
      scanTable(TABLES.CATEGORIES),
      scanTable(TABLES.SUBCATEGORIES),
      scanTable(TABLES.MAIN_CATEGORIES),
      scanTable(TABLES.CATEGORY_SCHEDULE),
      scanTable(TABLES.SUBCATEGORY_SCHEDULE),
      scanTable(TABLES.MAIN_CATEGORY_SCHEDULE),
      scanTable(TABLES.ITEM_SCHEDULE),
      getItemSchedulerSelection(),
      getCategorySchedulerSelection(),
      getMainCategorySchedulerSelection(),
      getSubcategorySchedulerSelection(),
    ]);

    const items = rawItems.map(normalizeItem);
    const categories = rawCategories
      .map(normalizeCategory)
      .filter(Boolean) as Category[];
    const subcategories = rawSubcategories
      .map(normalizeSubcategory)
      .filter(Boolean) as Subcategory[];
    const mainCategories = rawMainCategories
      .map(normalizeMainCategory)
      .filter(Boolean) as MainCategory[];

    const categorySelectionIds = Array.isArray(categorySelection?.ids)
      ? categorySelection.ids
      : [];
    const itemSelectionIds = Array.isArray(itemSelection?.ids) ? itemSelection.ids : [];
    const mainCategorySelectionIds = Array.isArray(mainCategorySelection?.ids)
      ? mainCategorySelection.ids
      : [];
    const subcategorySelectionIds = Array.isArray(subcategorySelection?.ids)
      ? subcategorySelection.ids
      : [];

    const filteredMainCategorySchedules = Array.isArray(rawMainCategorySchedules)
      ? mainCategorySelectionIds.length
        ? rawMainCategorySchedules.filter((schedule) =>
            mainCategorySelectionIds.includes(schedule.mainCategoryId)
          )
        : rawMainCategorySchedules
      : [];
    const filteredSubcategorySchedules = Array.isArray(rawSubcategorySchedules)
      ? subcategorySelectionIds.length
        ? rawSubcategorySchedules.filter((schedule) =>
            subcategorySelectionIds.includes(schedule.subcategoryId)
          )
        : rawSubcategorySchedules
      : [];
    const filteredCategorySchedules = Array.isArray(rawCategorySchedules)
      ? categorySelectionIds.length
        ? rawCategorySchedules.filter((schedule) =>
            categorySelectionIds.includes(schedule.categoryId)
          )
        : rawCategorySchedules
      : [];
    const filteredItemSchedules = Array.isArray(rawItemSchedules)
      ? itemSelectionIds.length
        ? rawItemSchedules.filter((schedule) =>
            itemSelectionIds.includes(schedule.itemId)
          )
        : rawItemSchedules
      : [];

    const mainCategorySchedules = filteredMainCategorySchedules
      .map(normalizeMainCategorySchedule)
      .filter(Boolean) as MainCategorySchedule[];
    const subcategorySchedules = filteredSubcategorySchedules
      .map(normalizeSubcategorySchedule)
      .filter(Boolean) as SubcategorySchedule[];
    const categorySchedules = filteredCategorySchedules
      .map(normalizeCategorySchedule)
      .filter(Boolean) as CategorySchedule[];
    const itemSchedules = filteredItemSchedules
      .map(normalizeItemSchedule)
      .filter(Boolean) as ItemSchedule[];

    const categoryMap = new Map(categories.map((c) => [c.id, c]));
    const mainCategoryMap = new Map(mainCategories.map((c) => [c.id, c]));
    const subcategoryMap = new Map(subcategories.map((s) => [s.id, s]));
    const subcategoryNameMap = new Map(
      subcategories.map((s) => [s.name.toLowerCase(), s])
    );
    const mainCategoryScheduleMap = new Map(
      mainCategorySchedules.map((schedule) => [schedule.mainCategoryId, schedule])
    );
    const categoryScheduleMap = new Map(
      categorySchedules.map((schedule) => [schedule.categoryId, schedule])
    );
    const subcategoryScheduleById = new Map(
      subcategorySchedules.map((schedule) => [schedule.subcategoryId, schedule])
    );
    const subcategoryScheduleByName = new Map<string, SubcategorySchedule>();
    subcategorySchedules.forEach((schedule) => {
      const subcategory = subcategoryMap.get(schedule.subcategoryId);
      if (subcategory?.name) {
        subcategoryScheduleByName.set(subcategory.name.toLowerCase(), schedule);
      }
    });
    const itemScheduleMap = new Map(
      itemSchedules.map((schedule) => [schedule.itemId, schedule])
    );

    const { dayName, minutes } = getTodayInfo();
    const nowDate = new Date();

    const visibleItems = items.filter((item) => {
      const categoryId = resolveCategory(item, categories);
      const category = categoryId ? categoryMap.get(categoryId) : undefined;
      const categorySchedule = categoryId ? categoryScheduleMap.get(categoryId) : undefined;
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
        subcategoryScheduleByName
      );
      const itemSchedule =
        itemScheduleMap.get(item.itemId) ?? (item.id ? itemScheduleMap.get(item.id) : undefined);

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

    return NextResponse.json(visibleItems.map(toCustomerSafeItem));
  } catch (error) {
    console.error("Failed to fetch items", error);
    return NextResponse.json(
      { error: "Failed to fetch items" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { imageUrl, imageKey } = await handleImageUpload(body);

    // normalise keywords → always an array of strings
    const rawKeywords = body.keywords ?? [];
    const keywords: string[] = Array.isArray(rawKeywords)
      ? rawKeywords.map((k: unknown) => String(k).trim()).filter(Boolean)
      : String(rawKeywords)
          .split(",")
          .map((k) => k.trim())
          .filter(Boolean);

    const item: Item = {
      itemId: body.itemId ?? randomUUID(),
      name: body.name,
      categoryId: body.categoryId,
      subcategoryId: body.subcategoryId ?? undefined,
      subcategoryName: body.subcategoryName ?? undefined,
      price: Number(body.price ?? 0),
      vegType: body.vegType,
      ageRestricted: Boolean(body.ageRestricted),
      active: Boolean(body.active ?? true),
      schedule: body.schedule,
      imageUrl,
      imageKey,

      // NEW FIELDS
      description: body.description ?? "",
      keywords,
    };

    await dynamo.send(
      new PutCommand({
        TableName: TABLES.ITEMS,
        Item: item,
      })
    );

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error("Failed to create item", error);
    return NextResponse.json(
      { error: "Failed to create item" },
      { status: 500 }
    );
  }
}
