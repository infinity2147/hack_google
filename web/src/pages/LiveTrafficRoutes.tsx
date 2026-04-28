import { useState, useMemo, useCallback } from "react";
import { APIProvider, Map, AdvancedMarker, Pin } from "@vis.gl/react-google-maps";
import {
  Activity,
  AlertTriangle,
  Package,
  Truck,
  Clock,
  Navigation,
} from "lucide-react";
import { PageWrapper } from "../components/layout/PageWrapper";
import { Card } from "../components/shared/Card";
import { MetricCard } from "../components/shared/MetricCard";
import { StatusBadge } from "../components/shared/StatusBadge";
import { SeverityBar } from "../components/shared/SeverityBar";
import { useNexus } from "../store/nexusStore";
import { NETWORK_NODES, NETWORK_EDGES } from "../data/mockNetwork";
import { formatCurrency } from "../utils/formatters";
import type { SupplyChainNode } from "../types";

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string || "";

// Major trade route polylines (simplified coordinates)
const TRADE_ROUTES = [
  { name: "JNPT → Singapore", color: "#3b82f6", coords: [[18.95, 72.95], [1.35, 103.82]], status: "active" as const },
  { name: "Mundra → Dubai", color: "#f59e0b", coords: [[22.73, 69.72], [25.02, 55.08]], status: "delayed" as const },
  { name: "Chennai → Rotterdam", color: "#3b82f6", coords: [[13.10, 80.30], [1.35, 103.82], [4.48, 51.92]], status: "active" as const },
  { name: "Kolkata → Hamburg", color: "#ef4444", coords: [[22.57, 88.34], [13.10, 80.30], [1.35, 103.82], [4.48, 51.92], [9.99, 53.55]], status: "disrupted" as const },
  { name: "JNPT → Rotterdam", color: "#3b82f6", coords: [[18.95, 72.95], [25.02, 55.08], [4.48, 51.92]], status: "active" as const },
  { name: "Singapore → Shanghai", color: "#22c55e", coords: [[1.35, 103.82], [31.23, 121.47]], status: "active" as const },
  { name: "Dubai → Durban", color: "#3b82f6", coords: [[25.02, 55.08], [-29.88, 31.05]], status: "active" as const },
];

const CONGESTION_ZONES = [
  { lat: 18.95, lng: 72.95, radius: 25000, severity: 0.78, label: "JNPT Congestion" },
  { lat: 22.73, lng: 69.72, radius: 18000, severity: 0.52, label: "Mundra Delay" },
  { lat: 1.35, lng: 103.82, radius: 30000, severity: 0.31, label: "Singapore Hub" },
  { lat: 13.10, lng: 80.30, radius: 15000, severity: 0.64, label: "Chennai Congestion" },
];

export function LiveTrafficRoutes() {
  const { runtime, R0 } = useNexus();
  const [selectedNode, setSelectedNode] = useState<SupplyChainNode | null>(null);
  const [mapLayer, setMapLayer] = useState<"traffic" | "nodes" | "routes">("traffic");

  const sirCounts = useMemo(() => {
    let S = 0, I = 0, R = 0;
    for (const id of Object.keys(runtime)) {
      const s = runtime[id].state;
      if (s === "S") S++; else if (s === "I") I++; else R++;
    }
    return { S, I, R };
  }, [runtime]);

  const nodeRisk = useCallback((id: string) => runtime[id]?.infection ?? 0, [runtime]);

  // If no API key, show fallback
  if (!API_KEY) {
    return (
      <PageWrapper>
        <div className="rounded-xl border border-border bg-bg-surface p-5">
          <div className="flex items-start gap-3">
            <Navigation className="text-accent-teal shrink-0 mt-1" size={22} />
            <div>
              <h2 className="text-display text-xl tracking-tight">Live Traffic & Routes</h2>
              <p className="text-sm text-text-secondary mt-1">
                Real-time congestion, shipment routes, and port status on Google Maps.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-accent-amber/30 bg-accent-amber/5 p-6 text-center">
          <Navigation className="mx-auto text-accent-amber mb-3" size={32} />
          <h3 className="text-lg text-text-primary font-semibold">Google Maps API Key Required</h3>
          <p className="text-sm text-text-secondary mt-2 max-w-lg mx-auto">
            Set <code className="bg-bg-elevated px-1.5 py-0.5 rounded text-accent-teal font-mono">VITE_GOOGLE_MAPS_API_KEY</code> in your <code className="bg-bg-elevated px-1.5 py-0.5 rounded text-accent-teal font-mono">.env</code> file to enable the live map.
          </p>
          <div className="mt-4 rounded-lg border border-border bg-bg-elevated p-3 font-mono text-xs text-text-secondary max-w-md mx-auto text-left">
            <div className="text-text-dim"># web/.env</div>
            <div>VITE_GOOGLE_MAPS_API_KEY=your_api_key_here</div>
          </div>
          <p className="text-xs text-text-dim mt-3">
            Requires "Maps JavaScript API" enabled in Google Cloud Console.
          </p>
        </div>

        {/* Show summary stats even without map */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
          <MetricCard label="Network Health" value={Math.round((1 - sirCounts.I / 31) * 100)} unit="%" color="teal" icon={<Activity size={16} />} />
          <MetricCard label="Congestion Zones" value={CONGESTION_ZONES.length} color="amber" icon={<AlertTriangle size={16} />} />
          <MetricCard label="Active Routes" value={TRADE_ROUTES.filter(r => r.status === "active").length} color="blue" icon={<Package size={16} />} />
          <MetricCard label="Disrupted Routes" value={TRADE_ROUTES.filter(r => r.status === "disrupted").length} color="red" icon={<Truck size={16} />} />
        </div>

        {/* Show congestion zone list */}
        <Card className="mt-4" title="Congestion Zones" subtitle="Port congestion hotspots">
          <div className="space-y-3">
            {CONGESTION_ZONES.sort((a, b) => b.severity - a.severity).map((z) => (
              <div key={z.label} className="flex items-center gap-3 rounded-lg border border-border bg-bg-elevated p-3">
                <AlertTriangle size={14} className={z.severity > 0.6 ? "text-accent-red" : "text-accent-amber"} />
                <div className="flex-1">
                  <div className="text-xs text-text-primary">{z.label}</div>
                  <div className="text-[10px] text-text-dim font-mono">{z.lat.toFixed(2)}°N, {z.lng.toFixed(2)}°E · {z.radius / 1000}km radius</div>
                </div>
                <SeverityBar value={z.severity} height={4} labelDecimals={2} />
              </div>
            ))}
          </div>
        </Card>

        {/* Show routes table */}
        <Card className="mt-4" title="Trade Route Status" subtitle="Major shipping lanes">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-[10px] uppercase tracking-wider text-text-secondary border-b border-border">
                  <th className="px-3 py-2 text-left">Route</th>
                  <th className="px-3 py-2 text-center">Status</th>
                  <th className="px-3 py-2 text-right">Waypoints</th>
                </tr>
              </thead>
              <tbody>
                {TRADE_ROUTES.map((r) => (
                  <tr key={r.name} className="border-b border-border hover:bg-bg-hover">
                    <td className="px-3 py-2 text-text-primary font-medium">{r.name}</td>
                    <td className="px-3 py-2 text-center">
                      <StatusBadge status={r.status === "active" ? "live" : r.status === "delayed" ? "alert" : "critical"} size="sm" />
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-text-secondary">{r.coords.length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </PageWrapper>
    );
  }

  // Full Google Maps view
  return (
    <PageWrapper>
      <div className="rounded-xl border border-border bg-bg-surface p-5">
        <div className="flex items-start gap-3">
          <Navigation className="text-accent-teal shrink-0 mt-1" size={22} />
          <div>
            <h2 className="text-display text-xl tracking-tight">Live Traffic & Routes</h2>
            <p className="text-sm text-text-secondary mt-1">
              Real-time congestion, shipment routes, and port status on Google Maps.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
        <MetricCard label="Network Health" value={Math.round((1 - sirCounts.I / 31) * 100)} unit="%" color="teal" icon={<Activity size={16} />} />
        <MetricCard label="Congestion Zones" value={CONGESTION_ZONES.length} color="amber" icon={<AlertTriangle size={16} />} />
        <MetricCard label="Active Routes" value={TRADE_ROUTES.filter(r => r.status === "active").length} color="blue" icon={<Package size={16} />} />
        <MetricCard label="R-Effective" value={R0} decimals={2} color={R0 >= 1 ? "amber" : "green"} icon={<Clock size={16} />} />
      </div>

      {/* Map layer toggle */}
      <div className="flex items-center gap-1 mt-4 p-1 bg-bg-surface rounded-lg border border-border">
        {[
          { key: "traffic" as const, label: "Traffic" },
          { key: "nodes" as const, label: "Port Nodes" },
          { key: "routes" as const, label: "Trade Routes" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setMapLayer(t.key)}
            className={`flex-1 text-[11px] font-semibold uppercase tracking-wider py-2 rounded-md transition ${mapLayer === t.key ? "bg-accent-teal/10 text-accent-teal" : "text-text-dim hover:text-text-secondary"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Google Map */}
      <Card className="mt-4" right={<StatusBadge status="live">LIVE</StatusBadge>}>
        <div className="rounded-lg overflow-hidden" style={{ height: 520 }}>
          <APIProvider apiKey={API_KEY}>
            <Map
              defaultCenter={{ lat: 18.0, lng: 70.0 }}
              defaultZoom={4}
              mapId="nexus-live-traffic"
              gestureHandling="greedy"
              disableDefaultUI={false}
              mapTypeId={mapLayer === "traffic" ? "roadmap" : "hybrid"}
            >
              {/* Port markers */}
              {(mapLayer === "nodes" || mapLayer === "traffic") &&
                NETWORK_NODES.map((n) => {
                  const rt = runtime[n.id];
                  const state = rt?.state ?? "S";
                  const infection = rt?.infection ?? 0;
                  const color = state === "I" ? (infection > 0.5 ? "#ef4444" : "#f59e0b") : state === "R" ? "#22c55e" : "#3b82f6";
                  return (
                    <AdvancedMarker
                      key={n.id}
                      position={{ lat: n.lat, lng: n.lng }}
                      title={`${n.name} (${state})`}
                      onClick={() => setSelectedNode(selectedNode?.id === n.id ? null : n)}
                    >
                      <Pin background={color} borderColor="#0d1521" glyphColor="#fff" scale={state === "I" ? 1.3 : 0.9} />
                    </AdvancedMarker>
                  );
                })
              }
            </Map>
          </APIProvider>
        </div>
      </Card>

      {/* Selected node detail */}
      {selectedNode && (
        <Card className="mt-4" title={selectedNode.name} subtitle={`${selectedNode.type.replace("_", " ")} · ${selectedNode.country}`}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-text-secondary">SIR State</div>
              <StatusBadge status={runtime[selectedNode.id]?.state === "I" ? "critical" : runtime[selectedNode.id]?.state === "R" ? "immune" : "live"} />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-text-secondary">Infection</div>
              <div className="text-display text-lg text-accent-amber">{(nodeRisk(selectedNode.id)).toFixed(2)}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-text-secondary">Trade Volume</div>
              <div className="text-display text-lg text-accent-teal">${selectedNode.tradeVolumeB}B/yr</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-text-secondary">Risk Score</div>
              <SeverityBar value={nodeRisk(selectedNode.id) * 0.7 + 0.15} height={6} labelDecimals={2} />
            </div>
          </div>
        </Card>
      )}

      {/* Route status + congestion */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mt-4">
        <Card title="Trade Route Status" subtitle="Major shipping lanes">
          <div className="space-y-2">
            {TRADE_ROUTES.map((r) => (
              <div key={r.name} className="flex items-center gap-3 rounded-lg border border-border bg-bg-elevated p-3">
                <div className="h-2 w-2 rounded-full" style={{ background: r.color }} />
                <div className="flex-1 text-xs text-text-primary">{r.name}</div>
                <StatusBadge status={r.status === "active" ? "live" : r.status === "delayed" ? "alert" : "critical"} size="sm" />
              </div>
            ))}
          </div>
        </Card>

        <Card title="Congestion Hotspots" subtitle="Ports with highest congestion">
          <div className="space-y-3">
            {CONGESTION_ZONES.sort((a, b) => b.severity - a.severity).map((z) => (
              <div key={z.label} className="flex items-center gap-3">
                <AlertTriangle size={14} className={z.severity > 0.6 ? "text-accent-red" : "text-accent-amber"} />
                <div className="flex-1">
                  <div className="text-xs text-text-primary">{z.label}</div>
                  <div className="text-[10px] text-text-dim">{z.radius / 1000}km radius</div>
                </div>
                <SeverityBar value={z.severity} height={4} labelDecimals={2} />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </PageWrapper>
  );
}
