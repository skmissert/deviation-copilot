"use client";

import { useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  CheckCircle, ChevronLeft, Loader2, Sparkles, AlertTriangle,
  FileText, Wrench, FlaskConical, Thermometer, ChevronDown, ChevronUp,
  Clock, User, Lock, Check, Pencil, Plus, ExternalLink
} from "lucide-react";
import type { CAPAOwner } from "@/lib/data/capas";
import Badge from "@/components/Badge";
import { deviations, DEVIATIONS_BY_ID } from "@/lib/data/deviations";
import { capas } from "@/lib/data/capas";
import { getEvidenceForDeviation } from "@/lib/data/evidence";
import { formatDate, daysBetween } from "@/lib/utils";
import { INVESTIGATOR_NAMES } from "@/lib/data/investigators";
import { runIntakeAgent, IntakeResult } from "@/lib/agents/intakeAgent";
import { runRootCauseAgent, RootCauseCandidate, RootCauseResult } from "@/lib/agents/rootCauseAgent";
import { runCAPAAgent, CAPARecommendation, CAPAResult } from "@/lib/agents/capaAgent";
import { runSummaryAgent, SummaryDraft } from "@/lib/agents/summaryAgent";

type Step = "intake" | "rootcause" | "capa" | "summary" | "review" | "closed";

const STEPS: { key: Step; label: string }[] = [
  { key: "intake", label: "1. Intake" },
  { key: "rootcause", label: "2. Root Cause" },
  { key: "capa", label: "3. CAPA" },
  { key: "summary", label: "4. Summary" },
  { key: "review", label: "5. QA Review" },
  { key: "closed", label: "6. Closed" },
];

const STEP_ORDER: Step[] = ["intake", "rootcause", "capa", "summary", "review", "closed"];

const CHECKLIST = [
  "Deviation description clearly documented",
  "Incident date/time and location recorded",
  "Initial containment actions documented",
  "Relevant batch/equipment identifiers captured",
  "Severity classification reviewed and confirmed",
  "Historical similar deviations reviewed",
  "Root cause confirmed by investigation team",
  "CAPA plan approved by QA",
];

const EVIDENCE_TABS = [
  { key: "batch", label: "Batch Record", icon: FileText },
  { key: "equipment", label: "Equipment Log", icon: Wrench },
  { key: "qc", label: "QC Test", icon: FlaskConical },
  { key: "env", label: "Environmental", icon: Thermometer },
];

function ConfidenceBadge({ confidence }: { confidence: "High" | "Medium" | "Low" }) {
  const style =
    confidence === "High" ? "bg-green-100 text-green-800 border-green-200" :
    confidence === "Medium" ? "bg-amber-100 text-amber-800 border-amber-200" :
    "bg-gray-100 text-gray-600 border-gray-200";
  return <span className={`text-xs font-medium px-2 py-0.5 rounded border ${style}`}>{confidence} Conf.</span>;
}

function SectionHeader({ icon: Icon, title, status }: { icon: React.ComponentType<{ className?: string }>; title: string; status: "idle" | "loading" | "done" }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-blue-600" />
        <span className="text-sm font-semibold text-gray-800">{title}</span>
      </div>
      {status === "loading" && <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />}
      {status === "done" && <CheckCircle className="w-4 h-4 text-green-500" />}
    </div>
  );
}

export default function InvestigationWorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const deviation = DEVIATIONS_BY_ID[id];

  const [activeEvidence, setActiveEvidence] = useState<string>("batch");
  const [checklist, setChecklist] = useState<boolean[]>(new Array(CHECKLIST.length).fill(false));
  const [checklistOpen, setChecklistOpen] = useState(false);
  const [auditOpen, setAuditOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState<Step>("intake");

  // Intake state
  const [intakeLoading, setIntakeLoading] = useState(false);
  const [intakeResult, setIntakeResult] = useState<IntakeResult | null>(null);
  const [intakeConfirmed, setIntakeConfirmed] = useState(false);

  // Root cause state
  const [rcLoading, setRcLoading] = useState(false);
  const [rcResult, setRcResult] = useState<RootCauseResult | null>(null);
  const [selectedCauses, setSelectedCauses] = useState<Set<number>>(new Set());
  const [rcConfirmed, setRcConfirmed] = useState(false);

  // CAPA state
  const [capaLoading, setCapaLoading] = useState(false);
  const [capaResult, setCapaResult] = useState<CAPAResult | null>(null);
  const [selectedCAPAs, setSelectedCAPAs] = useState<Set<number>>(new Set([0]));
  const [capaConfirmed, setCapaConfirmed] = useState(false);

  // James #1: HITL editing — root cause
  const [editingRationaleIdx, setEditingRationaleIdx] = useState<number | null>(null);
  const [editedRationales, setEditedRationales] = useState<Record<number, string>>({});
  const [showCustomCause, setShowCustomCause] = useState(false);
  const [customCauseText, setCustomCauseText] = useState("");

  // James #1: HITL editing — CAPA
  const [editingCAPAIdx, setEditingCAPAIdx] = useState<number | null>(null);
  const [editedCAPADescs, setEditedCAPADescs] = useState<Record<number, string>>({});
  const [showAddCAPA, setShowAddCAPA] = useState(false);
  const [newCAPADesc, setNewCAPADesc] = useState("");
  const [newCAPAOwner, setNewCAPAOwner] = useState<CAPAOwner>("QA Manager");
  const [newCAPADays, setNewCAPADays] = useState(30);
  const [customCAPAs, setCustomCAPAs] = useState<CAPARecommendation[]>([]);

  // CAPA no-action state
  const [noCAPANeeded, setNoCAPANeeded] = useState(false);

  // Summary state
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryDraft, setSummaryDraft] = useState<SummaryDraft | null>(null);
  const [summaryNotes, setSummaryNotes] = useState("");
  const [summaryConfirmed, setSummaryConfirmed] = useState(false);
  const [editedSummarySections, setEditedSummarySections] = useState<Record<string, string>>({});

  // Audit log
  const [auditLog, setAuditLog] = useState<{ ts: string; message: string }[]>([]);

  const addAudit = useCallback((message: string) => {
    const ts = new Date().toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" });
    setAuditLog(prev => [...prev, { ts, message }]);
  }, []);

  if (!deviation) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Deviation <strong>{id}</strong> not found.</p>
        <button onClick={() => router.push("/deviations")} className="mt-4 text-blue-600 text-sm hover:underline">← Back to Deviation Explorer</button>
      </div>
    );
  }

  const evidence = getEvidenceForDeviation(deviation.deviation_id);
  const stepIndex = (s: Step) => STEP_ORDER.indexOf(s);

  const handleRunIntake = async () => {
    setIntakeLoading(true);
    const result = await runIntakeAgent(deviation, deviations);
    setIntakeResult(result);
    setIntakeLoading(false);
  };

  const handleConfirmIntake = () => {
    setIntakeConfirmed(true);
    setCurrentStep("rootcause");
    addAudit(`INV confirmed intake classification: ${deviation.process_area} / ${deviation.severity}`);
  };

  const handleRunRootCause = async () => {
    setRcLoading(true);
    const result = await runRootCauseAgent(deviation, deviations);
    setRcResult(result);
    setSelectedCauses(new Set([0]));
    setRcLoading(false);
  };

  const handleConfirmRootCause = () => {
    if (selectedCauses.size === 0) return;
    setRcConfirmed(true);
    setCurrentStep("capa");
    const causeNames = Array.from(selectedCauses).map(i => rcResult?.candidates[i]?.cause).filter(Boolean).join(", ");
    addAudit(`INV confirmed root cause(s): ${causeNames} (${selectedCauses.size} cause(s) selected)`);
  };

  const handleRunCAPA = async () => {
    if (selectedCauses.size === 0) return;
    setCapaLoading(true);
    const primaryIdx = Math.min(...Array.from(selectedCauses));
    const primaryCause = rcResult!.candidates[primaryIdx];
    const result = await runCAPAAgent(primaryCause.cause, capas);
    setCapaResult(result);
    setSelectedCAPAs(new Set(result.recommendations.map((_, i) => i)));
    setEditedCAPADescs({});
    setCustomCAPAs([]);
    setCapaLoading(false);
  };

  const allCAPAs = capaResult
    ? [...capaResult.recommendations, ...customCAPAs]
    : customCAPAs;

  const handleAddCustomCAPA = () => {
    if (!newCAPADesc.trim()) return;
    const newRec: CAPARecommendation = {
      action_type: "Corrective",
      description: newCAPADesc,
      suggested_owner: newCAPAOwner,
      suggested_days: newCAPADays,
      prior_capa_ids: [],
      effectiveness_note: "Custom action added by investigator.",
    };
    setCustomCAPAs(prev => [...prev]);
    setCapaResult(prev => prev ? { recommendations: [...prev.recommendations, newRec] } : { recommendations: [newRec] });
    setSelectedCAPAs(prev => { const n = new Set(prev); n.add(allCAPAs.length); return n; });
    setNewCAPADesc("");
    setNewCAPADays(30);
    setShowAddCAPA(false);
  };

  const handleConfirmCAPA = () => {
    setCapaConfirmed(true);
    setCurrentStep("summary");
    const count = selectedCAPAs.size;
    addAudit(`INV approved CAPA plan (${count} action${count !== 1 ? "s" : ""})`);
  };

  const handleRunSummary = async () => {
    if (selectedCauses.size === 0 || (!capaResult && !noCAPANeeded)) return;
    setSummaryLoading(true);
    const primaryIdx = Math.min(...Array.from(selectedCauses));
    const primaryCause = rcResult!.candidates[primaryIdx];
    const approvedCAPAs = capaResult ? capaResult.recommendations.filter((_, i) => selectedCAPAs.has(i)) : [];
    const draft = await runSummaryAgent(deviation, primaryCause, approvedCAPAs);
    setSummaryDraft({ ...draft, investigator_notes: summaryNotes });
    setSummaryLoading(false);
  };

  const handleConfirmSummary = () => {
    setSummaryConfirmed(true);
    setCurrentStep("review");
    addAudit("INV approved investigation summary — submitted for QA Review");
  };

  const toggleChecklist = (i: number) => {
    setChecklist(prev => { const next = [...prev]; next[i] = !next[i]; return next; });
  };

  const checklistDone = checklist.filter(Boolean).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.push("/deviations")} className="text-sm text-gray-500 hover:text-blue-600 flex items-center gap-1">
          <ChevronLeft className="w-4 h-4" /> Deviations
        </button>
        <span className="text-gray-300">/</span>
        <span className="text-sm text-gray-700 font-medium">{deviation.deviation_id}</span>
      </div>

      {/* Deviation Header Card */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl font-bold text-gray-900">{deviation.deviation_id}</h1>
              <Badge value={deviation.severity} />
              <Badge value={deviation.status} />
            </div>
            <p className="text-sm text-gray-600">{deviation.process_area} · {deviation.product_id} · Batch: {deviation.batch_id}</p>
          </div>
          <div className="text-right text-sm text-gray-500 space-y-0.5">
            <div><span className="font-medium text-gray-700">Opened:</span> {formatDate(deviation.opened_date)}</div>
            <div><span className="font-medium text-gray-700">Investigator:</span> {INVESTIGATOR_NAMES[deviation.investigator_id] ?? deviation.investigator_id}</div>
            <div><span className="font-medium text-gray-700">QA Analyst:</span> {deviation.qa_analyst_id}</div>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-4 text-sm">
          <span className={`flex items-center gap-1 ${deviation.batch_quarantined_flag ? "text-red-600" : "text-gray-400"}`}>
            <AlertTriangle className="w-4 h-4" />
            Batch {deviation.batch_quarantined_flag ? "Quarantined" : "Not Quarantined"}
          </span>
          <span className={`flex items-center gap-1 ${deviation.release_blocking_flag ? "text-red-600" : "text-gray-400"}`}>
            <Lock className="w-4 h-4" />
            Release {deviation.release_blocking_flag ? "Blocked" : "Not Blocked"}
          </span>
          <span className="flex items-center gap-1 text-gray-500">
            <Clock className="w-4 h-4" />
            {daysBetween(deviation.opened_date, deviation.closure_date)} days open
          </span>
          <span className="flex items-center gap-1 text-gray-500">
            <User className="w-4 h-4" />
            Containment: {deviation.containment_action}
          </span>
        </div>
      </div>

      {/* Progress Stepper */}
      <div className="bg-white rounded-lg border border-gray-200 p-3">
        <div className="flex items-center gap-0">
          {STEPS.map((s, i) => {
            const done = stepIndex(currentStep) > stepIndex(s.key);
            const active = currentStep === s.key;
            return (
              <div key={s.key} className="flex items-center flex-1">
                <div className={`flex items-center gap-1.5 px-2 py-1.5 rounded text-xs font-medium whitespace-nowrap ${
                  done ? "text-green-700" : active ? "text-blue-700 bg-blue-50" : "text-gray-400"
                }`}>
                  {done ? <Check className="w-3.5 h-3.5" /> : <span className="w-3.5 h-3.5 rounded-full border-2 border-current inline-flex items-center justify-center text-[9px] font-bold">{i + 1}</span>}
                  {s.label.replace(/^\d+\. /, "")}
                </div>
                {i < STEPS.length - 1 && <div className={`h-px flex-1 mx-1 ${done ? "bg-green-300" : "bg-gray-200"}`} />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-5 gap-4 items-start">
        {/* Left: Evidence + Checklist */}
        <div className="col-span-3 space-y-4">
          {/* Evidence Tabs */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="flex border-b border-gray-200">
              {EVIDENCE_TABS.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveEvidence(tab.key)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                    activeEvidence === tab.key
                      ? "border-blue-600 text-blue-700 bg-blue-50"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="p-4">
              {activeEvidence === "batch" && (
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {[
                    { label: "Batch ID", value: evidence.batch_record.batch_id },
                    { label: "Product", value: evidence.batch_record.product },
                    { label: "Process Step", value: evidence.batch_record.process_step },
                    { label: "Observed Parameter", value: evidence.batch_record.observed_parameter },
                    { label: "Target Range", value: evidence.batch_record.target_range },
                    { label: "Recorded Value", value: evidence.batch_record.recorded_value, anomaly: evidence.batch_record.anomaly },
                  ].map(f => (
                    <div key={f.label} className={`rounded p-2 ${f.anomaly ? "bg-amber-50 border border-amber-200" : "bg-gray-50"}`}>
                      <p className="text-xs text-gray-500">{f.label}</p>
                      <p className={`font-medium ${f.anomaly ? "text-amber-800" : "text-gray-800"}`}>{f.value}</p>
                    </div>
                  ))}
                  <div className="col-span-2 rounded p-2 bg-gray-50">
                    <p className="text-xs text-gray-500">Operator Notes</p>
                    <p className="text-gray-700">{evidence.batch_record.operator_notes}</p>
                  </div>
                </div>
              )}
              {activeEvidence === "equipment" && (
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {[
                    { label: "Equipment ID", value: evidence.equipment_log.equipment_id },
                    { label: "Maintenance Status", value: evidence.equipment_log.maintenance_status },
                    { label: "Calibration Date", value: evidence.equipment_log.calibration_date },
                    { label: "Event Logged", value: evidence.equipment_log.event_logged, anomaly: evidence.equipment_log.anomaly },
                  ].map(f => (
                    <div key={f.label} className={`rounded p-2 ${f.anomaly ? "bg-amber-50 border border-amber-200" : "bg-gray-50"}`}>
                      <p className="text-xs text-gray-500">{f.label}</p>
                      <p className={`font-medium ${f.anomaly ? "text-amber-800" : "text-gray-800"}`}>{f.value}</p>
                    </div>
                  ))}
                  <div className="col-span-2 rounded p-2 bg-gray-50">
                    <p className="text-xs text-gray-500">Technician Comment</p>
                    <p className="text-gray-700">{evidence.equipment_log.technician_comment}</p>
                  </div>
                </div>
              )}
              {activeEvidence === "qc" && (
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {[
                    { label: "Batch ID", value: evidence.qc_test.batch_id },
                    { label: "Test Name", value: evidence.qc_test.test_name },
                    { label: "Specification", value: evidence.qc_test.specification },
                    { label: "Result", value: evidence.qc_test.result, anomaly: evidence.qc_test.anomaly },
                  ].map(f => (
                    <div key={f.label} className={`rounded p-2 ${f.anomaly ? "bg-amber-50 border border-amber-200" : "bg-gray-50"}`}>
                      <p className="text-xs text-gray-500">{f.label}</p>
                      <p className={`font-medium ${f.anomaly ? "text-amber-800" : "text-gray-800"}`}>{f.value}</p>
                    </div>
                  ))}
                  <div className="col-span-2 rounded p-2 bg-gray-50">
                    <p className="text-xs text-gray-500">Analyst Comment</p>
                    <p className="text-gray-700">{evidence.qc_test.analyst_comment}</p>
                  </div>
                </div>
              )}
              {activeEvidence === "env" && (
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {[
                    { label: "Location", value: evidence.environmental_monitoring.location },
                    { label: "Date", value: evidence.environmental_monitoring.date },
                    { label: "Humidity", value: `${evidence.environmental_monitoring.humidity_pct}%`, anomaly: evidence.environmental_monitoring.anomaly },
                    { label: "Temperature", value: `${evidence.environmental_monitoring.temperature_c}°C`, anomaly: evidence.environmental_monitoring.anomaly },
                  ].map(f => (
                    <div key={f.label} className={`rounded p-2 ${f.anomaly ? "bg-amber-50 border border-amber-200" : "bg-gray-50"}`}>
                      <p className="text-xs text-gray-500">{f.label}</p>
                      <p className={`font-medium ${f.anomaly ? "text-amber-800" : "text-gray-800"}`}>{f.value}</p>
                    </div>
                  ))}
                  <div className="col-span-2 rounded p-2 bg-gray-50">
                    <p className="text-xs text-gray-500">Observation</p>
                    <p className="text-gray-700">{evidence.environmental_monitoring.observation}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Checklist */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <button
              className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-800 hover:bg-gray-50"
              onClick={() => setChecklistOpen(v => !v)}
            >
              <span>Investigation Checklist <span className="ml-1 text-xs text-gray-500 font-normal">({checklistDone}/{CHECKLIST.length} complete)</span></span>
              {checklistOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </button>
            {checklistOpen && (
              <div className="px-4 pb-4 space-y-2">
                {/* Progress bar */}
                <div className="w-full bg-gray-100 rounded-full h-1.5 mb-3">
                  <div className="bg-green-500 h-1.5 rounded-full transition-all" style={{ width: `${(checklistDone / CHECKLIST.length) * 100}%` }} />
                </div>
                {CHECKLIST.map((item, i) => (
                  <label key={i} className="flex items-start gap-2.5 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={checklist[i]}
                      onChange={() => toggleChecklist(i)}
                      className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-400"
                    />
                    <span className={`text-sm ${checklist[i] ? "line-through text-gray-400" : "text-gray-700"}`}>{item}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: AI Copilot */}
        <div className="col-span-2 space-y-4">
          <div className="bg-white rounded-lg border border-blue-200 overflow-hidden">
            <div className="bg-blue-600 px-4 py-2.5 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-white" />
              <span className="text-white text-sm font-semibold">AI Assistant</span>
              <span className="ml-auto text-blue-200 text-xs">Powered by Claude</span>
            </div>

            <div className="divide-y divide-gray-100">
              {/* Section 1: Intake */}
              <div className={`p-4 ${intakeConfirmed ? "opacity-75" : ""}`}>
                <SectionHeader icon={FileText} title="Intake Analysis" status={intakeLoading ? "loading" : intakeConfirmed ? "done" : "idle"} />
                {!intakeResult && !intakeLoading && (
                  <button onClick={handleRunIntake} className="w-full py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium">
                    Run Intake Analysis
                  </button>
                )}
                {intakeLoading && (
                  <div className="flex items-center gap-2 text-sm text-blue-600 py-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> AI analyzing deviation...
                  </div>
                )}
                {intakeResult && !intakeLoading && (
                  <div className="space-y-2.5">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-gray-50 rounded p-2">
                        <p className="text-gray-400">Process Area</p>
                        <p className="font-medium text-gray-800">{intakeResult.classified_area}</p>
                      </div>
                      <div className="bg-gray-50 rounded p-2">
                        <p className="text-gray-400">Severity</p>
                        <Badge value={intakeResult.recommended_severity} />
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 bg-blue-50 border border-blue-100 rounded p-2 leading-relaxed">{intakeResult.severity_rationale}</p>
                    {intakeResult.related_deviation_ids.length > 0 && (
                      <p className="text-xs text-gray-500">Related: {intakeResult.related_deviation_ids.join(", ")}</p>
                    )}
                    {!intakeConfirmed ? (
                      <div className="flex gap-2">
                        <button onClick={handleConfirmIntake} className="flex-1 py-1.5 text-xs bg-green-600 text-white rounded font-medium hover:bg-green-700">Confirm Classification</button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-xs text-green-700"><CheckCircle className="w-3.5 h-3.5" /> Confirmed by INV</div>
                    )}
                  </div>
                )}
              </div>

              {/* Section 2: Root Cause */}
              <div className={`p-4 ${!intakeConfirmed ? "opacity-40 pointer-events-none" : rcConfirmed ? "opacity-75 pointer-events-none" : ""}`}>
                <SectionHeader icon={Sparkles} title="Root Cause Analysis" status={rcLoading ? "loading" : rcConfirmed ? "done" : "idle"} />
                {!rcResult && !rcLoading && (
                  <button onClick={handleRunRootCause} disabled={!intakeConfirmed} className="w-full py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium disabled:opacity-50">
                    Analyze Root Causes
                  </button>
                )}
                {rcLoading && (
                  <div className="flex items-center gap-2 text-sm text-blue-600 py-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Searching {deviations.length} historical deviations...
                  </div>
                )}
                {rcResult && !rcLoading && (
                  <div className="space-y-2">
                    {rcResult.candidates.map((c, i) => (
                      <div
                        key={i}
                        onClick={() => !rcConfirmed && editingRationaleIdx !== i && setSelectedCauses(prev => {
                          const n = new Set(prev);
                          n.has(i) ? n.delete(i) : n.add(i);
                          return n;
                        })}
                        className={`rounded-md border p-2.5 text-xs cursor-pointer transition-colors ${
                          selectedCauses.has(i) && !rcConfirmed
                            ? "border-blue-400 bg-blue-50"
                            : selectedCauses.has(i) && rcConfirmed
                            ? "border-green-400 bg-green-50"
                            : "border-gray-200 hover:border-blue-200"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-gray-800">{c.cause}</span>
                          <div className="flex items-center gap-1.5">
                            <ConfidenceBadge confidence={c.confidence} />
                            {!rcConfirmed && (
                              <button
                                onClick={e => { e.stopPropagation(); setEditingRationaleIdx(editingRationaleIdx === i ? null : i); if (!(i in editedRationales)) setEditedRationales(prev => ({ ...prev, [i]: c.rationale })); }}
                                className="text-gray-400 hover:text-blue-600 p-0.5 rounded"
                                title="Edit rationale"
                              >
                                <Pencil className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                        {editingRationaleIdx === i && !rcConfirmed ? (
                          <div onClick={e => e.stopPropagation()}>
                            <textarea
                              rows={3}
                              value={editedRationales[i] ?? c.rationale}
                              onChange={e => setEditedRationales(prev => ({ ...prev, [i]: e.target.value }))}
                              className="w-full px-2 py-1 border border-blue-300 rounded text-xs bg-blue-50 focus:outline-none focus:ring-1 focus:ring-blue-400 resize-none"
                            />
                            <button
                              onClick={() => setEditingRationaleIdx(null)}
                              className="mt-1 text-[10px] text-blue-600 hover:text-blue-800 font-medium"
                            >
                              Save edit
                            </button>
                          </div>
                        ) : (
                          <p className="text-gray-500 leading-relaxed mb-1.5">{editedRationales[i] ?? c.rationale}</p>
                        )}
                        <div className="flex flex-wrap gap-1">
                          {c.evidence_sources.map(e => (
                            <span key={e} className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-[10px]">{e}</span>
                          ))}
                          {c.historical_matches.length > 0 && (
                            <span className="text-gray-400 text-[10px]">· {c.similar_count} similar prior deviations</span>
                          )}
                        </div>
                      </div>
                    ))}
                    {/* Custom root cause input */}
                    {!rcConfirmed && (
                      <div>
                        {!showCustomCause ? (
                          <button
                            onClick={() => setShowCustomCause(true)}
                            className="w-full py-1.5 text-xs border border-dashed border-gray-300 text-gray-500 rounded hover:border-blue-400 hover:text-blue-600 flex items-center justify-center gap-1"
                          >
                            <Plus className="w-3 h-3" /> Add Custom Root Cause
                          </button>
                        ) : (
                          <div className="rounded-md border border-blue-200 bg-blue-50 p-2.5 text-xs space-y-1.5">
                            <p className="font-medium text-gray-700">Custom Root Cause</p>
                            <input
                              type="text"
                              value={customCauseText}
                              onChange={e => setCustomCauseText(e.target.value)}
                              placeholder="Describe root cause..."
                              className="w-full px-2 py-1 border border-blue-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-400"
                            />
                            <div className="flex gap-1.5">
                              <button
                                onClick={() => {
                                  if (!customCauseText.trim()) return;
                                  const custom: RootCauseCandidate = {
                                    cause: customCauseText as any,
                                    confidence: "Medium",
                                    evidence_sources: ["Investigator Assessment"],
                                    historical_matches: [],
                                    similar_count: 0,
                                    rationale: `Custom root cause identified by investigator: ${customCauseText}`,
                                  };
                                  setRcResult(prev => {
                                    const updated = prev ? { candidates: [...prev.candidates, custom] } : { candidates: [custom] };
                                    setSelectedCauses(new Set([updated.candidates.length - 1]));
                                    return updated;
                                  });
                                  setShowCustomCause(false);
                                }}
                                className="flex-1 py-1 bg-blue-600 text-white rounded font-medium hover:bg-blue-700"
                              >
                                Add &amp; Select
                              </button>
                              <button onClick={() => setShowCustomCause(false)} className="px-2 py-1 border border-gray-300 rounded text-gray-600 hover:bg-white">
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    {!rcConfirmed ? (
                      <button onClick={handleConfirmRootCause} disabled={selectedCauses.size === 0} className="w-full py-1.5 text-xs bg-green-600 text-white rounded font-medium hover:bg-green-700 disabled:opacity-50">
                        Accept Selected Root Cause
                      </button>
                    ) : (
                      <div className="flex items-center gap-1.5 text-xs text-green-700"><CheckCircle className="w-3.5 h-3.5" /> Root cause confirmed: {Array.from(selectedCauses).map(i => rcResult?.candidates[i]?.cause).join(", ")}</div>
                    )}
                  </div>
                )}
              </div>

              {/* Section 3: CAPA */}
              <div className={`p-4 ${!rcConfirmed ? "opacity-40 pointer-events-none" : capaConfirmed ? "opacity-75 pointer-events-none" : ""}`}>
                <SectionHeader icon={Wrench} title="CAPA Recommendations" status={capaLoading ? "loading" : capaConfirmed ? "done" : "idle"} />
                {!capaConfirmed && (
                  <label className="flex items-center gap-2 text-xs text-gray-600 mb-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={noCAPANeeded}
                      onChange={e => setNoCAPANeeded(e.target.checked)}
                      className="h-3.5 w-3.5 text-blue-600 rounded"
                    />
                    No CAPA required for this deviation
                  </label>
                )}
                {noCAPANeeded && !capaConfirmed && (
                  <button onClick={() => { setCapaConfirmed(true); setCurrentStep("summary"); addAudit("INV confirmed: No CAPA required for this deviation"); }} className="w-full py-1.5 text-xs bg-green-600 text-white rounded font-medium hover:bg-green-700">
                    Confirm — No CAPA Needed
                  </button>
                )}
                {!noCAPANeeded && !capaResult && !capaLoading && (
                  <button onClick={handleRunCAPA} disabled={!rcConfirmed} className="w-full py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium disabled:opacity-50">
                    Generate CAPA Recommendations
                  </button>
                )}
                {capaLoading && (
                  <div className="flex items-center gap-2 text-sm text-blue-600 py-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Matching prior CAPAs...
                  </div>
                )}
                {capaResult && !capaLoading && (
                  <div className="space-y-2">
                    {capaResult.recommendations.map((r, i) => (
                      <div key={i} className={`rounded-md border p-2.5 text-xs transition-colors ${selectedCAPAs.has(i) ? "border-blue-400 bg-blue-50" : "border-gray-200"}`}>
                        <div className="flex items-start gap-2">
                          {!capaConfirmed && (
                            <input type="checkbox" checked={selectedCAPAs.has(i)} onChange={() => {
                              setSelectedCAPAs(prev => { const n = new Set(prev); n.has(i) ? n.delete(i) : n.add(i); return n; });
                            }} className="mt-0.5 h-3.5 w-3.5 text-blue-600 cursor-pointer shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1.5 mb-0.5">
                              <div className="flex items-center gap-1.5">
                                <span className="font-medium text-gray-700">{r.action_type}</span>
                                <span className="bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded text-[10px]">{r.suggested_owner}</span>
                                <span className="text-gray-400 text-[10px]">{r.suggested_days}d</span>
                              </div>
                              {!capaConfirmed && (
                                <button
                                  onClick={() => {
                                    setEditingCAPAIdx(editingCAPAIdx === i ? null : i);
                                    if (!(i in editedCAPADescs)) setEditedCAPADescs(prev => ({ ...prev, [i]: r.description }));
                                  }}
                                  className="text-gray-400 hover:text-blue-600 p-0.5 rounded shrink-0"
                                  title="Edit description"
                                >
                                  <Pencil className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                            {editingCAPAIdx === i && !capaConfirmed ? (
                              <div>
                                <textarea
                                  rows={3}
                                  value={editedCAPADescs[i] ?? r.description}
                                  onChange={e => setEditedCAPADescs(prev => ({ ...prev, [i]: e.target.value }))}
                                  className="w-full px-2 py-1 border border-blue-300 rounded text-xs bg-blue-50 focus:outline-none focus:ring-1 focus:ring-blue-400 resize-none mt-0.5"
                                />
                                <button onClick={() => setEditingCAPAIdx(null)} className="mt-1 text-[10px] text-blue-600 hover:text-blue-800 font-medium">
                                  Save edit
                                </button>
                              </div>
                            ) : (
                              <p className="text-gray-600 leading-relaxed">{editedCAPADescs[i] ?? r.description}</p>
                            )}
                            <p className="text-green-600 mt-1">{r.effectiveness_note}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                    {/* Add custom CAPA */}
                    {!capaConfirmed && (
                      <div>
                        {!showAddCAPA ? (
                          <button
                            onClick={() => setShowAddCAPA(true)}
                            className="w-full py-1.5 text-xs border border-dashed border-gray-300 text-gray-500 rounded hover:border-blue-400 hover:text-blue-600 flex items-center justify-center gap-1"
                          >
                            <Plus className="w-3 h-3" /> Add Custom CAPA Action
                          </button>
                        ) : (
                          <div className="rounded-md border border-blue-200 bg-blue-50 p-2.5 text-xs space-y-1.5">
                            <p className="font-medium text-gray-700">Custom CAPA Action</p>
                            <textarea
                              rows={2}
                              value={newCAPADesc}
                              onChange={e => setNewCAPADesc(e.target.value)}
                              placeholder="Describe the corrective or preventive action..."
                              className="w-full px-2 py-1 border border-blue-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-400 resize-none"
                            />
                            <div className="flex gap-2">
                              <select
                                value={newCAPAOwner}
                                onChange={e => setNewCAPAOwner(e.target.value as CAPAOwner)}
                                className="flex-1 px-2 py-1 border border-blue-300 rounded text-xs bg-white"
                              >
                                <option>QA Manager</option>
                                <option>Engineering</option>
                                <option>Manufacturing Lead</option>
                                <option>Quality Systems</option>
                              </select>
                              <input
                                type="number"
                                value={newCAPADays}
                                onChange={e => setNewCAPADays(Number(e.target.value))}
                                className="w-16 px-2 py-1 border border-blue-300 rounded text-xs"
                                min={1}
                              />
                              <span className="flex items-center text-gray-400 text-[10px]">days</span>
                            </div>
                            <div className="flex gap-1.5">
                              <button onClick={handleAddCustomCAPA} className="flex-1 py-1 bg-blue-600 text-white rounded font-medium hover:bg-blue-700">
                                Add Action
                              </button>
                              <button onClick={() => setShowAddCAPA(false)} className="px-2 py-1 border border-gray-300 rounded text-gray-600 hover:bg-white">
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    {!capaConfirmed ? (
                      <button onClick={handleConfirmCAPA} disabled={selectedCAPAs.size === 0} className="w-full py-1.5 text-xs bg-green-600 text-white rounded font-medium hover:bg-green-700 disabled:opacity-50">
                        Approve CAPA Plan ({selectedCAPAs.size} action{selectedCAPAs.size !== 1 ? "s" : ""})
                      </button>
                    ) : (
                      <div className="flex items-center gap-1.5 text-xs text-green-700"><CheckCircle className="w-3.5 h-3.5" /> CAPA plan approved</div>
                    )}
                  </div>
                )}
              </div>

              {/* Section 4: Summary */}
              <div className={`p-4 ${!capaConfirmed ? "opacity-40 pointer-events-none" : ""}`}>
                <SectionHeader icon={FileText} title="Investigation Summary" status={summaryLoading ? "loading" : summaryConfirmed ? "done" : "idle"} />
                {!summaryDraft && !summaryLoading && (
                  <button onClick={handleRunSummary} disabled={!capaConfirmed || selectedCauses.size === 0} className="w-full py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium disabled:opacity-50">
                    Generate Draft Summary
                  </button>
                )}
                {summaryLoading && (
                  <div className="flex items-center gap-2 text-sm text-blue-600 py-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Drafting investigation report...
                  </div>
                )}
                {summaryDraft && !summaryLoading && (
                  <div className="space-y-2 text-xs">
                    {[
                      { label: "Incident Summary", value: summaryDraft.incident_summary },
                      { label: "Containment Actions", value: summaryDraft.containment_actions },
                      { label: "Root Cause Statement", value: summaryDraft.root_cause_statement },
                      { label: "CAPA Plan", value: summaryDraft.capa_plan_summary },
                    ].map(section => (
                      <div key={section.label} className="bg-gray-50 rounded p-2">
                        <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide mb-1">{section.label}</p>
                        {!summaryConfirmed ? (
                          <textarea
                            rows={3}
                            value={editedSummarySections[section.label] ?? section.value}
                            onChange={e => setEditedSummarySections(prev => ({ ...prev, [section.label]: e.target.value }))}
                            className="w-full px-2 py-1.5 border border-gray-200 rounded text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-400 resize-none bg-white"
                          />
                        ) : (
                          <p className="text-gray-700 leading-relaxed whitespace-pre-line">{editedSummarySections[section.label] ?? section.value}</p>
                        )}
                      </div>
                    ))}
                    <div className={`rounded p-2 border ${summaryDraft.regulatory_risk.startsWith("HIGH") ? "bg-red-50 border-red-200" : summaryDraft.regulatory_risk.startsWith("MODERATE") ? "bg-amber-50 border-amber-200" : "bg-gray-50 border-gray-200"}`}>
                      <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide mb-1">Regulatory Risk</p>
                      <p className={`leading-relaxed text-xs ${summaryDraft.regulatory_risk.startsWith("HIGH") ? "text-red-800" : summaryDraft.regulatory_risk.startsWith("MODERATE") ? "text-amber-800" : "text-gray-700"}`}>{summaryDraft.regulatory_risk}</p>
                    </div>
                    {!summaryConfirmed && (
                      <div>
                        <label className="block text-[10px] text-gray-500 uppercase tracking-wide mb-1">Investigator Notes</label>
                        <textarea
                          rows={2}
                          value={summaryNotes}
                          onChange={e => setSummaryNotes(e.target.value)}
                          placeholder="Add any additional notes..."
                          className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                        />
                        <button onClick={handleConfirmSummary} className="w-full mt-1.5 py-1.5 text-xs bg-green-600 text-white rounded font-medium hover:bg-green-700">
                          Approve Summary &amp; Submit for QA Review
                        </button>
                      </div>
                    )}
                    {summaryConfirmed && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5 text-xs text-green-700"><CheckCircle className="w-3.5 h-3.5" /> Summary approved — submitted for QA Review</div>
                        <a
                          href={`/deviations/${deviation.deviation_id}/report`}
                          className="flex items-center justify-center gap-1.5 w-full py-1.5 text-xs border border-blue-300 text-blue-700 rounded font-medium hover:bg-blue-50"
                        >
                          <ExternalLink className="w-3 h-3" /> View Full Investigation Report
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Audit Log */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <button
              className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
              onClick={() => setAuditOpen(v => !v)}
            >
              <span>Audit Log <span className="text-xs text-gray-400 font-normal">({auditLog.length} entries)</span></span>
              {auditOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </button>
            {auditOpen && (
              <div className="px-4 pb-3 space-y-1.5">
                {auditLog.length === 0 ? (
                  <p className="text-xs text-gray-400 py-1">No actions recorded yet.</p>
                ) : (
                  auditLog.map((entry, i) => (
                    <div key={i} className="text-xs flex gap-2">
                      <span className="text-gray-400 shrink-0">[{entry.ts}]</span>
                      <span className="text-gray-700">{entry.message}</span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
