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
import { NetworkGraph } from "../components/network/NetworkGraph";
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
    let major = 0;
    let minor = 0;
    let icd = 0;
    let hub = 0;
    let air = 0;
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
    let S = 0;
    let I = 0;
    let R = 0;
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
          out.push({
            id: n.id,
            name: n.name,
            risk: +Math.min(1, e.weight * 0.5 + inf * 0.7).toFixed(2),
          });
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
      return {
        h: i,
        infection: Math.max(
          0,
          Math.min(1, cur * Math.sin(t * Math.PI) * (1 + (Math.random() - 0.5) * 0.1)),
        ),
      };
    });
  }, [selected, runtime]);

  return (
    <PageWrapper>
      {/* Controls bar */}
      <Card
        title="Global Supply Chain Network"
        subtitle="31 nodes · 48 weighted lanes · live SIR overlay"
        right={
          <div className="flex flex-wrap items-center gap-2">
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
          </div>
        }
      >
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
          <div className={`lg:col-span-${selected ? 3 : 4} relative`}>
            <NetworkGraph
              height={560}
              showLabels={showLabels}
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
          </div>

          {/* Node detail panel */}
          <AnimatePresence>
            {selected && (
              <motion.div
                key={selected.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="lg:col-span-1"
              >
                <div className="rounded-xl border border-border-bright bg-bg-elevated p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-display text-base text-text-primary leading-tight">
                        {selected.name}
                      </div>
                      <div className="text-[10px] uppercase tracking-wider text-text-secondary">
                        {selected.type.replace("_", " ")} · {selected.country}
                      </div>
                    </div>
                    <button
                      onClick={() => setSelected(null)}
                      className="text-text-dim hover:text-text-primary"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                    <span className="text-text-secondary">SIR State</span>
                    <span className="text-right">
                      <StatusBadge
                        status={
                          runtime[selected.id]?.state === "I"
                            ? "infected"
                            : runtime[selected.id]?.state === "R"
                              ? "recovered"
                              : "susceptible"
                        }
                      />
                    </span>
                    <span className="text-text-secondary">Infection level</span>
                    <span className="text-right font-mono text-accent-amber">
                      {(runtime[selected.id]?.infection ?? 0).toFixed(2)}
                    </span>
                    <span className="text-text-secondary">Trade volume</span>
                    <span className="text-right font-mono text-accent-teal">
                      ${selected.tradeVolumeB}B/yr
                    </span>
                    <span className="text-text-secondary">Connections</span>
                    <span className="text-right font-mono">
                      {neighborsOfSelected.length}
                    </span>
                  </div>

                  <div className="mt-3">
                    <SeverityBar
                      value={runtime[selected.id]?.infection ?? 0}
                      height={6}
                      labelDecimals={2}
                    />
                  </div>

                  <div className="mt-4">
                    <div className="text-[10px] uppercase tracking-wider text-text-secondary mb-1.5">
                      Neighbors · cascade risk
                    </div>
                    <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                      {neighborsOfSelected.map((nb) => (
                        <div
                          key={nb.id}
                          className="flex items-center gap-2 text-[11px]"
                        >
                          <ChevronRight size={10} className="text-text-dim shrink-0" />
                          <span className="flex-1 text-text-primary truncate">
                            {nb.name}
                          </span>
                          <span
                            className={
                              nb.risk > 0.6
                                ? "text-accent-red font-mono"
                                : nb.risk > 0.35
                                  ? "text-accent-amber font-mono"
                                  : "text-accent-green font-mono"
                            }
                          >
                            {nb.risk.toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="text-[10px] uppercase tracking-wider text-text-secondary mb-1.5">
                      24h infection trajectory
                    </div>
                    <div className="h-[110px] -mx-2">
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
                          <Tooltip />
                          <Area
                            type="monotone"
                            dataKey="infection"
                            stroke="#ef4444"
                            strokeWidth={2}
                            fill="url(#nodeT)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-col gap-2">
                    <button
                      onClick={() => {
                        setSeedNode(selected.id);
                        setSeedSeverity(0.7);
                        seedDisruption();
                      }}
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
      </Card>

      {/* Network statistics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
        <Card title="Total Nodes" subtitle="By type">
          <div className="text-display text-2xl text-accent-teal">{NETWORK_NODES.length}</div>
          <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-0.5 text-[11px] text-text-secondary">
            <span>Major ports</span>
            <span className="text-right text-text-primary">{counts.major}</span>
            <span>Minor ports</span>
            <span className="text-right text-text-primary">{counts.minor}</span>
            <span>ICDs</span>
            <span className="text-right text-text-primary">{counts.icd}</span>
            <span>Carrier hubs</span>
            <span className="text-right text-text-primary">{counts.hub}</span>
            <span>Airports</span>
            <span className="text-right text-text-primary">{counts.air}</span>
          </div>
        </Card>
        <Card title="Total Edges" subtitle="Weighted trade lanes">
          <div className="text-display text-2xl text-accent-blue">{NETWORK_EDGES.length}</div>
          <div className="mt-2 text-[11px] text-text-secondary">
            Weighted by trade volume; stroke heat reflects current infection on
            both endpoints.
          </div>
        </Card>
        <Card title="Currently Infected" subtitle="Live SIR runtime">
          <div className="text-display text-2xl text-accent-red glow-red">
            {sirCounts.I}
          </div>
          <div className="mt-2 grid grid-cols-3 gap-1 text-[11px]">
            <span className="text-accent-blue">S · {sirCounts.S}</span>
            <span className="text-accent-red">I · {sirCounts.I}</span>
            <span className="text-accent-green">R · {sirCounts.R}</span>
          </div>
        </Card>
        <Card title="Cascade R₀" subtitle="Reproduction number">
          <div
            className={`text-display text-2xl ${
              R0 >= 2 ? "text-accent-red glow-red" : R0 >= 1 ? "text-accent-amber glow-amber" : "text-accent-green"
            }`}
          >
            {R0.toFixed(2)}
          </div>
          <div className="mt-2 text-[11px] text-text-secondary">
            {R0 >= 1 ? "Cascade — reroute now" : "Self-containing — monitor"}
          </div>
        </Card>
      </div>

      {/* Historical events strip */}
      {showHistorical && (
        <Card
          className="mt-4"
          title="Historical Disruption Overlay"
          subtitle="12 indexed events · click any to inspect"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {HISTORICAL_DISRUPTIONS.map((e) => (
              <div
                key={e.id}
                className="rounded-lg border border-border bg-bg-elevated p-3 hover:border-accent-purple transition-colors"
              >
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
                  <span
                    className={
                      e.peakR0 >= 2.5
                        ? "text-accent-red font-mono"
                        : "text-accent-amber font-mono"
                    }
                  >
                    {e.peakR0.toFixed(2)}
                  </span>
                  <span className="text-text-primary font-mono">
                    {formatCurrency(e.economicLossUSD)}
                  </span>
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
