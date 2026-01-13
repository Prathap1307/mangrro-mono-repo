import { tables } from "@/lib/aws/client";

const TABLE_KEYS = {
  ORDERS: "orders",
  ITEMS: "items",
  MAIN_CATEGORIES: "mainCategories",
  MAIN_CATEGORY_SCHEDULE: "mainCategorySchedules",
  CATEGORIES: "categories",
  CATEGORY_SCHEDULE: "categorySchedules",
  SUBCATEGORIES: "subcategories",
  SUBCATEGORY_SCHEDULE: "subcategorySchedules",
  ITEM_SCHEDULE: "itemSchedules",
  DELIVERY_CHARGES: "deliveryCharges",
  RADIUS: "radius",
  SURCHARGE: "surcharge",
  CUSTOMERS: "customers",
  PICKUPS: "pickups",
} as const satisfies Record<string, keyof typeof tables>;

type TableKey = keyof typeof TABLE_KEYS;

function readTableName(key: TableKey) {
  const value = tables[TABLE_KEYS[key]];

  if (!value) {
    if (process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console
      console.warn(`AWS table name for ${TABLE_KEYS[key]} is not configured`);
    }

    return undefined;
  }

  return value;
}

export const TABLES: Record<TableKey, string | undefined> = {
  ORDERS: readTableName("ORDERS"),
  ITEMS: readTableName("ITEMS"),
  MAIN_CATEGORIES: readTableName("MAIN_CATEGORIES"),
  MAIN_CATEGORY_SCHEDULE: readTableName("MAIN_CATEGORY_SCHEDULE"),
  CATEGORIES: readTableName("CATEGORIES"),
  CATEGORY_SCHEDULE: readTableName("CATEGORY_SCHEDULE"),
  SUBCATEGORIES: readTableName("SUBCATEGORIES"),
  SUBCATEGORY_SCHEDULE: readTableName("SUBCATEGORY_SCHEDULE"),
  ITEM_SCHEDULE: readTableName("ITEM_SCHEDULE"),
  DELIVERY_CHARGES: readTableName("DELIVERY_CHARGES"),
  RADIUS: readTableName("RADIUS"),
  SURCHARGE: readTableName("SURCHARGE"),
  CUSTOMERS: readTableName("CUSTOMERS"),
  PICKUPS: readTableName("PICKUPS"),
};

export function getTableName(
  key: TableKey,
  options: { optional?: boolean } = {}
): string | undefined {
  const value = TABLES[key];

  if (!value) {
    if (options.optional) return undefined;
    throw new Error(`AWS table name for ${TABLE_KEYS[key]} is not configured`);
  }

  return value;
}
