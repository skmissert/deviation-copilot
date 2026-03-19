export interface SimulationParams {
  ai_enabled: boolean;
  investigator_fte: number;
  arrival_rate_multiplier: number; // 0.7 to 1.5
  capa_improvement_pct: number;    // 0 to 0.4
}

export interface SimulationResult {
  avg_investigation_days: number;
  avg_capa_days: number;
  investigator_utilization_pct: number;
  monthly_throughput: number;
  backlog_size: number;
  recurrence_rate_pct: number;
  fte_freed: number;
}

const BASELINE = {
  avg_investigation_days: 12.5,
  avg_capa_days: 28.0,
  investigator_utilization_pct: 84,
  monthly_throughput: 7.2,
  backlog_size: 5,
  recurrence_rate_pct: 15,
  arrival_rate_per_month: 8,
  hours_per_investigation: 16,
  baseline_fte: 4.7,
};

export async function runSimulationAgent(params: SimulationParams): Promise<SimulationResult> {
  await new Promise(r => setTimeout(r, 250));

  const ai_inv_reduction = params.ai_enabled ? 0.35 : 0;
  const ai_capa_reduction = params.ai_enabled ? 0.25 : 0;
  const ai_recurrence_reduction = params.ai_enabled ? 0.30 : 0;

  const adj_investigation = BASELINE.avg_investigation_days * (1 - ai_inv_reduction);
  const adj_capa = BASELINE.avg_capa_days * (1 - ai_capa_reduction - params.capa_improvement_pct);
  const adj_recurrence = BASELINE.recurrence_rate_pct * (1 - ai_recurrence_reduction);

  const total_capacity_hours = params.investigator_fte * 40 * 0.55 * 4.33;
  const arrival_rate = BASELINE.arrival_rate_per_month * params.arrival_rate_multiplier;
  const hours_needed = arrival_rate * BASELINE.hours_per_investigation * (1 - ai_inv_reduction);
  const utilization = Math.min(99, (hours_needed / total_capacity_hours) * 100);

  const throughput = Math.min(
    arrival_rate,
    total_capacity_hours / (BASELINE.hours_per_investigation * (1 - ai_inv_reduction))
  );
  const backlog = Math.max(0, Math.round((arrival_rate - throughput) * 2));

  const baseline_util_hours = BASELINE.arrival_rate_per_month * BASELINE.hours_per_investigation;
  const new_util_hours = arrival_rate * BASELINE.hours_per_investigation * (1 - ai_inv_reduction);
  const fte_freed = Math.max(0, (baseline_util_hours - new_util_hours) / (40 * 0.55 * 4.33));

  return {
    avg_investigation_days: Math.round(adj_investigation * 10) / 10,
    avg_capa_days: Math.round(adj_capa * 10) / 10,
    investigator_utilization_pct: Math.round(utilization),
    monthly_throughput: Math.round(throughput * 10) / 10,
    backlog_size: backlog,
    recurrence_rate_pct: Math.round(adj_recurrence * 10) / 10,
    fte_freed: Math.round(fte_freed * 10) / 10,
  };
}

export const BASELINE_RESULT: SimulationResult = {
  avg_investigation_days: BASELINE.avg_investigation_days,
  avg_capa_days: BASELINE.avg_capa_days,
  investigator_utilization_pct: BASELINE.investigator_utilization_pct,
  monthly_throughput: BASELINE.monthly_throughput,
  backlog_size: BASELINE.backlog_size,
  recurrence_rate_pct: BASELINE.recurrence_rate_pct,
  fte_freed: 0,
};
