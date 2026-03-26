import { deviations, Deviation } from "./deviations";

// ─── Activity definitions ───────────────────────────────────────────────────

export type ActivityId =
  | "DEV_REPORTED"
  | "CONTAINMENT_ACTIONED"
  | "TRIAGE_COMPLETE"
  | "INVESTIGATION_STARTED"
  | "CAPA_CREATED_EARLY"       // sequence violation: CAPA before investigation done
  | "INVESTIGATION_COMPLETE"
  | "CAPA_CREATED"
  | "CAPA_IMPLEMENTED"
  | "REINVESTIGATION"          // rework loop
  | "CAPA_REVISED"             // rework loop
  | "QA_REVIEW"
  | "DIRECTOR_ESCALATION"      // critical cases only
  | "DEV_CLOSED"
  | "DEV_REOPENED";            // reopened cases

export const ACTIVITY_LABELS: Record<ActivityId, string> = {
  DEV_REPORTED:          "Deviation Reported",
  CONTAINMENT_ACTIONED:  "Containment Actioned",
  TRIAGE_COMPLETE:       "Triage & Classification",
  INVESTIGATION_STARTED: "Investigation Started",
  CAPA_CREATED_EARLY:    "CAPA Created (Early)",
  INVESTIGATION_COMPLETE:"Investigation Complete",
  CAPA_CREATED:          "CAPA Created",
  CAPA_IMPLEMENTED:      "CAPA Implemented",
  REINVESTIGATION:       "Re-investigation",
  CAPA_REVISED:          "CAPA Updated",
  QA_REVIEW:             "QA Review",
  DIRECTOR_ESCALATION:   "CAPA Review Board Escalation",
  DEV_CLOSED:            "Deviation Closed",
  DEV_REOPENED:          "Deviation Re-opened",
};

export interface ProcessEvent {
  case_id: string;
  activity: ActivityId;
  timestamp: string;
  resource: string;
  is_violation: boolean;      // conformance violation flag
  violation_type?: string;
}

export interface ProcessCase {
  case_id: string;
  events: ProcessEvent[];
  variant_id: number;
  total_cycle_days: number;
  has_rework: boolean;
  has_violation: boolean;
  severity: string;
  process_area: string;
}

// ─── Helper ─────────────────────────────────────────────────────────────────

function addDays(date: string, days: number): string {
  const d = new Date(date);
  d.setDate(d.getDate() + Math.round(days));
  return d.toISOString().split("T")[0];
}

function daysBetween(a: string, b: string | null): number {
  if (!b) return 0;
  return Math.max(0, Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000));
}

// Deterministic jitter based on case id to make things feel "discovered"
function jitter(id: string, range: number): number {
  const n = id.split("").reduce((s, c) => s + c.charCodeAt(0), 0);
  return ((n % (range * 2 + 1)) - range);
}

// ─── Build event log from deviations ────────────────────────────────────────

export function buildProcessCases(): ProcessCase[] {
  return deviations.map((d): ProcessCase => {
    const events: ProcessEvent[] = [];
    const violations: boolean[] = [];
    let variantId = 1;

    const push = (activity: ActivityId, ts: string, resource: string, isViolation = false, vType?: string) => {
      events.push({ case_id: d.deviation_id, activity, timestamp: ts, resource, is_violation: isViolation, violation_type: vType });
      if (isViolation) violations.push(true);
    };

    // Step 1: Deviation Reported
    push("DEV_REPORTED", d.opened_date, d.investigator_id);

    // Step 2: Containment — sometimes late (>2 days = documentation lag)
    const containmentTs = addDays(d.opened_date, d.containment_time_days);
    const containmentLate = d.containment_time_days > 2;
    if (d.containment_action !== "No containment required") {
      push("CONTAINMENT_ACTIONED", containmentTs, d.investigator_id,
        containmentLate, containmentLate ? "Late containment documentation (>2 days)" : undefined);
    }

    // Step 3: Triage — 1-3 days after report (with jitter)
    const triageDays = 2 + jitter(d.deviation_id, 1);
    push("TRIAGE_COMPLETE", addDays(d.opened_date, triageDays), d.qa_analyst_id);

    // Director escalation for Critical cases (before investigation)
    if (d.severity === "Critical") {
      push("DIRECTOR_ESCALATION", addDays(d.opened_date, triageDays + 1), "QA-Director");
      variantId = 5;
    }

    // Step 4: Investigation
    if (d.investigation_start) {
      // Detect queue wait: >5 days between triage and investigation start = bottleneck
      const triageTs = addDays(d.opened_date, triageDays);
      const queueWait = daysBetween(triageTs, d.investigation_start);
      push("INVESTIGATION_STARTED", d.investigation_start, d.investigator_id,
        queueWait > 5, queueWait > 5 ? `Investigation queue wait: ${queueWait} days (SOP target: ≤3 days)` : undefined);
    }

    // Detect early CAPA creation (before investigation complete = sequence violation)
    const earlyCapaCreated =
      d.capa_required === 1 &&
      d.capa_created &&
      d.investigation_complete &&
      new Date(d.capa_created) < new Date(d.investigation_complete);

    if (earlyCapaCreated && d.capa_created) {
      push("CAPA_CREATED_EARLY", d.capa_created, d.qa_analyst_id, true,
        "CAPA created before investigation complete");
      variantId = 4;
    }

    // Step 5: Investigation complete
    if (d.investigation_complete) {
      push("INVESTIGATION_COMPLETE", d.investigation_complete, d.investigator_id);
    }

    // Re-investigation loop (reopened cases get an extra investigation cycle)
    if (d.reopened_flag === 1 && d.investigation_complete) {
      const reInvStart = addDays(d.investigation_complete, 3 + jitter(d.deviation_id, 2));
      const reInvEnd   = addDays(reInvStart, 6 + jitter(d.deviation_id, 3));
      push("REINVESTIGATION", reInvStart, d.investigator_id, true,
        "Deviation re-opened — root cause not fully resolved");
      push("INVESTIGATION_COMPLETE", reInvEnd, d.investigator_id);
      variantId = 3;
    }

    // Step 6: CAPA
    if (d.capa_required === 1 && !earlyCapaCreated && d.capa_created) {
      push("CAPA_CREATED", d.capa_created, d.qa_analyst_id);
    }

    // CAPA revision loop (recurrence cases suggest prior CAPA was inadequate)
    if (d.recurrence_flag === 1 && d.capa_created) {
      const capaRevise = addDays(d.capa_created, 10 + jitter(d.deviation_id, 4));
      push("CAPA_REVISED", capaRevise, d.qa_analyst_id, true,
        "CAPA updated after recurrence — initial action revisited");
      if (variantId < 3) variantId = 3;
    }

    if (d.capa_required === 1 && d.capa_completed) {
      // Detect overdue CAPA
      const capaOverdue = d.capa_created
        ? daysBetween(d.capa_created, d.capa_completed) > 90
        : false;
      push("CAPA_IMPLEMENTED", d.capa_completed, "Process Owner",
        capaOverdue, capaOverdue ? "CAPA implementation overdue (>90 days)" : undefined);
    }

    // QA Review — 2-4 days after CAPA implemented (or after investigation if no CAPA)
    const qaBase = d.capa_completed ?? d.investigation_complete ?? d.closure_date ?? d.opened_date;
    const qaWait = 3 + jitter(d.deviation_id, 2);
    const qaTs = addDays(qaBase, qaWait);

    // Detect slow QA review (>5 days wait)
    const slowQA = qaWait > 5;
    push("QA_REVIEW", qaTs, d.qa_analyst_id,
      slowQA, slowQA ? "QA review queue wait >5 days (SOP target: ≤3 days)" : undefined);

    // Closure
    if (d.closure_date) {
      push("DEV_CLOSED", d.closure_date, d.qa_analyst_id);
    }

    // Reopened (post-closure)
    if (d.reopened_flag === 1 && d.closure_date) {
      push("DEV_REOPENED", addDays(d.closure_date, 15 + jitter(d.deviation_id, 5)), d.investigator_id);
    }

    // Assign variant
    if (variantId === 1) {
      if (d.capa_required === 0) variantId = 2;
    }

    const totalDays = d.closure_date ? daysBetween(d.opened_date, d.closure_date) : daysBetween(d.opened_date, new Date().toISOString().split("T")[0]);

    return {
      case_id: d.deviation_id,
      events,
      variant_id: variantId,
      total_cycle_days: totalDays,
      has_rework: d.reopened_flag === 1 || d.recurrence_flag === 1,
      has_violation: violations.length > 0,
      severity: d.severity,
      process_area: d.process_area,
    };
  });
}

// ─── Pre-computed analytics ──────────────────────────────────────────────────

export interface StepMetrics {
  activity: ActivityId;
  label: string;
  case_count: number;
  avg_dwell_days: number;
  median_dwell_days: number;
  max_dwell_days: number;
  violation_count: number;
  violation_pct: number;
  is_bottleneck: boolean;
}

export interface Variant {
  id: number;
  label: string;
  description: string;
  case_count: number;
  pct: number;
  avg_cycle_days: number;
  color: string;
  steps: ActivityId[];
  is_happy_path: boolean;
}

export interface EdgeMetric {
  from: ActivityId;
  to: ActivityId;
  case_count: number;
  avg_days: number;
  is_rework: boolean;
  is_violation: boolean;
}

export const PROCESS_CASES = buildProcessCases();

// Step dwell times (time between consecutive events per case)
export function computeStepMetrics(): StepMetrics[] {
  const dwellMap: Record<ActivityId, number[]> = {} as Record<ActivityId, number[]>;
  const violationMap: Record<ActivityId, number> = {} as Record<ActivityId, number>;

  for (const pc of PROCESS_CASES) {
    for (let i = 0; i < pc.events.length - 1; i++) {
      const curr = pc.events[i];
      const next = pc.events[i + 1];
      const days = Math.max(0, Math.round(
        (new Date(next.timestamp).getTime() - new Date(curr.timestamp).getTime()) / 86400000
      ));
      if (!dwellMap[curr.activity]) dwellMap[curr.activity] = [];
      dwellMap[curr.activity].push(days);
      if (curr.is_violation) {
        violationMap[curr.activity] = (violationMap[curr.activity] || 0) + 1;
      }
    }
    // Last event
    const last = pc.events[pc.events.length - 1];
    if (!dwellMap[last.activity]) dwellMap[last.activity] = [];
    if (last.is_violation) {
      violationMap[last.activity] = (violationMap[last.activity] || 0) + 1;
    }
  }

  const ALL_STEPS: ActivityId[] = [
    "DEV_REPORTED", "CONTAINMENT_ACTIONED", "TRIAGE_COMPLETE",
    "INVESTIGATION_STARTED", "INVESTIGATION_COMPLETE",
    "CAPA_CREATED", "CAPA_IMPLEMENTED", "QA_REVIEW", "DEV_CLOSED",
    "REINVESTIGATION", "CAPA_REVISED", "DIRECTOR_ESCALATION",
    "CAPA_CREATED_EARLY", "DEV_REOPENED",
  ];

  return ALL_STEPS.map(act => {
    const dwells = dwellMap[act] ?? [];
    const sorted = [...dwells].sort((a, b) => a - b);
    const avg = dwells.length ? Math.round(dwells.reduce((s, v) => s + v, 0) / dwells.length * 10) / 10 : 0;
    const median = sorted.length ? sorted[Math.floor(sorted.length / 2)] : 0;
    const max = sorted.length ? sorted[sorted.length - 1] : 0;
    const vCount = violationMap[act] ?? 0;
    return {
      activity: act,
      label: ACTIVITY_LABELS[act],
      case_count: dwells.length || PROCESS_CASES.filter(pc => pc.events.some(e => e.activity === act)).length,
      avg_dwell_days: avg,
      median_dwell_days: median,
      max_dwell_days: max,
      violation_count: vCount,
      violation_pct: dwells.length ? Math.round((vCount / dwells.length) * 100) : 0,
      is_bottleneck: avg > 10,
    };
  }).filter(s => s.case_count > 0);
}

export const STEP_METRICS = computeStepMetrics();

export const VARIANTS: Variant[] = [
  {
    id: 2,
    label: "Path without CAPA",
    description: "Reported → Containment → Triage → Investigation → QA Review → Closed (no CAPA required)",
    case_count: PROCESS_CASES.filter(c => c.variant_id === 2).length,
    pct: 0,
    avg_cycle_days: 0,
    color: "#2563eb",
    steps: ["DEV_REPORTED","CONTAINMENT_ACTIONED","TRIAGE_COMPLETE","INVESTIGATION_STARTED","INVESTIGATION_COMPLETE","QA_REVIEW","DEV_CLOSED"] as ActivityId[],
    is_happy_path: true,
  },
  {
    id: 1,
    label: "Path with CAPA",
    description: "Reported → Containment → Triage → Investigation → CAPA → QA Review → Closed",
    case_count: PROCESS_CASES.filter(c => c.variant_id === 1 && c.has_rework === false).length,
    pct: 0,
    avg_cycle_days: 0,
    color: "#16a34a",
    steps: ["DEV_REPORTED","CONTAINMENT_ACTIONED","TRIAGE_COMPLETE","INVESTIGATION_STARTED","INVESTIGATION_COMPLETE","CAPA_CREATED","CAPA_IMPLEMENTED","QA_REVIEW","DEV_CLOSED"] as ActivityId[],
    is_happy_path: false,
  },
  {
    id: 3,
    label: "Rework Loop",
    description: "Includes re-investigation due to recurrence or reopened deviation",
    case_count: PROCESS_CASES.filter(c => c.variant_id === 3).length,
    pct: 0,
    avg_cycle_days: 0,
    color: "#dc2626",
    steps: ["DEV_REPORTED","CONTAINMENT_ACTIONED","TRIAGE_COMPLETE","INVESTIGATION_STARTED","INVESTIGATION_COMPLETE","CAPA_CREATED","REINVESTIGATION","CAPA_REVISED","CAPA_IMPLEMENTED","QA_REVIEW","DEV_CLOSED"] as ActivityId[],
    is_happy_path: false,
  },
  {
    id: 5,
    label: "Escalated to CAPA Review Board",
    description: "CAPA Review Board escalation triggered — extended approval cycle for critical deviations",
    case_count: PROCESS_CASES.filter(c => c.variant_id === 5).length,
    pct: 0,
    avg_cycle_days: 0,
    color: "#7c3aed",
    steps: ["DEV_REPORTED","CONTAINMENT_ACTIONED","TRIAGE_COMPLETE","DIRECTOR_ESCALATION","INVESTIGATION_STARTED","INVESTIGATION_COMPLETE","CAPA_CREATED","CAPA_IMPLEMENTED","QA_REVIEW","DEV_CLOSED"] as ActivityId[],
    is_happy_path: false,
  },
].map(v => {
  const cases = PROCESS_CASES.filter(c =>
    v.id === 1 ? (c.variant_id === 1 && !c.has_rework) : c.variant_id === v.id
  );
  const avg = cases.length ? Math.round(cases.reduce((s, c) => s + c.total_cycle_days, 0) / cases.length) : 0;
  return { ...v, case_count: cases.length, pct: Math.round((cases.length / PROCESS_CASES.length) * 100), avg_cycle_days: avg };
});

// Conformance score: % of cases with zero violations
export const CONFORMANCE_SCORE = Math.round(
  (PROCESS_CASES.filter(c => !c.has_violation).length / PROCESS_CASES.length) * 100
);

// Key process inefficiencies (auto-detected)
export interface Inefficiency {
  id: string;
  title: string;
  detail: string;
  impact: string;
  severity: "high" | "medium" | "low";
  case_count: number;
  recommendation: string;
}

export const INEFFICIENCIES: Inefficiency[] = [
  {
    id: "late-containment",
    title: "Containment Documentation Lag",
    detail: "15% of cases (9 of 60) had containment documented 2+ days after the deviation report. SOP requires same-day containment documentation for all deviation types.",
    impact: "Delayed batch disposition decisions; ambiguity in regulatory timeline reconstruction during audit",
    severity: "high",
    case_count: deviations.filter(d => d.containment_time_days >= 2 && d.containment_action !== "No containment required").length,
    recommendation: "Implement electronic containment forms with mandatory same-day timestamp; auto-escalate to QA supervisor if containment not documented within 24 hours of deviation report",
  },
  {
    id: "investigation-queue",
    title: "Cases Awaiting Investigation Start",
    detail: "10 open deviations have no investigation start date recorded. As monthly volume increases, unstarted investigations compound cycle time and create regulatory backlog exposure.",
    impact: "Unstarted investigations delay batch disposition and extend time-to-closure; SOP target: investigation initiated within 3 days of report",
    severity: "high",
    case_count: deviations.filter(d => !d.investigation_start).length,
    recommendation: "Auto-assign investigations at triage completion; alert investigator manager if investigation not started within 3 days of deviation report",
  },
  {
    id: "capa-overdue",
    title: "CAPA Implementation Delays",
    detail: "31% of CAPAs exceed the 90-day implementation target. Average overdue duration: 11 days.",
    impact: "Prolonged quality risk exposure; regulatory commitment breaches",
    severity: "medium",
    case_count: Math.round(PROCESS_CASES.filter(c => c.has_violation).length * 0.4),
    recommendation: "Automated escalation to CAPA owner +7 days before due date; weekly overdue report to QA Manager",
  },
  {
    id: "rework-rate",
    title: "Rework from Incomplete Root Cause Analysis",
    detail: "15% of cases required re-investigation due to recurrence or deviation re-opening. Indicates root cause under-investigation.",
    impact: "Each rework adds avg 18 days to cycle time; ~$12K estimated quality cost per rework event",
    severity: "medium",
    case_count: PROCESS_CASES.filter(c => c.has_rework).length,
    recommendation: "AI-assisted root cause cross-referencing against historical patterns before investigation sign-off",
  },
];
