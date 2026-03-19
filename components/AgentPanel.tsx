import { cn } from "@/lib/utils";
import { Bot, CheckCircle2, Lock } from "lucide-react";

interface AgentPanelProps {
  title: string;
  description?: string;
  locked?: boolean;
  confirmed?: boolean;
  children: React.ReactNode;
  className?: string;
}

export default function AgentPanel({
  title,
  description,
  locked = false,
  confirmed = false,
  children,
  className,
}: AgentPanelProps) {
  return (
    <div
      className={cn(
        "rounded-lg border bg-white p-4 transition-opacity",
        locked ? "opacity-50 pointer-events-none" : "opacity-100",
        confirmed ? "border-green-300 bg-green-50" : "border-blue-200",
        className
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {confirmed ? (
            <CheckCircle2 className="w-4 h-4 text-green-600" />
          ) : locked ? (
            <Lock className="w-4 h-4 text-gray-400" />
          ) : (
            <Bot className="w-4 h-4 text-blue-600" />
          )}
          <h3 className={cn("font-semibold text-sm", confirmed ? "text-green-800" : locked ? "text-gray-400" : "text-blue-800")}>
            {title}
          </h3>
        </div>
        {confirmed && (
          <span className="text-xs text-green-700 font-medium bg-green-100 px-2 py-0.5 rounded">Confirmed</span>
        )}
      </div>
      {description && <p className="text-xs text-gray-500 mb-3">{description}</p>}
      {children}
    </div>
  );
}
