import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
  ZAxis,
} from "recharts";
import {
  Users,
  Volume2,
  MessageCircle,
  MapPin,
  Trophy,
  Mic,
  Radio,
  Container,
  AlertTriangle,
  Cpu,
  Languages,
} from "lucide-react";
import { PageWrapper } from "../components/layout/PageWrapper";
import { Card } from "../components/shared/Card";
import { MetricCard } from "../components/shared/MetricCard";
import { StatusBadge } from "../components/shared/StatusBadge";
import { SeverityBar } from "../components/shared/SeverityBar";
import { AIExplanationPanel } from "../components/shared/AIExplanationPanel";
import {
  VOICE_NOTES,
  CROWD_STATS,
  TOP_CONTRIBUTORS,
  CATEGORY_BREAKDOWN,
} from "../data/mockCrowd";
import { ACOUSTIC_READINGS, ACOUSTIC_STATS } from "../data/mockAcoustic";
import { shortDateTime } from "../utils/formatters";
import type { VoiceNote } from "../types";

// India map projection (simple equirectangular)
const INDIA_BBOX = { latMin: 6, latMax: 37, lngMin: 68, lngMax: 98 };
const MAP_W = 600;
const MAP_H = 700;

function project(lat: number, lng: number): { x: number; y: number } {
  const x = ((lng - INDIA_BBOX.lngMin) / (INDIA_BBOX.lngMax - INDIA_BBOX.lngMin)) * MAP_W;
  const y = MAP_H - ((lat - INDIA_BBOX.latMin) / (INDIA_BBOX.latMax - INDIA_BBOX.latMin)) * MAP_H;
  return { x, y };
}

// Simplified India outline (stylized polygon)
const INDIA_OUTLINE =
  "M 175 60 L 220 50 L 270 80 L 310 90 L 340 130 L 370 165 L 405 220 L 440 260 L 460 320 L 480 380 L 470 440 L 440 510 L 400 580 L 350 640 L 300 670 L 250 660 L 220 610 L 200 555 L 175 510 L 145 470 L 120 420 L 100 360 L 95 290 L 110 230 L 130 170 L 150 110 Z";

const NETWORK_CURVE = Array.from({ length: 20 }, (_, i) => {
  const n = (i + 1) * 500;
  return { n, V: Math.pow(n, 1.5) / 1000 };
});

export function CrowdIntelligence() {
  const [tab, setTab] = useState<"crowd" | "acoustic">("crowd");
  const [categoryFilter, setCategoryFilter] = useState<VoiceNote["category"] | "all">("all");
  const [verifiedFilter, setVerifiedFilter] = useState<"all" | "verified" | "unverified">("all");
  const [selectedNote, setSelectedNote] = useState<string | null>(null);
  const [whatsappRunning, setWhatsappRunning] = useState<string | null>(null);
  const [whatsappStep, setWhatsappStep] = useState(0);

  const filteredNotes = useMemo(() => {
    return VOICE_NOTES.filter((v) => {
      if (categoryFilter !== "all" && v.category !== categoryFilter) return false;
      if (verifiedFilter === "verified" && !v.verified) return false;
      if (verifiedFilter === "unverified" && v.verified) return false;
      return true;
    });
  }, [categoryFilter, verifiedFilter]);

  const recentNotes = filteredNotes.slice(0, 15);

  const runWhatsappDemo = async (lang: string) => {
    setWhatsappRunning(lang);
    for (let i = 0; i <= 4; i++) {
      setWhatsappStep(i);
      await new Promise((r) => setTimeout(r, 700));
    }
    setTimeout(() => {
      setWhatsappRunning(null);
      setWhatsappStep(0);
    }, 2200);
  };

  return (
    <PageWrapper>
      {/* Tabs */}
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => setTab("crowd")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition ${
            tab === "crowd"
              ? "bg-accent-teal/10 text-accent-teal ring-1 ring-accent-teal/30"
              : "text-text-secondary hover:text-text-primary"
          }`}
        >
          <Users size={14} /> Crowd Reports
        </button>
        <button
          onClick={() => setTab("acoustic")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition ${
            tab === "acoustic"
              ? "bg-accent-purple/10 text-accent-purple ring-1 ring-accent-purple/30"
              : "text-text-secondary hover:text-text-primary"
          }`}
        >
          <Volume2 size={14} /> Acoustic Monitoring
        </button>
      </div>

      {tab === "crowd" && (
        <>
          {/* Header */}
          <div className="rounded-xl border border-border bg-bg-surface p-5">
            <div className="flex items-start gap-3">
              <Users className="text-accent-teal shrink-0 mt-1" size={22} />
              <div>
                <h2 className="text-display text-xl tracking-tight">
                  Crowd Intelligence — Waze for Supply Chains
                </h2>
                <p className="text-sm text-text-secondary mt-1 max-w-3xl leading-relaxed">
                  14M+ Indian truck drivers · 8 languages · WhatsApp Business API · zero-friction.
                </p>
                <p className="mt-2 text-xs text-text-dim italic">
                  "A driver reporting a jam at 8:04am is more current than satellite imagery
                  processed at 8:15am."
                </p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 mt-4">
            <MetricCard label="Total Reports" value={CROWD_STATS.totalReports} color="teal" icon={<MessageCircle size={16} />} />
            <MetricCard label="Verified" value={CROWD_STATS.verifiedReports} color="green" />
            <MetricCard label="Verification Rate" value={CROWD_STATS.verificationRate * 100} unit="%" decimals={1} color="blue" />
            <MetricCard label="Active Contributors" value={CROWD_STATS.activeContributors} color="purple" />
            <MetricCard label="Avg Credibility" value={CROWD_STATS.avgCredibility} decimals={2} color="teal" />
            <MetricCard label="Network Value" value={CROWD_STATS.networkValue} color="amber" subtitle="∝ n^1.5" />
          </div>

          {/* Map */}
          <Card
            className="mt-4"
            title="India Crowd Report Map"
            subtitle={`${filteredNotes.length} live reports across major logistics corridors`}
            right={
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value as typeof categoryFilter)}
                  className="bg-bg-elevated border border-border rounded px-2 py-1 text-xs outline-none focus:border-accent-teal"
                >
                  <option value="all">All categories</option>
                  <option value="congestion">Congestion</option>
                  <option value="weather">Weather</option>
                  <option value="accident">Accident</option>
                  <option value="customs_delay">Customs Delay</option>
                  <option value="strike">Strike</option>
                </select>
                <select
                  value={verifiedFilter}
                  onChange={(e) => setVerifiedFilter(e.target.value as typeof verifiedFilter)}
                  className="bg-bg-elevated border border-border rounded px-2 py-1 text-xs outline-none focus:border-accent-teal"
                >
                  <option value="all">All</option>
                  <option value="verified">Verified only</option>
                  <option value="unverified">Unverified only</option>
                </select>
              </div>
            }
          >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 relative">
                <svg
                  viewBox={`0 0 ${MAP_W} ${MAP_H}`}
                  className="w-full max-h-[600px]"
                  preserveAspectRatio="xMidYMid meet"
                >
                  <defs>
                    <linearGradient id="map-grad" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#162035" />
                      <stop offset="100%" stopColor="#0d1521" />
                    </linearGradient>
                  </defs>
                  <path
                    d={INDIA_OUTLINE}
                    fill="url(#map-grad)"
                    stroke="#2a3f5e"
                    strokeWidth={1.5}
                  />
                  {/* lat/lng grid (subtle) */}
                  {[10, 20, 30].map((lat) => {
                    const { y } = project(lat, INDIA_BBOX.lngMin);
                    return (
                      <line
                        key={lat}
                        x1={0}
                        x2={MAP_W}
                        y1={y}
                        y2={y}
                        stroke="#1e2d42"
                        strokeWidth={0.5}
                        strokeDasharray="2 5"
                      />
                    );
                  })}

                  {/* dots */}
                  {filteredNotes.map((v) => {
                    const { x, y } = project(v.lat, v.lng);
                    const r = 3 + v.severity * 6;
                    const color =
                      v.severity > 0.75
                        ? "#ef4444"
                        : v.severity > 0.5
                          ? "#f59e0b"
                          : v.verified
                            ? "#00d4aa"
                            : "#4a6278";
                    const isSelected = selectedNote === v.id;
                    return (
                      <g
                        key={v.id}
                        transform={`translate(${x},${y})`}
                        style={{ cursor: "pointer" }}
                        onClick={() =>
                          setSelectedNote((c) => (c === v.id ? null : v.id))
                        }
                      >
                        {(isSelected || v.severity > 0.7) && (
                          <circle
                            r={r + 5}
                            fill="none"
                            stroke={color}
                            strokeOpacity={0.5}
                            style={{
                              animation:
                                "ping-ring 1.6s cubic-bezier(0,0,0.2,1) infinite",
                            }}
                          />
                        )}
                        <circle r={r} fill={color} fillOpacity={0.85} />
                        {isSelected && (
                          <circle r={r + 2} fill="none" stroke="#e2eaf6" strokeWidth={1.5} />
                        )}
                      </g>
                    );
                  })}
                </svg>

                <div className="absolute bottom-2 left-2 flex items-center gap-3 rounded-lg border border-border bg-bg-surface/80 backdrop-blur px-3 py-1.5 text-[11px]">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-accent-teal" /> Verified
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-text-dim" /> Pending
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-accent-amber" /> Severity {">"}0.5
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-accent-red" /> Critical
                  </span>
                </div>
              </div>

              <div className="lg:col-span-1">
                <div className="text-[10px] uppercase tracking-wider text-text-secondary mb-2">
                  Latest Voice Notes
                </div>
                <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                  {recentNotes.map((v) => {
                    const isSelected = selectedNote === v.id;
                    return (
                      <button
                        key={v.id}
                        onClick={() =>
                          setSelectedNote((c) => (c === v.id ? null : v.id))
                        }
                        className={`w-full text-left rounded-lg border p-2 transition ${
                          isSelected
                            ? "border-accent-teal bg-accent-teal/5"
                            : "border-border hover:border-border-bright bg-bg-elevated"
                        }`}
                      >
                        <div className="flex items-center gap-2 text-[10px]">
                          <StatusBadge status={v.verified ? "verified" : "pending"} />
                          <span className="text-text-dim">{shortDateTime(v.timestamp)}</span>
                        </div>
                        <div className="mt-1 text-xs text-text-primary flex items-center gap-1">
                          <MapPin size={10} className="text-accent-teal shrink-0" />
                          {v.locationName}
                        </div>
                        <div className="text-[10px] text-text-secondary mt-0.5">
                          <span className="capitalize">{v.category.replace("_", " ")}</span>{" "}
                          · {v.language} · {v.durationSec}s · cred {v.credibilityScore.toFixed(2)}
                        </div>
                        <div className="mt-1.5">
                          <SeverityBar value={v.severity} height={3} labelDecimals={2} />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </Card>

          {/* WhatsApp + Network value */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mt-4">
            <Card
              title="WhatsApp Bot Demo"
              subtitle="Voice → Gemini transcription → geocoding → credibility → verification"
              right={<StatusBadge status="immune">PRIVACY-PRESERVING</StatusBadge>}
            >
              <ol className="space-y-1.5 text-[11px] text-text-secondary leading-relaxed list-decimal list-inside mb-3">
                <li>Driver sends 10s voice note via WhatsApp Business API</li>
                <li>Gemini transcribes &amp; classifies into category</li>
                <li>GPS or landmark geocoded via Google Maps Platform</li>
                <li>Bayesian credibility from contributor history</li>
                <li>3 reports within 5km/30min → auto-verified disruption</li>
              </ol>

              <div className="grid grid-cols-3 gap-2">
                {["Hindi", "Tamil", "Bengali"].map((lang) => (
                  <button
                    key={lang}
                    onClick={() => runWhatsappDemo(lang)}
                    disabled={whatsappRunning !== null}
                    className="border border-border rounded-lg px-2 py-2 text-[11px] text-text-secondary hover:border-accent-teal hover:text-accent-teal transition flex items-center gap-1 justify-center disabled:opacity-50"
                  >
                    <Mic size={12} /> {lang}
                  </button>
                ))}
              </div>

              {/* WhatsApp UI */}
              <div className="mt-3 rounded-lg border border-border bg-[#0c1c14] p-3 min-h-[180px] space-y-2">
                {!whatsappRunning ? (
                  <div className="text-[11px] text-text-dim text-center py-8">
                    Pick a language above to simulate a driver report.
                  </div>
                ) : (
                  <AnimatePresence>
                    <motion.div
                      key="msg-1"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2 self-end ml-auto max-w-[80%] bg-[#005c4b] text-white rounded-xl rounded-tr-sm px-3 py-2 text-[11px]"
                    >
                      <Mic size={12} />
                      <span className="flex-1">
                        Voice note · 10s ·{" "}
                        <span className="opacity-80">{whatsappRunning}</span>
                      </span>
                      <span className="opacity-60 text-[9px]">▶ ▌▌▌▌▌▌</span>
                    </motion.div>
                    {whatsappStep >= 1 && (
                      <motion.div
                        key="msg-2"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-[#1f2c33] text-text-primary rounded-xl rounded-tl-sm px-3 py-2 text-[11px] max-w-[80%]"
                      >
                        🔍 Gemini: <span className="text-accent-teal">Congestion</span> near
                        Nashik highway junction. Severity: medium.
                      </motion.div>
                    )}
                    {whatsappStep >= 2 && (
                      <motion.div
                        key="msg-3"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-[#1f2c33] text-text-primary rounded-xl rounded-tl-sm px-3 py-2 text-[11px] max-w-[80%]"
                      >
                        📍 Location confirmed: 20.003°N, 73.791°E
                      </motion.div>
                    )}
                    {whatsappStep >= 3 && (
                      <motion.div
                        key="msg-4"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-[#1f2c33] text-text-primary rounded-xl rounded-tl-sm px-3 py-2 text-[11px] max-w-[80%]"
                      >
                        ✅ Report logged. Credibility:{" "}
                        <span className="text-accent-teal">0.81</span>. 2 nearby reports
                        pending verification.
                      </motion.div>
                    )}
                  </AnimatePresence>
                )}
              </div>
              <div className="mt-3 flex items-center gap-2 text-[10px] text-text-dim">
                <Languages size={12} />
                Supported: Hindi · Tamil · Bengali · Marathi · Telugu · Gujarati · Punjabi · Odia
              </div>
            </Card>

            <div className="space-y-4">
              <Card
                title="Network Effect · V(n) ∝ n^1.5"
                subtitle="Each contributor adds AND validates signals — superlinear growth"
              >
                <div className="h-[200px] -mx-2">
                  <ResponsiveContainer>
                    <LineChart data={NETWORK_CURVE}>
                      <defs>
                        <linearGradient id="nv" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#00d4aa" stopOpacity={0.1} />
                          <stop offset="100%" stopColor="#00d4aa" stopOpacity={0.7} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="#1e2d42" strokeDasharray="3 3" vertical={false} />
                      <XAxis
                        dataKey="n"
                        stroke="#4a6278"
                        fontSize={10}
                        tickFormatter={(v) => `${(v / 1000).toFixed(1)}k`}
                      />
                      <YAxis stroke="#4a6278" fontSize={10} />
                      <Tooltip />
                      <ReferenceLine
                        x={1000}
                        stroke="#8b5cf6"
                        strokeDasharray="3 3"
                        label={{
                          value: "you are here · 847 contributors",
                          fill: "#8b5cf6",
                          fontSize: 9,
                          position: "insideTopLeft",
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="V"
                        stroke="url(#nv)"
                        strokeWidth={3}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="text-[11px] text-text-secondary mt-2">
                  Metcalfe-like superlinear value. Cross 1k contributors and the curve
                  bends sharply upward — network becomes self-reinforcing.
                </div>
              </Card>

              <Card title="Category Distribution" subtitle="Last 30 days · all reports">
                <div className="h-[200px] -mx-2">
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={CATEGORY_BREAKDOWN}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={2}
                      >
                        {CATEGORY_BREAKDOWN.map((c) => (
                          <Cell key={c.name} fill={c.color} stroke="#0d1521" strokeWidth={2} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-3 gap-1 text-[10px]">
                  {CATEGORY_BREAKDOWN.map((c) => (
                    <div key={c.name} className="flex items-center gap-1.5">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ background: c.color }}
                      />
                      <span className="text-text-secondary">
                        {c.name} · {c.value}%
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>

          {/* Leaderboard */}
          <Card
            className="mt-4"
            title="Top Contributors"
            subtitle="Drivers and warehouse leads ranked by impact"
            right={<Trophy className="text-accent-amber" size={16} />}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-[10px] uppercase tracking-wider text-text-secondary border-b border-border">
                    <th className="px-3 py-2 text-left">Rank</th>
                    <th className="px-3 py-2 text-left">ID</th>
                    <th className="px-3 py-2 text-left">Role</th>
                    <th className="px-3 py-2 text-left">State</th>
                    <th className="px-3 py-2 text-right">Reports</th>
                    <th className="px-3 py-2 text-right">Verified</th>
                    <th className="px-3 py-2 text-right">Credibility</th>
                    <th className="px-3 py-2 text-right">Impact</th>
                  </tr>
                </thead>
                <tbody>
                  {TOP_CONTRIBUTORS.map((c, i) => {
                    const rankBorder =
                      i === 0
                        ? "border-l-2 border-l-amber-400"
                        : i === 1
                          ? "border-l-2 border-l-zinc-300"
                          : i === 2
                            ? "border-l-2 border-l-orange-400"
                            : "";
                    const medal =
                      i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}`;
                    return (
                      <tr
                        key={c.id}
                        className={`border-b border-border hover:bg-bg-hover ${rankBorder}`}
                      >
                        <td className="px-3 py-2 font-mono">{medal}</td>
                        <td className="px-3 py-2 font-mono text-text-primary">{c.id}</td>
                        <td className="px-3 py-2 text-text-secondary">{c.role}</td>
                        <td className="px-3 py-2 text-text-secondary">{c.state}</td>
                        <td className="px-3 py-2 text-right font-mono">{c.reports}</td>
                        <td className="px-3 py-2 text-right font-mono text-accent-green">
                          {c.verified}
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-accent-teal">
                          {c.credibility.toFixed(2)}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <SeverityBar value={c.impact} height={4} showLabel={false} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {tab === "acoustic" && (
        <>
          {/* Header */}
          <div className="rounded-xl border border-border bg-bg-surface p-5">
            <div className="flex items-start gap-3">
              <Volume2 className="text-accent-purple shrink-0 mt-1" size={22} />
              <div>
                <h2 className="text-display text-xl tracking-tight">
                  Acoustic Anomaly Detection
                </h2>
                <p className="text-sm text-text-secondary mt-1 max-w-3xl leading-relaxed">
                  MEMS microphones · MobileNet-V3 · TFLite on ARM Cortex-M33. Detects
                  container anomalies <span className="text-accent-teal">4–8 hours</span>{" "}
                  before temperature sensors trip.
                </p>
                <p className="mt-2 text-xs text-text-dim font-mono">
                  BOM &lt;$2/container · inference every 60s · &lt;50 bytes via NB-IoT
                </p>
              </div>
            </div>
          </div>

          {/* Acoustic stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
            <MetricCard label="Monitored" value={ACOUSTIC_STATS.monitored} color="blue" icon={<Container size={16} />} />
            <MetricCard label="Normal" value={ACOUSTIC_STATS.normal} color="green" />
            <MetricCard label="Anomalous" value={ACOUSTIC_STATS.anomalous} color="amber" />
            <MetricCard label="Critical" value={ACOUSTIC_STATS.critical} color="red" glow icon={<AlertTriangle size={16} />} />
          </div>

          {/* Feature space */}
          <Card
            className="mt-4"
            title="Acoustic Feature Space"
            subtitle="Mel-band PCA · normal cluster vs one-class SVM anomalies"
          >
            <div className="h-[380px] -mx-2 relative">
              <ResponsiveContainer>
                <ScatterChart>
                  <CartesianGrid stroke="#1e2d42" strokeDasharray="3 3" />
                  <XAxis
                    type="number"
                    dataKey="feature1"
                    name="Mel feature 1"
                    domain={[-3, 3]}
                    stroke="#4a6278"
                    fontSize={10}
                  />
                  <YAxis
                    type="number"
                    dataKey="feature2"
                    name="Mel feature 2"
                    domain={[-3, 3]}
                    stroke="#4a6278"
                    fontSize={10}
                  />
                  <ZAxis range={[40, 200]} dataKey="anomalyScore" />
                  <Tooltip
                    cursor={{ stroke: "#2a3f5e", strokeDasharray: "3 3" }}
                    content={(props) => {
                      const p = props.payload?.[0]?.payload as
                        | (typeof ACOUSTIC_READINGS)[number]
                        | undefined;
                      if (!p) return null;
                      return (
                        <div className="rounded-lg border border-border-bright bg-bg-elevated px-3 py-2 text-xs">
                          <div className="text-text-primary font-semibold">
                            {p.containerId}
                          </div>
                          <div className="text-text-secondary">{p.route}</div>
                          <div className="text-text-secondary capitalize">
                            {p.anomalyType.replace("_", " ")}
                          </div>
                          <div className="text-accent-amber font-mono">
                            score {p.anomalyScore.toFixed(2)}
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Scatter
                    name="Normal"
                    data={ACOUSTIC_READINGS.filter((r) => r.alertStatus === "normal")}
                    fill="#22c55e"
                    fillOpacity={0.5}
                  />
                  <Scatter
                    name="Warning"
                    data={ACOUSTIC_READINGS.filter((r) => r.alertStatus === "warning")}
                    fill="#f59e0b"
                    fillOpacity={0.85}
                  />
                  <Scatter
                    name="Critical"
                    data={ACOUSTIC_READINGS.filter((r) => r.alertStatus === "critical")}
                    fill="#ef4444"
                    fillOpacity={0.95}
                  />
                </ScatterChart>
              </ResponsiveContainer>

              {/* Decision boundary overlay (visual only) */}
              <svg
                className="absolute inset-0 pointer-events-none"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
              >
                <ellipse
                  cx={50}
                  cy={50}
                  rx={28}
                  ry={28}
                  fill="none"
                  stroke="#8b5cf6"
                  strokeOpacity={0.4}
                  strokeDasharray="2 2"
                  strokeWidth={0.4}
                />
              </svg>
            </div>
            <div className="mt-2 text-[11px] text-text-dim">
              Dashed ellipse = one-class SVM decision boundary. Points outside the
              cluster are flagged for inspection.
            </div>
          </Card>

          {/* Container cards */}
          <div className="mt-4">
            <div className="text-[10px] uppercase tracking-wider text-text-secondary mb-2">
              Anomalous Containers · most recent
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {ACOUSTIC_READINGS.filter((r) => r.alertStatus !== "normal")
                .slice(0, 8)
                .map((r) => (
                  <div
                    key={r.id}
                    className="rounded-xl border border-border bg-bg-surface p-3 hover:border-border-bright transition"
                  >
                    <div className="flex items-center gap-2">
                      <Container className="text-accent-blue" size={14} />
                      <span className="text-xs font-mono text-text-primary">
                        {r.containerId}
                      </span>
                      <StatusBadge
                        status={r.alertStatus === "critical" ? "critical" : "alert"}
                      />
                    </div>
                    <div className="mt-1 text-[11px] text-text-secondary">{r.route}</div>
                    <div className="mt-2 text-[10px] uppercase tracking-wider text-text-secondary">
                      Anomaly · <span className="capitalize">{r.anomalyType.replace("_", " ")}</span>
                    </div>
                    <div className="mt-1.5">
                      <SeverityBar value={r.anomalyScore} height={4} labelDecimals={2} />
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[10px] text-text-dim font-mono">
                      <span>lead time ~{r.leadTimeHours}h</span>
                      <span>{shortDateTime(r.detectedAt)}</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Architecture */}
          <Card
            className="mt-4"
            title="Detection Pipeline"
            subtitle="MEMS mic → log-mel → MobileNet-V3 → one-class SVM → NB-IoT alert"
            right={<Cpu className="text-accent-teal" size={16} />}
          >
            <div className="grid grid-cols-1 md:grid-cols-7 gap-2 text-center">
              {[
                { label: "Container Wall", icon: <Container size={16} />, sub: "passive listening" },
                { label: "MEMS Microphone", icon: <Radio size={16} />, sub: "<$2 BOM" },
                { label: "Log-Mel Spectrogram", icon: <Volume2 size={16} />, sub: "128 mel bins · 25ms" },
                { label: "MobileNet-V3 CNN", icon: <Cpu size={16} />, sub: "Audio · AudioSet" },
                { label: "One-Class SVM", icon: <Cpu size={16} />, sub: "trained on normal" },
                { label: "NB-IoT Uplink", icon: <Radio size={16} />, sub: "<50 bytes / event" },
                { label: "NEXUS Alert", icon: <AlertTriangle size={16} />, sub: "ops dashboard" },
              ].map((s, i, arr) => (
                <div key={s.label} className="relative">
                  <div className="rounded-lg border border-border bg-bg-elevated p-3 h-full flex flex-col items-center gap-1">
                    <div className="text-accent-teal">{s.icon}</div>
                    <div className="text-[11px] text-text-primary">{s.label}</div>
                    <div className="text-[9px] text-text-dim">{s.sub}</div>
                  </div>
                  {i < arr.length - 1 && (
                    <div className="hidden md:block absolute top-1/2 -right-1 text-text-dim">
                      →
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </>
      )}

      {/* AI explanation */}
      <div className="mt-4">
        <AIExplanationPanel
          title={tab === "crowd" ? "Crowd Intelligence" : "Acoustic Intelligence"}
          confidence={tab === "crowd" ? 0.88 : 0.91}
          sources={
            tab === "crowd"
              ? "247 voice notes · 8 languages · Bayesian credibility"
              : "82 MEMS-monitored containers · MobileNet-V3 + one-class SVM"
          }
        >
          {tab === "crowd" ? (
            <p>
              Cross-referencing recent reports from Maharashtra (Nashik, JNPT) and Gujarat
              (Surat) with current sensor embeddings: a localized congestion signal is
              forming. Confidence is bolstered by 3 reports within 5km/30min — auto-verified
              under the Bayesian credibility model. Recommend pre-emptively warning
              eastbound truckers via the same WhatsApp channel they reported on.
            </p>
          ) : (
            <p>
              Container CTR-0047 on the JNPT → Singapore lane shows a refrigeration
              anomaly with score 0.83 and lead time ~6h ahead of the temperature sensor
              tripping. The acoustic signature is consistent with 11 prior compressor
              degradation events. Recommend dispatching the container to the next
              port for inspection rather than risking spoilage.
            </p>
          )}
        </AIExplanationPanel>
      </div>
    </PageWrapper>
  );
}
