import type {
  CategorySchedule,
  CategoryTimeslotDay,
  DayName,
  MainCategorySchedule,
} from "../../types/homepage";
import type {
  ItemSchedule,
  SubcategorySchedule,
} from "../../types/catalog";
import type { ItemSchedule, SubcategorySchedule } from "../../types/catalog";

export interface ItemVisibilityContext {
  item: {
    active: boolean;
    subcategoryId?: string | null;
    subcategoryName?: string | null;
  };
  category?: { active: boolean; reactivateOn?: string | null; mainCategoryId?: string };
  mainCategory?: { active: boolean; reactivateOn?: string | null };
  subcategory?: { active: boolean };
  schedules?: {
    category?: CategorySchedule;
    mainCategory?: MainCategorySchedule;
    subcategory?: SubcategorySchedule;
    item?: ItemSchedule;
  };
  dayName: DayName;
  minutes: number;
  now?: Date;
}

const toMinutes = (time?: string): number | null => {
  if (!time) return null;
  const [hours, minutes] = time.split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  return hours * 60 + minutes;
};

const inRange = (now: number, start?: string, end?: string) => {
  const startMinutes = toMinutes(start);
  const endMinutes = toMinutes(end);
  return (
    startMinutes !== null &&
    endMinutes !== null &&
    now >= startMinutes &&
    now < endMinutes
  );
};

const isReactivated = (reactivateOn: string | undefined, now: Date) => {
  if (!reactivateOn) return false;
  const parsed = new Date(reactivateOn);
  if (Number.isNaN(parsed.getTime())) return false;
  return now >= parsed;
};

export const isEntityActive = (
  active: boolean,
  reactivateOn: string | undefined,
  now: Date
) => active || isReactivated(reactivateOn, now);

export const isScheduleOpen = (
  sched: { timeslots: Record<DayName, CategoryTimeslotDay | undefined> } | undefined,
  day: DayName,
  now: number
): boolean => {
  if (!sched) return true;
  const daySlots = sched.timeslots[day];
  if (!daySlots) return false;
  return (
    inRange(now, daySlots.slot1Start, daySlots.slot1End) ||
    inRange(now, daySlots.slot2Start, daySlots.slot2End)
  );
};

export const isCategoryOpen = (
  cat: { active: boolean; reactivateOn?: string | null } | undefined,
  sched: CategorySchedule | undefined,
  day: DayName,
  now: number,
  mainCat?: { active: boolean; reactivateOn?: string | null },
  mainSched?: MainCategorySchedule,
  nowDate: Date = new Date()
): boolean => {
  if (!cat || !isEntityActive(cat.active, cat.reactivateOn ?? undefined, nowDate)) {
    return false;
  }
  if (
    mainCat &&
    !isEntityActive(mainCat.active, mainCat.reactivateOn ?? undefined, nowDate)
  ) {
    return false;
  }
  if (!isScheduleOpen(mainSched, day, now)) return false;
  return isScheduleOpen(sched, day, now);
};

export const isSubcategoryVisible = (
  sub: { active: boolean } | undefined,
  sched: SubcategorySchedule | undefined,
  day: DayName,
  now: number,
  parentCategory: { active: boolean; reactivateOn?: string | null } | undefined,
  nowDate: Date = new Date()
): boolean => {
  if (!sub || !sub.active) return false;
  if (
    !parentCategory ||
    !isEntityActive(
      parentCategory.active,
      parentCategory.reactivateOn ?? undefined,
      nowDate
    )
  )
    return false;
  return isScheduleOpen(sched, day, now);
};

const isItemScheduleOpen = (
  sched: ItemSchedule | undefined,
  day: DayName,
  now: number
): boolean => {
  if (!sched) return true;
  const daySlots = sched.timeslots[day];
  if (!daySlots?.length) return false;
  return daySlots.some((slot) => inRange(now, slot.start, slot.end));
};

export const isItemListVisible = ({
  item,
  category,
  subcategory,
  mainCategory,
  schedules,
  dayName,
  minutes,
  now,
}: {
  item: { active: boolean; subcategoryId?: string | null; subcategoryName?: string | null };
  category?: { active: boolean; reactivateOn?: string | null; mainCategoryId?: string };
  mainCategory?: { active: boolean; reactivateOn?: string | null };
  subcategory?: { active: boolean };
  schedules?: {
    category?: CategorySchedule;
    mainCategory?: MainCategorySchedule;
    subcategory?: SubcategorySchedule;
    item?: ItemSchedule;
  };
  dayName: DayName;
  minutes: number;
  now?: Date;
}): boolean => {
  const nowDate = now ?? new Date();
  const categoryOpen = isCategoryOpen(
    category,
    schedules?.category,
    dayName,
    minutes,
    mainCategory,
    schedules?.mainCategory,
    nowDate
  );
  const hasSubcategory = Boolean(item.subcategoryId || item.subcategoryName);
  const subcategoryOpen = hasSubcategory
    ? isSubcategoryVisible(
        subcategory,
        schedules?.subcategory,
        dayName,
        minutes,
        category,
        nowDate
      )
    : true;

  if (!item.active) return false;
  if (!categoryOpen || !subcategoryOpen) return false;
  return isItemScheduleOpen(schedules?.item, dayName, minutes);
};

export const isSubcategoryVisible = (
  sub: { active: boolean } | undefined,
  sched: SubcategorySchedule | undefined,
  day: DayName,
  now: number,
  parentCategory: { active: boolean; reactivateOn?: string | null } | undefined,
  nowDate: Date = new Date()
): boolean => {
  if (!sub || !sub.active) return false;
  if (
    !parentCategory ||
    !isEntityActive(
      parentCategory.active,
      parentCategory.reactivateOn ?? undefined,
      nowDate
    )
  ) {
    return false;
  }
  return isScheduleOpen(sched, day, now);
};

export const isItemScheduleOpen = (
  sched: ItemSchedule | undefined,
  day: DayName,
  now: number
): boolean => {
  if (!sched) return true;
  const daySlots = sched.timeslots[day];
  if (!daySlots?.length) return false;
  return daySlots.some((slot) => inRange(now, slot.start, slot.end));
};

export const isItemListVisible = ({
  item,
  category,
  subcategory,
  mainCategory,
  schedules,
  dayName,
  minutes,
  now,
}: ItemVisibilityContext): boolean => {
  const nowDate = now ?? new Date();
  const categoryOpen = isCategoryOpen(
    category,
    schedules?.category,
    dayName,
    minutes,
    mainCategory,
    schedules?.mainCategory,
    nowDate
  );
  const hasSubcategory = Boolean(item.subcategoryId || item.subcategoryName);
  const subcategoryOpen = hasSubcategory
    ? isSubcategoryVisible(
        subcategory,
        schedules?.subcategory,
        dayName,
        minutes,
        category,
        nowDate
      )
    : true;

  if (!item.active) return false;
  if (!categoryOpen || !subcategoryOpen) return false;
  return isItemScheduleOpen(schedules?.item, dayName, minutes);
};
