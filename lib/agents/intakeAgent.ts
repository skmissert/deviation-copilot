import { Deviation } from "../data/deviations";

export interface IntakeResult {
  classified_area: string;
  recommended_severity: string;
  severity_rationale: string;
  related_deviation_ids: string[];
  checklist_items_flagged: string[];
}

export async function runIntakeAgent(deviation: Deviation, allDeviations: Deviation[]): Promise<IntakeResult> {
  await new Promise(r => setTimeout(r, 300));
  // Find related deviations: same area + same root cause
  const related = allDeviations
    .filter(d => d.deviation_id !== deviation.deviation_id && d.process_area === deviation.process_area && d.root_cause_category === deviation.root_cause_category)
    .slice(0, 3)
    .map(d => d.deviation_id);

  const severityRationale = deviation.batch_quarantined_flag
    ? "Batch quarantine triggered. Release blocked. Escalated to Critical per SOP Section 3.2."
    : deviation.release_blocking_flag
    ? "Release blocking deviation detected. Major classification applied per SOP Section 3.1."
    : "No batch impact identified. Minor classification per SOP Section 3.0.";

  return {
    classified_area: deviation.process_area,
    recommended_severity: deviation.severity,
    severity_rationale: severityRationale,
    related_deviation_ids: related,
    checklist_items_flagged: ["Deviation Intake Validation", "Severity & Classification", "Investigation Preparation"],
  };
}
