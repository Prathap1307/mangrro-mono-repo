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

export interface CategorySchedule {
  categoryId: string;
  timeslots: Record<DayName, CategoryTimeslotDay | undefined>;
}

export interface MainCategorySchedule {
  mainCategoryId: string;
  timeslots: Record<DayName, CategoryTimeslotDay | undefined>;
}

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

const toMin = (t?: string): number | null => {
  if (!t) return null;
  const [h, m] = t.split(":").map(Number);
  return isNaN(h) ? null : h * 60 + m;
};

const inRange = (now: number, start?: string, end?: string) => {
  const startMinutes = toMin(start);
  const endMinutes = toMin(end);
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
  const d = sched.timeslots[day];
  if (!d) return false;
  return (
    inRange(now, d.slot1Start, d.slot1End) ||
    inRange(now, d.slot2Start, d.slot2End)
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
  if (!cat || !isEntityActive(cat.active, cat.reactivateOn ?? undefined, nowDate))
    return false;
  if (
    mainCat &&
    !isEntityActive(mainCat.active, mainCat.reactivateOn ?? undefined, nowDate)
  )
    return false;
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
  // Hard block inactive subcategories; schedules can only limit visibility.
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

export const isItemScheduleOpen = (
  sched: ItemSchedule | undefined,
  day: DayName,
  now: number
): boolean => {
  if (!sched) return true;
  const d = sched.timeslots[day];
  if (!d?.length) return false;
  return d.some((slot) => inRange(now, slot.start, slot.end));
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

  // Hard block inactive items; schedules can only limit visibility.
  if (!item.active) return false;
  if (!categoryOpen || !subcategoryOpen) return false;
  return isItemScheduleOpen(schedules?.item, dayName, minutes);
};

export const isItemDirectlyAccessible = ({
  item,
  category,
  mainCategory,
  subcategory,
  now,
}: ItemVisibilityContext): boolean => {
  if (!item.active) return false;
  const nowDate = now ?? new Date();

  if (category && !isEntityActive(category.active, category.reactivateOn ?? undefined, nowDate))
    return false;
  if (
    mainCategory &&
    !isEntityActive(mainCategory.active, mainCategory.reactivateOn ?? undefined, nowDate)
  )
    return false;

  const hasSubcategory = Boolean(item.subcategoryId || item.subcategoryName);
  if (hasSubcategory && (!subcategory || !subcategory.active)) return false;

  return true;
};

export const isItemAdminVisible = ({ item }: ItemVisibilityContext): boolean =>
  Boolean(item);
