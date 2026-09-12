import React from "react";
import { Link } from "react-router-dom";
import { ChevronRightIcon } from "lucide-react";
import { currentVersion, taskCompletion, timeSpent } from "../../utils/reports";
import { relativeTime, weekLabel } from "../../utils/date";
import { Avatar } from "../ui/Avatar";
import { StatusBadge } from "../ui/StatusBadge";
import { EmptyState } from "../ui/EmptyState";
export function ReportsTable({
  reports,
  users,
  projects,
  showMember = false,
  emptyTitle = "No reports yet",
  emptyDescription,
  linkBase = "/reports",
}) {
  if (reports.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }
  return (
    <div className="overflow-x-auto scroll-thin">
      <table className="w-full min-w-[760px] border-collapse text-left">
        <thead>
          <tr className="border-b border-line text-2xs uppercase tracking-wide text-ink-faint">
            <th scope="col" className="px-5 py-2.5 font-medium">
              Week
            </th>
            {showMember ? (
              <th scope="col" className="px-3 py-2.5 font-medium">
                Member
              </th>
            ) : null}
            <th scope="col" className="px-3 py-2.5 font-medium">
              Project
            </th>
            <th scope="col" className="px-3 py-2.5 font-medium">
              Status
            </th>
            <th scope="col" className="px-3 py-2.5 font-medium">
              Tasks
            </th>
            <th scope="col" className="px-3 py-2.5 font-medium">
              Hours
            </th>
            <th scope="col" className="px-3 py-2.5 font-medium">
              Updated
            </th>
            <th scope="col" className="px-5 py-2.5">
              <span className="sr-only">Open</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {reports.map((report) => {
            const version = currentVersion(report);
            const { done, total } = taskCompletion(version.tasks);
            const member = users.find((u) => u.id === report.userId);
            const project = projects.find((p) => p.id === report.projectId);
            return (
              <tr
                key={report.id}
                className="group border-b border-line/70 transition-colors duration-150 ease-out last:border-0 hover:bg-subtle"
              >
                <td className="px-5 py-3">
                  <Link
                    to={`${linkBase}/${report.id}`}
                    className="text-[13px] font-medium text-ink hover:text-accent"
                  >
                    {weekLabel(report.weekStartDate)}
                  </Link>
                  {report.versions.length > 1 ? (
                    <span className="ml-2 rounded bg-line/70 px-1.5 py-0.5 text-2xs text-ink-muted">
                      v{report.currentVersionNumber}
                    </span>
                  ) : null}
                </td>
                {showMember ? (
                  <td className="px-3 py-3">
                    <span className="flex items-center gap-2">
                      <Avatar name={member?.name ?? "—"} size="sm" />
                      <span className="text-[13px] text-ink-soft">
                        {member?.name ?? "—"}
                      </span>
                    </span>
                  </td>
                ) : null}
                <td className="px-3 py-3 text-[13px] text-ink-muted">
                  {project?.name ?? "—"}
                </td>
                <td className="px-3 py-3">
                  <StatusBadge status={report.status} />
                </td>
                <td className="px-3 py-3 text-[13px] tnum text-ink-soft">
                  {done}/{total}
                </td>
                <td className="px-3 py-3 text-[13px] tnum text-ink-soft">
                  {timeSpent(version.tasks)}h
                </td>
                <td className="px-3 py-3 text-[13px] text-ink-muted">
                  {relativeTime(report.updatedAt)}
                </td>
                <td className="px-5 py-3 text-right">
                  <Link
                    to={`${linkBase}/${report.id}`}
                    aria-label={`Open report for ${weekLabel(report.weekStartDate)}`}
                    className="inline-flex items-center gap-1 text-[13px] font-medium text-ink-muted transition-colors duration-150 ease-out group-hover:text-ink"
                  >
                    Open
                    <ChevronRightIcon className="h-3.5 w-3.5" />
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
