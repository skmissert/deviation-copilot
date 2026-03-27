"use client";

import React, { Fragment, useMemo } from "react";
import Link from "next/link";
import {
  UserCircle, Sparkles, Zap, TrendingDown, TrendingUp, ArrowRight,
  CheckCircle, AlertTriangle, Users, Brain, Minus, ChevronUp, ChevronDown,
} from "lucide-react";
import { PROCESS_CASES, VARIANTS } from "@/lib/data/processEvents";
import { capas } from "@/lib/data/capas";
import { deviations } from "@/lib/data/deviations";
import { isOverdue } from "@/lib/utils";
import { BASELINE_RESULT } from "@/lib/agents/simulationAgent";

// ─── Legend constants ────────────────────────────────────────────────────────
const LEGEND = [
  { key: "HUMAN",     Icon: UserCircle, color: "#6b7280", label: "Human" },
  { key: "HUMAN_AI",  Icon: Sparkles,   color: "#2563eb", label: "Human + AI" },
  { key: "AUTOMATED", Icon: Zap,        color: "#16a34a", label: "Fully Automated" },
] as const;

// ─── Simulation constants ────────────────────────────────────────────────────
const AVG_INV_DAYS   = 12.5;
const AI_INV_DAYS    = parseFloat((BASELINE_RESULT.avg_investigation_days * (1 - 0.35)).toFixed(1));
const QUEUE_WAIT     = 6.2;
const BASELINE_UTIL  = 84;
const AI_UTIL        = 55;
const FTE_FREED      = 0.5;
const INV_TARGET_DAYS = 14;

// ─── Work classification ──────────────────────────────────────────────────────
type WorkMode = "human" | "human+ai" | "automated";

interface ModeConfig {
  label: string;
  bg: string;
  border: string;
  text: string;
  iconColor: string;
  Icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
}

const MODE: Record<WorkMode, ModeConfig> = {
  human: {
    label: "Human",
    bg: "bg-gray-100", border: "border-gray-300", text: "text-gray-600",
    iconColor: "text-gray-500", Icon: UserCircle,
  },
  "human+ai": {
    label: "Human + AI",
    bg: "bg-blue-50", border: "border-blue-300", text: "text-blue-700",
    iconColor: "text-blue-600", Icon: Sparkles,
  },
  automated: {
    label: "Fully Automated",
    bg: "bg-green-50", border: "border-green-300", text: "text-green-700",
    iconColor: "text-green-600", Icon: Zap,
  },
};

// ─── Process workflow steps (preserved from existing file) ────────────────────
const STEPS: { name: string; today: WorkMode; future: WorkMode }[] = [
  { name: "Deviation\nFlagged",       today: "human",     future: "automated"  },
  { name: "Investigation\nInitiated", today: "human",     future: "human+ai"   },
  { name: "Root Cause\nAnalysis",     today: "human",     future: "human+ai"   },
  { name: "CAPA\nDecision",           today: "human",     future: "human"      },
  { name: "CAPA\nInitiated",          today: "human",     future: "automated"  },
  { name: "Review &\nSign-off",       today: "human",     future: "human"      },
  { name: "Closure",                  today: "human",     future: "automated"  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function StepBox({ name, mode }: { name: string; mode: WorkMode }) {
  const m = MODE[mode];
  const Icon = m.Icon;
  return (
    <div className={`flex flex-col items-center justify-center gap-1 px-1.5 py-2 rounded-lg border-2 ${m.bg} ${m.border} w-full`}>
      <Icon className={`w-3.5 h-3.5 ${m.iconColor} shrink-0`} />
      <div className="text-center leading-tight">
        {name.split("\n").map((l, i) => (
          <div key={i} className={`text-[9px] font-semibold ${m.text}`}>{l}</div>
        ))}
      </div>
    </div>
  );
}

function ProcessFlow() {
  return (
    <div className="overflow-x-auto pb-1">
      <div className="flex items-start gap-0.5" style={{ minWidth: 540 }}>
        {/* Row labels */}
        <div className="flex flex-col gap-2 shrink-0 w-9 pr-1">
          <div className="h-[60px] flex items-center justify-end">
            <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Today</span>
          </div>
          <div className="h-[60px] flex items-center justify-end">
            <span className="text-[9px] font-black uppercase tracking-widest text-green-600">Future</span>
          </div>
        </div>
        {/* Step columns aligned Today / Future */}
        {STEPS.map((step, i) => (
          <Fragment key={i}>
            <div className="flex flex-col gap-2 flex-1">
              <StepBox name={step.name} mode={step.today} />
              <StepBox name={step.name} mode={step.future} />
            </div>
            {i < STEPS.length - 1 && (
              <div className="flex flex-col gap-2 items-center w-3 shrink-0">
                <div className="h-[60px] flex items-center">
                  <span className="text-gray-300 text-xs">›</span>
                </div>
                <div className="h-[60px] flex items-center">
                  <span className="text-gray-200 text-xs">›</span>
                </div>
              </div>
            )}
          </Fragment>
        ))}
      </div>
    </div>
  );
}

function DataCallout({ label, value, sub, status }: {
  label: string; value: string; sub: string; status: "ok" | "warn" | "neutral";
}) {
  const color = status === "ok" ? "text-green-700" : status === "warn" ? "text-amber-600" : "text-gray-700";
  const bg    = status === "ok" ? "bg-green-50 border-green-200" : status === "warn" ? "bg-amber-50 border-amber-200" : "bg-gray-50 border-gray-200";
  return (
    <div className={`rounded-lg border p-3 ${bg}`}>
      <p className="text-[10px] text-gray-500 uppercase tracking-wide font-medium mb-0.5">{label}</p>
      <p className={`text-lg font-bold ${color}`}>{value}</p>
      <p className="text-[10px] text-gray-400 leading-tight">{sub}</p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PeopleOrgPage() {
  // Live data computations
  const avgCycleTime = useMemo(
    () => Math.round(PROCESS_CASES.reduce((s, c) => s + c.total_cycle_days, 0) / PROCESS_CASES.length),
    [],
  );
  const noCapaPct = useMemo(
    () => Math.round((VARIANTS.find(v => v.id === 2)?.pct ?? 0)),
    [],
  );
  const capaSequencingViolations = useMemo(
    () => PROCESS_CASES.filter(c => c.variant_id === 4).length,
    [],
  );
  const escalationCount = useMemo(
    () => PROCESS_CASES.filter(c => c.variant_id === 5).length,
    [],
  );
  const agingCapas = useMemo(
    () => capas.filter(c => isOverdue(c.due_date, c.effectiveness_check_status)).length,
    [],
  );
  const recurringPct = useMemo(
    () => Math.round((deviations.filter(d => d.recurrence_flag === 1).length / deviations.length) * 100),
    [],
  );

  return (
    <div className="space-y-0">

      {/* ── PAGE HEADER ─────────────────────────────────────────────────────── */}
      <div className="bg-gray-900 rounded-xl p-6 mb-6">
        <p className="text-green-400 text-xs font-semibold uppercase tracking-widest mb-1">People &amp; Org Implications</p>
        <h1 className="text-2xl font-bold text-white mb-2">
          Reimagining Work: People &amp; Org Implications for Deviation Management
        </h1>
        <p className="text-gray-400 text-sm max-w-3xl">
          AI doesn&apos;t just change what the system does — it changes what people do, how teams are structured, and what skills matter. This page maps those implications.
        </p>
        {/* Legend row */}
        <div className="flex gap-6 mt-4">
          {LEGEND.map(({ Icon, color, label }) => (
            <div key={label} className="flex items-center gap-1.5">
              <Icon style={{ color }} className="w-4 h-4" />
              <span className="text-sm text-gray-300">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── ROWS ────────────────────────────────────────────────────────────── */}
      <div className="space-y-4">

        {/* ── ROW 1: TASKS ──────────────────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="grid grid-cols-[220px_1fr_220px] gap-6 items-start">

            {/* Left: anchor question */}
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold mb-2">Tasks</p>
              <p className="text-green-700 font-bold text-base leading-snug">
                Which deviation management tasks do we automate, augment, or keep human?
              </p>
            </div>

            {/* Center: process flow visual (preserved exactly) */}
            <div className="space-y-3">
              <ProcessFlow />
              <p className="text-[10px] text-gray-400 italic leading-relaxed">
                CAPA Decision is kept fully Human — GxP accountability requires investigator sign-off at every step. All AI output requires human confirmation before any record is created.
              </p>
            </div>

            {/* Right: data callouts */}
            <div className="space-y-2">
              <DataCallout
                label="Avg cycle time"
                value={`${avgCycleTime}d`}
                sub="target: 30d"
                status={avgCycleTime > 30 ? "warn" : "ok"}
              />
              <DataCallout
                label="Queue wait time"
                value={`${QUEUE_WAIT}d`}
                sub="before investigation starts"
                status="warn"
              />
              <DataCallout
                label="Cycle time with AI"
                value={`${Math.round(avgCycleTime * 0.7)}d`}
                sub="Digital Twin projection (−30%)"
                status="ok"
              />
              <DataCallout
                label="Path without CAPA"
                value={`${VARIANTS.find(v => v.id === 2)?.pct ?? 34}%`}
                sub="no CAPA required"
                status="neutral"
              />
            </div>
          </div>
        </div>

        {/* ── ROW 2: TALENT ─────────────────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="grid grid-cols-[220px_1fr_220px] gap-6 items-start">

            {/* Left: anchor question */}
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold mb-2">Talent</p>
              <p className="text-green-700 font-bold text-base leading-snug">
                What skills and roles do we need — and in what quantity?
              </p>
            </div>

            {/* Center: three skill columns */}
            <div>
              <div className="grid grid-cols-3 gap-3">

                {/* Evergreen */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <CheckCircle className="w-3.5 h-3.5 text-green-600 shrink-0" />
                    <p className="text-xs font-bold text-green-700">Evergreen Skills</p>
                  </div>
                  <p className="text-[10px] text-green-600 mb-2">Remain critical — never deprioritized</p>
                  <ul className="space-y-1">
                    {[
                      "GMP regulatory knowledge",
                      "Deviation investigation judgment",
                      "Root cause analysis expertise",
                      "Escalation decision-making",
                      "Accountability and sign-off ownership",
                    ].map(s => (
                      <li key={s} className="text-[10px] text-green-800 flex items-start gap-1">
                        <span className="text-green-500 shrink-0 mt-0.5">•</span>{s}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Emerging */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <TrendingUp className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <p className="text-xs font-bold text-blue-700">Emerging Skills</p>
                  </div>
                  <p className="text-[10px] text-blue-600 mb-2">New or significantly elevated</p>
                  <ul className="space-y-1">
                    {[
                      "AI output validation & oversight",
                      "Data interpretation & pattern recognition",
                      "Cross-functional coordination",
                      "Agent & workflow orchestration",
                      "Process improvement mindset",
                    ].map(s => (
                      <li key={s} className="text-[10px] text-blue-800 flex items-start gap-1">
                        <span className="text-blue-400 shrink-0 mt-0.5">•</span>{s}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Deprioritized */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <TrendingDown className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <p className="text-xs font-bold text-gray-600">Deprioritized</p>
                  </div>
                  <p className="text-[10px] text-gray-500 mb-2">Manual &amp; routine tasks only</p>
                  <ul className="space-y-1">
                    {[
                      "Manual data entry & documentation",
                      "Report formatting & transcription",
                      "CAPA sequencing coordination",
                      "Manual search across records",
                    ].map(s => (
                      <li key={s} className="text-[10px] text-gray-500 flex items-start gap-1">
                        <span className="text-gray-400 shrink-0 mt-0.5">•</span>{s}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* From/To bar */}
              <div className="mt-4 bg-gray-100 rounded-lg p-3 flex items-center gap-3">
                <div className="text-xs text-gray-500 shrink-0">Today</div>
                <div className="flex-1 flex items-center gap-2 min-w-0">
                  <div className="bg-gray-400 rounded px-2 py-1 text-white text-xs font-semibold whitespace-nowrap">
                    1.0 FTE manual investigation
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400 shrink-0" />
                  <div className="bg-green-600 rounded px-2 py-1 text-white text-xs font-semibold whitespace-nowrap">
                    0.5 FTE redeployed to complex cases
                  </div>
                </div>
                <div className="text-xs text-green-700 font-semibold shrink-0">Future</div>
              </div>
            </div>

            {/* Right: data callouts */}
            <div className="space-y-2">
              <DataCallout
                label="Investigator utilization"
                value={`${BASELINE_UTIL}%`}
                sub="target: <80%"
                status="warn"
              />
              <DataCallout
                label="Utilization with AI"
                value={`${AI_UTIL}%`}
                sub="Digital Twin projection"
                status="ok"
              />
              <DataCallout
                label="Capacity released"
                value={`${FTE_FREED} FTE`}
                sub="redeployed to complex cases"
                status="ok"
              />
              <DataCallout
                label="Avg investigation"
                value={`${AVG_INV_DAYS}d → ${AI_INV_DAYS}d`}
                sub={`target: ≤${INV_TARGET_DAYS}d`}
                status="ok"
              />
            </div>
          </div>
        </div>

        {/* ── ROW 3: TEAMS ──────────────────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="grid grid-cols-[220px_1fr_220px] gap-6 items-start">

            {/* Left: anchor question */}
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold mb-2">Teams</p>
              <p className="text-green-700 font-bold text-base leading-snug">
                How do teams need to restructure to deliver the reimagined workflow?
              </p>
            </div>

            {/* Center: two pyramid org diagrams */}
            <div className="grid grid-cols-2 gap-6">

              {/* Today pyramid */}
              <div className="flex flex-col items-center gap-1">
                <p className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-2">Today</p>
                {/* Tier 1 (top) — narrowest */}
                <div className="flex justify-center w-full">
                  <div className="bg-gray-300 border border-gray-400 rounded px-3 py-1 text-xs text-gray-700 font-medium text-center w-36">
                    CAPA Review Board
                  </div>
                </div>
                {/* Tier 2 */}
                <div className="flex justify-center w-full">
                  <div className="bg-gray-200 border border-gray-300 rounded px-3 py-1 text-xs text-gray-600 font-medium text-center w-44">
                    Senior QA Investigator
                  </div>
                </div>
                {/* Tier 3 (bottom) — widest */}
                <div className="flex gap-1 justify-center w-full flex-wrap">
                  {["INV-01", "INV-02", "INV-03", "INV-04"].map(id => (
                    <div key={id} className="bg-gray-100 border border-gray-300 rounded px-2 py-1 text-[10px] text-gray-500 w-16 text-center">
                      {id}
                    </div>
                  ))}
                </div>
                {/* Reactive escalation arrow */}
                <div className="flex flex-col items-center mt-1">
                  <span className="text-[9px] text-gray-400">Reactive escalation ↑</span>
                </div>
                <div className="mt-1 text-center">
                  <span className="text-[10px] text-gray-400 italic">Reactive, siloed, sequential</span>
                </div>
              </div>

              {/* Future pyramid */}
              <div className="flex flex-col items-center gap-1 relative">
                <p className="text-[9px] font-black uppercase tracking-widest text-green-600 mb-2">Future</p>
                {/* Tier 1 (top) */}
                <div className="flex justify-center w-full">
                  <div className="bg-green-100 border border-green-300 rounded px-3 py-1 text-xs text-green-800 font-medium w-36 text-center">
                    QA Leadership
                  </div>
                </div>
                {/* AI routing band */}
                <div className="w-full bg-green-100 border border-green-300 rounded text-[10px] text-green-700 font-semibold text-center py-0.5 px-2">
                  ⚡ AI Routing Layer
                </div>
                {/* Tier 2 — wider */}
                <div className="flex gap-1 justify-center w-full">
                  <div className="bg-green-50 border border-green-200 rounded px-2 py-1 text-[10px] text-green-700 text-center w-28">
                    AI-Enabled Reviewers
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded px-2 py-1 text-[10px] text-green-700 text-center w-28">
                    Cross-functional Coordinators
                  </div>
                </div>
                {/* Tier 3 (bottom) — narrower */}
                <div className="flex gap-1 justify-center w-full">
                  <div className="bg-green-50 border border-green-300 rounded px-2 py-1 text-[10px] text-green-600 w-24 text-center">
                    Investigator ×2
                  </div>
                </div>
                {/* Net new roles dotted box */}
                <div className="absolute -right-2 top-8 border border-dashed border-blue-400 rounded p-1.5 w-28 text-[9px] text-blue-600 leading-tight">
                  Net new roles TBD — e.g. AI Workflow Coordinators
                </div>
                <div className="mt-1 text-center">
                  <span className="text-[10px] text-green-600 italic font-medium">
                    Integrated, cross-functional, AI-orchestrated
                  </span>
                </div>
              </div>
            </div>

            {/* Right: data callouts */}
            <div className="space-y-2">
              <DataCallout
                label="CAPA sequencing issues"
                value={`${capaSequencingViolations}`}
                sub="CAPAs created before investigation complete"
                status={capaSequencingViolations > 0 ? "warn" : "ok"}
              />
              <DataCallout
                label="Escalated deviations"
                value={`${escalationCount}`}
                sub="routed to CAPA Review Board"
                status="neutral"
              />
              <DataCallout
                label="Overdue CAPAs"
                value={`${agingCapas}`}
                sub="beyond 90-day target"
                status={agingCapas > 0 ? "warn" : "ok"}
              />
              <DataCallout
                label="Recurring deviation rate"
                value={`${recurringPct}%`}
                sub="primary effectiveness measure"
                status={recurringPct >= 15 ? "warn" : "ok"}
              />
            </div>
          </div>
        </div>

        {/* ── BOTTOM CALLOUT ──────────────────────────────────────────────── */}
        <div className="bg-green-700 rounded-xl p-6 text-center mt-6">
          <p className="text-white text-lg font-bold max-w-3xl mx-auto leading-relaxed">
            &ldquo;The digital twin tells you a 30% cycle time improvement is possible. This is what has to change in your organization to actually get there.&rdquo;
          </p>
        </div>

        {/* Footer nav */}
        <div className="flex items-center justify-between pb-4">
          <Link href="/capas" className="text-sm text-gray-400 hover:text-gray-600 flex items-center gap-1">
            ← CAPA Tracker
          </Link>
          <Link href="/simulation" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
            Explore Digital Twin Simulator <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
