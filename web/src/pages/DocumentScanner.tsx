import { useMemo, useState, useRef } from "react";
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
  Upload,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Sparkles,
  FileText,
  CheckCircle,
  Loader,
  Ship,
} from "lucide-react";
import { PageWrapper } from "../components/layout/PageWrapper";
import { Card } from "../components/shared/Card";
import { MetricCard } from "../components/shared/MetricCard";
import { StatusBadge } from "../components/shared/StatusBadge";
import { SeverityBar } from "../components/shared/SeverityBar";
import { useNexus } from "../store/nexusStore";
import {
  DOCUMENTS,
  DOCUMENT_TOTAL_COUNT,
  DOCUMENT_VALUE_PROCESSED,
} from "../data/mockDocuments";
import { formatCurrency } from "../utils/formatters";
import type { FinancialDocument } from "../types";

type StatusFilter = FinancialDocument["status"];
type TypeFilter = FinancialDocument["type"];

type UploadResult = {
  filename: string;
  docType: string;
  anomalyScore: number;
  status: string;
  signals: string[];
  size: number;
  processed: boolean;
};

export function DocumentScanner() {
  const { logDecision } = useNexus();
  const [statusFilter, setStatusFilter] = useState<Set<StatusFilter>>(
    new Set<StatusFilter>(["normal", "review", "alert", "critical"]),
  );
  const [typeFilter, setTypeFilter] = useState<Set<TypeFilter>>(
    new Set<TypeFilter>(["invoice", "bill_of_lading", "customs_declaration", "purchase_order"]),
  );
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [carrierRegistered, setCarrierRegistered] = useState(false);
  const [registering, setRegistering] = useState(false);

  const handleRegisterCarrier = async () => {
    if (!uploadResult) return;
    setRegistering(true);
    try {
      const name = uploadResult.filename.replace(/\.[^.]+$/, "").replace(/[_-]/g, " ");
      const baseRate = 35000 + Math.round(uploadResult.anomalyScore * 25000);
      const speedScore = Math.min(0.95, 0.5 + (1 - uploadResult.anomalyScore) * 0.4);
      const reliabilityScore = Math.min(0.95, 0.6 + (1 - uploadResult.anomalyScore) * 0.3);
      const colors = ["#14b8a6", "#a855f7", "#f43f5e", "#06b6d4", "#84cc16", "#f97316"];
      const color = colors[Math.floor(Math.random() * colors.length)];
      const risk = uploadResult.anomalyScore > 0.5 ? "Aggressive" : uploadResult.anomalyScore > 0.25 ? "Balanced" : "Conservative";
      const cost = baseRate > 50000 ? "High" : baseRate > 40000 ? "Medium" : "Low";
      await fetch("/api/market/carriers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name || "New Carrier",
          base_rate: baseRate,
          speed_score: +speedScore.toFixed(2),
          reliability_score: +reliabilityScore.toFixed(2),
          risk_tolerance: risk,
          speed: speedScore > 0.8 ? "High" : speedScore > 0.6 ? "Medium" : "Low",
          cost_profile: cost,
          strategy: "Document-derived",
          color,
        }),
      });
      setCarrierRegistered(true);
      logDecision("register_carrier", name, { baseRate, speedScore, reliabilityScore });
    } catch {
    } finally {
      setRegistering(false);
    }
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    setUploadResult(null);
    setUploadError(null);
    setCarrierRegistered(false);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/documents/upload", { method: "POST", body: form });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const data: UploadResult = await res.json();
      setUploadResult(data);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  };

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

  const statusColor = (s: string) =>
    s === "critical" ? "text-accent-red" : s === "alert" ? "text-accent-amber" : s === "review" ? "text-accent-blue" : "text-accent-green";

  return (
    <PageWrapper>

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
          subtitle="Upload any trade document · Anomaly scoring via GraphSAGE pipeline"
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".pdf,.csv,.txt,.json,.xml,.doc,.docx"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); }}
          />
          <div
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onClick={() => fileInputRef.current?.click()}
            className={`rounded-lg border-2 border-dashed p-6 text-center cursor-pointer transition-colors ${
              dragOver ? "border-accent-teal bg-accent-teal/5" : "border-border hover:border-accent-teal"
            }`}
          >
            {uploading ? (
              <div className="flex flex-col items-center gap-2">
                <Loader className="mx-auto text-accent-teal animate-spin" size={28} />
                <div className="text-sm text-text-secondary">Processing document…</div>
              </div>
            ) : (
              <>
                <Upload className="mx-auto text-text-dim" size={28} />
                <div className="mt-3 text-sm text-text-secondary">
                  Drop a document here or <span className="text-accent-teal">click to browse</span>
                </div>
                <div className="mt-1 text-[11px] text-text-dim">PDF, CSV, TXT, JSON, XML, DOC</div>
              </>
            )}
          </div>

          {/* Upload result */}
          {uploadResult && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 rounded-lg border border-border bg-bg-elevated p-4"
            >
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle size={14} className="text-accent-teal" />
                <span className="text-sm text-text-primary font-medium">{uploadResult.filename}</span>
                <span className={`ml-auto text-[10px] uppercase tracking-wider font-bold ${statusColor(uploadResult.status)}`}>
                  {uploadResult.status}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] mb-3">
                <span className="text-text-secondary">Doc Type</span>
                <span className="text-text-primary">{uploadResult.docType}</span>
                <span className="text-text-secondary">File Size</span>
                <span className="text-text-primary font-mono">{(uploadResult.size / 1024).toFixed(1)} KB</span>
              </div>
              <div className="mb-2">
                <div className="flex justify-between text-[10px] text-text-secondary mb-1">
                  <span>Anomaly Score</span>
                  <span className="font-mono">{uploadResult.anomalyScore.toFixed(3)}</span>
                </div>
                <SeverityBar value={uploadResult.anomalyScore} height={5} labelDecimals={3} />
              </div>
              <div className="space-y-1 mt-3">
                {uploadResult.signals.map((s, i) => (
                  <div key={i} className="flex items-start gap-1.5 text-[11px] text-text-secondary">
                    <span className={uploadResult.status === "normal" ? "text-accent-teal" : "text-accent-amber"}>⚠</span>
                    <span>{s}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-3 border-t border-border">
                {carrierRegistered ? (
                  <div className="inline-flex items-center gap-2 text-[11px] text-accent-teal font-semibold">
                    <CheckCircle size={14} /> Carrier registered — now active in Route Market
                  </div>
                ) : (
                  <button
                    onClick={handleRegisterCarrier}
                    disabled={registering}
                    className="inline-flex items-center gap-2 bg-accent-teal/10 border border-accent-teal/30 text-accent-teal rounded-lg px-3 py-1.5 text-xs font-semibold hover:bg-accent-teal/20 disabled:opacity-50 transition"
                  >
                    {registering ? (
                      <><Loader size={12} className="animate-spin" /> Registering…</>
                    ) : (
                      <><Ship size={12} /> Register as Carrier Agent</>
                    )}
                  </button>
                )}
              </div>
            </motion.div>
          )}

          {uploadError && (
            <div className="mt-3 rounded-lg border border-accent-red/30 bg-accent-red/5 px-3 py-2 text-[11px] text-accent-red">
              {uploadError}
            </div>
          )}
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
                    <button
                      onClick={() => logDecision("investigate", d.id, { supplier: d.supplier, deviation: d.deviationPct, status: d.status })}
                      className="text-[11px] text-accent-blue hover:underline"
                    >
                      🔍 Investigate
                    </button>
                    <button
                      onClick={() => logDecision("false_positive", d.id, { originalStatus: d.status })}
                      className="text-[11px] text-accent-amber hover:underline"
                    >
                      ⚠️ False Positive
                    </button>
                    <button
                      onClick={() => logDecision("compliance", d.id, { supplier: d.supplier, amount: d.value, signals: d.signals })}
                      className="text-[11px] text-accent-purple hover:underline"
                    >
                      📋 Compliance
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

    </PageWrapper>
  );
}