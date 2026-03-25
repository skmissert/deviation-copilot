"use client";

import { useState, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import {
  AlertTriangle, CheckCircle, Clock, TrendingDown,
  ZapOff, RefreshCw, ArrowRight, ChevronDown, ChevronUp, Info
} from "lucide-react";
import {
  PROCESS_CASES, STEP_METRICS, VARIANTS, CONFORMANCE_SCORE,
  INEFFICIENCIES, ACTIVITY_LABELS,
  type Variant, type Inefficiency, type StepMetrics,
} from "@/lib/data/processEvents";

// ─── Colour helpers ───────────────────────────────────────────────────────────

function dwellColor(days: number): string {
  if (days <= 2)  return "#dcfce7";  // green-100
  if (days <= 7)  return "#fef9c3";  // yellow-100
  if (days <= 14) return "#fed7aa";  // orange-100
  return "#fee2e2";                  // red-100
}
function dwellTextColor(days: number): string {
  if (days <= 2)  return "#166534";
  if (days <= 7)  return "#854d0e";
  if (days <= 14) return "#c2410c";
  return "#991b1b";
}

// ─── SVG Process Graph ────────────────────────────────────────────────────────

const MAIN_STEPS = [
  { id: "DEV_REPORTED",          x: 60,  y: 60  },
  { id: "CONTAINMENT_ACTIONED",  x: 60,  y: 140 },
  { id: "TRIAGE_COMPLETE",       x: 60,  y: 220 },
  { id: "INVESTIGATION_STARTED", x: 60,  y: 300 },
  { id: "INVESTIGATION_COMPLETE",x: 60,  y: 380 },
  { id: "CAPA_CREATED",          x: 60,  y: 460 },
  { id: "CAPA_IMPLEMENTED",      x: 60,  y: 540 },
  { id: "QA_REVIEW",             x: 60,  y: 620 },
  { id: "DEV_CLOSED",            x: 60,  y: 700 },
] as const;

const NODE_W = 210;
const NODE_H = 42;
const CENTER_X = 60;
const REWORK_X = 320; // x-position for rework side nodes

function getStepMetric(actId: string): StepMetrics | undefined {
  return STEP_METRICS.find(s => s.activity === actId);
}

function ProcessGraph({ selectedVariant }: { selectedVariant: number | null }) {
  const totalCases = PROCESS_CASES.length;

  // edge frequency: count cases that have both activities in sequence
  function edgeCount(from: string, to: string): number {
    return PROCESS_CASES.filter(pc => {
      const acts = pc.events.map(e => e.activity);
      const fi = acts.lastIndexOf(from as any);
      const ti = acts.indexOf(to as any, fi);
      return fi !== -1 && ti !== -1;
    }).length;
  }

  const mainEdges = MAIN_STEPS.slice(0, -1).map((step, i) => ({
    from: step.id,
    to: MAIN_STEPS[i + 1].id,
    count: edgeCount(step.id, MAIN_STEPS[i + 1].id),
    y1: step.y + NODE_H,
    y2: MAIN_STEPS[i + 1].y,
  }));

  // Rework loop: Investigation Complete → Re-investigation
  const reworkCount = PROCESS_CASES.filter(c => c.has_rework).length;
  // Out-of-sequence: early CAPA
  const earlyCapaCount = PROCESS_CASES.filter(c => c.variant_id === 4).length;
  // No-CAPA shortcut: Investigation Complete → QA Review (skipping CAPA)
  const noCapaCount = PROCESS_CASES.filter(c => c.variant_id === 2).length;
  // Director escalation
  const escalationCount = PROCESS_CASES.filter(c => c.variant_id === 5).length;

  return (
    <svg viewBox={`0 0 460 770`} className="w-full h-full" style={{ maxHeight: 760 }}>
      {/* ── Main flow edges ── */}
      {mainEdges.map((e, i) => {
        const thick = Math.max(1.5, (e.count / totalCases) * 14);
        const opacity = selectedVariant ? 0.25 : 0.85;
        return (
          <g key={i}>
            <line
              x1={CENTER_X + NODE_W / 2} y1={e.y1}
              x2={CENTER_X + NODE_W / 2} y2={e.y2}
              stroke="#3b82f6" strokeWidth={thick} opacity={opacity}
            />
            <text x={CENTER_X + NODE_W / 2 + 8} y={(e.y1 + e.y2) / 2 + 4} fontSize={9} fill="#6b7280">
              {e.count} cases
            </text>
          </g>
        );
      })}

      {/* ── Rework loop: CAPA Implemented → Re-investigation (right side) ── */}
      {reworkCount > 0 && (
        <g opacity={selectedVariant && selectedVariant !== 3 ? 0.15 : 1}>
          <path
            d={`M ${CENTER_X + NODE_W} ${380 + NODE_H / 2}
                Q ${REWORK_X + 80} ${430}
                  ${REWORK_X + 60} ${430}
                Q ${REWORK_X + 10} ${430}
                  ${REWORK_X} ${380 + NODE_H / 2}`}
            fill="none" stroke="#dc2626" strokeWidth={2.5} strokeDasharray="5,3"
            markerEnd="url(#arrowRed)"
          />
          <rect x={REWORK_X - 5} y={408} width={92} height={18} rx={4} fill="#fee2e2" />
          <text x={REWORK_X - 1} y={421} fontSize={9} fill="#991b1b" fontWeight="600">
            ↺ Re-investigation
          </text>
          <text x={REWORK_X + 7} y={433} fontSize={8} fill="#dc2626">{reworkCount} cases</text>
        </g>
      )}

      {/* ── Out-of-sequence CAPA (left side arrow, early) ── */}
      {earlyCapaCount > 0 && (
        <g opacity={selectedVariant && selectedVariant !== 4 ? 0.15 : 1}>
          <path
            d={`M ${CENTER_X - 10} ${300 + NODE_H / 2}
                Q ${-30} ${390}
                  ${CENTER_X - 10} ${460 + NODE_H / 2}`}
            fill="none" stroke="#d97706" strokeWidth={2} strokeDasharray="4,3"
          />
          <rect x={-68} y={370} width={62} height={30} rx={4} fill="#fef3c7" />
          <text x={-65} y={382} fontSize={8} fill="#92400e" fontWeight="600">Pre-emptive</text>
          <text x={-65} y={393} fontSize={8} fill="#92400e">CAPA ({earlyCapaCount})</text>
        </g>
      )}

      {/* ── No-CAPA shortcut: Investigation Complete → QA Review ── */}
      {noCapaCount > 0 && (
        <g opacity={selectedVariant && selectedVariant !== 2 ? 0.15 : 1}>
          <path
            d={`M ${CENTER_X + NODE_W} ${380 + NODE_H / 2}
                Q ${REWORK_X + 40} ${520}
                  ${CENTER_X + NODE_W} ${620 + NODE_H / 2}`}
            fill="none" stroke="#2563eb" strokeWidth={2} strokeDasharray="6,3"
          />
          <rect x={REWORK_X - 5} y={505} width={80} height={26} rx={4} fill="#dbeafe" />
          <text x={REWORK_X - 1} y={517} fontSize={8} fill="#1e40af" fontWeight="600">Skip CAPA</text>
          <text x={REWORK_X - 1} y={528} fontSize={8} fill="#1e40af">{noCapaCount} cases (no CAPA req.)</text>
        </g>
      )}

      {/* ── Escalation branch: Triage → Director ── */}
      {escalationCount > 0 && (
        <g opacity={selectedVariant && selectedVariant !== 5 ? 0.15 : 1}>
          <path
            d={`M ${CENTER_X - 10} ${220 + NODE_H / 2}
                Q ${-40} ${260}
                  ${-40} ${270}`}
            fill="none" stroke="#7c3aed" strokeWidth={2}
          />
          <rect x={-88} y={268} width={88} height={28} rx={4} fill="#f3e8ff" />
          <text x={-85} y={280} fontSize={8} fill="#5b21b6" fontWeight="600">CAPA Review</text>
          <text x={-85} y={291} fontSize={8} fill="#5b21b6">Board ({escalationCount})</text>
        </g>
      )}

      {/* ── Arrow markers ── */}
      <defs>
        <marker id="arrowRed" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="#dc2626" />
        </marker>
      </defs>

      {/* ── Main process nodes ── */}
      {MAIN_STEPS.map(step => {
        const metric = getStepMetric(step.id);
        const bg = metric ? dwellColor(metric.avg_dwell_days) : "#f9fafb";
        const textC = metric ? dwellTextColor(metric.avg_dwell_days) : "#374151";
        const hasViolation = (metric?.violation_count ?? 0) > 0;
        return (
          <g key={step.id}>
            <rect
              x={CENTER_X} y={step.y} width={NODE_W} height={NODE_H}
              rx={7} ry={7}
              fill={bg}
              stroke={hasViolation ? "#f97316" : "#e5e7eb"}
              strokeWidth={hasViolation ? 2 : 1}
            />
            <text x={CENTER_X + 12} y={step.y + 16} fontSize={10} fontWeight="700" fill={textC}>
              {ACTIVITY_LABELS[step.id as keyof typeof ACTIVITY_LABELS]}
            </text>
            {metric && (
              <text x={CENTER_X + 12} y={step.y + 30} fontSize={9} fill="#9ca3af">
                {metric.case_count} cases · avg {metric.avg_dwell_days}d
                {hasViolation ? ` · ⚠ ${metric.violation_count} violations` : ""}
              </text>
            )}
          </g>
        );
      })}

      {/* ── Legend ── */}
      <g transform="translate(5, 740)">
        {[
          { color: "#dcfce7", label: "≤2 days" },
          { color: "#fef9c3", label: "≤7 days" },
          { color: "#fed7aa", label: "≤14 days" },
          { color: "#fee2e2", label: ">14 days" },
        ].map((l, i) => (
          <g key={i} transform={`translate(${i * 100}, 0)`}>
            <rect width={12} height={12} rx={2} fill={l.color} stroke="#e5e7eb" />
            <text x={15} y={10} fontSize={8} fill="#6b7280">{l.label}</text>
          </g>
        ))}
        <rect x={405} width={12} height={12} rx={2} fill="#fff" stroke="#f97316" strokeWidth={2} />
        <text x={420} y={10} fontSize={8} fill="#f97316">Violation</text>
      </g>
    </svg>
  );
}

// ─── Severity badge ───────────────────────────────────────────────────────────

function SeverityBadge({ s }: { s: Inefficiency["severity"] }) {
  const c = s === "high" ? "bg-red-100 text-red-800 border-red-200"
          : s === "medium" ? "bg-amber-100 text-amber-800 border-amber-200"
          : "bg-gray-100 text-gray-600 border-gray-200";
  return <span className={`text-xs px-2 py-0.5 rounded border font-medium uppercase ${c}`}>{s}</span>;
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ProcessMapPage() {
  const [selectedVariant, setSelectedVariant] = useState<number | null>(null);
  const [expandedIneff, setExpandedIneff] = useState<string | null>(null);

  const happyPathRate = VARIANTS.find(v => v.is_happy_path)?.pct ?? 0;
  const avgCycleTime  = Math.round(PROCESS_CASES.reduce((s, c) => s + c.total_cycle_days, 0) / PROCESS_CASES.length);
  const reworkRate    = Math.round((PROCESS_CASES.filter(c => c.has_rework).length / PROCESS_CASES.length) * 100);

  const stepBarData = useMemo(() =>
    STEP_METRICS
      .filter(s => ["INVESTIGATION_STARTED","INVESTIGATION_COMPLETE","CAPA_CREATED","CAPA_IMPLEMENTED","QA_REVIEW"].includes(s.activity))
      .map(s => ({
        name: s.label.replace("Investigation","Inv.").replace("Complete","Cmplt").replace("Implemented","Impl."),
        avg: s.avg_dwell_days,
        max: s.max_dwell_days,
        violations: s.violation_count,
      }))
  , []);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900">Process Intelligence</h1>
            <span className="text-xs font-medium px-2 py-1 bg-purple-100 text-purple-800 rounded-full border border-purple-200">
              Process Mining
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-0.5">
            Actual process discovered from 60 event logs · 7-month period · Single site
            <span className="ml-2 text-purple-600 font-medium">— not the SOP, the reality</span>
          </p>
        </div>
        <a href="/enterprise-explainer" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
          About This Demo <ArrowRight className="w-3 h-3" />
        </a>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-5 gap-3">
        {[
          { label: "Cases Analyzed",      value: PROCESS_CASES.length,      sub: "deviations mined",              color: "text-gray-900" },
          { label: "Path without CAPA",      value: `${happyPathRate}%`,        sub: "no CAPA required",              color: happyPathRate > 50 ? "text-green-700" : "text-amber-700" },
          { label: "Conformance Score",    value: `${CONFORMANCE_SCORE}%`,    sub: "no sequence violations",        color: CONFORMANCE_SCORE > 75 ? "text-green-700" : "text-red-700" },
          { label: "Avg Cycle Time",       value: `${avgCycleTime}d`,         sub: "report to closure",             color: "text-gray-900" },
          { label: "Rework Rate",          value: `${reworkRate}%`,           sub: "re-investigation required",     color: reworkRate > 10 ? "text-red-700" : "text-green-700" },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-lg border border-gray-200 p-3">
            <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">{k.label}</p>
            <p className={`text-2xl font-bold mt-0.5 ${k.color}`}>{k.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Main body — process graph + right panels */}
      <div className="grid grid-cols-5 gap-4 items-start">

        {/* Process Graph */}
        <div className="col-span-2 bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-800">Discovered Process Map</h2>
            {selectedVariant && (
              <button onClick={() => setSelectedVariant(null)} className="text-xs text-blue-600 hover:underline">
                Clear filter
              </button>
            )}
          </div>
          <p className="text-xs text-gray-400 mb-3">Node colour = avg dwell time · Edge width = case frequency · ⚠ = conformance violation</p>
          <div className="overflow-auto" style={{ maxHeight: 780 }}>
            <ProcessGraph selectedVariant={selectedVariant} />
          </div>
        </div>

        {/* Right column */}
        <div className="col-span-3 space-y-4">

          {/* Process Variants */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h2 className="text-sm font-semibold text-gray-800 mb-3">
              Process Variants
              <span className="text-xs font-normal text-gray-400 ml-2">Click to highlight path on graph</span>
            </h2>
            <div className="space-y-2">
              {VARIANTS.map(v => (
                <div
                  key={v.id}
                  onClick={() => setSelectedVariant(selectedVariant === v.id ? null : v.id)}
                  className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                    selectedVariant === v.id ? "border-current bg-opacity-10" : "border-gray-200 hover:border-gray-300"
                  }`}
                  style={{ borderColor: selectedVariant === v.id ? v.color : undefined, backgroundColor: selectedVariant === v.id ? `${v.color}15` : undefined }}
                >
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: v.color }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-800">{v.label}</span>
                      {v.is_happy_path && <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-medium">NO CAPA</span>}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">{v.description}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-gray-900">{v.case_count} <span className="text-xs font-normal text-gray-400">cases</span></p>
                    <p className="text-xs text-gray-400">{v.pct}% · avg {v.avg_cycle_days}d</p>
                  </div>
                  <div className="w-16 shrink-0">
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div className="h-1.5 rounded-full" style={{ width: `${v.pct}%`, backgroundColor: v.color }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Step performance chart */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h2 className="text-sm font-semibold text-gray-800 mb-1">Step Duration Analysis</h2>
            <p className="text-xs text-gray-400 mb-3">Average days spent at each step · Investigation and CAPA are primary cycle time drivers</p>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={stepBarData} layout="vertical" margin={{ left: 80, right: 30 }}>
                <XAxis type="number" tick={{ fontSize: 10 }} unit="d" />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={80} />
                <Tooltip formatter={(v) => [`${v} days`, "Avg"]} contentStyle={{ fontSize: 11 }} />
                <Bar dataKey="avg" name="Avg days" radius={[0, 4, 4, 0]}>
                  {stepBarData.map((entry, i) => (
                    <Cell key={i} fill={entry.avg > 14 ? "#ef4444" : entry.avg > 7 ? "#f59e0b" : "#3b82f6"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Violations summary */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-800">Conformance Violations &amp; Process Inefficiencies</h2>
              <span className="text-xs text-gray-500 font-medium">
                Click any row to expand
              </span>
            </div>
            <div className="space-y-2">
              {INEFFICIENCIES.map(ineff => (
                <div key={ineff.id} className="rounded-lg border border-gray-200 overflow-hidden">
                  <button
                    className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 text-left"
                    onClick={() => setExpandedIneff(expandedIneff === ineff.id ? null : ineff.id)}
                  >
                    {ineff.severity === "high"
                      ? <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                      : <ZapOff className="w-4 h-4 text-amber-500 shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-800">{ineff.title}</span>
                        <SeverityBadge s={ineff.severity} />
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 truncate">{ineff.detail}</p>
                    </div>
                    <span className="text-xs text-gray-400 shrink-0 mr-1">{ineff.case_count} cases</span>
                    {expandedIneff === ineff.id ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />}
                  </button>
                  {expandedIneff === ineff.id && (
                    <div className="px-4 pb-3 space-y-2 bg-gray-50 border-t border-gray-100">
                      <div className="grid grid-cols-2 gap-3 mt-2">
                        <div>
                          <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium mb-0.5">Business Impact</p>
                          <p className="text-xs text-gray-700">{ineff.impact}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium mb-0.5">Recommended Action</p>
                          <p className="text-xs text-green-800 bg-green-50 p-1.5 rounded">{ineff.recommendation}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom callout */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-purple-900">How this was discovered</p>
          <p className="text-sm text-purple-800 mt-0.5 leading-relaxed">
            This map was automatically reconstructed from 60 deviation event logs — no manual process interviews or workshops required.
            Each node represents an activity; edges are drawn from actual case sequences.
            Violations, rework loops, and bottlenecks are detected by comparing observed sequences against the reference SOP.
            With live ERP data, this analysis updates in real-time across all sites.
            <a href="/enterprise-explainer" className="ml-2 underline font-medium">About This Demo →</a>
          </p>
        </div>
      </div>
    </div>
  );
}
