import { cn } from "@/lib/utils";

type BadgeVariant =
  | "critical"
  | "major"
  | "minor"
  | "open"
  | "investigation"
  | "capa"
  | "review"
  | "closed"
  | "completed"
  | "pending"
  | "inprogress"
  | "default";

const variants: Record<BadgeVariant, string> = {
  critical: "bg-red-100 text-red-800 border-red-200",
  major: "bg-amber-100 text-amber-800 border-amber-200",
  minor: "bg-gray-100 text-gray-700 border-gray-200",
  open: "bg-blue-100 text-blue-800 border-blue-200",
  investigation: "bg-purple-100 text-purple-800 border-purple-200",
  capa: "bg-amber-100 text-amber-800 border-amber-200",
  review: "bg-indigo-100 text-indigo-800 border-indigo-200",
  closed: "bg-green-100 text-green-800 border-green-200",
  completed: "bg-green-100 text-green-800 border-green-200",
  pending: "bg-gray-100 text-gray-700 border-gray-200",
  inprogress: "bg-blue-100 text-blue-800 border-blue-200",
  default: "bg-gray-100 text-gray-700 border-gray-200",
};

function getVariant(value: string): BadgeVariant {
  const v = value.toLowerCase().replace(/\s+/g, "");
  if (v === "critical") return "critical";
  if (v === "major") return "major";
  if (v === "minor") return "minor";
  if (v === "open") return "open";
  if (v.includes("investigation")) return "investigation";
  if (v.includes("capa")) return "capa";
  if (v.includes("review")) return "review";
  if (v === "closed") return "closed";
  if (v === "completed") return "completed";
  if (v === "pending") return "pending";
  if (v.includes("progress")) return "inprogress";
  return "default";
}

export default function Badge({ value, className }: { value: string; className?: string }) {
  const variant = getVariant(value);
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border",
        variants[variant],
        className
      )}
    >
      {value}
    </span>
  );
}
