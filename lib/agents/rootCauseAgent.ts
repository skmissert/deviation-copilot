import { Deviation, RootCause } from "../data/deviations";

export interface RootCauseCandidate {
  cause: RootCause;
  confidence: "High" | "Medium" | "Low";
  evidence_sources: string[];
  historical_matches: string[];
  similar_count: number;
  rationale: string;
}

export interface RootCauseResult {
  candidates: RootCauseCandidate[];
}

const EVIDENCE_MAP: Record<RootCause, string[]> = {
  "Documentation Error": ["Batch Record", "QA Review Checklist"],
  "Equipment Calibration Drift": ["Equipment Log", "Batch Record"],
  "Operator Training Gap": ["Batch Record", "Training Records"],
  "Process Parameter Drift": ["Batch Record", "Environmental Monitoring"],
  "Environmental Excursion": ["Environmental Monitoring", "Equipment Log"],
  "Supplier Material Issue": ["QC Test Summary", "Incoming Material Log"],
};

const RATIONALE_MAP: Record<RootCause, string> = {
  "Documentation Error": "Missing or incomplete records identified during batch review. Pattern consistent with shift handoff documentation gap.",
  "Equipment Calibration Drift": "Equipment log shows calibration deviation prior to event. Temperature/pressure readings outside expected tolerance band.",
  "Operator Training Gap": "Batch record shows procedural deviation consistent with inadequate operator training on current SOP version.",
  "Process Parameter Drift": "Batch record indicates process parameter outside target range during critical step. Gradual drift pattern detected.",
  "Environmental Excursion": "Environmental monitoring records show humidity or temperature exceedance during the incident window.",
  "Supplier Material Issue": "QC incoming test results indicate non-conforming material characteristics. Supplier batch correlation confirmed.",
};

export async function runRootCauseAgent(deviation: Deviation, allDeviations: Deviation[]): Promise<RootCauseResult> {
  await new Promise(r => setTimeout(r, 400));

  const sameAreaSameCause = allDeviations.filter(
    d => d.deviation_id !== deviation.deviation_id &&
         d.process_area === deviation.process_area &&
         d.root_cause_category === deviation.root_cause_category
  );

  const primary: RootCauseCandidate = {
    cause: deviation.root_cause_category,
    confidence: sameAreaSameCause.length >= 3 ? "High" : sameAreaSameCause.length >= 1 ? "Medium" : "Low",
    evidence_sources: EVIDENCE_MAP[deviation.root_cause_category],
    historical_matches: sameAreaSameCause.slice(0, 3).map(d => d.deviation_id),
    similar_count: sameAreaSameCause.length,
    rationale: RATIONALE_MAP[deviation.root_cause_category],
  };

  const allCauses: RootCause[] = [
    "Documentation Error", "Equipment Calibration Drift", "Operator Training Gap",
    "Process Parameter Drift", "Environmental Excursion", "Supplier Material Issue"
  ];
  const alternates = allCauses.filter(c => c !== deviation.root_cause_category).slice(0, 2);

  const alternatives: RootCauseCandidate[] = alternates.map((cause, i) => ({
    cause,
    confidence: (i === 0 ? "Medium" : "Low") as "Medium" | "Low",
    evidence_sources: EVIDENCE_MAP[cause].slice(0, 1),
    historical_matches: allDeviations.filter(d => d.root_cause_category === cause).slice(0, 1).map(d => d.deviation_id),
    similar_count: allDeviations.filter(d => d.root_cause_category === cause).length,
    rationale: `Secondary hypothesis: ${RATIONALE_MAP[cause]}`,
  }));

  return { candidates: [primary, ...alternatives] };
}
