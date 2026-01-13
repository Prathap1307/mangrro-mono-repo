export type DayName =
  | "Monday"
  | "Tuesday"
  | "Wednesday"
  | "Thursday"
  | "Friday"
  | "Saturday"
  | "Sunday";

export interface CategoryTimeslotDay {
  slot1Start?: string;
  slot1End?: string;
  slot2Start?: string;
  slot2End?: string;
}

export interface MainCategorySchedule {
  mainCategoryId: string;
  timeslots: Record<DayName, CategoryTimeslotDay | undefined>;
}

export interface CategorySchedule {
  categoryId: string;
  timeslots: Record<DayName, CategoryTimeslotDay | undefined>;
}

export interface MainCategoryRaw {
  id?: string;
  mainCategoryId?: string;
  name?: string;
  active?: boolean;
  position?: number | string;
  highlightText?: string | null;
  reactivateOn?: string | null;
}

export interface CategoryRaw {
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

export interface MainCategory {
  id: string;
  name: string;
  active: boolean;
  position: number;
  highlightText?: string;
  reactivateOn?: string;
}

export interface Category {
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
