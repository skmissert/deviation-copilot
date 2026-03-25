"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { Loader2, TrendingDown, TrendingUp, Minus, Sparkles, FileText, ClipboardList, Zap, ArrowRight, CheckCircle } from "lucide-react";
import { runSimulationAgent, SimulationResult, BASELINE_RESULT } from "@/lib/agents/simulationAgent";

// ─── Delta badge ──────────────────────────────────────────────────────────────

function DeltaBadge({ baseline, scenario, lowerIsBetter }: { baseline: number; scenario: number; lowerIsBetter: boolean }) {
  const delta = scenario - baseline;
  const pct = Math.abs(Math.round((delta / baseline) * 100));
  if (Math.abs(delta) < 0.05) return <span className="flex items-center gap-0.5 text-xs text-gray-400"><Minus className="w-3 h-3" /> No change</span>;
  const isGood = lowerIsBetter ? delta < 0 : delta > 0;
  return (
    <span className={`flex items-center gap-0.5 text-xs font-semibold ${isGood ? "text-green-700" : "text-red-600"}`}>
      {isGood ? <TrendingDown className="w-3.5 h-3.5" /> : <TrendingUp className="w-3.5 h-3.5" />}
      {delta < 0 ? "▼" : "▲"} {pct}%
    </span>
  );
}

// ─── Lever card ───────────────────────────────────────────────────────────────

function LeverCard({
  icon: Icon,
  iconBg,
  title,
  subtitle,
  description,
  appLink,
  appLinkLabel,
  impacts,
  children,
  active,
}: {
  icon: React.ElementType;
  iconBg: string;
  title: string;
  subtitle: string;
  description: string;
  appLink: string;
  appLinkLabel: string;
  impacts: string[];
  children: React.ReactNode;
  active: boolean;
}) {
  return (
    <div className={`bg-white rounded-xl border-2 p-5 transition-colors ${active ? "border-blue-300 shadow-sm" : "border-gray-200"}`}>
      <div className="flex items-start gap-3 mb-4">
        <div className={`w-9 h-9 rounded-lg ${iconBg} flex items-center justify-center shrink-0`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-900">{title}</p>
          <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
        </div>
        <Link href={appLink} className="text-xs text-blue-600 hover:underline flex items-center gap-0.5 shrink-0">
          {appLinkLabel} <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      <p className="text-xs text-gray-600 leading-relaxed mb-4">{description}</p>

      {/* Slider / toggle */}
      <div className="mb-4">{children}</div>

      {/* What it improves */}
      {active && (
        <div className="border-t border-gray-100 pt-3">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1.5">Drives improvement in</p>
          <div className="flex flex-wrap gap-1">
            {impacts.map(i => (
              <span key={i} className="text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full">{i}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Slider input ─────────────────────────────────────────────────────────────

function AdoptionSlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const color = value === 0 ? "text-gray-400" : value < 50 ? "text-amber-600" : "text-blue-700";
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-baseline">
        <span className="text-xs text-gray-500">Adoption rate</span>
        <span className={`text-lg font-black ${color}`}>{value}%</span>
      </div>
      <input
        type="range" min={0} max={100} step={10} value={value}
        onChange={e => onChange(parseInt(e.target.value))}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
      />
      <div className="flex justify-between text-xs text-gray-400">
        <span>0% (off)</span>
        <span>50% partial</span>
        <span>100% full</span>
      </div>
    </div>
  );
}

// ─── Toggle ───────────────────────────────────────────────────────────────────

function Toggle({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-gray-500">{label}</span>
      <button
        onClick={() => onChange(!value)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${value ? "bg-blue-600" : "bg-gray-300"}`}
      >
        <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${value ? "translate-x-6" : "translate-x-1"}`} />
      </button>
    </div>
  );
}

// ─── Results metric row ───────────────────────────────────────────────────────

function MetricRow({
  label, baseline, scenario, format, lowerIsBetter,
}: {
  label: string; baseline: number; scenario: number | null; format: (v: number) => string; lowerIsBetter: boolean;
}) {
  const hasResult = scenario !== null;
  return (
    <div className="grid grid-cols-[1fr_100px_100px_80px] gap-2 items-center py-2.5 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-700">{label}</span>
      <span className="text-sm font-semibold text-gray-500 text-center">{format(baseline)}</span>
      <span className={`text-sm font-bold text-center ${hasResult ? "text-gray-900" : "text-gray-300"}`}>
        {hasResult ? format(scenario!) : "—"}
      </span>
      <div className="flex justify-center">
        {hasResult
          ? <DeltaBadge baseline={baseline} scenario={scenario!} lowerIsBetter={lowerIsBetter} />
          : <span className="text-xs text-gray-300">—</span>}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SimulationPage() {
  const [copilotAdoption, setCopilotAdoption] = useState(0);
  const [capaAdoption, setCapaAdoption]       = useState(0);
  const [aiTriage, setAiTriage]               = useState(false);
  const [loading, setLoading]                 = useState(false);
  const [result, setResult]                   = useState<SimulationResult | null>(null);

  const anyActive = copilotAdoption > 0 || capaAdoption > 0 || aiTriage;

  const handleRun = useCallback(async () => {
    setLoading(true);
    const r = await runSimulationAgent({
      copilot_adoption_pct: copilotAdoption,
      capa_ai_adoption_pct: capaAdoption,
      ai_triage_enabled:    aiTriage,
    });
    setResult(r);
    setLoading(false);
  }, [copilotAdoption, capaAdoption, aiTriage]);

  // Build narrative
  const narrative = result ? (() => {
    const parts: string[] = [];
    if (copilotAdoption > 0) parts.push(`AI Copilot at ${copilotAdoption}% adoption reduces investigation time from ${BASELINE_RESULT.avg_investigation_days}d to ${result.avg_investigation_days}d`);
    if (capaAdoption > 0) parts.push(`AI CAPA recommendations at ${capaAdoption}% adoption reduce CAPA cycle time from ${BASELINE_RESULT.avg_capa_days}d to ${result.avg_capa_days}d`);
    if (aiTriage) parts.push(`AI intake triage reduces queue overhead and investigator context-switching`);
    const combined = parts.join(". ");
    const suffix = result.fte_freed > 0
      ? ` Combined, this frees ${result.fte_freed} FTE of investigator capacity without adding headcount — available for higher-value quality activities.`
      : "";
    return combined + "." + suffix;
  })() : "";

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Digital Twin Simulation</h1>
        <p className="text-sm text-gray-500 mt-0.5 max-w-2xl">
          Model the operational impact of the AI features shown in this app. Each lever corresponds to a specific AI capability — set adoption rates to see the projected effect on investigation and CAPA metrics.
        </p>
      </div>

      {/* Lever cards */}
      <div className="grid grid-cols-3 gap-4">

        {/* Lever 1: AI Copilot */}
        <LeverCard
          icon={Sparkles}
          iconBg="bg-blue-600"
          title="AI Copilot — Investigation Workflow"
          subtitle="Root Cause Analysis + Summary Drafting"
          description="Investigators use AI-suggested root causes, evidence summaries, and draft investigation reports. Each step requires human review and sign-off. Adoption rate reflects what % of the investigator team is actively using these features."
          appLink="/deviations"
          appLinkLabel="See it in Deviations"
          impacts={["Investigation time", "Recurrence rate", "Investigator utilization", "FTE capacity freed"]}
          active={copilotAdoption > 0}
        >
          <AdoptionSlider value={copilotAdoption} onChange={setCopilotAdoption} />
        </LeverCard>

        {/* Lever 2: CAPA AI */}
        <LeverCard
          icon={ClipboardList}
          iconBg="bg-emerald-600"
          title="AI CAPA Recommendations"
          subtitle="CAPA Action Suggestions + Owner Assignment"
          description="AI recommends specific corrective and preventive actions based on confirmed root cause and historical CAPA patterns. Investigators review and approve before any action is created. Adoption reflects % of new CAPAs using AI recommendations."
          appLink="/capas"
          appLinkLabel="See it in CAPA Tracker"
          impacts={["CAPA cycle time", "Recurrence rate"]}
          active={capaAdoption > 0}
        >
          <AdoptionSlider value={capaAdoption} onChange={setCapaAdoption} />
        </LeverCard>

        {/* Lever 3: AI Triage */}
        <LeverCard
          icon={Zap}
          iconBg="bg-amber-500"
          title="AI Intake & Triage"
          subtitle="Auto-Classification + Routing"
          description="AI auto-classifies deviation severity and routes to the right investigator at intake — before manual review begins. Eliminates queue wait from manual triage and reduces investigator context-switching overhead."
          appLink="/deviations"
          appLinkLabel="See Intake step"
          impacts={["Investigator utilization", "Queue wait"]}
          active={aiTriage}
        >
          <Toggle value={aiTriage} onChange={setAiTriage} label="AI triage active" />
        </LeverCard>
      </div>

      {/* Run button */}
      <div className="flex justify-center">
        <button
          onClick={handleRun}
          disabled={loading || !anyActive}
          className="px-8 py-3 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 shadow-sm"
        >
          {loading
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Running simulation...</>
            : <><Sparkles className="w-4 h-4" /> Run Simulation</>}
        </button>
        {!anyActive && (
          <p className="text-xs text-gray-400 ml-4 self-center">Set at least one lever above to model a scenario</p>
        )}
      </div>

      {/* Results table */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="grid grid-cols-[1fr_100px_100px_80px] gap-2 mb-2 px-0">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Metric</span>
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide text-center">Baseline</span>
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide text-center">Scenario</span>
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide text-center">Change</span>
        </div>
        <div className="border-t border-gray-100">
          {[
            { label: "Avg Investigation Time", baseline: BASELINE_RESULT.avg_investigation_days, scenario: result?.avg_investigation_days ?? null, format: (v: number) => `${v}d`, lowerIsBetter: true },
            { label: "Avg CAPA Cycle Time", baseline: BASELINE_RESULT.avg_capa_days, scenario: result?.avg_capa_days ?? null, format: (v: number) => `${v}d`, lowerIsBetter: true },
            { label: "Investigator Utilization", baseline: BASELINE_RESULT.investigator_utilization_pct, scenario: result?.investigator_utilization_pct ?? null, format: (v: number) => `${v}%`, lowerIsBetter: true },
            { label: "Recurrence Rate", baseline: BASELINE_RESULT.recurrence_rate_pct, scenario: result?.recurrence_rate_pct ?? null, format: (v: number) => `${v}%`, lowerIsBetter: true },
            { label: "Investigator FTE Freed", baseline: 0, scenario: result ? result.fte_freed : null, format: (v: number) => v > 0 ? `${v} FTE` : "—", lowerIsBetter: false },
          ].map(m => (
            <MetricRow key={m.label} {...m} />
          ))}
        </div>

        {!result && (
          <p className="text-xs text-gray-400 text-center pt-3">
            Scenario column will populate after running simulation
          </p>
        )}
      </div>

      {/* Narrative / summary */}
      {result && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-blue-900 mb-1">Simulation complete</p>
            <p className="text-sm text-blue-800 leading-relaxed">{narrative}</p>
            <div className="flex gap-3 mt-3">
              <Link href="/deviations" className="text-xs text-blue-700 hover:underline flex items-center gap-1">
                See AI Copilot in Deviations <ArrowRight className="w-3 h-3" />
              </Link>
              <Link href="/capas" className="text-xs text-blue-700 hover:underline flex items-center gap-1">
                See AI CAPA Recommendations <ArrowRight className="w-3 h-3" />
              </Link>
              <Link href="/people-org" className="text-xs text-blue-700 hover:underline flex items-center gap-1">
                See People & Org implications <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
