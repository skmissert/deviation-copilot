"use client";

import { useState, useMemo } from "react";
import { AlertTriangle, Clock, CheckCircle, TrendingUp } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import Badge from "@/components/Badge";
import KPICard from "@/components/KPICard";
import { capas, CAPAOwner, CAPAType, EffectivenessStatus } from "@/lib/data/capas";
import { DEVIATIONS_BY_ID } from "@/lib/data/deviations";
import { formatDate, daysBetween, isOverdue } from "@/lib/utils";

const ALL = "All";
const TODAY = new Date().toISOString().split("T")[0];

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

const TYPE_COLORS: Record<string, string> = {
  Corrective: "#2563eb",
  Preventive: "#16a34a",
  "Corrective + Preventive": "#7c3aed",
};

export default function CAPATrackerPage() {
  const [filterOwner, setFilterOwner] = useState<string>(ALL);
  const [filterType, setFilterType] = useState<string>(ALL);
  const [filterStatus, setFilterStatus] = useState<string>(ALL);
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
  const completedCAPAs = useMemo(() => capas.filter(c => c.completion_date), []);
  const avgDaysToClose = useMemo(() => {
    if (!completedCAPAs.length) return 0;
    const total = completedCAPAs.reduce((sum, c) => sum + daysBetween(c.created_date, c.completion_date), 0);
    return Math.round(total / completedCAPAs.length);
  }, [completedCAPAs]);
  const effectivenessRate = useMemo(() => {
    const completed = capas.filter(c => c.effectiveness_check_status === "Completed").length;
    return Math.round((completed / capas.length) * 100);
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
    return Object.entries(counts).filter(([, v]) => v > 0).map(([name, value]) => ({ name, value }));
  }, []);

  const ownerData = useMemo(() => {
    const counts: Record<string, number> = {};
    capas.forEach(c => { counts[c.owner] = (counts[c.owner] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, []);

  const typeData = useMemo(() => {
    const counts: Record<string, number> = {};
    capas.forEach(c => { counts[c.action_type] = (counts[c.action_type] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, []);

  // Filtered table
  const filtered = useMemo(() => {
    return capas.filter(c => {
      if (filterOwner !== ALL && c.owner !== filterOwner) return false;
      if (filterType !== ALL && c.action_type !== filterType) return false;
      if (filterStatus !== ALL && c.effectiveness_check_status !== filterStatus) return false;
      return true;
    });
  }, [filterOwner, filterType, filterStatus]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">CAPA Tracker</h1>
        <p className="text-sm text-gray-500 mt-0.5">Monitor corrective and preventive action progress and effectiveness</p>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-5 gap-4">
        <KPICard label="Total Open CAPAs" value={totalOpen} color="blue" />
        <KPICard label="Overdue CAPAs" value={overdue} color={overdue > 0 ? "red" : "green"} subtext={overdue > 0 ? "Require immediate attention" : "None overdue"} />
        <KPICard label="Due This Week" value={dueThisWeek} color={dueThisWeek > 2 ? "amber" : "default"} />
        <KPICard label="Avg Days to Close" value={`${avgDaysToClose}d`} subtext="From creation to completion" />
        <KPICard label="Effectiveness Rate" value={`${effectivenessRate}%`} color={effectivenessRate >= 75 ? "green" : "amber"} subtext="CAPAs with completed verification" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { title: "By Status", data: statusData, colorMap: STATUS_COLORS },
          { title: "By Owner", data: ownerData, colorMap: OWNER_COLORS },
          { title: "By Action Type", data: typeData, colorMap: TYPE_COLORS },
        ].map(({ title, data, colorMap }) => (
          <div key={title} className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-800 mb-2">{title}</h3>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={data} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value" paddingAngle={2}>
                  {data.map((entry) => (
                    <Cell key={entry.name} fill={colorMap[entry.name] || "#9ca3af"} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => [`${v} CAPAs`, ""]} contentStyle={{ fontSize: 11 }} />
                <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ))}
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
          <div className="flex items-center text-sm text-gray-500">
            {filtered.length} of {capas.length} records
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
                      <td className="px-4 py-2.5">
                        <Badge value={c.effectiveness_check_status} />
                      </td>
                    </tr>
                    {expandedId === c.capa_id && (
                      <tr key={`${c.capa_id}-expanded`} className="border-t border-gray-100 bg-blue-50">
                        <td colSpan={9} className="px-6 py-3">
                          <div className="text-sm space-y-1.5">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Action Description</p>
                            <p className="text-gray-800">{c.description}</p>
                            {dev && (
                              <p className="text-xs text-gray-500 mt-1">
                                Linked to <span className="font-medium">{dev.deviation_id}</span> · {dev.process_area} · {dev.product_id} · Root cause: <span className="font-medium">{dev.root_cause_category}</span>
                              </p>
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
