import { create } from "zustand";
import type {
  AlertItem,
  Antibody,
  Bid,
  ImmuneScanResult,
  Negotiation,
  SIRStep,
  SupplyChainNode,
} from "../types";
import { NETWORK_NODES, NETWORK_EDGES } from "../data/mockNetwork";
import { ANTIBODIES, DEFAULT_SENSOR_EMBEDDING } from "../data/mockAntibodies";
import { LIVE_ALERTS } from "../data/mockEvents";
import { CARRIERS } from "../data/mockCarriers";
import {
  buildAdjacency,
  initRuntime,
  seedDisruption as seedDisruptionFn,
  stepSIRNetwork,
} from "../utils/sirMath";
import { cosineSimilarity } from "../utils/cosineSimilarity";

interface NodeRuntime {
  id: string;
  state: "S" | "I" | "R";
  infection: number;
  recoveryStep: number | null;
}

interface NexusState {
  // SIR sim
  beta: number;
  gamma: number;
  step: number;
  history: SIRStep[];
  runtime: Record<string, NodeRuntime>;
  R0: number;

  // controls
  seedNode: string;
  seedSeverity: number;

  // alerts
  alerts: AlertItem[];

  // immune
  sensorEmbedding: number[];
  antibodies: Antibody[];
  immuneThreshold: number;
  lastScan: ImmuneScanResult | null;

  // route market
  urgency: number;
  origin: string;
  destination: string;
  lastNegotiation: Negotiation | null;
  negotiationHistory: Negotiation[];
  negotiating: boolean;

  // actions
  setSeedNode: (id: string) => void;
  setSeedSeverity: (s: number) => void;
  setBeta: (b: number) => void;
  setGamma: (g: number) => void;
  setUrgency: (u: number) => void;
  setOrigin: (id: string) => void;
  setDestination: (id: string) => void;
  setSensorDimension: (idx: number, value: number) => void;

  seedDisruption: () => void;
  step1: () => void;
  stepN: (n: number) => void;
  resetSim: () => void;

  scanImmune: () => void;
  randomizeSensors: () => void;

  runNegotiation: () => Promise<void>;

  dismissAlert: (id: string) => void;
  pushAlert: (a: AlertItem) => void;
}

const adjacency = buildAdjacency(NETWORK_NODES, NETWORK_EDGES);

function defaultRuntime(): Record<string, NodeRuntime> {
  // Start with a baseline disruption seeded at JNPT to make UI lively
  const r = initRuntime(NETWORK_NODES);
  return seedDisruptionFn(r, "IN-JNPT", 0.7);
}

export const useNexus = create<NexusState>((set, get) => ({
  beta: 0.25,
  gamma: 0.10,
  step: 0,
  history: [{ step: 0, S: 0.96, I: 0.04, R: 0, R0: 1.87 }],
  runtime: defaultRuntime(),
  R0: 1.87,

  seedNode: "IN-JNPT",
  seedSeverity: 0.7,

  alerts: LIVE_ALERTS,

  sensorEmbedding: [...DEFAULT_SENSOR_EMBEDDING],
  antibodies: ANTIBODIES,
  immuneThreshold: 0.82,
  lastScan: null,

  urgency: 0.7,
  origin: "IN-JNPT",
  destination: "NL-RTM",
  lastNegotiation: null,
  negotiationHistory: [],
  negotiating: false,

  setSeedNode: (id) => set({ seedNode: id }),
  setSeedSeverity: (s) => set({ seedSeverity: s }),
  setBeta: (b) => set({ beta: b }),
  setGamma: (g) => set({ gamma: g }),
  setUrgency: (u) => set({ urgency: u }),
  setOrigin: (id) => set({ origin: id }),
  setDestination: (id) => set({ destination: id }),
  setSensorDimension: (idx, value) =>
    set((s) => {
      const next = [...s.sensorEmbedding];
      next[idx] = value;
      return { sensorEmbedding: next };
    }),

  seedDisruption: () => {
    const { runtime, seedNode, seedSeverity } = get();
    const next = seedDisruptionFn(runtime, seedNode, seedSeverity);
    set({ runtime: next });
  },

  step1: () => {
    const { runtime, beta, gamma, step, history } = get();
    const result = stepSIRNetwork(runtime, adjacency, beta, gamma, step + 1);
    set({
      runtime: result.runtime,
      history: [...history, result.aggregate].slice(-200),
      step: step + 1,
      R0: result.aggregate.R0,
    });
  },

  stepN: (n) => {
    let { runtime, beta, gamma, step, history } = get();
    let R0 = get().R0;
    const newHistory = [...history];
    for (let i = 0; i < n; i++) {
      step += 1;
      const r = stepSIRNetwork(runtime, adjacency, beta, gamma, step);
      runtime = r.runtime;
      newHistory.push(r.aggregate);
      R0 = r.aggregate.R0;
    }
    set({
      runtime,
      step,
      history: newHistory.slice(-200),
      R0,
    });
  },

  resetSim: () =>
    set({
      runtime: defaultRuntime(),
      step: 0,
      history: [{ step: 0, S: 0.96, I: 0.04, R: 0, R0: 1.87 }],
      R0: 1.87,
    }),

  scanImmune: () => {
    const { sensorEmbedding, antibodies, immuneThreshold } = get();
    let bestId = antibodies[0].id;
    let bestSim = -1;
    for (const ab of antibodies) {
      const s = cosineSimilarity(sensorEmbedding, ab.pattern);
      if (s > bestSim) {
        bestSim = s;
        bestId = ab.id;
      }
    }
    const fired = bestSim >= immuneThreshold;
    const matched = antibodies.find((a) => a.id === bestId)!;
    const recommendedActions = fired
      ? [
          `Backup supplier route activated (matched ${matched.code})`,
          "3 alternate routes flagged for high-priority cargo",
          "Inventory buffer alert sent to 4 warehouses",
          "Ops team notified via Slack/SMS",
        ]
      : [
          `No antibody crossed threshold (best: ${matched.code})`,
          "Monitoring continues at 15-minute cadence",
        ];

    set({
      lastScan: {
        bestMatchId: bestId,
        similarity: +bestSim.toFixed(3),
        fired,
        threshold: immuneThreshold,
        embedding: [...sensorEmbedding],
        recommendedActions,
      },
    });

    if (fired) {
      get().pushAlert({
        id: `IM-${Date.now()}`,
        level: "immune",
        title: "Immune response fired",
        detail: `Matched ${matched.code}`,
        meta: `cos = ${bestSim.toFixed(3)} > τ = ${immuneThreshold}`,
        cta: "View Match",
        ago: "now",
      });
    }
  },

  randomizeSensors: () => {
    const next: number[] = [];
    for (let i = 0; i < 8; i++) {
      next.push(+Math.max(0, Math.min(1, 0.3 + Math.random() * 0.6)).toFixed(2));
    }
    set({ sensorEmbedding: next });
  },

  runNegotiation: async () => {
    const { urgency, origin, destination, R0, runtime } = get();
    set({ negotiating: true });
    // Simulate sealed bidding
    await new Promise((r) => setTimeout(r, 600));

    const orig = NETWORK_NODES.find((n) => n.id === origin);
    const dest = NETWORK_NODES.find((n) => n.id === destination);
    const distance =
      orig && dest
        ? Math.sqrt(
            (orig.x - dest.x) ** 2 + (orig.y - dest.y) ** 2,
          ) / 100
        : 8;

    const bids: Bid[] = CARRIERS.map((c) => {
      const random = (Math.random() - 0.5) * 6000;
      const congestionRisk =
        ((runtime[origin]?.infection ?? 0) +
          (runtime[destination]?.infection ?? 0)) /
        2;
      const bid =
        Math.round(
          (c.baseRate + distance * 1100 + random) *
            (1 + congestionRisk * 0.15) *
            (1 + (1 - urgency) * 0.05),
        );
      const transit = Math.round(28 - c.speedScore * 12 + (Math.random() - 0.5) * 2);
      const risk = +(0.45 - c.reliabilityScore * 0.4 + congestionRisk * 0.3).toFixed(2);
      const score = +(
        (urgency * c.speedScore + (1 - urgency) * (1 - bid / 70000) +
          c.reliabilityScore * 0.4 -
          risk * 0.3) /
        2 + 0.5
      ).toFixed(4);
      return {
        carrier: c.id,
        bid,
        transitDays: transit,
        riskScore: risk,
        score,
      };
    });

    // Vickrey: highest score wins, pays second-highest score's bid
    const sorted = [...bids].sort((a, b) => b.score - a.score);
    const winner = sorted[0];
    const second = sorted[1];
    const ts = new Date().toISOString();

    const path = [origin];
    if (R0 > 1.5) path.push("LK-CMB"); // Colombo transshipment when high R0
    path.push("SG-HUB");
    path.push(destination);

    const negotiation: Negotiation = {
      round: get().negotiationHistory.length + 1,
      origin,
      destination,
      urgency,
      bids,
      winnerId: winner.carrier,
      paymentPrice: second.bid,
      routePath: path,
      ts,
    };

    await new Promise((r) => setTimeout(r, 700));
    set((s) => ({
      lastNegotiation: negotiation,
      negotiationHistory: [negotiation, ...s.negotiationHistory].slice(0, 25),
      negotiating: false,
    }));
  },

  dismissAlert: (id) => set((s) => ({ alerts: s.alerts.filter((a) => a.id !== id) })),
  pushAlert: (a) => set((s) => ({ alerts: [a, ...s.alerts] })),
}));

export function getNodeById(id: string): SupplyChainNode | undefined {
  return NETWORK_NODES.find((n) => n.id === id);
}
