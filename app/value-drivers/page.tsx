"use client";
import { useState } from "react";
import { X, Target, ChevronDown } from "lucide-react";

type MetricDetail = {
  id: string;
  name: string;
  target: string;
  description: string;
  whyItMatters: string;
  keyDrivers: string[];
  connectedTo: string[];
  targetType: "good" | "watch";
};

type Pillar = {
  id: string;
  name: string;
  subtitle: string;
  color: string;
  headerBg: string;
  cardBg: string;
  cardBorder: string;
  badgeColor: string;
  lineColor: string;
  metrics: MetricDetail[];
};

type SelectedMetric = { pillarId: string; metricId: string } | null;

const pillars: Pillar[] = [
  {
    id: "process-speed",
    name: "Process Speed",
    subtitle: "How fast deviations are resolved end-to-end",
    color: "text-white",
    headerBg: "bg-indigo-600",
    cardBg: "bg-indigo-50",
    cardBorder: "border-indigo-200",
    badgeColor: "bg-indigo-100 text-indigo-800",
    lineColor: "bg-indigo-300",
    metrics: [
      {
        id: "cycle-time",
        name: "Total Deviation Cycle Time",
        target: "≤30 days",
        description: "ID to closure — primary driver of batch release delay",
        targetType: "good",
        whyItMatters:
          "In GxP manufacturing, every day a deviation remains open is a day the affected batch cannot be released. Regulators such as the FDA and EMA expect documented closure timelines, and chronic overruns are cited in 483 observations. This metric is the headline indicator of how well the quality system is functioning end-to-end.",
        keyDrivers: [
          "Time to containment and initial triage speed",
          "Investigator availability and current backlog",
          "Completeness of evidence package at investigation start",
          "QA review queue depth and reviewer bandwidth",
        ],
        connectedTo: [
          "Investigation Duration",
          "QA Review Turnaround",
          "Open Deviation Backlog",
          "Batch On-Hold Duration",
        ],
      },
      {
        id: "containment",
        name: "Time to Containment",
        target: "≤1 day",
        description: "Speed of initial response prevents batch impact from spreading",
        targetType: "good",
        whyItMatters:
          "Containment is the first and most time-critical action in any deviation. Delays allow a localized issue to cascade — contaminating additional batches, affecting adjacent process steps, or creating a regulatory reporting obligation. A sub-24-hour containment response is expected in most GxP frameworks and demonstrates a mature quality culture.",
        keyDrivers: [
          "Clarity of escalation procedures and on-call QA coverage",
          "Operator awareness and deviation reporting culture",
          "Pre-defined containment playbooks for high-frequency deviation types",
          "Real-time batch status visibility in the quality system",
        ],
        connectedTo: [
          "Total Deviation Cycle Time",
          "Batch Quarantine Rate",
          "Critical Deviation Rate",
        ],
      },
      {
        id: "start-lag",
        name: "Investigation Start Lag",
        target: "≤3 days",
        description: "Delay between triage and investigation start creates compounding backlog",
        targetType: "good",
        whyItMatters:
          "A deviation that sits in a queue for days before investigation begins is a systemic capacity warning sign. Evidence degrades, equipment state changes, and personnel memory fades — all reducing investigation quality. Regulators pay attention to elapsed time between deviation date and investigation initiation date as a measure of quality system responsiveness.",
        keyDrivers: [
          "Investigator assignment process and queue management",
          "Triage classification accuracy (right investigator assigned first time)",
          "Investigator utilization rate — consistently above 85% creates forced delays",
          "Priority rules for critical vs. minor deviations",
        ],
        connectedTo: [
          "Investigator Utilization",
          "Open Deviation Backlog",
          "Total Deviation Cycle Time",
          "Investigation Duration",
        ],
      },
      {
        id: "investigation-duration",
        name: "Investigation Duration",
        target: "≤14 days",
        description: "Time from investigation start to root cause confirmed",
        targetType: "good",
        whyItMatters:
          "This is the analytical core of the quality system. Investigations that run long signal evidence gaps, unclear SOP guidance, insufficient investigator training, or systemic complexity. Consistently long investigations inflate cycle time, hold batches longer, and reduce investigator throughput — creating a reinforcing backlog cycle.",
        keyDrivers: [
          "Evidence completeness and accessibility at investigation start",
          "Investigator experience and domain expertise",
          "Historical pattern matching — recurring root causes should resolve faster",
          "Complexity and cross-functional dependencies of the deviation",
        ],
        connectedTo: [
          "Total Deviation Cycle Time",
          "RFT at QA Review",
          "Recurrence Rate",
          "Investigator Utilization",
        ],
      },
      {
        id: "qa-review",
        name: "QA Review Turnaround",
        target: "≤3 days",
        description: "Final QA approval step — often the hidden bottleneck",
        targetType: "good",
        whyItMatters:
          "QA review is frequently the last-mile bottleneck that inflates total cycle time without appearing on standard metrics. A completed investigation sitting in a QA approval queue does not show up in 'investigation duration' but still delays batch release. Tracking this separately exposes a structural capacity gap that process improvements and AI assistance can address directly.",
        keyDrivers: [
          "QA reviewer workload and competing priorities",
          "Investigation report quality — incomplete submissions trigger revision loops",
          "Review SLA definitions and escalation triggers",
          "Number of reviewers qualified to approve each deviation type",
        ],
        connectedTo: [
          "Total Deviation Cycle Time",
          "RFT at QA Review",
          "Batch On-Hold Duration",
          "Process Conformance Score",
        ],
      },
    ],
  },
  {
    id: "right-first-time",
    name: "Right First Time",
    subtitle: "How accurately investigations and CAPAs are executed",
    color: "text-white",
    headerBg: "bg-emerald-600",
    cardBg: "bg-emerald-50",
    cardBorder: "border-emerald-200",
    badgeColor: "bg-emerald-100 text-emerald-800",
    lineColor: "bg-emerald-300",
    metrics: [
      {
        id: "rft-qa",
        name: "RFT at QA Review",
        target: ">90%",
        description: "% of investigation summaries approved without requiring revision or rework",
        targetType: "good",
        whyItMatters:
          "Rework at QA review is a compounding cost: it consumes investigator time, delays batch release, and signals process execution failures upstream. A high RFT rate at QA review means investigators are completing quality work the first time — a leading indicator of training effectiveness, SOP clarity, and documentation discipline in the quality system.",
        keyDrivers: [
          "Clarity of investigation report templates and expectations",
          "Investigator training on documentation standards",
          "Quality of AI-assisted summary drafting and pre-submission checklist",
          "Consistency of QA reviewer feedback (clear, standardized rejection reasons)",
        ],
        connectedTo: [
          "QA Review Turnaround",
          "Documentation Accuracy Rate",
          "Investigation Duration",
          "Total Deviation Cycle Time",
        ],
      },
      {
        id: "capa-effectiveness",
        name: "CAPA Effectiveness Rate",
        target: ">85%",
        description: "% of closed CAPAs rated effective at post-implementation check",
        targetType: "good",
        whyItMatters:
          "CAPA effectiveness is the ultimate quality system output metric. An ineffective CAPA means the root cause was not addressed — and the deviation will recur. FDA 21 CFR Part 820 and ICH Q10 both require documented effectiveness checks. A rate below 85% is a material inspection finding and a signal that the root cause analysis process itself needs to be redesigned.",
        keyDrivers: [
          "Root cause analysis depth and accuracy",
          "CAPA action specificity — targeted systemic fixes vs. generic retraining",
          "Implementation fidelity and follow-through by assigned owners",
          "Adequacy of effectiveness check criteria and evaluation timeframe",
        ],
        connectedTo: [
          "Recurrence Rate",
          "CAPA Sequencing Compliance",
          "Critical Deviation Rate",
          "Process Conformance Score",
        ],
      },
      {
        id: "recurrence",
        name: "Recurrence Rate",
        target: "<15%",
        description: "% of deviations flagged as repeat of prior root cause — signals CAPA failure",
        targetType: "watch",
        whyItMatters:
          "Recurring deviations are the clearest evidence of CAPA system failure. When the same root cause appears twice, it means either the CAPA was never truly implemented, or the corrective action did not address the actual systemic driver. Regulators treat high recurrence rates as a signal of a broken quality system and often cite them as the basis for Warning Letters.",
        keyDrivers: [
          "CAPA effectiveness check rigor and timeliness",
          "Root cause identification accuracy — fixing symptoms vs. root causes",
          "Systemic vs. local CAPA scope — local fixes rarely prevent recurrence",
          "Historical pattern awareness and knowledge management across investigations",
        ],
        connectedTo: [
          "CAPA Effectiveness Rate",
          "Critical Deviation Rate",
          "Batch Quarantine Rate",
          "Process Conformance Score",
        ],
      },
      {
        id: "doc-accuracy",
        name: "Documentation Accuracy Rate",
        target: ">95%",
        description: "% of batch records and deviation records with no errors at first review",
        targetType: "good",
        whyItMatters:
          "Documentation is not administrative overhead in a GxP environment — it is the product of the quality system. A batch record error is not simply a paperwork mistake; it can create an unresolvable ambiguity about what actually happened during manufacturing, potentially leading to batch rejection or recall. Documentation accuracy is also the single most common root cause category in the deviation dataset.",
        keyDrivers: [
          "Operator training and competency verification on GMP documentation practices",
          "Electronic batch record system design and error-proofing features",
          "Review and approval workflow configuration",
          "Workload and time pressure during batch execution",
        ],
        connectedTo: [
          "RFT at QA Review",
          "Recurrence Rate",
          "Total Deviation Cycle Time",
          "Critical Deviation Rate",
        ],
      },
    ],
  },
  {
    id: "capacity",
    name: "Capacity & Throughput",
    subtitle: "Whether the team can handle the workload without creating a backlog",
    color: "text-white",
    headerBg: "bg-blue-600",
    cardBg: "bg-blue-50",
    cardBorder: "border-blue-200",
    badgeColor: "bg-blue-100 text-blue-800",
    lineColor: "bg-blue-300",
    metrics: [
      {
        id: "utilization",
        name: "Investigator Utilization",
        target: "70–85%",
        description: "Optimal range — above 85% risks quality degradation and burnout",
        targetType: "watch",
        whyItMatters:
          "Investigator utilization is a leading indicator of queue pressure and investigation quality risk. Below 70%, capacity is being wasted; above 85%, investigators are under chronic time pressure — which is when corners get cut, documentation errors increase, and root cause analyses become superficial. Sustained over-utilization is directly correlated with RFT failures and rising recurrence rates.",
        keyDrivers: [
          "Deviation arrival rate relative to investigator FTE",
          "Non-investigation time demands (meetings, training, audits)",
          "AI assistance adoption — AI tools can reduce per-investigation effort significantly",
          "Investigator skill mix vs. complexity distribution of incoming deviations",
        ],
        connectedTo: [
          "Investigation Start Lag",
          "Open Deviation Backlog",
          "Investigation Duration",
          "RFT at QA Review",
        ],
      },
      {
        id: "backlog",
        name: "Open Deviation Backlog",
        target: "≤10 per site",
        description: "Count of open investigations — leading indicator of cycle time pressure",
        targetType: "good",
        whyItMatters:
          "Backlog is the queue visibility metric. When more deviations are arriving than are being closed, the backlog grows — and with it, cycle times, batch hold durations, and investigator stress. A backlog above 10 per site is a strong predictor of upcoming SLA breaches and is a common trigger for regulatory inspection findings related to timely investigation completion.",
        keyDrivers: [
          "Deviation arrival rate — seasonality, campaign volume, new product launches",
          "Investigator throughput capacity (FTE times effective hours per week)",
          "Investigation complexity and average duration",
          "Priority and escalation logic — are critical deviations being expedited?",
        ],
        connectedTo: [
          "Investigation Start Lag",
          "Investigator Utilization",
          "Total Deviation Cycle Time",
          "Batch On-Hold Duration",
        ],
      },
      {
        id: "overdue-capa",
        name: "Overdue CAPA Rate",
        target: "0%",
        description: "% of CAPAs past their committed due date — a direct audit finding risk",
        targetType: "good",
        whyItMatters:
          "Any overdue CAPA is a documented commitment that was not met — and regulators read CAPA tracking reports line by line. An overdue CAPA rate above zero is a direct inspection finding in virtually every GxP framework. Beyond the regulatory risk, overdue CAPAs signal that the assigned owner either lacked capacity, authority, or clear guidance to complete the action — all correctable with better system design.",
        keyDrivers: [
          "Realism of committed timelines at CAPA creation",
          "Owner accountability and visibility into upcoming due dates",
          "Resource availability for implementation (engineering, training, IT)",
          "Escalation and reminder workflow configuration",
        ],
        connectedTo: [
          "CAPA Effectiveness Rate",
          "CAPA Sequencing Compliance",
          "Critical Deviation Rate",
          "Process Conformance Score",
        ],
      },
      {
        id: "hold-duration",
        name: "Batch On-Hold Duration",
        target: "≤15 days avg",
        description: "Average days batches sit quarantined pending investigation outcome",
        targetType: "good",
        whyItMatters:
          "Every day a batch is on hold is a day of working capital tied up and supply chain risk accumulating. For mRNA products with short shelf lives, prolonged hold durations can result in batch expiry before release — a total loss. This metric directly translates quality system performance into financial and supply impact terms that operations and finance leadership can act on.",
        keyDrivers: [
          "Total deviation cycle time and investigation speed",
          "QA review turnaround — approvals that sit in queue extend hold duration directly",
          "Batch scheduling practices — were contingency batches planned?",
          "Product shelf life relative to expected investigation duration",
        ],
        connectedTo: [
          "Total Deviation Cycle Time",
          "QA Review Turnaround",
          "Open Deviation Backlog",
          "Critical Deviation Rate",
        ],
      },
    ],
  },
  {
    id: "compliance",
    name: "Compliance & Risk",
    subtitle: "The regulatory exposure embedded in how the process is run",
    color: "text-white",
    headerBg: "bg-rose-600",
    cardBg: "bg-rose-50",
    cardBorder: "border-rose-200",
    badgeColor: "bg-rose-100 text-rose-800",
    lineColor: "bg-rose-300",
    metrics: [
      {
        id: "conformance",
        name: "Process Conformance Score",
        target: ">95%",
        description: "% of investigations following required SOP activity sequence — a primary inspection target",
        targetType: "good",
        whyItMatters:
          "Regulators do not just evaluate what conclusions were reached — they evaluate how the investigation was conducted. The sequence of activities (containment before investigation, investigation before CAPA, CAPA before closure) is codified in 21 CFR Part 211, EU GMP Annex 11, and ICH Q10. Deviations from this sequence are not just procedural errors; they are compliance findings that can invalidate an otherwise sound investigation.",
        keyDrivers: [
          "Electronic quality management system (eQMS) workflow enforcement",
          "Investigator training and ongoing competency assessment",
          "SOP clarity and accessibility at point of use",
          "Audit and monitoring of process adherence metrics in real time",
        ],
        connectedTo: [
          "CAPA Sequencing Compliance",
          "RFT at QA Review",
          "Critical Deviation Rate",
          "Documentation Accuracy Rate",
        ],
      },
      {
        id: "capa-sequencing",
        name: "CAPA Sequencing Compliance",
        target: "100%",
        description: "% of cases where CAPA was created only after investigation complete — non-negotiable GxP requirement",
        targetType: "good",
        whyItMatters:
          "Creating a CAPA before the root cause investigation is complete is one of the most cited GxP violations. It indicates that the corrective action was predetermined rather than evidence-based — undermining the entire purpose of the quality system. Regulators treat this as a systemic process failure, not an isolated error, and it frequently leads to repeat findings across inspection cycles.",
        keyDrivers: [
          "eQMS workflow gates that prevent CAPA creation before investigation approval",
          "Investigator training on regulatory requirements for investigation sequencing",
          "Management pressure to 'close deviations fast' — a cultural risk factor",
          "Audit sampling methodology for sequencing compliance verification",
        ],
        connectedTo: [
          "Process Conformance Score",
          "CAPA Effectiveness Rate",
          "Recurrence Rate",
          "Critical Deviation Rate",
        ],
      },
      {
        id: "critical-rate",
        name: "Critical Deviation Rate",
        target: "<10% of total",
        description: "High critical rate signals systemic gaps and increases regulatory scrutiny",
        targetType: "watch",
        whyItMatters:
          "A rising critical deviation rate is a systemic risk signal. Individual critical deviations may be isolated events, but a trend above 10% of total volume indicates that process controls are failing to prevent high-severity events — which regulators interpret as evidence of inadequate quality oversight. Critical deviations also trigger mandatory reporting timelines that compress the entire investigation and CAPA cycle.",
        keyDrivers: [
          "Process control maturity and in-process monitoring capability",
          "Severity classification accuracy and consistency across investigators",
          "Preventive maintenance and equipment reliability program effectiveness",
          "Environmental and supplier qualification standards",
        ],
        connectedTo: [
          "Recurrence Rate",
          "Batch Quarantine Rate",
          "CAPA Effectiveness Rate",
          "Total Deviation Cycle Time",
        ],
      },
      {
        id: "quarantine-rate",
        name: "Batch Quarantine Rate",
        target: "Tracked vs. benchmark",
        description: "% of deviation-linked batches placed on hold — impacts supply reliability",
        targetType: "watch",
        whyItMatters:
          "The batch quarantine rate connects quality system performance directly to supply chain outcomes. A high quarantine rate — particularly if trending upward — signals either increasing deviation severity, broader process instability, or overly conservative containment practices. Tracking this metric against a historical benchmark enables early identification of supply risk before it becomes a shortage or regulatory notification event.",
        keyDrivers: [
          "Deviation severity distribution and classification accuracy",
          "Containment decision criteria — clear thresholds for when to quarantine",
          "Process capability and in-process control effectiveness",
          "Product-specific risk profiles (mRNA stability, cold chain requirements)",
        ],
        connectedTo: [
          "Critical Deviation Rate",
          "Batch On-Hold Duration",
          "Time to Containment",
          "Recurrence Rate",
        ],
      },
    ],
  },
];

const rootDrivers = [
  "Equipment Reliability",
  "Operator Training & Competency",
  "Documentation Quality",
  "Human Factors & Workload",
  "Environmental Controls",
  "Supplier Quality",
];

function TargetBadge({ target, type }: { target: string; type: "good" | "watch" }) {
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
        type === "good"
          ? "bg-green-100 text-green-800"
          : "bg-amber-100 text-amber-800"
      }`}
    >
      <Target className="w-3 h-3" />
      {target}
    </span>
  );
}

function MetricCard({
  metric,
  pillar,
  isSelected,
  onSelect,
}: {
  metric: MetricDetail;
  pillar: Pillar;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <div
      onClick={onSelect}
      className={`cursor-pointer rounded-lg border p-3 transition-all duration-150 hover:shadow-md ${
        pillar.cardBg
      } ${pillar.cardBorder} ${
        isSelected ? "ring-2 ring-offset-1 ring-current shadow-md" : ""
      }`}
    >
      <p className="text-sm font-semibold text-gray-900 leading-snug mb-1.5">{metric.name}</p>
      <TargetBadge target={metric.target} type={metric.targetType} />
      <p className="text-xs text-gray-600 mt-1.5 leading-snug">{metric.description}</p>
      <p className={`text-xs font-medium mt-2 flex items-center gap-0.5 ${
        isSelected ? "text-gray-700" : "text-gray-400"
      }`}>
        <ChevronDown className="w-3 h-3" />
        {isSelected ? "Click to deselect" : "Click to explore"}
      </p>
    </div>
  );
}

function DetailPanel({
  metric,
  pillar,
  onClose,
}: {
  metric: MetricDetail;
  pillar: Pillar;
  onClose: () => void;
}) {
  return (
    <div className={`mt-6 rounded-xl border-2 ${pillar.cardBorder} ${pillar.cardBg} p-6 relative shadow-lg`}>
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition-colors"
        aria-label="Close detail panel"
      >
        <X className="w-5 h-5" />
      </button>
      <div className="flex flex-wrap items-start gap-3 mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900">{metric.name}</h3>
          <div className="mt-1">
            <TargetBadge target={metric.target} type={metric.targetType} />
          </div>
        </div>
      </div>
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">
            Why It Matters
          </h4>
          <p className="text-sm text-gray-700 leading-relaxed">{metric.whyItMatters}</p>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">
            Key Drivers
          </h4>
          <ul className="space-y-1.5">
            {metric.keyDrivers.map((driver, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-gray-400 flex-shrink-0" />
                {driver}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">
            Connected To
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {metric.connectedTo.map((name) => (
              <span
                key={name}
                className={`text-xs px-2.5 py-1 rounded-full font-medium ${pillar.badgeColor}`}
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ValueDriversPage() {
  const [selected, setSelected] = useState<SelectedMetric>(null);

  const handleSelect = (pillarId: string, metricId: string) => {
    if (selected?.pillarId === pillarId && selected?.metricId === metricId) {
      setSelected(null);
    } else {
      setSelected({ pillarId, metricId });
    }
  };

  const selectedPillar = selected
    ? pillars.find((p) => p.id === selected.pillarId)
    : null;
  const selectedMetric = selectedPillar
    ? selectedPillar.metrics.find((m) => m.id === selected!.metricId)
    : null;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Value Driver Tree</h1>
          <p className="text-sm text-gray-500 max-w-3xl">
            This tree maps the operational drivers of quality batch release performance. Use it to
            align teams on what moves the needle and why. Click any metric card to explore its
            regulatory context, key drivers, and connections to other metrics.
          </p>
        </div>

        {/* Tree container — horizontal scroll on small screens */}
        <div className="overflow-x-auto pb-4">
          <div className="min-w-[900px]">

            {/* ROOT NODE */}
            <div className="flex justify-center mb-0">
              <div className="bg-slate-800 text-white rounded-2xl px-10 py-5 text-center shadow-lg max-w-xl">
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-1">
                  Strategic Outcome
                </p>
                <h2 className="text-xl font-bold leading-tight">
                  Quality Batch Release Performance
                </h2>
                <p className="text-sm text-slate-300 mt-1.5 leading-snug">
                  The speed and accuracy with which compliant batches move from manufacture to
                  release
                </p>
              </div>
            </div>

            {/* Connector: root down to horizontal bar */}
            <div className="flex justify-center">
              <div className="w-px h-8 bg-gray-300" />
            </div>

            {/* Horizontal bar spanning pillars */}
            <div className="relative h-px mx-[12.5%]">
              <div className="absolute inset-0 bg-gray-300" />
            </div>

            {/* Vertical drops from horizontal bar to pillar nodes */}
            <div className="grid grid-cols-4 gap-3 mb-0">
              {pillars.map(() => (
                <div key={Math.random()} className="flex justify-center">
                  <div className="w-px h-8 bg-gray-300" />
                </div>
              ))}
            </div>

            {/* PILLAR NODES */}
            <div className="grid grid-cols-4 gap-3">
              {pillars.map((pillar) => (
                <div key={pillar.id} className="flex flex-col items-center">
                  {/* Pillar header card */}
                  <div
                    className={`w-full rounded-xl px-4 py-3 text-center shadow-md ${pillar.headerBg} ${pillar.color}`}
                  >
                    <p className="text-base font-bold leading-snug">{pillar.name}</p>
                    <p className="text-xs mt-0.5 opacity-80 leading-snug">{pillar.subtitle}</p>
                  </div>

                  {/* Connector pillar → metrics */}
                  <div className="w-px h-6 bg-gray-300" />

                  {/* Metrics column */}
                  <div className="w-full space-y-2.5">
                    {pillar.metrics.map((metric, idx) => {
                      const isSelected =
                        selected?.pillarId === pillar.id &&
                        selected?.metricId === metric.id;
                      return (
                        <div key={metric.id} className="relative">
                          {/* Connector line from pillar to first metric, between subsequent ones */}
                          {idx > 0 && (
                            <div className="flex justify-center -mt-2.5 mb-2.5">
                              <div className="w-px h-2.5 bg-gray-200" />
                            </div>
                          )}
                          <MetricCard
                            metric={metric}
                            pillar={pillar}
                            isSelected={isSelected}
                            onSelect={() => handleSelect(pillar.id, metric.id)}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Detail panel — shown below the tree when a metric is selected */}
        {selectedPillar && selectedMetric && (
          <DetailPanel
            metric={selectedMetric}
            pillar={selectedPillar}
            onClose={() => setSelected(null)}
          />
        )}

        {/* Root drivers footer */}
        <div className="mt-10 border-t border-gray-200 pt-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">
            Root drivers influencing all pillars
          </p>
          <div className="flex flex-wrap gap-2">
            {rootDrivers.map((driver) => (
              <span
                key={driver}
                className="text-sm text-gray-600 bg-white border border-gray-200 rounded-full px-3 py-1 shadow-sm"
              >
                {driver}
              </span>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-3">
            These foundational factors are upstream of all four pillars. Improvements to any root
            driver will propagate across multiple metrics simultaneously.
          </p>
        </div>
      </div>
    </div>
  );
}
