import React, { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { FilterXIcon, GavelIcon } from "lucide-react";
import { useData } from "../contexts/DataContext";
import { currentWeekStart, recentWeekStarts, weekLabel } from "../utils/date";
import { statusLabels } from "../utils/labels";
import { PageHeader } from "../components/ui/PageHeader";
import { Panel, PanelHeader } from "../components/ui/Panel";
import { Button } from "../components/ui/Button";
import { Field, Select } from "../components/ui/Field";
import { Avatar } from "../components/ui/Avatar";
import { ReportsTable } from "../components/reports/ReportsTable";
import { statusByMember } from "../utils/analytics";
import { StatusBadge } from "../components/ui/StatusBadge";
export function TeamReports() {
  const { reports, users, projects } = useData();
  const [params, setParams] = useSearchParams();
  const [member, setMember] = useState("all");
  const [project, setProject] = useState("all");
  const [week, setWeek] = useState("all");
  const status = params.get("status") ?? "all";
  const weekOptions = useMemo(() => [...recentWeekStarts(6)].reverse(), []);
  const setStatus = (next) => {
    const nextParams = new URLSearchParams(params);
    if (next === "all") nextParams.delete("status");
    else nextParams.set("status", next);
    setParams(nextParams, { replace: true });
  };
  const filtered = useMemo(
    () =>
      reports
        .filter((r) => (member === "all" ? true : r.userId === member))
        .filter((r) => (project === "all" ? true : r.projectId === project))
        .filter((r) => (status === "all" ? true : r.status === status))
        .filter((r) => (week === "all" ? true : r.weekStartDate === week))
        .sort((a, b) => {
          if (a.weekStartDate !== b.weekStartDate)
            return b.weekStartDate.localeCompare(a.weekStartDate);
          return a.status === "submitted" ? -1 : 1;
        }),
    [reports, member, project, status, week],
  );
  const queue = reports.filter((r) => r.status === "submitted");
  const notStarted = statusByMember(reports, users, currentWeekStart()).filter(
    (r) => r.status === "not_started",
  );
  const filtersActive =
    member !== "all" || project !== "all" || status !== "all" || week !== "all";
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Manager view"
        title="Team reports"
        description="Every report across the team, filterable by member, project, status and week."
      />

      {queue.length > 0 ? (
        <Panel className="p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-ink">
                Awaiting your review
              </h2>
              <p className="mt-0.5 text-[13px] text-ink-muted">
                {queue.length} submitted report{queue.length > 1 ? "s" : ""}{" "}
                with no decision yet.
              </p>
            </div>
          </div>
          <ul className="mt-4 grid gap-2.5 md:grid-cols-2 xl:grid-cols-3">
            {queue.map((report) => {
              const author = users.find((u) => u.id === report.userId);
              return (
                <li
                  key={report.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-line bg-subtle px-3.5 py-3"
                >
                  <span className="flex min-w-0 items-center gap-2.5">
                    <Avatar name={author?.name ?? "—"} size="sm" />
                    <span className="min-w-0 leading-tight">
                      <span className="block truncate text-[13px] font-medium text-ink">
                        {author?.name}
                      </span>
                      <span className="block truncate text-2xs text-ink-faint">
                        {weekLabel(report.weekStartDate)}
                      </span>
                    </span>
                  </span>
                  <Link
                    to={`/review/${report.id}`}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-ink px-2.5 py-1.5 text-2xs font-medium text-white transition-colors duration-150 ease-out hover:bg-ink-soft"
                  >
                    <GavelIcon className="h-3.5 w-3.5" />
                    Review
                  </Link>
                </li>
              );
            })}
          </ul>
        </Panel>
      ) : null}

      <Panel>
        <PanelHeader
          title="All reports"
          description={`${filtered.length} matching report${filtered.length === 1 ? "" : "s"}`}
          actions={
            filtersActive ? (
              <Button
                size="sm"
                onClick={() => {
                  setMember("all");
                  setProject("all");
                  setWeek("all");
                  setStatus("all");
                }}
              >
                <FilterXIcon className="h-4 w-4" />
                Clear filters
              </Button>
            ) : null
          }
        />

        <div className="grid gap-3 border-b border-line bg-subtle px-5 py-4 md:grid-cols-2 xl:grid-cols-4">
          <Field label="Team member" htmlFor="f-member">
            <Select
              id="f-member"
              value={member}
              onChange={(e) => setMember(e.target.value)}
            >
              <option value="all">All members</option>
              {users
                .filter((u) => u.role === "team_member")
                .map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
            </Select>
          </Field>
          <Field label="Project / category" htmlFor="f-project">
            <Select
              id="f-project"
              value={project}
              onChange={(e) => setProject(e.target.value)}
            >
              <option value="all">All projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Status" htmlFor="f-status">
            <Select
              id="f-status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="all">All statuses</option>
              {["draft", "submitted", "needs_correction", "approved"].map(
                (s) => (
                  <option key={s} value={s}>
                    {statusLabels[s]}
                  </option>
                ),
              )}
            </Select>
          </Field>
          <Field label="Week" htmlFor="f-week">
            <Select
              id="f-week"
              value={week}
              onChange={(e) => setWeek(e.target.value)}
            >
              <option value="all">All weeks</option>
              {weekOptions.map((w) => (
                <option key={w} value={w}>
                  {weekLabel(w)}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <ReportsTable
          reports={filtered}
          users={users}
          projects={projects}
          showMember
          emptyTitle="No reports match these filters"
          emptyDescription="Try widening the week or clearing the status filter."
        />
      </Panel>

      {notStarted.length > 0 ? (
        <Panel className="p-5">
          <h2 className="text-sm font-semibold text-ink">
            Not started this week ({weekLabel(currentWeekStart())})
          </h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {notStarted.map((row) => (
              <li key={row.userId}>
                <Link
                  to={`/team/members/${row.userId}`}
                  className="flex items-center gap-2 rounded-full border border-line-strong px-3 py-1.5 text-[13px] text-ink-soft transition-colors duration-150 ease-out hover:border-ink hover:text-ink"
                >
                  <Avatar name={row.name} size="sm" />
                  {row.name}
                  <StatusBadge status="not_started" />
                </Link>
              </li>
            ))}
          </ul>
        </Panel>
      ) : null}
    </div>
  );
}
