"use client";

import { useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, Printer, Download, FileText, Pencil } from "lucide-react";
import { DEVIATIONS_BY_ID } from "@/lib/data/deviations";
import { capas } from "@/lib/data/capas";
import { formatDate, daysBetween } from "@/lib/utils";
import { INVESTIGATOR_NAMES } from "@/lib/data/investigators";

function EditableSection({
  label,
  value,
  onChange,
  rows = 4,
  mono = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  mono?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  return (
    <div className="mb-6 print:mb-5">
      <div className="flex items-center justify-between mb-1.5">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">{label}</h3>
        <button
          onClick={() => setEditing(v => !v)}
          className="print:hidden flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
        >
          <Pencil className="w-3 h-3" />
          {editing ? "Done" : "Edit"}
        </button>
      </div>
      {editing ? (
        <textarea
          rows={rows}
          value={value}
          onChange={e => onChange(e.target.value)}
          className={`w-full px-3 py-2 border border-blue-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-y bg-blue-50 ${mono ? "font-mono" : ""}`}
        />
      ) : (
        <p className={`text-sm text-gray-800 leading-relaxed whitespace-pre-line ${mono ? "font-mono" : ""}`}>{value || <span className="text-gray-400 italic">— not completed —</span>}</p>
      )}
    </div>
  );
}

export default function DeviationReportPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const deviation = DEVIATIONS_BY_ID[id];
  const reportRef = useRef<HTMLDivElement>(null);

  if (!deviation) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Deviation <strong>{id}</strong> not found.</p>
        <button onClick={() => router.push("/deviations")} className="mt-4 text-blue-600 text-sm hover:underline">← Back</button>
      </div>
    );
  }

  const relatedCAPAs = capas.filter(c => c.deviation_id === deviation.deviation_id);
  const investDays = deviation.investigation_start && deviation.investigation_complete
    ? daysBetween(deviation.investigation_start, deviation.investigation_complete)
    : null;

  const regRisk =
    deviation.severity === "Critical"
      ? "HIGH: Batch quarantine and release hold in effect. Regulatory impact assessment required. Potential reportable event — QA Director review mandatory before closure."
      : deviation.severity === "Major"
      ? "MODERATE: Batch impact under investigation. Standard regulatory documentation required. QA Manager approval required prior to closure."
      : "LOW: No batch impact identified. Standard deviation documentation sufficient. QA analyst review required.";

  const capaTable = relatedCAPAs.length > 0
    ? relatedCAPAs.map((c, i) =>
        `${i + 1}. [${c.action_type}] ${c.description}\n   Owner: ${c.owner} | Due: ${formatDate(c.due_date)} | Status: ${c.effectiveness_check_status}`
      ).join("\n\n")
    : "No CAPAs recorded for this deviation. CAPA requirement: " + (deviation.capa_required ? "Yes — pending creation." : "Not required.");

  const defaultSections = {
    incident_description: `A ${deviation.severity.toLowerCase()} deviation was identified in the ${deviation.process_area} area on ${formatDate(deviation.opened_date)}. ` +
      `Batch ${deviation.batch_id} (Product: ${deviation.product_id}) was affected. ` +
      `The event resulted in ${deviation.batch_quarantined_flag ? "batch quarantine and release hold" : "process interruption without confirmed batch impact"}. ` +
      `Containment was initiated ${deviation.containment_time_days} day(s) after identification.`,
    containment: deviation.containment_action +
      `\n\nBatch quarantine status: ${deviation.batch_quarantined_flag ? "Quarantined" : "Not quarantined"}. ` +
      `Release block: ${deviation.release_blocking_flag ? "Blocked" : "Not blocked"}.` +
      (deviation.days_release_delayed > 0 ? `\nRelease delayed by ${deviation.days_release_delayed} days.` : ""),
    scope: `Affected batch: ${deviation.batch_id} | Product: ${deviation.product_id}\n` +
      `Manufacture date: ${formatDate(deviation.manufacture_date)}\n` +
      `Target release: ${formatDate(deviation.target_release_date)}` +
      (deviation.actual_release_date ? ` | Actual release: ${formatDate(deviation.actual_release_date)}` : " | Actual release: Pending") +
      `\n\nNo additional batches identified as directly impacted. Cross-batch risk assessment completed — no further scope expansion required.`,
    root_cause: `Root cause category: ${deviation.root_cause_category}\n\n` +
      `Investigation initiated: ${deviation.investigation_start ? formatDate(deviation.investigation_start) : "Pending"}\n` +
      `Investigation completed: ${deviation.investigation_complete ? formatDate(deviation.investigation_complete) : "Pending"}` +
      (investDays !== null ? ` (${investDays} days)` : "") +
      `\n\nRoot cause determination was based on review of batch records, equipment logs, operator training records, and environmental monitoring data. ` +
      `Pattern is consistent with ${deviation.root_cause_category.toLowerCase()} events previously observed in the ${deviation.process_area} area.`,
    supporting_evidence: `Evidence reviewed during this investigation:\n\n` +
      `1. Batch Record ${deviation.batch_id} — reviewed for process parameter values and operator documentation\n` +
      `2. Equipment maintenance and calibration logs — reviewed for equipment status at time of event\n` +
      `3. QC test summary — reviewed for out-of-specification or out-of-trend results\n` +
      `4. Environmental monitoring records — reviewed for exceedances during the incident window\n` +
      `5. Training records — reviewed for operator qualification status on applicable SOPs`,
    capa_plan: capaTable,
    regulatory_risk: regRisk,
    investigator_notes: "",
    approvals: `Investigator: ${INVESTIGATOR_NAMES[deviation.investigator_id] ?? deviation.investigator_id}\nQA Analyst: ${deviation.qa_analyst_id}\n\nSignature / Approval: _________________________\nDate: _________________________`,
  };

  const [sections, setSections] = useState(defaultSections);
  const update = (key: keyof typeof defaultSections) => (v: string) => setSections(prev => ({ ...prev, [key]: v }));

  const handlePrint = () => window.print();

  const handleExportWord = () => {
    const content = `
      <html><head><meta charset="utf-8">
      <style>
        body { font-family: Calibri, Arial, sans-serif; font-size: 11pt; margin: 2.5cm; color: #111; }
        h1 { font-size: 16pt; font-weight: bold; border-bottom: 2px solid #1e3a8a; padding-bottom: 6pt; }
        h2 { font-size: 13pt; font-weight: bold; color: #1e3a8a; margin-top: 18pt; }
        .meta { font-size: 10pt; color: #555; margin-bottom: 16pt; }
        .meta span { margin-right: 24pt; }
        p { line-height: 1.5; }
        pre { font-family: Calibri; white-space: pre-wrap; }
        .risk-high { color: #b91c1c; font-weight: bold; }
        .risk-mod { color: #92400e; font-weight: bold; }
        .risk-low { color: #166534; font-weight: bold; }
        .approval { border-top: 1pt solid #ccc; margin-top: 24pt; padding-top: 12pt; font-size: 10pt; color: #333; }
      </style></head><body>
      <h1>Deviation Investigation Report</h1>
      <div class="meta">
        <span><b>Deviation ID:</b> ${deviation.deviation_id}</span>
        <span><b>Severity:</b> ${deviation.severity}</span>
        <span><b>Status:</b> ${deviation.status}</span>
        <span><b>Process Area:</b> ${deviation.process_area}</span>
        <span><b>Opened:</b> ${formatDate(deviation.opened_date)}</span>
      </div>
      <h2>1. Incident Description</h2><pre>${sections.incident_description}</pre>
      <h2>2. Containment Actions</h2><pre>${sections.containment}</pre>
      <h2>3. Scope Assessment</h2><pre>${sections.scope}</pre>
      <h2>4. Root Cause Analysis</h2><pre>${sections.root_cause}</pre>
      <h2>5. Supporting Evidence</h2><pre>${sections.supporting_evidence}</pre>
      <h2>6. CAPA Plan</h2><pre>${sections.capa_plan}</pre>
      <h2>7. Regulatory Risk Assessment</h2>
      <pre class="${deviation.severity === "Critical" ? "risk-high" : deviation.severity === "Major" ? "risk-mod" : "risk-low"}">${sections.regulatory_risk}</pre>
      ${sections.investigator_notes ? `<h2>8. Investigator Notes</h2><pre>${sections.investigator_notes}</pre>` : ""}
      <div class="approval"><pre>${sections.approvals}</pre></div>
      </body></html>
    `;
    const blob = new Blob([content], { type: "application/msword" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${deviation.deviation_id}-Investigation-Report.doc`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      {/* Print styles */}
      <style>{`
        @media print {
          .print\\:hidden { display: none !important; }
          body { font-size: 10pt; }
        }
      `}</style>

      <div className="max-w-4xl mx-auto pb-16">
        {/* Toolbar */}
        <div className="print:hidden flex items-center justify-between mb-6 sticky top-0 bg-gray-50 py-3 z-10 border-b border-gray-200">
          <button
            onClick={() => router.push(`/deviations/${id}`)}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-600"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Workspace
          </button>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400 italic">All sections are editable — click "Edit" to modify</span>
            <button
              onClick={handleExportWord}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
            >
              <Download className="w-3.5 h-3.5" /> Export Word
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <Printer className="w-3.5 h-3.5" /> Print / PDF
            </button>
          </div>
        </div>

        {/* Report */}
        <div ref={reportRef} className="bg-white rounded-xl border border-gray-200 p-10 shadow-sm">
          {/* Header */}
          <div className="border-b-2 border-blue-800 pb-4 mb-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-5 h-5 text-blue-700 print:hidden" />
                  <h1 className="text-2xl font-bold text-gray-900">Deviation Investigation Report</h1>
                </div>
                <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-600">
                  <span><span className="font-semibold text-gray-800">Deviation ID:</span> {deviation.deviation_id}</span>
                  <span><span className="font-semibold text-gray-800">Product:</span> {deviation.product_id} / Batch {deviation.batch_id}</span>
                  <span><span className="font-semibold text-gray-800">Process Area:</span> {deviation.process_area}</span>
                </div>
              </div>
              <div className="text-right text-sm text-gray-600 space-y-0.5 shrink-0 ml-4">
                <div>
                  <span className={`inline-block px-2 py-0.5 rounded font-semibold text-xs ${
                    deviation.severity === "Critical" ? "bg-red-100 text-red-700" :
                    deviation.severity === "Major" ? "bg-amber-100 text-amber-700" :
                    "bg-gray-100 text-gray-600"
                  }`}>{deviation.severity}</span>
                  <span className="ml-2 inline-block px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-700 font-medium">{deviation.status}</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">Opened: {formatDate(deviation.opened_date)}</div>
                <div className="text-xs text-gray-500">Investigator: {INVESTIGATOR_NAMES[deviation.investigator_id] ?? deviation.investigator_id}</div>
              </div>
            </div>
          </div>

          {/* Sections */}
          <EditableSection label="1. Incident Description" value={sections.incident_description} onChange={update("incident_description")} rows={5} />
          <EditableSection label="2. Containment Actions" value={sections.containment} onChange={update("containment")} rows={5} />
          <EditableSection label="3. Scope Assessment" value={sections.scope} onChange={update("scope")} rows={5} />
          <EditableSection label="4. Root Cause Analysis" value={sections.root_cause} onChange={update("root_cause")} rows={7} />
          <EditableSection label="5. Supporting Evidence" value={sections.supporting_evidence} onChange={update("supporting_evidence")} rows={7} />
          <EditableSection label="6. CAPA Plan" value={sections.capa_plan} onChange={update("capa_plan")} rows={8} mono />

          {/* Regulatory Risk */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-1.5">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">7. Regulatory Risk Assessment</h3>
              <button
                onClick={() => {}}
                className="print:hidden flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                style={{ display: "none" }}
              />
            </div>
            <div className={`rounded-lg p-3 border text-sm leading-relaxed ${
              deviation.severity === "Critical" ? "bg-red-50 border-red-200 text-red-800" :
              deviation.severity === "Major" ? "bg-amber-50 border-amber-200 text-amber-800" :
              "bg-gray-50 border-gray-200 text-gray-700"
            }`}>
              <EditableSection label="" value={sections.regulatory_risk} onChange={update("regulatory_risk")} rows={3} />
            </div>
          </div>

          <EditableSection label="8. Investigator Notes" value={sections.investigator_notes} onChange={update("investigator_notes")} rows={4} />

          {/* Sign-off */}
          <div className="border-t border-gray-200 pt-5 mt-2">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">9. Approvals &amp; Sign-off</h3>
            <div className="grid grid-cols-3 gap-6 text-sm">
              <div>
                <p className="text-xs text-gray-400 mb-1">Investigator</p>
                <p className="font-medium text-gray-800">{INVESTIGATOR_NAMES[deviation.investigator_id] ?? deviation.investigator_id}</p>
                <div className="mt-3 border-b border-gray-400 pb-0.5 w-40" />
                <p className="text-xs text-gray-400 mt-1">Signature / Date</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">QA Analyst</p>
                <p className="font-medium text-gray-800">{deviation.qa_analyst_id}</p>
                <div className="mt-3 border-b border-gray-400 pb-0.5 w-40" />
                <p className="text-xs text-gray-400 mt-1">Signature / Date</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">QA Manager Review</p>
                <p className="font-medium text-gray-800">Pending</p>
                <div className="mt-3 border-b border-gray-400 pb-0.5 w-40" />
                <p className="text-xs text-gray-400 mt-1">Signature / Date</p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-4 border-t border-gray-100 text-xs text-gray-400 flex justify-between">
            <span>Document generated by QualityAI Copilot — Synthetic demonstration data only</span>
            <span>{deviation.deviation_id} · {formatDate(new Date().toISOString())}</span>
          </div>
        </div>
      </div>
    </>
  );
}
