import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch, apiPost, apiPut } from "./client";

// ─── Command Center ──────────────────────────────────────────────────────────

export function useCommandCenterData() {
  return useQuery({
    queryKey: ["command-center"],
    queryFn: () => apiFetch<{
      networkHealth: number; disruptionIndex: number; R0: number;
      activeAlerts: number; docAnomalies: number; crowdReports: number;
      monitoredContainers: number; reroutedToday: number;
      shipments: number; cascadesPrevented: number; avgResponseHours: number;
      costSaved: number; susceptible: number; infected: number; recovered: number;
      alerts: Array<{ id: string; level: string; title: string; detail: string; meta: string; cta: string; ago: string }>;
    }>("/health/command-center"),
    refetchInterval: 15000,
  });
}

// ─── SIR ─────────────────────────────────────────────────────────────────────

export function useSIRState() {
  return useQuery({
    queryKey: ["sir", "state"],
    queryFn: () => apiFetch<{
      step: number; R0: number; beta: number; gamma: number;
      nodes: Record<string, { state: string; infection: number; recovery_step: number | null }>;
    }>("/sir/state"),
    refetchInterval: 10000,
  });
}

export function useSIRHistory() {
  return useQuery({
    queryKey: ["sir", "history"],
    queryFn: () => apiFetch<Array<{ step: number; S: number; I: number; R: number; R0: number }>>("/sir/history"),
  });
}

export function useSeedDisruption() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { node_id: string; severity: number }) => apiPost("/sir/seed", params),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sir"] }),
  });
}

export function useStepSimulation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { n: number }) => apiPost("/sir/step", params),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sir"] }),
  });
}

export function useResetSimulation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiPost("/sir/reset", {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sir"] }),
  });
}

export function useUpdateSIRParams() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { beta?: number; gamma?: number }) => apiPut("/sir/params", params),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sir"] }),
  });
}

// ─── Network ────────────────────────────────────────────────────────────────

export function useNetworkNodes() {
  return useQuery({
    queryKey: ["network", "nodes"],
    queryFn: () => apiFetch<Array<{
      id: string; name: string; type: string; country: string;
      lat: number; lng: number; tradeVolumeB: number;
      sirState: string; infectionLevel: number; recoveryStep: number | null;
    }>>("/network/nodes"),
  });
}

export function useNetworkEdges() {
  return useQuery({
    queryKey: ["network", "edges"],
    queryFn: () => apiFetch<Array<{ source: string; target: string; weight: number }>>("/network/edges"),
  });
}

export function useNetworkStats() {
  return useQuery({
    queryKey: ["network", "stats"],
    queryFn: () => apiFetch<{
      totalNodes: number; totalEdges: number;
      nodeTypes: Record<string, number>;
      sirCounts: { S: number; I: number; R: number };
    }>("/network/stats"),
  });
}

// ─── Documents ──────────────────────────────────────────────────────────────

export function useDocuments(params?: { status?: string; doc_type?: string; search?: string; page?: number }) {
  const qs = new URLSearchParams();
  if (params?.status) qs.set("status", params.status);
  if (params?.doc_type) qs.set("doc_type", params.doc_type);
  if (params?.search) qs.set("search", params.search);
  if (params?.page) qs.set("page", String(params.page));
  const query = qs.toString();
  return useQuery({
    queryKey: ["documents", params],
    queryFn: () => apiFetch<{ items: unknown[]; total: number; page: number; pageSize: number }>(`/documents?${query}`),
  });
}

export function useDocumentSummary() {
  return useQuery({
    queryKey: ["documents", "summary"],
    queryFn: () => apiFetch<{
      total: number; normal: number; review: number; alert: number; critical: number;
      avgAnomaly: number; totalValue: number;
    }>("/documents/summary"),
  });
}

export function useDocumentHeatmap() {
  return useQuery({
    queryKey: ["documents", "heatmap"],
    queryFn: () => apiFetch<{
      types: string[]; hours: number[];
      grid: Array<{ row: string; cells: number[] }>;
    }>("/documents/heatmap"),
  });
}

// ─── Crowd ──────────────────────────────────────────────────────────────────

export function useCrowdStats() {
  return useQuery({
    queryKey: ["crowd", "stats"],
    queryFn: () => apiFetch<{
      totalReports: number; verifiedReports: number; verificationRate: number;
      activeContributors: number; avgCredibility: number; categoryBreakdown: Record<string, number>;
    }>("/crowd/stats"),
  });
}

export function useVoiceNotes(params?: { category?: string; verified?: string }) {
  const qs = new URLSearchParams();
  if (params?.category) qs.set("category", params.category);
  if (params?.verified) qs.set("verified", params.verified);
  return useQuery({
    queryKey: ["crowd", "voice-notes", params],
    queryFn: () => apiFetch<{ items: unknown[]; total: number }>(`/crowd/voice-notes?${qs.toString()}`),
  });
}

export function useContributors() {
  return useQuery({
    queryKey: ["crowd", "contributors"],
    queryFn: () => apiFetch<Array<unknown>>("/crowd/contributors"),
  });
}

// ─── Shipments ──────────────────────────────────────────────────────────────

export function useShipments(params?: { status?: string; search?: string }) {
  const qs = new URLSearchParams();
  if (params?.status) qs.set("status", params.status);
  if (params?.search) qs.set("search", params.search);
  return useQuery({
    queryKey: ["shipments", params],
    queryFn: () => apiFetch<{ items: unknown[]; total: number }>(`/shipments?${qs.toString()}`),
  });
}

export function useShipmentStats() {
  return useQuery({
    queryKey: ["shipments", "stats"],
    queryFn: () => apiFetch<{
      total: number; inTransit: number; delayed: number; disrupted: number;
      delivered: number; onTimeRate: number;
    }>("/shipments/stats"),
  });
}

// ─── Market ─────────────────────────────────────────────────────────────────

export function useNegotiate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { origin: string; destination: string; urgency: number }) =>
      apiPost("/market/negotiate", params),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["market"] }),
  });
}

export function useMarketHistory() {
  return useQuery({
    queryKey: ["market", "history"],
    queryFn: () => apiFetch<Array<unknown>>("/market/history"),
  });
}

export function useMarketAgents() {
  return useQuery({
    queryKey: ["market", "agents"],
    queryFn: () => apiFetch<Array<unknown>>("/market/agents"),
  });
}

// ─── Scenarios ──────────────────────────────────────────────────────────────

export function useScenarioPresets() {
  return useQuery({
    queryKey: ["scenarios", "presets"],
    queryFn: () => apiFetch<Array<{
      name: string; description: string; seedNodes: string[];
      severity: number; betaMult: number;
    }>>("/scenarios/presets"),
  });
}

export function useRunScenario() {
  return useMutation({
    mutationFn: (params: { preset_name: string }) => apiPost("/scenarios/run", params),
  });
}

// ─── Disruptions ────────────────────────────────────────────────────────────

export function useDisruptions(params?: { disruption_type?: string; min_r0?: number }) {
  const qs = new URLSearchParams();
  if (params?.disruption_type) qs.set("disruption_type", params.disruption_type);
  if (params?.min_r0) qs.set("min_r0", String(params.min_r0));
  return useQuery({
    queryKey: ["disruptions", params],
    queryFn: () => apiFetch<Array<unknown>>(`/disruptions?${qs.toString()}`),
  });
}

export function useHealthTrend() {
  return useQuery({
    queryKey: ["disruptions", "health-trend"],
    queryFn: () => apiFetch<Array<{ date: string; healthScore: number; eventCount: number; avgSeverity: number; totalLoss: number }>>("/disruptions/health-trend"),
  });
}

export function useMostDisrupted() {
  return useQuery({
    queryKey: ["disruptions", "most-disrupted"],
    queryFn: () => apiFetch<Array<unknown>>("/disruptions/most-disrupted"),
  });
}

export function useTopDisruptedRoutes() {
  return useQuery({
    queryKey: ["disruptions", "top-routes"],
    queryFn: () => apiFetch<Array<{ route: string; severity: number; r0: number; events: number }>>("/disruptions/top-routes"),
    refetchInterval: 15000,
  });
}

export function useFastestRecovery() {
  return useQuery({
    queryKey: ["disruptions", "fastest-recovery"],
    queryFn: () => apiFetch<Array<unknown>>("/disruptions/fastest-recovery"),
  });
}

// ─── Immune ─────────────────────────────────────────────────────────────────

export function useImmuneLibrary() {
  return useQuery({
    queryKey: ["immune", "library"],
    queryFn: () => apiFetch<{
      antibodies: Array<unknown>; dimensions: string[]; threshold: number;
    }>("/immune/library"),
  });
}

export function useImmuneScan() {
  return useMutation({
    mutationFn: (params: { sensor_vector: number[] }) => apiPost("/immune/scan", params),
  });
}

export function useImmuneRandomScan() {
  return useMutation({
    mutationFn: () => apiPost("/immune/random-scan", {}),
  });
}

// ─── Decisions ──────────────────────────────────────────────────────────────

export function useDecisionLog(actionType?: string) {
  const qs = actionType ? `?action_type=${actionType}` : "";
  return useQuery({
    queryKey: ["decisions", actionType],
    queryFn: () => apiFetch<Array<unknown>>(`/decisions${qs}`),
  });
}

export function useLogDecision() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { action_type: string; target: string; details?: Record<string, unknown> }) =>
      apiPost("/decisions", params),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["decisions"] }),
  });
}