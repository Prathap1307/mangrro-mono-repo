import type {
  CategorySchedule,
  CategoryTimeslotDay,
  DayName,
  MainCategorySchedule,
} from "../../types/homepage";

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
