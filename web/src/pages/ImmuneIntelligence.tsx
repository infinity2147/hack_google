import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Tooltip,
} from "recharts";
import { Shield, ShieldCheck, Zap, RefreshCw, Sparkles, Check } from "lucide-react";
import { PageWrapper } from "../components/layout/PageWrapper";
import { Card } from "../components/shared/Card";
import { StatusBadge } from "../components/shared/StatusBadge";
import { SeverityBar } from "../components/shared/SeverityBar";
import { AIExplanationPanel } from "../components/shared/AIExplanationPanel";
import { useNexus } from "../store/nexusStore";
import { SIGNAL_DIMENSIONS } from "../data/mockAntibodies";
import { cosineSimilarity } from "../utils/cosineSimilarity";
import type { Antibody } from "../types";

function generateMemoryTimeline() {
  const out: { day: number; sim: number; fired: boolean; date: string; code: string }[] = [];
  const codes = [
    "PORT_CONGESTION_INDIA_WEST_001",
    "CYCLONE_BAY_OF_BENGAL_001",
    "GEOPOLITICAL_RED_SEA_001",
    "CUSTOMS_DELAY_INDIA_001",
    "PORT_STRIKE_INDIA_WEST_001",
  ];
  let s = 23;
  const r = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  for (let d = 30; d >= 0; d--) {
    const sim = 0.5 + r() * 0.5;
    const fired = sim >= 0.82;
    const dt = new Date();
    dt.setDate(dt.getDate() - d);
    out.push({
      day: 30 - d,
      sim: +sim.toFixed(2),
      fired,
      date: dt.toISOString().slice(0, 10),
      code: codes[Math.floor(r() * codes.length)],
    });
  }
  return out;
}

const MEMORY_TIMELINE = generateMemoryTimeline();

export function ImmuneIntelligence() {
  const {
    sensorEmbedding,
    antibodies,
    immuneThreshold,
    lastScan,
    scanImmune,
    randomizeSensors,
    setSensorDimension,
  } = useNexus();
  const [selectedAb, setSelectedAb] = useState<string>(antibodies[0].id);
  const [scanning, setScanning] = useState(false);

  const selected = antibodies.find((a) => a.id === selectedAb)!;
  const similarityToSelected = cosineSimilarity(sensorEmbedding, selected.pattern);

  const radarData = useMemo(
    () =>
      SIGNAL_DIMENSIONS.map((dim, i) => ({
        dim: dim.replace(" Anomaly", "").replace(" Signal", "").replace(" Severity", ""),
        sensor: sensorEmbedding[i],
        antibody: selected.pattern[i],
      })),
    [sensorEmbedding, selected],
  );

  const handleScan = async () => {
    setScanning(true);
    randomizeSensors();
    await new Promise((r) => setTimeout(r, 700));
    scanImmune();
    setScanning(false);
  };

  const responseFired = lastScan?.fired ?? false;
  const matchedAb = lastScan
    ? antibodies.find((a) => a.id === lastScan.bestMatchId)
    : null;

  return (
    <PageWrapper>
      {/* Hero header */}
      <div className="relative rounded-xl border border-border bg-bg-surface overflow-hidden p-5">
        <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />
        {scanning && (
          <div
            className="absolute inset-x-0 h-px bg-accent-teal pointer-events-none"
            style={{ animation: "scan-sweep 1.5s linear" }}
          />
        )}
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Shield className="text-accent-purple" size={20} />
              <h2 className="text-display text-xl tracking-tight">
                Immune Intelligence
              </h2>
              <StatusBadge status="scanning" />
            </div>
            <p className="text-sm text-text-secondary max-w-2xl leading-relaxed">
              Antibody memory matches live sensor embeddings against historical
              disruption patterns. When cosine similarity crosses{" "}
              <span className="font-mono text-accent-purple">τ = {immuneThreshold}</span>{" "}
              the immune response fires{" "}
              <span className="text-accent-teal">before</span> the disruption is
              physically observable.
            </p>
            <p className="mt-2 text-xs text-text-dim italic">
              "The supply chain that remembers its diseases."
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleScan}
              disabled={scanning}
              className="inline-flex items-center gap-2 bg-accent-teal text-bg-base font-semibold rounded-lg px-3 py-2 text-xs hover:brightness-110 disabled:opacity-50 transition"
            >
              <Zap size={14} /> {scanning ? "Scanning…" : "Rescan Sensors"}
            </button>
            <button
              onClick={() => scanImmune()}
              className="inline-flex items-center gap-2 border border-border rounded-lg px-3 py-2 text-xs text-text-secondary hover:border-accent-teal hover:text-accent-teal transition"
            >
              <RefreshCw size={12} /> Match Now
            </button>
          </div>
        </div>
      </div>

      {/* Sensor embedding + status */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mt-4">
        <Card
          className="xl:col-span-2"
          title="Live Sensor Embedding"
          subtitle="sₜ ∈ ℝ⁸ · 15-min refresh · drag bars to mock readings"
          right={<StatusBadge status="live" />}
        >
          <div className="space-y-2">
            {SIGNAL_DIMENSIONS.map((dim, i) => (
              <div key={dim} className="flex items-center gap-3">
                <div className="w-36 text-[11px] text-text-secondary">{dim}</div>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={sensorEmbedding[i]}
                  onChange={(e) =>
                    setSensorDimension(i, parseFloat(e.target.value))
                  }
                  className="flex-1"
                />
                <div className="w-32">
                  <SeverityBar value={sensorEmbedding[i]} height={5} labelDecimals={2} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card
          title="Immune Response"
          subtitle={lastScan ? "Most recent scan result" : "Run a scan to see results"}
        >
          <AnimatePresence mode="wait">
            {!lastScan && (
              <motion.div
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="py-10 text-center text-text-dim text-xs"
              >
                <ShieldCheck className="mx-auto text-accent-purple mb-2" size={28} />
                Awaiting first scan…
              </motion.div>
            )}
            {lastScan && !responseFired && (
              <motion.div
                key="clear"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-3"
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck className="text-accent-green" size={20} />
                  <span className="text-display text-lg text-accent-green">
                    IMMUNE CLEAR
                  </span>
                </div>
                <p className="text-xs text-text-secondary leading-relaxed">
                  No antibody crossed τ = {immuneThreshold}. Best match{" "}
                  <span className="text-text-primary font-mono">{matchedAb?.code}</span>{" "}
                  at similarity{" "}
                  <span className="text-accent-amber font-mono">
                    {lastScan.similarity}
                  </span>
                  . System: monitoring.
                </p>
              </motion.div>
            )}
            {lastScan && responseFired && (
              <motion.div
                key="fired"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-3"
              >
                <motion.div
                  initial={{ scale: 0.96 }}
                  animate={{ scale: [0.96, 1.04, 1] }}
                  transition={{ duration: 0.6, times: [0, 0.5, 1], repeat: 2 }}
                  className="rounded-lg border-2 border-accent-red/60 bg-accent-red/5 p-3"
                >
                  <div className="flex items-center gap-2">
                    <Zap className="text-accent-red" size={20} />
                    <span className="text-display text-lg text-accent-red glow-red">
                      IMMUNE RESPONSE FIRING
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-text-secondary">
                    Match:{" "}
                    <span className="text-text-primary font-mono">
                      {matchedAb?.code}
                    </span>
                    <br />
                    cos(sₜ, a) ={" "}
                    <span className="text-accent-red font-mono font-semibold">
                      {lastScan.similarity}
                    </span>{" "}
                    &gt; τ = {immuneThreshold} ✓
                  </div>
                </motion.div>
                <div className="space-y-2">
                  <div className="text-[11px] uppercase tracking-wider text-text-secondary">
                    Actions Triggered
                  </div>
                  {lastScan.recommendedActions.map((a, i) => (
                    <motion.div
                      key={a}
                      initial={{ x: -8, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.2 + i * 0.18 }}
                      className="flex items-start gap-2 text-xs"
                    >
                      <Check size={14} className="text-accent-green shrink-0 mt-0.5" />
                      <span className="text-text-primary">{a}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </div>

      {/* Cosine similarity radar */}
      <Card
        className="mt-4"
        title="Cosine Similarity Radar"
        subtitle={`Live sensor (teal) vs antibody pattern (amber dashed) · cos(sₜ, a) = ${similarityToSelected.toFixed(3)}`}
        right={
          <div className="flex items-center gap-2">
            <select
              value={selectedAb}
              onChange={(e) => setSelectedAb(e.target.value)}
              className="bg-bg-elevated border border-border rounded px-2 py-1 text-xs outline-none focus:border-accent-teal"
            >
              {antibodies.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.code}
                </option>
              ))}
            </select>
            <span
              className={`text-xs font-mono font-semibold px-2 py-1 rounded ring-1 ${
                similarityToSelected >= immuneThreshold
                  ? "text-accent-red bg-accent-red/10 ring-accent-red/30"
                  : "text-accent-amber bg-accent-amber/10 ring-accent-amber/30"
              }`}
            >
              {similarityToSelected.toFixed(3)}{" "}
              {similarityToSelected >= immuneThreshold ? "≥" : "<"} τ ={" "}
              {immuneThreshold}
            </span>
          </div>
        }
      >
        <div className="h-[360px] -mx-2">
          <ResponsiveContainer>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#1e2d42" />
              <PolarAngleAxis
                dataKey="dim"
                stroke="#8fa4c0"
                tick={{ fill: "#8fa4c0", fontSize: 11 }}
              />
              <PolarRadiusAxis
                domain={[0, 1]}
                stroke="#4a6278"
                tick={{ fill: "#4a6278", fontSize: 9 }}
                axisLine={false}
              />
              <Tooltip />
              <Radar
                name="Antibody pattern"
                dataKey="antibody"
                stroke="#f59e0b"
                fill="#f59e0b"
                fillOpacity={0.15}
                strokeDasharray="4 3"
                strokeWidth={1.5}
              />
              <Radar
                name="Live sensor"
                dataKey="sensor"
                stroke="#00d4aa"
                fill="#00d4aa"
                fillOpacity={0.3}
                strokeWidth={2}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Antibody library */}
      <div className="mt-4">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-text-primary">
              Antibody Library
            </h3>
            <p className="text-xs text-text-secondary">
              {antibodies.length} memorized disruption patterns · click to inspect
            </p>
          </div>
          <span className="text-[11px] text-text-dim font-mono">
            τ threshold = {immuneThreshold}
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          {antibodies.map((ab: Antibody) => {
            const sim = cosineSimilarity(sensorEmbedding, ab.pattern);
            const willFire = sim >= immuneThreshold;
            const isActive = ab.id === selectedAb;
            return (
              <motion.button
                key={ab.id}
                onClick={() => setSelectedAb(ab.id)}
                whileHover={{ y: -2 }}
                className={`text-left rounded-xl border p-3 transition-all bg-bg-surface ${
                  isActive
                    ? "border-accent-teal shadow-glow"
                    : willFire
                      ? "border-accent-red/60"
                      : "border-border hover:border-border-bright"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-text-secondary">
                      <Shield size={10} className="text-accent-purple" /> Antibody
                    </div>
                    <div className="font-mono text-[11px] text-text-primary mt-0.5 truncate">
                      {ab.code}
                    </div>
                  </div>
                  {willFire && <StatusBadge status="critical">FIRES</StatusBadge>}
                </div>
                <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
                  <span className="text-text-secondary">Type</span>
                  <span className="text-text-primary text-right truncate">{ab.type}</span>
                  <span className="text-text-secondary">Location</span>
                  <span className="text-text-primary text-right truncate">{ab.location}</span>
                </div>
                <div className="mt-2">
                  <div className="text-[10px] uppercase tracking-wider text-text-secondary mb-1">
                    Severity
                  </div>
                  <SeverityBar value={ab.severity} height={4} labelDecimals={2} />
                </div>
                <div className="mt-2">
                  <div className="text-[10px] uppercase tracking-wider text-text-secondary mb-1">
                    Live similarity
                  </div>
                  <div className="flex items-center gap-2">
                    <SeverityBar value={sim} height={4} showLabel={false} />
                    <span
                      className={`font-mono text-[11px] w-12 text-right ${
                        willFire ? "text-accent-red" : "text-accent-amber"
                      }`}
                    >
                      {sim.toFixed(2)}
                    </span>
                  </div>
                </div>
                <div className="mt-2 text-[10px] text-text-dim font-mono flex justify-between">
                  <span>Last fired {ab.lastTriggered}</span>
                  <span>conf {(ab.matchConfidence * 100).toFixed(0)}%</span>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Memory timeline */}
      <Card
        className="mt-4"
        title="Immune Memory Timeline"
        subtitle="Last 30 days · green = below threshold, red = response fired"
      >
        <div className="relative h-32 px-2">
          <div className="absolute inset-x-2 bottom-8 h-px bg-border" />
          <div className="absolute inset-x-2 bottom-8 flex justify-between items-end">
            {MEMORY_TIMELINE.map((m) => {
              const h = m.sim * 70;
              return (
                <div
                  key={m.day}
                  className="group relative flex flex-col items-center"
                  style={{ width: `${100 / MEMORY_TIMELINE.length}%` }}
                >
                  <div
                    className={`w-1.5 rounded-t ${
                      m.fired ? "bg-accent-red" : "bg-accent-green/60"
                    }`}
                    style={{ height: h }}
                  />
                  <div className="hidden group-hover:block absolute -top-12 left-1/2 -translate-x-1/2 bg-bg-elevated border border-border-bright rounded-lg px-2 py-1 text-[10px] whitespace-nowrap shadow-xl z-10">
                    <div className="text-text-primary">{m.date}</div>
                    <div className="font-mono text-text-secondary">
                      sim = {m.sim} {m.fired && <span className="text-accent-red">· fired</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="absolute inset-x-2 bottom-1 flex justify-between text-[9px] text-text-dim">
            <span>30d ago</span>
            <span>today</span>
          </div>
          <div
            className="absolute left-2 right-2 border-t border-dashed border-accent-purple/40"
            style={{ bottom: 8 + immuneThreshold * 70 }}
          >
            <span className="absolute right-0 -top-3 text-[9px] text-accent-purple font-mono">
              τ = {immuneThreshold}
            </span>
          </div>
        </div>
      </Card>

      {/* AI explanation */}
      <div className="mt-4">
        <AIExplanationPanel
          title="Immune Intelligence"
          confidence={lastScan ? Math.min(0.99, similarityToSelected) : 0.84}
          sources={`${antibodies.length} antibody patterns · 14-month immune memory`}
        >
          <p>
            Current sensor embedding shows elevated{" "}
            <span className="font-mono text-accent-amber">
              {SIGNAL_DIMENSIONS[
                sensorEmbedding.indexOf(Math.max(...sensorEmbedding))
              ]}
            </span>{" "}
            ({Math.max(...sensorEmbedding).toFixed(2)}) coupled with{" "}
            <span className="font-mono text-accent-amber">Port Congestion</span>{" "}
            ({sensorEmbedding[1].toFixed(2)}). Best antibody match is{" "}
            <span className="font-mono text-text-primary">{selected.code}</span>{" "}
            with cosine similarity{" "}
            <span className="font-mono text-accent-teal">
              {similarityToSelected.toFixed(3)}
            </span>
            .
          </p>
          <p>
            {similarityToSelected >= immuneThreshold
              ? `Pattern matches the τ = ${immuneThreshold} threshold. Pre-emptive recommendation: reroute 53% of JNPT-bound volume to Mundra (28%) and Chennai (25%) within the next 48-72 hours, ahead of physical observability of the disruption.`
              : `Pattern below τ = ${immuneThreshold}. No pre-emptive action required. Sensor delta will be re-evaluated in 15 minutes.`}
          </p>
          <div className="mt-2 flex items-center gap-2 text-[11px] text-text-dim">
            <Sparkles size={12} className="text-accent-purple" />
            Memory recall: vector index over 800+ historical disruption embeddings.
          </div>
        </AIExplanationPanel>
      </div>
    </PageWrapper>
  );
}
