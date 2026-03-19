"use client";

import {
  Database, GitBranch, Cpu, BarChart2, ArrowRight,
  CheckCircle, AlertTriangle, Zap, Globe, Lock, RefreshCw,
} from "lucide-react";

const DATA_SOURCES = [
  { name: "SAP QM / ERP",          desc: "Quality notifications, batch records, CAPA tasks, change requests", icon: "🏭", color: "bg-blue-50 border-blue-200" },
  { name: "Veeva Vault QMS",        desc: "Deviation records, investigation documents, electronic signatures", icon: "🔵", color: "bg-indigo-50 border-indigo-200" },
  { name: "TrackWise / ETQ",        desc: "Deviation events, CAPA workflows, effectiveness checks",            icon: "📋", color: "bg-purple-50 border-purple-200" },
  { name: "MES / SCADA",            desc: "Equipment event logs, process parameter exceedances, alarms",       icon: "⚙️", color: "bg-amber-50 border-amber-200" },
  { name: "LIMS",                   desc: "Lab test results, OOS/OOT events, retest sequences",               icon: "🔬", color: "bg-green-50 border-green-200" },
  { name: "Oracle EBS / Cloud",     desc: "Purchase orders, supplier records, material disposition",          icon: "🟠", color: "bg-orange-50 border-orange-200" },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Extract Event Logs",
    color: "bg-blue-600",
    detail: "A lightweight connector extracts timestamped activity records from your QMS, ERP, and MES. No data leaves your environment — the connector runs on-premises or in your VPC. Standard connectors available for SAP, Veeva, TrackWise, Oracle. Custom connectors via API in 2–4 weeks.",
    icon: Database,
    outputs: ["Case ID (e.g. deviation number)", "Activity name (e.g. 'Investigation Started')", "Timestamp", "Resource (investigator, system user)", "Attributes (severity, product, site)"],
  },
  {
    step: "02",
    title: "Discover the Real Process",
    color: "bg-purple-600",
    detail: "Process mining algorithms reconstruct your actual end-to-end process from the event log — not the SOP, not the assumed process, but what actually happened case by case. Every variant, every rework loop, every sequence violation is surfaced automatically.",
    icon: GitBranch,
    outputs: ["Process graph (Petri net / BPMN)", "Variant frequency distribution", "Conformance check vs reference model", "Bottleneck identification", "Rework and loop detection"],
  },
  {
    step: "03",
    title: "Quantify & Prioritise",
    color: "bg-green-600",
    detail: "Each inefficiency is automatically quantified in cycle time impact, case volume, and estimated cost. Prioritised recommendations surface the highest-ROI improvement opportunities — so your team focuses on what matters most, not what's easiest to see.",
    icon: BarChart2,
    outputs: ["Cycle time decomposition by step and site", "Root cause → rework correlation", "Cost-of-poor-quality estimation", "Conformance scoring vs SOP", "Predictive risk flags for open cases"],
  },
];

const METRICS = [
  { label: "Cycle time reduction", value: "30–45%", sub: "investigation + CAPA combined", color: "text-green-700" },
  { label: "Rework elimination", value: "~60%", sub: "re-investigations prevented", color: "text-green-700" },
  { label: "Compliance exposure", value: "−70%", sub: "sequence violations resolved", color: "text-green-700" },
  { label: "Investigator capacity freed", value: "1.5–2 FTE", sub: "per 100 deviations / year", color: "text-blue-700" },
];

const SAMPLE_INSIGHTS = [
  {
    site: "Norwood, MA",
    finding: "38% of investigations start >5 days after triage — a systemic assignment bottleneck costing ~22 days per case in additional cycle time per quarter.",
    action: "Auto-assign investigations at triage; SLA alert at 24 hrs",
    severity: "high",
  },
  {
    site: "Lanzarote",
    finding: "CAPA created before investigation complete in 18% of cases — highest rate across all sites. Likely linked to QA manager approval bypass during peak periods.",
    action: "Enforce workflow gate in QMS: block CAPA record until investigation_complete flag = true",
    severity: "high",
  },
  {
    site: "All Sites",
    finding: "Documentation errors account for 27% of all deviations but 0% of sites have implemented structured shift handoff checklists. Pattern is cross-site and systemic.",
    action: "Deploy enterprise-wide shift handoff checklist in MES with mandatory e-signature",
    severity: "medium",
  },
  {
    site: "Switzerland",
    finding: "QA review queue averages 8.3 days — 2.8× the SOP target of 3 days. QA-04 carries 41% of review workload despite representing 17% of team capacity.",
    action: "Rebalance QA review assignment; implement capacity-aware routing rule",
    severity: "medium",
  },
];

export default function EnterpriseExplainerPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-16">

      {/* Hero */}
      <div className="text-center pt-6">
        <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-800 text-xs font-semibold px-3 py-1.5 rounded-full mb-4 border border-purple-200">
          <Cpu className="w-3.5 h-3.5" /> Enterprise Process Intelligence
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          From ERP Data to Process Truth
        </h1>
        <p className="text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">
          Connect your QMS and ERP systems. Discover what your deviation process <em>actually</em> looks like —
          across every site, every variant, every bottleneck — in days, not months.
        </p>
      </div>

      {/* The gap */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
          <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-3">What the SOP says</p>
          <div className="space-y-1.5">
            {["Deviation reported → same-day containment", "Triage within 1 day", "Investigation started within 3 days of triage", "CAPA only after investigation complete", "QA review within 3 days of CAPA close", "Single clean path to closure"].map(item => (
              <div key={item} className="flex items-center gap-2 text-sm text-gray-600">
                <CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0" />
                {item}
              </div>
            ))}
          </div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-5">
          <p className="text-xs text-red-400 uppercase tracking-wide font-semibold mb-3">What process mining finds</p>
          <div className="space-y-1.5">
            {[
              "22% of containments documented >2 days late",
              "Average 6.2 day queue before investigation starts",
              "13% of CAPAs created before investigation complete",
              "QA review taking 8+ days at bottleneck sites",
              "5 distinct process variants — only 35% take the happy path",
              "15% of cases require re-investigation or CAPA revision",
            ].map(item => (
              <div key={item} className="flex items-center gap-2 text-sm text-red-700">
                <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* How it works */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">How It Works</h2>
        <p className="text-sm text-gray-500 mb-5">Three steps from raw ERP data to actionable process intelligence</p>
        <div className="grid grid-cols-3 gap-4">
          {HOW_IT_WORKS.map(step => (
            <div key={step.step} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-8 h-8 rounded-lg ${step.color} flex items-center justify-center`}>
                  <step.icon className="w-4 h-4 text-white" />
                </div>
                <div>
                  <span className="text-xs text-gray-400 font-medium">Step {step.step}</span>
                  <p className="text-sm font-bold text-gray-900 leading-tight">{step.title}</p>
                </div>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed mb-3">{step.detail}</p>
              <div className="space-y-1">
                {step.outputs.map(o => (
                  <div key={o} className="flex items-start gap-1.5 text-xs text-gray-500">
                    <ArrowRight className="w-3 h-3 text-gray-300 mt-0.5 shrink-0" />
                    {o}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Data sources */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">Supported Data Sources</h2>
        <p className="text-sm text-gray-500 mb-4">Pre-built connectors for the most common biopharma technology stack</p>
        <div className="grid grid-cols-3 gap-3">
          {DATA_SOURCES.map(src => (
            <div key={src.name} className={`rounded-lg border p-3 ${src.color}`}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-base">{src.icon}</span>
                <span className="text-sm font-semibold text-gray-800">{src.name}</span>
              </div>
              <p className="text-xs text-gray-600">{src.desc}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-2">Custom connectors available via REST API or file-based integration (CSV, JSON, XML) for any system within 2–4 weeks.</p>
      </div>

      {/* Benchmark outcomes */}
      <div className="bg-gradient-to-br from-blue-600 to-purple-700 rounded-xl p-6 text-white">
        <h2 className="text-xl font-bold mb-1">Benchmark Outcomes</h2>
        <p className="text-sm text-blue-200 mb-5">Typical results observed 6–12 months after AI-augmented process implementation</p>
        <div className="grid grid-cols-4 gap-4">
          {METRICS.map(m => (
            <div key={m.label} className="bg-white/10 rounded-lg p-3 backdrop-blur">
              <p className="text-2xl font-bold text-white">{m.value}</p>
              <p className="text-sm font-semibold text-blue-100 mt-0.5">{m.label}</p>
              <p className="text-xs text-blue-300 mt-0.5">{m.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Sample insights */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">Sample Insights — Enterprise View</h2>
        <p className="text-sm text-gray-500 mb-4">Illustrative findings from a 5-site, 520-deviation enterprise deployment</p>
        <div className="space-y-3">
          {SAMPLE_INSIGHTS.map((insight, i) => (
            <div key={i} className={`rounded-lg border p-4 ${insight.severity === "high" ? "bg-red-50 border-red-200" : "bg-amber-50 border-amber-200"}`}>
              <div className="flex items-start gap-3">
                <AlertTriangle className={`w-4 h-4 shrink-0 mt-0.5 ${insight.severity === "high" ? "text-red-500" : "text-amber-500"}`} />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">{insight.site}</span>
                  </div>
                  <p className="text-sm text-gray-800 leading-relaxed mb-2">{insight.finding}</p>
                  <div className="flex items-start gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-green-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-green-800 font-medium">{insight.action}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Architecture / security */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { icon: Lock,        title: "Data Stays On-Premise",       desc: "The event log extractor runs in your environment. Aggregate statistics only are transmitted. No batch records, no PII, no proprietary formulas leave your network." },
          { icon: RefreshCw,   title: "Near-Real-Time Refresh",       desc: "Event logs refresh on a configurable cadence (hourly to daily). Process maps update automatically. New violations and bottlenecks surface within hours of occurrence." },
          { icon: Globe,       title: "Multi-Site, One View",         desc: "Consolidate 5–20 sites into a single process intelligence layer. Benchmark performance across sites. Surface cross-site systemic patterns invisible in any single site's data." },
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

      {/* Implementation timeline */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-base font-bold text-gray-900 mb-4">Implementation Timeline</h2>
        <div className="grid grid-cols-4 gap-0 relative">
          <div className="absolute top-4 left-[12.5%] right-[12.5%] h-0.5 bg-gray-200 z-0" />
          {[
            { week: "Weeks 1–2", title: "Data Access & Mapping", desc: "Connect QMS / ERP. Map activities to event log schema. Validate first extracts." },
            { week: "Weeks 3–4", title: "Process Discovery", desc: "Run mining algorithms. Validate discovered graph with QA team. Baseline conformance score." },
            { week: "Weeks 5–6", title: "Insight Generation", desc: "Quantify inefficiencies. Prioritise recommendations. Align with site QA leadership." },
            { week: "Weeks 7–8", title: "Live Dashboard", desc: "Deploy process intelligence dashboard. Set up alerting. Hand off to operations team." },
          ].map((phase, i) => (
            <div key={i} className="relative z-10 px-3 text-center">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center mx-auto mb-2">{i + 1}</div>
              <p className="text-[10px] text-blue-600 font-semibold mb-0.5">{phase.week}</p>
              <p className="text-xs font-bold text-gray-900 mb-1">{phase.title}</p>
              <p className="text-[11px] text-gray-500 leading-snug">{phase.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer CTA */}
      <div className="text-center bg-gray-50 rounded-xl border border-gray-200 p-6">
        <p className="text-sm text-gray-500 mb-1">This prototype uses synthetic event data.</p>
        <p className="text-base font-semibold text-gray-800">
          With your QMS data connected, this analysis runs automatically across every site, every day.
        </p>
        <a href="/process-map" className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700">
          <GitBranch className="w-4 h-4" /> View the Process Map
        </a>
      </div>
    </div>
  );
}
