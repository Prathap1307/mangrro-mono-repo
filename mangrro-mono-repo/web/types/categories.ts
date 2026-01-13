import { Schedule } from "./schedule";

export interface Category {
  categoryId: string;
  name: string;
  active: boolean;
  schedule?: Schedule;
  position: number;
  highlightText?: string;
  imageUrl?: string;
  imageKey?: string;
  subcategoryName?: string;
  parentCategoryId?: string;
}
