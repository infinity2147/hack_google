import { useState } from "react";
import {
  ResponsiveContainer,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Cell,
  ComposedChart,
  Line,
} from "recharts";
import {
  TrendingUp,
  Calendar,
  AlertTriangle,
} from "lucide-react";
import { PageWrapper } from "../components/layout/PageWrapper";
import { Card } from "../components/shared/Card";
import { MetricCard } from "../components/shared/MetricCard";
import { HEALTH_TREND_30D } from "../data/mockShipments";
import { HISTORICAL_DISRUPTIONS } from "../data/mockEvents";
import { formatCurrency } from "../utils/formatters";

type Tab = "30d" | "week" | "disrupted" | "recovery";

export function NetworkTrends() {
  const [tab, setTab] = useState<Tab>("30d");

  const thisWeek = HEALTH_TREND_30D.slice(-7);
  const lastWeek = HEALTH_TREND_30D.slice(-14, -7);
  const thisWeekLoss = thisWeek.reduce((s, d) => s + d.totalLoss, 0);
  const lastWeekLoss = lastWeek.reduce((s, d) => s + d.totalLoss, 0);
  const thisWeekEvents = thisWeek.reduce((s, d) => s + d.eventCount, 0);
  const lastWeekEvents = lastWeek.reduce((s, d) => s + d.eventCount, 0);

  const portAgg = HISTORICAL_DISRUPTIONS.reduce<Record<string, { events: number; loss: number; recovery: number }>>((acc, e) => {
    const loc = e.location.split(",")[0].trim();
    if (!acc[loc]) acc[loc] = { events: 0, loss: 0, recovery: e.durationDays };
    acc[loc].events++;
    acc[loc].loss += e.economicLossUSD;
    acc[loc].recovery = (acc[loc].recovery + e.durationDays) / 2;
    return acc;
  }, {});

  const mostDisrupted = Object.entries(portAgg)
    .sort((a, b) => b[1].events - a[1].events)
    .slice(0, 10)
    .map(([port, data]) => ({ port, ...data }));

  const fastestRecovery = Object.entries(portAgg)
    .sort((a, b) => a[1].recovery - b[1].recovery)
    .slice(0, 10)
    .map(([port, data]) => ({ port, ...data }));

  const tabs: { key: Tab; label: string }[] = [
    { key: "30d", label: "30-Day Trend" },
    { key: "week", label: "Week Comparison" },
    { key: "disrupted", label: "Most Disrupted" },
    { key: "recovery", label: "Fastest Recovery" },
  ];

  return (
    <PageWrapper>
      <div className="rounded-xl border border-border bg-bg-surface p-5">
        <div className="flex items-start gap-3">
          <TrendingUp className="text-accent-teal shrink-0 mt-1" size={22} />
          <div>
            <h2 className="text-display text-xl tracking-tight">Network Trends</h2>
            <p className="text-sm text-text-secondary mt-1">
              Historical analysis of disruption patterns, recovery times, and network health.
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 mt-4 p-1 bg-bg-surface rounded-lg border border-border">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 text-[11px] font-semibold uppercase tracking-wider py-2 rounded-md transition ${tab === t.key ? "bg-accent-teal/10 text-accent-teal" : "text-text-dim hover:text-text-secondary"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "30d" && (
        <div className="mt-4 space-y-4">
          <Card title="Network Health — 30 Day Trend" subtitle="Health score + event count dual axis">
            <div className="h-[380px]">
              <ResponsiveContainer>
                <ComposedChart data={HEALTH_TREND_30D}>
                  <defs>
                    <linearGradient id="gHealth" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#00d4aa" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#00d4aa" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#1e2d42" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" stroke="#4a6278" fontSize={9} tickFormatter={(v: string) => v.slice(5)} />
                  <YAxis yAxisId="left" stroke="#00d4aa" fontSize={10} domain={[0, 100]} />
                  <YAxis yAxisId="right" orientation="right" stroke="#f59e0b" fontSize={10} />
                  <Tooltip />
                  <Area yAxisId="left" dataKey="healthScore" stroke="#00d4aa" fill="url(#gHealth)" fillOpacity={1} />
                  <Line yAxisId="right" dataKey="eventCount" stroke="#f59e0b" strokeWidth={2} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      )}

      {tab === "week" && (
        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <MetricCard label="This Week Events" value={thisWeekEvents} color="amber" icon={<Calendar size={16} />} />
            <MetricCard label="Last Week Events" value={lastWeekEvents} color="blue" />
            <MetricCard label="This Week Loss" value={thisWeekLoss} unit="USD" color="red" icon={<AlertTriangle size={16} />} />
            <MetricCard label="Last Week Loss" value={lastWeekLoss} unit="USD" color="blue" />
          </div>
          <Card title="Week-over-Week" subtitle="Daily breakdown">
            <div className="h-[300px]">
              <ResponsiveContainer>
                <BarChart data={HEALTH_TREND_30D.slice(-14).map((d, i) => ({
                  ...d,
                  week: i < 7 ? "Last Week" : "This Week",
                  date: d.date.slice(5),
                }))}>
                  <CartesianGrid stroke="#1e2d42" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" stroke="#8fa4c0" fontSize={9} />
                  <YAxis stroke="#4a6278" fontSize={10} />
                  <Tooltip />
                  <Bar dataKey="eventCount" radius={[3, 3, 0, 0]}>
                    {HEALTH_TREND_30D.slice(-14).map((_, i) => (
                      <Cell key={i} fill={i < 7 ? "#1e2d42" : "#f59e0b"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      )}

      {tab === "disrupted" && (
        <div className="mt-4">
          <Card title="Most Disrupted Corridors" subtitle="Ranked by historical event count">
            <div className="h-[380px]">
              <ResponsiveContainer>
                <BarChart data={mostDisrupted} layout="vertical" margin={{ left: 80 }}>
                  <CartesianGrid stroke="#1e2d42" strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" stroke="#4a6278" fontSize={10} />
                  <YAxis type="category" dataKey="port" stroke="#8fa4c0" fontSize={10} width={80} />
                  <Tooltip formatter={(v) => formatCurrency(v as number)} />
                  <Bar dataKey="loss" radius={[0, 4, 4, 0]}>
                    {mostDisrupted.map((_, i) => (
                      <Cell key={i} fill={i < 3 ? "#ef4444" : i < 6 ? "#f59e0b" : "#00d4aa"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      )}

      {tab === "recovery" && (
        <div className="mt-4">
          <Card title="Fastest Recovery" subtitle="Ports with shortest average recovery time">
            <div className="h-[380px]">
              <ResponsiveContainer>
                <BarChart data={fastestRecovery} layout="vertical" margin={{ left: 80 }}>
                  <CartesianGrid stroke="#1e2d42" strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" stroke="#4a6278" fontSize={10} unit="d" />
                  <YAxis type="category" dataKey="port" stroke="#8fa4c0" fontSize={10} width={80} />
                  <Tooltip />
                  <Bar dataKey="recovery" radius={[0, 4, 4, 0]} fill="#00d4aa" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      )}
    </PageWrapper>
  );
}
