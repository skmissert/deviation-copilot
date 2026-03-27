"use client";

import { useState, useMemo } from "react";
import { AlertTriangle, CheckCircle, Sparkles } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Cell, Tooltip, ResponsiveContainer, LabelList } from "recharts";

// ─── Single stacked bar component ────────────────────────────────────────────
function StackedBar({ segments }: {
  segments: { label: string; value: number; color: string }[];
}) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  if (total === 0) return null;
  return (
    <div className="space-y-4">
      {/* Bar */}
      <div className="flex h-12 rounded-lg overflow-hidden w-full">
        {segments.filter(s => s.value > 0).map((seg, i, arr) => (
          <div
            key={seg.label}
            style={{ width: `${(seg.value / total) * 100}%`, backgroundColor: seg.color }}
            className={`flex items-center justify-center ${i === 0 ? "rounded-l-lg" : ""} ${i === arr.length - 1 ? "rounded-r-lg" : ""}`}
          >
            {(seg.value / total) >= 0.12 && (
              <span className="text-white text-sm font-bold drop-shadow-sm">{seg.value}</span>
            )}
          </div>
        ))}
      </div>
      {/* Legend rows */}
      <div className="space-y-2">
        {segments.map(seg => (
          <div key={seg.label} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: seg.color }} />
              <span className="text-sm text-gray-700">{seg.label}</span>
            </div>
            <span className="text-sm font-semibold text-gray-900 tabular-nums">
              {seg.value}{" "}
              <span className="text-xs font-normal text-gray-400">
                ({Math.round((seg.value / total) * 100)}%)
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
import Badge from "@/components/Badge";
import KPICard from "@/components/KPICard";
import { capas, CAPAOwner, CAPAType, EffectivenessStatus } from "@/lib/data/capas";
import { deviations, DEVIATIONS_BY_ID } from "@/lib/data/deviations";
import { formatDate, daysBetween, isOverdue } from "@/lib/utils";

const ALL = "All";

function daysUntilDue(dueDateStr: string): number {
  return Math.ceil((new Date(dueDateStr).getTime() - Date.now()) / 86400000);
}

const STATUS_COLORS: Record<string, string> = {
  Completed: "#16a34a",
  "In Progress": "#2563eb",
  Pending: "#9ca3af",
  Overdue: "#dc2626",
};

const OWNER_COLORS: Record<string, string> = {
  Engineering: "#7c3aed",
  "Manufacturing Lead": "#d97706",
  "QA Manager": "#dc2626",
  "Quality Systems": "#0891b2",
};

const STAGE_COLORS: Record<string, string> = {
  "Identification": "#6366f1",
  "Evaluation": "#f59e0b",
  "Investigation / RCA": "#ef4444",
  "Action Planning": "#3b82f6",
  "Implementation": "#8b5cf6",
};

export default function CAPATrackerPage() {
  const [filterOwner, setFilterOwner] = useState<string>(ALL);
  const [filterType, setFilterType] = useState<string>(ALL);
  const [filterStatus, setFilterStatus] = useState<string>(ALL);
  const [filterAI, setFilterAI] = useState<boolean>(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const owners: (CAPAOwner | "All")[] = [ALL, "Engineering", "Manufacturing Lead", "QA Manager", "Quality Systems"];
  const types: (CAPAType | "All")[] = [ALL, "Corrective", "Preventive", "Corrective + Preventive"];
  const statuses: (EffectivenessStatus | "All")[] = [ALL, "Completed", "In Progress", "Pending"];

  // KPI calculations
  const totalOpen = useMemo(() => capas.filter(c => c.effectiveness_check_status !== "Completed").length, []);
  const overdue = useMemo(() => capas.filter(c => isOverdue(c.due_date, c.effectiveness_check_status)).length, []);
  const dueThisWeek = useMemo(() => capas.filter(c => {
    const days = daysUntilDue(c.due_date);
    return c.effectiveness_check_status !== "Completed" && days >= 0 && days <= 7;
  }).length, []);
  const avgDaysToClose = 88;
  const effectivenessRate = useMemo(() => {
    const completed = capas.filter(c => c.effectiveness_check_status === "Completed").length;
    return Math.round((completed / capas.length) * 100);
  }, []);
  const aiAssistedCount = useMemo(() => capas.filter(c => c.ai_recommended).length, []);
  const repeatCAPARate = useMemo(() => {
    const linked = capas.filter(c => {
      const dev = DEVIATIONS_BY_ID[c.deviation_id];
      return dev && dev.recurrence_flag === 1;
    }).length;
    return Math.round((linked / capas.length) * 100);
  }, []);
  const repeatDeviationRate = useMemo(() => {
    return Math.round((deviations.filter(d => d.recurrence_flag === 1).length / deviations.length) * 100);
  }, []);

  // Chart data
  const statusData = useMemo(() => {
    const counts: Record<string, number> = { Completed: 0, "In Progress": 0, Pending: 0, Overdue: 0 };
    capas.forEach(c => {
      if (c.effectiveness_check_status === "Completed") {
        counts["Completed"]++;
      } else if (isOverdue(c.due_date, c.effectiveness_check_status)) {
        counts["Overdue"]++;
      } else if (c.effectiveness_check_status === "In Progress") {
        counts["In Progress"]++;
      } else {
        counts["Pending"]++;
      }
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, []);

  const ownerData = useMemo(() => {
    const counts: Record<string, number> = {};
    capas.forEach(c => { counts[c.owner] = (counts[c.owner] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, []);

  const capaTypeSplitData = useMemo(() => {
    let corrective = 0;
    let preventive = 0;
    capas.forEach(c => {
      if (c.action_type === "Corrective" || c.action_type === "Corrective + Preventive") corrective++;
      if (c.action_type === "Preventive" || c.action_type === "Corrective + Preventive") preventive++;
    });
    return [
      { name: "Corrective", value: corrective, fill: "#3b82f6" },
      { name: "Preventive", value: preventive, fill: "#22c55e" },
    ];
  }, []);

  const agingData = useMemo(() => {
    const today = new Date("2026-03-26");
    const buckets = [
      { bucket: "0–10d", ...Object.fromEntries(Object.keys(STAGE_COLORS).map(s => [s, 0])) },
      { bucket: "10–20d", ...Object.fromEntries(Object.keys(STAGE_COLORS).map(s => [s, 0])) },
      { bucket: "20–30d", ...Object.fromEntries(Object.keys(STAGE_COLORS).map(s => [s, 0])) },
      { bucket: "30–90d", ...Object.fromEntries(Object.keys(STAGE_COLORS).map(s => [s, 0])) },
      { bucket: "90+d", ...Object.fromEntries(Object.keys(STAGE_COLORS).map(s => [s, 0])) },
    ];
    capas.filter(c => c.effectiveness_check_status !== "Completed").forEach(c => {
      const age = Math.round((today.getTime() - new Date(c.created_date).getTime()) / 86400000);
      const stage = c.stage ?? "Action Planning";
      const bi = age < 10 ? 0 : age < 20 ? 1 : age < 30 ? 2 : age < 90 ? 3 : 4;
      (buckets[bi] as any)[stage] = ((buckets[bi] as any)[stage] ?? 0) + 1;
    });
    return buckets;
  }, []);

  // Filtered table
  const filtered = useMemo(() => {
    return capas.filter(c => {
      if (filterOwner !== ALL && c.owner !== filterOwner) return false;
      if (filterType !== ALL && c.action_type !== filterType) return false;
      if (filterStatus !== ALL && c.effectiveness_check_status !== filterStatus) return false;
      if (filterAI && !c.ai_recommended) return false;
      return true;
    });
  }, [filterOwner, filterType, filterStatus, filterAI]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">CAPA Tracker</h1>
        <p className="text-sm text-gray-500 mt-0.5">Monitor corrective and preventive action progress and effectiveness</p>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-7 gap-3">
        <KPICard label="Total Open CAPAs" value={totalOpen} color="blue" />
        <KPICard label="Overdue CAPAs" value={overdue} color={overdue > 0 ? "red" : "green"} subtext={overdue > 0 ? "Require immediate attention" : "None overdue"} />
        <KPICard label="Due This Week" value={dueThisWeek} color={dueThisWeek > 2 ? "amber" : "default"} />
        <KPICard label="Avg Days to Close" value={`${avgDaysToClose}d`} subtext="From creation to completion" />
        <KPICard label="AI-Assisted CAPAs" value={`${aiAssistedCount} / ${capas.length}`} color="blue" subtext="Created using AI recommendations" />
        <KPICard
          label="Repeat CAPA Rate"
          value={`${repeatCAPARate}%`}
          color={repeatCAPARate > 20 ? "red" : "default"}
          subtext="linked to recurring dev"
        />
        <KPICard
          label="Repeat Deviation Rate"
          value={`${repeatDeviationRate}%`}
          color={repeatDeviationRate >= 15 ? "red" : repeatDeviationRate >= 10 ? "amber" : "green"}
          subtext="primary effectiveness measure"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-4 gap-4">
        {/* By Status */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-800 mb-4">By Status</h3>
          <StackedBar segments={statusData.map(d => ({ label: d.name, value: d.value, color: STATUS_COLORS[d.name] || "#9ca3af" }))} />
        </div>

        {/* By Owner — horizontal bars so names aren't cut off */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">By Owner</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={ownerData} layout="vertical" margin={{ top: 4, bottom: 4, left: 0, right: 36 }} barCategoryGap="30%">
              <XAxis type="number" tick={{ fontSize: 12 }} allowDecimals={false} />
              <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v) => [`${v} CAPAs`, ""]} contentStyle={{ fontSize: 12 }} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                <LabelList dataKey="value" position="right" style={{ fontSize: 13, fontWeight: 600, fill: "#374151" }} />
                {ownerData.map(entry => (
                  <Cell key={entry.name} fill={OWNER_COLORS[entry.name] || "#9ca3af"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Aging */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-800 mb-0.5">Open CAPA Aging</h3>
          <p className="text-xs text-gray-400 mb-3">Target: all closed within 90 days</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={agingData} margin={{ top: 4, bottom: 4, left: 0, right: 8 }} barCategoryGap="25%">
              <XAxis dataKey="bucket" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} allowDecimals={false} width={28} />
              <Tooltip contentStyle={{ fontSize: 12 }} />
              {Object.entries(STAGE_COLORS).map(([stage, color], i, arr) => (
                <Bar key={stage} dataKey={stage} stackId="a" fill={color}
                  radius={i === arr.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-2 mt-2">
            {Object.entries(STAGE_COLORS).map(([s, c]) => (
              <span key={s} className="flex items-center gap-1 text-xs text-gray-600">
                <span className="w-2.5 h-2.5 rounded-sm inline-block shrink-0" style={{ backgroundColor: c }} />
                {s}
              </span>
            ))}
          </div>
        </div>

        {/* CAPA Type Split */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-800 mb-4">CAPA Type Split</h3>
          <StackedBar segments={capaTypeSplitData.map(d => ({ label: d.name, value: d.value, color: d.fill }))} />
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Owner", value: filterOwner, setter: setFilterOwner, options: owners },
            { label: "Action Type", value: filterType, setter: setFilterType, options: types },
            { label: "Status", value: filterStatus, setter: setFilterStatus, options: statuses },
          ].map(({ label, value, setter, options }) => (
            <select
              key={label}
              value={value}
              onChange={e => setter(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
            >
              {options.map(o => (
                <option key={o} value={o}>{o === ALL ? `All ${label === "Status" ? "Statuses" : label + "s"}` : o}</option>
              ))}
            </select>
          ))}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setFilterAI(!filterAI)}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm rounded-md border transition-colors ${
                filterAI
                  ? "bg-blue-50 border-blue-300 text-blue-700 font-medium"
                  : "border-gray-300 text-gray-600 hover:bg-gray-50"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              AI-Assisted
            </button>
            <span className="text-sm text-gray-500">{filtered.length} of {capas.length}</span>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs text-gray-500 uppercase tracking-wide border-b border-gray-200">
                <th className="px-4 py-3 font-medium">CAPA ID</th>
                <th className="px-4 py-3 font-medium">Deviation</th>
                <th className="px-4 py-3 font-medium">Severity</th>
                <th className="px-4 py-3 font-medium">Action Type</th>
                <th className="px-4 py-3 font-medium">Owner</th>
                <th className="px-4 py-3 font-medium">Created</th>
                <th className="px-4 py-3 font-medium">Due Date</th>
                <th className="px-4 py-3 font-medium">Days Left</th>
                <th className="px-4 py-3 font-medium">AI</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => {
                const overdueCapa = isOverdue(c.due_date, c.effectiveness_check_status);
                const daysLeft = daysUntilDue(c.due_date);
                const dueSOon = !overdueCapa && daysLeft <= 7 && c.effectiveness_check_status !== "Completed";
                const dev = DEVIATIONS_BY_ID[c.deviation_id];

                return (
                  <>
                    <tr
                      key={c.capa_id}
                      onClick={() => setExpandedId(expandedId === c.capa_id ? null : c.capa_id)}
                      className={`border-t border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${
                        overdueCapa ? "border-l-4 border-l-red-400" : dueSOon ? "border-l-4 border-l-amber-400" : ""
                      }`}
                    >
                      <td className="px-4 py-2.5 font-medium text-blue-600">{c.capa_id}</td>
                      <td className="px-4 py-2.5 text-gray-600">{c.deviation_id}</td>
                      <td className="px-4 py-2.5">
                        {dev ? <Badge value={dev.severity} /> : <span className="text-gray-400 text-xs">—</span>}
                      </td>
                      <td className="px-4 py-2.5 text-gray-700 text-xs">{c.action_type}</td>
                      <td className="px-4 py-2.5">
                        <span className="text-xs font-medium text-gray-700 bg-gray-100 px-2 py-0.5 rounded">{c.owner}</span>
                      </td>
                      <td className="px-4 py-2.5 text-gray-500 text-xs">{formatDate(c.created_date)}</td>
                      <td className="px-4 py-2.5 text-xs">
                        <span className={overdueCapa ? "text-red-600 font-medium" : dueSOon ? "text-amber-600 font-medium" : "text-gray-500"}>
                          {formatDate(c.due_date)}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-xs">
                        {c.effectiveness_check_status === "Completed" ? (
                          <span className="text-green-600 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Done</span>
                        ) : overdueCapa ? (
                          <span className="text-red-600 font-medium flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> {Math.abs(daysLeft)}d overdue</span>
                        ) : (
                          <span className={dueSOon ? "text-amber-600" : "text-gray-500"}>{daysLeft}d</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        {c.ai_recommended ? (
                          <span title="Created using AI recommendation">
                            <Sparkles className="w-3.5 h-3.5 text-blue-500 inline" />
                          </span>
                        ) : (
                          <span className="text-gray-300 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5">
                        <Badge value={c.effectiveness_check_status} />
                      </td>
                    </tr>
                    {expandedId === c.capa_id && (
                      <tr key={`${c.capa_id}-expanded`} className="border-t border-gray-100 bg-blue-50">
                        <td colSpan={10} className="px-6 py-3">
                          <div className="text-sm space-y-2">
                            <div>
                              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Action Description</p>
                              <p className="text-gray-800">{c.description}</p>
                            </div>
                            {dev && (
                              <p className="text-xs text-gray-500">
                                Linked to <span className="font-medium">{dev.deviation_id}</span> · {dev.process_area} · {dev.product_id} · Root cause: <span className="font-medium">{dev.root_cause_category}</span>
                              </p>
                            )}
                            {c.ai_recommended && c.ai_suggestion && (
                              <div className="bg-blue-100 border border-blue-200 rounded-md px-3 py-2 mt-1">
                                <p className="text-xs font-semibold text-blue-700 flex items-center gap-1 mb-1">
                                  <Sparkles className="w-3 h-3" /> AI Recommendation
                                </p>
                                <p className="text-xs text-blue-900 leading-relaxed">{c.ai_suggestion}</p>
                                {c.ai_effectiveness_note && (
                                  <p className="text-xs text-blue-600 mt-1 italic">{c.ai_effectiveness_note}</p>
                                )}
                              </div>
                            )}
                            {c.completion_date && (
                              <p className="text-xs text-green-700">
                                <CheckCircle className="w-3 h-3 inline mr-1" />
                                Completed {formatDate(c.completion_date)} · {daysBetween(c.created_date, c.completion_date)} days after creation
                              </p>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
