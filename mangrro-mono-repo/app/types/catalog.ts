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
