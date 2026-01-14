import type { CategoryTimeslotDay, DayName } from "./homepage";

export interface SubcategorySchedule {
  subcategoryId: string;
  timeslots: Record<DayName, CategoryTimeslotDay | undefined>;
}

export interface ItemSlot {
  start: string;
  end: string;
}

export interface ItemSchedule {
  itemId: string;
  timeslots: Record<DayName, ItemSlot[] | undefined>;
}

export interface SubcategoryRaw {
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

export interface Subcategory {
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

export interface ItemMeta {
  itemId: string;
  name: string;
  price: number;
  active: boolean;
  ageRestricted?: boolean;
  vegType?: string;
  description?: string;
  keywords?: string[];
  imageUrl?: string;
  imageKey?: string;
  category?: string;
  categoryId?: string;
  subcategoryId?: string;
  subcategoryName?: string;
  tag?: string;
}
