import React from "react";
import { AlertTriangleIcon, LinkIcon, StarIcon } from "lucide-react";
import { cn } from "../../utils/cn";
import {
  priorityLabels,
  priorityStyles,
  taskStatusLabels,
  taskStatusStyles,
} from "../../utils/labels";
import { Panel, PanelHeader } from "../ui/Panel";
function SectionTitle({ children }) {
  return <h3 className="text-sm font-semibold text-ink">{children}</h3>;
}
function ProgressBar({ planned, actual }) {
  return (
    <div className="min-w-[110px]">
      <div className="flex items-center gap-1.5 text-2xs tnum text-ink-muted">
        <span className="font-medium text-ink">{actual}%</span>
        <span>/ {planned}% planned</span>
      </div>
      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-line">
        <div
          className={cn(
            "h-full rounded-full",
            actual >= planned ? "bg-accent" : "bg-amber-500",
          )}
          style={{ width: `${Math.min(Math.max(actual, 0), 100)}%` }}
        />
      </div>
    </div>
  );
}
export function ReportContentView({ version }) {
  const totalHours = version.hours.reduce((s, h) => s + Number(h.hours), 0);

  const wholeHours = Math.floor(totalHours);
  const minutes = Math.round((totalHours - wholeHours) * 60);
  return (
    <div className="space-y-5">
      <Panel>
        <PanelHeader
          title="Tasks completed"
          description={`${version.tasks.filter((t) => t.status === "done").length} of ${version.tasks.length} marked done`}
        />

        {version.tasks.length === 0 ? (
          <p className="px-5 py-6 text-[13px] text-ink-muted">
            No tasks recorded this week.
          </p>
        ) : (
          <div className="overflow-x-auto scroll-thin">
            <table className="w-full min-w-[860px] border-collapse text-left">
              <thead>
                <tr className="border-b border-line text-2xs uppercase tracking-wide text-ink-faint">
                  <th scope="col" className="px-5 py-2.5 font-medium">
                    Task
                  </th>
                  <th scope="col" className="px-3 py-2.5 font-medium">
                    Priority
                  </th>
                  <th scope="col" className="px-3 py-2.5 font-medium">
                    Progress
                  </th>
                  <th scope="col" className="px-3 py-2.5 font-medium">
                    Status
                  </th>
                  <th scope="col" className="px-3 py-2.5 font-medium">
                    Hours
                  </th>
                  <th scope="col" className="px-5 py-2.5 font-medium">
                    Output
                  </th>
                </tr>
              </thead>
              <tbody>
                {version.tasks.map((task) => (
                  <tr
                    key={task.id}
                    className="border-b border-line/70 last:border-0 align-top"
                  >
                    <td className="px-5 py-3 text-[13px] font-medium text-ink">
                      {task.taskName}
                    </td>
                    <td
                      className={cn(
                        "px-3 py-3 text-[13px]",
                        priorityStyles[task.priority],
                      )}
                    >
                      {priorityLabels[task.priority]}
                    </td>
                    <td className="px-3 py-3">
                      <ProgressBar
                        planned={task.plannedPercent}
                        actual={task.actualPercent}
                      />
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={cn(
                          "inline-flex rounded-md px-2 py-1 text-2xs font-medium",
                          taskStatusStyles[task.status],
                        )}
                      >
                        {taskStatusLabels[task.status]}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-[13px] tnum text-ink-soft">
                      {task.timeSpentHours}h
                      <span className="text-ink-faint">
                        {" "}
                        / {task.timePlannedHours}h
                      </span>
                    </td>
                    <td className="px-5 py-3 text-[13px] text-ink-muted">
                      {task.outputDeliverable || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel className="p-5">
          <SectionTitle>Blockers &amp; challenges</SectionTitle>
          {version.blockers.length === 0 ? (
            <p className="mt-3 text-[13px] text-ink-muted">
              No blockers reported.
            </p>
          ) : (
            <ul className="mt-3 space-y-2.5">
              {version.blockers.map((b) => (
                <li
                  key={b.id}
                  className={cn(
                    "flex gap-2.5 rounded-lg border px-3 py-2.5 text-[13px]",
                    b.isKeyIssue
                      ? "border-amber-200 bg-amber-50/70 text-amber-900"
                      : "border-line bg-subtle text-ink-soft",
                  )}
                >
                  <AlertTriangleIcon
                    className={cn(
                      "mt-0.5 h-4 w-4 shrink-0",
                      b.isKeyIssue ? "text-amber-600" : "text-ink-faint",
                    )}
                  />

                  <span>
                    {b.description}
                    {b.isKeyIssue ? (
                      <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-2xs font-semibold uppercase tracking-wide text-amber-800">
                        Key issue
                      </span>
                    ) : null}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel className="p-5">
          <SectionTitle>Achievements &amp; highlights</SectionTitle>
          {version.achievements.length === 0 ? (
            <p className="mt-3 text-[13px] text-ink-muted">
              No achievements recorded.
            </p>
          ) : (
            <ul className="mt-3 space-y-2.5">
              {version.achievements.map((a) => (
                <li
                  key={a.id}
                  className={cn(
                    "flex gap-2.5 rounded-lg border px-3 py-2.5 text-[13px]",
                    a.isKeyAchievement
                      ? "border-accent/30 bg-accent-soft text-accent"
                      : "border-line bg-subtle text-ink-soft",
                  )}
                >
                  <StarIcon
                    className={cn(
                      "mt-0.5 h-4 w-4 shrink-0",
                      a.isKeyAchievement ? "text-accent" : "text-ink-faint",
                    )}
                  />

                  <span>
                    {a.description}
                    {a.isKeyAchievement ? (
                      <span className="ml-2 rounded bg-white px-1.5 py-0.5 text-2xs font-semibold uppercase tracking-wide text-accent">
                        Key win
                      </span>
                    ) : null}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_1.2fr]">
        <Panel className="p-5">
          <div className="flex items-baseline justify-between">
            <SectionTitle>Hours by task type</SectionTitle>
            <span className="text-[13px] tnum font-medium text-ink">
              {wholeHours}h {minutes}m total
            </span>
          </div>
          {version.hours.length === 0 ? (
            <p className="mt-3 text-[13px] text-ink-muted">Not logged.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {version.hours.map((h) => (
                <li key={h.id}>
                  <div className="flex items-baseline justify-between text-[13px]">
                    <span className="text-ink-soft">{h.taskType}</span>
                    <span className="tnum text-ink-muted">{h.hours}h</span>
                  </div>
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-line">
                    <div
                      className="h-full rounded-full bg-ink"
                      style={{
                        width: `${totalHours ? (h.hours / totalHours) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <div className="space-y-5">
          <Panel className="p-5">
            <SectionTitle>Planned for next week</SectionTitle>
            <p className="mt-2 whitespace-pre-line text-[13px] leading-relaxed text-ink-soft">
              {version.tasksPlannedNextWeek || "—"}
            </p>
          </Panel>
          {version.notes || version.links ? (
            <Panel className="p-5">
              <SectionTitle>Notes &amp; links</SectionTitle>
              {version.notes ? (
                <p className="mt-2 whitespace-pre-line text-[13px] leading-relaxed text-ink-soft">
                  {version.notes}
                </p>
              ) : null}
              {version.links ? (
                <p className="mt-3 flex items-center gap-2 text-[13px] text-accent">
                  <LinkIcon className="h-3.5 w-3.5" />
                  <span className="break-all">{version.links}</span>
                </p>
              ) : null}
            </Panel>
          ) : null}
        </div>
      </div>
    </div>
  );
}
