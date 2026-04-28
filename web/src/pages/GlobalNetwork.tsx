import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import {
  Globe,
  X,
  Zap,
  Activity,
  ChevronRight,
  Eye,
  EyeOff,
  Filter,
} from "lucide-react";
import { PageWrapper } from "../components/layout/PageWrapper";
import { Card } from "../components/shared/Card";
import { StatusBadge } from "../components/shared/StatusBadge";
import { SeverityBar } from "../components/shared/SeverityBar";
import { GeoNetworkMap } from "../components/network/GeoNetworkMap";
import { useNexus } from "../store/nexusStore";
import { NETWORK_NODES, NETWORK_EDGES } from "../data/mockNetwork";
import { HISTORICAL_DISRUPTIONS } from "../data/mockEvents";
import { formatCurrency } from "../utils/formatters";
import type { NodeType, SupplyChainNode } from "../types";

export function GlobalNetwork() {
  const { runtime, R0, setSeedNode, setSeedSeverity, seedDisruption } = useNexus();
  const [selected, setSelected] = useState<SupplyChainNode | null>(null);
  const [showLabels, setShowLabels] = useState(true);
  const [showHistorical, setShowHistorical] = useState(false);
  const [typeFilter, setTypeFilter] = useState<NodeType | "all">("all");

  const counts = useMemo(() => {
    let major = 0, minor = 0, icd = 0, hub = 0, air = 0;
    for (const n of NETWORK_NODES) {
      if (n.type === "major_port") major++;
      else if (n.type === "minor_port") minor++;
      else if (n.type === "icd") icd++;
      else if (n.type === "carrier_hub") hub++;
      else if (n.type === "airport") air++;
    }
    return { major, minor, icd, hub, air };
  }, []);

  const sirCounts = useMemo(() => {
    let S = 0, I = 0, R = 0;
    for (const id of Object.keys(runtime)) {
      const s = runtime[id].state;
      if (s === "S") S++;
      else if (s === "I") I++;
      else R++;
    }
    return { S, I, R };
  }, [runtime]);

  const neighborsOfSelected = useMemo(() => {
    if (!selected) return [] as { id: string; name: string; risk: number }[];
    const out: { id: string; name: string; risk: number }[] = [];
    for (const e of NETWORK_EDGES) {
      let other: string | null = null;
      if (e.source === selected.id) other = e.target;
      else if (e.target === selected.id) other = e.source;
      if (other) {
        const n = NETWORK_NODES.find((nn) => nn.id === other);
        if (n) {
          const inf = runtime[other]?.infection ?? 0;
          out.push({ id: n.id, name: n.name, risk: +Math.min(1, e.weight * 0.5 + inf * 0.7).toFixed(2) });
        }
      }
    }
    return out.sort((a, b) => b.risk - a.risk);
  }, [selected, runtime]);

  const trajectory = useMemo(() => {
    if (!selected) return [];
    const cur = runtime[selected.id]?.infection ?? 0;
    return Array.from({ length: 24 }, (_, i) => {
      const t = i / 23;
      return { h: i, infection: Math.max(0, Math.min(1, cur * Math.sin(t * Math.PI) * (1 + (Math.random() - 0.5) * 0.1))) };
    });
  }, [selected, runtime]);

  const r0Color = R0 >= 2 ? "text-accent-red" : R0 >= 1 ? "text-accent-amber" : "text-accent-green";
  const r0Glow  = R0 >= 2 ? "glow-red"        : R0 >= 1 ? "glow-amber"        : "";
  const totalNodes = NETWORK_NODES.length;
  const infectedPct = totalNodes > 0 ? ((sirCounts.I / totalNodes) * 100).toFixed(1) : "0.0";

  return (
    <PageWrapper>
      {/* Controls bar */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <Filter size={12} className="text-text-dim" />
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as NodeType | "all")}
          className="bg-bg-elevated border border-border rounded px-2 py-1 text-xs outline-none focus:border-accent-teal"
        >
          <option value="all">All node types</option>
          <option value="major_port">Major Port</option>
          <option value="minor_port">Minor Port</option>
          <option value="icd">ICD</option>
          <option value="carrier_hub">Carrier Hub</option>
          <option value="airport">Airport</option>
        </select>
        <button
          onClick={() => setShowLabels((s) => !s)}
          className="flex items-center gap-1 border border-border rounded px-2 py-1 text-[11px] text-text-secondary hover:text-accent-teal hover:border-accent-teal"
        >
          {showLabels ? <Eye size={12} /> : <EyeOff size={12} />}
          Labels
        </button>
        <button
          onClick={() => setShowHistorical((s) => !s)}
          className={`flex items-center gap-1 border rounded px-2 py-1 text-[11px] transition ${
            showHistorical
              ? "border-accent-purple text-accent-purple bg-accent-purple/10"
              : "border-border text-text-secondary hover:text-accent-purple hover:border-accent-purple"
          }`}
        >
          Historical
        </button>
        <div className="ml-auto flex items-center gap-2">
          <StatusBadge status="live">LIVE</StatusBadge>
          <span className="text-[10px] text-text-dim font-mono">{NETWORK_NODES.length} nodes · {NETWORK_EDGES.length} lanes</span>
        </div>
      </div>

      {/* Full-width map */}
      <div className="relative rounded-xl overflow-hidden border border-border">
        <GeoNetworkMap
          height={580}
          onSelect={(n) => {
            if (typeFilter !== "all" && n.type !== typeFilter) return;
            setSelected(n);
          }}
        />

        {/* Historical overlay */}
        {showHistorical && (
          <div className="absolute inset-0 pointer-events-none">
            <svg viewBox="0 0 1100 600" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
              {HISTORICAL_DISRUPTIONS.map((e, i) => {
                const angle = (i / HISTORICAL_DISRUPTIONS.length) * Math.PI * 2;
                const cx = 600 + Math.cos(angle) * 200;
                const cy = 350 + Math.sin(angle) * 120;
                const r = 18 + e.peakR0 * 6;
                return (
                  <g key={e.id} opacity={0.45}>
                    <circle cx={cx} cy={cy} r={r} fill="#ef4444" fillOpacity={0.15} />
                    <circle cx={cx} cy={cy} r={r * 0.5} fill="#ef4444" fillOpacity={0.25} />
                  </g>
                );
              })}
            </svg>
          </div>
        )}

        {/* Node detail panel — floats over map */}
        <AnimatePresence>
          {selected && (
            <motion.div
              key={selected.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="absolute top-3 right-3 w-72 z-20"
            >
              <div className="rounded-xl border border-border-bright bg-bg-base/95 backdrop-blur-sm p-4 shadow-2xl">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-display text-base text-text-primary leading-tight">{selected.name}</div>
                    <div className="text-[10px] uppercase tracking-wider text-text-secondary mt-0.5">
                      {selected.type.replace(/_/g, " ")} · {selected.country}
                    </div>
                  </div>
                  <button onClick={() => setSelected(null)} className="text-text-dim hover:text-text-primary shrink-0">
                    <X size={14} />
                  </button>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
                  <span className="text-text-secondary">Trade Volume</span>
                  <span className="text-right font-mono text-text-primary">${selected.tradeVolumeB}B</span>
                  <span className="text-text-secondary">SIR State</span>
                  <span className="text-right">
                    <StatusBadge status={
                      runtime[selected.id]?.state === "I" ? "infected" as const
                      : runtime[selected.id]?.state === "R" ? "recovered" as const
                      : "susceptible" as const
                    } />
                  </span>
                  <span className="text-text-secondary">Connections</span>
                  <span className="text-right font-mono text-text-primary">{neighborsOfSelected.length}</span>
                </div>

                <div className="mt-3">
                  <SeverityBar value={runtime[selected.id]?.infection ?? 0} height={6} labelDecimals={2} />
                </div>

                <div className="mt-4">
                  <div className="text-[10px] uppercase tracking-wider text-text-secondary mb-1.5">
                    Neighbors · cascade risk
                  </div>
                  <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                    {neighborsOfSelected.map((nb) => (
                      <div key={nb.id} className="flex items-center gap-2 text-[11px]">
                        <ChevronRight size={10} className="text-text-dim shrink-0" />
                        <span className="flex-1 text-text-primary truncate">{nb.name}</span>
                        <span className={nb.risk > 0.6 ? "text-accent-red font-mono" : nb.risk > 0.35 ? "text-accent-amber font-mono" : "text-accent-green font-mono"}>
                          {nb.risk.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4">
                  <div className="text-[10px] uppercase tracking-wider text-text-secondary mb-1.5">24h infection trajectory</div>
                  <div className="h-[90px] -mx-2">
                    <ResponsiveContainer>
                      <AreaChart data={trajectory}>
                        <defs>
                          <linearGradient id="nodeT" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#ef4444" stopOpacity={0.7} />
                            <stop offset="100%" stopColor="#ef4444" stopOpacity={0.05} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid stroke="#1e2d42" strokeDasharray="3 3" />
                        <XAxis dataKey="h" stroke="#4a6278" fontSize={9} />
                        <YAxis stroke="#4a6278" fontSize={9} domain={[0, 1]} hide />
                        <Tooltip contentStyle={{ background: "#0d1521", border: "1px solid #1e2d42", borderRadius: 6, fontSize: 10 }} />
                        <Area type="monotone" dataKey="infection" stroke="#ef4444" strokeWidth={2} fill="url(#nodeT)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="mt-4 flex flex-col gap-2">
                  <button
                    onClick={() => { setSeedNode(selected.id); setSeedSeverity(0.7); seedDisruption(); }}
                    className="w-full inline-flex items-center justify-center gap-1.5 bg-accent-red/10 text-accent-red border border-accent-red/40 rounded-lg px-3 py-2 text-xs hover:bg-accent-red/20"
                  >
                    <Zap size={12} /> Seed Disruption Here
                  </button>
                  <a
                    href="#/epidemiology"
                    className="w-full inline-flex items-center justify-center gap-1.5 border border-border rounded-lg px-3 py-2 text-xs text-text-secondary hover:border-accent-teal hover:text-accent-teal"
                  >
                    <Activity size={12} /> View in Epidemiology
                  </a>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Network statistics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
        <Card title="Total Nodes" subtitle="By type">
          <div className="text-display text-2xl text-accent-teal">{NETWORK_NODES.length}</div>
          <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-0.5 text-[11px] text-text-secondary">
            <span>Major ports</span><span className="text-right text-text-primary">{counts.major}</span>
            <span>Minor ports</span><span className="text-right text-text-primary">{counts.minor}</span>
            <span>ICDs</span><span className="text-right text-text-primary">{counts.icd}</span>
            <span>Carrier hubs</span><span className="text-right text-text-primary">{counts.hub}</span>
            <span>Airports</span><span className="text-right text-text-primary">{counts.air}</span>
          </div>
        </Card>

        <Card title="Total Edges" subtitle="Weighted trade lanes">
          <div className="text-display text-2xl text-accent-blue">{NETWORK_EDGES.length}</div>
          <div className="mt-2 text-[11px] text-text-secondary">
            Weighted by trade volume; stroke heat reflects current infection on both endpoints.
          </div>
        </Card>

        {/* Beautified Currently Infected card */}
        <Card title="Currently Infected" subtitle="Live SIR runtime">
          <div className="flex items-end gap-3">
            <div className="text-display text-3xl text-accent-red glow-red">{sirCounts.I}</div>
            <div className="text-[11px] text-accent-red/70 mb-1 font-mono">{infectedPct}%</div>
          </div>
          <div className="mt-3 flex gap-1 h-1.5 rounded-full overflow-hidden">
            <div className="bg-accent-blue rounded-full transition-all duration-500" style={{ width: `${(sirCounts.S / totalNodes) * 100}%` }} />
            <div className="bg-accent-red rounded-full transition-all duration-500" style={{ width: `${(sirCounts.I / totalNodes) * 100}%` }} />
            <div className="bg-accent-green rounded-full transition-all duration-500" style={{ width: `${(sirCounts.R / totalNodes) * 100}%` }} />
          </div>
          <div className="mt-2 grid grid-cols-3 gap-1 text-[11px]">
            <div className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-accent-blue shrink-0" />
              <span className="text-text-secondary">S</span>
              <span className="ml-auto font-mono text-accent-blue">{sirCounts.S}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-accent-red shrink-0" />
              <span className="text-text-secondary">I</span>
              <span className="ml-auto font-mono text-accent-red">{sirCounts.I}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-accent-green shrink-0" />
              <span className="text-text-secondary">R</span>
              <span className="ml-auto font-mono text-accent-green">{sirCounts.R}</span>
            </div>
          </div>
        </Card>

        {/* Cascade R₀ — live from nexus store */}
        <Card title="Cascade R₀" subtitle="Reproduction number · live">
          <div className={`text-display text-3xl ${r0Color} ${r0Glow}`}>
            {R0.toFixed(2)}
          </div>
          <div className="mt-2 text-[11px] text-text-secondary leading-relaxed">
            {R0 >= 2
              ? "Critical cascade — immediate reroute required"
              : R0 >= 1
              ? "Cascading — reroute volume now"
              : "Self-containing — monitor only"}
          </div>
          <div className="mt-3 h-1.5 rounded-full bg-bg-elevated overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${R0 >= 2 ? "bg-accent-red" : R0 >= 1 ? "bg-accent-amber" : "bg-accent-green"}`}
              style={{ width: `${Math.min(100, (R0 / 3) * 100)}%` }}
            />
          </div>
          <div className="mt-1 flex justify-between text-[9px] text-text-dim font-mono">
            <span>0</span><span>1</span><span>2</span><span>3+</span>
          </div>
        </Card>
      </div>

      {/* Historical events strip */}
      {showHistorical && (
        <Card className="mt-4" title="Historical Disruption Overlay" subtitle="12 indexed events · click any to inspect">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {HISTORICAL_DISRUPTIONS.map((e) => (
              <div key={e.id} className="rounded-lg border border-border bg-bg-elevated p-3 hover:border-accent-purple transition-colors">
                <div className="flex items-center gap-2">
                  <Globe size={14} className="text-accent-purple" />
                  <span className="text-xs text-text-primary">{e.type}</span>
                  <span className="ml-auto text-[10px] text-text-dim font-mono">{e.date}</span>
                </div>
                <div className="text-[11px] text-text-secondary mt-0.5">{e.location}</div>
                <div className="mt-2 grid grid-cols-3 gap-1 text-[11px]">
                  <span className="text-text-secondary">Peak R₀</span>
                  <span className="text-text-secondary">Loss</span>
                  <span className="text-text-secondary">Hops</span>
                  <span className={e.peakR0 >= 2.5 ? "text-accent-red font-mono" : "text-accent-amber font-mono"}>
                    {e.peakR0.toFixed(2)}
                  </span>
                  <span className="text-text-primary font-mono">{formatCurrency(e.economicLossUSD)}</span>
                  <span className="text-text-primary font-mono">{e.cascadeHops}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </PageWrapper>
  );
}