import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ResponsiveContainer,
  ComposedChart,
  AreaChart,
  Area,
  Line,
  LineChart,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  ReferenceArea,
} from "recharts";
import {
  Activity,
  TrendingUp,
  ShieldAlert,
  Search,
  ChevronDown,
  ChevronRight,
  Play,
} from "lucide-react";
import { PageWrapper } from "../components/layout/PageWrapper";
import { Card } from "../components/shared/Card";
import { MetricCard } from "../components/shared/MetricCard";
import { StatusBadge } from "../components/shared/StatusBadge";
import { SeverityBar } from "../components/shared/SeverityBar";
import { EquationBlock, EqLine } from "../components/shared/EquationBlock";
import { useNexus } from "../store/nexusStore";
import { NETWORK_NODES } from "../data/mockNetwork";
import { HISTORICAL_DISRUPTIONS } from "../data/mockEvents";
import { formatCurrency } from "../utils/formatters";
import type { DisruptionEvent } from "../types";

type SortKey = "name" | "type" | "state" | "infection" | "recovered";

export function EpidemiologicalModel() {
  const {
    runtime,
    history,
    R0,
    beta,
    gamma,
    step,
    setSeedNode,
    setSeedSeverity,
  } = useNexus();

  const [theoryOpen, setTheoryOpen] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey>("infection");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [search, setSearch] = useState("");
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const [eventTypeFilter, setEventTypeFilter] = useState<string>("All");
  const [eventMinR0, setEventMinR0] = useState(0);

  const herd = R0 > 1 ? 1 - 1 / R0 : 0;

  const sirSeries = useMemo(
    () =>
      history.map((h) => ({
        step: h.step,
        S: h.S,
        I: h.I,
        R: h.R,
        R0: h.R0,
      })),
    [history],
  );

  const tableData = useMemo(() => {
    const rows = NETWORK_NODES.map((n) => {
      const rt = runtime[n.id];
      return {
        id: n.id,
        name: n.name,
        type: n.type,
        state: rt?.state ?? "S",
        infection: rt?.infection ?? 0,
        recovered: rt?.recoveryStep ?? null,
      };
    }).filter((r) =>
      search ? r.name.toLowerCase().includes(search.toLowerCase()) : true,
    );

    rows.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "name":
          cmp = a.name.localeCompare(b.name);
          break;
        case "type":
          cmp = a.type.localeCompare(b.type);
          break;
        case "state":
          cmp = a.state.localeCompare(b.state);
          break;
        case "infection":
          cmp = a.infection - b.infection;
          break;
        case "recovered":
          cmp = (a.recovered ?? -1) - (b.recovered ?? -1);
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return rows;
  }, [runtime, sortKey, sortDir, search]);

  const counts = useMemo(() => {
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

  const r0Tone =
    R0 >= 2 ? ("red" as const) : R0 >= 1 ? ("amber" as const) : ("green" as const);

  const nodeTrajectory = useMemo(() => {
    if (!selectedNodeId) return [];
    const cur = runtime[selectedNodeId]?.infection ?? 0;
    return Array.from({ length: 40 }, (_, i) => {
      const t = i / 39;
      const peak = Math.max(0.1, cur);
      const v = peak * Math.sin(t * Math.PI) * (1 + (Math.random() - 0.5) * 0.1);
      return { step: i, infection: Math.max(0, Math.min(1, v)) };
    });
  }, [selectedNodeId, runtime]);

  const filteredEvents = HISTORICAL_DISRUPTIONS.filter((e) => {
    if (eventTypeFilter !== "All" && e.type !== eventTypeFilter) return false;
    if (e.peakR0 < eventMinR0) return false;
    return true;
  });

  const eventTypes = Array.from(new Set(HISTORICAL_DISRUPTIONS.map((e) => e.type)));

  return (
    <PageWrapper>
      <Card
        title="Network SIR Dynamics"
        subtitle="Mathematical foundation · per-node disruption flow"
        right={
          <button
            onClick={() => setTheoryOpen((o) => !o)}
            className="text-[11px] uppercase tracking-wider text-text-secondary hover:text-accent-teal flex items-center gap-1"
          >
            {theoryOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            {theoryOpen ? "Collapse" : "Expand"}
          </button>
        }
      >
        <AnimatePresence initial={false}>
          {theoryOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <EquationBlock
                title="Disruption transmission · per node i"
                notes={
                  <>
                    <div>
                      <span className="text-accent-teal">β</span> = disruption transmission rate (fitted per lane from historical data)
                    </div>
                    <div>
                      <span className="text-accent-teal">γ</span> = recovery rate (mean lanes returning to flow per day)
                    </div>
                    <div>
                      <span className="text-accent-teal">Aᵢⱼ</span> = weighted adjacency matrix (trade volume on edge i → j)
                    </div>
                    <div>
                      <span className="text-accent-teal">R₀</span> = reproduction number; cascade self-contains when R₀ &lt; 1
                    </div>
                  </>
                }
              >
                <EqLine>
                  <span className="text-accent-teal">dSᵢ</span>/dt = − β · Sᵢ · Σⱼ <span className="text-accent-blue">Aᵢⱼ</span> · Iⱼ
                </EqLine>
                <EqLine>
                  <span className="text-accent-red">dIᵢ</span>/dt = β · Sᵢ · Σⱼ Aᵢⱼ · Iⱼ − γ · Iᵢ
                </EqLine>
                <EqLine>
                  <span className="text-accent-green">dRᵢ</span>/dt = γ · Iᵢ
                </EqLine>
                <EqLine accent>
                  R₀ = (β/γ) · k̄ &nbsp;&nbsp;
                  <span className="text-text-secondary">where k̄ = mean degree of infected subgraph</span>
                </EqLine>
                <EqLine accent>
                  pₒ = 1 − 1/R₀ &nbsp;&nbsp;
                  <span className="text-text-secondary">minimum reroute fraction for herd immunity</span>
                </EqLine>
              </EquationBlock>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 mt-4">
        <div className="lg:col-span-2">
          <MetricCard
            label="Current R₀"
            value={R0}
            decimals={2}
            color={r0Tone}
            glow={R0 >= 1}
            icon={<TrendingUp size={16} />}
            subtitle={
              R0 >= 1 ? "Disruption WILL cascade — reroute volume now" : "Self-containing — monitor only"
            }
          />
        </div>
        <MetricCard label="β · transmission" value={beta} decimals={2} color="blue" icon={<Activity size={16} />} subtitle="Fitted per-lane" />
        <MetricCard label="γ · recovery" value={gamma} decimals={2} color="green" icon={<Activity size={16} />} subtitle="Lanes/day → flow" />
        <MetricCard label="Herd immunity pₒ" value={herd * 100} unit="%" decimals={1} color="purple" icon={<ShieldAlert size={16} />} subtitle="Reroute fraction" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mt-4">
        <Card
          className="xl:col-span-2"
          title="SIR Curves"
          subtitle={`S(t), I(t), R(t) over simulation time · step ${step}`}
          right={<StatusBadge status="live">LIVE</StatusBadge>}
        >
          <div className="h-[300px] -mx-2">
            <ResponsiveContainer>
              <ComposedChart data={sirSeries}>
                <defs>
                  <linearGradient id="sir-S" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="sir-I" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity={0.7} />
                    <stop offset="100%" stopColor="#ef4444" stopOpacity={0.08} />
                  </linearGradient>
                  <linearGradient id="sir-R" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity={0.55} />
                    <stop offset="100%" stopColor="#22c55e" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#1e2d42" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="step" stroke="#4a6278" fontSize={10} />
                <YAxis stroke="#4a6278" fontSize={10} domain={[0, 1]} tickFormatter={(v) => v.toFixed(1)} />
                <Tooltip />
                <ReferenceLine
                  y={herd}
                  stroke="#8b5cf6"
                  strokeDasharray="4 4"
                  label={{
                    value: `pₒ = ${(herd * 100).toFixed(1)}%`,
                    fill: "#8b5cf6",
                    fontSize: 10,
                    position: "insideTopRight",
                  }}
                />
                <Area type="monotone" dataKey="S" stroke="#3b82f6" strokeWidth={2} fill="url(#sir-S)" name="Susceptible" />
                <Area type="monotone" dataKey="I" stroke="#ef4444" strokeWidth={2} fill="url(#sir-I)" name="Infected" />
                <Area type="monotone" dataKey="R" stroke="#22c55e" strokeWidth={2} fill="url(#sir-R)" name="Recovered" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex items-center gap-4 text-[11px] text-text-secondary">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-accent-blue" /> Susceptible · {counts.S}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-accent-red dot-pulse" /> Infected · {counts.I}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-accent-green" /> Recovered · {counts.R}
            </span>
            <span className="ml-auto text-text-dim font-mono">
              herd line · pₒ = {(herd * 100).toFixed(1)}%
            </span>
          </div>
        </Card>

        <Card title="R₀ Over Time" subtitle="Reproduction number · cascade threshold at 1">
          <div className="h-[260px] -mx-2">
            <ResponsiveContainer>
              <LineChart data={sirSeries}>
                <CartesianGrid stroke="#1e2d42" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="step" stroke="#4a6278" fontSize={10} />
                <YAxis stroke="#4a6278" fontSize={10} domain={[0, 3]} />
                <Tooltip />
                <ReferenceArea y1={1} y2={3} fill="#ef4444" fillOpacity={0.05} stroke="none" />
                <ReferenceLine
                  y={1}
                  stroke="#ef4444"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  label={{
                    value: "Cascade threshold · R₀ = 1",
                    fill: "#ef4444",
                    fontSize: 10,
                    position: "insideTopLeft",
                  }}
                />
                <Line type="monotone" dataKey="R0" stroke="#f59e0b" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 text-[11px] text-text-secondary leading-relaxed">
            <span className="text-accent-amber font-mono font-semibold">R₀</span> tracks how many additional nodes each infected hub will compromise. Crossing R₀ = 1 marks the boundary between self-containing and cascading.
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mt-4">
        <Card
          className="xl:col-span-2"
          title="Per-Node Infection State"
          subtitle="31 nodes · click a row to plot trajectory"
          right={
            <div className="flex items-center gap-2">
              <Search size={12} className="text-text-dim" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter nodes…"
                className="bg-bg-elevated border border-border rounded px-2 py-1 text-xs text-text-primary outline-none focus:border-accent-teal w-44"
              />
            </div>
          }
        >
          <div className="overflow-auto max-h-[420px]">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-bg-surface z-10">
                <tr className="text-[10px] uppercase tracking-wider text-text-secondary border-b border-border">
                  {(
                    [
                      ["name", "Node"],
                      ["type", "Type"],
                      ["state", "SIR"],
                      ["infection", "Infection"],
                      ["recovered", "Recovered"],
                    ] as [SortKey, string][]
                  ).map(([k, label]) => (
                    <th
                      key={k}
                      onClick={() => {
                        if (sortKey === k) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
                        else {
                          setSortKey(k);
                          setSortDir("desc");
                        }
                      }}
                      className="px-3 py-2 text-left cursor-pointer hover:text-accent-teal select-none"
                    >
                      {label}
                      {sortKey === k && (
                        <span className="ml-1 text-accent-teal">
                          {sortDir === "asc" ? "▲" : "▼"}
                        </span>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableData.map((r) => {
                  const tone =
                    r.state === "I"
                      ? ("infected" as const)
                      : r.state === "R"
                        ? ("recovered" as const)
                        : ("susceptible" as const);
                  return (
                    <tr
                      key={r.id}
                      onClick={() =>
                        setSelectedNodeId((cur) => (cur === r.id ? null : r.id))
                      }
                      className={`border-b border-border cursor-pointer transition-colors ${
                        selectedNodeId === r.id ? "bg-accent-teal/5" : "hover:bg-bg-hover"
                      }`}
                    >
                      <td className="px-3 py-2 text-text-primary">{r.name}</td>
                      <td className="px-3 py-2 text-text-secondary capitalize">
                        {r.type.replace("_", " ")}
                      </td>
                      <td className="px-3 py-2">
                        <StatusBadge status={tone} />
                      </td>
                      <td className="px-3 py-2 w-44">
                        <SeverityBar value={r.infection} height={4} labelDecimals={2} />
                      </td>
                      <td className="px-3 py-2 font-mono text-text-secondary">
                        {r.recovered != null ? `step ${r.recovered}` : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        <Card
          title="Selected Node Trajectory"
          subtitle={
            selectedNodeId
              ? NETWORK_NODES.find((n) => n.id === selectedNodeId)?.name ?? "—"
              : "Click any node to plot"
          }
        >
          {selectedNodeId ? (
            <div className="h-[260px] -mx-2">
              <ResponsiveContainer>
                <AreaChart data={nodeTrajectory}>
                  <defs>
                    <linearGradient id="nodeInf" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ef4444" stopOpacity={0.7} />
                      <stop offset="100%" stopColor="#ef4444" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#1e2d42" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="step" stroke="#4a6278" fontSize={10} />
                  <YAxis stroke="#4a6278" fontSize={10} domain={[0, 1]} />
                  <Tooltip />
                  <Area type="monotone" dataKey="infection" stroke="#ef4444" strokeWidth={2} fill="url(#nodeInf)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[260px] flex items-center justify-center text-xs text-text-dim">
              Select a node from the table.
            </div>
          )}
        </Card>
      </div>

      <Card
        className="mt-4"
        title="Historical Disruptions Database"
        subtitle="350 events · re-simulate any to seed the live model"
        right={
          <div className="flex items-center gap-2">
            <select
              value={eventTypeFilter}
              onChange={(e) => setEventTypeFilter(e.target.value)}
              className="bg-bg-elevated border border-border rounded px-2 py-1 text-xs outline-none focus:border-accent-teal"
            >
              <option value="All">All types</option>
              {eventTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-wider text-text-secondary">
                Min R₀
              </span>
              <input
                type="range"
                min={0}
                max={3}
                step={0.1}
                value={eventMinR0}
                onChange={(e) => setEventMinR0(parseFloat(e.target.value))}
                className="w-24"
              />
              <span className="font-mono text-xs text-accent-teal w-8">
                {eventMinR0.toFixed(1)}
              </span>
            </div>
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-[10px] uppercase tracking-wider text-text-secondary border-b border-border">
                <th className="px-3 py-2 text-left">Event</th>
                <th className="px-3 py-2 text-left">Type</th>
                <th className="px-3 py-2 text-left">Location</th>
                <th className="px-3 py-2 text-left">Date</th>
                <th className="px-3 py-2 text-right">Peak R₀</th>
                <th className="px-3 py-2 text-right">Loss</th>
                <th className="px-3 py-2 text-right">Hops</th>
                <th className="px-3 py-2 text-right">Days</th>
                <th className="px-3 py-2 text-right" />
              </tr>
            </thead>
            <tbody>
              {filteredEvents.map((e: DisruptionEvent) => {
                const rTone =
                  e.peakR0 >= 2.5
                    ? "text-accent-red"
                    : e.peakR0 >= 1.5
                      ? "text-accent-amber"
                      : "text-accent-green";
                return (
                  <tr key={e.id} className="border-b border-border hover:bg-bg-hover transition-colors">
                    <td className="px-3 py-2 font-mono text-text-secondary">{e.id}</td>
                    <td className="px-3 py-2 text-text-primary">{e.type}</td>
                    <td className="px-3 py-2 text-text-secondary">{e.location}</td>
                    <td className="px-3 py-2 font-mono text-text-secondary">{e.date}</td>
                    <td className={`px-3 py-2 text-right font-mono font-semibold ${rTone}`}>
                      {e.peakR0.toFixed(2)}
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-accent-amber">
                      {formatCurrency(e.economicLossUSD)}
                    </td>
                    <td className="px-3 py-2 text-right text-text-secondary">{e.cascadeHops}</td>
                    <td className="px-3 py-2 text-right text-text-secondary">{e.durationDays}</td>
                    <td className="px-3 py-2 text-right">
                      <button
                        onClick={() => {
                          setSeedNode("IN-JNPT");
                          setSeedSeverity(Math.min(1, e.peakR0 / 3));
                        }}
                        className="inline-flex items-center gap-1 text-[11px] text-accent-teal hover:underline"
                      >
                        <Play size={10} /> Re-simulate
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredEvents.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-3 py-6 text-center text-text-dim">
                    No events match these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </PageWrapper>
  );
}
