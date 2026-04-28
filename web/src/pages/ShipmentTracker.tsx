import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import {
  Package,
  AlertTriangle,
  Clock,
  Truck,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { PageWrapper } from "../components/layout/PageWrapper";
import { Card } from "../components/shared/Card";
import { MetricCard } from "../components/shared/MetricCard";
import { StatusBadge } from "../components/shared/StatusBadge";
import { SeverityBar } from "../components/shared/SeverityBar";
import { useNexus } from "../store/nexusStore";
import { MOCK_SHIPMENTS } from "../data/mockShipments";
import { formatCurrency } from "../utils/formatters";
import { useShipments, useShipmentStats } from "../api/queries";
import type { Shipment } from "../types";

type StatusFilter = Shipment["status"];

const STATUS_META: Record<StatusFilter, { icon: typeof Package; color: string; label: string }> = {
  delivered: { icon: CheckCircle, color: "green", label: "Delivered" },
  in_transit: { icon: Truck, color: "blue", label: "In Transit" },
  delayed: { icon: Clock, color: "amber", label: "Delayed" },
  disrupted: { icon: XCircle, color: "red", label: "Disrupted" },
};

export function ShipmentTracker() {
  const { logDecision, runtime } = useNexus();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<Set<StatusFilter>>(new Set(["in_transit", "delayed", "disrupted"]));

  const { data: shipmentsData, isLoading: shipmentsLoading } = useShipments();
  const { data: statsData, isLoading: statsLoading } = useShipmentStats();

  const shipments: Shipment[] = (shipmentsData?.items as Shipment[] | undefined) ?? MOCK_SHIPMENTS;

  const filtered = useMemo(() => {
    return shipments.filter(
      (s) =>
        statusFilter.has(s.status) &&
        (search
          ? s.id.toLowerCase().includes(search.toLowerCase()) ||
            s.originName.toLowerCase().includes(search.toLowerCase()) ||
            s.destName.toLowerCase().includes(search.toLowerCase())
          : true),
    );
  }, [shipments, search, statusFilter]);

  const highRisk = useMemo(
    () => filtered.filter((s) => s.riskScore > 0.3).sort((a, b) => b.riskScore - a.riskScore),
    [filtered],
  );

  const riskDistribution = useMemo(() => {
    const buckets = [
      { range: "0-0.2", count: 0, fill: "#22c55e" },
      { range: "0.2-0.4", count: 0, fill: "#3b82f6" },
      { range: "0.4-0.6", count: 0, fill: "#f59e0b" },
      { range: "0.6-0.8", count: 0, fill: "#ef4444" },
    ];
    for (const s of filtered) {
      if (s.riskScore < 0.2) buckets[0].count++;
      else if (s.riskScore < 0.4) buckets[1].count++;
      else if (s.riskScore < 0.6) buckets[2].count++;
      else buckets[3].count++;
    }
    return buckets;
  }, [filtered]);

  const total = statsData?.total ?? shipments.length;
  const inTransit = statsData?.inTransit ?? shipments.filter((s) => s.status === "in_transit").length;
  const delayed = statsData?.delayed ?? shipments.filter((s) => s.status === "delayed").length;
  const disrupted = statsData?.disrupted ?? shipments.filter((s) => s.status === "disrupted").length;
  const onTimeRate = statsData?.onTimeRate ?? (1 - delayed / total);

  const toggleStatus = (s: StatusFilter) => {
    const next = new Set(statusFilter);
    if (next.has(s)) next.delete(s); else next.add(s);
    setStatusFilter(next);
  };

  const nodeRisk = (id: string) => runtime[id]?.infection ?? 0;

  return (
    <PageWrapper>
      <div className="rounded-xl border border-border bg-bg-surface p-5">
        <div className="flex items-start gap-3">
          <Package className="text-accent-teal shrink-0 mt-1" size={22} />
          <div>
            <h2 className="text-display text-xl tracking-tight">Shipment Tracker</h2>
            <p className="text-sm text-text-secondary mt-1">
              Search, filter, and track shipments with risk flags and reroute actions.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mt-4">
        <MetricCard label="Total Shipments" value={total} color="teal" icon={<Package size={16} />} />
        <MetricCard label="In Transit" value={inTransit} color="blue" icon={<Truck size={16} />} />
        <MetricCard label="Delayed" value={delayed} color="amber" icon={<Clock size={16} />} />
        <MetricCard label="Disrupted" value={disrupted} color="red" icon={<AlertTriangle size={16} />} />
        <MetricCard label="On-Time Rate" value={Math.round(onTimeRate * 100)} unit="%" color="green" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mt-4">
        <Card className="xl:col-span-2" title="Risk-Flagged Shipments" subtitle={`${highRisk.length} shipments above risk threshold 0.3`}>
          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {highRisk.slice(0, 20).map((s) => {
              const originRisk = nodeRisk(s.originId);
              const destRisk = nodeRisk(s.destId);
              const compositeRisk = ((originRisk + destRisk) / 2) * 100;
              const riskColor = compositeRisk > 50 ? "red" : compositeRisk > 25 ? "amber" : "green";
              return (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-lg border border-border bg-bg-elevated p-3 hover:border-border-bright"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-text-secondary">{s.id}</span>
                        <StatusBadge status={s.status === "disrupted" ? "critical" : s.status === "delayed" ? "alert" : "live"} />
                        <span className="text-[10px] text-text-dim">{s.commodity}</span>
                      </div>
                      <div className="text-sm text-text-primary mt-1">
                        {s.originName} → {s.destName}
                      </div>
                      <div className="text-[11px] text-text-secondary mt-0.5">
                        {s.carrier} · {s.transportMode} · {s.transitDaysActual}d · {s.teu} TEU · {formatCurrency(s.costUSD)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-semibold ${riskColor === "red" ? "text-accent-red" : riskColor === "amber" ? "text-accent-amber" : "text-accent-green"}`}>
                        {compositeRisk.toFixed(0)}/100
                      </div>
                      <div className="text-[10px] text-text-dim">Risk</div>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      onClick={() => logDecision("reroute", s.id, { carrier: s.carrier, origin: s.originName, dest: s.destName, predictedSavings: Math.round(s.costUSD * 0.15), outcome: "pending" })}
                      className="text-[10px] bg-accent-teal/10 text-accent-teal border border-accent-teal/30 rounded px-2 py-0.5 hover:bg-accent-teal/20"
                    >
                      🔀 Reroute
                    </button>
                    <div className="flex-1 max-w-[120px]">
                      <SeverityBar value={s.riskScore} height={4} labelDecimals={2} />
                    </div>
                  </div>
                </motion.div>
              );
            })}
            {highRisk.length === 0 && (
              <div className="py-8 text-center text-xs text-text-dim">No high-risk shipments in current filter.</div>
            )}
          </div>
        </Card>

        <Card title="Risk Distribution" subtitle="By risk score bucket">
          <div className="h-[300px]">
            <ResponsiveContainer>
              <BarChart data={riskDistribution}>
                <CartesianGrid stroke="#1e2d42" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="range" stroke="#8fa4c0" fontSize={10} />
                <YAxis stroke="#4a6278" fontSize={10} />
                <Tooltip />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {riskDistribution.map((b, i) => (
                    <Cell key={i} fill={b.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card
        className="mt-4"
        title="All Shipments"
        subtitle={`${filtered.length} of ${total}`}
        right={
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              {(["in_transit", "delayed", "disrupted", "delivered"] as StatusFilter[]).map((st) => {
                const meta = STATUS_META[st];
                const active = statusFilter.has(st);
                return (
                  <button
                    key={st}
                    onClick={() => toggleStatus(st)}
                    className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded-full border transition ${active ? `border-accent-${meta.color}/50 text-accent-${meta.color} bg-accent-${meta.color}/10` : "border-border text-text-dim"}`}
                  >
                    {meta.label}
                  </button>
                );
              })}
            </div>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search ID / origin / dest…"
              className="bg-bg-elevated border border-border rounded px-2 py-1 text-xs text-text-primary outline-none focus:border-accent-teal w-48"
            />
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-[10px] uppercase tracking-wider text-text-secondary border-b border-border">
                <th className="px-3 py-2 text-left">ID</th>
                <th className="px-3 py-2 text-left">Route</th>
                <th className="px-3 py-2 text-left">Commodity</th>
                <th className="px-3 py-2 text-left">Carrier</th>
                <th className="px-3 py-2 text-center">Status</th>
                <th className="px-3 py-2 text-right">Delay</th>
                <th className="px-3 py-2 text-right">Cost</th>
                <th className="px-3 py-2 text-right">Risk</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 50).map((s) => (
                <tr key={s.id} className="border-b border-border hover:bg-bg-hover">
                  <td className="px-3 py-2 font-mono text-text-secondary">{s.id}</td>
                  <td className="px-3 py-2 text-text-primary">{s.originName} → {s.destName}</td>
                  <td className="px-3 py-2 text-text-secondary">{s.commodity}</td>
                  <td className="px-3 py-2 text-text-secondary">{s.carrier}</td>
                  <td className="px-3 py-2 text-center"><StatusBadge status={s.status === "disrupted" ? "critical" : s.status === "delayed" ? "alert" : s.status === "in_transit" ? "live" : "normal"} size="sm" /></td>
                  <td className="px-3 py-2 text-right font-mono text-text-secondary">{s.delayDays > 0 ? `+${s.delayDays}d` : "—"}</td>
                  <td className="px-3 py-2 text-right font-mono text-text-primary">{formatCurrency(s.costUSD)}</td>
                  <td className="px-3 py-2 text-right font-mono">{s.riskScore.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </PageWrapper>
  );
}
