export type SIRState = "S" | "I" | "R";

export type NodeType =
  | "major_port"
  | "minor_port"
  | "icd"
  | "carrier_hub"
  | "airport";

export interface SupplyChainNode {
  id: string;
  name: string;
  type: NodeType;
  country: string;
  lat: number;
  lng: number;
  // x/y are layout coords on a 1000x600 SVG canvas (set in mockNetwork)
  x: number;
  y: number;
  tradeVolumeB: number;
  sirState: SIRState;
  infectionLevel: number;
  recoveryStep: number | null;
}

export interface SupplyChainEdge {
  source: string;
  target: string;
  weight: number; // 0-1
  congestion: number; // 0-1
}

export interface AlertItem {
  id: string;
  level: "critical" | "alert" | "review" | "immune" | "normal";
  title: string;
  detail: string;
  meta: string;
  cta?: string;
  ago: string;
}

export interface Antibody {
  id: string;
  code: string;
  type: string;
  location: string;
  severity: number;
  pattern: number[]; // length 8 (signal profile)
  lastTriggered: string;
  matchConfidence: number;
}

export interface CarrierAgent {
  id: string;
  code: string;
  name: string;
  agent: string; // α₁ etc
  riskTolerance: "Conservative" | "Balanced" | "Aggressive";
  speed: "Low" | "Medium" | "High";
  costProfile: "Low" | "Medium" | "High";
  winRate: number;
  avgBidDelta: number;
  strategy: string;
  baseRate: number; // for bid generation
  speedScore: number;
  reliabilityScore: number;
  color: string;
}

export interface Bid {
  carrier: string;
  bid: number;
  transitDays: number;
  riskScore: number;
  score: number;
}

export interface Negotiation {
  round: number;
  origin: string;
  destination: string;
  urgency: number;
  bids: Bid[];
  winnerId: string;
  paymentPrice: number;
  routePath: string[];
  ts: string;
}

export interface FinancialDocument {
  id: string;
  type: "invoice" | "bill_of_lading" | "customs_declaration" | "purchase_order";
  supplier: string;
  buyer: string;
  value: number;
  date: string;
  anomalyScore: number;
  deviationPct: number;
  status: "normal" | "review" | "alert" | "critical";
  signals: string[];
  commodity?: string;
  paymentTerms?: string;
}

export interface VoiceNote {
  id: string;
  contributorId: string;
  timestamp: string;
  locationName: string;
  state: string;
  lat: number;
  lng: number;
  category:
    | "congestion"
    | "weather"
    | "accident"
    | "customs_delay"
    | "strike";
  language:
    | "Hindi"
    | "Tamil"
    | "Bengali"
    | "Marathi"
    | "Telugu"
    | "Gujarati"
    | "Punjabi"
    | "Odia";
  durationSec: number;
  credibilityScore: number;
  severity: number;
  verified: boolean;
  nearbyReports: number;
}

export interface DisruptionEvent {
  id: string;
  type:
    | "Port Strike"
    | "Cyclone"
    | "Geopolitical"
    | "Customs Delay"
    | "Cyber"
    | "Equipment"
    | "Labor"
    | "Port Congestion";
  location: string;
  date: string;
  peakR0: number;
  economicLossUSD: number;
  cascadeHops: number;
  durationDays: number;
}

export interface SIRStep {
  step: number;
  S: number; // fraction
  I: number;
  R: number;
  R0: number;
}

export interface ImmuneScanResult {
  bestMatchId: string;
  similarity: number;
  fired: boolean;
  threshold: number;
  embedding: number[];
  recommendedActions: string[];
}

export interface Contributor {
  id: string;
  role: string;
  state: string;
  reports: number;
  verified: number;
  credibility: number;
  impact: number;
}

// ─── New types for 7 improvements ─────────────────────────────────────────

export interface DecisionEntry {
  id: string;
  timestamp: string;
  actionType: string;
  target: string;
  details: Record<string, unknown>;
}

export interface ScenarioPreset {
  name: string;
  description: string;
  seedNodes: string[];
  severity: number;
  betaMult: number;
}

export interface ScenarioResult {
  name: string;
  beforeHealth: number;
  afterHealth: number;
  healthDelta: number;
  affectedNodes: string[];
  costEstimate: number;
}

export interface Shipment {
  id: string;
  bookingDate: string;
  originId: string;
  originName: string;
  destId: string;
  destName: string;
  commodity: string;
  carrier: string;
  status: "delivered" | "in_transit" | "delayed" | "disrupted";
  transitDaysPlanned: number;
  transitDaysActual: number;
  delayDays: number;
  teu: number;
  costUSD: number;
  riskScore: number;
  disruptionFlag: boolean;
  transportMode: string;
}

export interface HealthTrendDay {
  date: string;
  healthScore: number;
  eventCount: number;
  avgSeverity: number;
  totalLoss: number;
}
