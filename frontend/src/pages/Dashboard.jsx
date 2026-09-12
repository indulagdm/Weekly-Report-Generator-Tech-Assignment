import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRightIcon } from "lucide-react";
import { useData } from "../contexts/DataContext";
import { useAuth } from "../contexts/AuthContext";
import {
  activityFeed,
  hoursByType,
  statusByMember,
  summaryFor,
  tasksTrend,
  workloadByProject,
} from "../utils/analytics";
import { currentWeekStart, recentWeekStarts, weekLabel } from "../utils/date";
import { PageHeader } from "../components/ui/PageHeader";
import { Panel, PanelHeader } from "../components/ui/Panel";
import { Select } from "../components/ui/Field";
import { MetricCards } from "../components/dashboard/MetricCards";
import {
  HoursByTypeChart,
  TasksTrendChart,
  WorkloadChart,
} from "../components/dashboard/Charts";
import { MemberStatusList } from "../components/dashboard/MemberStatusList";
import { ActivityFeed } from "../components/dashboard/ActivityFeed";
export function Dashboard() {
  const { reports, users, projects, comments } = useData();
  const { user } = useAuth();
  const [week, setWeek] = useState(currentWeekStart());
  const weekOptions = useMemo(() => [...recentWeekStarts(6)].reverse(), []);
  const metrics = useMemo(
    () => summaryFor(reports, users, week),
    [reports, users, week],
  );
  const trend = useMemo(() => tasksTrend(reports, 6), [reports]);
  const memberRows = useMemo(
    () => statusByMember(reports, users, week),
    [reports, users, week],
  );
  const workload = useMemo(
    () => workloadByProject(reports, projects, week),
    [reports, projects, week],
  );
  const hours = useMemo(() => hoursByType(reports, week), [reports, week]);
  const feed = useMemo(
    () => activityFeed(reports, comments, users, 8),
    [reports, comments, users],
  );
  const awaitingReview = reports.filter(
    (r) => r.status === "submitted" && r.weekStartDate === week,
  ).length;
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={`Good to see you, ${user?.name.split(" ")[0]}`}
        title="Team dashboard"
        description={`Reporting health for ${weekLabel(week)}.`}
        actions={
          <div className="flex items-center gap-2">
            <label htmlFor="dash-week" className="text-[13px] text-ink-muted">
              Week
            </label>
            <Select
              id="dash-week"
              value={week}
              onChange={(e) => setWeek(e.target.value)}
              className="w-56"
            >
              {weekOptions.map((w) => (
                <option key={w} value={w}>
                  {weekLabel(w)}
                  {w === currentWeekStart() ? " (current)" : ""}
                </option>
              ))}
            </Select>
          </div>
        }
      />

      {awaitingReview > 0 ? (
        <Link
          to="/team?status=submitted"
          className="flex items-center justify-between gap-4 rounded-xl border border-blue-200 bg-blue-50 px-5 py-3.5 transition-colors duration-150 ease-out hover:bg-blue-100/70"
        >
          <p className="text-[13px] font-medium text-blue-900">
            {awaitingReview} report{awaitingReview > 1 ? "s" : ""} waiting on
            your review this week.
          </p>
          <span className="flex shrink-0 items-center gap-1 text-[13px] font-medium text-blue-800">
            Go to review queue
            <ArrowRightIcon className="h-3.5 w-3.5" />
          </span>
        </Link>
      ) : null}

      <MetricCards metrics={metrics} />

      <div className="grid gap-5 xl:grid-cols-[1.35fr_1fr]">
        <Panel>
          <PanelHeader
            title="Tasks completed over time"
            description="Completed vs logged, team-wide, last six weeks."
          />

          <div className="px-3 py-4">
            <TasksTrendChart data={trend} />
          </div>
        </Panel>

        <Panel>
          <PanelHeader
            title="Status by team member"
            description={`Where everyone stands for ${weekLabel(week)}.`}
          />

          <MemberStatusList rows={memberRows} />
        </Panel>
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <Panel className="xl:col-span-1">
          <PanelHeader
            title="Workload by project"
            description="Tasks logged this week."
          />
          <div className="px-3 py-4">
            {workload.length ? (
              <WorkloadChart data={workload} />
            ) : (
              <p className="px-2 py-10 text-center text-[13px] text-ink-muted">
                No tasks logged against projects yet.
              </p>
            )}
          </div>
        </Panel>

        <Panel className="xl:col-span-1">
          <PanelHeader
            title="Time by task type"
            description="Team-wide hours this week."
          />
          <div className="px-5 py-4">
            {hours.length ? (
              <HoursByTypeChart data={hours} />
            ) : (
              <p className="py-10 text-center text-[13px] text-ink-muted">
                No hours logged yet.
              </p>
            )}
          </div>
        </Panel>

        <Panel className="xl:col-span-1">
          <PanelHeader
            title="Recent activity"
            description="Submissions and review actions."
            actions={
              <Link
                to="/team"
                className="text-[13px] font-medium text-ink-muted hover:text-ink"
              >
                All reports
              </Link>
            }
          />

          <ActivityFeed items={feed} />
        </Panel>
      </div>
    </div>
  );
}
