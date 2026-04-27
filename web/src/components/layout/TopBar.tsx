import { useLocation } from "react-router-dom";
import { Bell, Search, ShieldCheck } from "lucide-react";
import { useNexus } from "../../store/nexusStore";
import { LivePulseDot } from "../shared/LivePulseDot";

const PAGE_TITLES: Record<string, { title: string; sub: string }> = {
  "/": { title: "Command Center", sub: "Live operational dashboard" },
  "/network": { title: "Global Supply Chain Network", sub: "31 nodes · 48 weighted lanes" },
  "/epidemiology": { title: "Epidemiological Model", sub: "Network SIR · R₀ · Herd Immunity" },
  "/immune": { title: "Immune Intelligence", sub: "Antibody memory · cosine similarity τ = 0.82" },
  "/market": { title: "Route Market", sub: "Multi-agent Vickrey auction · 7 carriers" },
  "/documents": { title: "Document Intelligence", sub: "GraphSAGE on trade entity graphs" },
  "/crowd": { title: "Crowd & Acoustic Intelligence", sub: "Waze for supply chains · 8 languages" },
};

export function TopBar() {
  const loc = useLocation();
  const meta = PAGE_TITLES[loc.pathname] ?? PAGE_TITLES["/"];
  const { alerts, R0 } = useNexus();
  const r0Color =
    R0 >= 2 ? "text-accent-red glow-red" : R0 >= 1 ? "text-accent-amber glow-amber" : "text-accent-green";

  return (
    <header className="sticky top-0 z-30 backdrop-blur bg-bg-base/80 border-b border-border">
      <div className="px-6 py-3 flex items-center gap-6">
        <div className="min-w-0">
          <h1 className="text-display text-lg leading-tight tracking-tight truncate">
            {meta.title}
          </h1>
          <p className="text-xs text-text-secondary truncate">{meta.sub}</p>
        </div>
        <div className="flex-1" />
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-bg-surface w-72">
          <Search size={14} className="text-text-dim" />
          <input
            placeholder="Search nodes, suppliers, antibodies..."
            className="bg-transparent flex-1 text-xs outline-none placeholder:text-text-dim"
          />
          <kbd className="text-[10px] text-text-dim border border-border rounded px-1.5 py-0.5">⌘K</kbd>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 rounded-lg border border-border bg-bg-surface px-3 py-1.5">
            <span className="text-[10px] uppercase tracking-widest text-text-secondary">R₀</span>
            <span className={`text-sm font-mono font-semibold ${r0Color}`}>
              {R0.toFixed(2)}
            </span>
          </div>
          <div className="hidden md:flex items-center gap-2 rounded-lg border border-border bg-bg-surface px-3 py-1.5">
            <ShieldCheck size={14} className="text-accent-purple" />
            <span className="text-xs text-text-secondary">Immune</span>
            <LivePulseDot color="purple" size={6} />
          </div>
          <button className="relative rounded-lg border border-border bg-bg-surface p-2 hover:border-accent-teal transition">
            <Bell size={14} />
            {alerts.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-accent-red text-bg-base rounded-full text-[9px] font-bold px-1.5">
                {alerts.length}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
