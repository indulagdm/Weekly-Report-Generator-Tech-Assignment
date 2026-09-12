import React, { useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { ArrowLeftIcon, GavelIcon, PencilIcon } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useData } from "../contexts/DataContext";
import { canEditReport, currentVersion } from "../utils/reports";
import { formatDateTime, weekLabel } from "../utils/date";
import { PageHeader } from "../components/ui/PageHeader";
import { Panel, PanelHeader } from "../components/ui/Panel";
import { Button } from "../components/ui/Button";
import { StatusBadge } from "../components/ui/StatusBadge";
import { Avatar } from "../components/ui/Avatar";
import { ReportContentView } from "../components/reports/ReportContentView";
import { VersionHistory } from "../components/reports/VersionHistory";
import { ReviewHistory } from "../components/reports/ReviewHistory";
import { CorrectionBanner } from "../components/reports/CorrectionBanner";
export function ReportDetail() {
  const { reportId } = useParams();
  const navigate = useNavigate();
  const { user, isManager } = useAuth();
  const { getReport, getUser, getProject, commentsFor, users } = useData();
  const report = reportId ? getReport(reportId) : undefined;
  const [selectedVersion, setSelectedVersion] = useState(null);
  const comments = useMemo(
    () => (report ? commentsFor(report.id) : []),
    [report, commentsFor],
  );
  if (!report) return <Navigate to="/" replace />;
  const isOwner = report.userId === user?.id;
  if (!isOwner && !isManager) {
    // Row-level access control: team members can only read their own reports.
    return (
      <div className="mx-auto max-w-md py-20 text-center">
        <h1 className="text-lg font-semibold text-ink">Not available</h1>
        <p className="mt-2 text-sm text-ink-muted">
          You can only view your own reports. Ask your manager if you need
          access to this one.
        </p>
        <Button className="mt-5" onClick={() => navigate("/my-reports")}>
          Back to my reports
        </Button>
      </div>
    );
  }
  const versions = report.versions ?? [];
  const activeNumber = selectedVersion ?? report.currentVersionNumber;
  const version =
    versions.find((v) => v.versionNumber === activeNumber) ??
    currentVersion(report);
  const author = getUser(report.userId);
  const project = getProject(report.projectId);
  const correction =
    report.status === "needs_correction" ? comments[0] : undefined;
  const isHistorical = activeNumber !== report.currentVersionNumber;
  if (!versions.length) {
    return (
      <div className="mx-auto max-w-md py-20 text-center">
        <h1 className="text-lg font-semibold text-ink">Report is loading</h1>
        <p className="mt-2 text-sm text-ink-muted">
          The report content is not available yet. Return to the report list and try again.
        </p>
        <Button className="mt-5" onClick={() => navigate(isManager ? "/team" : "/my-reports")}>
          Back to reports
        </Button>
      </div>
    );
  }
  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={() => navigate(isManager ? "/team" : "/my-reports")}
        className="inline-flex items-center gap-1.5 text-[13px] text-ink-muted transition-colors duration-150 ease-out hover:text-ink"
      >
        <ArrowLeftIcon className="h-3.5 w-3.5" />
        {isManager ? "Team reports" : "My reports"}
      </button>

      <PageHeader
        eyebrow={project?.name}
        title={`Week of ${weekLabel(report.weekStartDate)}`}
        description={
          version.submittedAt
            ? `Version ${version.versionNumber} submitted ${formatDateTime(version.submittedAt)}`
            : `Version ${version.versionNumber} — not submitted yet`
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={report.status} />
            {isOwner && canEditReport(report) ? (
              <Button
                variant="primary"
                onClick={() => navigate(`/reports/${report.id}/edit`)}
              >
                <PencilIcon className="h-4 w-4" />
                {report.status === "needs_correction"
                  ? "Make corrections"
                  : "Continue editing"}
              </Button>
            ) : null}
            {isManager && report.status === "submitted" ? (
              <Button
                variant="accent"
                onClick={() => navigate(`/review/${report.id}`)}
              >
                <GavelIcon className="h-4 w-4" />
                Review this report
              </Button>
            ) : null}
          </div>
        }
      />

      <Panel className="flex flex-wrap items-center gap-x-8 gap-y-3 px-5 py-4">
        <div className="flex items-center gap-2.5">
          <Avatar name={author?.name ?? "—"} size="sm" />
          <div className="leading-tight">
            <p className="text-[13px] font-medium text-ink">{author?.name}</p>
            <p className="text-2xs text-ink-faint">{author?.title}</p>
          </div>
        </div>
        <div>
          <p className="text-2xs uppercase tracking-wide text-ink-faint">
            Project
          </p>
          <p className="mt-0.5 text-[13px] text-ink-soft">
            {project?.name ?? "—"}
          </p>
        </div>
        <div>
          <p className="text-2xs uppercase tracking-wide text-ink-faint">
            Versions
          </p>
          <p className="mt-0.5 text-[13px] text-ink-soft">
            {report.versions.length}
          </p>
        </div>
        <div>
          <p className="text-2xs uppercase tracking-wide text-ink-faint">
            Last updated
          </p>
          <p className="mt-0.5 text-[13px] text-ink-soft">
            {formatDateTime(report.updatedAt)}
          </p>
        </div>
        {isManager && author ? (
          <Link
            to={`/team/members/${author.id}`}
            className="ml-auto text-[13px] font-medium text-accent hover:underline"
          >
            View {author.name.split(" ")[0]}'s history
          </Link>
        ) : null}
      </Panel>

      {correction ? (
        <CorrectionBanner
          comment={correction}
          reviewer={getUser(correction.reviewerId)}
        />
      ) : null}

      {isHistorical ? (
        <div className="rounded-xl border border-line-strong bg-subtle px-5 py-3 text-[13px] text-ink-soft">
          You are viewing version {activeNumber} — an earlier snapshot kept for
          the review trail.{" "}
          <button
            type="button"
            onClick={() => setSelectedVersion(report.currentVersionNumber)}
            className="font-medium text-accent hover:underline"
          >
            Back to the current version
          </button>
        </div>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0">
          <ReportContentView version={version} />
        </div>

        <div className="space-y-5">
          <Panel>
            <PanelHeader
              title="Version history"
              description="Each correction cycle keeps its own snapshot."
            />

            <VersionHistory
              report={report}
              comments={comments}
              selected={activeNumber}
              onSelect={setSelectedVersion}
            />
          </Panel>

          <Panel>
            <PanelHeader
              title="Review history"
              description="Every comment, oldest at the bottom."
            />
            <ReviewHistory
              comments={comments}
              users={users}
              emptyLabel="This report has not been reviewed yet."
            />
          </Panel>
        </div>
      </div>
    </div>
  );
}
