"use client";

import { useState, useCallback } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Cell
} from "recharts";
import { Loader2, TrendingDown, TrendingUp, Minus, Sparkles, Info } from "lucide-react";
import { runSimulationAgent, SimulationResult, BASELINE_RESULT } from "@/lib/agents/simulationAgent";

interface MetricRow {
  label: string;
  key: keyof SimulationResult;
  format: (v: number) => string;
  lowerIsBetter: boolean;
  unit?: string;
}

const METRICS: MetricRow[] = [
  { label: "Avg Investigation Time", key: "avg_investigation_days", format: v => `${v} days`, lowerIsBetter: true },
  { label: "Avg CAPA Cycle Time", key: "avg_capa_days", format: v => `${v} days`, lowerIsBetter: true },
  { label: "Investigator Utilization", key: "investigator_utilization_pct", format: v => `${v}%`, lowerIsBetter: true, unit: "%" },
  { label: "Monthly Throughput", key: "monthly_throughput", format: v => `${v} / month`, lowerIsBetter: false },
  { label: "Active Backlog", key: "backlog_size", format: v => `${v} deviations`, lowerIsBetter: true },
  { label: "Recurrence Rate", key: "recurrence_rate_pct", format: v => `${v}%`, lowerIsBetter: true },
  { label: "Investigator FTE Freed", key: "fte_freed", format: v => v > 0 ? `${v} FTE` : "—", lowerIsBetter: false },
];

function DeltaBadge({ baseline, scenario, lowerIsBetter }: { baseline: number; scenario: number; lowerIsBetter: boolean }) {
  if (baseline === 0) return <span className="text-gray-400 text-xs">—</span>;
  const delta = scenario - baseline;
  const pct = Math.abs(Math.round((delta / baseline) * 100));
  if (Math.abs(delta) < 0.01) return <span className="flex items-center gap-0.5 text-xs text-gray-400"><Minus className="w-3 h-3" /> No change</span>;
  const isGood = lowerIsBetter ? delta < 0 : delta > 0;
  return (
    <span className={`flex items-center gap-0.5 text-xs font-semibold ${isGood ? "text-green-700" : "text-red-600"}`}>
      {isGood ? <TrendingDown className="w-3.5 h-3.5" /> : <TrendingUp className="w-3.5 h-3.5" />}
      {delta < 0 ? "▼" : "▲"} {pct}%
    </span>
  );
}

function SliderInput({ label, min, max, step, value, onChange, format }: {
  label: string; min: number; max: number; step: number; value: number;
  onChange: (v: number) => void; format: (v: number) => string;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-sm font-bold text-blue-700">{format(value)}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
      />
      <div className="flex justify-between text-xs text-gray-400">
        <span>{format(min)}</span>
        <span>{format(max)}</span>
      </div>
    </div>
  );
}

export default function SimulationPage() {
  const [aiEnabled, setAiEnabled] = useState(true);
  const [investigatorFte, setInvestigatorFte] = useState(4.7);
  const [arrivalMultiplier, setArrivalMultiplier] = useState(1.0);
  const [capaImprovement, setCapaImprovement] = useState(0);
  const [loading, setLoading] = useState(false);
  const [scenarioResult, setScenarioResult] = useState<SimulationResult | null>(null);
  const [hasRun, setHasRun] = useState(false);

  const handleRunSimulation = useCallback(async () => {
    setLoading(true);
    const result = await runSimulationAgent({
      ai_enabled: aiEnabled,
      investigator_fte: investigatorFte,
      arrival_rate_multiplier: arrivalMultiplier,
      capa_improvement_pct: capaImprovement,
    });
    setScenarioResult(result);
    setHasRun(true);
    setLoading(false);
  }, [aiEnabled, investigatorFte, arrivalMultiplier, capaImprovement]);

  const chartData = [
    {
      name: "Investigation\nTime (days)",
      baseline: BASELINE_RESULT.avg_investigation_days,
      scenario: scenarioResult?.avg_investigation_days ?? BASELINE_RESULT.avg_investigation_days,
    },
    {
      name: "CAPA Cycle\nTime (days)",
      baseline: BASELINE_RESULT.avg_capa_days,
      scenario: scenarioResult?.avg_capa_days ?? BASELINE_RESULT.avg_capa_days,
    },
    {
      name: "Backlog\n(deviations)",
      baseline: BASELINE_RESULT.backlog_size,
      scenario: scenarioResult?.backlog_size ?? BASELINE_RESULT.backlog_size,
    },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Digital Twin Simulation</h1>
        <p className="text-sm text-gray-500 mt-0.5">Model the operational impact of AI assistance and capacity changes on your deviation investigation workflow</p>
      </div>

      {/* Three-panel layout */}
      <div className="grid grid-cols-3 gap-4">
        {/* Panel 1: Baseline */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h2 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-gray-400 inline-block" />
            Current State (Baseline)
            <span className="text-xs font-normal text-gray-400 ml-1">Single site · 6-month period</span>
          </h2>
          <div className="space-y-2.5">
            {METRICS.filter(m => m.key !== "fte_freed").map(m => (
              <div key={m.key} className="flex justify-between items-center py-1.5 border-b border-gray-100 last:border-0">
                <span className="text-sm text-gray-600">{m.label}</span>
                <span className="text-sm font-semibold text-gray-900">{m.format(BASELINE_RESULT[m.key] as number)}</span>
              </div>
            ))}
            <div className="pt-2 border-t border-gray-200">
              <p className="text-xs text-gray-400">Deviation arrival rate: 8/month · 4.7 FTE investigators · 101 hrs/week capacity</p>
            </div>
          </div>
        </div>

        {/* Panel 2: Controls */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h2 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
            Scenario Controls
          </h2>
          <div className="space-y-5">
            {/* AI Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">AI Assistance</p>
                <p className="text-xs text-gray-400">Reduces investigation time by 35%, CAPA by 25%</p>
              </div>
              <button
                onClick={() => setAiEnabled(v => !v)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${aiEnabled ? "bg-blue-600" : "bg-gray-300"}`}
              >
                <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${aiEnabled ? "translate-x-6" : "translate-x-1"}`} />
              </button>
            </div>

            {aiEnabled && (
              <div className="rounded-md bg-blue-50 border border-blue-100 p-2.5 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                <p className="text-xs text-blue-700">AI copilot active: reduces investigation research time, surfaces root causes faster, and improves CAPA targeting.</p>
              </div>
            )}

            <SliderInput
              label="Investigator FTE"
              min={2.0} max={10.0} step={0.1}
              value={investigatorFte}
              onChange={setInvestigatorFte}
              format={v => `${v.toFixed(1)} FTE`}
            />

            <SliderInput
              label="Deviation Arrival Rate"
              min={0.7} max={1.5} step={0.05}
              value={arrivalMultiplier}
              onChange={setArrivalMultiplier}
              format={v => v === 1.0 ? "Baseline (8/mo)" : `${v > 1 ? "+" : ""}${Math.round((v - 1) * 100)}% (${Math.round(8 * v)}/mo)`}
            />

            <SliderInput
              label="CAPA Process Improvement"
              min={0} max={0.4} step={0.05}
              value={capaImprovement}
              onChange={setCapaImprovement}
              format={v => v === 0 ? "None" : `${Math.round(v * 100)}% reduction`}
            />

            <button
              onClick={handleRunSimulation}
              disabled={loading}
              className="w-full py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-md hover:bg-blue-700 disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Running simulation...</>
              ) : (
                <><Sparkles className="w-4 h-4" /> Run Simulation</>
              )}
            </button>
          </div>
        </div>

        {/* Panel 3: Results */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h2 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
            Scenario Results
            {!hasRun && <span className="text-xs font-normal text-gray-400 ml-1">— run simulation to see changes</span>}
          </h2>
          {!hasRun ? (
            <div className="flex flex-col items-center justify-center h-48 text-center">
              <Sparkles className="w-8 h-8 text-gray-300 mb-2" />
              <p className="text-sm text-gray-400">Configure your scenario and click</p>
              <p className="text-sm text-gray-400 font-medium">"Run Simulation"</p>
            </div>
          ) : (
            <div className="space-y-1">
              <div className="grid grid-cols-3 gap-1 text-xs text-gray-400 font-medium uppercase tracking-wide px-1 mb-1">
                <span>Metric</span>
                <span className="text-center">Scenario</span>
                <span className="text-center">Change</span>
              </div>
              {METRICS.map(m => {
                const baselineVal = BASELINE_RESULT[m.key] as number;
                const scenarioVal = (scenarioResult?.[m.key] ?? baselineVal) as number;
                return (
                  <div key={m.key} className="grid grid-cols-3 gap-1 items-center py-1.5 border-b border-gray-100 last:border-0 px-1">
                    <span className="text-xs text-gray-600 leading-tight">{m.label}</span>
                    <span className="text-center text-sm font-semibold text-gray-900">{m.format(scenarioVal)}</span>
                    <div className="flex justify-center">
                      <DeltaBadge baseline={baselineVal} scenario={scenarioVal} lowerIsBetter={m.lowerIsBetter} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Chart */}
      {hasRun && scenarioResult && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-800 mb-4">Baseline vs. Scenario Comparison</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ fontSize: 12 }} />
              <Bar dataKey="baseline" name="Baseline" fill="#9ca3af" radius={[4, 4, 0, 0]} />
              <Bar dataKey="scenario" name="Scenario" fill="#2563eb" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex gap-6 justify-center mt-2">
            <span className="flex items-center gap-1.5 text-xs text-gray-500"><span className="w-3 h-3 rounded bg-gray-400 inline-block" /> Baseline</span>
            <span className="flex items-center gap-1.5 text-xs text-gray-500"><span className="w-3 h-3 rounded bg-blue-600 inline-block" /> Scenario</span>
          </div>
        </div>
      )}

      {/* Narrative */}
      {hasRun && scenarioResult && (
        <div className={`rounded-lg border p-4 ${aiEnabled ? "bg-blue-50 border-blue-200" : "bg-gray-50 border-gray-200"}`}>
          <div className="flex items-start gap-3">
            <Info className={`w-5 h-5 mt-0.5 shrink-0 ${aiEnabled ? "text-blue-600" : "text-gray-400"}`} />
            <div>
              <p className={`text-sm font-semibold mb-1 ${aiEnabled ? "text-blue-900" : "text-gray-700"}`}>
                {aiEnabled ? "AI Assistance Impact Summary" : "Scenario Summary (No AI)"}
              </p>
              <p className="text-sm text-gray-700 leading-relaxed">
                {aiEnabled
                  ? `With AI assistance${investigatorFte !== 4.7 ? ` and ${investigatorFte.toFixed(1)} FTE investigators` : ""}, investigation time drops from ${BASELINE_RESULT.avg_investigation_days} to ${scenarioResult.avg_investigation_days} days (${Math.round((1 - scenarioResult.avg_investigation_days / BASELINE_RESULT.avg_investigation_days) * 100)}% faster). CAPA cycle time reduces to ${scenarioResult.avg_capa_days} days. ${scenarioResult.fte_freed > 0 ? `The equivalent of ${scenarioResult.fte_freed} FTE is freed for higher-value quality work — without adding headcount.` : ""} Investigator utilization drops to ${scenarioResult.investigator_utilization_pct}%, reducing burnout risk and enabling proactive quality activities.`
                  : `Without AI assistance, investigator utilization is ${scenarioResult.investigator_utilization_pct}% with an active backlog of ${scenarioResult.backlog_size} deviation${scenarioResult.backlog_size !== 1 ? "s" : ""}. Investigation time remains at ${scenarioResult.avg_investigation_days} days. Consider enabling AI assistance to reduce cycle times and free investigator capacity.`}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
