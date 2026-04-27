import type { ReactNode } from "react";

interface Props {
  title?: ReactNode;
  subtitle?: ReactNode;
  right?: ReactNode;
  children: ReactNode;
  className?: string;
  glow?: boolean;
  noPad?: boolean;
}

export function Card({ title, subtitle, right, children, className = "", glow, noPad }: Props) {
  return (
    <section
      className={`relative rounded-xl border border-border bg-bg-surface ${noPad ? "" : "p-4"} shadow-lg hover:border-border-bright transition-colors ${
        glow ? "hover:shadow-glow" : ""
      } ${className}`}
    >
      {(title || right) && (
        <header className={`flex items-start justify-between gap-3 ${noPad ? "p-4 pb-2" : "mb-3"}`}>
          <div>
            {title && (
              <h3 className="text-sm font-semibold uppercase tracking-wider text-text-primary">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-xs text-text-secondary mt-0.5">{subtitle}</p>
            )}
          </div>
          {right && <div className="flex items-center gap-2">{right}</div>}
        </header>
      )}
      <div className={`${noPad ? "px-4 pb-4" : ""}`}>{children}</div>
    </section>
  );
}
