import React, { useMemo } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { ArrowLeftIcon, MailIcon } from "lucide-react";
import { useData } from "../contexts/DataContext";
import { memberStats, tasksTrend } from "../utils/analytics";
import { currentWeekStart, weekLabel } from "../utils/date";
import { Panel, PanelHeader } from "../components/ui/Panel";
import { Avatar } from "../components/ui/Avatar";
import { StatusBadge } from "../components/ui/StatusBadge";
import { ReportsTable } from "../components/reports/ReportsTable";
import { TasksTrendChart } from "../components/dashboard/Charts";
export function MemberProfile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { getUser, reports, users, projects } = useData();
  const member = userId ? getUser(userId) : undefined;
  const own = useMemo(
    () =>
      reports
        .filter((r) => r.userId === userId)
        .sort((a, b) => b.weekStartDate.localeCompare(a.weekStartDate)),
    [reports, userId],
  );
  const stats = useMemo(
    () => memberStats(reports, userId ?? ""),
    [reports, userId],
  );
  const trend = useMemo(() => tasksTrend(own, 6), [own]);
  if (!member) return <Navigate to="/users" replace />;
  const thisWeek = own.find((r) => r.weekStartDate === currentWeekStart());
  const memberProjects = projects.filter((p) =>
    p.memberIds.includes(member.id),
  );
  const metrics = [
    { label: "Reports filed", value: stats.totalReports },
    { label: "Approved", value: stats.approved },
    { label: "Correction cycles", value: stats.corrections },
    {
      label: "Tasks completed",
      value: `${stats.tasksCompleted}/${stats.tasksTotal}`,
    },
    { label: "Hours logged", value: `${stats.hoursLogged}` },
  ];

  {console.log(stats)}
  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-[13px] text-ink-muted transition-colors duration-150 ease-out hover:text-ink"
      >
        <ArrowLeftIcon className="h-3.5 w-3.5" />
        Back
      </button>

      <Panel className="flex flex-wrap items-center justify-between gap-5 p-6">
        <div className="flex items-center gap-4">
          <Avatar name={member.name} size="lg" />
          <div>
            <h1 className="text-2xl font-semibold tracking-[-0.01em] text-ink">
              {member.name}
            </h1>
            <p className="mt-0.5 text-sm text-ink-muted">{member.title}</p>
            <p className="mt-1.5 flex items-center gap-1.5 text-[13px] text-ink-faint">
              <MailIcon className="h-3.5 w-3.5" />
              {member.email}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xs uppercase tracking-wide text-ink-faint">
            This week ({weekLabel(currentWeekStart())})
          </p>
          <div className="mt-1.5 flex justify-end">
            <StatusBadge status={thisWeek ? thisWeek.status : "not_started"} />
          </div>
        </div>
      </Panel>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="rounded-xl border border-line bg-surface p-4 shadow-card"
          >
            <p className="text-[13px] text-ink-muted">{metric.label}</p>
            <p className="mt-2 text-2xl font-semibold tnum tracking-tight text-ink">
              {metric.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.3fr_1fr]">
        <Panel>
          <PanelHeader
            title="Task completion trend"
            description="Their last six weeks."
          />
          <div className="px-3 py-4">
            <TasksTrendChart data={trend} />
          </div>
        </Panel>
        <Panel>
          <PanelHeader
            title="Projects"
            description="Where they are assigned."
          />
          {memberProjects.length === 0 ? (
            <p className="px-5 py-5 text-[13px] text-ink-muted">
              Not assigned to any project yet.
            </p>
          ) : (
            <ul className="divide-y divide-line">
              {memberProjects.map((project) => (
                <li key={project.id} className="px-5 py-3.5">
                  <p className="text-[13px] font-medium text-ink">
                    {project.name}
                  </p>
                  <p className="mt-0.5 text-[13px] text-ink-muted">
                    {project.description}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <Panel>
        <PanelHeader
          title="Report history"
          description={`${own.length} report${own.length === 1 ? "" : "s"} filed`}
        />

        <ReportsTable
          reports={own}
          users={users}
          projects={projects}
          emptyTitle="No reports yet"
          emptyDescription={`${member.name.split(" ")[0]} has not filed a weekly report.`}
        />
      </Panel>
    </div>
  );
}
