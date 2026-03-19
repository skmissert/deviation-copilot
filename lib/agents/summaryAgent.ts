import { Deviation } from "../data/deviations";
import { RootCauseCandidate } from "./rootCauseAgent";
import { CAPARecommendation } from "./capaAgent";

export interface SummaryDraft {
  deviation_id: string;
  incident_summary: string;
  containment_actions: string;
  root_cause_statement: string;
  supporting_evidence: string[];
  capa_plan_summary: string;
  investigator_notes: string;
  regulatory_risk: string;
}

export async function runSummaryAgent(
  deviation: Deviation,
  approvedCause: RootCauseCandidate,
  approvedCAPAs: CAPARecommendation[]
): Promise<SummaryDraft> {
  await new Promise(r => setTimeout(r, 400));

  return {
    deviation_id: deviation.deviation_id,
    incident_summary: `A ${deviation.severity.toLowerCase()} deviation was identified in the ${deviation.process_area} area on ${new Date(deviation.opened_date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}. The deviation involved ${deviation.root_cause_category.toLowerCase()} resulting in ${deviation.batch_quarantined_flag ? "batch quarantine and release hold" : "process interruption without batch impact"}. Immediate containment actions were initiated per SOP-001.`,
    containment_actions: deviation.containment_action + ". Investigation team notified within 2 hours of deviation identification.",
    root_cause_statement: `Root cause confirmed as: ${approvedCause.cause}. ${approvedCause.rationale} Investigation reviewed ${approvedCause.evidence_sources.join(", ")} and identified ${approvedCause.similar_count} similar historical deviations in the ${deviation.process_area} area.`,
    supporting_evidence: approvedCause.evidence_sources,
    capa_plan_summary: approvedCAPAs
      .map((c, i) => `${i + 1}. [${c.action_type}] ${c.description} — Owner: ${c.suggested_owner}, Due: ${c.suggested_days} days.`)
      .join("\n"),
    investigator_notes: "",
    regulatory_risk:
      deviation.severity === "Critical"
        ? "HIGH: Batch quarantine and release hold in effect. Regulatory impact assessment required. Potential reportable event — QA Director review mandatory."
        : deviation.severity === "Major"
        ? "MODERATE: Batch impact under investigation. Standard regulatory documentation required. QA Manager approval required prior to closure."
        : "LOW: No batch impact identified. Standard deviation documentation sufficient. QA analyst review required.",
  };
}
