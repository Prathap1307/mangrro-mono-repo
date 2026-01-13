import { ScanCommand, UpdateCommand, DeleteCommand, PutCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient, type DynamoDBClientConfig } from "@aws-sdk/client-dynamodb";
import { getItemImageUrl, deleteItemImage } from "../aws/s3";

export type DietType = "Veg" | "Vegan" | "Non-Veg";

export interface AdminItem {
  id: string;
  name: string;
  price: number;
  category: string;
  categoryId?: string;
  subcategoryId?: string;
  active: boolean;
  ageRestricted: boolean;
  diet?: DietType;
  imageKey?: string;
  imageUrl?: string;
}

export type AdminCategoryType = "main" | "category" | "subcategory";

export interface AdminCategory {
  id: string;
  name: string;
  active: boolean;
  categoryType: AdminCategoryType;
  reason?: string;
  reactivateOn?: string;
  position?: number;
  highlightText?: string;
  parentCategoryId?: string;
  imageKey?: string;
  imageUrl?: string;
  searchKeywords?: string[];
}

export interface DeliveryChargeRule {
  id: string;
  milesStart: number;
  milesEnd: number;
  price: number;
  timeStart?: string;
  timeEnd?: string;
  location?: string;
}


export interface RadiusZone {
  id: string;
  name: string;
  lat: string;
  lng: string;
  radius: string;
}

export interface SurchargeRule {
  id: string;
  reason: string;
  price: string;
  location?: string | null;
}

export interface SchedulerSelection {
  ids: string[];
}

type AdminSettingKey =
  | "delivery-charges"
  | "radius-zones"
  | "surcharge-rules"
  | "item-schedule"
  | "category-schedule"
  | "main-category-schedule"
  | "subcategory-schedule";

function getClient() {
  const config: DynamoDBClientConfig = { region: process.env.AWS_REGION };
  if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    config.credentials = {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    };
  }
  return new DynamoDBClient(config);
}

const ITEMS_TABLE = process.env.AWS_DYNAMODB_TABLE_ITEMS || "";
const CATEGORIES_TABLE = process.env.AWS_DYNAMODB_TABLE_CATEGORIES || "";
const MAIN_CATEGORIES_TABLE =
  process.env.AWS_DYNAMODB_TABLE_MAIN_CATEGORIES || "";
const SUBCATEGORIES_TABLE = process.env.AWS_DYNAMODB_TABLE_SUBCATEGORIES || "";
const SETTINGS_TABLE = process.env.AWS_DDB_ADMIN_SETTINGS_TABLE || "";

export async function listAdminItems(): Promise<AdminItem[]> {
  if (!ITEMS_TABLE) return [];
  const client = getClient();
  const response = await client.send(
    new ScanCommand({
      TableName: ITEMS_TABLE,
    }),
  );

  const items = (response.Items || []).map((item) => ({
    id: item.id as string,
    name: item.name as string,
    price: Number(item.price ?? 0),
    category: (item.category as string) || "",
    categoryId: (item.categoryId as string | undefined)?.trim() || undefined,
    subcategoryId: (item.subcategoryId as string | undefined)?.trim() || undefined,
    active: Boolean(item.active),
    ageRestricted: Boolean(item.ageRestricted),
    diet: item.diet as DietType | undefined,
    imageKey: item.imageKey as string | undefined,
  }));

  const withImages = await Promise.all(
    items.map(async (item) => {
      if (!item.imageKey) return item;
      const imageUrl = await getItemImageUrl(item.imageKey);
      return { ...item, imageUrl };
    }),
  );

  return withImages;
}


export async function saveAdminItem(item: AdminItem) {
  if (!ITEMS_TABLE) return item;
  const client = getClient();

  // If updating an item → check existing imageKey
  if (item.id) {
    const existing = await client.send(
      new GetCommand({ TableName: ITEMS_TABLE, Key: { id: item.id } })
    );

    const oldKey = existing?.Item?.imageKey;
    if (oldKey && oldKey !== item.imageKey) {
      await deleteItemImage(oldKey);
    }
  }

  await client.send(
    new PutCommand({
      TableName: ITEMS_TABLE,
      Item: {
        ...item,
        categoryId: item.categoryId?.trim() || undefined,
        subcategoryId: item.subcategoryId?.trim() || undefined,
      },
    })
  );

  return item;
}

export async function deleteAdminItem(id: string) {
  if (!ITEMS_TABLE) return;
  const client = getClient();
  await client.send(
    new DeleteCommand({
      TableName: ITEMS_TABLE,
      Key: { id },
    }),
  );
}

export async function listAdminCategories(): Promise<AdminCategory[]> {
  if (!CATEGORIES_TABLE) return [];
  const client = getClient();
  const response = await client.send(
    new ScanCommand({
      TableName: CATEGORIES_TABLE,
    }),
  );

  const categories = (response.Items || []).map((item) => ({
    id: item.id as string,
    name: item.name as string,
    active: Boolean(item.active),
    categoryType:
      item.categoryType === "category" || item.categoryType === "subcategory"
        ? (item.categoryType as AdminCategoryType)
        : "main",
    reason: item.reason as string | undefined,
    reactivateOn: item.reactivateOn as string | undefined,
    position: Number(item.position ?? Number.MAX_SAFE_INTEGER),
    highlightText: (item.highlightText as string | undefined)?.trim(),
    parentCategoryId: (item.parentCategoryId as string | undefined)?.trim(),
    imageKey: item.imageKey as string | undefined,
    searchKeywords: Array.isArray(item.searchKeywords)
      ? (item.searchKeywords as string[]).map((keyword) => keyword.trim()).filter(Boolean)
      : [],
  }));

  const withImages = await Promise.all(
    categories.map(async (category) => {
      if (!category.imageKey) return category;
      const imageUrl = await getItemImageUrl(category.imageKey);
      return { ...category, imageUrl };
    }),
  );

  return withImages;
}

export async function listAdminMainCategories(): Promise<AdminCategory[]> {
  if (!MAIN_CATEGORIES_TABLE) return [];
  const client = getClient();
  const response = await client.send(
    new ScanCommand({
      TableName: MAIN_CATEGORIES_TABLE,
    }),
  );

  return (response.Items || []).map((item) => ({
    id: item.id as string,
    name: item.name as string,
    active: Boolean(item.active),
    categoryType: "main",
    reason: item.reason as string | undefined,
    reactivateOn: item.reactivateOn as string | undefined,
    position: Number(item.position ?? Number.MAX_SAFE_INTEGER),
    highlightText: (item.highlightText as string | undefined)?.trim(),
    searchKeywords: [],
  }));
}

export async function listAdminSubcategories(): Promise<AdminCategory[]> {
  if (!SUBCATEGORIES_TABLE) return [];
  const client = getClient();
  const response = await client.send(
    new ScanCommand({
      TableName: SUBCATEGORIES_TABLE,
    }),
  );

  const subcategories = (response.Items || []).map((item) => ({
    id: item.id as string,
    name: item.name as string,
    active: Boolean(item.active),
    categoryType: "subcategory",
    reason: item.reason as string | undefined,
    reactivateOn: item.reactivateOn as string | undefined,
    position: Number(item.position ?? Number.MAX_SAFE_INTEGER),
    highlightText: (item.highlightText as string | undefined)?.trim(),
    parentCategoryId: (item.categoryId as string | undefined)?.trim(),
    imageKey: item.imageKey as string | undefined,
    searchKeywords: [],
  }));

  const withImages = await Promise.all(
    subcategories.map(async (subcategory) => {
      if (!subcategory.imageKey) return subcategory;
      const imageUrl = await getItemImageUrl(subcategory.imageKey);
      return { ...subcategory, imageUrl };
    }),
  );

  return withImages;
}

export async function saveAdminCategory(category: AdminCategory) {
  if (!CATEGORIES_TABLE) return category;
  const client = getClient();
  await client.send(
    new PutCommand({
      TableName: CATEGORIES_TABLE,
      Item: {
        ...category,
        highlightText: category.highlightText?.trim(),
        parentCategoryId: category.parentCategoryId?.trim(),
        searchKeywords: Array.isArray(category.searchKeywords)
          ? category.searchKeywords
              .map((keyword) => keyword.trim())
              .filter(Boolean)
              .slice(0, 20)
          : [],
      },
    }),
  );
  return category;
}

export async function deleteAdminCategory(id: string) {
  if (!CATEGORIES_TABLE) return;
  const client = getClient();
  await client.send(
    new DeleteCommand({
      TableName: CATEGORIES_TABLE,
      Key: { id },
    }),
  );
}

async function getSetting<T>(key: AdminSettingKey, fallback: T): Promise<T> {
  if (!SETTINGS_TABLE) return fallback;
  const client = getClient();
  const response = await client.send(
    new GetCommand({
      TableName: SETTINGS_TABLE,
      Key: { configKey: key },
    }),
  );

  if (!response.Item) return fallback;
  return (response.Item.payload as T) ?? fallback;
}

// --- FIXED saveSetting (CRITICAL BUG FIXED) ---
async function saveSetting<T>(key: AdminSettingKey, payload: T): Promise<T> {
  if (!SETTINGS_TABLE) return payload;
  const client = getClient();

  await client.send(
    new UpdateCommand({
      TableName: SETTINGS_TABLE,
      Key: { configKey: key },
      UpdateExpression: "SET payload = :payload",
      ExpressionAttributeValues: {        // ✅ FIXED NAME
        ":payload": payload,
      },
    })
  );

  return payload;
}

// --- DELIVERY CHARGES STORAGE ---
export async function getDeliveryChargeRules(): Promise<DeliveryChargeRule[]> {
  return getSetting<DeliveryChargeRule[]>("delivery-charges", []);
}

export async function saveDeliveryChargeRules(rules: DeliveryChargeRule[]) {
  return saveSetting("delivery-charges", rules);
}


export async function getRadiusZones(): Promise<RadiusZone[]> {
  return getSetting<RadiusZone[]>("radius-zones", []);
}

export async function saveRadiusZones(zones: RadiusZone[]) {
  return saveSetting("radius-zones", zones);
}

export async function getSurchargeRules(): Promise<SurchargeRule[]> {
  return getSetting<SurchargeRule[]>("surcharge-rules", []);
}

export async function saveSurchargeRules(rules: SurchargeRule[]) {
  return saveSetting("surcharge-rules", rules);
}

export async function getItemSchedulerSelection(): Promise<SchedulerSelection> {
  return getSetting<SchedulerSelection>("item-schedule", { ids: [] });
}

export async function saveItemSchedulerSelection(selection: SchedulerSelection) {
  return saveSetting("item-schedule", selection);
}

export async function getCategorySchedulerSelection(): Promise<SchedulerSelection> {
  return getSetting<SchedulerSelection>("category-schedule", { ids: [] });
}

export async function saveCategorySchedulerSelection(selection: SchedulerSelection) {
  return saveSetting("category-schedule", selection);
}

export async function getMainCategorySchedulerSelection(): Promise<SchedulerSelection> {
  return getSetting<SchedulerSelection>("main-category-schedule", { ids: [] });
}

export async function saveMainCategorySchedulerSelection(selection: SchedulerSelection) {
  return saveSetting("main-category-schedule", selection);
}

export async function getSubcategorySchedulerSelection(): Promise<SchedulerSelection> {
  return getSetting<SchedulerSelection>("subcategory-schedule", { ids: [] });
}

export async function saveSubcategorySchedulerSelection(selection: SchedulerSelection) {
  return saveSetting("subcategory-schedule", selection);
}
