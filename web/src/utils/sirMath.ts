import type { SupplyChainNode, SupplyChainEdge, SIRStep } from "../types";

interface NodeRuntime {
  id: string;
  state: "S" | "I" | "R";
  infection: number; // continuous fraction 0-1
  recoveryStep: number | null;
}

export function buildAdjacency(
  nodes: SupplyChainNode[],
  edges: SupplyChainEdge[],
): Record<string, { id: string; w: number }[]> {
  const adj: Record<string, { id: string; w: number }[]> = {};
  for (const n of nodes) adj[n.id] = [];
  for (const e of edges) {
    adj[e.source].push({ id: e.target, w: e.weight });
    adj[e.target].push({ id: e.source, w: e.weight });
  }
  return adj;
}

export interface SIRSimResult {
  runtime: Record<string, NodeRuntime>;
  history: SIRStep[];
  step: number;
  R0: number;
}

export function initRuntime(nodes: SupplyChainNode[]): Record<string, NodeRuntime> {
  const r: Record<string, NodeRuntime> = {};
  for (const n of nodes) {
    r[n.id] = {
      id: n.id,
      state: "S",
      infection: 0,
      recoveryStep: null,
    };
  }
  return r;
}

export function seedDisruption(
  runtime: Record<string, NodeRuntime>,
  nodeId: string,
  severity: number,
): Record<string, NodeRuntime> {
  const next = { ...runtime };
  if (!next[nodeId]) return next;
  next[nodeId] = {
    ...next[nodeId],
    state: "I",
    infection: Math.min(1, Math.max(0.3, severity)),
  };
  return next;
}

// Euler integration of network SIR (one step = ~6 hours)
export function stepSIRNetwork(
  runtime: Record<string, NodeRuntime>,
  adj: Record<string, { id: string; w: number }[]>,
  beta: number,
  gamma: number,
  step: number,
): { runtime: Record<string, NodeRuntime>; aggregate: SIRStep } {
  const next: Record<string, NodeRuntime> = {};
  const ids = Object.keys(runtime);

  for (const id of ids) {
    const node = runtime[id];
    let inf = node.infection;

    // Susceptible can become infected via neighbors
    if (node.state === "S") {
      const force =
        adj[id].reduce((acc, nb) => acc + runtime[nb.id].infection * nb.w, 0) /
        Math.max(1, adj[id].length);
      // dS/dt = -β · S · sum(A·I)
      const dInf = beta * Math.max(0, 1 - inf) * force;
      inf = Math.min(1, inf + dInf);
      const newState = inf > 0.18 ? "I" : "S";
      next[id] = {
        ...node,
        state: newState,
        infection: inf,
      };
    } else if (node.state === "I") {
      // Recovery: dI/dt = -γ·I; once infection drops below 0.05 → R
      inf = Math.max(0, inf - gamma);
      // small chance further infection if heavy neighbors
      const force =
        adj[id].reduce((acc, nb) => acc + runtime[nb.id].infection * nb.w, 0) /
        Math.max(1, adj[id].length);
      inf = Math.min(1, inf + beta * 0.4 * force * (1 - inf));
      let state: "I" | "R" = "I";
      let rec = node.recoveryStep;
      if (inf < 0.05) {
        state = "R";
        rec = step;
      }
      next[id] = { ...node, state, infection: inf, recoveryStep: rec };
    } else {
      // Recovered (immune for the simulation) — slow decay back to 0
      next[id] = { ...node, infection: Math.max(0, inf - 0.01) };
    }
  }

  // Aggregate fractions
  const total = ids.length;
  let S = 0, I = 0, R = 0;
  for (const id of ids) {
    if (next[id].state === "S") S++;
    else if (next[id].state === "I") I++;
    else R++;
  }
  // mean degree of infected subgraph for R0 estimate
  const infectedIds = ids.filter((id) => next[id].state === "I");
  const meanDeg = infectedIds.length
    ? infectedIds.reduce((a, id) => a + adj[id].length, 0) / infectedIds.length
    : 3;
  const R0 = (beta / Math.max(0.001, gamma)) * (meanDeg / 6); // normalized to feel realistic
  return {
    runtime: next,
    aggregate: {
      step,
      S: +(S / total).toFixed(3),
      I: +(I / total).toFixed(3),
      R: +(R / total).toFixed(3),
      R0: +R0.toFixed(2),
    },
  };
}

export function herdImmunityThreshold(R0: number): number {
  if (R0 <= 1) return 0;
  return 1 - 1 / R0;
}
