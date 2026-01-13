export interface AdminItem {
  id: number;
  name: string;
  price: number;
  category: string;
  active: boolean;
  ageRestricted: boolean;
  diet?: "Veg" | "Vegan" | "Non-Veg";
  image?: string;
}

export const adminItems: AdminItem[] = [
  { id: 1, name: "Whiskey", price: 29.99, category: "Alcohol", active: true, ageRestricted: true, diet: "Non-Veg" },
  { id: 2, name: "Coke", price: 1.99, category: "Drinks", active: true, ageRestricted: false, diet: "Vegan" },
  { id: 3, name: "Vegan Chips", price: 2.5, category: "Snacks", active: false, ageRestricted: false, diet: "Vegan" },
  { id: 4, name: "Red Wine", price: 19.99, category: "Alcohol", active: true, ageRestricted: true, diet: "Non-Veg" },
];
