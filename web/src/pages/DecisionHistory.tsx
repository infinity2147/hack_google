import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import {
  ClipboardList,
  GitBranch,
} from "lucide-react";
import { PageWrapper } from "../components/layout/PageWrapper";
import { Card } from "../components/shared/Card";
import { MetricCard } from "../components/shared/MetricCard";
import { useDecisionLog, useLogDecision } from "../api/queries";
import type { DecisionEntry } from "../types";

const TYPE_ICONS: Record<string, string> = {
  reroute: "🔀",
  accept: "✅",
  alternative: "🔄",
  reject: "❌",
  investigate: "🔍",
  false_positive: "⚠️",
  compliance: "📋",
  monitor: "📋",
  scenario: "🎮",
  seed: "⚡",
};

const TYPE_COLORS: Record<string, string> = {
  reroute: "border-accent-amber",
  accept: "border-accent-teal",
  alternative: "border-accent-blue",
  reject: "border-accent-red",
  investigate: "border-accent-blue",
  false_positive: "border-accent-amber",
  compliance: "border-accent-purple",
  monitor: "border-accent-teal",
  scenario: "border-accent-purple",
  seed: "border-accent-red",
};

export function DecisionHistory() {
  const { data: apiDecisionLog, isLoading } = useDecisionLog();
  const logDecisionMutation = useLogDecision();

  const decisionLog: DecisionEntry[] = (apiDecisionLog as DecisionEntry[] | undefined) ?? [];

  const [filter, setFilter] = useState<string>("all");

  const allTypes = useMemo(() => [...new Set(decisionLog.map((e) => e.actionType))], [decisionLog]);

  const filtered = useMemo(() => {
    if (filter === "all") return decisionLog;
    return decisionLog.filter((e) => e.actionType === filter);
  }, [decisionLog, filter]);

  const summary = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const e of decisionLog) {
      counts[e.actionType] = (counts[e.actionType] || 0) + 1;
    }
    return counts;
  }, [decisionLog]);

  const summaryChart = useMemo(
    () => Object.entries(summary).map(([type, count]) => ({ type, count })),
    [summary],
  );

  // Agent trust scores from reroute decisions
  const trustScores = useMemo(() => {
    const reroutes = decisionLog.filter((e) => e.actionType === "reroute" || e.actionType === "accept" || e.actionType === "alternative");
    const carrierCounts: Record<string, { total: number; positive: number }> = {};
    for (const r of reroutes) {
      const carrier = (r.details.carrier as string) || "Unknown";
      if (!carrierCounts[carrier]) carrierCounts[carrier] = { total: 0, positive: 0 };
      carrierCounts[carrier].total++;
      const outcome = r.details.outcome as string;
      if (outcome === "accepted" || outcome === "alternative") carrierCounts[carrier].positive++;
    }
    return Object.entries(carrierCounts).map(([carrier, data]) => ({
      carrier,
      score: data.total > 0 ? data.positive / data.total : 0,
      total: data.total,
    }));
  }, [decisionLog]);

  const handleLogDecision = (actionType: string, target: string, details?: Record<string, unknown>) => {
    logDecisionMutation.mutate({ action_type: actionType, target, details });
  };

  return (
    <PageWrapper>
      <div className="rounded-xl border border-border bg-bg-surface p-5">
        <div className="flex items-start gap-3">
          <ClipboardList className="text-accent-teal shrink-0 mt-1" size={22} />
          <div>
            <h2 className="text-display text-xl tracking-tight">Decision History</h2>
            <p className="text-sm text-text-secondary mt-1">
              Every action you take is logged. Review past decisions, track outcomes, and measure agent trust.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-4">
        <MetricCard label="Total Decisions" value={decisionLog.length} color="teal" icon={<ClipboardList size={16} />} />
        <MetricCard label="Unique Action Types" value={allTypes.length} color="purple" icon={<GitBranch size={16} />} />
      </div>

      {decisionLog.length > 0 && (
        <>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mt-4">
            <Card title="Decisions by Type" subtitle="Breakdown of all actions">
              <div className="h-[250px]">
                <ResponsiveContainer>
                  <BarChart data={summaryChart}>
                    <CartesianGrid stroke="#1e2d42" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="type" stroke="#8fa4c0" fontSize={9} tickFormatter={(v: string) => v.replace(/_/g, " ")} />
                    <YAxis stroke="#4a6278" fontSize={10} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#00d4aa" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card title="Agent Trust Scores" subtitle="Carrier performance from your decisions">
              {trustScores.length > 0 ? (
                <div className="space-y-3">
                  {trustScores.map((t) => {
                    const pct = Math.round(t.score * 100);
                    const color = pct > 70 ? "bg-accent-teal" : pct > 40 ? "bg-accent-amber" : "bg-accent-red";
                    const textColor = pct > 70 ? "text-accent-teal" : pct > 40 ? "text-accent-amber" : "text-accent-red";
                    return (
                      <div key={t.carrier}>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-text-primary font-semibold">{t.carrier}</span>
                          <span className={`font-mono ${textColor}`}>{pct}% ({t.total} decisions)</span>
                        </div>
                        <div className="mt-1 h-[5px] rounded-full bg-bg-elevated overflow-hidden">
                          <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%`, transition: "width 0.5s ease" }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-text-dim">
                  Accept or reject routes to build trust scores.
                </div>
              )}
            </Card>
          </div>

          <Card
            className="mt-4"
            title="Audit Trail"
            subtitle={`${filtered.length} entries`}
            right={
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="bg-bg-elevated border border-border rounded px-2 py-1 text-xs text-text-primary outline-none focus:border-accent-teal"
              >
                <option value="all">All Types</option>
                {allTypes.map((t) => (
                  <option key={t} value={t}>{t.replace(/_/g, " ")}</option>
                ))}
              </select>
            }
          >
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {filtered.slice(0, 60).map((entry, i) => {
                const icon = TYPE_ICONS[entry.actionType] || "📝";
                const borderColor = TYPE_COLORS[entry.actionType] || "border-border";
                const detailsStr = Object.entries(entry.details)
                  .map(([k, v]) => `${k}: ${typeof v === "string" ? v : JSON.stringify(v)}`)
                  .join(" · ");
                return (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.02 }}
                    className={`rounded-lg border-l-[3px] ${borderColor} border border-border bg-bg-elevated p-3`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span>{icon}</span>
                        <span className="text-sm text-text-primary font-semibold">
                          {entry.actionType.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                        </span>
                        <span className="text-text-secondary text-xs">— {entry.target}</span>
                      </div>
                      <span className="text-[10px] text-text-dim font-mono">{entry.timestamp}</span>
                    </div>
                    {detailsStr && (
                      <div className="mt-1 text-[11px] text-text-dim">{detailsStr}</div>
                    )}
                  </motion.div>
                );
              })}
              {filtered.length === 0 && (
                <div className="py-8 text-center text-xs text-text-dim">No entries match filter.</div>
              )}
            </div>
          </Card>
        </>
      )}

      {decisionLog.length === 0 && (
        <Card className="mt-4">
          <div className="py-12 text-center">
            <ClipboardList className="mx-auto text-text-dim" size={36} />
            <div className="text-text-primary text-sm font-semibold mt-3">No Decisions Yet</div>
            <div className="text-text-secondary text-xs mt-2 max-w-md mx-auto leading-relaxed">
              Start making decisions to see your audit trail here. Try: seed a disruption, accept/reject routes, investigate documents, or reroute shipments.
            </div>
          </div>
        </Card>
      )}
    </PageWrapper>
  );
}
