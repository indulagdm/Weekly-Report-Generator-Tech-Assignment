import React, { useMemo, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { ArrowLeftIcon, CheckCircle2Icon, RotateCcwIcon } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useData } from "../contexts/DataContext";
import { formatDateTime, weekLabel } from "../utils/date";
import { PageHeader } from "../components/ui/PageHeader";
import { Panel, PanelHeader } from "../components/ui/Panel";
import { Button } from "../components/ui/Button";
import { StatusBadge } from "../components/ui/StatusBadge";
import { Avatar } from "../components/ui/Avatar";
import { Field, TextArea } from "../components/ui/Field";
import { ReportContentView } from "../components/reports/ReportContentView";
import { VersionHistory } from "../components/reports/VersionHistory";
import { ReviewHistory } from "../components/reports/ReviewHistory";
import { useToast } from "../components/ui/Toast";
export function ReviewReport() {
  const { reportId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getReport, getUser, getProject, commentsFor, reviewReport, users } =
    useData();
  const { notify } = useToast();
  const report = reportId ? getReport(reportId) : undefined;
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [comment, setComment] = useState("");
  const [error, setError] = useState(null);
  const comments = useMemo(
    () => (report ? commentsFor(report.id) : []),
    [report, commentsFor],
  );
  if (!report || !user) return <Navigate to="/team" replace />;
  const activeNumber = selectedVersion ?? report.currentVersionNumber;
  const version =
    report.versions.find((v) => v.versionNumber === activeNumber) ??
    report.versions[0];
  const author = getUser(report.userId);
  const project = getProject(report.projectId);
  const reviewable = report.status === "submitted";
  const approve = () => {
    reviewReport(report.id, user.id, "approved", comment.trim());
    notify(`Approved ${author?.name.split(" ")[0]}'s report`);
    navigate(`/reports/${report.id}`);
  };
  const requestChanges = () => {
    if (comment.trim().length < 10) {
      setError("Explain what needs to change — at least a sentence.");
      return;
    }
    reviewReport(report.id, user.id, "requested_changes", comment.trim());
    notify("Sent back for correction", "info");
    navigate(`/reports/${report.id}`);
  };
  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={() => navigate("/team")}
        className="inline-flex items-center gap-1.5 text-[13px] text-ink-muted transition-colors duration-150 ease-out hover:text-ink"
      >
        <ArrowLeftIcon className="h-3.5 w-3.5" />
        Review queue
      </button>

      <PageHeader
        eyebrow="Manager review"
        title={`${author?.name ?? "Report"} — ${weekLabel(report.weekStartDate)}`}
        description={`${project?.name ?? "No project"} · version ${activeNumber} of ${report.versions.length}${version.submittedAt ? ` · submitted ${formatDateTime(version.submittedAt)}` : ""}`}
        actions={<StatusBadge status={report.status} />}
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-5">
          <ReportContentView version={version} />
        </div>

        <div className="space-y-5">
          <Panel className="overflow-hidden">
            <PanelHeader
              title="Take an action"
              description={
                reviewable
                  ? "Approve, or send it back with one clear comment."
                  : "Only submitted reports can be actioned."
              }
            />

            <div className="space-y-4 px-5 py-4">
              <div className="flex items-center gap-2.5 rounded-lg border border-line bg-subtle px-3 py-2.5">
                <Avatar name={author?.name ?? "—"} size="sm" />
                <div className="leading-tight">
                  <p className="text-[13px] font-medium text-ink">
                    {author?.name}
                  </p>
                  <p className="text-2xs text-ink-faint">{author?.title}</p>
                </div>
              </div>

              <Field
                label="Comment to the team member"
                htmlFor="review-comment"
                hint={
                  reviewable
                    ? "Required when requesting changes, optional when approving."
                    : undefined
                }
                error={error ?? undefined}
              >
                <TextArea
                  id="review-comment"
                  rows={5}
                  value={comment}
                  disabled={!reviewable}
                  onChange={(e) => {
                    setComment(e.target.value);
                    setError(null);
                  }}
                  placeholder="e.g. Please split the umbrella task into the real workstreams and flag the payments blocker."
                />
              </Field>

              <div className="flex flex-col gap-2">
                <Button
                  variant="accent"
                  disabled={!reviewable}
                  onClick={approve}
                >
                  <CheckCircle2Icon className="h-4 w-4" />
                  Approve report
                </Button>
                <Button disabled={!reviewable} onClick={requestChanges}>
                  <RotateCcwIcon className="h-4 w-4" />
                  Request changes
                </Button>
              </div>

              <p className="text-2xs leading-relaxed text-ink-faint">
                Managers can only set status and leave comments — the report
                content itself stays owned by{" "}
                {author?.name.split(" ")[0] ?? "the team member"}.
              </p>
            </div>
          </Panel>

          <Panel>
            <PanelHeader
              title="Version history"
              description="Compare against earlier submissions."
            />
            <VersionHistory
              report={report}
              comments={comments}
              selected={activeNumber}
              onSelect={setSelectedVersion}
            />
          </Panel>

          <Panel>
            <PanelHeader title="Previous review comments" />
            <ReviewHistory
              comments={comments}
              users={users}
              emptyLabel="First review of this report."
            />
          </Panel>
        </div>
      </div>
    </div>
  );
}
