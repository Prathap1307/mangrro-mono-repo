export interface SurchargeRule {
  id: string;
  reason: string;
  price: number;
  location?: string | null;   // NEW
  active: boolean;
}
