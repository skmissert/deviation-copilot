"use client";

import { ArrowRight, Users, CheckCircle, AlertCircle, Sparkles, Clock, BarChart2, Target, Zap } from "lucide-react";
import Link from "next/link";
import { PROCESS_CASES, VARIANTS, INEFFICIENCIES } from "@/lib/data/processEvents";
import { deviations } from "@/lib/data/deviations";
import { capas } from "@/lib/data/capas";
import { investigators } from "@/lib/data/investigators";

// ─── Pull live data for reference annotations ─────────────────────────────────

const avgInvDays = 12.5; // from simulation agent baseline
const queueWaitDays = 6.2; // from INEFFICIENCIES data
const baselineUtilization = 84; // from simulation agent baseline
const aiUtilization = 55; // with AI at same FTE (35% efficiency gain)
const fteFried = 0.5; // from simulation output (AI on, same FTE)
const aiInvDays = 8.1; // 12.5 × 0.65
const earlyCapaPct = Math.round(
  (PROCESS_CASES.filter(c => c.variant_id === 4).length / PROCESS_CASES.length) * 100
);
const pathWithoutCapaPct = VARIANTS.find(v => v.is_happy_path)?.pct ?? 0;
const reworkCases = PROCESS_CASES.filter(c => c.has_rework).length;
const openDevs = deviations.filter(d => d.status !== "Closed").length;

// ─── Layout helpers ───────────────────────────────────────────────────────────

function StatPill({
  value,
  label,
  tone = "neutral",
}: {
  value: string;
  label: string;
  tone?: "red" | "amber" | "green" | "neutral";
}) {
  const colors = {
    red: "bg-red-100 text-red-800 border-red-200",
    amber: "bg-amber-100 text-amber-800 border-amber-200",
    green: "bg-green-100 text-green-800 border-green-200",
    neutral: "bg-slate-100 text-slate-700 border-slate-200",
  };
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${colors[tone]}`}>
      {value} <span className="font-normal opacity-80">{label}</span>
    </span>
  );
}

function BulletItem({ children, icon = "dot" }: { children: React.ReactNode; icon?: "dot" | "check" | "arrow" }) {
  const Icon = icon === "check" ? CheckCircle : icon === "arrow" ? ArrowRight : null;
  return (
    <li className="flex items-start gap-2 text-sm leading-relaxed">
      {Icon
        ? <Icon className="w-4 h-4 shrink-0 mt-0.5 text-green-600" />
        : <span className="w-1.5 h-1.5 rounded-full bg-gray-400 shrink-0 mt-2" />}
      <span>{children}</span>
    </li>
  );
}

function SectionLabel({ label, icon: Icon }: { label: string; icon: React.ElementType }) {
  return (
    <div className="flex items-center gap-2 mb-1">
      <Icon className="w-4 h-4 text-slate-400" />
      <span className="text-xs font-bold uppercase tracking-widest text-slate-400">{label}</span>
    </div>
  );
}

// ─── Row component ─────────────────────────────────────────────────────────────

interface DimensionRowProps {
  number: string;
  dimension: string;
  dimensionColor: string;
  icon: React.ElementType;
  currentTitle: string;
  currentItems: React.ReactNode;
  currentStats: React.ReactNode;
  futureTitle: string;
  futureItems: React.ReactNode;
  futureStats: React.ReactNode;
  sourceNote?: string;
}

function DimensionRow({
  number,
  dimension,
  dimensionColor,
  icon: Icon,
  currentTitle,
  currentItems,
  currentStats,
  futureTitle,
  futureItems,
  futureStats,
  sourceNote,
}: DimensionRowProps) {
  return (
    <div className="grid grid-cols-[120px_1fr_1fr] gap-0 rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
      {/* Dimension label */}
      <div className={`${dimensionColor} flex flex-col items-center justify-center p-4 text-white`}>
        <Icon className="w-6 h-6 mb-2 opacity-80" />
        <span className="text-xs font-bold uppercase tracking-widest text-center leading-tight opacity-90">
          {number}
        </span>
        <span className="text-lg font-black text-center leading-tight mt-1">{dimension}</span>
      </div>

      {/* Current State */}
      <div className="bg-gray-50 border-r border-gray-200 p-5">
        <div className="flex items-center gap-2 mb-3">
          <AlertCircle className="w-4 h-4 text-gray-400 shrink-0" />
          <span className="text-xs font-bold uppercase tracking-wide text-gray-400">Current State</span>
        </div>
        <p className="text-sm font-semibold text-gray-700 mb-3">{currentTitle}</p>
        <ul className="space-y-2 text-gray-600 mb-4">{currentItems}</ul>
        <div className="flex flex-wrap gap-1.5">{currentStats}</div>
        {sourceNote && (
          <p className="text-xs text-gray-400 mt-3 italic">{sourceNote}</p>
        )}
      </div>

      {/* Future State */}
      <div className="bg-green-50 p-5">
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
          <span className="text-xs font-bold uppercase tracking-wide text-green-700">AI-Enabled Future State</span>
        </div>
        <p className="text-sm font-semibold text-gray-800 mb-3">{futureTitle}</p>
        <ul className="space-y-2 text-gray-700 mb-4">{futureItems}</ul>
        <div className="flex flex-wrap gap-1.5">{futureStats}</div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PeopleOrgPage() {
  return (
    <div className="min-h-screen bg-gray-50">

      {/* Dark header */}
      <div className="bg-slate-900 text-white px-8 py-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-5 h-5 text-green-400" />
                <span className="text-xs font-semibold uppercase tracking-widest text-green-400">
                  Organizational Blueprint
                </span>
              </div>
              <h1 className="text-3xl font-black text-white mb-2">
                People &amp; Org Implications
              </h1>
              <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
                What changes across Tasks, Talent, and Teams when you move from the current deviation management process
                to an AI-enabled operating model. This is a forward-looking blueprint, not a diagnostic.
              </p>
            </div>
            <div className="text-right shrink-0 ml-8">
              <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Grounded in</p>
              <div className="flex flex-col gap-1 text-right">
                <Link href="/process-map" className="text-xs text-green-400 hover:text-green-300 underline underline-offset-2">
                  Process Mining data ↗
                </Link>
                <Link href="/simulation" className="text-xs text-green-400 hover:text-green-300 underline underline-offset-2">
                  Digital Twin simulation ↗
                </Link>
                <Link href="/capas" className="text-xs text-green-400 hover:text-green-300 underline underline-offset-2">
                  CAPA Tracker ↗
                </Link>
              </div>
            </div>
          </div>

          {/* Summary KPIs */}
          <div className="grid grid-cols-4 gap-3 mt-6">
            {[
              { label: "Investigation time reduction", value: "−35%", sub: `${avgInvDays}d → ${aiInvDays}d`, color: "bg-green-900 border-green-700" },
              { label: "Queue wait eliminated", value: "−6.2d", sub: "AI auto-assigns at triage", color: "bg-green-900 border-green-700" },
              { label: "Investigator capacity freed", value: `${fteFried} FTE`, sub: "Same headcount, less routine work", color: "bg-green-900 border-green-700" },
              { label: "Utilization (at same FTE)", value: `${baselineUtilization}% → ${aiUtilization}%`, sub: "Returns to sustainable zone", color: "bg-green-900 border-green-700" },
            ].map(k => (
              <div key={k.label} className={`rounded-xl border px-4 py-3 ${k.color}`}>
                <p className="text-xs text-slate-400 uppercase tracking-wide font-medium mb-0.5">{k.label}</p>
                <p className="text-xl font-black text-green-400">{k.value}</p>
                <p className="text-xs text-slate-400 mt-0.5">{k.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-5xl mx-auto px-8 py-8 space-y-5">

        {/* Column headers */}
        <div className="grid grid-cols-[120px_1fr_1fr] gap-0 px-0">
          <div />
          <div className="pl-5 pb-2">
            <p className="text-sm font-bold text-gray-500">Current State</p>
            <p className="text-xs text-gray-400">How investigators work today</p>
          </div>
          <div className="pl-5 pb-2">
            <p className="text-sm font-bold text-green-700">AI-Enabled Future State</p>
            <p className="text-xs text-gray-400">What the redesigned model looks like</p>
          </div>
        </div>

        {/* ── Row 1: Tasks ── */}
        <DimensionRow
          number="01"
          dimension="Tasks"
          dimensionColor="bg-slate-700"
          icon={BarChart2}
          currentTitle="Investigators own the full investigation end-to-end — from evidence gathering to report writing"
          currentItems={
            <>
              <BulletItem>Manually search batch records, equipment logs, and QC data for each investigation</BulletItem>
              <BulletItem>Cross-reference historical deviations from memory or manual lookup</BulletItem>
              <BulletItem>Write investigation summary reports from scratch per deviation</BulletItem>
              <BulletItem>Significant queue wait between triage and investigation start</BulletItem>
              <BulletItem>CAPA actions sometimes initiated before root cause is confirmed</BulletItem>
            </>
          }
          currentStats={
            <>
              <StatPill value={`${avgInvDays}d`} label="avg investigation" tone="amber" />
              <StatPill value={`${queueWaitDays}d`} label="queue wait" tone="red" />
              <StatPill value={`${earlyCapaPct}%`} label="early CAPA creation" tone="red" />
              <StatPill value={`${pathWithoutCapaPct}%`} label="path without CAPA" tone="neutral" />
            </>
          }
          futureTitle="AI handles data gathering and pattern matching — investigators apply judgment and sign off"
          futureItems={
            <>
              <BulletItem icon="check">AI agent reads evidence package and flags relevant data within seconds of assignment</BulletItem>
              <BulletItem icon="check">Historical matches surfaced automatically from 60-case pattern library</BulletItem>
              <BulletItem icon="check">Investigation summary drafted by AI, reviewed and approved by investigator</BulletItem>
              <BulletItem icon="check">Auto-assignment at triage eliminates queue wait — investigation starts same day</BulletItem>
              <BulletItem icon="check">Workflow gate prevents CAPA creation until investigation is confirmed complete</BulletItem>
            </>
          }
          futureStats={
            <>
              <StatPill value={`${aiInvDays}d`} label="avg investigation" tone="green" />
              <StatPill value="<1d" label="queue wait target" tone="green" />
              <StatPill value="0%" label="early CAPA target" tone="green" />
            </>
          }
          sourceNote={`Queue wait data from Process Mining · ${PROCESS_CASES.length} cases analyzed`}
        />

        {/* ── Row 2: Talent ── */}
        <DimensionRow
          number="02"
          dimension="Talent"
          dimensionColor="bg-indigo-700"
          icon={Sparkles}
          currentTitle="Investigators as generalists — executing the full investigation workflow independently"
          currentItems={
            <>
              <BulletItem>High utilization leaves limited bandwidth for complex or escalated cases</BulletItem>
              <BulletItem>Skills weighted toward manual documentation and sequential evidence review</BulletItem>
              <BulletItem>Senior investigators spend disproportionate time on routine documentation tasks</BulletItem>
              <BulletItem>Limited time for knowledge transfer, training, or systemic pattern work</BulletItem>
              <BulletItem>Recurrence rate signals root cause analysis is under-resourced</BulletItem>
            </>
          }
          currentStats={
            <>
              <StatPill value={`${baselineUtilization}%`} label="investigator utilization" tone="amber" />
              <StatPill value={`${investigators.length}`} label="investigators" tone="neutral" />
              <StatPill value="15%" label="recurrence rate" tone="red" />
            </>
          }
          futureTitle="Investigators as reviewers and orchestrators — validating AI, owning accountability, leading on exceptions"
          futureItems={
            <>
              <BulletItem icon="check">Investigators review and confirm AI-suggested root causes — human sign-off required at every step</BulletItem>
              <BulletItem icon="check">Expertise focused on complex, escalated, and novel deviation patterns</BulletItem>
              <BulletItem icon="check">Senior investigators lead systemic pattern analysis and CAPA Review Board preparation</BulletItem>
              <BulletItem icon="check">0.5 FTE capacity freed at same headcount — redeployable to continuous improvement</BulletItem>
              <BulletItem icon="check">New skill profile: AI output validation, exception judgment, GMP oversight of AI recommendations</BulletItem>
            </>
          }
          futureStats={
            <>
              <StatPill value={`${aiUtilization}%`} label="utilization (AI on)" tone="green" />
              <StatPill value={`${fteFried} FTE`} label="capacity freed" tone="green" />
              <StatPill value="10.5%" label="recurrence target" tone="green" />
            </>
          }
          sourceNote="Utilization and FTE estimates from Digital Twin simulation (AI enabled, same FTE headcount)"
        />

        {/* ── Row 3: Teams ── */}
        <DimensionRow
          number="03"
          dimension="Teams"
          dimensionColor="bg-rose-700"
          icon={Target}
          currentTitle="Siloed QA investigators with reactive escalation to CAPA Review Board"
          currentItems={
            <>
              <BulletItem>Investigators work independently with limited cross-functional coordination</BulletItem>
              <BulletItem>CAPA Review Board engaged reactively — after critical deviations escalate</BulletItem>
              <BulletItem>Process compliance monitored manually; early CAPA creation not systematically flagged</BulletItem>
              <BulletItem>Cross-process systemic patterns rarely visible within a single site</BulletItem>
              <BulletItem>Rework and re-investigation driven by insufficient initial investigation, not escalation protocol</BulletItem>
            </>
          }
          currentStats={
            <>
              <StatPill value={`${earlyCapaPct}%`} label="CAPA sequencing flags" tone="red" />
              <StatPill value={`${reworkCases}`} label="rework cases" tone="amber" />
              <StatPill value={`${openDevs}`} label="open deviations" tone="amber" />
            </>
          }
          futureTitle="Integrated model with CAPA Review Board proactively embedded, AI handling routing and sequencing"
          futureItems={
            <>
              <BulletItem icon="check">AI routes deviations by severity and root cause — escalated cases go directly to CAPA Review Board queue</BulletItem>
              <BulletItem icon="check">CAPA Review Board shifts from reactive firefighting to proactive systemic pattern oversight</BulletItem>
              <BulletItem icon="check">Process conformance monitored automatically — sequencing flags surfaced in real time to QA Manager</BulletItem>
              <BulletItem icon="check">Cross-process and cross-site trend analysis enables systemic CAPA at portfolio level</BulletItem>
              <BulletItem icon="check">QA team capacity freed from routing and documentation frees bandwidth for continuous improvement programs</BulletItem>
            </>
          }
          futureStats={
            <>
              <StatPill value="0%" label="sequencing flag target" tone="green" />
              <StatPill value="Real-time" label="conformance monitoring" tone="green" />
              <StatPill value="Proactive" label="CAPA Review Board" tone="green" />
            </>
          }
          sourceNote="Escalation and sequencing data from Process Mining · CAPA Review Board = Variant 5 escalation path"
        />

        {/* ── Summary callout ── */}
        <div className="rounded-2xl bg-slate-900 text-white p-7 mt-8">
          <div className="flex items-start gap-5">
            <div className="shrink-0 mt-1">
              <div className="w-10 h-10 rounded-xl bg-green-500 flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-green-400 mb-2">
                The Core Design Principle
              </p>
              <p className="text-xl font-bold text-white mb-3 leading-snug">
                The tool enables the task change. BCG designs the talent and team change that makes it stick.
              </p>
              <p className="text-slate-300 text-sm leading-relaxed max-w-3xl">
                Technology can automate data gathering, surface patterns, and draft reports — but it cannot redesign
                roles, redefine accountability, or build the organizational capability to govern AI recommendations
                in a GxP environment. The three rows above represent three distinct change management workstreams:
                process redesign, competency development, and organizational model design. Each requires a different
                intervention to land durably.
              </p>
              <div className="grid grid-cols-3 gap-4 mt-5">
                {[
                  {
                    label: "Tasks",
                    action: "Process redesign & workflow configuration",
                    detail: "SOP updates, eQMS workflow gates, AI integration points, HITL approval checkpoints",
                  },
                  {
                    label: "Talent",
                    action: "Role redesign & capability building",
                    detail: "Updated job profiles, AI oversight training, GxP validation for AI-assisted investigations",
                  },
                  {
                    label: "Teams",
                    action: "Operating model & governance design",
                    detail: "CAPA Review Board charter, escalation protocol redesign, cross-functional accountability model",
                  },
                ].map(item => (
                  <div key={item.label} className="bg-slate-800 rounded-xl p-4">
                    <p className="text-xs font-bold uppercase tracking-widest text-green-400 mb-1">{item.label}</p>
                    <p className="text-sm font-semibold text-white mb-1">{item.action}</p>
                    <p className="text-xs text-slate-400 leading-relaxed">{item.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer nav */}
        <div className="flex items-center justify-between pt-2 pb-8">
          <Link href="/capas" className="text-sm text-gray-400 hover:text-gray-600 flex items-center gap-1">
            ← CAPA Tracker
          </Link>
          <Link href="/simulation" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
            Explore Digital Twin simulation <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
