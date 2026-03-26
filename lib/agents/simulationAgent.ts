// ─── Simulation parameters — each maps to a specific AI feature in the app ───

export interface SimulationParams {
  copilot_adoption_pct: number;    // 0–100: % of investigations using AI root cause + summary drafting
  capa_ai_adoption_pct: number;    // 0–100: % of CAPAs using AI action recommendations
  ai_triage_enabled: boolean;      // AI auto-classification and routing at intake
}

export interface SimulationResult {
  avg_investigation_days: number;
  avg_capa_days: number;
  classification_time_days: number;
  report_drafting_days: number;
  capa_determination_days: number;
}

// ─── Baseline (current state from live dataset) ───────────────────────────────

const BASELINE = {
  avg_investigation_days: 12.5,
  avg_capa_days: 88.0,
  classification_time_days: 3.0,    // days from report to triage complete
  report_drafting_days: 2.0,         // days to draft investigation summary
  capa_determination_days: 5.0,      // days from investigation complete to CAPA creation
  monthly_investigations: 8,
  hours_per_investigation: 16,
};

export const BASELINE_RESULT: SimulationResult = {
  avg_investigation_days: BASELINE.avg_investigation_days,
  avg_capa_days: BASELINE.avg_capa_days,
  classification_time_days: BASELINE.classification_time_days,
  report_drafting_days: BASELINE.report_drafting_days,
  capa_determination_days: BASELINE.capa_determination_days,
};

// ─── Simulation model ─────────────────────────────────────────────────────────
//
// Each lever maps to concrete AI features visible in the app:
//
//  copilot_adoption_pct → Root Cause Analysis Agent + Summary Agent (/deviations)
//    - Reduces avg investigation time by up to 35%
//    - Reduces report drafting time by up to 70%
//
//  capa_ai_adoption_pct → CAPA Recommendation Agent (/capas)
//    - Reduces avg CAPA cycle time by up to 25%
//    - Reduces CAPA determination time by up to 60%
//
//  ai_triage_enabled → Intake Analysis Agent (/deviations — Intake step)
//    - Reduces classification time by up to 80%

export async function runSimulationAgent(params: SimulationParams): Promise<SimulationResult> {
  await new Promise(r => setTimeout(r, 300));

  const copilot = params.copilot_adoption_pct / 100;   // 0–1
  const capaAi  = params.capa_ai_adoption_pct  / 100;  // 0–1
  const triage  = params.ai_triage_enabled;

  // Investigation time: AI copilot reduces by up to 35% at full adoption
  const avg_investigation_days = BASELINE.avg_investigation_days * (1 - 0.35 * copilot);

  // CAPA cycle time: AI recommendations reduce by up to 25% at full adoption
  const avg_capa_days = BASELINE.avg_capa_days * (1 - 0.25 * capaAi);

  // Classification time: AI triage reduces by up to 80% at full adoption
  const classification_time_days = BASELINE.classification_time_days * (1 - 0.80 * (triage ? 1 : 0));

  // Report drafting time: AI copilot reduces by up to 70% at full adoption
  const report_drafting_days = BASELINE.report_drafting_days * (1 - 0.70 * copilot);

  // CAPA determination time: AI CAPA recommendations reduce by up to 60% at full adoption
  const capa_determination_days = BASELINE.capa_determination_days * (1 - 0.60 * capaAi);

  return {
    avg_investigation_days:  Math.round(avg_investigation_days  * 10) / 10,
    avg_capa_days:           Math.round(avg_capa_days           * 10) / 10,
    classification_time_days: Math.round(classification_time_days * 10) / 10,
    report_drafting_days:    Math.round(report_drafting_days    * 10) / 10,
    capa_determination_days: Math.round(capa_determination_days * 10) / 10,
  };
}
