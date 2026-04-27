import type { ReactNode } from "react";

interface Props {
  title?: string;
  children: ReactNode;
  notes?: ReactNode;
}

export function EquationBlock({ title, children, notes }: Props) {
  return (
    <div className="relative rounded-xl border border-border bg-bg-elevated p-5 font-mono text-sm overflow-hidden">
      <div className="absolute inset-y-0 left-0 w-[3px] bg-gradient-to-b from-accent-teal via-accent-blue to-accent-purple" />
      {title && (
        <div className="text-[10px] uppercase tracking-[0.2em] text-text-secondary mb-3 font-sans">
          {title}
        </div>
      )}
      <div className="space-y-2 text-text-primary">{children}</div>
      {notes && (
        <div className="mt-4 pt-4 border-t border-border text-text-secondary text-[12px] space-y-1 font-sans">
          {notes}
        </div>
      )}
    </div>
  );
}

export function EqLine({ children, accent }: { children: ReactNode; accent?: boolean }) {
  return (
    <div className={`leading-relaxed ${accent ? "text-accent-teal" : "text-text-primary"}`}>
      {children}
    </div>
  );
}
