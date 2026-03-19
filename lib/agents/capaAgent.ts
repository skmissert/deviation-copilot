import { RootCause } from "../data/deviations";
import { CAPA, CAPAOwner } from "../data/capas";

export interface CAPARecommendation {
  action_type: "Corrective" | "Preventive" | "Corrective + Preventive";
  description: string;
  suggested_owner: CAPAOwner;
  suggested_days: number;
  prior_capa_ids: string[];
  effectiveness_note: string;
}

export interface CAPAResult {
  recommendations: CAPARecommendation[];
}

const CAPA_TEMPLATES: Record<RootCause, CAPARecommendation[]> = {
  "Documentation Error": [
    {
      action_type: "Corrective",
      description: "Implement mandatory dual-signature checklist for all batch record completions during shift handoffs.",
      suggested_owner: "QA Manager",
      suggested_days: 14,
      prior_capa_ids: [],
      effectiveness_note: "Similar corrective actions achieved 90% recurrence reduction in prior batches.",
    },
    {
      action_type: "Preventive",
      description: "Retrain all operators on current SOP documentation requirements and conduct documented competency assessment.",
      suggested_owner: "QA Manager",
      suggested_days: 21,
      prior_capa_ids: [],
      effectiveness_note: "Training-based preventive actions effective in 85% of prior cases.",
    },
  ],
  "Equipment Calibration Drift": [
    {
      action_type: "Corrective",
      description: "Perform immediate recalibration of all temperature sensors in affected manufacturing suite. Verify against NIST-traceable standards.",
      suggested_owner: "Engineering",
      suggested_days: 14,
      prior_capa_ids: [],
      effectiveness_note: "Immediate recalibration resolved similar issues in 92% of prior cases.",
    },
    {
      action_type: "Preventive",
      description: "Update preventive maintenance schedule to reduce calibration interval from quarterly to monthly for critical process sensors.",
      suggested_owner: "Engineering",
      suggested_days: 30,
      prior_capa_ids: [],
      effectiveness_note: "Interval reduction prevented recurrence in 88% of comparable equipment cases.",
    },
  ],
  "Operator Training Gap": [
    {
      action_type: "Corrective",
      description: "Conduct targeted retraining session for affected operators on current SOP revision. Document with sign-off.",
      suggested_owner: "Manufacturing Lead",
      suggested_days: 14,
      prior_capa_ids: [],
      effectiveness_note: "Targeted retraining has 87% effectiveness rate in eliminating procedure gaps.",
    },
    {
      action_type: "Preventive",
      description: "Implement quarterly SOP competency assessments for all production operators. Add to training management system.",
      suggested_owner: "Manufacturing Lead",
      suggested_days: 30,
      prior_capa_ids: [],
      effectiveness_note: "Periodic competency checks reduced training-related deviations by 40% in pilot area.",
    },
  ],
  "Process Parameter Drift": [
    {
      action_type: "Corrective + Preventive",
      description: "Review and tighten in-process control limits. Implement automated alert at 80% of specification limit to enable early intervention.",
      suggested_owner: "Manufacturing Lead",
      suggested_days: 21,
      prior_capa_ids: [],
      effectiveness_note: "Tightened controls with automated alerting reduced out-of-spec incidents by 65%.",
    },
  ],
  "Environmental Excursion": [
    {
      action_type: "Corrective",
      description: "Inspect and service HVAC system in affected manufacturing suite. Verify temperature and humidity controls within specification.",
      suggested_owner: "Engineering",
      suggested_days: 14,
      prior_capa_ids: [],
      effectiveness_note: "HVAC service resolved environmental excursions in 95% of prior events.",
    },
    {
      action_type: "Preventive",
      description: "Install continuous environmental monitoring with automated alerts. Set alarm thresholds at 90% of specification limits.",
      suggested_owner: "Engineering",
      suggested_days: 45,
      prior_capa_ids: [],
      effectiveness_note: "Automated monitoring prevented similar excursions in 3 of 3 comparable facilities.",
    },
  ],
  "Supplier Material Issue": [
    {
      action_type: "Corrective + Preventive",
      description: "Issue formal supplier non-conformance notification. Implement enhanced incoming quality testing protocol for all materials from this supplier.",
      suggested_owner: "Quality Systems",
      suggested_days: 30,
      prior_capa_ids: [],
      effectiveness_note: "Enhanced incoming testing detected subsequent non-conformances before use in all 4 prior cases.",
    },
  ],
};

export async function runCAPAAgent(rootCause: RootCause, allCAPAs: CAPA[]): Promise<CAPAResult> {
  await new Promise(r => setTimeout(r, 350));

  const templates = CAPA_TEMPLATES[rootCause];
  const priorCAPAs = allCAPAs
    .filter(c => c.effectiveness_check_status === "Completed")
    .slice(0, 2)
    .map(c => c.capa_id);

  const recommendations = templates.map((t, i) => ({
    ...t,
    prior_capa_ids: i === 0 ? priorCAPAs : [],
  }));

  return { recommendations };
}
