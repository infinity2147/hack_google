import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Legend,
} from "recharts";
import {
  Gavel,
  Ship,
  Trophy,
  Lock,
  ArrowRight,
  Play,
  ShieldCheck,
} from "lucide-react";
import { PageWrapper } from "../components/layout/PageWrapper";
import { Card } from "../components/shared/Card";
import { StatusBadge } from "../components/shared/StatusBadge";
import { useNexus } from "../store/nexusStore";
import { CARRIERS } from "../data/mockCarriers";
import { NETWORK_NODES } from "../data/mockNetwork";
import type { Bid } from "../types";

function carrierById(id: string) {
  return CARRIERS.find((c) => c.id === id)!;
}

function nodeName(id: string) {
  return NETWORK_NODES.find((n) => n.id === id)?.name ?? id;
}

export function RouteMarket() {
  const {
    urgency,
    setUrgency,
    origin,
    destination,
    setOrigin,
    setDestination,
    runNegotiation,
    lastNegotiation,
    negotiationHistory,
    negotiating,
    R0,
    logDecision,
  } = useNexus();

  const handleRun = async () => {
    await runNegotiation();
  };

  const winnerBid = lastNegotiation?.bids.find(
    (b) => b.carrier === lastNegotiation.winnerId,
  );

  const radarData = useMemo(
    () =>
      CARRIERS.map((c) => ({
        carrier: c.code,
        Cost: 1 - c.baseRate / 60000,
        Speed: c.speedScore,
        Safety: 1 - (1 - c.reliabilityScore),
        Reliability: c.reliabilityScore,
        Win: c.winRate,
      })),
    [],
  );

  const RADAR_AXES = ["Cost", "Speed", "Safety", "Reliability", "Win"];

  return (
    <PageWrapper>
      {/* Market header */}
      <Card
        title="Route Negotiation Market"
        subtitle="7 carrier agents · Vickrey second-price auction · federated learning"
        right={
          <StatusBadge status={negotiating ? "negotiating" : "live"}>
            {negotiating ? "NEGOTIATING" : lastNegotiation ? "SETTLED" : "IDLE"}
          </StatusBadge>
        }
      >
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[180px]">
            <label className="text-[10px] uppercase tracking-wider text-text-secondary">
              Origin
            </label>
            <select
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              className="w-full mt-1 bg-bg-elevated border border-border rounded px-2 py-1.5 text-xs outline-none focus:border-accent-teal"
            >
              {NETWORK_NODES.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.name}
                </option>
              ))}
            </select>
          </div>
          <ArrowRight className="text-text-dim mb-2" size={16} />
          <div className="flex-1 min-w-[180px]">
            <label className="text-[10px] uppercase tracking-wider text-text-secondary">
              Destination
            </label>
            <select
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="w-full mt-1 bg-bg-elevated border border-border rounded px-2 py-1.5 text-xs outline-none focus:border-accent-teal"
            >
              {NETWORK_NODES.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <div className="flex justify-between text-[10px] uppercase tracking-wider text-text-secondary">
              <span>Urgency</span>
              <span className="font-mono text-accent-teal">{urgency.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={urgency}
              onChange={(e) => setUrgency(parseFloat(e.target.value))}
              className="w-full mt-2"
            />
          </div>
          <button
            onClick={handleRun}
            disabled={negotiating}
            className="inline-flex items-center gap-2 bg-accent-teal text-bg-base font-semibold rounded-lg px-3 py-2 text-xs hover:brightness-110 disabled:opacity-50 transition"
          >
            <Play size={14} /> {negotiating ? "Sealing bids…" : "Run Negotiation"}
          </button>
        </div>
      </Card>

      {/* Agent cards */}
      <div className="mt-4">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-text-primary">
              Carrier Agents
            </h3>
            <p className="text-xs text-text-secondary">
              7 agents · sealed bids → Vickrey reveal
            </p>
          </div>
          <span className="text-[11px] text-text-dim font-mono">
            current network R₀ = {R0.toFixed(2)}
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {CARRIERS.map((c) => {
            const bid = lastNegotiation?.bids.find((b) => b.carrier === c.id);
            const isWinner =
              lastNegotiation && lastNegotiation.winnerId === c.id;
            return (
              <motion.div
                key={c.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`relative rounded-xl border p-3 bg-bg-surface overflow-hidden ${
                  isWinner
                    ? "border-amber-400/70 shadow-[0_0_22px_rgba(245,158,11,0.25)]"
                    : "border-border"
                }`}
              >
                {isWinner && (
                  <div className="absolute top-0 right-0 bg-accent-amber text-bg-base px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded-bl-lg">
                    Winner
                  </div>
                )}
                <div className="flex items-start gap-2">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: `${c.color}22`, color: c.color }}
                  >
                    <Ship size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm text-text-primary font-semibold leading-tight">
                      {c.name}
                    </div>
                    <div className="text-[10px] text-text-secondary font-mono">
                      Agent {c.agent} · {c.strategy}
                    </div>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-x-2 gap-y-1 text-[11px]">
                  <span className="text-text-secondary">Risk</span>
                  <span className="text-text-primary text-right">{c.riskTolerance}</span>
                  <span className="text-text-secondary">Speed</span>
                  <span className="text-text-primary text-right">{c.speed}</span>
                  <span className="text-text-secondary">Cost</span>
                  <span className="text-text-primary text-right">{c.costProfile}</span>
                  <span className="text-text-secondary">Win rate</span>
                  <span className="text-text-primary text-right font-mono">
                    {(c.winRate * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="mt-3 pt-3 border-t border-border min-h-[60px]">
                  <AnimatePresence mode="wait">
                    {negotiating ? (
                      <motion.div
                        key="sealed"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex flex-col items-center justify-center gap-1 text-[11px] text-text-dim"
                      >
                        <Lock size={14} className="text-accent-purple" />
                        <span>BID SEALED</span>
                      </motion.div>
                    ) : bid ? (
                      <motion.div
                        key={`bid-${bid.bid}`}
                        initial={{ rotateY: 90, opacity: 0 }}
                        animate={{ rotateY: 0, opacity: 1 }}
                        transition={{ duration: 0.5 }}
                        className="text-[11px] space-y-1"
                      >
                        <div className="flex justify-between">
                          <span className="text-text-secondary">Bid</span>
                          <span className="font-mono font-semibold text-text-primary">
                            ${bid.bid.toLocaleString("en-US")}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-text-secondary">Transit</span>
                          <span className="text-text-primary">{bid.transitDays}d</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-text-secondary">Risk π</span>
                          <span
                            className={
                              bid.riskScore < 0.25
                                ? "text-accent-green"
                                : bid.riskScore < 0.4
                                  ? "text-accent-amber"
                                  : "text-accent-red"
                            }
                          >
                            {bid.riskScore.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-text-secondary">Score</span>
                          <span className="font-mono text-accent-teal">
                            {bid.score.toFixed(4)}
                          </span>
                        </div>
                      </motion.div>
                    ) : (
                      <div className="text-[11px] text-text-dim text-center pt-3">
                        Awaiting round
                      </div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Winner panel */}
      {lastNegotiation && winnerBid && (
        <motion.div
          key={`winner-${lastNegotiation.round}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 rounded-xl border border-amber-400/40 bg-gradient-to-br from-bg-surface to-bg-elevated p-5 relative overflow-hidden"
        >
          <div
            className="absolute inset-y-0 left-0 w-[3px] bg-accent-amber"
            aria-hidden
          />
          <div className="flex items-start gap-3">
            <Trophy className="text-accent-amber shrink-0 mt-0.5" size={24} />
            <div className="flex-1">
              <div className="text-[10px] uppercase tracking-widest text-text-secondary">
                Round {lastNegotiation.round} · Vickrey settled
              </div>
              <div className="flex items-baseline gap-3 mt-1 flex-wrap">
                <span
                  className="text-display text-2xl"
                  style={{ color: carrierById(lastNegotiation.winnerId).color }}
                >
                  {carrierById(lastNegotiation.winnerId).name}
                </span>
                <StatusBadge status="live">WINNER</StatusBadge>
              </div>
              <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <div className="text-[10px] uppercase text-text-secondary tracking-wider">
                    Sealed bid
                  </div>
                  <div className="font-mono text-text-primary text-lg">
                    ${winnerBid.bid.toLocaleString("en-US")}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase text-text-secondary tracking-wider">
                    Pays (2nd price)
                  </div>
                  <div className="font-mono text-accent-teal text-lg glow-teal">
                    ${lastNegotiation.paymentPrice.toLocaleString("en-US")}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase text-text-secondary tracking-wider">
                    Transit
                  </div>
                  <div className="font-mono text-text-primary text-lg">
                    {winnerBid.transitDays}d
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase text-text-secondary tracking-wider">
                    Composite score
                  </div>
                  <div className="font-mono text-accent-teal text-lg">
                    {winnerBid.score.toFixed(4)}
                  </div>
                </div>
              </div>
              <div className="mt-3 text-xs text-text-secondary">
                <span className="text-[10px] uppercase tracking-wider text-text-dim">
                  Route ·{" "}
                </span>
                {lastNegotiation.routePath
                  .map((id) => nodeName(id))
                  .join(" → ")}
              </div>
              <div className="mt-2 text-[11px] text-text-dim font-mono">
                b(l) = v(l) − c(l) − π(l) &nbsp;|&nbsp; π = SIR risk premium
              </div>
              <div className="mt-3 flex items-center gap-2">
                <button
                  onClick={() => {
                    logDecision("accept", carrierById(lastNegotiation.winnerId).name, {
                      carrier: carrierById(lastNegotiation.winnerId).name,
                      bid: winnerBid.bid,
                      outcome: "accepted",
                    });
                  }}
                  className="bg-accent-teal text-bg-base font-semibold rounded-lg px-3 py-1.5 text-xs hover:brightness-110"
                >
                  ✅ Accept Route
                </button>
                <button
                  onClick={() => {
                    const alt = lastNegotiation.bids[1];
                    if (alt) logDecision("alternative", carrierById(alt.carrier).code, { carrier: carrierById(alt.carrier).name, bid: alt.bid, outcome: "alternative" });
                  }}
                  className="border border-accent-amber/50 text-accent-amber rounded-lg px-3 py-1.5 text-xs hover:bg-accent-amber/10"
                >
                  🔄 Alternative
                </button>
                <button
                  onClick={() => logDecision("reject", "all", { urgency, reason: "all_rejected" })}
                  className="border border-accent-red/50 text-accent-red rounded-lg px-3 py-1.5 text-xs hover:bg-accent-red/10"
                >
                  ❌ Reject All
                </button>
                <button
                  onClick={handleRun}
                  className="border border-border rounded-lg px-3 py-1.5 text-xs text-text-secondary hover:border-accent-teal hover:text-accent-teal ml-auto"
                >
                  Run Another Round
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Bid comparison + radar */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mt-4">
        <Card
          className="xl:col-span-2"
          title="Bid Comparison"
          subtitle="Vertical bars = sealed bid · gold = winner · dashed line = 2nd-price payment"
        >
          {lastNegotiation ? (
            <div className="h-[300px]">
              <ResponsiveContainer>
                <BarChart data={lastNegotiation.bids}>
                  <CartesianGrid stroke="#1e2d42" strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="carrier"
                    stroke="#8fa4c0"
                    fontSize={10}
                    interval={0}
                  />
                  <YAxis stroke="#4a6278" fontSize={10} />
                  <Tooltip />
                  <ReferenceLine
                    y={lastNegotiation.paymentPrice}
                    stroke="#00d4aa"
                    strokeDasharray="4 4"
                    label={{
                      value: `Payment ${lastNegotiation.paymentPrice.toLocaleString("en-US")}`,
                      fill: "#00d4aa",
                      fontSize: 10,
                      position: "insideTopRight",
                    }}
                  />
                  <Bar dataKey="bid" radius={[4, 4, 0, 0]}>
                    {lastNegotiation.bids.map((b: Bid) => (
                      <Cell
                        key={b.carrier}
                        fill={
                          b.carrier === lastNegotiation.winnerId
                            ? "#f59e0b"
                            : "#1e2d42"
                        }
                        stroke={
                          b.carrier === lastNegotiation.winnerId ? "#f59e0b" : "#2a3f5e"
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-xs text-text-dim">
              Run a negotiation to see bid comparison.
            </div>
          )}
        </Card>

        <Card title="Agent Composite Profile" subtitle="5-axis scoring across all 7 carriers">
          <div className="h-[300px] -mx-2">
            <ResponsiveContainer>
              <RadarChart data={RADAR_AXES.map((axis) => {
                const row: Record<string, number | string> = { axis };
                for (const c of radarData) {
                  row[c.carrier as string] = c[axis as keyof typeof c] as number;
                }
                return row;
              })}>
                <PolarGrid stroke="#1e2d42" />
                <PolarAngleAxis dataKey="axis" tick={{ fill: "#8fa4c0", fontSize: 10 }} />
                <PolarRadiusAxis domain={[0, 1]} stroke="#4a6278" tick={{ fill: "#4a6278", fontSize: 9 }} axisLine={false} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                {CARRIERS.map((c) => (
                  <Radar
                    key={c.id}
                    name={c.code}
                    dataKey={c.code}
                    stroke={c.color}
                    fill={c.color}
                    fillOpacity={0.05}
                    strokeWidth={1.5}
                  />
                ))}
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Round history */}
      <Card
        className="mt-4"
        title="Market History"
        subtitle={`${negotiationHistory.length} rounds in this session`}
      >
        {negotiationHistory.length === 0 ? (
          <div className="py-8 text-center text-xs text-text-dim">
            No rounds yet. Run a negotiation above.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-[10px] uppercase tracking-wider text-text-secondary border-b border-border">
                  <th className="px-3 py-2 text-left">Round</th>
                  <th className="px-3 py-2 text-left">Winner</th>
                  <th className="px-3 py-2 text-left">Route</th>
                  <th className="px-3 py-2 text-right">Bid</th>
                  <th className="px-3 py-2 text-right">Payment</th>
                  <th className="px-3 py-2 text-right">Urgency</th>
                  <th className="px-3 py-2 text-right">Score</th>
                </tr>
              </thead>
              <tbody>
                {negotiationHistory.map((n) => {
                  const w = n.bids.find((b) => b.carrier === n.winnerId)!;
                  return (
                    <tr key={n.round} className="border-b border-border hover:bg-bg-hover">
                      <td className="px-3 py-2 font-mono text-text-secondary">{n.round}</td>
                      <td
                        className="px-3 py-2 font-semibold"
                        style={{ color: carrierById(n.winnerId).color }}
                      >
                        {carrierById(n.winnerId).code}
                      </td>
                      <td className="px-3 py-2 text-text-secondary truncate max-w-[260px]">
                        {nodeName(n.origin)} → {nodeName(n.destination)}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-text-primary">
                        ${w.bid.toLocaleString("en-US")}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-accent-teal">
                        ${n.paymentPrice.toLocaleString("en-US")}
                      </td>
                      <td className="px-3 py-2 text-right text-text-secondary">
                        {(n.urgency * 100).toFixed(0)}%
                      </td>
                      <td className="px-3 py-2 text-right font-mono">{w.score.toFixed(4)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Federated learning */}
      <div className="mt-4">
        <Card
          title="Federated Learning"
          subtitle="Privacy-preserving multi-carrier coordination"
          right={<StatusBadge status="immune">PRIVATE</StatusBadge>}
        >
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <ShieldCheck className="text-accent-purple" size={20} />
              <div>
                <div className="text-sm text-text-primary">7 agents participating</div>
                <div className="text-[11px] text-text-dim">
                  Round 1,247 · last aggregation 4 min ago
                </div>
              </div>
            </div>
            <div className="rounded-lg border border-border bg-bg-elevated p-3 font-mono text-[11px] text-text-secondary leading-relaxed">
              <div className="text-accent-teal">FedAvg update</div>
              <div className="mt-1">w(t+1) = Σ (nₖ/n) · w(t+1)ₖ</div>
              <div className="mt-2 text-text-dim">
                No raw cargo data leaves shipper perimeter ✓
              </div>
            </div>
            <div className="text-[11px] text-text-secondary leading-relaxed">
              Each carrier trains locally on its private order book, then shares
              only model gradients via Vertex AI federated runtime. Vickrey
              settlement happens on the aggregated policy.
            </div>
          </div>
        </Card>
      </div>

      {/* Floating gavel illustration */}
      <div className="mt-6 flex items-center justify-center gap-2 text-[11px] text-text-dim">
        <Gavel size={14} />
        Multi-agent Vickrey auction · sealed bidding ensures truthful pricing
      </div>
    </PageWrapper>
  );
}
