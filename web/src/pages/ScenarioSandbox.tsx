import { useState } from "react";
import { motion } from "framer-motion";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from "recharts";
import {
  Gamepad2,
  Play,
  AlertTriangle,
  DollarSign,
  Heart,
  MapPin,
} from "lucide-react";
import { PageWrapper } from "../components/layout/PageWrapper";
import { Card } from "../components/shared/Card";
import { MetricCard } from "../components/shared/MetricCard";
import { StatusBadge } from "../components/shared/StatusBadge";
import { useScenarioPresets, useRunScenario } from "../api/queries";
import { NETWORK_NODES } from "../data/mockNetwork";
import type { ScenarioResult, ScenarioPreset } from "../types";

// Fallback presets from the store (matching the original hardcoded values)
const FALLBACK_PRESETS: ScenarioPreset[] = [
  { name: "Suez Canal Closure (7 days)", description: "Simulates Suez Canal blockage affecting EU-Asia trade routes", seedNodes: ["AE-DXB", "NL-RTM", "DE-HAM"], severity: 0.95, betaMult: 1.5 },
  { name: "Cyclone hits Gujarat", description: "Cyclone Biparjoy-scale event closing Gujarat ports", seedNodes: ["IN-MUN", "IN-KAN", "IN-AHM"], severity: 0.90, betaMult: 1.3 },
  { name: "Fuel price spike 30%", description: "Global bunker fuel price increase raising all shipping costs", seedNodes: [], severity: 0.0, betaMult: 1.0 },
  { name: "New warehouse in Hyderabad", description: "Added capacity reduces network strain, improving recovery", seedNodes: [], severity: 0.0, betaMult: 0.8 },
];

function nodeName(id: string) {
  return NETWORK_NODES.find((n) => n.id === id)?.name ?? id;
}

export function ScenarioSandbox() {
  const { data: apiPresets } = useScenarioPresets();
  const runScenarioMutation = useRunScenario();

  const scenarioPresets: ScenarioPreset[] = (apiPresets as ScenarioPreset[] | undefined) ?? FALLBACK_PRESETS;
  const [selected, setSelected] = useState(scenarioPresets[0]?.name ?? "");
  const [scenarioResult, setScenarioResult] = useState<ScenarioResult | null>(null);

  const preset = scenarioPresets.find((p) => p.name === selected) ?? scenarioPresets[0];

  const handleRun = () => {
    if (!selected) return;
    runScenarioMutation.mutate(
      { preset_name: selected },
      {
        onSuccess: (data) => {
          setScenarioResult(data as unknown as ScenarioResult);
        },
      },
    );
  };

  const comparisonData = scenarioResult
    ? [
        { label: "Health Before", value: scenarioResult.beforeHealth, fill: "#00d4aa" },
        { label: "Health After", value: scenarioResult.afterHealth, fill: "#ef4444" },
        { label: "Affected Nodes", value: scenarioResult.affectedNodes.length, fill: "#f59e0b" },
        { label: "Cost ($K)", value: Math.round(scenarioResult.costEstimate / 1000), fill: "#8b5cf6" },
      ]
    : [];

  return (
    <PageWrapper>
      <div className="rounded-xl border border-border bg-bg-surface p-5">
        <div className="flex items-start gap-3">
          <Gamepad2 className="text-accent-purple shrink-0 mt-1" size={22} />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-display text-xl tracking-tight">Scenario Sandbox</h2>
              <StatusBadge status="live">WHAT-IF</StatusBadge>
            </div>
            <p className="text-sm text-text-secondary mt-1">
              Run preset disruptions to see impact. SIR state is fully restored after each run.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-4">
        <MetricCard label="Current Network Health" value={scenarioResult ? Math.round(scenarioResult.beforeHealth) : 0} unit="%" color="teal" icon={<Heart size={16} />} />
        <MetricCard label="Scenarios Available" value={scenarioPresets.length} color="purple" icon={<Gamepad2 size={16} />} />
      </div>

      <Card className="mt-4" title="Select Scenario" subtitle="Choose a preset disruption scenario">
        <div className="space-y-3">
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            className="w-full bg-bg-elevated border border-border rounded px-3 py-2 text-sm text-text-primary outline-none focus:border-accent-teal"
          >
            {scenarioPresets.map((p) => (
              <option key={p.name} value={p.name}>{p.name}</option>
            ))}
          </select>

          <div className="rounded-lg border border-border bg-bg-elevated p-3 text-xs text-text-secondary">
            <div className="font-semibold text-text-primary text-sm">{preset?.name}</div>
            <div className="mt-1">{preset?.description}</div>
            <div className="mt-2 font-mono text-[10px] text-text-dim space-y-0.5">
              <div>Seed nodes: {preset && preset.seedNodes.length > 0 ? preset.seedNodes.map(nodeName).join(", ") : "None"}</div>
              <div>Severity: {preset ? (preset.severity * 100).toFixed(0) : 0}% · Beta multiplier: {preset?.betaMult.toFixed(1) ?? "0"}x</div>
            </div>
          </div>

          <button
            onClick={handleRun}
            disabled={runScenarioMutation.isPending}
            className="w-full flex items-center justify-center gap-2 bg-accent-purple text-bg-base font-semibold rounded-lg px-3 py-2.5 text-xs hover:brightness-110 transition disabled:opacity-50"
          >
            {runScenarioMutation.isPending ? (
              <>Running...</>
            ) : (
              <><Play size={14} /> Run Scenario</>
            )}
          </button>
        </div>
      </Card>

      {scenarioResult && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
            <MetricCard label="Before Health" value={scenarioResult.beforeHealth} decimals={1} unit="%" color="teal" icon={<Heart size={16} />} />
            <MetricCard
              label="After Health"
              value={scenarioResult.afterHealth}
              decimals={1}
              unit="%"
              color={scenarioResult.healthDelta < -10 ? "red" : "amber"}
              icon={<AlertTriangle size={16} />}
              delta={scenarioResult.healthDelta}
            />
            <MetricCard label="Affected Nodes" value={scenarioResult.affectedNodes.length} color="amber" icon={<MapPin size={16} />} />
            <MetricCard label="Cost Estimate" value={scenarioResult.costEstimate} unit="USD" color="red" icon={<DollarSign size={16} />} />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mt-4">
            <Card title="Before vs After" subtitle="Scenario impact comparison">
              <div className="h-[300px]">
                <ResponsiveContainer>
                  <BarChart data={comparisonData}>
                    <CartesianGrid stroke="#1e2d42" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="label" stroke="#8fa4c0" fontSize={10} />
                    <YAxis stroke="#4a6278" fontSize={10} />
                    <Tooltip />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {comparisonData.map((d, i) => (
                        <Cell key={i} fill={d.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card title="Affected Nodes" subtitle={`${scenarioResult.affectedNodes.length} nodes with infection > 20%`}>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {scenarioResult.affectedNodes.map((nid) => {
                  const node = NETWORK_NODES.find((n) => n.id === nid);
                  return (
                    <div key={nid} className="flex items-center gap-2 rounded-lg border border-border bg-bg-elevated px-3 py-2 text-xs">
                      <MapPin size={12} className="text-accent-red" />
                      <span className="text-text-primary font-semibold">{node?.name ?? nid}</span>
                      <span className="text-text-dim font-mono ml-auto">{nid}</span>
                    </div>
                  );
                })}
                {scenarioResult.affectedNodes.length === 0 && (
                  <div className="py-8 text-center text-xs text-text-dim">No nodes affected.</div>
                )}
              </div>
            </Card>
          </div>
        </motion.div>
      )}
    </PageWrapper>
  );
}
