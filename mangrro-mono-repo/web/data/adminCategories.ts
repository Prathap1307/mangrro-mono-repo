export interface AdminCategory {
  id: number;
  name: string;
  active: boolean;
  reason?: string;
  reactivateOn?: string;
  position?: number;
  highlightText?: string;
}

export const adminCategories: AdminCategory[] = [
  { id: 1, name: "Alcohol", active: true, position: 4 },
  { id: 2, name: "Drinks", active: true, position: 1, highlightText: "Refresh yourself" },
  {
    id: 3,
    name: "Snacks",
    active: false,
    reason: "Supplier delay",
    reactivateOn: "2024-12-05",
    position: 3,
  },
  { id: 4, name: "Groceries", active: true, position: 2 },
];
