// ─── Simulation parameters — each maps to a specific AI feature in the app ───

export interface SimulationParams {
  copilot_adoption_pct: number;    // 0–100: % of investigations using AI root cause + summary drafting
  capa_ai_adoption_pct: number;    // 0–100: % of CAPAs using AI action recommendations
  ai_triage_enabled: boolean;      // AI auto-classification and routing at intake
}

export interface SimulationResult {
  avg_investigation_days: number;
  avg_capa_days: number;
  investigator_utilization_pct: number;
  recurrence_rate_pct: number;
  fte_freed: number;
}

// ─── Baseline (current state from live dataset) ───────────────────────────────

const BASELINE = {
  avg_investigation_days: 12.5,
  avg_capa_days: 28.0,
  investigator_utilization_pct: 84,
  recurrence_rate_pct: 15.0,
  monthly_investigations: 8,
  hours_per_investigation: 16,
};

// Total FTE currently spent on manual investigation tasks (used as baseline for FTE row)
// 8 inv/month × 16 hrs ÷ (40 hrs × 0.55 utilisation × 4.33 wks) ≈ 1.3 FTE
const EFFECTIVE_FTE_HOURS = 40 * 0.55 * 4.33;
export const TOTAL_INVESTIGATION_FTE = Math.round(
  (BASELINE.monthly_investigations * BASELINE.hours_per_investigation / EFFECTIVE_FTE_HOURS) * 10
) / 10;

export const BASELINE_RESULT: SimulationResult = {
  avg_investigation_days: BASELINE.avg_investigation_days,
  avg_capa_days: BASELINE.avg_capa_days,
  investigator_utilization_pct: BASELINE.investigator_utilization_pct,
  recurrence_rate_pct: BASELINE.recurrence_rate_pct,
  fte_freed: 0,
};

// ─── Simulation model ─────────────────────────────────────────────────────────
//
// Each lever maps to concrete AI features visible in the app:
//
//  copilot_adoption_pct → Root Cause Analysis Agent + Summary Agent (/deviations)
//    - Reduces avg investigation time by up to 35%
//    - Reduces recurrence rate by up to 30% (better root cause identification)
//
//  capa_ai_adoption_pct → CAPA Recommendation Agent (/capas)
//    - Reduces avg CAPA cycle time by up to 25%
//    - Reduces recurrence rate by additional up to 20% (better CAPA targeting)
//
//  ai_triage_enabled → Intake Analysis Agent (/deviations — Intake step)
//    - Reduces investigator utilization by 5% (auto-routing eliminates queue)
//    - Small additional recurrence benefit from faster classification

export async function runSimulationAgent(params: SimulationParams): Promise<SimulationResult> {
  await new Promise(r => setTimeout(r, 300));

  const copilot = params.copilot_adoption_pct / 100;   // 0–1
  const capaAi  = params.capa_ai_adoption_pct  / 100;  // 0–1
  const triage  = params.ai_triage_enabled;

  // Investigation time: AI copilot reduces by up to 35% at full adoption
  const avg_investigation_days = BASELINE.avg_investigation_days * (1 - 0.35 * copilot);

  // CAPA cycle time: AI recommendations reduce by up to 25% at full adoption
  const avg_capa_days = BASELINE.avg_capa_days * (1 - 0.25 * capaAi);

  // Recurrence rate: copilot improves root cause accuracy (-30%), CAPA AI improves action quality (-20%)
  const recurrence_rate_pct = BASELINE.recurrence_rate_pct
    * (1 - 0.30 * copilot)
    * (1 - 0.20 * capaAi)
    * (triage ? 0.97 : 1); // triage gives a small further benefit

  // Utilization: AI copilot reduces hours per investigation; triage eliminates queue overhead
  const utilization_reduction = 0.30 * copilot + (triage ? 0.05 : 0);
  const investigator_utilization_pct = Math.round(
    BASELINE.investigator_utilization_pct * (1 - utilization_reduction)
  );

  // FTE freed: hours saved per month / effective FTE hours per month
  // 8 inv/month × 16 hrs × 35% reduction at full adoption = 44.8 hrs/month saved
  const hours_saved = BASELINE.monthly_investigations
    * BASELINE.hours_per_investigation
    * 0.35 * copilot;
  const fte_freed = hours_saved / EFFECTIVE_FTE_HOURS;

  return {
    avg_investigation_days: Math.round(avg_investigation_days * 10) / 10,
    avg_capa_days:           Math.round(avg_capa_days           * 10) / 10,
    investigator_utilization_pct,
    recurrence_rate_pct:     Math.round(recurrence_rate_pct     * 10) / 10,
    fte_freed:               Math.round(fte_freed                * 10) / 10,
  };
}
