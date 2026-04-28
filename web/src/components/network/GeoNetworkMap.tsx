import { useState, useMemo } from "react";
import { ComposableMap, Geographies, Geography, Marker, Line } from "react-simple-maps";
import { useNexus } from "../../store/nexusStore";
import { NETWORK_NODES, NETWORK_EDGES } from "../../data/mockNetwork";
import type { SupplyChainNode } from "../../types";

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

interface Props {
  height?: number;
  onSelect?: (node: SupplyChainNode) => void;
}

function stateColor(state: "S" | "I" | "R", infection: number) {
  if (state === "I") return infection > 0.5 ? "#ef4444" : "#f59e0b";
  if (state === "R") return "#22c55e";
  return "#3b82f6";
}

export function GeoNetworkMap({ height = 480, onSelect }: Props) {
  const runtime = useNexus((s) => s.runtime);
  const [hover, setHover] = useState<string | null>(null);

  const nodeMap = useMemo(() => {
    const m: Record<string, SupplyChainNode> = {};
    for (const n of NETWORK_NODES) m[n.id] = n;
    return m;
  }, []);

  const adjForSelected = useMemo(() => {
    if (!hover) return new Set<string>();
    const set = new Set<string>([hover]);
    for (const e of NETWORK_EDGES) {
      if (e.source === hover) set.add(e.target);
      if (e.target === hover) set.add(e.source);
    }
    return set;
  }, [hover]);

  return (
    <div className="relative w-full" style={{ height }}>
      <ComposableMap
        projection="geoNaturalEarth1"
        projectionConfig={{
          center: [65, 15],
          scale: 220,
        }}
        style={{ width: "100%", height: "100%" }}
      >
        <Geographies geography={geoUrl}>
          {({ geographies }) =>
            geographies.map((geo) => (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                fill="#162035"
                stroke="#2a3f5e"
                strokeWidth={0.5}
                style={{
                  default: { outline: "none" },
                  hover: { outline: "none" },
                  pressed: { outline: "none" },
                }}
              />
            ))
          }
        </Geographies>

        {/* Edges */}
        {NETWORK_EDGES.map((e, i) => {
          const a = nodeMap[e.source];
          const b = nodeMap[e.target];
          if (!a || !b) return null;
          const sourceInf = runtime[a.id]?.infection ?? 0;
          const targetInf = runtime[b.id]?.infection ?? 0;
          const heat = (sourceInf + targetInf) / 2;
          const stroke = heat > 0.5 ? "#ef4444" : heat > 0.25 ? "#f59e0b" : "#1e2d42";
          const isHi = adjForSelected.size > 0 && adjForSelected.has(a.id) && adjForSelected.has(b.id);
          return (
            <Line
              key={`edge-${i}`}
              from={[a.lng, a.lat]}
              to={[b.lng, b.lat]}
              stroke={stroke}
              strokeWidth={0.5 + e.weight * 1.5}
              strokeOpacity={adjForSelected.size > 0 ? (isHi ? 0.9 : 0.1) : heat > 0.25 ? 0.6 : 0.35}
              strokeLinecap="round"
            />
          );
        })}

        {/* Nodes */}
        {NETWORK_NODES.map((n) => {
          const rt = runtime[n.id];
          const infection = rt?.infection ?? n.infectionLevel;
          const state = rt?.state ?? n.sirState;
          const color = stateColor(state, infection);
          const isHi = adjForSelected.size === 0 || adjForSelected.has(n.id);
          const radius = 2 + Math.min(6, Math.sqrt(n.tradeVolumeB) * 0.8);

          return (
            <Marker
              key={n.id}
              coordinates={[n.lng, n.lat]}
              onMouseEnter={() => setHover(n.id)}
              onMouseLeave={() => setHover(null)}
              onClick={() => onSelect?.(n)}
              style={{
                default: { outline: "none", cursor: "pointer", opacity: isHi ? 1 : 0.3 },
                hover: { outline: "none", cursor: "pointer" },
              }}
            >
              {state === "I" && (
                <circle
                  r={radius + 4}
                  fill="none"
                  stroke={color}
                  strokeOpacity={0.5}
                  strokeWidth={1}
                >
                  <animate
                    attributeName="r"
                    from={radius + 2}
                    to={radius + 10}
                    dur="1.6s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="stroke-opacity"
                    from={0.6}
                    to={0}
                    dur="1.6s"
                    repeatCount="indefinite"
                  />
                </circle>
              )}
              <circle
                r={radius}
                fill={color}
                stroke="#0d1521"
                strokeWidth={0.8}
              />
              {state === "I" && (
                <circle r={radius * 0.4} fill="#ffffff" opacity={0.2} />
              )}
            </Marker>
          );
        })}
      </ComposableMap>

      {/* Tooltip */}
      {hover && (() => {
        const n = nodeMap[hover];
        const rt = runtime[hover];
        if (!n) return null;
        return (
          <div
            className="absolute pointer-events-none rounded-lg border border-border-bright bg-bg-elevated p-3 text-xs shadow-xl min-w-[200px] z-20"
            style={{
              left: "50%",
              top: "8px",
              transform: "translateX(-50%)",
            }}
          >
            <div className="text-text-primary font-semibold">{n.name}</div>
            <div className="text-text-dim text-[10px] uppercase tracking-wider mb-2">
              {n.type.replace("_", " ")} · {n.country}
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 font-mono text-[11px]">
              <span className="text-text-secondary">SIR</span>
              <span className={rt?.state === "I" ? "text-accent-red" : rt?.state === "R" ? "text-accent-green" : "text-accent-blue"}>
                {rt?.state ?? "S"}
              </span>
              <span className="text-text-secondary">Infection</span>
              <span className="text-accent-amber">{(rt?.infection ?? 0).toFixed(2)}</span>
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
          <span className="h-2 w-2 rounded-full bg-accent-red" /> Infected
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-accent-green" /> Recovered
        </span>
        <span className="text-text-dim ml-2">31 nodes · 48 edges</span>
      </div>
    </div>
  );
}
