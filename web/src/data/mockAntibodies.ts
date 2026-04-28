import type { Antibody } from "../types";

// 7 dimensions: AIS, Port Congestion, Weather, News, Invoice, Customs, Crowd
export const SIGNAL_DIMENSIONS = [
  "AIS Anomaly",
  "Port Congestion",
  "Weather Severity",
  "News Signal",
  "Invoice Anomaly",
  "Customs Delay",
  "Crowd Reports",
] as const;

export const ANTIBODIES: Antibody[] = [
  {
    id: "AB-0001",
    code: "PORT_CONGESTION_INDIA_WEST_001",
    type: "Port Congestion",
    location: "Western India (JNPT)",
    severity: 0.78,
    pattern: [0.88, 0.82, 0.40, 0.55, 0.28, 0.62, 0.40],
    lastTriggered: "2025-09-14",
    matchConfidence: 0.94,
  },
  {
    id: "AB-0002",
    code: "PORT_STRIKE_INDIA_WEST_001",
    type: "Port Strike",
    location: "Western India",
    severity: 0.86,
    pattern: [0.42, 0.85, 0.10, 0.78, 0.30, 0.60, 0.85],
    lastTriggered: "2024-03-12",
    matchConfidence: 0.91,
  },
  {
    id: "AB-0003",
    code: "CYCLONE_BAY_OF_BENGAL_001",
    type: "Severe Weather",
    location: "Bay of Bengal",
    severity: 0.92,
    pattern: [0.35, 0.55, 0.95, 0.60, 0.10, 0.20, 0.70],
    lastTriggered: "2025-05-21",
    matchConfidence: 0.89,
  },
  {
    id: "AB-0004",
    code: "GEOPOLITICAL_RED_SEA_001",
    type: "Geopolitical",
    location: "Red Sea Corridor",
    severity: 0.83,
    pattern: [0.55, 0.40, 0.05, 0.92, 0.65, 0.50, 0.20],
    lastTriggered: "2024-11-30",
    matchConfidence: 0.87,
  },
  {
    id: "AB-0005",
    code: "LABOR_DISPUTE_INLAND_001",
    type: "Labor Dispute",
    location: "Pan-India (Inland)",
    severity: 0.61,
    pattern: [0.20, 0.40, 0.05, 0.75, 0.10, 0.55, 0.92],
    lastTriggered: "2025-07-04",
    matchConfidence: 0.82,
  },
  {
    id: "AB-0006",
    code: "CUSTOMS_DELAY_INDIA_001",
    type: "Customs Delay",
    location: "All India Ports",
    severity: 0.58,
    pattern: [0.25, 0.55, 0.10, 0.45, 0.42, 0.92, 0.40],
    lastTriggered: "2025-12-01",
    matchConfidence: 0.85,
  },
  {
    id: "AB-0007",
    code: "CYBER_CARRIER_SYSTEMS_001",
    type: "Cyber Incident",
    location: "Carrier IT (Maersk-class)",
    severity: 0.72,
    pattern: [0.65, 0.60, 0.05, 0.85, 0.55, 0.40, 0.20],
    lastTriggered: "2024-06-19",
    matchConfidence: 0.79,
  },
  {
    id: "AB-0008",
    code: "EQUIPMENT_FAILURE_CRANE_001",
    type: "Equipment Failure",
    location: "Major Port Cranes",
    severity: 0.65,
    pattern: [0.30, 0.78, 0.12, 0.30, 0.10, 0.45, 0.30],
    lastTriggered: "2025-10-08",
    matchConfidence: 0.81,
  },
];

// Default current sensor embedding (live)
export const DEFAULT_SENSOR_EMBEDDING = [
  0.74, 0.71, 0.32, 0.48, 0.30, 0.55, 0.45,
];
