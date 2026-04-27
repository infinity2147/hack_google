interface Props {
  status:
    | "normal"
    | "review"
    | "alert"
    | "critical"
    | "infected"
    | "recovered"
    | "susceptible"
    | "immune"
    | "live"
    | "scanning"
    | "negotiating"
    | "healthy"
    | "verified"
    | "pending";
  size?: "sm" | "md";
  pulse?: boolean;
  children?: React.ReactNode;
}

const STYLES: Record<Props["status"], { bg: string; text: string; ring: string; label: string; dotPulse: boolean }> = {
  normal:      { bg: "bg-accent-green/10", text: "text-accent-green", ring: "ring-accent-green/30", label: "NORMAL", dotPulse: false },
  review:      { bg: "bg-accent-blue/10", text: "text-accent-blue", ring: "ring-accent-blue/30", label: "REVIEW", dotPulse: false },
  alert:       { bg: "bg-accent-amber/10", text: "text-accent-amber", ring: "ring-accent-amber/30", label: "ALERT", dotPulse: false },
  critical:    { bg: "bg-accent-red/10", text: "text-accent-red", ring: "ring-accent-red/30", label: "CRITICAL", dotPulse: true },
  infected:    { bg: "bg-accent-red/10", text: "text-accent-red", ring: "ring-accent-red/30", label: "INFECTED", dotPulse: true },
  recovered:   { bg: "bg-accent-green/10", text: "text-accent-green", ring: "ring-accent-green/30", label: "RECOVERED", dotPulse: false },
  susceptible: { bg: "bg-accent-blue/10", text: "text-accent-blue", ring: "ring-accent-blue/30", label: "SUSCEPTIBLE", dotPulse: false },
  immune:      { bg: "bg-accent-purple/10", text: "text-accent-purple", ring: "ring-accent-purple/30", label: "IMMUNE", dotPulse: false },
  live:        { bg: "bg-accent-teal/10", text: "text-accent-teal", ring: "ring-accent-teal/30", label: "LIVE", dotPulse: true },
  scanning:    { bg: "bg-accent-purple/10", text: "text-accent-purple", ring: "ring-accent-purple/30", label: "SCANNING", dotPulse: true },
  negotiating: { bg: "bg-accent-blue/10", text: "text-accent-blue", ring: "ring-accent-blue/30", label: "NEGOTIATING", dotPulse: true },
  healthy:     { bg: "bg-accent-green/10", text: "text-accent-green", ring: "ring-accent-green/30", label: "HEALTHY", dotPulse: false },
  verified:    { bg: "bg-accent-teal/10", text: "text-accent-teal", ring: "ring-accent-teal/30", label: "VERIFIED", dotPulse: false },
  pending:     { bg: "bg-text-dim/10", text: "text-text-secondary", ring: "ring-text-dim/30", label: "PENDING", dotPulse: false },
};

export function StatusBadge({ status, size = "sm", pulse, children }: Props) {
  const s = STYLES[status];
  const showPulse = pulse ?? s.dotPulse;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full ${s.bg} ${s.text} ring-1 ${s.ring} ${
        size === "md" ? "px-2.5 py-1 text-[11px]" : "px-2 py-0.5 text-[10px]"
      } font-semibold tracking-wider uppercase`}
    >
      <span
        className={`inline-block rounded-full ${size === "md" ? "h-2 w-2" : "h-1.5 w-1.5"} ${
          s.text === "text-accent-red" ? "bg-accent-red"
          : s.text === "text-accent-amber" ? "bg-accent-amber"
          : s.text === "text-accent-blue" ? "bg-accent-blue"
          : s.text === "text-accent-green" ? "bg-accent-green"
          : s.text === "text-accent-purple" ? "bg-accent-purple"
          : s.text === "text-accent-teal" ? "bg-accent-teal"
          : "bg-text-dim"
        } ${showPulse ? "dot-pulse" : ""}`}
      />
      <span>{children ?? s.label}</span>
    </span>
  );
}
