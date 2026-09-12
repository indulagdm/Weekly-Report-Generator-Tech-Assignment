import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileTextIcon, PlusIcon } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useData } from "../contexts/DataContext";
import {
  currentWeekStart,
  recentWeekStarts,
  weekEndOf,
  weekLabel,
} from "../utils/date";
import { statusLabels } from "../utils/labels";
import { cn } from "../utils/cn";
import { PageHeader } from "../components/ui/PageHeader";
import { Panel, PanelHeader } from "../components/ui/Panel";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { Field, Select } from "../components/ui/Field";
import { ReportsTable } from "../components/reports/ReportsTable";
import { CorrectionBanner } from "../components/reports/CorrectionBanner";
import { useToast } from "../components/ui/Toast";
const filters = ["all", "draft", "submitted", "needs_correction", "approved"];
export function MyReports() {
  const { user } = useAuth();
  const { reports, projects, users, createReport, latestComment, getUser } =
    useData();
  const navigate = useNavigate();
  const { notify } = useToast();
  const [filter, setFilter] = useState("all");
  const [creating, setCreating] = useState(false);
  const [newWeek, setNewWeek] = useState(currentWeekStart());
  const [newProject, setNewProject] = useState(projects[0]?.id ?? "");
  const [formError, setFormError] = useState(null);
  useEffect(() => {
    if (!newProject && projects.length > 0) {
      setNewProject(projects[0].id);
    }
  }, [newProject, projects]);
  const mine = useMemo(
    () =>
      reports
        .filter((r) => r.userId === user?.id)
        .sort((a, b) => b.weekStartDate.localeCompare(a.weekStartDate)),
    [reports, user],
  );
  const visible =
    filter === "all" ? mine : mine.filter((r) => r.status === filter);
  const needsCorrection = mine.filter((r) => r.status === "needs_correction");
  const weekOptions = useMemo(() => [...recentWeekStarts(6)].reverse(), []);
  const counts = useMemo(() => {
    const map = { all: mine.length };
    mine.forEach((r) => {
      map[r.status] = (map[r.status] ?? 0) + 1;
    });
    return map;
  }, [mine]);
  const handleCreate = async () => {
    if (!user) return;
    if (!newProject) {
      setFormError("Choose a project for this report.");
      return;
    }
    if (mine.some((r) => r.weekStartDate === newWeek)) {
      setFormError(
        "You already have a report for that week — open it instead.",
      );
      return;
    }
    try {
      const report = await createReport({
        userId: user.id,
        projectId: newProject,
        weekStartDate: newWeek,
        weekEndDate: weekEndOf(newWeek),
      });
      setCreating(false);
      setFormError(null);
      notify("Draft created for " + weekLabel(newWeek));
      navigate(`/reports/${report.id}/edit`);
    } catch (error) {
      setFormError(error.message ?? "Unable to create the report.");
    }
  };
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Personal"
        title="My weekly reports"
        description="Your report history, week by week, with the status of each."
        actions={
          <Button variant="primary" onClick={() => setCreating(true)}>
            <PlusIcon className="h-4 w-4" />
            New weekly report
          </Button>
        }
      />

      {needsCorrection.map((report) => {
        const comment = latestComment(report.id);
        if (!comment) return null;
        return (
          <CorrectionBanner
            key={report.id}
            comment={comment}
            reviewer={getUser(comment.reviewerId)}
            action={
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate(`/reports/${report.id}/edit`)}
              >
                Fix {weekLabel(report.weekStartDate)}
              </Button>
            }
          />
        );
      })}

      <Panel>
        <PanelHeader
          title="Report history"
          description={`${mine.length} report${mine.length === 1 ? "" : "s"} on file`}
          actions={
            <div className="flex flex-wrap gap-1.5">
              {filters.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  aria-pressed={filter === f}
                  className={cn(
                    "rounded-full px-2.5 py-1 text-2xs font-medium transition-colors duration-150 ease-out",
                    filter === f
                      ? "bg-ink text-white"
                      : "text-ink-muted hover:bg-line/60 hover:text-ink",
                  )}
                >
                  {f === "all" ? "All" : statusLabels[f]}
                  <span className="ml-1.5 tnum opacity-60">
                    {counts[f] ?? 0}
                  </span>
                </button>
              ))}
            </div>
          }
        />

        <ReportsTable
          reports={visible}
          users={users}
          projects={projects}
          emptyTitle={
            filter === "all" ? "No reports yet" : "Nothing in this status"
          }
          emptyDescription={
            filter === "all"
              ? "Create your first weekly report to get started."
              : "Try a different filter."
          }
        />
      </Panel>

      <Modal
        open={creating}
        onClose={() => setCreating(false)}
        title="New weekly report"
        description="Pick the week and the project this report covers."
        footer={
          <>
            <Button onClick={() => setCreating(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleCreate}>
              <FileTextIcon className="h-4 w-4" />
              Create draft
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Week" htmlFor="new-week" required>
            <Select
              id="new-week"
              value={newWeek}
              onChange={(e) => setNewWeek(e.target.value)}
            >
              {weekOptions.map((w) => (
                <option key={w} value={w}>
                  {weekLabel(w)}
                  {w === currentWeekStart() ? " (current)" : ""}
                </option>
              ))}
            </Select>
          </Field>
          <Field
            label="Project / category"
            htmlFor="new-project"
            required
            error={formError ?? undefined}
          >
            <Select
              id="new-project"
              value={newProject}
              onChange={(e) => setNewProject(e.target.value)}
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </Modal>
    </div>
  );
}
