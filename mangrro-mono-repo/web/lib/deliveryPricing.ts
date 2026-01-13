import type { DeliveryAddress } from "@/components/context/DeliveryContext";

export interface RadiusRule {
  radiusId?: string;
  id?: string;
  centerLatitude: number;
  centerLongitude: number;
  radiusMiles: number;
  name?: string;
  active?: boolean;
}

export interface DeliveryChargeRule {
  ruleId?: string;
  id?: string;
  location?: string; // radiusId
  milesStart: number;
  milesEnd: number;
  price: number;
  timeStart?: string; // "HH:mm"
  timeEnd?: string; // "HH:mm"
  active?: boolean;
}

export interface SurchargeRule {
  surchargeId?: string;
  id?: string;
  location?: string; // radiusId
  reason?: string;
  price: number;
  active?: boolean;
}

export interface DeliveryQuote {
  radius?: RadiusRule;
  distanceMiles?: number;
  baseRule?: DeliveryChargeRule;
  baseCharge: number;
  surcharges: SurchargeRule[];
  surchargeTotal: number;
  totalDelivery: number;
}

/* ----------------- Helpers ----------------- */

export function toMin(t?: string): number | null {
  if (!t) return null;
  const [h, m] = t.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
}

function isTimeInRange(
  start: number | null,
  end: number | null,
  now: number
): boolean {
  if (start === null || end === null) return true; // always valid if no times

  // Same-day window
  if (start <= end) {
    return now >= start && now <= end;
  }

  // Cross-midnight window
  return now >= start || now <= end;
}

function haversineMiles(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 3958.8; // miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function getNowMinutes(): number {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

/* ----------------- Core logic ----------------- */

export function findRadiusForAddress(
  address: DeliveryAddress,
  radiusRules: RadiusRule[]
): { radius: RadiusRule; distanceMiles: number } | null {
  if (address.latitude == null || address.longitude == null) return null;

  for (const r of radiusRules) {
    if (r.active === false) continue;

    const dist = haversineMiles(
      address.latitude,
      address.longitude,
      r.centerLatitude,
      r.centerLongitude
    );

    if (dist <= r.radiusMiles) {
      return { radius: r, distanceMiles: dist };
    }
  }

  return null;
}

export function findDeliveryChargeRule(
  distanceMiles: number,
  radiusId: string | undefined,
  rules: DeliveryChargeRule[]
): DeliveryChargeRule | undefined {
  const nowMinutes = getNowMinutes();

  return rules.find((rule) => {
    if (rule.active === false) return false;

    if (rule.location && radiusId && rule.location !== radiusId) return false;

    if (distanceMiles < rule.milesStart || distanceMiles > rule.milesEnd)
      return false;

    const startMin = toMin(rule.timeStart);
    const endMin = toMin(rule.timeEnd);

    return isTimeInRange(startMin, endMin, nowMinutes);
  });
}

export function findSurcharges(
  radiusId: string | undefined,
  surcharges: SurchargeRule[]
): SurchargeRule[] {
  if (!radiusId) return [];
  return surcharges.filter(
    (s) => s.active !== false && s.location === radiusId
  );
}

export function buildDeliveryQuote(
  address: DeliveryAddress | null,
  radiusRules: RadiusRule[],
  deliveryRules: DeliveryChargeRule[],
  surcharges: SurchargeRule[]
): DeliveryQuote | null {
  if (!address || address.latitude == null || address.longitude == null) {
    return null;
  }

  const radiusResult = findRadiusForAddress(address, radiusRules);
  if (!radiusResult) {
    return {
      baseCharge: 0,
      surcharges: [],
      surchargeTotal: 0,
      totalDelivery: 0,
    };
  }

  const radiusId = radiusResult.radius.radiusId ?? radiusResult.radius.id;
  const baseRule = findDeliveryChargeRule(
    radiusResult.distanceMiles,
    radiusId,
    deliveryRules
  );

  const baseCharge = baseRule?.price ?? 0;

  const matchedSurcharges = findSurcharges(radiusId, surcharges);
  const surchargeTotal = matchedSurcharges.reduce(
    (sum, s) => sum + (s.price ?? 0),
    0
  );

  const totalDelivery = baseCharge + surchargeTotal;

  return {
    radius: radiusResult.radius,
    distanceMiles: radiusResult.distanceMiles,
    baseRule,
    baseCharge,
    surcharges: matchedSurcharges,
    surchargeTotal,
    totalDelivery,
  };
}
