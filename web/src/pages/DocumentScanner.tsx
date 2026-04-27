import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Cell,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ZAxis,
  ReferenceLine,
} from "recharts";
import {
  FileSearch,
  Upload,
  AlertTriangle,
  Check,
  ChevronDown,
  ChevronRight,
  Sparkles,
  FileText,
} from "lucide-react";
import { PageWrapper } from "../components/layout/PageWrapper";
import { Card } from "../components/shared/Card";
import { MetricCard } from "../components/shared/MetricCard";
import { StatusBadge } from "../components/shared/StatusBadge";
import { SeverityBar } from "../components/shared/SeverityBar";
import { AIExplanationPanel } from "../components/shared/AIExplanationPanel";
import {
  DOCUMENTS,
  DOCUMENT_TOTAL_COUNT,
  DOCUMENT_VALUE_PROCESSED,
} from "../data/mockDocuments";
import { formatCurrency } from "../utils/formatters";
import type { FinancialDocument } from "../types";

type StatusFilter = FinancialDocument["status"];
type TypeFilter = FinancialDocument["type"];

const PIPELINE_STEPS = [
  { label: "Uploading…", duration: 300 },
  { label: "Gemini extracting entities (12 companies, 5 ports)…", duration: 1000 },
  { label: "Building trade entity graph…", duration: 700 },
  { label: "GraphSAGE neighborhood scoring…", duration: 800 },
  { label: "Anomaly detection complete", duration: 400 },
];

export function DocumentScanner() {
  const [statusFilter, setStatusFilter] = useState<Set<StatusFilter>>(
    new Set<StatusFilter>(["normal", "review", "alert", "critical"]),
  );
  const [typeFilter, setTypeFilter] = useState<Set<TypeFilter>>(
    new Set<TypeFilter>([
      "invoice",
      "bill_of_lading",
      "customs_declaration",
      "purchase_order",
    ]),
  );
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [pipelineStep, setPipelineStep] = useState<number | null>(null);
  const [pipelineDone, setPipelineDone] = useState<{ score: number; status: FinancialDocument["status"] } | null>(null);

  const counts = useMemo(() => {
    const c = { normal: 0, review: 0, alert: 0, critical: 0 };
    for (const d of DOCUMENTS) c[d.status]++;
    return c;
  }, []);

  const filtered = useMemo(() => {
    return DOCUMENTS.filter(
      (d) =>
        statusFilter.has(d.status) &&
        typeFilter.has(d.type) &&
        (search
          ? d.supplier.toLowerCase().includes(search.toLowerCase()) ||
            d.id.toLowerCase().includes(search.toLowerCase())
          : true),
    );
  }, [statusFilter, typeFilter, search]);

  const deviationData = filtered.slice(0, 50).map((d) => ({
    id: d.id,
    deviation: d.deviationPct,
    status: d.status,
  }));

  const scatterData = filtered.map((d) => ({
    value: d.value,
    score: d.anomalyScore,
    status: d.status,
    id: d.id,
    supplier: d.supplier,
  }));

  const toggleSet = <T extends string>(set: Set<T>, value: T) => {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    return next;
  };

  const runUploadDemo = async () => {
    setPipelineDone(null);
    for (let i = 0; i < PIPELINE_STEPS.length; i++) {
      setPipelineStep(i);
      await new Promise((r) => setTimeout(r, PIPELINE_STEPS[i].duration));
    }
    setPipelineStep(null);
    const score = +(0.2 + Math.random() * 0.5).toFixed(2);
    const status: FinancialDocument["status"] =
      score >= 0.75 ? "critical" : score >= 0.55 ? "alert" : score >= 0.3 ? "review" : "normal";
    setPipelineDone({ score, status });
  };

  return (
    <PageWrapper>
      {/* Header */}
      <div className="rounded-xl border border-border bg-bg-surface p-5">
        <div className="flex items-start gap-3">
          <FileSearch className="text-accent-blue shrink-0 mt-1" size={22} />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-display text-xl tracking-tight">
                Document Intelligence
              </h2>
              <StatusBadge status="live" />
            </div>
            <p className="text-sm text-text-secondary mt-1 max-w-3xl leading-relaxed">
              GraphSAGE anomaly detection on trade entity graphs. Detects
              financial stress 2–3 weeks <span className="text-accent-teal">before</span>{" "}
              physical disruptions hit the supply chain.
            </p>
            <p className="mt-2 text-xs text-text-dim italic">
              "A supplier about to default changes payment terms. A price spike
              shows up in invoices before it causes stockouts."
            </p>
          </div>
        </div>
      </div>

      {/* Top metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mt-4">
        <MetricCard label="Total Documents" value={DOCUMENT_TOTAL_COUNT} color="blue" icon={<FileText size={16} />} />
        <MetricCard label="Normal" value={counts.normal} color="green" />
        <MetricCard label="Under Review" value={counts.review} color="amber" />
        <MetricCard label="Alert" value={counts.alert} color="amber" />
        <MetricCard label="Critical" value={counts.critical} color="red" glow icon={<AlertTriangle size={16} />} />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-3">
        <MetricCard
          label="Total Value Processed"
          value={DOCUMENT_VALUE_PROCESSED / 1_000_000}
          unit="M"
          decimals={0}
          color="teal"
        />
        <MetricCard label="Avg Anomaly Score" value={0.31} decimals={2} color="purple" />
        <MetricCard label="New Today" value={47} color="blue" />
        <MetricCard label="Processing Time" value={1.2} unit="s" decimals={1} color="green" subtitle="avg per document" />
      </div>

      {/* Upload + pipeline */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mt-4">
        <Card
          className="xl:col-span-2"
          title="Document Upload"
          subtitle="Gemini → Entity Extraction → Graph → GraphSAGE → Anomaly"
        >
          <div className="rounded-lg border-2 border-dashed border-border p-6 text-center hover:border-accent-teal transition-colors">
            <Upload className="mx-auto text-accent-teal" size={28} />
            <div className="mt-3 text-sm text-text-primary">
              Drop invoice, bill of lading, or customs declaration
            </div>
            <div className="text-xs text-text-secondary mt-1">
              Supported: PDF, CSV, TXT
            </div>
            <button
              onClick={runUploadDemo}
              disabled={pipelineStep !== null}
              className="mt-4 inline-flex items-center gap-2 bg-accent-teal text-bg-base font-semibold rounded-lg px-3 py-2 text-xs hover:brightness-110 disabled:opacity-50"
            >
              <Upload size={14} /> Simulate Upload
            </button>
          </div>

          <div className="mt-4 space-y-2">
            <div className="text-[10px] uppercase tracking-wider text-text-secondary">
              Processing Pipeline
            </div>
            {PIPELINE_STEPS.map((step, i) => {
              const active = pipelineStep === i;
              const done = pipelineStep != null && pipelineStep > i;
              return (
                <div
                  key={step.label}
                  className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg transition-colors ${
                    active
                      ? "border border-accent-teal/50 bg-accent-teal/5 text-text-primary"
                      : done
                        ? "border border-border bg-bg-elevated text-accent-green"
                        : "border border-border bg-bg-elevated text-text-dim"
                  }`}
                >
                  {done ? (
                    <Check size={14} />
                  ) : active ? (
                    <span className="inline-block h-2 w-2 rounded-full bg-accent-teal dot-pulse" />
                  ) : (
                    <span className="inline-block h-2 w-2 rounded-full bg-text-dim" />
                  )}
                  <span>{step.label}</span>
                </div>
              );
            })}
            {pipelineDone && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mt-3 rounded-lg border px-3 py-2 text-xs ${
                  pipelineDone.status === "critical"
                    ? "border-accent-red/50 bg-accent-red/10 text-accent-red"
                    : pipelineDone.status === "alert"
                      ? "border-accent-amber/50 bg-accent-amber/10 text-accent-amber"
                      : "border-accent-green/50 bg-accent-green/10 text-accent-green"
                }`}
              >
                ✅ Analysis complete — score{" "}
                <span className="font-mono font-semibold">{pipelineDone.score}</span> ·{" "}
                {pipelineDone.status.toUpperCase()}
              </motion.div>
            )}
          </div>
        </Card>

        <Card title="Anomaly Deviation" subtitle="50 most recent · vs historical baseline">
          <div className="h-[330px] -mx-2">
            <ResponsiveContainer>
              <ComposedChart data={deviationData}>
                <CartesianGrid stroke="#1e2d42" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="id" stroke="#4a6278" fontSize={9} hide />
                <YAxis stroke="#4a6278" fontSize={10} unit="%" />
                <Tooltip />
                <ReferenceLine y={8} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: "warning", fontSize: 9, fill: "#f59e0b" }} />
                <ReferenceLine y={15} stroke="#ef4444" strokeDasharray="3 3" label={{ value: "critical", fontSize: 9, fill: "#ef4444" }} />
                <Bar dataKey="deviation" radius={[3, 3, 0, 0]}>
                  {deviationData.map((d, i) => (
                    <Cell
                      key={i}
                      fill={
                        d.deviation > 15
                          ? "#ef4444"
                          : d.deviation > 8
                            ? "#f59e0b"
                            : "#00d4aa"
                      }
                    />
                  ))}
                </Bar>
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Anomaly scatter */}
      <Card
        className="mt-4"
        title="Anomaly Scatter"
        subtitle="Document value × anomaly score · color = status · dashed = decision threshold"
      >
        <div className="h-[330px] -mx-2">
          <ResponsiveContainer>
            <ScatterChart>
              <CartesianGrid stroke="#1e2d42" strokeDasharray="3 3" />
              <XAxis
                type="number"
                dataKey="value"
                name="Value"
                stroke="#4a6278"
                fontSize={10}
                tickFormatter={(v) => formatCurrency(v)}
              />
              <YAxis
                type="number"
                dataKey="score"
                name="Anomaly"
                domain={[0, 1]}
                stroke="#4a6278"
                fontSize={10}
              />
              <ZAxis type="number" range={[40, 200]} dataKey="value" />
              <Tooltip
                cursor={{ stroke: "#2a3f5e", strokeDasharray: "3 3" }}
                content={(props) => {
                  const p = props.payload?.[0]?.payload as
                    | (typeof scatterData)[number]
                    | undefined;
                  if (!p) return null;
                  return (
                    <div className="rounded-lg border border-border-bright bg-bg-elevated px-3 py-2 text-xs">
                      <div className="text-text-primary font-semibold">{p.id}</div>
                      <div className="text-text-secondary">{p.supplier}</div>
                      <div className="text-text-secondary">
                        {formatCurrency(p.value)} ·{" "}
                        <span className="text-accent-amber font-mono">
                          {p.score.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  );
                }}
              />
              <ReferenceLine
                y={0.5}
                stroke="#8b5cf6"
                strokeDasharray="4 4"
                label={{
                  value: "decision threshold",
                  fontSize: 10,
                  fill: "#8b5cf6",
                  position: "insideTopRight",
                }}
              />
              <Scatter
                data={scatterData.filter((d) => d.status === "normal")}
                fill="#22c55e"
                opacity={0.6}
                name="Normal"
              />
              <Scatter
                data={scatterData.filter((d) => d.status === "review")}
                fill="#3b82f6"
                opacity={0.7}
                name="Review"
              />
              <Scatter
                data={scatterData.filter((d) => d.status === "alert")}
                fill="#f59e0b"
                opacity={0.85}
                name="Alert"
              />
              <Scatter
                data={scatterData.filter((d) => d.status === "critical")}
                fill="#ef4444"
                opacity={0.95}
                name="Critical"
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Filters */}
      <Card
        className="mt-4"
        title="Document Inspector"
        subtitle={`${filtered.length} of ${DOCUMENTS.length} documents`}
        right={
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search supplier or DOC-ID…"
            className="bg-bg-elevated border border-border rounded px-2 py-1 text-xs text-text-primary outline-none focus:border-accent-teal w-56"
          />
        }
      >
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <span className="text-[10px] uppercase tracking-wider text-text-secondary">
            Status
          </span>
          {(["normal", "review", "alert", "critical"] as StatusFilter[]).map((s) => {
            const active = statusFilter.has(s);
            const cls =
              s === "critical"
                ? "border-accent-red/50 text-accent-red bg-accent-red/10"
                : s === "alert"
                  ? "border-accent-amber/50 text-accent-amber bg-accent-amber/10"
                  : s === "review"
                    ? "border-accent-blue/50 text-accent-blue bg-accent-blue/10"
                    : "border-accent-green/50 text-accent-green bg-accent-green/10";
            return (
              <button
                key={s}
                onClick={() => setStatusFilter(toggleSet(statusFilter, s))}
                className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded-full border transition ${
                  active ? cls : "border-border text-text-dim"
                }`}
              >
                {s}
              </button>
            );
          })}
          <span className="text-[10px] uppercase tracking-wider text-text-secondary ml-3">
            Type
          </span>
          {(["invoice", "bill_of_lading", "customs_declaration", "purchase_order"] as TypeFilter[]).map((t) => {
            const active = typeFilter.has(t);
            return (
              <button
                key={t}
                onClick={() => setTypeFilter(toggleSet(typeFilter, t))}
                className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded-full border transition ${
                  active
                    ? "border-accent-teal text-accent-teal bg-accent-teal/10"
                    : "border-border text-text-dim"
                }`}
              >
                {t.replace(/_/g, " ")}
              </button>
            );
          })}
        </div>

        <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
          {filtered.slice(0, 30).map((d) => {
            const expanded = expandedId === d.id;
            return (
              <div
                key={d.id}
                className="rounded-lg border border-border bg-bg-elevated p-3 hover:border-border-bright transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <StatusBadge status={d.status} />
                      <span className="font-mono text-xs text-text-secondary">{d.id}</span>
                      <span className="text-[10px] uppercase tracking-wider text-text-dim">
                        {d.type.replace(/_/g, " ")}
                      </span>
                      <span className="text-[10px] text-text-dim ml-auto">{d.date}</span>
                    </div>
                    <div className="mt-1.5 text-sm text-text-primary">
                      {d.supplier} <span className="text-text-dim">→</span>{" "}
                      <span className="text-text-secondary">{d.buyer}</span>
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-[11px] text-text-secondary">
                      <span className="font-mono text-accent-teal">
                        {formatCurrency(d.value)}
                      </span>
                      {d.commodity && <span>· {d.commodity}</span>}
                      {d.paymentTerms && (
                        <span>· {d.paymentTerms}</span>
                      )}
                    </div>
                    <div className="mt-2 flex items-center gap-3">
                      <span className="text-[10px] uppercase tracking-wider text-text-secondary">
                        Anomaly score
                      </span>
                      <div className="flex-1 max-w-xs">
                        <SeverityBar value={d.anomalyScore} height={5} labelDecimals={2} />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-2 text-[11px] text-text-secondary leading-relaxed space-y-0.5">
                  {d.signals.map((s, i) => (
                    <div key={i} className="flex items-start gap-1.5">
                      <span
                        className={
                          d.status === "critical" || d.status === "alert"
                            ? "text-accent-amber"
                            : "text-accent-teal"
                        }
                      >
                        ⚠
                      </span>
                      <span>{s}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <button
                    onClick={() => setExpandedId(expanded ? null : d.id)}
                    className="text-[11px] text-accent-teal hover:underline inline-flex items-center gap-1"
                  >
                    {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                    {expanded ? "Hide AI Analysis" : "AI Analysis"}
                  </button>
                  <div className="flex items-center gap-2">
                    <button className="text-[11px] text-text-dim hover:text-accent-teal">
                      Flag
                    </button>
                    <button className="text-[11px] text-text-dim hover:text-accent-teal">
                      Dismiss
                    </button>
                  </div>
                </div>
                <AnimatePresence initial={false}>
                  {expanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden mt-3"
                    >
                      <div className="rounded-lg border border-accent-purple/30 bg-bg-surface p-3 text-[11px] text-text-secondary">
                        <div className="flex items-center gap-2 text-accent-purple text-[10px] uppercase tracking-widest mb-2">
                          <Sparkles size={10} /> GraphSAGE entity analysis
                        </div>
                        <div className="space-y-1 font-mono leading-relaxed">
                          <div>
                            Entity: {d.supplier}
                          </div>
                          <div>
                            Neighborhood anomaly: {Math.floor(2 + Math.random() * 3)} new intermediaries / 14d
                          </div>
                          <div>
                            VAE reconstruction error:{" "}
                            <span className="text-accent-amber">
                              {(0.2 + d.anomalyScore * 0.7).toFixed(2)}
                            </span>{" "}
                            (normal &lt;0.20)
                          </div>
                          <div>
                            KL divergence:{" "}
                            <span className="text-accent-amber">
                              {(0.5 + d.anomalyScore * 1.4).toFixed(2)}
                            </span>
                          </div>
                          <div className="text-text-dim">
                            Prob disruption in 21d:{" "}
                            <span className="text-accent-red">
                              {Math.floor(d.anomalyScore * 90 + 5)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="py-8 text-center text-xs text-text-dim">
              No documents match filters.
            </div>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mt-4">
        <AIExplanationPanel
          title="Financial Early Warning"
          confidence={0.81}
          sources="GraphSAGE on trade entity graph · GDELT-validated ground truth"
        >
          <p>
            No commercial supply-chain platform ingests financial documents as
            a predictive signal source. Closest analog: hedge funds using
            satellite imagery of parking lots to predict retail earnings —{" "}
            <span className="text-accent-teal">alpha-generating</span> before
            mainstream observability.
          </p>
          <p>
            Detection lead time: <span className="font-mono text-accent-teal">2–3 weeks</span>{" "}
            before physical disruption · false positive rate{" "}
            <span className="font-mono">8.3%</span> · true positive rate{" "}
            <span className="font-mono">81%</span> on held-out events.
          </p>
        </AIExplanationPanel>
        <Card title="Novel Data Modality" subtitle="Why financial documents predict physical disruption">
          <ul className="space-y-2 text-xs text-text-secondary leading-relaxed">
            <li>
              <span className="text-accent-teal">Payment terms shift</span> →
              cashflow stress → supplier default risk
            </li>
            <li>
              <span className="text-accent-teal">Quantity/price ratio drift</span> →
              capacity shortage at origin
            </li>
            <li>
              <span className="text-accent-teal">New intermediary entities</span> →
              gray-market routing, sanctions evasion
            </li>
            <li>
              <span className="text-accent-teal">Currency/incoterm mismatches</span>{" "}
              → trade documentation forgery
            </li>
            <li>
              <span className="text-accent-teal">Round-trip transactions</span> →
              phantom invoicing, money laundering
            </li>
          </ul>
        </Card>
      </div>
    </PageWrapper>
  );
}
