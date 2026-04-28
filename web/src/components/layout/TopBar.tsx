import { useLocation, useNavigate } from "react-router-dom";
import { Bell, Search } from "lucide-react";
import { useState, useCallback } from "react";
import { useNexus } from "../../store/nexusStore";

const SEARCH_INDEX = [
  { label: "Command Center", path: "/" },
  { label: "Global Network", path: "/network" },
  { label: "Epidemiological Model", path: "/epidemiology" },
  { label: "Immune Intelligence", path: "/immune" },
  { label: "Route Market", path: "/market" },
  { label: "Document Intelligence", path: "/documents" },
  { label: "Live Traffic & Routes", path: "/traffic" },
  { label: "Shipment Tracker", path: "/shipments" },
  { label: "Scenario Sandbox", path: "/scenarios" },
  { label: "Network Trends", path: "/trends" },
  { label: "Decision History", path: "/decisions" },
];

const PAGE_TITLES: Record<string, { title: string; sub: string }> = {
  "/": { title: "Command Center", sub: "Live operational dashboard" },
  "/network": { title: "Global Supply Chain Network", sub: "31 nodes · 48 weighted lanes" },
  "/epidemiology": { title: "Epidemiological Model", sub: "Network SIR · R₀ · Herd Immunity" },
  "/immune": { title: "Immune Intelligence", sub: "Antibody memory · cosine similarity τ = 0.82" },
  "/market": { title: "Route Market", sub: "Multi-agent Vickrey auction · 7 carriers" },
  "/documents": { title: "Document Intelligence", sub: "GraphSAGE on trade entity graphs" },
  "/traffic": { title: "Live Traffic & Routes", sub: "Real-time congestion · shipment tracking · Google Maps" },
};

export function TopBar() {
  const loc = useLocation();
  const navigate = useNavigate();
  const meta = PAGE_TITLES[loc.pathname] ?? PAGE_TITLES["/"];
  const { alerts, R0 } = useNexus();
  const r0Color =
    R0 >= 2 ? "text-accent-red glow-red" : R0 >= 1 ? "text-accent-amber glow-amber" : "text-accent-green";

  const [query, setQuery] = useState("");
  const [showResults, setShowResults] = useState(false);

  const results = query.trim().length > 0
    ? SEARCH_INDEX.filter(item => item.label.toLowerCase().includes(query.toLowerCase()))
    : [];

  const handleSelect = useCallback((path: string) => {
    navigate(path);
    setQuery("");
    setShowResults(false);
  }, [navigate]);

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
        {/* Search bar */}
        <div className="hidden md:flex relative items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-bg-surface w-72">
          <Search size={14} className="text-text-dim" />
          <input
            value={query}
            onChange={e => { setQuery(e.target.value); setShowResults(true); }}
            onFocus={() => setShowResults(true)}
            onBlur={() => setTimeout(() => setShowResults(false), 150)}
            placeholder="Search nodes, pages, routes..."
            className="bg-transparent flex-1 text-xs outline-none placeholder:text-text-dim"
          />
          <kbd className="text-[10px] text-text-dim border border-border rounded px-1.5 py-0.5">⌘K</kbd>
          {showResults && results.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-bg-elevated border border-border rounded-lg overflow-hidden shadow-lg z-50">
              {results.map(r => (
                <button
                  key={r.path}
                  onMouseDown={() => handleSelect(r.path)}
                  className="w-full text-left px-3 py-2 text-xs text-text-primary hover:bg-accent-teal/10 hover:text-accent-teal transition-colors"
                >
                  {r.label}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 rounded-lg border border-border bg-bg-surface px-3 py-1.5">
            <span className="text-[10px] uppercase tracking-widest text-text-secondary">R₀</span>
            <span className={`text-sm font-mono font-semibold ${r0Color}`}>
              {R0.toFixed(2)}
            </span>
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