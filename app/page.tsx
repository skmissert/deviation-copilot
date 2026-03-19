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
import { deviations } from "@/lib/data/deviations";
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
