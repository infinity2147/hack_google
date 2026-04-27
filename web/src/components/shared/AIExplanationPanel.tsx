import { Sparkles } from "lucide-react";
import type { ReactNode } from "react";

interface Props {
  title: string;
  children: ReactNode;
  confidence?: number;
  sources?: string;
}

export function AIExplanationPanel({ title, children, confidence, sources }: Props) {
  return (
    <div className="relative rounded-xl border border-accent-purple/25 bg-gradient-to-br from-bg-surface to-bg-elevated p-5 overflow-hidden">
      <div className="absolute inset-y-0 left-0 w-[3px] bg-gradient-to-b from-accent-purple via-accent-blue to-accent-teal" />
      <div className="flex items-center gap-2 mb-3">
        <Sparkles size={16} className="text-accent-purple" />
        <h4 className="text-sm font-semibold tracking-wide uppercase text-text-primary">
          AI Analysis · {title}
        </h4>
      </div>
      <div className="text-sm text-text-secondary leading-relaxed space-y-2">
        {children}
      </div>
      {(confidence || sources) && (
        <div className="mt-3 pt-3 border-t border-border flex flex-wrap items-center gap-3 text-[11px] text-text-dim">
          {confidence !== undefined && (
            <span>
              Confidence:{" "}
              <span className="text-accent-teal font-mono">
                {(confidence * 100).toFixed(0)}%
              </span>
            </span>
          )}
          {sources && <span>Based on: {sources}</span>}
          <span className="ml-auto text-accent-purple uppercase tracking-wider">
            Powered by Gemini 1.5 Pro
          </span>
        </div>
      )}
    </div>
  );
}
