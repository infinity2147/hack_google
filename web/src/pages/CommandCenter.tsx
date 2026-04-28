import { motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  Bell,
  TrendingUp,
  FileSearch,
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
import {
  DISRUPTION_TIMELINE_72H,
  TOP_DISRUPTED_ROUTES,
  ANOMALY_HEATMAP,
} from "../data/mockEvents";
import { formatCurrency } from "../utils/formatters";
import { useCommandCenterData, useDocumentHeatmap } from "../api/queries";

const sparkline7 = (max: number) =>
  Array.from({ length: 14 }, (_, i) =>
    Math.max(0, max * (0.6 + 0.4 * Math.sin(i * 0.7) + (Math.random() - 0.5) * 0.15)),
  );

export function CommandCenter() {
  const { alerts, R0, dismissAlert, logDecision } = useNexus();

  const { data: ccData, isLoading: ccLoading } = useCommandCenterData();
  const { data: heatmapData, isLoading: heatmapLoading } = useDocumentHeatmap();

  // Hardcoded fallbacks
  const fallbackNetworkHealth = 73;
  const fallbackDisruptionIdx = 0.34;
  const fallbackDocAnomalies = 23;
  const fallbackCrowdReports = 247;
  const fallbackMonitoredCtr = 82;
  const fallbackReroutedToday = 9;

  const networkHealth = ccData?.networkHealth ?? fallbackNetworkHealth;
  const disruptionIdx = ccData?.disruptionIndex ?? fallbackDisruptionIdx;
  const R0Value = ccData?.R0 ?? R0;
  const activeAlerts = ccData?.activeAlerts ?? alerts.length;
  const docAnomalies = ccData?.docAnomalies ?? fallbackDocAnomalies;
  const crowdReports = ccData?.crowdReports ?? fallbackCrowdReports;
  const monitoredCtr = ccData?.monitoredContainers ?? fallbackMonitoredCtr;
  const reroutedToday = ccData?.reroutedToday ?? fallbackReroutedToday;

  const heatmap = heatmapData?.grid ?? ANOMALY_HEATMAP;

  // API alerts or fallback to store alerts
  const apiAlerts = ccData?.alerts ?? alerts;

  const shipments = ccData?.shipments ?? 1247;
  const cascadesPrevented = ccData?.cascadesPrevented ?? 9;
  const avgResponseHours = ccData?.avgResponseHours ?? 3.2;
  const costSaved = ccData?.costSaved ?? 2_300_000;

  const heatColor = (n: number) => {
    if (n === 0) return "#0d1521";
    if (n <= 2) return "#1a3148";
    if (n <= 4) return "#3b6f8c";
    if (n <= 6) return "#f59e0b";
    return "#ef4444";
  };

  const r0Tone =
    R0Value >= 2 ? "red" as const
    : R0Value >= 1 ? "amber" as const
    : "green" as const;

  return (
    <PageWrapper>
      {/* Hero metrics */}
      <motion.div
        className="grid grid-cols-2 lg:grid-cols-4 gap-3"
        initial="hidden"
        animate="show"
        variants={{
          hidden: {},
          show: { transition: { staggerChildren: 0.08 } },
        }}
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
          label="Document Anomalies"
          value={docAnomalies}
          color="amber"
          icon={<FileSearch size={16} />}
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

          <Card title="Disruption Timeline · 72h" subtitle="Aggregate S/I/R fractions over the last 72 hours">
            <div className="h-[180px] -mx-2">
              <ResponsiveContainer>
                <AreaChart data={DISRUPTION_TIMELINE_72H}>
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
                      <stop offset="0%" stopColor="#22c55e" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#1e2d42" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="hour" stroke="#4a6278" fontSize={10} reversed tickFormatter={(h) => `${h}h`} />
                  <YAxis stroke="#4a6278" fontSize={10} domain={[0, 1]} tickFormatter={(v) => v.toFixed(1)} />
                  <Tooltip />
                  <Area dataKey="S" stroke="#3b82f6" fill="url(#gS)" stackId="1" />
                  <Area dataKey="R" stroke="#22c55e" fill="url(#gR)" stackId="1" />
                  <Area dataKey="I" stroke="#ef4444" fill="url(#gI)" stackId="1" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card title="Top Disrupted Routes" subtitle="By cascade severity (live)">
              <div className="h-[180px]">
                <ResponsiveContainer>
                  <BarChart data={TOP_DISRUPTED_ROUTES} layout="vertical" margin={{ left: 12 }}>
                    <CartesianGrid stroke="#1e2d42" strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" domain={[0, 1]} stroke="#4a6278" fontSize={10} />
                    <YAxis type="category" dataKey="route" stroke="#8fa4c0" fontSize={10} width={140} tick={{ fill: "#8fa4c0" }} />
                    <Tooltip />
                    <Bar dataKey="severity" radius={[0, 4, 4, 0]}>
                      {TOP_DISRUPTED_ROUTES.map((r, i) => (
                        <Cell key={i} fill={r.severity > 0.7 ? "#ef4444" : r.severity > 0.5 ? "#f59e0b" : "#00d4aa"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card title="Document Anomaly Heatmap" subtitle="7 doc types × 24 hours">
              {heatmapLoading ? (
                <div className="flex items-center justify-center h-[200px] text-text-dim text-xs">Loading...</div>
              ) : (
              <div className="grid grid-cols-[80px_1fr] gap-1">
                <div />
                <div className="grid grid-cols-24 gap-[2px] text-center text-[8px] text-text-dim">
                  {Array.from({ length: 24 }, (_, h) => (
                    <span key={h}>{h % 4 === 0 ? h : ""}</span>
                  ))}
                </div>
                {heatmap.map((row) => (
                  <div key={row.row} className="contents">
                    <div className="text-[10px] text-text-secondary self-center pr-1 truncate">
                      {row.row}
                    </div>
                    <div className="grid grid-cols-24 gap-[2px]">
                      {row.cells.map((c, i) => (
                        <div
                          key={i}
                          title={`${row.row} · ${i}:00 — ${c} anomalies`}
                          className="aspect-square rounded-[2px]"
                          style={{ backgroundColor: heatColor(c) }}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              )}
              <div className="mt-3 flex items-center justify-end gap-1.5 text-[10px] text-text-dim">
                <span>0</span>
                {[0, 2, 4, 6, 8].map((n) => (
                  <span key={n} className="h-2 w-3 rounded-[2px]" style={{ backgroundColor: heatColor(n) }} />
                ))}
                <span>8+</span>
              </div>
            </Card>
          </div>
        </div>

        {/* Right 40% */}
        <div className="xl:col-span-2 space-y-4">
          {/* R0 + alerts */}
          <Card title="R₀ Live Monitor" subtitle="Cascade reproduction number">
            <div className="flex items-center gap-4">
              <R0Gauge value={R0Value} size="md" />
              <div className="flex-1 text-xs space-y-2">
                <p className="text-text-secondary leading-relaxed">
                  Herd-immunity reroute threshold:
                </p>
                <div className="text-display text-xl text-accent-teal">
                  {R0Value > 1 ? `${((1 - 1 / R0Value) * 100).toFixed(1)}%` : "0%"}
                </div>
                <p className="text-text-dim text-[10px] leading-relaxed">
                  Reroute this fraction of inbound volume to flip cascade dynamics.
                  When R₀ &gt; 1 the disruption will spread; reroute targets infected
                  hubs.
                </p>
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
                const tone = a.level === "critical" ? "critical"
                  : a.level === "alert" ? "alert"
                  : a.level === "review" ? "review"
                  : a.level === "immune" ? "immune"
                  : "normal";
                return (
                  <motion.div
                    key={a.id}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="rounded-lg border border-border bg-bg-elevated p-3 hover:border-border-bright transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <StatusBadge status={tone}>
                            {a.level.toUpperCase()}
                          </StatusBadge>
                          <span className="text-[10px] text-text-dim">{a.ago} ago</span>
                        </div>
                        <div className="text-sm text-text-primary mt-1 leading-snug">
                          {a.title}
                        </div>
                        <div className="text-[11px] text-text-secondary leading-snug">
                          {a.detail}
                        </div>
                        <div className="text-[10px] text-text-dim font-mono mt-1">
                          {a.meta}
                        </div>
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
