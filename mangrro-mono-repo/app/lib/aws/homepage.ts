import { ScanCommand } from "@aws-sdk/lib-dynamodb";

import { docClient } from "./client";
import { TABLES } from "./tables";

const apiBaseUrl =
  process.env.EXPO_PUBLIC_WEB_BASE_URL ?? process.env.EXPO_PUBLIC_API_BASE_URL;

const scanTable = async (tableName?: string) => {
  if (!tableName) return [];
  const result = await docClient.send(new ScanCommand({ TableName: tableName }));
  return Array.isArray(result.Items) ? result.Items : [];
};

const fetchFromApi = async () => {
  if (!apiBaseUrl) return null;
  const base = apiBaseUrl.replace(/\/+$/, "");

  try {
    const [mainRes, categoryRes, mainSchedRes, catSchedRes] = await Promise.all([
      fetch(`${base}/api/main-categories`),
      fetch(`${base}/api/categories`),
      fetch(`${base}/api/schedule/main-category`),
      fetch(`${base}/api/schedule/category`),
    ]);

    if (!mainRes.ok || !categoryRes.ok) return null;

    const [mainCategories, categories] = await Promise.all([
      mainRes.json(),
      categoryRes.json(),
    ]);

    const mainCategorySchedules = mainSchedRes.ok ? await mainSchedRes.json() : [];
    const categorySchedules = catSchedRes.ok ? await catSchedRes.json() : [];

    return {
      mainCategories: Array.isArray(mainCategories) ? mainCategories : [],
      categories: Array.isArray(categories) ? categories : [],
      mainCategorySchedules: Array.isArray(mainCategorySchedules)
        ? mainCategorySchedules
        : [],
      categorySchedules: Array.isArray(categorySchedules) ? categorySchedules : [],
    };
  } catch {
    return null;
  }
};

export const fetchHomepageData = async () => {
  const apiData = await fetchFromApi();
  if (apiData) return apiData;

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
