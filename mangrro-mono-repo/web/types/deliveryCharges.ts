export interface DeliveryChargeRule {
  id: string;
  milesStart: number;
  milesEnd: number;
  price: number;
  timeStart?: string;
  timeEnd?: string;
  location?: string | null;   // ✔ NEW FIELD
  active: boolean;
}
