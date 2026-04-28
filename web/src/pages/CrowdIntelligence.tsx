import { useMemo, useState } from "react";
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
} from "recharts";
import {
  Users,
  MessageCircle,
  MapPin,
  Trophy,
} from "lucide-react";
import { PageWrapper } from "../components/layout/PageWrapper";
import { Card } from "../components/shared/Card";
import { MetricCard } from "../components/shared/MetricCard";
import { StatusBadge } from "../components/shared/StatusBadge";
import { SeverityBar } from "../components/shared/SeverityBar";
import {
  VOICE_NOTES,
  CROWD_STATS,
  TOP_CONTRIBUTORS,
  CATEGORY_BREAKDOWN,
} from "../data/mockCrowd";
import { shortDateTime } from "../utils/formatters";
import { useCrowdStats, useVoiceNotes, useContributors } from "../api/queries";
import type { VoiceNote, Contributor } from "../types";

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
  const [categoryFilter, setCategoryFilter] = useState<VoiceNote["category"] | "all">("all");
  const [verifiedFilter, setVerifiedFilter] = useState<"all" | "verified" | "unverified">("all");
  const [selectedNote, setSelectedNote] = useState<string | null>(null);

  const { data: crowdStatsData, isLoading: statsLoading } = useCrowdStats();
  const { data: voiceNotesData, isLoading: notesLoading } = useVoiceNotes();
  const { data: contributorsData, isLoading: contributorsLoading } = useContributors();

  const crowdStats = crowdStatsData ?? CROWD_STATS;
  const voiceNotes: VoiceNote[] = (voiceNotesData?.items as VoiceNote[] | undefined) ?? VOICE_NOTES;
  const contributors: Contributor[] = (contributorsData as Contributor[] | undefined) ?? TOP_CONTRIBUTORS;

  // Build category breakdown from API stats or fall back to mock
  const categoryBreakdown = crowdStatsData?.categoryBreakdown
    ? Object.entries(crowdStatsData.categoryBreakdown).map(([name, value]) => {
        const existing = CATEGORY_BREAKDOWN.find((c) => c.name.toLowerCase().replace(/\s/g, "_") === name.toLowerCase().replace(/\s/g, "_"));
        return { name, value: value as number, color: existing?.color ?? "#64748b" };
      })
    : CATEGORY_BREAKDOWN;

  const filteredNotes = useMemo(() => {
    return voiceNotes.filter((v) => {
      if (categoryFilter !== "all" && v.category !== categoryFilter) return false;
      if (verifiedFilter === "verified" && !v.verified) return false;
      if (verifiedFilter === "unverified" && v.verified) return false;
      return true;
    });
  }, [voiceNotes, categoryFilter, verifiedFilter]);

  const recentNotes = filteredNotes.slice(0, 15);

  return (
    <PageWrapper>
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
        <MetricCard label="Total Reports" value={crowdStats.totalReports} color="teal" icon={<MessageCircle size={16} />} />
        <MetricCard label="Verified" value={crowdStats.verifiedReports} color="green" />
        <MetricCard label="Verification Rate" value={crowdStats.verificationRate * 100} unit="%" decimals={1} color="blue" />
        <MetricCard label="Active Contributors" value={crowdStats.activeContributors} color="purple" />
        <MetricCard label="Avg Credibility" value={crowdStats.avgCredibility} decimals={2} color="teal" />
        <MetricCard label="Network Value" value={crowdStats.networkValue} color="amber" subtitle="∝ n^1.5" />
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

      {/* Network value + Category distribution */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mt-4">
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
                  data={categoryBreakdown}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                >
                  {categoryBreakdown.map((c) => (
                    <Cell key={c.name} fill={c.color} stroke="#0d1521" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-3 gap-1 text-[10px]">
            {categoryBreakdown.map((c) => (
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
              {contributors.map((c, i) => {
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
    </PageWrapper>
  );
}
