import type { DisruptionEvent, AlertItem } from "../types";

export const HISTORICAL_DISRUPTIONS: DisruptionEvent[] = [
  { id: "EVT-001", type: "Port Strike", location: "JNPT, India", date: "2024-03-12", peakR0: 2.8, economicLossUSD: 340_000_000, cascadeHops: 7, durationDays: 12 },
  { id: "EVT-002", type: "Cyclone", location: "Bay of Bengal", date: "2025-05-21", peakR0: 3.1, economicLossUSD: 1_200_000_000, cascadeHops: 11, durationDays: 8 },
  { id: "EVT-003", type: "Geopolitical", location: "Red Sea", date: "2024-11-30", peakR0: 2.4, economicLossUSD: 680_000_000, cascadeHops: 9, durationDays: 31 },
  { id: "EVT-004", type: "Customs Delay", location: "Chennai Port", date: "2025-12-01", peakR0: 1.6, economicLossUSD: 85_000_000, cascadeHops: 4, durationDays: 6 },
  { id: "EVT-005", type: "Cyber", location: "Maersk IT Systems", date: "2024-06-19", peakR0: 1.9, economicLossUSD: 220_000_000, cascadeHops: 6, durationDays: 9 },
  { id: "EVT-006", type: "Equipment", location: "Mundra Cranes", date: "2025-10-08", peakR0: 1.4, economicLossUSD: 47_000_000, cascadeHops: 3, durationDays: 4 },
  { id: "EVT-007", type: "Labor", location: "Inland (Pan-India)", date: "2025-07-04", peakR0: 1.7, economicLossUSD: 130_000_000, cascadeHops: 5, durationDays: 7 },
  { id: "EVT-008", type: "Port Congestion", location: "JNPT", date: "2025-09-14", peakR0: 2.1, economicLossUSD: 290_000_000, cascadeHops: 6, durationDays: 9 },
  { id: "EVT-009", type: "Cyclone", location: "Andhra Coast", date: "2024-10-22", peakR0: 2.6, economicLossUSD: 540_000_000, cascadeHops: 8, durationDays: 11 },
  { id: "EVT-010", type: "Port Strike", location: "Chennai", date: "2024-08-04", peakR0: 1.8, economicLossUSD: 110_000_000, cascadeHops: 4, durationDays: 5 },
  { id: "EVT-011", type: "Geopolitical", location: "Strait of Hormuz", date: "2025-02-18", peakR0: 2.2, economicLossUSD: 410_000_000, cascadeHops: 7, durationDays: 14 },
  { id: "EVT-012", type: "Customs Delay", location: "Kolkata", date: "2024-04-10", peakR0: 1.3, economicLossUSD: 38_000_000, cascadeHops: 3, durationDays: 5 },
];

export const LIVE_ALERTS: AlertItem[] = [
  {
    id: "ALT-1",
    level: "critical",
    title: "Port congestion spreading",
    detail: "Nhava Sheva → Mundra → Kandla cascade",
    meta: "R₀ = 2.1 · 47 min ago",
    cta: "Accept Reroute",
    ago: "47m",
  },
  {
    id: "ALT-2",
    level: "alert",
    title: "Invoice anomaly detected",
    detail: "Supplier: Tata Logistics Pvt Ltd",
    meta: "Anomaly score: 0.73 · 2h ago",
    cta: "View Document",
    ago: "2h",
  },
  {
    id: "ALT-3",
    level: "immune",
    title: "Pre-emptive immune response fired",
    detail: "Matched antibody: PORT_CONGESTION_INDIA_001",
    meta: "Confidence: 0.94 · 3h ago",
    cta: "View Match",
    ago: "3h",
  },
  {
    id: "ALT-4",
    level: "review",
    title: "Crowd verification pending",
    detail: "3 reports near Surat — awaiting threshold",
    meta: "2 / 3 verified · 4h ago",
    cta: "Inspect",
    ago: "4h",
  },
  {
    id: "ALT-6",
    level: "normal",
    title: "Route negotiation settled",
    detail: "MAERSK won JNPT → Rotterdam (Vickrey)",
    meta: "Bid $47.2k · Pays $44.8k · 6h ago",
    cta: "Open Round",
    ago: "6h",
  },
  {
    id: "ALT-7",
    level: "critical",
    title: "Cyclone forming over Bay of Bengal",
    detail: "Wind 145 km/h projected at landfall",
    meta: "ETA Vizag T-38h · 7h ago",
    cta: "Reroute East Coast",
    ago: "7h",
  },
  {
    id: "ALT-8",
    level: "review",
    title: "GraphSAGE: new intermediary entity",
    detail: "Supplier graph anomaly — 3 new nodes / 14d",
    meta: "Confidence 0.81 · 8h ago",
    cta: "Investigate",
    ago: "8h",
  },
];

export const DISRUPTION_TIMELINE_72H = (() => {
  // 72 hours of S/I/R fractions
  const out: { hour: number; S: number; I: number; R: number }[] = [];
  for (let h = 72; h >= 0; h--) {
    const t = (72 - h) / 72;
    const I = Math.max(0.02, Math.sin(t * Math.PI) * 0.34 + 0.05);
    const R = Math.min(0.5, t * 0.3);
    const S = Math.max(0.2, 1 - I - R);
    out.push({
      hour: h,
      S: +S.toFixed(3),
      I: +I.toFixed(3),
      R: +R.toFixed(3),
    });
  }
  return out;
})();

export const TOP_DISRUPTED_ROUTES = [
  { route: "JNPT → Singapore", severity: 0.84 },
  { route: "Mumbai → Dubai", severity: 0.71 },
  { route: "Chennai → Rotterdam", severity: 0.63 },
  { route: "Kolkata → Hamburg", severity: 0.58 },
  { route: "JNPT → LA", severity: 0.52 },
];

// 7×24 anomaly heatmap (doc types × hours)
export const ANOMALY_HEATMAP = (() => {
  const types = ["Invoice", "BOL", "Customs", "PO", "Insurance", "Phytosan.", "Manifest"];
  const grid: { row: string; cells: number[] }[] = [];
  let s = 17;
  const r = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  for (const t of types) {
    const cells: number[] = [];
    for (let h = 0; h < 24; h++) {
      const business = h >= 8 && h <= 19 ? 1 : 0.3;
      cells.push(+(r() * business * 6).toFixed(0));
    }
    grid.push({ row: t, cells });
  }
  return grid;
})();
