import { ScanCommand } from "@aws-sdk/lib-dynamodb";

import { docClient } from "./client";
import { TABLES } from "./tables";

const scanTable = async (tableName?: string) => {
  if (!tableName) return [];
  const result = await docClient.send(new ScanCommand({ TableName: tableName }));
  return Array.isArray(result.Items) ? result.Items : [];
};

export const fetchCatalogData = async () => {
  const [
    items,
    mainCategories,
    categories,
    subcategories,
    mainCategorySchedules,
    categorySchedules,
    subcategorySchedules,
    itemSchedules,
  ] = await Promise.all([
    scanTable(TABLES.ITEMS),
    scanTable(TABLES.MAIN_CATEGORIES),
    scanTable(TABLES.CATEGORIES),
    scanTable(TABLES.SUBCATEGORIES),
    scanTable(TABLES.MAIN_CATEGORY_SCHEDULES),
    scanTable(TABLES.CATEGORY_SCHEDULES),
    scanTable(TABLES.SUBCATEGORY_SCHEDULES),
    scanTable(TABLES.ITEM_SCHEDULES),
  ]);

  return {
    items,
    mainCategories,
    categories,
    subcategories,
    mainCategorySchedules,
    categorySchedules,
    subcategorySchedules,
    itemSchedules,
  };
};
