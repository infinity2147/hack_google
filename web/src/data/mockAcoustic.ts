import type { AcousticReading } from "../types";

const ROUTES = [
  "JNPT → Singapore",
  "Mundra → Dubai",
  "Chennai → Rotterdam",
  "Kolkata → Hamburg",
  "Visakhapatnam → Shanghai",
  "Cochin → Colombo",
  "Tuticorin → Singapore",
  "JNPT → Rotterdam",
  "Mundra → Hamburg",
  "Chennai → LA",
];

const ANOMALY_TYPES: AcousticReading["anomalyType"][] = [
  "none",
  "refrigeration",
  "structural",
  "vibration",
  "compressor",
];

function pseudoRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

export const ACOUSTIC_READINGS: AcousticReading[] = (() => {
  const rand = pseudoRandom(23);
  const out: AcousticReading[] = [];
  // 82 monitored containers
  for (let i = 0; i < 82; i++) {
    const isAnomaly = rand() < 0.23; // 19/82 anomalous
    const type: AcousticReading["anomalyType"] = isAnomaly
      ? ANOMALY_TYPES[1 + Math.floor(rand() * 4)]
      : "none";
    const score = isAnomaly ? 0.55 + rand() * 0.4 : rand() * 0.35;
    // Cluster normal in middle, anomalies on edges
    const f1 = isAnomaly
      ? (rand() > 0.5 ? 1 : -1) * (1.6 + rand() * 1.2) + (rand() - 0.5) * 0.3
      : (rand() - 0.5) * 1.4;
    const f2 = isAnomaly
      ? (rand() > 0.5 ? 1 : -1) * (1.4 + rand() * 1.0) + (rand() - 0.5) * 0.3
      : (rand() - 0.5) * 1.4;
    const alert: AcousticReading["alertStatus"] =
      score > 0.85 ? "critical" : score > 0.55 ? "warning" : "normal";
    const dt = new Date();
    dt.setMinutes(dt.getMinutes() - Math.floor(rand() * 1440));
    out.push({
      id: `ACU-${String(i + 1).padStart(6, "0")}`,
      containerId: `CTR-${String(Math.floor(rand() * 10000)).padStart(4, "0")}`,
      route: ROUTES[Math.floor(rand() * ROUTES.length)],
      anomalyType: type,
      anomalyScore: Math.round(score * 1000) / 1000,
      feature1: Math.round(f1 * 100) / 100,
      feature2: Math.round(f2 * 100) / 100,
      alertStatus: alert,
      detectedAt: dt.toISOString(),
      leadTimeHours: isAnomaly ? 4 + Math.floor(rand() * 5) : 0,
    });
  }
  return out;
})();

export const ACOUSTIC_STATS = {
  monitored: 82,
  normal: ACOUSTIC_READINGS.filter((r) => r.alertStatus === "normal").length,
  anomalous: ACOUSTIC_READINGS.filter((r) => r.alertStatus !== "normal").length,
  critical: ACOUSTIC_READINGS.filter((r) => r.alertStatus === "critical").length,
};
