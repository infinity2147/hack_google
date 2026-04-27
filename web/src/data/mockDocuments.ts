import type { FinancialDocument } from "../types";

const SUPPLIERS = [
  "Reliance Industries",
  "Tata Logistics Pvt Ltd",
  "Adani Ports SEZ",
  "Yokohama Precision Instruments",
  "Durban Mining Corp.",
  "Shenzhen Electron Holdings",
  "Mumbai Textile Exports",
  "Pune Auto Components",
  "Jamnagar Refining Co.",
  "Cochin Spice Traders",
  "Karachi Steel Mills",
  "Bangkok Marine Goods",
  "Rotterdam Coffee Brokers",
  "Hamburg Chemicals AG",
  "Singapore Bunker Trading",
  "Kandla Petrochem Ltd",
];

const BUYERS = [
  "ABC Logistics",
  "Hindustan Unilever",
  "Bharti Retail",
  "ITC Foods",
  "Dr Reddy's Labs",
  "Asian Paints",
  "Mahindra Auto",
  "Maruti Suzuki",
  "Walmart India",
  "Amazon India",
  "Flipkart Wholesale",
  "DMart",
];

const COMMODITIES = [
  "Pharmaceuticals",
  "Steel & Iron",
  "Textiles",
  "Auto Components",
  "Electronics",
  "Petrochemicals",
  "Spices",
  "Edible Oil",
  "Coffee",
  "Bunker Fuel",
];

const SIGNAL_TEMPLATES: Record<FinancialDocument["status"], string[][]> = {
  normal: [["Within historical baseline"]],
  review: [
    ["Minor deviation from baseline"],
    ["Payment terms slightly altered"],
    ["Quantity within ±1σ of baseline"],
  ],
  alert: [
    ["Payment terms changed (Net-30 → Net-15)", "Qty/price ratio +12% from baseline"],
    ["New intermediary entity (unregistered in GLEIF)", "Currency conversion mismatch"],
    ["Supplier credit rating downgraded", "Repeated late-payment signals"],
  ],
  critical: [
    [
      "Payment terms changed Net-30 → Upfront (pre-default)",
      "New intermediary entity (unregistered in GLEIF)",
      "Qty/price ratio: +23% from baseline (>2σ)",
      "No OFAC/EU sanctions match",
    ],
    [
      "Phantom invoicing pattern detected",
      "VAE reconstruction error: 0.67 (normal <0.20)",
      "Supplier graph anomaly score 0.91",
    ],
    [
      "Round-trip transaction detected",
      "Non-existent shipping node in lane",
      "GraphSAGE neighborhood anomaly: 3 new intermediaries / 14 days",
    ],
  ],
};

const DOC_TYPES: FinancialDocument["type"][] = [
  "invoice",
  "bill_of_lading",
  "customs_declaration",
  "purchase_order",
];

function pseudoRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function pickStatus(score: number): FinancialDocument["status"] {
  if (score >= 0.75) return "critical";
  if (score >= 0.55) return "alert";
  if (score >= 0.30) return "review";
  return "normal";
}

export const DOCUMENTS: FinancialDocument[] = (() => {
  const rand = pseudoRandom(7);
  const out: FinancialDocument[] = [];
  for (let i = 0; i < 60; i++) {
    // Skew distribution: ~70% normal, 18% review, 8% alert, 4% critical
    const r = rand();
    let score: number;
    if (r > 0.96) score = 0.78 + rand() * 0.18;
    else if (r > 0.88) score = 0.56 + rand() * 0.18;
    else if (r > 0.70) score = 0.32 + rand() * 0.20;
    else score = rand() * 0.28;

    const status = pickStatus(score);
    const type = DOC_TYPES[Math.floor(rand() * DOC_TYPES.length)];
    const supplier = SUPPLIERS[Math.floor(rand() * SUPPLIERS.length)];
    const buyer = BUYERS[Math.floor(rand() * BUYERS.length)];
    const value = Math.floor(50_000 + rand() * 4_500_000);
    const deviationPct = (score - 0.1) * 38; // rough mapping
    const sigs =
      SIGNAL_TEMPLATES[status][Math.floor(rand() * SIGNAL_TEMPLATES[status].length)];
    const monthsBack = Math.floor(rand() * 8);
    const dt = new Date();
    dt.setMonth(dt.getMonth() - monthsBack);
    dt.setDate(Math.floor(rand() * 27) + 1);

    out.push({
      id: `DOC-${String(i + 1).padStart(4, "0")}`,
      type,
      supplier,
      buyer,
      value,
      date: dt.toISOString().slice(0, 10),
      anomalyScore: Math.round(score * 1000) / 1000,
      deviationPct: Math.round(deviationPct * 100) / 100,
      status,
      signals: sigs,
      commodity: COMMODITIES[Math.floor(rand() * COMMODITIES.length)],
      paymentTerms: ["Net 15", "Net 30", "Net 45", "Upfront", "LC"][
        Math.floor(rand() * 5)
      ],
    });
  }
  return out.sort((a, b) => b.anomalyScore - a.anomalyScore);
})();

export const DOCUMENT_TOTAL_COUNT = 500;
export const DOCUMENT_VALUE_PROCESSED = 847_000_000; // $847M
