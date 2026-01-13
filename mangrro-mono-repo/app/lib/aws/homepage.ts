import { ScanCommand } from "@aws-sdk/lib-dynamodb";

import { docClient } from "./client";
import { TABLES } from "./tables";

const scanTable = async (tableName?: string) => {
  if (!tableName) return [];
  const result = await docClient.send(new ScanCommand({ TableName: tableName }));
  return Array.isArray(result.Items) ? result.Items : [];
};

export const fetchHomepageData = async () => {
  const [mainCategories, categories, mainCategorySchedules, categorySchedules] =
    await Promise.all([
      scanTable(TABLES.MAIN_CATEGORIES),
      scanTable(TABLES.CATEGORIES),
      scanTable(TABLES.MAIN_CATEGORY_SCHEDULES),
      scanTable(TABLES.CATEGORY_SCHEDULES),
    ]);

  return {
    mainCategories,
    categories,
    mainCategorySchedules,
    categorySchedules,
  };
};
