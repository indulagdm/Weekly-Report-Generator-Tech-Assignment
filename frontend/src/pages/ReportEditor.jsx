import React, { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { ArrowLeftIcon, GitBranchIcon, SaveIcon, SendIcon } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useData } from "../contexts/DataContext";
import { canEditReport, currentVersion } from "../utils/reports";
import { weekLabel } from "../utils/date";
import { PageHeader } from "../components/ui/PageHeader";
import { Panel } from "../components/ui/Panel";
import { Button } from "../components/ui/Button";
import { Select } from "../components/ui/Field";
import { StatusBadge } from "../components/ui/StatusBadge";
import { ReportForm } from "../components/reports/ReportForm";
import { CorrectionBanner } from "../components/reports/CorrectionBanner";
import { useToast } from "../components/ui/Toast";
export function ReportEditor() {
  const { reportId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    getReport,
    getUser,
    projects,
    latestComment,
    updateReportContent,
    updateReportProject,
    submitReport,
  } = useData();
  const { notify } = useToast();
  const report = reportId ? getReport(reportId) : undefined;
  const version = report ? currentVersion(report) : undefined;
  const [draft, setDraft] = useState(null);
  const [errors, setErrors] = useState({});
  const [dirty, setDirty] = useState(false);
  useEffect(() => {
    if (!version) return;
    setDraft({
      tasks: version.tasks,
      blockers: version.blockers,
      achievements: version.achievements,
      hours: version.hours,
      tasksPlannedNextWeek: version.tasksPlannedNextWeek,
      notes: version.notes,
      links: version.links,
    });
    setDirty(false);
    // Reload the working copy when the report or its live version changes.
  }, [report?.id, report?.currentVersionNumber]);
  const correction = useMemo(
    () =>
      report && report.status === "needs_correction"
        ? latestComment(report.id)
        : undefined,
    [report, latestComment],
  );
  if (!report || !version) {
    return <Navigate to="/my-reports" replace />;
  }
  if (report.userId !== user?.id) {
    // Row-level access: only the owning team member may edit content.
    return <Navigate to={`/reports/${report.id}`} replace />;
  }
  if (!canEditReport(report)) {
    return <Navigate to={`/reports/${report.id}`} replace />;
  }
  if (!draft) return null;
  const willBranch = Boolean(version.submittedAt);
  const patch = (next) => {
    setDraft((prev) => (prev ? { ...prev, ...next } : prev));
    setDirty(true);
  };
  const validate = (forSubmit) => {
    const next = {};
    if (draft.tasks.length === 0) {
      next.tasks = "Add at least one task before submitting.";
    } else if (draft.tasks.some((t) => !t.taskName.trim())) {
      next.tasks = "Every task needs a name.";
    }
    if (forSubmit && !draft.tasksPlannedNextWeek.trim()) {
      next.next = "Tell your manager what is planned for next week.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };
  const save = () => {
    if (!validate(false)) return false;
    updateReportContent(report.id, draft);
    setDirty(false);
    notify(
      willBranch
        ? `Saved as version ${report.currentVersionNumber + 1}`
        : "Draft saved",
    );
    return true;
  };
  const submit = () => {
    if (!validate(true)) return;
    updateReportContent(report.id, draft);
    submitReport(report.id);
    notify("Report submitted for review");
    navigate(`/reports/${report.id}`);
  };
  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={() => navigate("/my-reports")}
        className="inline-flex items-center gap-1.5 text-[13px] text-ink-muted transition-colors duration-150 ease-out hover:text-ink"
      >
        <ArrowLeftIcon className="h-3.5 w-3.5" />
        My reports
      </button>

      <PageHeader
        eyebrow={`Week of ${weekLabel(report.weekStartDate)}`}
        title={
          report.status === "needs_correction"
            ? "Correct your report"
            : "Weekly report"
        }
        description="The template is fixed for everyone on the team so reports stay comparable."
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge status={report.status} />
            <Button onClick={save} disabled={!dirty}>
              <SaveIcon className="h-4 w-4" />
              Save
            </Button>
            <Button variant="primary" onClick={submit}>
              <SendIcon className="h-4 w-4" />
              {report.status === "needs_correction"
                ? "Resubmit"
                : "Submit for review"}
            </Button>
          </div>
        }
      />

      {correction ? (
        <CorrectionBanner
          comment={correction}
          reviewer={getUser(correction.reviewerId)}
        />
      ) : null}

      {willBranch ? (
        <div className="flex items-start gap-3 rounded-xl border border-line bg-surface px-5 py-3.5 shadow-card">
          <GitBranchIcon className="mt-0.5 h-4 w-4 shrink-0 text-ink-muted" />
          <p className="text-[13px] text-ink-soft">
            Version {report.currentVersionNumber} has already been reviewed.
            Saving keeps it intact and starts{" "}
            <span className="font-medium text-ink">
              version {report.currentVersionNumber + 1}
            </span>{" "}
            with your changes.
          </p>
        </div>
      ) : null}

      <Panel className="flex flex-wrap items-center gap-4 px-5 py-4">
        <div className="min-w-[220px] flex-1">
          <label
            htmlFor="report-project"
            className="block text-[13px] font-medium text-ink-soft"
          >
            Project / category
          </label>
          <Select
            id="report-project"
            className="mt-1.5"
            value={report.projectId}
            onChange={(e) => updateReportProject(report.id, e.target.value)}
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="min-w-[220px] flex-1">
          <p className="text-[13px] font-medium text-ink-soft">
            Week / date range
          </p>
          <p className="mt-3 text-sm text-ink">
            {weekLabel(report.weekStartDate)}
          </p>
        </div>
        <div className="min-w-[160px]">
          <p className="text-[13px] font-medium text-ink-soft">Working on</p>
          <p className="mt-3 text-sm text-ink">
            Version {report.currentVersionNumber}
          </p>
        </div>
      </Panel>

      <ReportForm value={draft} onChange={patch} errors={errors} />

      <div className="flex flex-wrap justify-end gap-2 pb-4">
        <Button onClick={save} disabled={!dirty}>
          <SaveIcon className="h-4 w-4" />
          Save changes
        </Button>
        <Button variant="primary" onClick={submit}>
          <SendIcon className="h-4 w-4" />
          {report.status === "needs_correction"
            ? "Resubmit for review"
            : "Submit for review"}
        </Button>
      </div>
    </div>
  );
}
