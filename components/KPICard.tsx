import { cn } from "@/lib/utils";

interface KPICardProps {
  label: string;
  value: string | number;
  subtext?: string;
  trend?: "up" | "down" | "neutral";
  trendLabel?: string;
  color?: "default" | "red" | "amber" | "green" | "blue";
}

export default function KPICard({ label, value, subtext, color = "default" }: KPICardProps) {
  const colorMap = {
    default: "border-gray-200",
    red: "border-red-300 bg-red-50",
    amber: "border-amber-300 bg-amber-50",
    green: "border-green-300 bg-green-50",
    blue: "border-blue-300 bg-blue-50",
  };
  return (
    <div className={cn("rounded-lg border p-4 bg-white", colorMap[color])}>
      <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
      <p
        className={cn(
          "text-3xl font-bold mt-1",
          color === "red"
            ? "text-red-700"
            : color === "amber"
            ? "text-amber-700"
            : color === "green"
            ? "text-green-700"
            : color === "blue"
            ? "text-blue-700"
            : "text-gray-900"
        )}
      >
        {value}
      </p>
      {subtext && <p className="text-xs text-gray-500 mt-1">{subtext}</p>}
    </div>
  );
}
