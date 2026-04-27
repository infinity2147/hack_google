interface Props {
  color?: "teal" | "green" | "red" | "amber" | "blue" | "purple";
  size?: number;
  active?: boolean;
}

const COLORS = {
  teal: { bg: "bg-accent-teal", ring: "rgba(0,212,170,0.5)" },
  green: { bg: "bg-accent-green", ring: "rgba(34,197,94,0.5)" },
  red: { bg: "bg-accent-red", ring: "rgba(239,68,68,0.5)" },
  amber: { bg: "bg-accent-amber", ring: "rgba(245,158,11,0.5)" },
  blue: { bg: "bg-accent-blue", ring: "rgba(59,130,246,0.5)" },
  purple: { bg: "bg-accent-purple", ring: "rgba(139,92,246,0.5)" },
};

export function LivePulseDot({ color = "teal", size = 8, active = true }: Props) {
  const palette = COLORS[color];
  return (
    <span className="relative inline-flex" style={{ width: size, height: size }}>
      {active && (
        <span
          className="absolute inline-flex h-full w-full rounded-full opacity-75"
          style={{
            animation: "ping-ring 1.6s cubic-bezier(0,0,0.2,1) infinite",
            boxShadow: `0 0 0 0 ${palette.ring}`,
          }}
        />
      )}
      <span className={`relative inline-flex rounded-full ${palette.bg}`} style={{ width: size, height: size }} />
    </span>
  );
}
