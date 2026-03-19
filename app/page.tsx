"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { AlertTriangle } from "lucide-react";
import KPICard from "@/components/KPICard";
import Badge from "@/components/Badge";
import { deviations, ProcessArea } from "@/lib/data/deviations";
import { capas } from "@/lib/data/capas";
import { rootCauseTrend, monthlyDeviations } from "@/lib/data/trends";
import { investigators, INVESTIGATOR_NAMES } from "@/lib/data/investigators";
import { formatDate, isOverdue, daysBetween } from "@/lib/utils";

const SEVERITY_COLORS: Record<string, string> = {
  Critical: "#ef4444",
  Major: "#f59e0b",
  Minor: "#6b7280",
};

const PIE_COLORS = ["#ef4444", "#f59e0b", "#6b7280"];

export default function DashboardPage() {
  const openDeviations = useMemo(
    () => deviations.filter(d => d.status !== "Closed"),
    []
  );

  const closedDeviations = useMemo(
    () => deviations.filter(d => d.status === "Closed"),
    []
  );

  const avgInvDays = useMemo(() => {
    const withBoth = closedDeviations.filter(
      d => d.investigation_start && d.investigation_complete
    );
    if (withBoth.length === 0) return 0;
    const total = withBoth.reduce(
      (sum, d) => sum + daysBetween(d.investigation_start!, d.investigation_complete),
      0
    );
    return Math.round((total / withBoth.length) * 10) / 10;
  }, [closedDeviations]);

  const overdueCAPAs = useMemo(
    () => capas.filter(c => isOverdue(c.due_date, c.effectiveness_check_status)).length,
    []
  );

  const capaEffectivenessRate = useMemo(() => {
    const completed = capas.filter(c => c.effectiveness_check_status === "Completed").length;
    return Math.round((completed / capas.length) * 100);
  }, []);

  const severityBreakdown = useMemo(() => {
    const counts = { Critical: 0, Major: 0, Minor: 0 };
    for (const d of deviations) {
      counts[d.severity] = (counts[d.severity] || 0) + 1;
    }
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, []);

  const investigatorWorkload = useMemo(() => {
    return investigators.map(inv => ({
      id: inv.investigator_id,
      name: INVESTIGATOR_NAMES[inv.investigator_id] ?? inv.investigator_id,
      role: inv.role,
      open: deviations.filter(
        d => d.investigator_id === inv.investigator_id && d.status !== "Closed"
      ).length,
    }));
  }, []);

  const recentDeviations = useMemo(
    () =>
      [...deviations]
        .sort((a, b) => new Date(b.opened_date).getTime() - new Date(a.opened_date).getTime())
        .slice(0, 5),
    []
  );

  const deviationAging = useMemo(() => {
    const result = [
      { bucket: "0–5 days", count: 0, color: "bg-blue-400", textColor: "text-blue-700" },
      { bucket: "6–10 days", count: 0, color: "bg-amber-400", textColor: "text-amber-700" },
      { bucket: "11–30 days", count: 0, color: "bg-orange-400", textColor: "text-orange-700" },
      { bucket: "31+ days", count: 0, color: "bg-red-500", textColor: "text-red-700" },
    ];
    openDeviations.forEach(d => {
      const age = daysBetween(d.opened_date, null);
      if (age <= 5) result[0].count++;
      else if (age <= 10) result[1].count++;
      else if (age <= 30) result[2].count++;
      else result[3].count++;
    });
    return result;
  }, [openDeviations]);

  const capaAging = useMemo(() => {
    const openCAPAs = capas.filter(c => c.effectiveness_check_status !== "Completed");
    const result = [
      { bucket: "0–30 days", count: 0, color: "bg-blue-400", textColor: "text-blue-700" },
      { bucket: "31–60 days", count: 0, color: "bg-amber-400", textColor: "text-amber-700" },
      { bucket: "61–90 days", count: 0, color: "bg-orange-400", textColor: "text-orange-700" },
      { bucket: "91+ days", count: 0, color: "bg-red-500", textColor: "text-red-700" },
    ];
    openCAPAs.forEach(c => {
      const age = daysBetween(c.created_date, null);
      if (age <= 30) result[0].count++;
      else if (age <= 60) result[1].count++;
      else if (age <= 90) result[2].count++;
      else result[3].count++;
    });
    return { buckets: result, total: openCAPAs.length };
  }, []);

  const recurringByArea = useMemo(() => {
    const areas: ProcessArea[] = ["Manufacturing", "QC Lab", "Packaging", "Utilities"];
    return areas.map(area => {
      const areaDevs = deviations.filter(d => d.process_area === area);
      const recurring = areaDevs.filter(d => d.recurrence_flag === 1).length;
      const pct = areaDevs.length > 0 ? Math.round((recurring / areaDevs.length) * 100) : 0;
      return { area, total: areaDevs.length, recurring, pct };
    });
  }, []);

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quality Operations Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">{today}</p>
        </div>
        <span className="text-xs bg-blue-100 text-blue-700 border border-blue-200 px-2 py-1 rounded font-medium">
          AI Monitoring Active
        </span>
      </div>

      {/* Systemic Risk Alert */}
      <div className="flex items-start gap-3 bg-amber-50 border border-amber-300 rounded-lg px-4 py-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-amber-800">AI Trend Alert</p>
          <p className="text-sm text-amber-700">
            Documentation Errors account for 27% of all deviations across 3 process areas. Systemic
            intervention recommended. Review root cause Pareto below.
          </p>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-4 gap-4">
        <KPICard
          label="Open Deviations"
          value={openDeviations.length}
          subtext={`${openDeviations.filter(d => d.severity === "Critical").length} critical requiring immediate action`}
          color={openDeviations.filter(d => d.severity === "Critical").length > 0 ? "red" : "default"}
        />
        <KPICard
          label="Avg Investigation Days"
          value={avgInvDays}
          subtext="Across closed deviations"
          color={avgInvDays > 15 ? "amber" : "green"}
        />
        <KPICard
          label="Overdue CAPAs"
          value={overdueCAPAs}
          subtext="Past due date, not yet completed"
          color={overdueCAPAs > 3 ? "red" : overdueCAPAs > 0 ? "amber" : "green"}
        />
        <KPICard
          label="CAPA Effectiveness Rate"
          value={`${capaEffectivenessRate}%`}
          subtext="Of verified CAPAs rated effective"
          color={capaEffectivenessRate >= 80 ? "green" : capaEffectivenessRate >= 60 ? "amber" : "red"}
        />
      </div>

      {/* Chart Grid */}
      <div className="grid grid-cols-2 gap-6">
        {/* Root Cause Pareto */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h2 className="text-sm font-semibold text-gray-800 mb-3">Root Cause Pareto Analysis</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={rootCauseTrend}
              layout="vertical"
              margin={{ left: 8, right: 24, top: 4, bottom: 4 }}
            >
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis
                type="category"
                dataKey="cause"
                width={160}
                tick={{ fontSize: 11 }}
              />
              <Tooltip
                formatter={(v) => [`${v} deviations`, "Count"]}
                contentStyle={{ fontSize: 12 }}
              />
              <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Deviations Over Time */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h2 className="text-sm font-semibold text-gray-800 mb-3">Deviation Volume Over Time</h2>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart
              data={monthlyDeviations}
              margin={{ left: 0, right: 16, top: 4, bottom: 4 }}
            >
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Area
                type="monotone"
                dataKey="critical"
                stackId="1"
                stroke="#ef4444"
                fill="#fecaca"
                name="Critical"
              />
              <Area
                type="monotone"
                dataKey="major"
                stackId="1"
                stroke="#f59e0b"
                fill="#fde68a"
                name="Major"
              />
              <Area
                type="monotone"
                dataKey="minor"
                stackId="1"
                stroke="#6b7280"
                fill="#e5e7eb"
                name="Minor"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Severity Breakdown */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h2 className="text-sm font-semibold text-gray-800 mb-3">Severity Distribution</h2>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={severityBreakdown}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}
                labelLine={true}
              >
                {severityBreakdown.map((entry, index) => (
                  <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Investigator Workload */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h2 className="text-sm font-semibold text-gray-800 mb-3">Open Deviations by Investigator</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={investigatorWorkload}
              layout="vertical"
              margin={{ left: 8, right: 24, top: 4, bottom: 4 }}
            >
              <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
              <YAxis
                type="category"
                dataKey="name"
                width={60}
                tick={{ fontSize: 11 }}
              />
              <Tooltip
                formatter={(v) => [`${v} open`, "Deviations"]}
                contentStyle={{ fontSize: 12 }}
              />
              <Bar dataKey="open" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Aging Log */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h2 className="text-sm font-semibold text-gray-800 mb-0.5">Open Deviation Aging</h2>
          <p className="text-xs text-gray-400 mb-4">SOP target: close within <span className="font-medium text-gray-600">30 days</span></p>
          <div className="space-y-3">
            {deviationAging.map(({ bucket, count, color, textColor }) => (
              <div key={bucket} className="flex items-center gap-3">
                <span className="text-xs text-gray-500 w-20 shrink-0">{bucket}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${color} transition-all`}
                    style={{ width: openDeviations.length > 0 ? `${(count / openDeviations.length) * 100}%` : "0%" }}
                  />
                </div>
                <span className={`text-xs font-bold w-5 text-right ${textColor}`}>{count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h2 className="text-sm font-semibold text-gray-800 mb-0.5">Open CAPA Aging</h2>
          <p className="text-xs text-gray-400 mb-4">SOP target: close within <span className="font-medium text-gray-600">90 days</span></p>
          <div className="space-y-3">
            {capaAging.buckets.map(({ bucket, count, color, textColor }) => (
              <div key={bucket} className="flex items-center gap-3">
                <span className="text-xs text-gray-500 w-20 shrink-0">{bucket}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${color} transition-all`}
                    style={{ width: capaAging.total > 0 ? `${(count / capaAging.total) * 100}%` : "0%" }}
                  />
                </div>
                <span className={`text-xs font-bold w-5 text-right ${textColor}`}>{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recurring Deviations by Process Area */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h2 className="text-sm font-semibold text-gray-800 mb-0.5">Recurring Deviations by Process Area</h2>
        <p className="text-xs text-gray-400 mb-4">% of deviations flagged as recurrent (same root cause repeated) within each process area</p>
        <div className="grid grid-cols-4 gap-4">
          {recurringByArea.map(({ area, total, recurring, pct }) => (
            <div
              key={area}
              className={`rounded-lg p-4 border text-center ${
                pct >= 35 ? "bg-red-50 border-red-200" :
                pct >= 20 ? "bg-amber-50 border-amber-200" :
                "bg-gray-50 border-gray-200"
              }`}
            >
              <p className={`text-3xl font-bold mb-0.5 ${pct >= 35 ? "text-red-600" : pct >= 20 ? "text-amber-600" : "text-green-700"}`}>
                {pct}%
              </p>
              <p className="text-xs font-semibold text-gray-700 mb-1">{area}</p>
              <p className="text-xs text-gray-400">{recurring} of {total} deviations</p>
              <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full ${pct >= 35 ? "bg-red-400" : pct >= 20 ? "bg-amber-400" : "bg-green-400"}`}
                  style={{ width: `${Math.min(pct, 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Deviations */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-800">Recent Deviations</h2>
          <Link href="/deviations" className="text-xs text-blue-600 hover:underline">
            View all →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs text-gray-500 uppercase tracking-wide">
                <th className="px-4 py-2 font-medium">Deviation ID</th>
                <th className="px-4 py-2 font-medium">Process Area</th>
                <th className="px-4 py-2 font-medium">Severity</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Investigator</th>
                <th className="px-4 py-2 font-medium">Opened</th>
              </tr>
            </thead>
            <tbody>
              {recentDeviations.map(d => (
                <tr key={d.deviation_id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-2.5">
                    <Link
                      href={`/deviations/${d.deviation_id}`}
                      className="text-blue-600 hover:underline font-medium"
                    >
                      {d.deviation_id}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 text-gray-700">{d.process_area}</td>
                  <td className="px-4 py-2.5">
                    <Badge value={d.severity} />
                  </td>
                  <td className="px-4 py-2.5">
                    <Badge value={d.status} />
                  </td>
                  <td className="px-4 py-2.5 text-gray-600">{INVESTIGATOR_NAMES[d.investigator_id] ?? d.investigator_id}</td>
                  <td className="px-4 py-2.5 text-gray-500">{formatDate(d.opened_date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
