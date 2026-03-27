"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import { X, Target, ChevronDown, ArrowRight, CheckCircle, AlertCircle } from "lucide-react";
import { deviations } from "@/lib/data/deviations";
import { capas } from "@/lib/data/capas";
import { PROCESS_CASES, CONFORMANCE_SCORE } from "@/lib/data/processEvents";
import { daysBetween } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────

type MetricDetail = {
  id: string;
  name: string;
  targetLabel: string;
  description: string;
  whyItMatters: string;
  keyDrivers: string[];
  connectedTo: string[];
};

type Pillar = {
  id: string;
  name: string;
  subtitle: string;
  headerBg: string;
  cardBg: string;
  cardBorder: string;
  badgeColor: string;
  pageLink: string | null;
  metrics: MetricDetail[];
};

type SelectedMetric = { pillarId: string; metricId: string } | null;

// ─── Pillar definitions (static — actuals computed below) ────────────────────

const PILLARS: Pillar[] = [
  {
    id: "process-time",
    name: "Process Time",
    subtitle: "End-to-end deviation resolution speed",
    headerBg: "bg-indigo-600",
    cardBg: "bg-indigo-50",
    cardBorder: "border-indigo-200",
    badgeColor: "bg-indigo-100 text-indigo-800",
    pageLink: "/process-map",
    metrics: [
      {
        id: "cycle-time",
        name: "Avg Cycle Time",
        targetLabel: "≤30 days",
        description: "Report to closure — primary driver of batch release delay",
        whyItMatters:
          "In GxP manufacturing, every day a deviation remains open is a day the affected batch cannot be released. Regulators expect documented closure timelines, and chronic overruns are cited in 483 observations. This metric is the headline indicator of how well the quality system is functioning end-to-end.",
        keyDrivers: [
          "Time to containment and initial triage speed",
          "Investigator availability and current backlog",
          "Completeness of evidence package at investigation start",
          "QA review queue depth and reviewer bandwidth",
        ],
        connectedTo: ["Investigation Duration", "QA Review Turnaround", "Open Deviation Backlog"],
      },
      {
        id: "aging-deviations",
        name: "Aging Deviations",
        targetLabel: "<20% open >30d",
        description: "% of open cases exceeding the 30-day SOP target",
        whyItMatters:
          "Aging deviations signal systemic bottlenecks — capacity gaps, evidence delays, or QA queue depth. Regulators review open deviation aging during inspections as evidence of quality system responsiveness. A rising aging rate is an early warning of process stress before cycle time averages reflect it.",
        keyDrivers: [
          "Investigator queue depth and assignment speed",
          "Evidence availability at investigation start",
          "QA reviewer bandwidth and competing priorities",
          "Complexity distribution of incoming deviations",
        ],
        connectedTo: ["Investigator Utilization", "Open Deviation Backlog", "Avg Cycle Time"],
      },
    ],
  },
  {
    id: "capa-mgmt",
    name: "CAPA Mgmt Performance",
    subtitle: "Timeliness and aging of corrective actions",
    headerBg: "bg-emerald-600",
    cardBg: "bg-emerald-50",
    cardBorder: "border-emerald-200",
    badgeColor: "bg-emerald-100 text-emerald-800",
    pageLink: "/capas",
    metrics: [
      {
        id: "capa-closure",
        name: "Avg CAPA Closure Time",
        targetLabel: "≤45 days",
        description: "Days from CAPA creation to implementation completion",
        whyItMatters:
          "CAPA closure time measures how quickly the quality system translates identified problems into implemented solutions. Prolonged CAPA cycles expose the site to continued risk from unresolved root causes and create regulatory commitment breach exposure. ICH Q10 requires timely and effective CAPA implementation.",
        keyDrivers: [
          "Owner accountability and visibility into upcoming due dates",
          "Resource availability for implementation (engineering, training, IT)",
          "Realism of committed timelines at CAPA creation",
          "Escalation and reminder workflow configuration",
        ],
        connectedTo: ["Recurrence Rate", "Conformance Score", "Avg Cycle Time"],
      },
      {
        id: "aging-capas",
        name: "Aging CAPAs (>90d)",
        targetLabel: "0",
        description: "Open CAPAs older than 90 days from creation — direct audit finding risk",
        whyItMatters:
          "Any open CAPA older than 90 days represents a documented quality commitment that has not been fulfilled. Regulators read CAPA tracking reports line by line. Aging open CAPAs signal that either the timeline was unrealistic, the owner lacks resources, or implementation accountability is insufficient.",
        keyDrivers: [
          "CAPA timeline realism at point of creation",
          "Owner capacity and competing priorities",
          "Escalation trigger configuration in QMS",
          "Cross-functional dependency management",
        ],
        connectedTo: ["Avg CAPA Closure Time", "Investigator Utilization", "Conformance Score"],
      },
    ],
  },
  {
    id: "capacity",
    name: "Capacity & Throughput",
    subtitle: "Team bandwidth relative to incoming workload",
    headerBg: "bg-blue-600",
    cardBg: "bg-blue-50",
    cardBorder: "border-blue-200",
    badgeColor: "bg-blue-100 text-blue-800",
    pageLink: "/",
    metrics: [
      {
        id: "utilization",
        name: "Investigator Utilization",
        targetLabel: "70–85%",
        description: "Optimal zone — above 85% risks quality degradation and burnout",
        whyItMatters:
          "Investigator utilization is a leading indicator of queue pressure and investigation quality risk. Below 70%, capacity is wasted; above 85%, investigators are under chronic time pressure — when corners get cut, documentation errors increase, and root cause analyses become superficial. Sustained over-utilization is directly correlated with RFT failures and rising recurrence rates.",
        keyDrivers: [
          "Deviation arrival rate relative to investigator FTE",
          "Non-investigation time demands (meetings, training, audits)",
          "AI assistance adoption — reduces per-investigation effort significantly",
          "Investigator skill mix vs. complexity distribution of incoming deviations",
        ],
        connectedTo: ["Investigation Start Lag", "Open Deviation Backlog", "Avg Investigation Duration"],
      },
      {
        id: "backlog",
        name: "Open Deviation Backlog",
        targetLabel: "≤10",
        description: "Count of open investigations — leading indicator of cycle time pressure",
        whyItMatters:
          "Backlog is the queue visibility metric. When more deviations are arriving than are being closed, the backlog grows — and with it, cycle times, batch hold durations, and investigator stress. A backlog above 10 per site is a strong predictor of upcoming SLA breaches.",
        keyDrivers: [
          "Deviation arrival rate — seasonality, campaign volume, new product launches",
          "Investigator throughput capacity (FTE × effective hours per week)",
          "Investigation complexity and average duration",
          "Priority and escalation logic — are critical deviations being expedited?",
        ],
        connectedTo: ["Investigator Utilization", "Avg Cycle Time", "Aging Deviations"],
      },
    ],
  },
  {
    id: "compliance",
    name: "Compliance & Risk",
    subtitle: "Regulatory exposure in how the process is run",
    headerBg: "bg-rose-600",
    cardBg: "bg-rose-50",
    cardBorder: "border-rose-200",
    badgeColor: "bg-rose-100 text-rose-800",
    pageLink: "/deviations",
    metrics: [
      {
        id: "recurring-dev-pct",
        name: "Recurring Deviation %",
        targetLabel: "<10%",
        description: "% of deviations flagged as repeat occurrences — CAPA effectiveness signal",
        whyItMatters:
          "Recurring deviations are the clearest evidence of CAPA system failure. When the same issue reappears, the corrective action either was never fully implemented or did not address the actual systemic driver. Regulators treat high recurrence rates as a signal of a broken quality system and will cite them in audit findings.",
        keyDrivers: [
          "CAPA effectiveness check rigor and timeliness",
          "Root cause identification accuracy — fixing root causes vs. symptoms",
          "Systemic vs. local CAPA scope — local fixes rarely prevent recurrence",
          "Historical pattern awareness across investigations",
        ],
        connectedTo: ["Recurrence Rate", "CAPA Closure Time", "Conformance Score"],
      },
      {
        id: "doc-accuracy",
        name: "Documentation Accuracy",
        targetLabel: ">75%",
        description: "% of deviations not caused by documentation errors — GMP baseline indicator",
        whyItMatters:
          "Documentation errors are the most common root cause category in this dataset. In GxP environments, documentation is not administrative overhead — it is the product of the quality system. Persistent documentation error rates signal operator training gaps, SOP clarity issues, or workload-driven shortcuts that create audit exposure.",
        keyDrivers: [
          "Operator training and competency verification on GMP documentation practices",
          "Electronic batch record system design and error-proofing",
          "Review and approval workflow configuration",
          "Workload and time pressure during batch execution",
        ],
        connectedTo: ["Recurring Deviation %", "Recurrence Rate", "Conformance Score"],
      },
    ],
  },
  {
    id: "inv-quality",
    name: "Investigation Quality",
    subtitle: "Rigor, sequence adherence, and recurrence prevention",
    headerBg: "bg-purple-600",
    cardBg: "bg-purple-50",
    cardBorder: "border-purple-200",
    badgeColor: "bg-purple-100 text-purple-800",
    pageLink: "/process-map",
    metrics: [
      {
        id: "conformance",
        name: "Conformance Score",
        targetLabel: ">75%",
        description: "% of investigations following required SOP activity sequence",
        whyItMatters:
          "Regulators evaluate not just what conclusions were reached — but how the investigation was conducted. The sequence of activities (containment → investigation → CAPA → closure) is codified in 21 CFR Part 211 and ICH Q10. Sequence deviations can invalidate an otherwise sound investigation during an inspection.",
        keyDrivers: [
          "eQMS workflow enforcement and gate controls",
          "Investigator training and ongoing competency assessment",
          "SOP clarity and accessibility at point of use",
          "Real-time monitoring of process adherence metrics",
        ],
        connectedTo: ["CAPA Sequencing", "Right First Time", "Documentation Accuracy"],
      },
      {
        id: "recurrence",
        name: "Recurrence Rate",
        targetLabel: "<15%",
        description: "% of deviations flagged as repeat of prior root cause",
        whyItMatters:
          "Recurring deviations are the clearest evidence of CAPA system failure. When the same root cause appears twice, the corrective action either was never fully implemented or did not address the actual systemic driver. Regulators treat high recurrence rates as a signal of a broken quality system.",
        keyDrivers: [
          "CAPA effectiveness check rigor and timeliness",
          "Root cause identification accuracy — fixing root causes vs. symptoms",
          "Systemic vs. local CAPA scope — local fixes rarely prevent recurrence",
          "Historical pattern awareness across investigations",
        ],
        connectedTo: ["Right First Time", "CAPA Closure Time", "Conformance Score"],
      },
      {
        id: "inv-duration",
        name: "Avg Investigation Duration",
        targetLabel: "≤14 days",
        description: "Time from investigation start to root cause confirmed",
        whyItMatters:
          "Investigation duration is the analytical core metric of the quality system. Investigations that run long signal evidence gaps, unclear SOP guidance, or systemic complexity. Long investigations inflate cycle time, hold batches longer, and reduce investigator throughput — creating a reinforcing backlog cycle.",
        keyDrivers: [
          "Evidence completeness and accessibility at investigation start",
          "Investigator experience and domain expertise",
          "AI-assisted root cause pattern matching against historical cases",
          "Complexity and cross-functional dependencies of the deviation",
        ],
        connectedTo: ["Avg Cycle Time", "Investigator Utilization", "Right First Time"],
      },
    ],
  },
];

// ─── Actual-vs-target helper ──────────────────────────────────────────────────

function isOnTarget(metricId: string, value: number): boolean {
  switch (metricId) {
    case "cycle-time":     return value <= 30;
    case "aging-deviations": return value < 20;
    case "capa-closure":   return value <= 45;
    case "aging-capas":    return value === 0;
    case "utilization":    return value >= 70 && value <= 85;
    case "backlog":        return value <= 10;
    case "recurring-dev-pct": return value < 10;
    case "doc-accuracy":   return value > 75;
    case "conformance":    return value > 75;
    case "recurrence":     return value < 15;
    case "inv-duration":   return value <= 14;
    default:               return true;
  }
}

// ─── Components ──────────────────────────────────────────────────────────────

function getActualColor(metricId: string, value: number, onTarget: boolean): string {
  if (metricId === "recurring-dev-pct") {
    if (value >= 15) return "text-red-600";
    if (value >= 10) return "text-amber-600";
    return "text-green-700";
  }
  return onTarget ? "text-green-700" : "text-red-600";
}

function getStatusIcon(metricId: string, value: number, onTarget: boolean) {
  if (metricId === "recurring-dev-pct" && value >= 10 && value < 15) {
    return <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />;
  }
  return onTarget
    ? <CheckCircle className="w-3.5 h-3.5 text-green-600 shrink-0" />
    : <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />;
}

function MetricCard({
  metric,
  pillar,
  actual,
  actualLabel,
  onTarget,
  isSelected,
  onSelect,
}: {
  metric: MetricDetail;
  pillar: Pillar;
  actual: number;
  actualLabel: string;
  onTarget: boolean;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const colorClass = getActualColor(metric.id, actual, onTarget);
  return (
    <div
      onClick={onSelect}
      className={`cursor-pointer rounded-lg border p-3 transition-all duration-150 hover:shadow-md ${pillar.cardBg} ${
        isSelected ? "ring-2 ring-offset-1 shadow-md " + pillar.cardBorder : pillar.cardBorder
      }`}
    >
      {/* Actual vs target row */}
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          {getStatusIcon(metric.id, actual, onTarget)}
          <span className={`text-lg font-bold ${colorClass}`}>
            {actualLabel}
          </span>
        </div>
        <span className="text-xs text-gray-400 font-medium">
          <Target className="w-3 h-3 inline mr-0.5 mb-0.5" />
          {metric.targetLabel}
        </span>
      </div>
      <p className="text-sm font-semibold text-gray-900 leading-snug mb-1">{metric.name}</p>
      <p className="text-xs text-gray-500 leading-snug">{metric.description}</p>
      <p className={`text-xs font-medium mt-2 flex items-center gap-0.5 ${isSelected ? "text-gray-700" : "text-gray-400"}`}>
        <ChevronDown className="w-3 h-3" />
        {isSelected ? "Click to deselect" : "Why it matters"}
      </p>
    </div>
  );
}

function DetailPanel({
  metric,
  pillar,
  actualLabel,
  onTarget,
  onClose,
}: {
  metric: MetricDetail;
  pillar: Pillar;
  actualLabel: string;
  onTarget: boolean;
  onClose: () => void;
}) {
  return (
    <div className={`mt-6 rounded-xl border-2 ${pillar.cardBorder} ${pillar.cardBg} p-6 relative shadow-lg`}>
      <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700" aria-label="Close">
        <X className="w-5 h-5" />
      </button>
      <div className="flex flex-wrap items-start gap-3 mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900">{metric.name}</h3>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-sm font-bold ${onTarget ? "text-green-700" : "text-red-600"}`}>
              {onTarget ? "✓ On target:" : "✗ Off target:"} {actualLabel}
            </span>
            <span className="text-xs text-gray-400">Target: {metric.targetLabel}</span>
          </div>
        </div>
      </div>
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">Why It Matters</h4>
          <p className="text-sm text-gray-700 leading-relaxed">{metric.whyItMatters}</p>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">Key Drivers</h4>
          <ul className="space-y-1.5">
            {metric.keyDrivers.map((d, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-gray-400 flex-shrink-0" />
                {d}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">Connected To</h4>
          <div className="flex flex-wrap gap-1.5">
            {metric.connectedTo.map((name) => (
              <span key={name} className={`text-xs px-2.5 py-1 rounded-full font-medium ${pillar.badgeColor}`}>
                {name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ValueDriversPage() {
  const [selected, setSelected] = useState<SelectedMetric>(null);

  // ── Compute actuals from live data ────────────────────────────────────────
  const actuals = useMemo(() => {
    // Process Time
    const avgCycleDays = Math.round(
      PROCESS_CASES.reduce((s, c) => s + c.total_cycle_days, 0) / PROCESS_CASES.length
    );
    const agingDeviationsPct = Math.round(
      (PROCESS_CASES.filter(c => c.total_cycle_days > 30).length / PROCESS_CASES.length) * 100
    );

    // CAPA Mgmt
    const completedCapas = capas.filter(c => c.completion_date);
    const avgCapaClosureDays = completedCapas.length
      ? Math.round(completedCapas.reduce((s, c) => s + daysBetween(c.created_date, c.completion_date), 0) / completedCapas.length)
      : 0;
    const agingCapas = capas.filter(
      c => c.effectiveness_check_status !== "Completed" && daysBetween(c.created_date, null) > 90
    ).length;

    // Capacity
    const invUtilization = 78; // approximated from open deviation count vs. 101.2 FTE hrs/week
    const openDeviations = deviations.filter(d => d.status !== "Closed").length;

    // Compliance & Risk
    const recurringDevPct = Math.round(
      (deviations.filter(d => d.recurrence_flag === 1).length / deviations.length) * 100
    );
    const docAccuracyPct = Math.round(
      (deviations.filter(d => d.root_cause_category !== "Documentation Error").length / deviations.length) * 100
    );

    // Investigation Quality
    const conformanceScore = CONFORMANCE_SCORE;
    const recurrenceRate = Math.round(
      (deviations.filter(d => d.recurrence_flag === 1).length / deviations.length) * 100
    );
    const withInvDates = deviations.filter(d => d.investigation_start && d.investigation_complete);
    const avgInvDuration = withInvDates.length
      ? Math.round(
          withInvDates.reduce((s, d) => s + daysBetween(d.investigation_start!, d.investigation_complete), 0) / withInvDates.length
        )
      : 0;

    return {
      "cycle-time":        { value: avgCycleDays,        label: `${avgCycleDays}d` },
      "aging-deviations":  { value: agingDeviationsPct,  label: `${agingDeviationsPct}%` },
      "capa-closure":      { value: avgCapaClosureDays,   label: `${avgCapaClosureDays}d` },
      "aging-capas":       { value: agingCapas,           label: `${agingCapas}` },
      "utilization":           { value: invUtilization,       label: `${invUtilization}%` },
      "backlog":               { value: openDeviations,       label: `${openDeviations}` },
      "recurring-dev-pct":     { value: recurringDevPct,      label: `${recurringDevPct}%` },
      "doc-accuracy":          { value: docAccuracyPct,       label: `${docAccuracyPct}%` },
      "conformance":       { value: conformanceScore,     label: `${conformanceScore}%` },
      "recurrence":        { value: recurrenceRate,       label: `${recurrenceRate}%` },
      "inv-duration":      { value: avgInvDuration,       label: `${avgInvDuration}d` },
    } as Record<string, { value: number; label: string }>;
  }, []);

  const handleSelect = (pillarId: string, metricId: string) => {
    setSelected(s => s?.pillarId === pillarId && s?.metricId === metricId ? null : { pillarId, metricId });
  };

  const selectedPillar = selected ? PILLARS.find(p => p.id === selected.pillarId) : null;
  const selectedMetric = selectedPillar?.metrics.find(m => m.id === selected!.metricId);
  const selectedActual = selected ? actuals[selected.metricId] : null;

  // Summary row: how many metrics are on/off target
  const allMetrics = PILLARS.flatMap(p => p.metrics);
  const onTargetCount = allMetrics.filter(m => {
    const a = actuals[m.id];
    return a ? isOnTarget(m.id, a.value) : false;
  }).length;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-[1400px] mx-auto">

        {/* Page header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Value Driver Tree</h1>
          <p className="text-sm text-gray-500 max-w-3xl">
            Operational drivers of deviation management performance — showing current actuals against targets.
            Green = on target, red = off target. Click any metric to explore regulatory context and key drivers.
          </p>
          <div className="mt-3 flex items-center gap-3">
            <span className="text-xs bg-white border border-gray-200 rounded-full px-3 py-1 text-gray-600">
              <CheckCircle className="w-3 h-3 inline text-green-600 mr-1 mb-0.5" />
              {onTargetCount} of {allMetrics.length} metrics on target
            </span>
            <span className="text-xs bg-white border border-gray-200 rounded-full px-3 py-1 text-gray-600">
              <AlertCircle className="w-3 h-3 inline text-red-500 mr-1 mb-0.5" />
              {allMetrics.length - onTargetCount} require attention
            </span>
          </div>
        </div>

        {/* Tree container */}
        <div className="overflow-x-auto pb-4">
          <div className="min-w-[1100px]">

            {/* ROOT NODE */}
            <div className="flex justify-center mb-0">
              <div className="bg-slate-800 text-white rounded-2xl px-10 py-5 text-center shadow-lg max-w-xl">
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-1">
                  Strategic Outcome
                </p>
                <h2 className="text-xl font-bold leading-tight">
                  Deviation Management Performance
                </h2>
                <p className="text-sm text-slate-300 mt-1.5 leading-snug">
                  The speed, accuracy, and compliance with which deviations are investigated, resolved, and prevented from recurring
                </p>
              </div>
            </div>

            {/* Connector: root → horizontal bar */}
            <div className="flex justify-center">
              <div className="w-px h-8 bg-gray-300" />
            </div>

            {/* Horizontal bar */}
            <div className="relative h-px mx-[10%]">
              <div className="absolute inset-0 bg-gray-300" />
            </div>

            {/* Vertical drops */}
            <div className="grid grid-cols-5 gap-3 mb-0">
              {PILLARS.map(p => (
                <div key={p.id} className="flex justify-center">
                  <div className="w-px h-8 bg-gray-300" />
                </div>
              ))}
            </div>

            {/* PILLAR NODES */}
            <div className="grid grid-cols-5 gap-3">
              {PILLARS.map(pillar => (
                <div key={pillar.id} className="flex flex-col items-center">
                  {/* Pillar header — links to relevant page */}
                  {pillar.pageLink ? (
                    <Link
                      href={pillar.pageLink}
                      className={`w-full rounded-xl px-4 py-3 text-center shadow-md text-white hover:opacity-90 transition-opacity ${pillar.headerBg}`}
                    >
                      <p className="text-sm font-bold leading-snug">{pillar.name}</p>
                      <p className="text-xs mt-0.5 opacity-80 leading-snug">{pillar.subtitle}</p>
                      <p className="text-xs mt-1 opacity-70 flex items-center justify-center gap-0.5">
                        View details <ArrowRight className="w-3 h-3" />
                      </p>
                    </Link>
                  ) : (
                    <div className={`w-full rounded-xl px-4 py-3 text-center shadow-md text-white ${pillar.headerBg}`}>
                      <p className="text-sm font-bold leading-snug">{pillar.name}</p>
                      <p className="text-xs mt-0.5 opacity-80 leading-snug">{pillar.subtitle}</p>
                    </div>
                  )}

                  {/* Connector pillar → metrics */}
                  <div className="w-px h-6 bg-gray-300" />

                  {/* Metrics column */}
                  <div className="w-full space-y-2.5">
                    {pillar.metrics.map((metric, idx) => {
                      const actual = actuals[metric.id];
                      const onTarget = actual ? isOnTarget(metric.id, actual.value) : true;
                      const isSelected = selected?.pillarId === pillar.id && selected?.metricId === metric.id;
                      return (
                        <div key={metric.id} className="relative">
                          {idx > 0 && (
                            <div className="flex justify-center -mt-2.5 mb-2.5">
                              <div className="w-px h-2.5 bg-gray-200" />
                            </div>
                          )}
                          <MetricCard
                            metric={metric}
                            pillar={pillar}
                            actual={actual?.value ?? 0}
                            actualLabel={actual?.label ?? "—"}
                            onTarget={onTarget}
                            isSelected={isSelected}
                            onSelect={() => handleSelect(pillar.id, metric.id)}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Detail panel */}
        {selectedPillar && selectedMetric && selectedActual && (
          <DetailPanel
            metric={selectedMetric}
            pillar={selectedPillar}
            actualLabel={selectedActual.label}
            onTarget={isOnTarget(selectedMetric.id, selectedActual.value)}
            onClose={() => setSelected(null)}
          />
        )}

        {/* Root drivers footer */}
        <div className="mt-10 border-t border-gray-200 pt-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">
            Root drivers influencing all pillars
          </p>
          <div className="flex flex-wrap gap-2">
            {["Equipment Reliability", "Operator Training & Competency", "Documentation Quality", "Human Factors & Workload", "Environmental Controls", "Supplier Quality"].map(d => (
              <span key={d} className="text-sm text-gray-600 bg-white border border-gray-200 rounded-full px-3 py-1 shadow-sm">
                {d}
              </span>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-3">
            These foundational factors are upstream of all five pillars. Improvements to any root driver will propagate across multiple metrics simultaneously.
          </p>
        </div>
      </div>
    </div>
  );
}
