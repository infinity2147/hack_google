import type { VoiceNote, Contributor } from "../types";

const INDIA_LOCATIONS = [
  { name: "Nashik Highway Junction", state: "Maharashtra", lat: 20.003, lng: 73.791 },
  { name: "Surat Hazira Port Road", state: "Gujarat", lat: 21.0936, lng: 72.6512 },
  { name: "JNPT Gate-3 Approach", state: "Maharashtra", lat: 18.95, lng: 72.95 },
  { name: "Mundra Port Approach", state: "Gujarat", lat: 22.83, lng: 69.71 },
  { name: "Chennai Port Tollgate", state: "Tamil Nadu", lat: 13.08, lng: 80.27 },
  { name: "Bangalore NICE Junction", state: "Karnataka", lat: 12.97, lng: 77.59 },
  { name: "Hyderabad ORR Junction", state: "Telangana", lat: 17.39, lng: 78.49 },
  { name: "Kolkata Vidyasagar Setu", state: "West Bengal", lat: 22.55, lng: 88.34 },
  { name: "Delhi Tikri Border", state: "Delhi NCR", lat: 28.69, lng: 76.96 },
  { name: "Pune Mumbai Expressway", state: "Maharashtra", lat: 18.76, lng: 73.41 },
  { name: "Kandla Port Entry", state: "Gujarat", lat: 23.02, lng: 70.22 },
  { name: "Vizag Port Approach", state: "Andhra Pradesh", lat: 17.69, lng: 83.22 },
  { name: "Cochin Container Yard", state: "Kerala", lat: 9.97, lng: 76.27 },
  { name: "Tuticorin Port Road", state: "Tamil Nadu", lat: 8.79, lng: 78.13 },
  { name: "Ahmedabad SG Highway", state: "Gujarat", lat: 23.02, lng: 72.57 },
  { name: "Indore Pithampur Belt", state: "Madhya Pradesh", lat: 22.61, lng: 75.69 },
  { name: "Lucknow Sultanpur Highway", state: "Uttar Pradesh", lat: 26.85, lng: 80.95 },
  { name: "Jaipur RIICO Industrial", state: "Rajasthan", lat: 26.91, lng: 75.79 },
  { name: "Bhubaneswar Cuttack Bypass", state: "Odisha", lat: 20.30, lng: 85.82 },
  { name: "Coimbatore Avinashi Road", state: "Tamil Nadu", lat: 11.02, lng: 76.97 },
  { name: "Vijayawada Highway 16", state: "Andhra Pradesh", lat: 16.51, lng: 80.65 },
  { name: "Guwahati Khanapara Toll", state: "Assam", lat: 26.10, lng: 91.79 },
  { name: "Patna Bhojpur Rd", state: "Bihar", lat: 25.59, lng: 85.13 },
  { name: "Chandigarh Ambala Belt", state: "Punjab", lat: 30.74, lng: 76.78 },
  { name: "Ranchi Ramgarh Highway", state: "Jharkhand", lat: 23.34, lng: 85.32 },
];

const CATEGORIES: VoiceNote["category"][] = [
  "congestion",
  "weather",
  "accident",
  "customs_delay",
  "strike",
];

const LANGUAGES: VoiceNote["language"][] = [
  "Hindi",
  "Tamil",
  "Bengali",
  "Marathi",
  "Telugu",
  "Gujarati",
  "Punjabi",
  "Odia",
];

function pseudoRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

export const VOICE_NOTES: VoiceNote[] = (() => {
  const rand = pseudoRandom(11);
  const out: VoiceNote[] = [];
  for (let i = 0; i < 250; i++) {
    const loc = INDIA_LOCATIONS[Math.floor(rand() * INDIA_LOCATIONS.length)];
    const cat =
      rand() > 0.6
        ? "congestion"
        : CATEGORIES[Math.floor(rand() * CATEGORIES.length)];
    const cred = 0.4 + rand() * 0.55;
    const sev = rand() * 0.95;
    const verified = cred > 0.65 && rand() > 0.35;
    const dt = new Date();
    dt.setHours(dt.getHours() - Math.floor(rand() * 72));
    out.push({
      id: `VN-${String(i + 1).padStart(5, "0")}`,
      contributorId: `${rand() > 0.5 ? "DRV" : "WRK"}-${String(
        Math.floor(rand() * 250),
      ).padStart(4, "0")}`,
      timestamp: dt.toISOString(),
      locationName: loc.name,
      state: loc.state,
      lat: loc.lat + (rand() - 0.5) * 0.1,
      lng: loc.lng + (rand() - 0.5) * 0.1,
      category: cat,
      language: LANGUAGES[Math.floor(rand() * LANGUAGES.length)],
      durationSec: 8 + Math.floor(rand() * 8),
      credibilityScore: Math.round(cred * 1000) / 1000,
      severity: Math.round(sev * 1000) / 1000,
      verified,
      nearbyReports: Math.floor(rand() * 8),
    });
  }
  return out.sort(
    (a, b) => +new Date(b.timestamp) - +new Date(a.timestamp),
  );
})();

export const CROWD_STATS = {
  totalReports: 2847,
  verifiedReports: 1923,
  verificationRate: 0.675,
  activeContributors: 847,
  avgCredibility: 0.74,
  networkValue: 5834, // ∝ n^1.5
  languagesSupported: 8,
};

export const TOP_CONTRIBUTORS: Contributor[] = [
  { id: "DRV-0042", role: "Truck Driver", state: "Maharashtra", reports: 147, verified: 128, credibility: 0.94, impact: 0.89 },
  { id: "WRK-0007", role: "Warehouse Lead", state: "Gujarat", reports: 132, verified: 112, credibility: 0.91, impact: 0.84 },
  { id: "DRV-0118", role: "Long-haul Driver", state: "Tamil Nadu", reports: 121, verified: 98, credibility: 0.86, impact: 0.79 },
  { id: "DRV-0203", role: "Truck Driver", state: "Punjab", reports: 109, verified: 87, credibility: 0.83, impact: 0.74 },
  { id: "WRK-0044", role: "Port Operator", state: "Andhra Pradesh", reports: 98, verified: 81, credibility: 0.81, impact: 0.71 },
  { id: "DRV-0301", role: "Cold-chain Driver", state: "Karnataka", reports: 87, verified: 70, credibility: 0.78, impact: 0.66 },
  { id: "WRK-0118", role: "ICD Supervisor", state: "Delhi NCR", reports: 79, verified: 64, credibility: 0.77, impact: 0.62 },
];

export const CATEGORY_BREAKDOWN = [
  { name: "Congestion", value: 38, color: "#f59e0b" },
  { name: "Weather", value: 22, color: "#3b82f6" },
  { name: "Accident", value: 18, color: "#ef4444" },
  { name: "Customs Delay", value: 12, color: "#8b5cf6" },
  { name: "Strike", value: 7, color: "#f97316" },
  { name: "Other", value: 3, color: "#64748b" },
];
