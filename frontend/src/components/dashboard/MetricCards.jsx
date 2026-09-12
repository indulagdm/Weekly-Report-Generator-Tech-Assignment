import React from "react";
import {
  AlertTriangleIcon,
  CheckCheckIcon,
  InboxIcon,
  RotateCcwIcon,
} from "lucide-react";
import { cn } from "../../utils/cn";
export function MetricCards({ metrics, className }) {
  const items = [
    {
      label: "Submitted this week",
      value: String(metrics.submitted),
      sub: `${metrics.approved} already approved`,
      icon: InboxIcon,
      tone: "text-blue-700 bg-blue-50",
    },
    {
      label: "Needs correction",
      value: String(metrics.needsCorrection),
      sub: "Waiting on the team member",
      icon: RotateCcwIcon,
      tone: "text-amber-700 bg-amber-50",
    },
    {
      label: "Open blockers",
      value: String(metrics.openBlockers),
      sub: "Across unapproved reports",
      icon: AlertTriangleIcon,
      tone: "text-rose-700 bg-rose-50",
    },
  ];
  return (
    <div className={cn("grid gap-4 md:grid-cols-2 xl:grid-cols-4", className)}>
      {/* Primary metric — compliance is the number the manager actually acts on. */}
      <div className="rounded-xl border border-line bg-ink p-5 text-white shadow-card xl:row-span-1">
        <div className="flex items-center justify-between">
          <p className="text-[13px] font-medium text-white/70">
            Submission compliance
          </p>
          <CheckCheckIcon className="h-4 w-4 text-white/50" />
        </div>
        <p className="mt-3 text-4xl font-semibold tnum tracking-tight">
          {metrics.complianceRate}%
        </p>
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/15">
          <div
            className="h-full rounded-full bg-emerald-400 transition-[width] duration-300 ease-out"
            style={{ width: `${metrics.complianceRate}%` }}
          />
        </div>
        <p className="mt-2.5 text-[13px] text-white/70">
          {metrics.totalMembers - metrics.pending} of {metrics.totalMembers}{" "}
          members reported · {metrics.pending} pending
        </p>
      </div>

      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-xl border border-line bg-surface p-5 shadow-card"
        >
          <div className="flex items-center justify-between">
            <p className="text-[13px] font-medium text-ink-muted">
              {item.label}
            </p>
            <span
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-lg",
                item.tone,
              )}
            >
              <item.icon className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-3 text-3xl font-semibold tnum tracking-tight text-ink">
            {item.value}
          </p>
          <p className="mt-2.5 text-[13px] text-ink-faint">{item.sub}</p>
        </div>
      ))}
    </div>
  );
}
