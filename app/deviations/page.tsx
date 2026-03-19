"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import Badge from "@/components/Badge";
import { deviations, ProcessArea, Severity, DeviationStatus, InvestigatorId } from "@/lib/data/deviations";
import { INVESTIGATOR_NAMES } from "@/lib/data/investigators";
import { formatDate, daysBetween } from "@/lib/utils";

const PLURAL_LABELS: Record<string, string> = {
  Severity: "All Severities",
  Status: "All Statuses",
};
function allLabel(label: string) {
  return PLURAL_LABELS[label] ?? `All ${label}s`;
}

const ALL = "All";

export default function DeviationExplorerPage() {
  const [search, setSearch] = useState("");
  const [filterSeverity, setFilterSeverity] = useState<string>(ALL);
  const [filterArea, setFilterArea] = useState<string>(ALL);
  const [filterStatus, setFilterStatus] = useState<string>(ALL);
  const [filterInvestigator, setFilterInvestigator] = useState<string>(ALL);

  const severities: (Severity | "All")[] = [ALL, "Critical", "Major", "Minor"];
  const areas: (ProcessArea | "All")[] = [ALL, "Manufacturing", "QC Lab", "Packaging", "Utilities"];
  const statuses: (DeviationStatus | "All")[] = [ALL, "Open", "In Investigation", "CAPA In Progress", "QA Review", "Closed"];
  const investigatorIds: (InvestigatorId | "All")[] = [ALL, "INV-01", "INV-02", "INV-03", "INV-04", "INV-05", "INV-06"];

  const filtered = useMemo(() => {
    return deviations.filter(d => {
      if (search && !d.deviation_id.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterSeverity !== ALL && d.severity !== filterSeverity) return false;
      if (filterArea !== ALL && d.process_area !== filterArea) return false;
      if (filterStatus !== ALL && d.status !== filterStatus) return false;
      if (filterInvestigator !== ALL && d.investigator_id !== filterInvestigator) return false;
      return true;
    });
  }, [search, filterSeverity, filterArea, filterStatus, filterInvestigator]);

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Deviation Explorer</h1>
          <p className="text-sm text-gray-500 mt-0.5">Browse, filter, and open deviation investigations</p>
        </div>
        <span className="text-sm text-gray-500 mt-1">{filtered.length} of {deviations.length} records</span>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="grid grid-cols-5 gap-3">
          <div className="relative col-span-1">
            <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search ID..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          {[
            { label: "Severity", value: filterSeverity, setter: setFilterSeverity, options: severities },
            { label: "Process Area", value: filterArea, setter: setFilterArea, options: areas },
            { label: "Status", value: filterStatus, setter: setFilterStatus, options: statuses },
            { label: "Investigator", value: filterInvestigator, setter: setFilterInvestigator, options: investigatorIds },
          ].map(({ label, value, setter, options }) => (
            <select
              key={label}
              value={value}
              onChange={e => setter(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
            >
              {options.map(o => (
                <option key={o} value={o}>{o === ALL ? allLabel(label) : (INVESTIGATOR_NAMES[o] ?? o)}</option>
              ))}
            </select>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs text-gray-500 uppercase tracking-wide border-b border-gray-200">
                <th className="px-4 py-3 font-medium">Deviation ID</th>
                <th className="px-4 py-3 font-medium">Product</th>
                <th className="px-4 py-3 font-medium">Process Area</th>
                <th className="px-4 py-3 font-medium">Severity</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Investigator</th>
                <th className="px-4 py-3 font-medium">Opened</th>
                <th className="px-4 py-3 font-medium">Days Open</th>
                <th className="px-4 py-3 font-medium">CAPA Req.</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-gray-400 text-sm">
                    No deviations match the current filters.
                  </td>
                </tr>
              )}
              {filtered.map(d => (
                <tr
                  key={d.deviation_id}
                  className="border-t border-gray-100 hover:bg-blue-50 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-2.5">
                    <Link
                      href={`/deviations/${d.deviation_id}`}
                      className="text-blue-600 hover:underline font-medium"
                    >
                      {d.deviation_id}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 text-gray-700">{d.product_id}</td>
                  <td className="px-4 py-2.5 text-gray-700">{d.process_area}</td>
                  <td className="px-4 py-2.5">
                    <Badge value={d.severity} />
                  </td>
                  <td className="px-4 py-2.5">
                    <Badge value={d.status} />
                  </td>
                  <td className="px-4 py-2.5 text-gray-600">{INVESTIGATOR_NAMES[d.investigator_id] ?? d.investigator_id}</td>
                  <td className="px-4 py-2.5 text-gray-500">{formatDate(d.opened_date)}</td>
                  <td className="px-4 py-2.5 text-gray-700">
                    {daysBetween(d.opened_date, d.closure_date)}
                  </td>
                  <td className="px-4 py-2.5">
                    {d.capa_required ? (
                      <span className="text-xs font-medium text-amber-700">Yes</span>
                    ) : (
                      <span className="text-xs text-gray-400">No</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
