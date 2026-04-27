import type { SupplyChainNode, SupplyChainEdge } from "../types";

// Lay out 31 nodes on a 1100x600 canvas, positions roughly geographic
// (left = Americas, center = India/MENA, right = East Asia)
export const NETWORK_NODES: SupplyChainNode[] = [
  // India major ports
  { id: "IN-JNPT", name: "Nhava Sheva (JNPT)", type: "major_port", country: "IN", lat: 18.95, lng: 72.95, x: 605, y: 350, tradeVolumeB: 28, sirState: "I", infectionLevel: 0.73, recoveryStep: null },
  { id: "IN-MUN", name: "Mundra Port", type: "major_port", country: "IN", lat: 22.84, lng: 69.71, x: 580, y: 320, tradeVolumeB: 22, sirState: "I", infectionLevel: 0.41, recoveryStep: null },
  { id: "IN-CHE", name: "Chennai Port", type: "major_port", country: "IN", lat: 13.08, lng: 80.27, x: 640, y: 370, tradeVolumeB: 18, sirState: "S", infectionLevel: 0.18, recoveryStep: null },
  { id: "IN-KOL", name: "Kolkata Port", type: "minor_port", country: "IN", lat: 22.57, lng: 88.36, x: 670, y: 322, tradeVolumeB: 9, sirState: "S", infectionLevel: 0.09, recoveryStep: null },
  { id: "IN-VIZ", name: "Visakhapatnam", type: "minor_port", country: "IN", lat: 17.69, lng: 83.22, x: 655, y: 350, tradeVolumeB: 7, sirState: "S", infectionLevel: 0.05, recoveryStep: null },
  { id: "IN-KAN", name: "Kandla Port", type: "minor_port", country: "IN", lat: 23.02, lng: 70.22, x: 575, y: 312, tradeVolumeB: 8, sirState: "S", infectionLevel: 0.21, recoveryStep: null },
  { id: "IN-COC", name: "Cochin Port", type: "minor_port", country: "IN", lat: 9.97, lng: 76.27, x: 615, y: 400, tradeVolumeB: 6, sirState: "S", infectionLevel: 0.04, recoveryStep: null },
  { id: "IN-TUT", name: "Tuticorin", type: "minor_port", country: "IN", lat: 8.79, lng: 78.13, x: 625, y: 410, tradeVolumeB: 4, sirState: "S", infectionLevel: 0.03, recoveryStep: null },
  // India ICDs / inland
  { id: "IN-DEL", name: "Delhi ICD", type: "icd", country: "IN", lat: 28.6, lng: 77.2, x: 620, y: 285, tradeVolumeB: 11, sirState: "S", infectionLevel: 0.15, recoveryStep: null },
  { id: "IN-BLR", name: "Bangalore ICD", type: "icd", country: "IN", lat: 12.97, lng: 77.59, x: 622, y: 388, tradeVolumeB: 8, sirState: "S", infectionLevel: 0.12, recoveryStep: null },
  { id: "IN-HYD", name: "Hyderabad ICD", type: "icd", country: "IN", lat: 17.39, lng: 78.49, x: 632, y: 360, tradeVolumeB: 5, sirState: "S", infectionLevel: 0.08, recoveryStep: null },
  { id: "IN-PUN", name: "Pune ICD", type: "icd", country: "IN", lat: 18.52, lng: 73.85, x: 615, y: 352, tradeVolumeB: 4, sirState: "S", infectionLevel: 0.06, recoveryStep: null },
  { id: "IN-AHM", name: "Ahmedabad ICD", type: "icd", country: "IN", lat: 23.02, lng: 72.57, x: 590, y: 320, tradeVolumeB: 5, sirState: "S", infectionLevel: 0.10, recoveryStep: null },
  { id: "IN-DEL-AIR", name: "Delhi Air Cargo", type: "airport", country: "IN", lat: 28.55, lng: 77.10, x: 615, y: 280, tradeVolumeB: 6, sirState: "S", infectionLevel: 0.06, recoveryStep: null },
  { id: "IN-MUM-AIR", name: "Mumbai Air Cargo", type: "airport", country: "IN", lat: 19.09, lng: 72.87, x: 600, y: 348, tradeVolumeB: 5, sirState: "S", infectionLevel: 0.05, recoveryStep: null },
  { id: "IN-BLR-AIR", name: "Bangalore Air Cargo", type: "airport", country: "IN", lat: 13.20, lng: 77.71, x: 622, y: 392, tradeVolumeB: 3, sirState: "S", infectionLevel: 0.04, recoveryStep: null },

  // International ports / hubs
  { id: "SG-HUB", name: "Singapore Hub", type: "carrier_hub", country: "SG", lat: 1.35, lng: 103.82, x: 800, y: 410, tradeVolumeB: 41, sirState: "S", infectionLevel: 0.31, recoveryStep: null },
  { id: "AE-DXB", name: "Dubai (Jebel Ali)", type: "major_port", country: "AE", lat: 25.0, lng: 55.06, x: 530, y: 332, tradeVolumeB: 26, sirState: "S", infectionLevel: 0.18, recoveryStep: null },
  { id: "NL-RTM", name: "Rotterdam", type: "major_port", country: "NL", lat: 51.92, lng: 4.48, x: 380, y: 195, tradeVolumeB: 32, sirState: "S", infectionLevel: 0.20, recoveryStep: null },
  { id: "DE-HAM", name: "Hamburg", type: "major_port", country: "DE", lat: 53.55, lng: 9.99, x: 410, y: 188, tradeVolumeB: 19, sirState: "S", infectionLevel: 0.11, recoveryStep: null },
  { id: "US-LAX", name: "Los Angeles", type: "major_port", country: "US", lat: 33.74, lng: -118.27, x: 130, y: 270, tradeVolumeB: 24, sirState: "S", infectionLevel: 0.07, recoveryStep: null },
  { id: "US-NYC", name: "New York / NJ", type: "major_port", country: "US", lat: 40.69, lng: -74.04, x: 230, y: 240, tradeVolumeB: 21, sirState: "S", infectionLevel: 0.05, recoveryStep: null },
  { id: "CN-SHA", name: "Shanghai", type: "major_port", country: "CN", lat: 31.22, lng: 121.46, x: 870, y: 290, tradeVolumeB: 47, sirState: "S", infectionLevel: 0.22, recoveryStep: null },
  { id: "LK-CMB", name: "Colombo", type: "carrier_hub", country: "LK", lat: 6.93, lng: 79.86, x: 640, y: 405, tradeVolumeB: 12, sirState: "S", infectionLevel: 0.19, recoveryStep: null },
  { id: "JP-YOK", name: "Yokohama", type: "major_port", country: "JP", lat: 35.44, lng: 139.64, x: 920, y: 270, tradeVolumeB: 17, sirState: "S", infectionLevel: 0.08, recoveryStep: null },
  { id: "ZA-DUR", name: "Durban", type: "minor_port", country: "ZA", lat: -29.86, lng: 31.02, x: 480, y: 480, tradeVolumeB: 9, sirState: "S", infectionLevel: 0.04, recoveryStep: null },

  // Carrier hubs (logical)
  { id: "HUB-MAERSK", name: "Maersk Hub", type: "carrier_hub", country: "DK", lat: 55.68, lng: 12.57, x: 415, y: 168, tradeVolumeB: 38, sirState: "S", infectionLevel: 0.06, recoveryStep: null },
  { id: "HUB-MSC", name: "MSC Hub", type: "carrier_hub", country: "CH", lat: 46.20, lng: 6.14, x: 388, y: 215, tradeVolumeB: 35, sirState: "S", infectionLevel: 0.05, recoveryStep: null },
  { id: "HUB-CMA", name: "CMA CGM Hub", type: "carrier_hub", country: "FR", lat: 43.30, lng: 5.37, x: 378, y: 230, tradeVolumeB: 26, sirState: "S", infectionLevel: 0.04, recoveryStep: null },
  { id: "HUB-COSCO", name: "COSCO Hub", type: "carrier_hub", country: "CN", lat: 39.90, lng: 116.39, x: 855, y: 248, tradeVolumeB: 31, sirState: "S", infectionLevel: 0.06, recoveryStep: null },
  { id: "HUB-HAPAG", name: "Hapag-Lloyd Hub", type: "carrier_hub", country: "DE", lat: 53.55, lng: 9.99, x: 400, y: 178, tradeVolumeB: 18, sirState: "S", infectionLevel: 0.04, recoveryStep: null },
];

// 48 weighted edges modeling trade lanes
export const NETWORK_EDGES: SupplyChainEdge[] = [
  // India internal corridors
  { source: "IN-DEL", target: "IN-DEL-AIR", weight: 0.6, congestion: 0.2 },
  { source: "IN-DEL", target: "IN-JNPT", weight: 0.9, congestion: 0.55 },
  { source: "IN-DEL", target: "IN-MUN", weight: 0.7, congestion: 0.4 },
  { source: "IN-AHM", target: "IN-MUN", weight: 0.8, congestion: 0.45 },
  { source: "IN-AHM", target: "IN-KAN", weight: 0.55, congestion: 0.3 },
  { source: "IN-PUN", target: "IN-JNPT", weight: 0.85, congestion: 0.6 },
  { source: "IN-MUM-AIR", target: "IN-JNPT", weight: 0.7, congestion: 0.5 },
  { source: "IN-BLR", target: "IN-CHE", weight: 0.8, congestion: 0.35 },
  { source: "IN-BLR", target: "IN-BLR-AIR", weight: 0.6, congestion: 0.2 },
  { source: "IN-HYD", target: "IN-CHE", weight: 0.7, congestion: 0.35 },
  { source: "IN-HYD", target: "IN-VIZ", weight: 0.55, congestion: 0.25 },
  { source: "IN-COC", target: "IN-BLR", weight: 0.45, congestion: 0.2 },
  { source: "IN-TUT", target: "IN-CHE", weight: 0.4, congestion: 0.18 },
  { source: "IN-KOL", target: "IN-DEL", weight: 0.5, congestion: 0.3 },

  // India → MENA / Singapore / Asia
  { source: "IN-JNPT", target: "AE-DXB", weight: 0.95, congestion: 0.7 },
  { source: "IN-JNPT", target: "SG-HUB", weight: 0.92, congestion: 0.6 },
  { source: "IN-JNPT", target: "LK-CMB", weight: 0.7, congestion: 0.55 },
  { source: "IN-MUN", target: "AE-DXB", weight: 0.85, congestion: 0.5 },
  { source: "IN-MUN", target: "SG-HUB", weight: 0.7, congestion: 0.4 },
  { source: "IN-CHE", target: "SG-HUB", weight: 0.8, congestion: 0.4 },
  { source: "IN-CHE", target: "LK-CMB", weight: 0.7, congestion: 0.3 },
  { source: "IN-VIZ", target: "SG-HUB", weight: 0.55, congestion: 0.3 },
  { source: "IN-COC", target: "AE-DXB", weight: 0.45, congestion: 0.25 },

  // Cross-Asia / Pacific
  { source: "SG-HUB", target: "CN-SHA", weight: 0.95, congestion: 0.5 },
  { source: "SG-HUB", target: "JP-YOK", weight: 0.7, congestion: 0.3 },
  { source: "SG-HUB", target: "HUB-COSCO", weight: 0.75, congestion: 0.4 },
  { source: "CN-SHA", target: "HUB-COSCO", weight: 0.95, congestion: 0.45 },
  { source: "CN-SHA", target: "JP-YOK", weight: 0.7, congestion: 0.3 },
  { source: "CN-SHA", target: "US-LAX", weight: 0.92, congestion: 0.55 },
  { source: "JP-YOK", target: "US-LAX", weight: 0.65, congestion: 0.3 },

  // Europe
  { source: "AE-DXB", target: "NL-RTM", weight: 0.85, congestion: 0.4 },
  { source: "AE-DXB", target: "DE-HAM", weight: 0.6, congestion: 0.3 },
  { source: "NL-RTM", target: "DE-HAM", weight: 0.7, congestion: 0.25 },
  { source: "NL-RTM", target: "HUB-MAERSK", weight: 0.85, congestion: 0.3 },
  { source: "NL-RTM", target: "HUB-MSC", weight: 0.7, congestion: 0.25 },
  { source: "NL-RTM", target: "HUB-CMA", weight: 0.65, congestion: 0.2 },
  { source: "DE-HAM", target: "HUB-MAERSK", weight: 0.6, congestion: 0.18 },
  { source: "DE-HAM", target: "HUB-HAPAG", weight: 0.85, congestion: 0.25 },

  // Atlantic
  { source: "NL-RTM", target: "US-NYC", weight: 0.85, congestion: 0.4 },
  { source: "DE-HAM", target: "US-NYC", weight: 0.6, congestion: 0.3 },
  { source: "US-LAX", target: "US-NYC", weight: 0.55, congestion: 0.28 },

  // Africa lane
  { source: "ZA-DUR", target: "AE-DXB", weight: 0.4, congestion: 0.2 },
  { source: "ZA-DUR", target: "NL-RTM", weight: 0.5, congestion: 0.2 },
  { source: "ZA-DUR", target: "SG-HUB", weight: 0.45, congestion: 0.18 },

  // Carrier hub interconnects
  { source: "HUB-MAERSK", target: "HUB-MSC", weight: 0.5, congestion: 0.15 },
  { source: "HUB-CMA", target: "HUB-MSC", weight: 0.45, congestion: 0.15 },
  { source: "HUB-COSCO", target: "HUB-MAERSK", weight: 0.4, congestion: 0.12 },
  { source: "HUB-HAPAG", target: "HUB-MSC", weight: 0.4, congestion: 0.12 },

  // Long-haul India
  { source: "IN-JNPT", target: "NL-RTM", weight: 0.7, congestion: 0.45 },
];
