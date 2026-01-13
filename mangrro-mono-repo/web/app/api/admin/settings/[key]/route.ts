import { NextRequest, NextResponse } from "next/server";

import {
  getCategorySchedulerSelection,
  getDeliveryChargeRules,
  getItemSchedulerSelection,
  getMainCategorySchedulerSelection,
  getRadiusZones,
  getSurchargeRules,
  saveCategorySchedulerSelection,
  saveDeliveryChargeRules,
  saveItemSchedulerSelection,
  saveMainCategorySchedulerSelection,
  saveRadiusZones,
  saveSurchargeRules,
  getSubcategorySchedulerSelection,
  saveSubcategorySchedulerSelection
} from "@/lib/admin/catalog";

// Allowed keys
const VALID_KEYS = [
  "delivery-charges",
  "radius-zones",
  "surcharge-rules",
  "item-schedule",
  "category-schedule",
  "main-category-schedule",
  "subcategory-schedule"
] as const;

type SettingKey = (typeof VALID_KEYS)[number];

function isValidKey(key: string): key is SettingKey {
  return VALID_KEYS.includes(key as SettingKey);
}

/* ------------------------- INTERNAL GET ------------------------- */
async function getByKey(key: SettingKey) {
  switch (key) {
    case "delivery-charges":
      return getDeliveryChargeRules();
    case "radius-zones":
      return getRadiusZones();
    case "surcharge-rules":
      return getSurchargeRules();
    case "item-schedule":
      return getItemSchedulerSelection();
    case "category-schedule":
      return getCategorySchedulerSelection();
    case "main-category-schedule":
      return getMainCategorySchedulerSelection();
    case "subcategory-schedule":
      return getSubcategorySchedulerSelection();
  }
}

/* ------------------------- INTERNAL SAVE ------------------------- */
async function saveByKey(key: SettingKey, payload: any) {
  switch (key) {
    case "delivery-charges":
      return saveDeliveryChargeRules(payload);
    case "radius-zones":
      return saveRadiusZones(payload);
    case "surcharge-rules":
      return saveSurchargeRules(payload);
    case "item-schedule":
      return saveItemSchedulerSelection(payload);
    case "category-schedule":
      return saveCategorySchedulerSelection(payload);
    case "main-category-schedule":
      return saveMainCategorySchedulerSelection(payload);
    case "subcategory-schedule":
      return saveSubcategorySchedulerSelection(payload);
  }
}

/* ------------------------- GET ROUTE ------------------------- */
export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ key: string }> }
) {
  const { key } = await context.params;

  if (!isValidKey(key)) {
    return NextResponse.json(
      { error: `Invalid settings key: ${key}` },
      { status: 400 }
    );
  }

  const data = await getByKey(key);
  return NextResponse.json(data ?? {});
}

/* ------------------------- POST ROUTE ------------------------- */
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ key: string }> }
) {
  const { key } = await context.params;

  if (!isValidKey(key)) {
    return NextResponse.json(
      { error: `Invalid settings key: ${key}` },
      { status: 400 }
    );
  }

  const payload = await req.json();
  const saved = await saveByKey(key, payload);

  return NextResponse.json(saved ?? {});
}
