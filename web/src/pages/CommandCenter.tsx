import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  Bell,
  TrendingUp,
  Users,
  Container,
  Route as RouteIcon,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import { PageWrapper } from "../components/layout/PageWrapper";
import { MetricCard } from "../components/shared/MetricCard";
import { StatusBadge } from "../components/shared/StatusBadge";
import { Card } from "../components/shared/Card";
import { GeoNetworkMap } from "../components/network/GeoNetworkMap";
import { R0Gauge } from "../components/shared/R0Gauge";
import { useNexus } from "../store/nexusStore";
import { formatCurrency } from "../utils/formatters";
import { useCommandCenterData, useTopDisruptedRoutes } from "../api/queries";

const sparkline7 = (max: number) =>
  Array.from({ length: 14 }, (_, i) =>
    Math.max(0, max * (0.6 + 0.4 * Math.sin(i * 0.7) + (Math.random() - 0.5) * 0.15)),
  );

export function CommandCenter() {
  // ── Live SIR state from nexus store (same source as Epi Model page) ──
  const { alerts, R0, runtime, history, dismissAlert, logDecision } = useNexus();

  // ── API data for operational metrics (alerts, shipments, etc.) ──
  const { data: ccData, isLoading: ccLoading } = useCommandCenterData();
  const { data: topRoutesData } = useTopDisruptedRoutes();

  // ── Live SIR counts derived from runtime (same as GlobalNetwork & EpiModel) ──
  const sirCounts = useMemo(() => {
    let S = 0; let I = 0; let R = 0;
    for (const id of Object.keys(runtime)) {
      const s = runtime[id].state;
      if (s === "S") S++;
      else if (s === "I") I++;
      else R++;
    }
    return { S, I, R };
  }, [runtime]);

  const totalNodes = Object.keys(runtime).length || 31;

  // ── Live metrics derived from runtime ──
  const networkHealth = totalNodes > 0
    ? Math.round((1 - sirCounts.I / totalNodes) * 1000) / 10
    : (ccData?.networkHealth ?? 73);

  const disruptionIdx = totalNodes > 0
    ? Math.round((sirCounts.I / totalNodes) * 100) / 100
    : (ccData?.disruptionIndex ?? 0.34);

  const networkIndex = totalNodes > 0
    ? Math.round(((sirCounts.I + sirCounts.R * 0.3) / totalNodes) * 100) / 100
    : 0.27;

  // R0 live from store
  const R0Value = R0;

  // ── SIR history → timeline (same series as Epi Model) ──
  const timelineData = useMemo(
    () => history.map((h) => ({ step: h.step, S: h.S, I: h.I, R: h.R })),
    [history],
  );

  // ── Operational metrics from API ──
  const activeAlerts = ccData?.activeAlerts ?? alerts.length;
  const crowdReports  = ccData?.crowdReports ?? 247;
  const monitoredCtr  = ccData?.monitoredContainers ?? 82;
  const reroutedToday = ccData?.reroutedToday ?? 9;
  const apiAlerts     = ccData?.alerts ?? alerts;
  const shipments     = ccData?.shipments ?? 1247;
  const cascadesPrevented = ccData?.cascadesPrevented ?? 9;
  const avgResponseHours  = ccData?.avgResponseHours ?? 3.2;
  const costSaved         = ccData?.costSaved ?? 2_300_000;

  // Top disrupted routes from API
  const topRoutes = topRoutesData ?? [];

  const r0Tone =
    R0Value >= 2 ? "red" as const
    : R0Value >= 1 ? "amber" as const
    : "green" as const;

  return (
    <PageWrapper>
      {/* Hero metrics — all live */}
      <motion.div
        className="grid grid-cols-2 lg:grid-cols-4 gap-3"
        initial="hidden"
        animate="show"
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}
      >
        <motion.div variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}>
          <MetricCard
            label="Network Health"
            value={networkHealth}
            unit="%"
            color="teal"
            icon={<Activity size={16} />}
            spark={sparkline7(74)}
            delta={2.4}
          />
        </motion.div>
        <motion.div variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}>
          <MetricCard
            label="Disruption Index"
            value={disruptionIdx}
            decimals={2}
            color="amber"
            icon={<AlertTriangle size={16} />}
            spark={sparkline7(0.4)}
            delta={-3.1}
          />
        </motion.div>
        <motion.div variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}>
          <MetricCard
            label="R-Effective"
            value={R0Value}
            decimals={2}
            color={r0Tone}
            icon={<TrendingUp size={16} />}
            spark={sparkline7(2)}
            glow={R0Value >= 1.5}
            subtitle={R0Value >= 1 ? "Disruption WILL cascade" : "Self-containing"}
          />
        </motion.div>
        <motion.div variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}>
          <MetricCard
            label="Active Alerts"
            value={activeAlerts}
            color="red"
            icon={<Bell size={16} />}
            spark={sparkline7(activeAlerts)}
            delta={6.5}
          />
        </motion.div>
      </motion.div>

      {/* Secondary metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-3">
        <MetricCard
          label="Network Index"
          value={networkIndex}
          decimals={2}
          color="blue"
          icon={<Activity size={16} />}
        />
        <MetricCard
          label="Crowd Reports"
          value={crowdReports}
          color="teal"
          icon={<Users size={16} />}
        />
        <MetricCard
          label="Monitored Containers"
          value={monitoredCtr}
          color="blue"
          icon={<Container size={16} />}
        />
        <MetricCard
          label="Routes Rerouted Today"
          value={reroutedToday}
          color="purple"
          icon={<RouteIcon size={16} />}
        />
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4 mt-4">
        {/* Left 60% */}
        <div className="xl:col-span-3 space-y-4">
          <Card
            title="Live Disruption Network"
            subtitle="31 nodes · 48 weighted lanes · click to inspect"
            right={<StatusBadge status="live">LIVE</StatusBadge>}
          >
            <div className="-mx-4 -mb-2">
              <GeoNetworkMap height={420} />
            </div>
          </Card>

          {/* Disruption Timeline — live SIR history from nexus store */}
          <Card
            title="Disruption Timeline · SIR"
            subtitle="Live S/I/R fractions · updates with every simulation step"
          >
            <div className="h-[180px] -mx-2">
              {timelineData.length === 0 ? (
                <div className="flex items-center justify-center h-full text-text-dim text-xs">
                  Seed a disruption to populate the timeline
                </div>
              ) : (
                <ResponsiveContainer>
                  <AreaChart data={timelineData}>
                    <defs>
                      <linearGradient id="gS" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.5} />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gI" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ef4444" stopOpacity={0.7} />
                        <stop offset="100%" stopColor="#ef4444" stopOpacity={0.05} />
                      </linearGradient>
                      <linearGradient id="gR" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#00d4aa" stopOpacity={0.5} />
                        <stop offset="100%" stopColor="#00d4aa" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#1e2d42" strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="step"
                      stroke="#4a6278"
                      fontSize={10}
                      tick={{ fill: "#4a6278" }}
                      label={{ value: "Step", position: "insideBottomRight", fill: "#4a6278", fontSize: 10 }}
                    />
                    <YAxis
                      stroke="#4a6278"
                      fontSize={10}
                      tick={{ fill: "#4a6278" }}
                      tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
                    />
                    <Tooltip
                      formatter={(v) => [`${(+(v ?? 0) * 100).toFixed(1)}%`]}
                      contentStyle={{ background: "#0d1521", border: "1px solid #1e2d42", borderRadius: 6 }}
                    />
                    <Area dataKey="S" stroke="#3b82f6" fill="url(#gS)" stackId="1" name="Susceptible" />
                    <Area dataKey="I" stroke="#ef4444" fill="url(#gI)" stackId="1" name="Infected" />
                    <Area dataKey="R" stroke="#00d4aa" fill="url(#gR)" stackId="1" name="Recovered" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>

          {/* Top Disrupted Routes — live from API */}
          <Card title="Top Disrupted Routes" subtitle="By cascade severity · live from disruption data">
            <div className="h-[200px]">
              {topRoutes.length === 0 ? (
                <div className="flex items-center justify-center h-full text-text-dim text-xs">
                  Loading routes...
                </div>
              ) : (
                <ResponsiveContainer>
                  <BarChart data={topRoutes} layout="vertical" margin={{ left: 12 }}>
                    <CartesianGrid stroke="#1e2d42" strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" domain={[0, 1]} stroke="#4a6278" fontSize={10} />
                    <YAxis
                      type="category"
                      dataKey="route"
                      stroke="#8fa4c0"
                      fontSize={10}
                      width={140}
                      tick={{ fill: "#8fa4c0" }}
                    />
                    <Tooltip
                      formatter={(v) => [(+(v ?? 0)).toFixed(2), "Severity"]}
                      contentStyle={{ background: "#0d1521", border: "1px solid #1e2d42", borderRadius: 6 }}
                    />
                    <Bar dataKey="severity" radius={[0, 4, 4, 0]}>
                      {topRoutes.map((r, i) => (
                        <Cell
                          key={i}
                          fill={r.severity > 0.7 ? "#ef4444" : r.severity > 0.5 ? "#f59e0b" : "#00d4aa"}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>
        </div>

        {/* Right 40% */}
        <div className="xl:col-span-2 space-y-4">
          {/* R0 Monitor — fully live from nexus store */}
          <Card title="R₀ Live Monitor" subtitle="Cascade reproduction number · live from SIR model">
            <div className="flex items-center gap-4">
              <R0Gauge value={R0Value} size="md" />
              <div className="flex-1 text-xs space-y-2">
                <div className="flex justify-between text-[10px]">
                  <span className="text-text-dim">Network Index</span>
                  <span className="text-accent-amber font-mono">{networkIndex.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-text-dim">Disruption Index</span>
                  <span className="text-accent-red font-mono">{disruptionIdx.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-text-dim">R-Effective</span>
                  <span className={`font-mono ${R0Value >= 1 ? "text-accent-red" : "text-accent-green"}`}>
                    {R0Value.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-text-dim">Infected Nodes</span>
                  <span className="text-accent-amber font-mono">{sirCounts.I} / {totalNodes}</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-text-dim">Recovered</span>
                  <span className="text-accent-teal font-mono">{sirCounts.R}</span>
                </div>
                <div className="border-t border-border pt-2">
                  <p className="text-text-secondary leading-relaxed">Herd-immunity reroute threshold:</p>
                  <div className="text-display text-xl text-accent-teal">
                    {R0Value > 1 ? `${((1 - 1 / R0Value) * 100).toFixed(1)}%` : "0%"}
                  </div>
                  <p className="text-text-dim text-[10px] leading-relaxed mt-1">
                    Reroute this fraction of inbound volume to flip cascade dynamics.
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <Card
            title="Live Alerts Feed"
            subtitle="Real-time disruption signals · auto-prioritized"
            right={
              <button className="text-[10px] uppercase tracking-wider text-text-secondary hover:text-text-primary">
                Mark all read
              </button>
            }
          >
            <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1 -mr-1">
              {apiAlerts.map((a, i) => {
                const tone =
                  a.level === "critical" ? "critical" as const
                  : a.level === "alert" ? "alert" as const
                  : a.level === "review" ? "review" as const
                  : a.level === "immune" ? "immune" as const
                  : "normal" as const;
                return (
                  <motion.div
                    key={a.id}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="rounded-lg border border-border bg-bg-elevated p-3 hover:border-border-bright transition-colors"
                  >
                    <div className="flex items-start gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <StatusBadge status={tone}>{a.level.toUpperCase()}</StatusBadge>
                          <span className="text-[10px] text-text-dim">{a.ago} ago</span>
                        </div>
                        <div className="text-sm text-text-primary mt-1 leading-snug">{a.title}</div>
                        <div className="text-[11px] text-text-secondary leading-snug">{a.detail}</div>
                        <div className="text-[10px] text-text-dim font-mono mt-1">{a.meta}</div>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        onClick={() => logDecision("reroute", a.title, { alert: a.id, detail: a.detail })}
                        className="text-[10px] bg-accent-teal/10 text-accent-teal border border-accent-teal/30 rounded px-2 py-0.5 hover:bg-accent-teal/20"
                      >
                        Reroute
                      </button>
                      <button
                        onClick={() => logDecision("monitor", a.title, { alert: a.id })}
                        className="text-[10px] bg-bg-elevated text-text-secondary border border-border rounded px-2 py-0.5 hover:border-accent-teal"
                      >
                        Monitor
                      </button>
                      {a.cta && (
                        <button
                          onClick={() => dismissAlert(a.id)}
                          className="text-[10px] text-accent-teal hover:underline ml-auto"
                        >
                          {a.cta} →
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
              {apiAlerts.length === 0 && (
                <div className="py-8 text-center text-text-dim text-xs">
                  All clear — no alerts pending.
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Bottom row */}
      <div className="mt-4">
        <Card title="Today's Key Stats" subtitle="Live ops summary">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-text-secondary">Shipments</div>
              <div className="text-display text-xl text-text-primary mt-1">
                {ccLoading ? "..." : shipments.toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-text-secondary">Cascades Prevented</div>
              <div className="text-display text-xl text-accent-teal mt-1">
                {ccLoading ? "..." : cascadesPrevented}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-text-secondary">Avg Response</div>
              <div className="text-display text-xl text-accent-teal mt-1">
                {ccLoading ? "..." : `${avgResponseHours}h`}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-text-secondary">Cost Saved</div>
              <div className="text-display text-xl text-accent-green mt-1">
                {ccLoading ? "..." : formatCurrency(costSaved)}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </PageWrapper>
  );
}