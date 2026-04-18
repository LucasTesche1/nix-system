import { ContentStatus, STATUS_LABELS } from "@/lib/types";
import { statusStyle, statusDot } from "@/lib/status";
import { cn } from "@/lib/utils";

export const StatusBadge = ({ status, className }: { status: ContentStatus; className?: string }) => (
  <span
    className={cn(
      "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
      statusStyle(status),
      className
    )}
  >
    <span className={cn("h-1.5 w-1.5 rounded-full", statusDot(status))} />
    {STATUS_LABELS[status]}
  </span>
);
