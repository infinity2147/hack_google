import { lerpColor, SEVERITY_GRADIENT } from "../../utils/formatters";

interface Props {
  value: number; // 0..1
  showLabel?: boolean;
  height?: number;
  labelDecimals?: number;
}

export function SeverityBar({ value, showLabel = true, height = 6, labelDecimals = 2 }: Props) {
  const pct = Math.max(0, Math.min(1, value));
  const fillColor = lerpColor(pct, SEVERITY_GRADIENT);
  return (
    <div className="flex items-center gap-2 w-full">
      <div
        className="relative flex-1 rounded-full bg-bg-elevated overflow-hidden"
        style={{ height }}
      >
        <div
          className="h-full rounded-full transition-[width] duration-700 ease-out"
          style={{ width: `${pct * 100}%`, backgroundColor: fillColor }}
        />
      </div>
      {showLabel && (
        <span
          className="text-xs font-mono w-10 text-right tabular-nums"
          style={{ color: fillColor }}
        >
          {pct.toFixed(labelDecimals)}
        </span>
      )}
    </div>
  );
}
