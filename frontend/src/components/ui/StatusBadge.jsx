import React from "react";
import { cn } from "../../utils/cn";
import { statusDot, statusLabels, statusStyles } from "../../utils/labels";
export function StatusBadge({ status, className }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-2xs font-medium ring-1 ring-inset",
        statusStyles[status],
        className,
      )}
    >
      <span
        className={cn("h-1.5 w-1.5 rounded-full", statusDot[status])}
        aria-hidden="true"
      />
      {statusLabels[status]}
    </span>
  );
}
