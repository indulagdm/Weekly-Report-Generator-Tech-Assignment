import React from "react";
import { Link } from "react-router-dom";
import { CheckCircle2Icon, MessageSquareIcon, SendIcon } from "lucide-react";
import { cn } from "../../utils/cn";
import { relativeTime } from "../../utils/date";
export function ActivityFeed({ items }) {
  if (items.length === 0) {
    return (
      <p className="px-5 py-5 text-[13px] text-ink-muted">No activity yet.</p>
    );
  }
  return (
    <ol className="divide-y divide-line">
      {items.map((item) => {
        const approved = item.detail && item.label.includes("approved");
        const isSubmit = item.kind === "report_submitted";
        const Icon = isSubmit
          ? SendIcon
          : approved
            ? CheckCircle2Icon
            : MessageSquareIcon;
        return (
          <li key={item.id} className="flex gap-3 px-5 py-3.5">
            <span
              className={cn(
                "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                isSubmit
                  ? "bg-blue-50 text-blue-700"
                  : approved
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-amber-50 text-amber-700",
              )}
            >
              <Icon className="h-3.5 w-3.5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] text-ink">
                <Link
                  to={`/reports/${item.reportId}`}
                  className="font-medium hover:text-accent"
                >
                  {item.label}
                </Link>
              </p>
              <p className="mt-0.5 line-clamp-2 text-[13px] text-ink-muted">
                {item.detail}
              </p>
            </div>
            <span className="shrink-0 text-2xs text-ink-faint">
              {relativeTime(item.at)}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
