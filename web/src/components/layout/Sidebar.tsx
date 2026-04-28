import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Globe,
  Activity,
  Shield,
  Gavel,
  FileSearch,
  Users,
  Zap,
  RotateCcw,
  Play,
  ChevronDown,
  ChevronRight,
  Package,
  Gamepad2,
  TrendingUp,
  ClipboardList,
} from "lucide-react";
import { useState } from "react";
import { useNexus } from "../../store/nexusStore";
import { NETWORK_NODES } from "../../data/mockNetwork";
import { LivePulseDot } from "../shared/LivePulseDot";

const NAV = [
  { to: "/", label: "Command Center", icon: LayoutDashboard },
  { to: "/network", label: "Global Network", icon: Globe },
  { to: "/epidemiology", label: "Epidemiological Model", icon: Activity },
  { to: "/immune", label: "Immune Intelligence", icon: Shield },
  { to: "/market", label: "Route Market", icon: Gavel },
  { to: "/documents", label: "Document Scanner", icon: FileSearch },
  { to: "/traffic", label: "Live Traffic & Routes", icon: Users },
  { to: "/shipments", label: "Shipment Tracker", icon: Package },
  { to: "/scenarios", label: "Scenario Sandbox", icon: Gamepad2 },
  { to: "/trends", label: "Network Trends", icon: TrendingUp },
  { to: "/decisions", label: "Decision History", icon: ClipboardList },
];

export function Sidebar() {
  const {
    seedNode,
    seedSeverity,
    setSeedNode,
    setSeedSeverity,
    seedDisruption,
    step1,
    stepN,
    resetSim,
    beta,
    gamma,
    setBeta,
    setGamma,
    R0,
  } = useNexus();

  const [paramsOpen, setParamsOpen] = useState(true);
  const [simOpen, setSimOpen] = useState(true);

  const r0Color =
    R0 >= 2 ? "text-accent-red" : R0 >= 1 ? "text-accent-amber" : "text-accent-green";
  const herd = R0 > 1 ? 1 - 1 / R0 : 0;

  return (
    <aside className="w-64 shrink-0 hidden lg:flex flex-col border-r border-border bg-bg-surface/95 backdrop-blur sticky top-0 h-screen z-20">
      {/* Brand */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <svg
            viewBox="0 0 64 64"
            className="w-9 h-9 animate-slow-spin"
            aria-hidden
          >
            <defs>
              <linearGradient id="dna" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#00d4aa" />
                <stop offset="100%" stopColor="#3b82f6" />
              </linearGradient>
            </defs>
            <path
              d="M20 12 C44 22, 44 42, 20 52"
              stroke="url(#dna)"
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M44 12 C20 22, 20 42, 44 52"
              stroke="#00d4aa"
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
              opacity="0.85"
            />
            <circle cx="32" cy="20" r="2.5" fill="#00d4aa" />
            <circle cx="32" cy="32" r="2.5" fill="#3b82f6" />
            <circle cx="32" cy="44" r="2.5" fill="#8b5cf6" />
          </svg>
          <div>
            <div className="text-display text-lg leading-none tracking-tight">NEXUS</div>
            <div className="text-[10px] text-text-secondary tracking-wider">
              NEURAL SUPPLY ORGANISM
            </div>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2 text-[10px] text-text-secondary">
          <span>v1.0</span>
          <span>·</span>
          <span className="flex items-center gap-1.5">
            <LivePulseDot color="green" size={6} /> LIVE
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="px-2 py-3 border-b border-border">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              `group flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? "bg-accent-teal/10 text-accent-teal ring-1 ring-accent-teal/20"
                  : "text-text-secondary hover:text-text-primary hover:bg-bg-hover"
              }`
            }
          >
            <item.icon size={16} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Simulation controls */}
      <div className="px-3 py-3 border-b border-border space-y-3">
        <button
          onClick={() => setSimOpen((o) => !o)}
          className="flex items-center w-full text-[10px] uppercase tracking-widest text-text-secondary hover:text-text-primary"
        >
          {simOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          <span className="ml-1">Simulation Controls</span>
        </button>
        {simOpen && (
          <div className="space-y-3">
            <div>
              <label className="text-[10px] uppercase tracking-wider text-text-secondary">
                Seed Node
              </label>
              <select
                value={seedNode}
                onChange={(e) => setSeedNode(e.target.value)}
                className="w-full mt-1 bg-bg-elevated border border-border rounded px-2 py-1.5 text-xs text-text-primary focus:border-accent-teal outline-none"
              >
                {NETWORK_NODES.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <div className="flex justify-between text-[10px] uppercase tracking-wider text-text-secondary">
                <span>Severity</span>
                <span className="font-mono text-accent-teal">
                  {seedSeverity.toFixed(2)}
                </span>
              </div>
              <input
                type="range"
                min={0.3}
                max={1.0}
                step={0.05}
                value={seedSeverity}
                onChange={(e) => setSeedSeverity(parseFloat(e.target.value))}
                className="w-full mt-1"
              />
            </div>
            <button
              onClick={seedDisruption}
              className="w-full flex items-center justify-center gap-2 bg-accent-teal text-bg-base font-semibold rounded-lg px-3 py-2 text-xs hover:brightness-110 transition"
            >
              <Zap size={14} /> Seed Disruption
            </button>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                onClick={step1}
                className="flex items-center justify-center gap-1 border border-border rounded px-2 py-1.5 text-[11px] text-text-secondary hover:border-accent-teal hover:text-accent-teal transition"
              >
                <Play size={10} /> Step
              </button>
              <button
                onClick={() => stepN(10)}
                className="border border-border rounded px-2 py-1.5 text-[11px] text-text-secondary hover:border-accent-teal hover:text-accent-teal transition"
              >
                ×10
              </button>
              <button
                onClick={() => stepN(50)}
                className="border border-border rounded px-2 py-1.5 text-[11px] text-text-secondary hover:border-accent-teal hover:text-accent-teal transition"
              >
                ×50
              </button>
            </div>
            <button
              onClick={resetSim}
              className="w-full flex items-center justify-center gap-2 border border-accent-red/40 text-accent-red rounded-lg px-3 py-1.5 text-xs hover:bg-accent-red/10 transition"
            >
              <RotateCcw size={12} /> Reset
            </button>
          </div>
        )}
      </div>

      {/* SIR params */}
      <div className="px-3 py-3 border-b border-border space-y-3 flex-1 overflow-y-auto">
        <button
          onClick={() => setParamsOpen((o) => !o)}
          className="flex items-center w-full text-[10px] uppercase tracking-widest text-text-secondary hover:text-text-primary"
        >
          {paramsOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          <span className="ml-1">SIR Parameters</span>
        </button>
        {paramsOpen && (
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-[10px] uppercase tracking-wider text-text-secondary">
                <span>β · transmission</span>
                <span className="font-mono text-accent-teal">{beta.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min={0.05}
                max={0.8}
                step={0.01}
                value={beta}
                onChange={(e) => setBeta(parseFloat(e.target.value))}
                className="w-full mt-1"
              />
            </div>
            <div>
              <div className="flex justify-between text-[10px] uppercase tracking-wider text-text-secondary">
                <span>γ · recovery</span>
                <span className="font-mono text-accent-teal">{gamma.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min={0.01}
                max={0.4}
                step={0.01}
                value={gamma}
                onChange={(e) => setGamma(parseFloat(e.target.value))}
                className="w-full mt-1"
              />
            </div>
            <div className="rounded-lg border border-border bg-bg-elevated p-3 font-mono text-[11px] space-y-1.5">
              <div className="flex justify-between">
                <span className="text-text-secondary">R₀ = β/γ ·k̄</span>
                <span className={`font-semibold ${r0Color}`}>{R0.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">pₒ = 1−1/R₀</span>
                <span className="text-accent-teal">
                  {(herd * 100).toFixed(1)}%
                </span>
              </div>
              <div className="text-[10px] text-text-dim leading-tight pt-1">
                {R0 >= 1 ? "CASCADE RISK · reroute fraction" : "SELF-CONTAINING"}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="px-4 py-3 border-t border-border text-[10px] text-text-dim">
        Built with Google Cloud · Gemini · Vertex AI · Flutter
      </div>
    </aside>
  );
}
