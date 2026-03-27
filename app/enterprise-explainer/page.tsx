"use client";

import {
  Database, GitBranch, Cpu, ArrowRight,
  CheckCircle, AlertTriangle, Info, Layers, RefreshCw, Globe,
} from "lucide-react";

const DEMO_VS_REAL = [
  {
    aspect: "Data source",
    demo: "60 synthetic deviations generated to reflect realistic patterns across four process areas. All batch IDs, investigator names, and timelines are fabricated.",
    real: "Event logs pulled directly from your QMS (Veeva, TrackWise), ERP (SAP, Oracle), and MES via lightweight read-only connectors. No synthetic data — every finding reflects your actual process.",
  },
  {
    aspect: "Process map",
    demo: "A pre-computed process graph built from the synthetic event log. The 5 variants, bottleneck timings, and conformance violations are illustrative — modelled on typical biopharma patterns, not your data.",
    real: "Process mining algorithms reconstruct your end-to-end deviation workflow from real timestamped activity records, case by case. Every variant, rework loop, and sequence violation is surfaced automatically from what actually happened.",
  },
  {
    aspect: "AI recommendations",
    demo: "Rule-based lookup tables keyed by root cause category. The AI Assistant output is deterministic and pre-scripted to demonstrate the interaction pattern.",
    real: "LLM-based reasoning over the actual deviation record, evidence package, and historical case database. Recommendations adapt to the specific deviation context, not a generic template.",
  },
  {
    aspect: "Investigator names & IDs",
    demo: "Six fictional investigators (Sarah Chen, Marcus Johnson, etc.) with fabricated workload distributions.",
    real: "Linked to your identity management system. Workload, utilisation, and assignment data reflect your actual team.",
  },
  {
    aspect: "Digital Twin model",
    demo: "A parametric model with estimated baseline values derived from pharma industry benchmarks. Slider outputs are illustrative, not calibrated to your environment.",
    real: "Calibrated to your actual throughput, investigator capacity, and historical cycle times. Scenario outputs reflect your specific constraints.",
  },
  {
    aspect: "Metrics & KPIs",
    demo: "Computed from the 60-record synthetic dataset. Numbers are plausible but not evidence of what your site would see.",
    real: "Computed from your live data, refreshed on a configurable cadence. Trend analysis is based on your actual historical record.",
  },
];

const WHAT_TRANSFERS = [
  "The workflow logic — intake, root cause, CAPA, review — mirrors standard GMP deviation management SOPs and would be configured to match your specific QMS process and data structure",
  "The human-in-the-loop design principle: AI suggests, investigator confirms or overrides. Nothing is recorded without explicit human approval. This governance model is non-negotiable in a GxP environment and would carry through to production",
  "The process mining approach — reconstructing actual workflow from event log data rather than relying on SOPs — is the same methodology we would apply to your Veeva data",
  "The audit trail and explainability design — showing evidence sources and confidence levels for every AI recommendation — reflects how we would architect accountability in a regulated environment",
];

const DATA_SOURCES = [
  { name: "SAP QM / ERP", desc: "Quality notifications, batch records, CAPA tasks, change requests", color: "bg-blue-50 border-blue-200" },
  { name: "Veeva Vault QMS", desc: "Deviation records, investigation documents, electronic signatures", color: "bg-indigo-50 border-indigo-200" },
  { name: "TrackWise / ETQ", desc: "Deviation events, CAPA workflows, effectiveness checks", color: "bg-purple-50 border-purple-200" },
  { name: "MES / SCADA", desc: "Equipment event logs, process parameter exceedances, alarms", color: "bg-amber-50 border-amber-200" },
  { name: "LIMS", desc: "Lab test results, OOS/OOT events, retest sequences", color: "bg-green-50 border-green-200" },
  { name: "Oracle EBS / Cloud", desc: "Purchase orders, supplier records, material disposition", color: "bg-orange-50 border-orange-200" },
];

export default function EnterpriseExplainerPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-16">

      {/* Header */}
      <div className="pt-6">
        <div className="inline-flex items-center gap-2 bg-gray-100 text-gray-600 text-xs font-semibold px-3 py-1.5 rounded-full mb-4 border border-gray-200">
          <Info className="w-3.5 h-3.5" /> About This Demo
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          What you just saw — and what changes with real data
        </h1>
        <p className="text-base text-gray-500 leading-relaxed max-w-2xl">
          This prototype uses synthetic data to demonstrate the interaction patterns, workflow logic, and visualisation approach.
          Here's an honest account of what's real, what's illustrative, and what the path to a live system looks like.
        </p>
      </div>

      {/* Demo vs Real table */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-4">Demo vs. Reality</h2>
        <div className="rounded-xl border border-gray-200 overflow-hidden">
          <div className="grid grid-cols-3 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wide">
            <div className="px-4 py-3">Aspect</div>
            <div className="px-4 py-3 border-l border-gray-200">This demo</div>
            <div className="px-4 py-3 border-l border-gray-200">With your data connected</div>
          </div>
          {DEMO_VS_REAL.map((row, i) => (
            <div key={row.aspect} className={`grid grid-cols-3 border-b border-gray-100 last:border-0 ${i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}>
              <div className="px-4 py-3 text-xs font-semibold text-gray-700 self-start pt-3.5">{row.aspect}</div>
              <div className="px-4 py-3 border-l border-gray-100">
                <div className="flex items-start gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-gray-600 leading-relaxed">{row.demo}</p>
                </div>
              </div>
              <div className="px-4 py-3 border-l border-gray-100">
                <div className="flex items-start gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-gray-700 leading-relaxed">{row.real}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* What this demo is designed to show */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <Layers className="w-4 h-4 text-blue-600" />
          <h2 className="text-base font-bold text-gray-900">What this demo is designed to show</h2>
        </div>
        <p className="text-sm text-gray-600 mb-3">The demo uses synthetic data to illustrate how we would approach Moderna&apos;s deviation management workflow — the methodology, design principles, and analytical approach are real, even if the implementation would be tailored to your environment.</p>
        <div className="space-y-2 mb-4">
          {WHAT_TRANSFERS.map((item, i) => (
            <div key={i} className="flex items-start gap-2">
              <ArrowRight className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
              <p className="text-sm text-gray-700 leading-relaxed">{item}</p>
            </div>
          ))}
        </div>
        <p className="text-sm text-gray-500 italic leading-relaxed border-t border-blue-200 pt-3">
          The specific metrics, visualizations, and interface design would all be shaped by your data, your workflows, and your team&apos;s needs — this is a starting point for that conversation, not a finished product.
        </p>
      </div>

      {/* How real data gets connected */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-1">How real data gets connected</h2>
        <p className="text-sm text-gray-500 mb-5">The core requirement is an event log: a table of timestamped activities with a case ID, activity name, and optional attributes. Most QMS and ERP systems can produce this natively.</p>

        <div className="grid grid-cols-3 gap-4 mb-4">
          {[
            {
              step: "01",
              icon: Database,
              color: "bg-blue-600",
              title: "Extract event log",
              detail: "A read-only connector extracts timestamped activity records from your QMS, ERP, or MES. Required fields: Case ID (e.g. deviation number), Activity name, Timestamp, Resource (user/role), and any relevant attributes (severity, product, site). Standard connectors exist for SAP, Veeva, TrackWise, and Oracle.",
            },
            {
              step: "02",
              icon: GitBranch,
              color: "bg-purple-600",
              title: "Discover the real process",
              detail: "Process mining algorithms reconstruct your actual end-to-end workflow from the event log — not the SOP, but what happened case by case. Every variant, rework loop, and sequence violation is surfaced automatically and compared against your reference model.",
            },
            {
              step: "03",
              icon: Cpu,
              color: "bg-green-600",
              title: "Connect AI reasoning",
              detail: "The AI Assistant is pointed at your live deviation records and historical case database. Root cause suggestions, CAPA recommendations, and risk flags are generated from your actual data, not lookup tables.",
            },
          ].map(s => (
            <div key={s.step} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-8 h-8 rounded-lg ${s.color} flex items-center justify-center shrink-0`}>
                  <s.icon className="w-4 h-4 text-white" />
                </div>
                <div>
                  <span className="text-xs text-gray-400 font-medium">Step {s.step}</span>
                  <p className="text-sm font-bold text-gray-900 leading-tight">{s.title}</p>
                </div>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">{s.detail}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Supported systems */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-1">Supported systems</h2>
        <p className="text-sm text-gray-500 mb-4">Pre-built connectors for the most common biopharma technology stack</p>
        <div className="grid grid-cols-3 gap-3">
          {DATA_SOURCES.map(src => (
            <div key={src.name} className={`rounded-lg border p-3 ${src.color}`}>
              <p className="text-sm font-semibold text-gray-800 mb-1">{src.name}</p>
              <p className="text-xs text-gray-600">{src.desc}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-2">Custom connectors available via REST API or file-based integration (CSV, JSON, XML) for any system not listed above.</p>
      </div>

      {/* Architecture notes */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { icon: RefreshCw, title: "No data leaves your environment", desc: "The event log extractor runs on-premises or in your VPC. Only aggregate statistics and anonymised case summaries are used for AI reasoning. Batch records, PII, and proprietary formulas stay on your infrastructure." },
          { icon: Globe, title: "Multi-site consolidation", desc: "The same pipeline works across 5–20 sites. Process maps, KPIs, and trend analysis are available both per-site and consolidated — enabling cross-site systemic pattern detection that is invisible at any single site." },
          { icon: Database, title: "Validation & GxP readiness", desc: "All AI outputs are captured in an audit trail with timestamps, user IDs, and reasoning. The system supports IQ/OQ/PQ validation. Human confirmation is required before any AI output is recorded in the QMS." },
        ].map(card => (
          <div key={card.title} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mb-3">
              <card.icon className="w-4 h-4 text-gray-600" />
            </div>
            <p className="text-sm font-bold text-gray-900 mb-1.5">{card.title}</p>
            <p className="text-xs text-gray-600 leading-relaxed">{card.desc}</p>
          </div>
        ))}
      </div>


    </div>
  );
}
