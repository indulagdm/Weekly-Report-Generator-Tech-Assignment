import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangleIcon,
  ArrowUpRightIcon,
  ListChecksIcon,
  StarIcon,
} from "lucide-react";
import { useData } from "../contexts/DataContext";
import { currentVersion } from "../utils/reports";
import { currentWeekStart, recentWeekStarts, weekLabel } from "../utils/date";
import { cn } from "../utils/cn";
import { PageHeader } from "../components/ui/PageHeader";
import { Panel } from "../components/ui/Panel";
import { Select } from "../components/ui/Field";
import { Avatar } from "../components/ui/Avatar";
import { StatusBadge } from "../components/ui/StatusBadge";
import { EmptyState } from "../components/ui/EmptyState";
const sections = [
  { id: "blockers", label: "Blockers", icon: AlertTriangleIcon },
  { id: "achievements", label: "Achievements", icon: StarIcon },
  { id: "next", label: "Planned next week", icon: ListChecksIcon },
];
export function SectionView() {
  const { reports, users, projects } = useData();
  const [week, setWeek] = useState(currentWeekStart());
  const [section, setSection] = useState("blockers");
  const weekOptions = useMemo(() => [...recentWeekStarts(6)].reverse(), []);
  const rows = useMemo(
    () =>
      reports
        .filter((r) => r.weekStartDate === week)
        .map((report) => ({
          report,
          version: currentVersion(report),
          user: users.find((u) => u.id === report.userId),
          project: projects.find((p) => p.id === report.projectId),
        }))
        .sort((a, b) => (a.user?.name ?? "").localeCompare(b.user?.name ?? "")),
    [reports, users, projects, week],
  );
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Manager view"
        title="Section comparison"
        description="One section from every team member's report, side by side — no need to open them one at a time."
        actions={
          <div className="flex items-center gap-2">
            <label
              htmlFor="section-week"
              className="text-[13px] text-ink-muted"
            >
              Week
            </label>
            <Select
              id="section-week"
              value={week}
              onChange={(e) => setWeek(e.target.value)}
              className="w-56"
            >
              {weekOptions.map((w) => (
                <option key={w} value={w}>
                  {weekLabel(w)}
                </option>
              ))}
            </Select>
          </div>
        }
      />

      <div
        className="flex flex-wrap gap-1.5"
        role="tablist"
        aria-label="Report section"
      >
        {sections.map((s) => (
          <button
            key={s.id}
            type="button"
            role="tab"
            aria-selected={section === s.id}
            onClick={() => setSection(s.id)}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors duration-150 ease-out",
              section === s.id
                ? "bg-ink text-white"
                : "border border-line-strong bg-surface text-ink-muted hover:text-ink",
            )}
          >
            <s.icon className="h-4 w-4" />
            {s.label}
          </button>
        ))}
      </div>

      {rows.length === 0 ? (
        <Panel>
          <EmptyState
            title="No reports for this week"
            description="Pick another week, or check who has not started yet on the team reports page."
          />
        </Panel>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {rows.map(({ report, version, user, project }) => (
            <Panel key={report.id} className="flex flex-col p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2.5">
                  <Avatar name={user?.name ?? "—"} size="sm" />
                  <div className="min-w-0 leading-tight">
                    <p className="truncate text-[13px] font-medium text-ink">
                      {user?.name}
                    </p>
                    <p className="truncate text-2xs text-ink-faint">
                      {project?.name}
                    </p>
                  </div>
                </div>
                <StatusBadge status={report.status} />
              </div>

              <div className="mt-4 flex-1">
                {section === "blockers" ? (
                  version.blockers.length ? (
                    <ul className="space-y-2">
                      {version.blockers.map((b) => (
                        <li
                          key={b.id}
                          className={cn(
                            "rounded-lg px-3 py-2 text-[13px] leading-relaxed",
                            b.isKeyIssue
                              ? "bg-amber-50 text-amber-900 ring-1 ring-inset ring-amber-200"
                              : "bg-subtle text-ink-soft",
                          )}
                        >
                          {b.description}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-[13px] text-ink-faint">
                      No blockers reported.
                    </p>
                  )
                ) : null}

                {section === "achievements" ? (
                  version.achievements.length ? (
                    <ul className="space-y-2">
                      {version.achievements.map((a) => (
                        <li
                          key={a.id}
                          className={cn(
                            "rounded-lg px-3 py-2 text-[13px] leading-relaxed",
                            a.isKeyAchievement
                              ? "bg-accent-soft text-accent ring-1 ring-inset ring-accent/20"
                              : "bg-subtle text-ink-soft",
                          )}
                        >
                          {a.description}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-[13px] text-ink-faint">
                      Nothing flagged.
                    </p>
                  )
                ) : null}

                {section === "next" ? (
                  <p className="whitespace-pre-line text-[13px] leading-relaxed text-ink-soft">
                    {version.tasksPlannedNextWeek || "—"}
                  </p>
                ) : null}
              </div>

              <Link
                to={`/reports/${report.id}`}
                className="mt-4 inline-flex items-center gap-1 text-[13px] font-medium text-ink-muted transition-colors duration-150 ease-out hover:text-ink"
              >
                Open full report
                <ArrowUpRightIcon className="h-3.5 w-3.5" />
              </Link>
            </Panel>
          ))}
        </div>
      )}
    </div>
  );
}
