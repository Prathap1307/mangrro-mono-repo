export type ScheduleDay =
  | "Monday"
  | "Tuesday"
  | "Wednesday"
  | "Thursday"
  | "Friday"
  | "Saturday"
  | "Sunday";

export type TimeRange = { start: string; end: string };
export type TimeslotMap = Record<ScheduleDay, TimeRange[]>;

export interface Schedule {
  id?: string; // primary key used by Dynamo rows
  scheduleId?: string; // optional legacy key
  mainCategoryId?: string;
  categoryId?: string;
  subcategoryId?: string;
  itemId?: string;
  timeslots: TimeslotMap;
}

export type CategorySchedule = Schedule;
