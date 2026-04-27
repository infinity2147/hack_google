import { useAnimatedValue } from "../../hooks/useAnimatedValue";

interface Props {
  value: number; // 0..3
  size?: "sm" | "md" | "lg";
}

const SIZE_MAP = { sm: 120, md: 200, lg: 280 };

export function R0Gauge({ value, size = "md" }: Props) {
  const v = Math.max(0, Math.min(3, value));
  const animated = useAnimatedValue(v, 1000);
  const w = SIZE_MAP[size];
  const h = w * 0.6;
  const cx = w / 2;
  const cy = h - 12;
  const r = w / 2 - 14;
  const angle = (animated / 3) * Math.PI; // 0..π
  // Needle: angle from left (π) to right (0). angle=0 → right; we want angle=0 at left (small R0).
  // So needle angle = π - (animated/3)*π
  const needleAngle = Math.PI - angle;
  const needleX = cx + Math.cos(needleAngle) * (r - 8);
  const needleY = cy - Math.sin(needleAngle) * (r - 8);

  // Color zones: 0-1 green, 1-2 amber, 2-3 red
  const zoneColor =
    animated < 1 ? "#22c55e" : animated < 2 ? "#f59e0b" : "#ef4444";

  // Build arc segments
  function arcPath(startA: number, endA: number) {
    const sx = cx + Math.cos(Math.PI - startA) * r;
    const sy = cy - Math.sin(Math.PI - startA) * r;
    const ex = cx + Math.cos(Math.PI - endA) * r;
    const ey = cy - Math.sin(Math.PI - endA) * r;
    const large = endA - startA > Math.PI ? 1 : 0;
    return `M ${sx} ${sy} A ${r} ${r} 0 ${large} 1 ${ex} ${ey}`;
  }

  const sliceA = (1 / 3) * Math.PI;

  const status =
    animated >= 2 ? "CASCADING"
    : animated >= 1 ? "AT THRESHOLD"
    : "SELF-CONTAINING";

  const valueColor =
    animated >= 2 ? "text-accent-red glow-red"
    : animated >= 1 ? "text-accent-amber glow-amber"
    : "text-accent-green";

  return (
    <div className="flex flex-col items-center" style={{ width: w }}>
      <svg width={w} height={h + 24} viewBox={`0 0 ${w} ${h + 24}`}>
        {/* track */}
        <path
          d={arcPath(0, Math.PI)}
          stroke="#1e2d42"
          strokeWidth={10}
          fill="none"
          strokeLinecap="round"
        />
        {/* zones */}
        <path d={arcPath(0, sliceA)} stroke="#22c55e" strokeWidth={6} fill="none" />
        <path d={arcPath(sliceA, sliceA * 2)} stroke="#f59e0b" strokeWidth={6} fill="none" />
        <path d={arcPath(sliceA * 2, Math.PI)} stroke="#ef4444" strokeWidth={6} fill="none" />

        {/* tick marks */}
        {[0, 1, 2, 3].map((tick) => {
          const a = (tick / 3) * Math.PI;
          const tx1 = cx + Math.cos(Math.PI - a) * (r - 16);
          const ty1 = cy - Math.sin(Math.PI - a) * (r - 16);
          const tx2 = cx + Math.cos(Math.PI - a) * (r - 4);
          const ty2 = cy - Math.sin(Math.PI - a) * (r - 4);
          const lx = cx + Math.cos(Math.PI - a) * (r - 28);
          const ly = cy - Math.sin(Math.PI - a) * (r - 28);
          return (
            <g key={tick}>
              <line x1={tx1} y1={ty1} x2={tx2} y2={ty2} stroke="#4a6278" strokeWidth={1.5} />
              <text x={lx} y={ly + 4} fontSize={10} fill="#8fa4c0" textAnchor="middle" fontFamily="JetBrains Mono">
                {tick}
              </text>
            </g>
          );
        })}

        {/* needle */}
        <line x1={cx} y1={cy} x2={needleX} y2={needleY} stroke={zoneColor} strokeWidth={3} strokeLinecap="round" />
        <circle cx={cx} cy={cy} r={5} fill={zoneColor} />
        <circle cx={cx} cy={cy} r={5} fill={zoneColor} opacity={0.4} className="dot-pulse" />
      </svg>
      <div className={`text-display text-2xl ${valueColor} -mt-3`}>
        {animated.toFixed(2)}
      </div>
      <div className="text-[10px] uppercase tracking-widest text-text-secondary mt-1">
        R₀ · {status}
      </div>
    </div>
  );
}
