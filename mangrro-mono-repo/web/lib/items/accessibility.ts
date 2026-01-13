import type { Item } from "@/types";

export type ItemAccessStatus = "active" | "inactive";

export const isItemDirectlyAccessible = (item: Pick<Item, "active">): boolean =>
  Boolean(item.active);

export const getItemAccessStatus = (item: Pick<Item, "active">): ItemAccessStatus =>
  isItemDirectlyAccessible(item) ? "active" : "inactive";
