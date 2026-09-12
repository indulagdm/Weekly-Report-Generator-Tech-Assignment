import React from "react";
import { HistoryIcon } from "lucide-react";
import { cn } from "../../utils/cn";
import { formatDateTime } from "../../utils/date";
export function VersionHistory({ report, comments, selected, onSelect }) {
  const ordered = [...report.versions].sort(
    (a, b) => b.versionNumber - a.versionNumber,
  );
  return (
    <div className="p-3">
      <ul className="space-y-1.5">
        {ordered.map((version) => {
          const isCurrent =
            version.versionNumber === report.currentVersionNumber;
          const versionComments = comments.filter(
            (c) => c.versionNumber === version.versionNumber,
          );
          const active = version.versionNumber === selected;
          return (
            <li key={version.id}>
              <button
                type="button"
                onClick={() => onSelect(version.versionNumber)}
                aria-current={active ? "true" : undefined}
                className={cn(
                  "w-full rounded-lg border px-3 py-2.5 text-left transition-colors duration-150 ease-out",
                  active
                    ? "border-ink bg-ink text-white"
                    : "border-line bg-surface hover:bg-subtle",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[13px] font-medium">
                    Version {version.versionNumber}
                    {isCurrent ? (
                      <span
                        className={cn(
                          "ml-2 rounded px-1.5 py-0.5 text-2xs font-semibold uppercase tracking-wide",
                          active
                            ? "bg-white/15 text-white"
                            : "bg-accent-soft text-accent",
                        )}
                      >
                        Current
                      </span>
                    ) : null}
                  </span>
                  <HistoryIcon
                    className={cn(
                      "h-3.5 w-3.5",
                      active ? "text-white/70" : "text-ink-faint",
                    )}
                  />
                </div>
                <p
                  className={cn(
                    "mt-1 text-2xs",
                    active ? "text-white/70" : "text-ink-muted",
                  )}
                >
                  {version.submittedAt
                    ? `Submitted ${formatDateTime(version.submittedAt)}`
                    : "Not submitted yet"}
                </p>
                {versionComments.length > 0 ? (
                  <p
                    className={cn(
                      "mt-1 text-2xs",
                      active ? "text-white/70" : "text-ink-faint",
                    )}
                  >
                    {versionComments.length} review comment
                    {versionComments.length > 1 ? "s" : ""} on this version
                  </p>
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
