import { Schedule } from "./schedule";

export type VegType = "veg" | "nonveg" | "vegan";

export interface Item {
  itemId: string;
  name: string;
  categoryId: string;
  price: number;
  imageUrl?: string;
  vegType: VegType;
  ageRestricted?: boolean;
  active: boolean;
  schedule?: Schedule;
  description?: string;
  keywords?: string[];
}
