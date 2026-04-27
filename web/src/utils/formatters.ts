export function formatCurrency(n: number): string {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}k`;
  return `$${n.toFixed(0)}`;
}

export function formatPct(n: number, digits = 1): string {
  return `${(n * 100).toFixed(digits)}%`;
}

export function formatNumber(n: number): string {
  return n.toLocaleString("en-IN");
}

export function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
  });
}

export function shortDateTime(iso: string): string {
  const d = new Date(iso);
  return `${d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
  })} ${d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

export function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

export function lerpColor(t: number, stops: { at: number; color: [number, number, number] }[]): string {
  // t in [0,1]
  const tt = clamp(t, 0, 1);
  for (let i = 0; i < stops.length - 1; i++) {
    const a = stops[i];
    const b = stops[i + 1];
    if (tt >= a.at && tt <= b.at) {
      const f = (tt - a.at) / (b.at - a.at);
      const r = Math.round(a.color[0] + (b.color[0] - a.color[0]) * f);
      const g = Math.round(a.color[1] + (b.color[1] - a.color[1]) * f);
      const bl = Math.round(a.color[2] + (b.color[2] - a.color[2]) * f);
      return `rgb(${r},${g},${bl})`;
    }
  }
  const last = stops[stops.length - 1].color;
  return `rgb(${last[0]},${last[1]},${last[2]})`;
}

export const SEVERITY_GRADIENT = [
  { at: 0, color: [34, 197, 94] as [number, number, number] }, // green
  { at: 0.5, color: [245, 158, 11] as [number, number, number] }, // amber
  { at: 1, color: [239, 68, 68] as [number, number, number] }, // red
];
