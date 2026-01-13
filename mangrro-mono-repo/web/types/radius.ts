export interface RadiusRule {
  id: string;               // PRIMARY KEY — MUST MATCH TABLE
  name: string;
  centerLatitude: number;
  centerLongitude: number;
  radiusMiles: number;
  active: boolean;
}
