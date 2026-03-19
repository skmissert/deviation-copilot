import { Deviation, RootCause } from "../data/deviations";

export interface TrendInsight {
  root_cause: RootCause;
  count: number;
  pct: number;
  process_areas: string[];
  recurrence_rate: number;
  recommendation: string;
}

export interface TrendResult {
  insights: TrendInsight[];
  systemic_alert: string | null;
}

const RECOMMENDATIONS: Record<RootCause, string> = {
  "Documentation Error": "Implement site-wide electronic batch record system with mandatory completion validation.",
  "Equipment Calibration Drift": "Deploy predictive calibration monitoring and reduce calibration intervals for critical instruments.",
  "Human Factors": "Implement fatigue risk management, error-proofing redesign for high-risk steps, and structured shift handoff protocols.",
  "Operator Training Gap": "Establish quarterly competency assessment program for all GMP operators.",
  "Process Parameter Drift": "Implement statistical process control with automated out-of-trend alerts.",
  "Environmental Excursion": "Deploy continuous environmental monitoring with real-time alert escalation.",
  "Supplier Material Issue": "Conduct supplier audit program and enhance incoming quality testing protocols.",
};

export async function runTrendAgent(deviations: Deviation[]): Promise<TrendResult> {
  await new Promise(r => setTimeout(r, 200));

  const causeCounts: Partial<Record<RootCause, Deviation[]>> = {};
  for (const d of deviations) {
    if (!causeCounts[d.root_cause_category]) causeCounts[d.root_cause_category] = [];
    causeCounts[d.root_cause_category]!.push(d);
  }

  const total = deviations.length;
  const insights: TrendInsight[] = Object.entries(causeCounts).map(([cause, devs]) => {
    const areas = [...new Set(devs!.map(d => d.process_area))];
    const recurrences = devs!.filter(d => d.recurrence_flag === 1).length;
    return {
      root_cause: cause as RootCause,
      count: devs!.length,
      pct: Math.round((devs!.length / total) * 1000) / 10,
      process_areas: areas,
      recurrence_rate: devs!.length > 0 ? Math.round((recurrences / devs!.length) * 100) : 0,
      recommendation: RECOMMENDATIONS[cause as RootCause],
    };
  }).sort((a, b) => b.count - a.count);

  const topInsight = insights[0];
  const systemic_alert =
    topInsight && topInsight.pct > 20 && topInsight.process_areas.length >= 2
      ? `AI Trend Alert: ${topInsight.root_cause} accounts for ${topInsight.pct}% of all deviations across ${topInsight.process_areas.length} process areas. Systemic intervention recommended.`
      : null;

  return { insights, systemic_alert };
}
