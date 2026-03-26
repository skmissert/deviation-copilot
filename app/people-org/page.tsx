"use client";

import React, { Fragment, useMemo } from "react";
import Link from "next/link";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
} from "recharts";
import { User, Bot, Sparkles, ArrowRight, Zap } from "lucide-react";
import { PROCESS_CASES, VARIANTS } from "@/lib/data/processEvents";
import { capas } from "@/lib/data/capas";
import { isOverdue } from "@/lib/utils";

// ─── Simulation baselines ─────────────────────────────────────────────────────
const AVG_INV_DAYS  = 12.5;
const AI_INV_DAYS   = 8.1;   // 12.5 × 0.65 at full copilot adoption
const QUEUE_WAIT    = 6.2;
const BASELINE_UTIL = 84;
const AI_UTIL       = 55;
const FTE_FREED     = 0.5;

// ─── Work classification ──────────────────────────────────────────────────────
type WorkMode = "human" | "human+ai" | "automated";

interface ModeConfig {
  label: string;
  bg: string;
  border: string;
  text: string;
  iconColor: string;
  Icon: React.ComponentType<{ className?: string }>;
}

const MODE: Record<WorkMode, ModeConfig> = {
  human: {
    label: "Human",
    bg: "bg-green-50", border: "border-green-300", text: "text-green-800",
    iconColor: "text-green-600", Icon: User,
  },
  "human+ai": {
    label: "Human + AI",
    bg: "bg-amber-50", border: "border-amber-300", text: "text-amber-800",
    iconColor: "text-amber-500", Icon: Sparkles,
  },
  automated: {
    label: "Fully Automated",
    bg: "bg-gray-100", border: "border-gray-300", text: "text-gray-500",
    iconColor: "text-gray-400", Icon: Bot,
  },
};

// ─── Process workflow steps ────────────────────────────────────────────────────
const STEPS: { name: string; today: WorkMode; future: WorkMode }[] = [
  { name: "Deviation\nFlagged",       today: "human",      future: "automated"  },
  { name: "Investigation\nInitiated", today: "human",      future: "human+ai"   },
  { name: "Root Cause\nAnalysis",     today: "human",      future: "human+ai"   },
  { name: "CAPA\nDecision",           today: "human",      future: "human"      },
  { name: "CAPA\nInitiated",          today: "human",      future: "automated"  },
  { name: "Review &\nSign-off",       today: "human",      future: "human"      },
  { name: "Closure",                  today: "human",      future: "automated"  },
];

// ─── Investigator skill profiles ──────────────────────────────────────────────
const RADAR_SKILLS = [
  { skill: "Documentation",      today: 3, future: 1 },
  { skill: "Data Gathering",     today: 3, future: 1 },
  { skill: "RCA Writing",        today: 3, future: 1 },
  { skill: "AI Oversight",       today: 0, future: 3 },
  { skill: "Exception Judgment", today: 2, future: 3 },
  { skill: "Systems Thinking",   today: 1, future: 3 },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function ModeBadge({ mode }: { mode: WorkMode }) {
  const m = MODE[mode];
  const Icon = m.Icon;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full border ${m.bg} ${m.border} ${m.text}`}>
      <Icon className={`w-3.5 h-3.5 ${m.iconColor}`} />
      {m.label}
    </span>
  );
}

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

function RadarPanel({ data, title, strokeColor, fillColor, bg }: {
  data: { skill: string; value: number }[];
  title: string; strokeColor: string; fillColor: string; bg: string;
}) {
  return (
    <div className={`rounded-lg border p-3 ${bg}`}>
      <p className="text-[9px] font-black uppercase tracking-wide text-center mb-1" style={{ color: strokeColor }}>{title}</p>
      <ResponsiveContainer width="100%" height={150}>
        <RadarChart data={data} outerRadius={52}>
          <PolarGrid stroke="#d1d5db" />
          <PolarAngleAxis dataKey="skill" tick={{ fontSize: 8.5, fill: "#6b7280" }} />
          <Radar dataKey="value" stroke={strokeColor} fill={fillColor} fillOpacity={0.35} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

function Callout({ value, label, sub, tone = "neutral" }: {
  value: string; label: string; sub?: string;
  tone?: "red" | "amber" | "green" | "neutral" | "blue";
}) {
  const colors = { red: "text-red-600", amber: "text-amber-600", green: "text-green-700", neutral: "text-gray-700", blue: "text-blue-600" };
  return (
    <div className="border-b border-gray-100 pb-3 last:border-0 last:pb-0">
      <div className={`text-xl font-black leading-tight ${colors[tone]}`}>{value}</div>
      <div className="text-xs font-semibold text-gray-700 leading-tight mt-0.5">{label}</div>
      {sub && <div className="text-[10px] text-gray-400 mt-0.5 leading-tight">{sub}</div>}
    </div>
  );
}

function Anchor({ tag, question }: { tag: string; question: string }) {
  return (
    <div className="space-y-2">
      <p className="text-[9px] font-black uppercase tracking-widest text-green-500">{tag}</p>
      <p className="text-sm font-black text-green-700 leading-snug">{question}</p>
    </div>
  );
}

function Row({ left, center, right }: { left: React.ReactNode; center: React.ReactNode; right: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="grid grid-cols-[210px_1fr_185px]">
        <div className="p-5 border-r border-gray-100 bg-gray-50">{left}</div>
        <div className="p-5">{center}</div>
        <div className="p-5 border-l border-gray-100 space-y-3">{right}</div>
      </div>
    </div>
  );
}

function OrgToday() {
  return (
    <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 flex flex-col">
      <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-4 text-center">Today</p>
      <div className="space-y-3 flex-1">
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-gray-200 border border-gray-300 rounded-lg px-2 py-2 text-center">
            <p className="text-[10px] font-bold text-gray-600">QA Investigators</p>
          </div>
          <div className="text-center shrink-0">
            <div className="text-gray-400 text-sm">→</div>
            <div className="text-[8px] text-gray-400">end only</div>
          </div>
          <div className="flex-1 bg-gray-200 border border-gray-300 rounded-lg px-2 py-2 text-center">
            <p className="text-[10px] font-bold text-gray-600">CAPA Review Board</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-gray-200 border border-gray-300 rounded-lg px-2 py-2 text-center">
            <p className="text-[10px] font-bold text-gray-600">Manufacturing</p>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <span className="text-[9px] text-gray-300 italic">no connection</span>
          </div>
        </div>
      </div>
      <p className="text-[9px] text-gray-400 italic mt-3 text-center">Reactive · Siloed · Sequential</p>
    </div>
  );
}

function OrgFuture() {
  return (
    <div className="bg-green-50 rounded-lg border border-green-200 p-4 flex flex-col">
      <p className="text-[9px] font-black uppercase tracking-widest text-green-600 mb-4 text-center">Future State</p>
      <div className="space-y-2 flex-1">
        <div className="flex items-center gap-1.5">
          <div className="flex-1 bg-white border border-green-300 rounded-lg px-2 py-2 text-center">
            <p className="text-[9px] font-bold text-gray-700">QA Investigators</p>
          </div>
          <span className="text-green-500 font-bold text-sm shrink-0">↔</span>
          <div className="flex-1 bg-blue-50 border border-blue-300 rounded-lg px-2 py-2 text-center">
            <Sparkles className="w-3 h-3 text-blue-500 mx-auto mb-0.5" />
            <p className="text-[9px] font-bold text-blue-700">AI Routing</p>
          </div>
          <span className="text-green-500 font-bold text-sm shrink-0">↔</span>
          <div className="flex-1 bg-white border border-green-300 rounded-lg px-2 py-2 text-center">
            <p className="text-[9px] font-bold text-gray-700">CAPA Review Board</p>
          </div>
        </div>
        <div className="flex justify-center">
          <span className="text-green-500 font-bold">↕</span>
        </div>
        <div className="flex justify-center">
          <div className="bg-white border border-green-300 rounded-lg px-4 py-2 text-center">
            <p className="text-[9px] font-bold text-gray-700">Manufacturing</p>
          </div>
        </div>
      </div>
      <p className="text-[9px] text-green-600 italic mt-3 text-center">Integrated · Cross-functional · AI-orchestrated</p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PeopleOrgPage() {
  const pathWithoutCapaPct = VARIANTS.find(v => v.is_happy_path)?.pct ?? 0;
  const earlyCapaPct = Math.round(
    (PROCESS_CASES.filter(c => c.variant_id === 4).length / PROCESS_CASES.length) * 100
  );
  const escalationRate = Math.round(
    (PROCESS_CASES.filter(c => c.variant_id === 5).length / PROCESS_CASES.length) * 100
  );
  const overdueCapas = capas.filter(c => isOverdue(c.due_date, c.effectiveness_check_status)).length;
  const avgCycleDays = useMemo(() =>
    PROCESS_CASES.length
      ? Math.round(PROCESS_CASES.reduce((s, c) => s + c.total_cycle_days, 0) / PROCESS_CASES.length)
      : 22,
  []);

  return (
    <div className="space-y-0">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="bg-slate-900 text-white px-8 py-8">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-green-400 mb-2">People &amp; Org Implications</p>
            <h1 className="text-2xl font-black text-white mb-1.5 leading-tight max-w-xl">
              Reimagining Work: People &amp; Org Implications for Deviation Management
            </h1>
            <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">
              What must change across Tasks, Talent, and Teams to realize the gains shown in the Digital Twin simulation.
            </p>
          </div>
          <div className="shrink-0 ml-8 text-right">
            <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-1.5">Grounded in</p>
            <div className="flex flex-col gap-1">
              {[
                { href: "/process-map", label: "Process Mining ↗" },
                { href: "/simulation", label: "Digital Twin Simulator ↗" },
                { href: "/capas", label: "CAPA Tracker ↗" },
              ].map(({ href, label }) => (
                <Link key={href} href={href} className="text-xs text-green-400 hover:text-green-300 underline underline-offset-2">{label}</Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Legend ────────────────────────────────────────────────────────── */}
      <div className="bg-slate-800 px-8 py-3 flex items-center gap-5">
        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 shrink-0">Classification key:</span>
        {(["human", "human+ai", "automated"] as WorkMode[]).map(mode => (
          <ModeBadge key={mode} mode={mode} />
        ))}
        <span className="text-[9px] text-slate-500 ml-auto italic">Used consistently across all three rows</span>
      </div>

      {/* ── Rows ──────────────────────────────────────────────────────────── */}
      <div className="space-y-4 pt-4">

        {/* Row 1: Tasks */}
        <Row
          left={
            <Anchor
              tag="Tasks"
              question="Which deviation management tasks do we automate, augment, or keep human?"
            />
          }
          center={
            <div className="space-y-3">
              <ProcessFlow />
              <p className="text-[10px] text-gray-400 italic leading-relaxed">
                CAPA Decision is kept fully Human — GxP accountability requires investigator sign-off at every step. All AI output requires human confirmation before any record is created.
              </p>
            </div>
          }
          right={
            <>
              <Callout value={`${avgCycleDays}d`} label="Avg investigation cycle" sub="Target: 10d" tone="amber" />
              <Callout value={`${QUEUE_WAIT}d`} label="Queue wait time" sub="Before investigation starts" tone="red" />
              <Callout value={`${AI_INV_DAYS}d`} label="DT: AI-assisted cycle" sub="−35% vs baseline" tone="green" />
              <Callout value={`${pathWithoutCapaPct}%`} label="Path without CAPA" sub="No CAPA required" />
            </>
          }
        />

        {/* Row 2: Talent */}
        <Row
          left={
            <Anchor
              tag="Talent"
              question="What skills and roles do we need — and in what quantity?"
            />
          }
          center={
            <div>
              <div className="grid grid-cols-2 gap-3">
                <RadarPanel
                  data={RADAR_SKILLS.map(s => ({ skill: s.skill, value: s.today }))}
                  title="Today — Investigator Profile"
                  strokeColor="#9ca3af"
                  fillColor="#9ca3af"
                  bg="border-gray-200 bg-gray-50"
                />
                <RadarPanel
                  data={RADAR_SKILLS.map(s => ({ skill: s.skill, value: s.future }))}
                  title="Future — Investigator Profile"
                  strokeColor="#16a34a"
                  fillColor="#16a34a"
                  bg="border-green-200 bg-green-50"
                />
              </div>
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div className="bg-gray-100 rounded-lg border border-gray-200 px-4 py-3 text-center">
                  <p className="text-[9px] text-gray-400 uppercase tracking-wide mb-0.5">Today</p>
                  <p className="text-xl font-black text-gray-700">1.0 FTE</p>
                  <p className="text-[10px] text-gray-500">on manual investigation tasks</p>
                </div>
                <div className="bg-green-50 rounded-lg border border-green-200 px-4 py-3 text-center">
                  <p className="text-[9px] text-green-600 uppercase tracking-wide mb-0.5">Future</p>
                  <p className="text-xl font-black text-green-700">0.5 FTE</p>
                  <p className="text-[10px] text-green-600">redeployed to complex &amp; escalated cases</p>
                </div>
              </div>
            </div>
          }
          right={
            <>
              <Callout value={`${BASELINE_UTIL}%→${AI_UTIL}%`} label="Investigator utilization" sub="DT: AI on, same headcount" tone="green" />
              <Callout value={`${FTE_FREED} FTE`} label="Capacity freed" sub="Without adding headcount" tone="green" />
              <Callout value={`${AVG_INV_DAYS}d`} label="Avg investigation duration" sub="Target: 10d" tone="amber" />
            </>
          }
        />

        {/* Row 3: Teams */}
        <Row
          left={
            <Anchor
              tag="Teams"
              question="How do teams need to restructure to deliver the reimagined workflow?"
            />
          }
          center={
            <div className="grid grid-cols-2 gap-3">
              <OrgToday />
              <OrgFuture />
            </div>
          }
          right={
            <>
              <Callout value={`${earlyCapaPct}%`} label="CAPA sequencing violations" sub="CAPAs before root cause confirmed" tone="red" />
              <Callout value={`${escalationRate}%`} label="Escalation rate" sub="Cases reaching CAPA Review Board" tone="amber" />
              <Callout value={`${overdueCapas}`} label="Aging CAPAs" sub="Overdue as of today" tone={overdueCapas > 0 ? "red" : "green"} />
            </>
          }
        />

        {/* ── Bottom callout ──────────────────────────────────────────────── */}
        <div className="rounded-xl bg-green-600 text-white p-6 flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0 mt-0.5">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-base font-black text-white mb-1 leading-snug">
              The digital twin tells you a 30% cycle time improvement is possible. This is what has to change in your organization to actually get there.
            </p>
            <p className="text-green-100 text-sm leading-relaxed mb-4">
              Technology enables the task change. BCG designs the talent and team transformation that makes it stick in a GxP environment.
            </p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Tasks", action: "Process redesign & workflow gates", detail: "SOP updates, eQMS configuration, AI integration, human-in-the-loop checkpoints" },
                { label: "Talent", action: "Role redesign & capability building", detail: "Updated job profiles, AI oversight training, GxP validation for AI-assisted investigations" },
                { label: "Teams", action: "Operating model & governance", detail: "CAPA Review Board charter, escalation protocol redesign, cross-functional accountability model" },
              ].map(item => (
                <div key={item.label} className="bg-white/15 rounded-lg p-3">
                  <p className="text-[9px] font-black uppercase tracking-widest text-white/70 mb-1">{item.label}</p>
                  <p className="text-sm font-bold text-white mb-1">{item.action}</p>
                  <p className="text-xs text-green-100/80 leading-relaxed">{item.detail}</p>
                </div>
              ))}
            </div>
          </div>
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
