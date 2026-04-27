import { useMemo, useState } from "react";
import { useNexus } from "../../store/nexusStore";
import { NETWORK_NODES, NETWORK_EDGES } from "../../data/mockNetwork";
import type { SupplyChainNode } from "../../types";

interface Props {
  height?: number;
  showLabels?: boolean;
  interactive?: boolean;
  onSelect?: (node: SupplyChainNode) => void;
}

const VIEW_W = 1100;
const VIEW_H = 600;

function stateColor(state: "S" | "I" | "R", infection: number) {
  if (state === "I") {
    // pulse from amber to red as infection rises
    return infection > 0.5 ? "#ef4444" : "#f59e0b";
  }
  if (state === "R") return "#22c55e";
  return "#3b82f6";
}

function nodeRadius(volB: number) {
  return 5 + Math.min(14, Math.sqrt(volB) * 2);
}

export function NetworkGraph({
  height = 480,
  showLabels = true,
  interactive = true,
  onSelect,
}: Props) {
  const runtime = useNexus((s) => s.runtime);
  const [hover, setHover] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  const nodeMap = useMemo(() => {
    const m: Record<string, SupplyChainNode> = {};
    for (const n of NETWORK_NODES) m[n.id] = n;
    return m;
  }, []);

  const adjForSelected = useMemo(() => {
    if (!selected && !hover) return new Set<string>();
    const id = hover ?? selected!;
    const set = new Set<string>([id]);
    for (const e of NETWORK_EDGES) {
      if (e.source === id) set.add(e.target);
      if (e.target === id) set.add(e.source);
    }
    return set;
  }, [hover, selected]);

  return (
    <div className="relative w-full" style={{ height }}>
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-full"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Backdrop grid (subtle) */}
        <defs>
          <pattern id="grid-net" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#142033" strokeWidth="0.5" />
          </pattern>
          <radialGradient id="infected-glow">
            <stop offset="0%" stopColor="#ef4444" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width={VIEW_W} height={VIEW_H} fill="url(#grid-net)" />

        {/* Edges */}
        <g>
          {NETWORK_EDGES.map((e, i) => {
            const a = nodeMap[e.source];
            const b = nodeMap[e.target];
            if (!a || !b) return null;
            const isHi =
              adjForSelected.size > 0 &&
              adjForSelected.has(a.id) &&
              adjForSelected.has(b.id);
            const sourceInf = runtime[a.id]?.infection ?? 0;
            const targetInf = runtime[b.id]?.infection ?? 0;
            const heat = (sourceInf + targetInf) / 2;
            const stroke =
              heat > 0.5 ? "#ef4444" : heat > 0.25 ? "#f59e0b" : "#1e2d42";
            return (
              <line
                key={i}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke={stroke}
                strokeWidth={1 + e.weight * 3}
                strokeOpacity={
                  adjForSelected.size > 0 ? (isHi ? 0.95 : 0.12) : heat > 0.25 ? 0.7 : 0.45
                }
              />
            );
          })}
        </g>

        {/* Nodes */}
        <g>
          {NETWORK_NODES.map((n) => {
            const rt = runtime[n.id];
            const infection = rt?.infection ?? n.infectionLevel;
            const state = rt?.state ?? n.sirState;
            const r = nodeRadius(n.tradeVolumeB);
            const color = stateColor(state, infection);
            const isInfected = state === "I";
            const isHi =
              adjForSelected.size === 0 || adjForSelected.has(n.id);

            return (
              <g
                key={n.id}
                transform={`translate(${n.x},${n.y})`}
                opacity={isHi ? 1 : 0.25}
                style={{ cursor: interactive ? "pointer" : "default" }}
                onMouseEnter={() => interactive && setHover(n.id)}
                onMouseLeave={() => interactive && setHover(null)}
                onClick={() => {
                  if (!interactive) return;
                  setSelected((cur) => (cur === n.id ? null : n.id));
                  onSelect?.(n);
                }}
              >
                {isInfected && (
                  <>
                    <circle r={r + 12} fill="url(#infected-glow)" />
                    <circle
                      r={r + 4}
                      fill="none"
                      stroke="#ef4444"
                      strokeOpacity={0.6}
                      style={{
                        animation: "ping-ring 1.6s cubic-bezier(0,0,0.2,1) infinite",
                        boxShadow: "0 0 0 0 rgba(239,68,68,0.6)",
                      }}
                    />
                  </>
                )}
                <circle
                  r={r}
                  fill={color}
                  stroke={selected === n.id ? "#e2eaf6" : "#0d1521"}
                  strokeWidth={selected === n.id ? 2 : 1.2}
                />
                {state === "I" && (
                  <circle r={r * 0.45} fill="#ffffff" opacity={0.18} />
                )}
                {showLabels && (
                  <text
                    y={r + 12}
                    textAnchor="middle"
                    fontSize={9}
                    fill="#8fa4c0"
                    fontFamily="Inter"
                  >
                    {n.name.length > 14 ? n.name.slice(0, 13) + "…" : n.name}
                  </text>
                )}
              </g>
            );
          })}
        </g>
      </svg>

      {/* Tooltip */}
      {hover && (() => {
        const n = nodeMap[hover];
        const rt = runtime[hover];
        if (!n) return null;
        return (
          <div
            className="absolute pointer-events-none rounded-lg border border-border-bright bg-bg-elevated p-3 text-xs shadow-xl min-w-[200px]"
            style={{
              left: `${(n.x / VIEW_W) * 100}%`,
              top: `${(n.y / VIEW_H) * 100}%`,
              transform: "translate(12px, -110%)",
            }}
          >
            <div className="text-text-primary font-semibold">{n.name}</div>
            <div className="text-text-dim text-[10px] uppercase tracking-wider mb-2">
              {n.type.replace("_", " ")} · {n.country}
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 font-mono text-[11px]">
              <span className="text-text-secondary">SIR</span>
              <span
                className={
                  rt?.state === "I"
                    ? "text-accent-red"
                    : rt?.state === "R"
                    ? "text-accent-green"
                    : "text-accent-blue"
                }
              >
                {rt?.state ?? "S"}
              </span>
              <span className="text-text-secondary">Infection</span>
              <span className="text-accent-amber">
                {(rt?.infection ?? 0).toFixed(2)}
              </span>
              <span className="text-text-secondary">Trade vol</span>
              <span className="text-accent-teal">${n.tradeVolumeB}B/yr</span>
            </div>
          </div>
        );
      })()}

      {/* Legend */}
      <div className="absolute bottom-2 left-2 flex items-center gap-3 rounded-lg border border-border bg-bg-surface/80 backdrop-blur px-3 py-1.5 text-[11px]">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-accent-blue" /> Susceptible
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-accent-red dot-pulse" /> Infected
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-accent-green" /> Recovered
        </span>
        <span className="text-text-dim ml-2">31 nodes · 48 edges</span>
      </div>
    </div>
  );
}
