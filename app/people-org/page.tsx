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
  { key: "HUMAN",     Icon: UserCircle, color: "#7c3aed", label: "Human" },
  { key: "HUMAN_AI",  Icon: Sparkles,   color: "#2563eb", label: "Human + AI" },
  { key: "AUTOMATED", Icon: Zap,        color: "#059669", label: "Fully Automated" },
] as const;

// ─── Investigator time allocation (illustrative) ─────────────────────────────
// Independent color scheme — NOT tied to Talent row skill categories
type AllocCat = "reduced" | "retained" | "netnew";

const TIME_ALLOC: { label: string; today: number; futureDevMgmt: number; barCat: AllocCat }[] = [
  { label: "Manual documentation & data entry", today: 25, futureDevMgmt:  5, barCat: "reduced"  },
  { label: "System data entry (Veeva)",          today: 15, futureDevMgmt:  5, barCat: "reduced"  },
  { label: "Rework & iteration on root cause",   today: 20, futureDevMgmt:  5, barCat: "reduced"  },
  { label: "CAPA coordination",                  today:  5, futureDevMgmt:  5, barCat: "reduced"  },
  { label: "Root cause investigation",           today: 15, futureDevMgmt: 15, barCat: "retained" },
  { label: "Review & sign-off",                  today: 10, futureDevMgmt: 10, barCat: "retained" },
  { label: "Cross-functional alignment",         today:  5, futureDevMgmt:  5, barCat: "retained" },
  { label: "AI output validation",               today:  0, futureDevMgmt:  5, barCat: "netnew"   },
  { label: "Process improvement activities",     today:  0, futureDevMgmt:  0, barCat: "netnew"   },
];

// Self-contained bar color scheme — independent of Talent row
const BAR_COLORS: Record<AllocCat, { color: string; label: string }> = {
  reduced:  { color: "#9ca3af", label: "Reduced by AI"         },
  retained: { color: "#15803d", label: "Retained or increased"  },
  netnew:   { color: "#2563eb", label: "Net new activities"     },
};

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
    bg: "bg-violet-50", border: "border-violet-300", text: "text-violet-700",
    iconColor: "text-violet-600", Icon: UserCircle,
  },
  "human+ai": {
    label: "Human + AI",
    bg: "bg-blue-50", border: "border-blue-300", text: "text-blue-700",
    iconColor: "text-blue-600", Icon: Sparkles,
  },
  automated: {
    label: "Fully Automated",
    bg: "bg-emerald-50", border: "border-emerald-300", text: "text-emerald-700",
    iconColor: "text-emerald-600", Icon: Zap,
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
    <div className={`flex flex-col items-center justify-center gap-1 px-1.5 py-2 rounded-lg border-2 ${m.bg} ${m.border} w-full h-[60px]`}>
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
      <div className="flex items-start gap-0.5" style={{ minWidth: 560 }}>
        {/* Row labels */}
        <div className="flex flex-col gap-2 shrink-0 w-14">
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
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">

          {/* Top: workflow view */}
          <div className="grid grid-cols-[220px_1fr_220px] gap-6 items-start">
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold mb-2">Tasks</p>
              <p className="text-green-700 font-bold text-base leading-snug">
                Which deviation management tasks do we automate, augment, or keep human?
              </p>
            </div>
            <div className="space-y-3">
              <ProcessFlow />
              <p className="text-[10px] text-gray-400 italic leading-relaxed">
                CAPA Decision is kept fully Human — GxP accountability requires investigator sign-off at every step. All AI output requires human confirmation before any record is created.
              </p>
            </div>
            <div className="space-y-2">
              <DataCallout label="Cycle time — Today" value={`${avgCycleTime}d`} sub="current state, target: 30d" status={avgCycleTime > 30 ? "warn" : "ok"} />
              <DataCallout label="Cycle time — Future" value={`${Math.round(avgCycleTime * 0.7)}d`} sub="with AI assistance (Digital Twin, −30%)" status="ok" />
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-100" />

          {/* Sub-section: Investigator time allocation */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <p className="text-sm font-bold text-gray-800">What This Means for the Individual Investigator</p>
              <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">Illustrative</span>
            </div>
            <div className="grid grid-cols-[1fr_200px] gap-6 items-start">

              {/* Time allocation chart — Today vs Future */}
              <div className="space-y-2">

                {/* Legend — self-contained, independent of Talent row */}
                <div className="flex flex-wrap gap-3 mb-1">
                  {[
                    { color: "#9ca3af", label: "Reduced by AI"          },
                    { color: "#15803d", label: "Retained or increased"   },
                    { color: "#f59e0b", label: "Freed — returned to org" },
                    { color: "#2563eb", label: "Net new activities"      },
                  ].map(({ color, label }) => (
                    <span key={label} className="flex items-center gap-1.5 text-[10px] text-gray-600">
                      <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ backgroundColor: color }} />
                      {label}
                    </span>
                  ))}
                </div>

                {/* BAR 1 — Today */}
                <div className="flex items-center gap-3">
                  <div className="w-16 shrink-0 text-right pr-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Today</span>
                  </div>
                  <div className="flex-1 flex h-10 rounded overflow-hidden border border-gray-200">
                    {/* Manual 25% — grey */}
                    <div title="Manual documentation & data entry: 25%" style={{ flex: 25, backgroundColor: "#9ca3af" }}
                      className="flex items-center justify-center border-r border-gray-400/30 overflow-hidden">
                      <span className="text-[9px] font-bold text-white">25%</span>
                    </div>
                    {/* Veeva 15% — grey */}
                    <div title="System data entry (Veeva): 15%" style={{ flex: 15, backgroundColor: "#9ca3af" }}
                      className="flex items-center justify-center border-r border-gray-400/30 overflow-hidden">
                      <span className="text-[9px] font-bold text-white">15%</span>
                    </div>
                    {/* Rework 20% — grey */}
                    <div title="Rework & iteration on root cause: 20%" style={{ flex: 20, backgroundColor: "#9ca3af" }}
                      className="flex items-center justify-center border-r border-gray-400/30 overflow-hidden">
                      <span className="text-[9px] font-bold text-white">20%</span>
                    </div>
                    {/* CAPA coord 5% — grey (reduced/routine) */}
                    <div title="CAPA coordination: 5%" style={{ flex: 5, backgroundColor: "#9ca3af" }}
                      className="flex items-center justify-center border-r border-white/40 overflow-hidden" />
                    {/* Root cause 15% — dark green */}
                    <div title="Root cause investigation: 15%" style={{ flex: 15, backgroundColor: "#15803d" }}
                      className="flex items-center justify-center border-r border-green-900/20 overflow-hidden">
                      <span className="text-[9px] font-bold text-white">15%</span>
                    </div>
                    {/* Review 10% — dark green */}
                    <div title="Review & sign-off: 10%" style={{ flex: 10, backgroundColor: "#15803d" }}
                      className="flex items-center justify-center border-r border-green-900/20 overflow-hidden">
                      <span className="text-[9px] font-bold text-white">10%</span>
                    </div>
                    {/* Cross-func 5% — dark green (grows in future) */}
                    <div title="Cross-functional alignment: 5%" style={{ flex: 5, backgroundColor: "#15803d" }}
                      className="flex items-center justify-center overflow-hidden" />
                  </div>
                </div>

                {/* Spacer between bars */}
                <div className="h-1" />

                {/* BAR 2 — Future State */}
                <div className="flex items-start gap-3">
                  <div className="w-16 shrink-0 text-right pr-1 pt-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-green-700">Future</span>
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex h-10 rounded overflow-hidden border border-gray-200">
                      {/* 45% freed — amber, returned to org */}
                      <div title="45% freed — returned to broader organization" style={{ flex: 45, backgroundColor: "#f59e0b" }}
                        className="flex items-center justify-center border-r border-amber-400 overflow-hidden px-1">
                        <span className="text-[9px] font-bold text-amber-950 text-center leading-tight whitespace-nowrap">45% → org</span>
                      </div>
                      {/* 5% manual — grey */}
                      <div title="Manual documentation: 5% remains" style={{ flex: 5, backgroundColor: "#9ca3af" }}
                        className="flex items-center justify-center border-r border-gray-400/30 overflow-hidden" />
                      {/* 5% Veeva — grey */}
                      <div title="System data entry: 5% remains" style={{ flex: 5, backgroundColor: "#9ca3af" }}
                        className="flex items-center justify-center border-r border-gray-400/30 overflow-hidden" />
                      {/* 5% rework — grey */}
                      <div title="Rework: 5% remains" style={{ flex: 5, backgroundColor: "#9ca3af" }}
                        className="flex items-center justify-center border-r border-gray-400/30 overflow-hidden" />
                      {/* 5% CAPA coord — grey (reduced) */}
                      <div title="CAPA coordination: 5% remains" style={{ flex: 5, backgroundColor: "#9ca3af" }}
                        className="flex items-center justify-center border-r border-white/40 overflow-hidden" />
                      {/* Root cause 15% — dark green */}
                      <div title="Root cause investigation: 15%" style={{ flex: 15, backgroundColor: "#15803d" }}
                        className="flex items-center justify-center border-r border-green-900/20 overflow-hidden">
                        <span className="text-[9px] font-bold text-white">15%</span>
                      </div>
                      {/* Review 10% — dark green */}
                      <div title="Review & sign-off: 10%" style={{ flex: 10, backgroundColor: "#15803d" }}
                        className="flex items-center justify-center border-r border-green-900/20 overflow-hidden">
                        <span className="text-[9px] font-bold text-white">10%</span>
                      </div>
                      {/* Cross-func 5% — dark green */}
                      <div title="Cross-functional alignment: 5%" style={{ flex: 5, backgroundColor: "#15803d" }}
                        className="flex items-center justify-center border-r border-green-900/20 overflow-hidden" />
                      {/* AI validation 5% — blue (net new) */}
                      <div title="AI output validation: 5% — net new activity" style={{ flex: 5, backgroundColor: "#2563eb" }}
                        className="flex items-center justify-center overflow-hidden" />
                    </div>
                    {/* Annotation row */}
                    <div className="flex text-[9px] leading-tight">
                      <div style={{ flex: 45 }} className="text-amber-700 font-semibold">Freed — APQR, batch<br/>disposition, other QA</div>
                      <div style={{ flex: 20 }} className="text-gray-400 text-center">20% routine<br/>remains</div>
                      <div style={{ flex: 35 }} className="text-green-700 text-right">30% core +<br/>5% net new</div>
                    </div>
                  </div>
                </div>

                {/* Activity key */}
                <div className="grid grid-cols-3 gap-x-4 gap-y-0.5 pt-1 pb-1">
                  {TIME_ALLOC.filter(a => a.today > 0 || a.futureDevMgmt > 0).map(a => (
                    <div key={a.label} className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-sm shrink-0" style={{ backgroundColor: BAR_COLORS[a.barCat].color }} />
                      <span className="text-[9px] text-gray-500 truncate">{a.label}</span>
                    </div>
                  ))}
                </div>

                {/* FTE flow bar */}
                <div className="bg-gray-100 rounded-lg p-2.5 flex items-center gap-2 flex-wrap mt-1">
                  <div className="bg-gray-400 rounded px-2 py-1 text-white text-xs font-semibold whitespace-nowrap">
                    Today: 1.0 FTE
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <div className="rounded px-2 py-1 text-xs font-semibold whitespace-nowrap" style={{ backgroundColor: "#f59e0b", color: "#78350f" }}>
                    AI frees 0.5 FTE
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <div className="rounded px-2 py-1 text-xs font-semibold whitespace-nowrap bg-amber-100 border border-amber-300 text-amber-800">
                    0.5 FTE returned to organization
                  </div>
                </div>

                {/* Bottom callout */}
                <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                  <p className="text-[11px] text-green-800 font-medium">
                    AI returns ~45% of investigator time to the organization — capacity that funds the next reinvention wave.
                  </p>
                </div>
              </div>

              {/* Right: investigator data callouts (moved from Talent row) */}
              <div className="space-y-2">
                <DataCallout label="Investigator utilization" value={`${BASELINE_UTIL}%`} sub="target: <80%" status="warn" />
                <DataCallout label="Utilization with AI" value={`${AI_UTIL}%`} sub="Digital Twin projection" status="ok" />
                <DataCallout label="Capacity released" value={`${FTE_FREED} FTE`} sub="returned to organization — available for batch disposition, APQR, complaints handling, or other priorities" status="ok" />
                <DataCallout label="Avg investigation" value={`${AVG_INV_DAYS}d → ${AI_INV_DAYS}d`} sub={`target: ≤${INV_TARGET_DAYS}d`} status="ok" />
              </div>
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

            </div>

            {/* Right: empty — all metrics live in the Tasks row sub-section */}
            <div />
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
            <div className="space-y-4">
              <div className="flex gap-4 items-start justify-center">

                {/* ── TODAY pyramid ── */}
                <div className="flex flex-col items-center" style={{ width: 200 }}>
                  <p className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-3">Today</p>
                  {/* Top — narrowest */}
                  <div className="flex justify-center w-full" style={{ paddingInline: "30%" }}>
                    <div className="w-full bg-violet-50 border border-violet-300 rounded py-1.5 text-[10px] text-violet-700 font-semibold text-center flex flex-col items-center gap-0.5">
                      <UserCircle className="w-3 h-3 text-violet-600" />
                      CAPA Review Board
                    </div>
                  </div>
                  <div className="text-gray-300 text-xs leading-none my-0.5">↑</div>
                  {/* Middle */}
                  <div className="flex justify-center w-full" style={{ paddingInline: "15%" }}>
                    <div className="w-full bg-violet-50 border border-violet-300 rounded py-1.5 text-[10px] text-violet-700 font-semibold text-center flex flex-col items-center gap-0.5">
                      <UserCircle className="w-3 h-3 text-violet-600" />
                      Senior QA Investigator
                    </div>
                  </div>
                  <div className="text-gray-300 text-xs leading-none my-0.5">↑</div>
                  {/* Bottom — full width */}
                  <div className="w-full grid grid-cols-2 gap-1">
                    {["QA Investigator", "QA Investigator", "QA Investigator", "QA Investigator"].map((r, i) => (
                      <div key={i} className="bg-violet-50 border border-violet-300 rounded py-1 text-[9px] text-violet-700 text-center flex flex-col items-center gap-0.5">
                        <UserCircle className="w-2.5 h-2.5 text-violet-600" />{r}
                      </div>
                    ))}
                  </div>
                  <p className="text-[9px] text-gray-400 italic mt-3 text-center">Reactive, siloed, sequential</p>
                </div>

                {/* Arrow */}
                <div className="flex items-center self-center pt-2">
                  <ArrowRight className="w-6 h-6 text-green-500" />
                </div>

                {/* ── FUTURE pyramid ── */}
                <div className="flex flex-col items-center" style={{ width: 220 }}>
                  <p className="text-[9px] font-black uppercase tracking-widest text-green-600 mb-3">Future</p>
                  {/* Top — same narrow */}
                  <div className="flex justify-center w-full" style={{ paddingInline: "30%" }}>
                    <div className="w-full bg-violet-50 border border-violet-300 rounded py-1.5 text-[10px] text-violet-700 font-semibold text-center flex flex-col items-center gap-0.5">
                      <UserCircle className="w-3 h-3 text-violet-600" />
                      QA Leadership
                    </div>
                  </div>
                  <div className="text-gray-300 text-xs leading-none my-0.5">↕</div>
                  {/* AI Routing band — spans full width */}
                  <div className="w-full bg-emerald-600 rounded py-1 text-[10px] text-white font-semibold text-center flex items-center justify-center gap-1">
                    <Zap className="w-3 h-3" /> AI Routing Layer
                  </div>
                  <div className="text-gray-300 text-xs leading-none my-0.5">↕</div>
                  {/* Middle — wider than today */}
                  <div className="w-full grid grid-cols-2 gap-1">
                    <div className="bg-blue-50 border border-blue-300 rounded py-1.5 text-[9px] text-blue-700 font-medium text-center flex flex-col items-center gap-0.5">
                      <Sparkles className="w-2.5 h-2.5 text-blue-600" />
                      AI-Enabled<br/>Reviewers
                    </div>
                    <div className="bg-blue-50 border border-blue-300 rounded py-1.5 text-[9px] text-blue-700 font-medium text-center flex flex-col items-center gap-0.5">
                      <Sparkles className="w-2.5 h-2.5 text-blue-600" />
                      Cross-functional<br/>Coordinators
                    </div>
                  </div>
                  <div className="text-gray-300 text-xs leading-none my-0.5">↕</div>
                  {/* Bottom — narrower than today */}
                  <div className="flex justify-center w-full" style={{ paddingInline: "25%" }}>
                    <div className="w-full bg-violet-50 border border-violet-300 rounded py-1.5 text-[9px] text-violet-700 font-medium text-center flex flex-col items-center gap-0.5">
                      <UserCircle className="w-2.5 h-2.5 text-violet-600" />
                      Investigators ×2
                    </div>
                  </div>
                  <p className="text-[9px] text-gray-500 italic font-medium mt-3 text-center">Integrated, cross-functional,<br/>AI-orchestrated</p>
                </div>
              </div>

              {/* Net new roles — below pyramids, no overlap */}
              <div className="border border-dashed border-blue-400 rounded-lg px-3 py-2 bg-blue-50 flex items-start gap-2">
                <Sparkles className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] font-semibold text-blue-700">Net new roles TBD</p>
                  <p className="text-[10px] text-blue-600 leading-snug">e.g. AI Workflow Coordinators. Full org impact requires reimagining the broader QA/QC portfolio beyond deviation management.</p>
                </div>
              </div>

              {/* Role type legend */}
              <div className="flex gap-4">
                <span className="flex items-center gap-1 text-[10px] text-violet-700"><UserCircle className="w-3 h-3 text-violet-600" /> Human</span>
                <span className="flex items-center gap-1 text-[10px] text-blue-700"><Sparkles className="w-3 h-3 text-blue-600" /> Human + AI</span>
                <span className="flex items-center gap-1 text-[10px] text-emerald-700"><Zap className="w-3 h-3 text-emerald-600" /> Fully Automated</span>
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
