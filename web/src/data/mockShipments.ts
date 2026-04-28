import type { Shipment, HealthTrendDay } from "../types";

const COMMODITIES = ["Electronics", "Textiles", "Pharmaceuticals", "Auto Parts", "Chemicals", "Steel", "Machinery", "Food Products"];
const CARRIERS = ["Maersk", "MSC", "CMA CGM", "COSCO", "Hapag-Lloyd", "ONE", "Evergreen"];
const STATUSES: Shipment["status"][] = ["delivered", "in_transit", "delayed", "disrupted"];
const ORIGINS = [
  ["IN-JNPT", "Nhava Sheva"], ["IN-MUN", "Mundra Port"], ["IN-CHE", "Chennai Port"],
  ["SG-HUB", "Singapore Hub"], ["CN-SHA", "Shanghai"], ["AE-DXB", "Dubai"],
  ["NL-RTM", "Rotterdam"], ["US-LAX", "Los Angeles"],
];
const DESTS = [
  ["IN-DEL", "Delhi ICD"], ["IN-BLR", "Bangalore ICD"], ["IN-HYD", "Hyderabad ICD"],
  ["NL-RTM", "Rotterdam"], ["US-NYC", "New York"], ["DE-HAM", "Hamburg"],
  ["SG-HUB", "Singapore Hub"], ["AE-DXB", "Dubai"],
];

let s = 42;
const rand = () => { s = (s * 16807 + 0) % 2147483647; return s / 2147483647; };

export const MOCK_SHIPMENTS: Shipment[] = Array.from({ length: 120 }, (_, i) => {
  const origin = ORIGINS[Math.floor(rand() * ORIGINS.length)];
  const dest = DESTS[Math.floor(rand() * DESTS.length)];
  const planned = Math.round(5 + rand() * 35);
  const delay = Math.random() < 0.3 ? Math.round(rand() * 15) : 0;
  const status = STATUSES[Math.floor(rand() * STATUSES.length)];
  return {
    id: `SHP-${String(i + 1).padStart(6, "0")}`,
    bookingDate: `2026-0${1 + Math.floor(rand() * 4)}-${String(1 + Math.floor(rand() * 28)).padStart(2, "0")}`,
    originId: origin[0],
    originName: origin[1],
    destId: dest[0],
    destName: dest[1],
    commodity: COMMODITIES[Math.floor(rand() * COMMODITIES.length)],
    carrier: CARRIERS[Math.floor(rand() * CARRIERS.length)],
    status,
    transitDaysPlanned: planned,
    transitDaysActual: planned + delay,
    delayDays: delay,
    teu: [1, 2, 3, 4, 5, 8, 10][Math.floor(rand() * 7)],
    costUSD: Math.round((2000 + rand() * 40000) * 100) / 100,
    riskScore: +(rand() * 0.8).toFixed(3),
    disruptionFlag: delay > 7,
    transportMode: (["sea", "rail", "road", "multimodal"] as const)[Math.floor(rand() * 4)],
  };
});

export const HEALTH_TREND_30D: HealthTrendDay[] = Array.from({ length: 30 }, (_, i) => {
  const d = new Date(2026, 3, i + 1);
  const events = Math.round(1 + rand() * 6);
  const severity = 0.3 + rand() * 0.5;
  return {
    date: d.toISOString().slice(0, 10),
    healthScore: +(100 - severity * 100 + rand() * 10).toFixed(1),
    eventCount: events,
    avgSeverity: +severity.toFixed(2),
    totalLoss: Math.round(events * (5000 + rand() * 15000)),
  };
});
