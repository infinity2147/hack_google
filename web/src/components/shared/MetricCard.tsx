import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import { useAnimatedValue } from "../../hooks/useAnimatedValue";

interface Props {
  label: string;
  value: number;
  unit?: string;
  decimals?: number;
  delta?: number; // pct
  color?: "teal" | "amber" | "red" | "blue" | "purple" | "green";
  icon?: ReactNode;
  spark?: number[];
  glow?: boolean;
  subtitle?: string;
}

const COLORS = {
  teal: { bar: "#00d4aa", text: "text-accent-teal", border: "border-t-accent-teal" },
  amber: { bar: "#f59e0b", text: "text-accent-amber", border: "border-t-accent-amber" },
  red: { bar: "#ef4444", text: "text-accent-red", border: "border-t-accent-red" },
  blue: { bar: "#3b82f6", text: "text-accent-blue", border: "border-t-accent-blue" },
  purple: { bar: "#8b5cf6", text: "text-accent-purple", border: "border-t-accent-purple" },
  green: { bar: "#22c55e", text: "text-accent-green", border: "border-t-accent-green" },
};

export function MetricCard({
  label,
  value,
  unit,
  decimals = 0,
  delta,
  color = "teal",
  icon,
  spark,
  glow,
  subtitle,
}: Props) {
  const animated = useAnimatedValue(value, 1200);
  const palette = COLORS[color];
  const glowClass =
    glow && color === "red" ? "glow-red"
    : glow && color === "teal" ? "glow-teal"
    : glow && color === "amber" ? "glow-amber"
    : "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`relative overflow-hidden rounded-xl border border-border bg-bg-surface p-4 border-t-[3px] ${palette.border} hover:border-border-bright transition-colors`}
    >
      <div className="flex items-start justify-between">
        <div className="text-[11px] uppercase tracking-wider text-text-secondary">
          {label}
        </div>
        {icon && (
          <div className={`${palette.text}`} aria-hidden>
            {icon}
          </div>
        )}
      </div>
      <div className={`mt-2 flex items-baseline gap-2`}>
        <span className={`text-display text-[28px] leading-none ${palette.text} ${glowClass}`}>
          {animated.toFixed(decimals)}
          {unit && <span className="ml-1 text-base text-text-secondary">{unit}</span>}
        </span>
      </div>
      {subtitle && (
        <div className="mt-1 text-xs text-text-secondary">{subtitle}</div>
      )}
      {typeof delta === "number" && (
        <div
          className={`mt-2 inline-flex items-center gap-1 text-xs ${
            delta >= 0 ? "text-accent-green" : "text-accent-red"
          }`}
        >
          <span>{delta >= 0 ? "▲" : "▼"}</span>
          <span>{Math.abs(delta).toFixed(1)}%</span>
          <span className="text-text-dim">vs 7d</span>
        </div>
      )}
      {spark && spark.length > 1 && (
        <div className="mt-2 h-[34px] w-full opacity-90">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={spark.map((v, i) => ({ i, v }))}>
              <Line
                type="monotone"
                dataKey="v"
                stroke={palette.bar}
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </motion.div>
  );
}
