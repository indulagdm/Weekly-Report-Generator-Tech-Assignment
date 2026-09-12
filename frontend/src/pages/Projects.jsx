import React, { useMemo, useState } from "react";
import { PencilIcon, PlusIcon, Trash2Icon, UsersIcon } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useData } from "../contexts/DataContext";
import { currentVersion } from "../utils/reports";
import { PageHeader } from "../components/ui/PageHeader";
import { Panel, PanelHeader } from "../components/ui/Panel";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { Field, TextArea, TextInput } from "../components/ui/Field";
import { Avatar } from "../components/ui/Avatar";
import { useToast } from "../components/ui/Toast";
import { cn } from "../utils/cn";
export function Projects() {
  const { isManager } = useAuth();
  const {
    projects,
    users,
    reports,
    addProject,
    updateProject,
    deleteProject,
    toggleProjectMember,
  } = useData();
  const { notify } = useToast();
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);
  const [assigningId, setAssigningId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState(null);
  const usage = useMemo(() => {
    const map = new Map();
    reports.forEach((report) => {
      const entry = map.get(report.projectId) ?? { reports: 0, tasks: 0 };
      entry.reports += 1;
      entry.tasks += currentVersion(report).tasks.length;
      map.set(report.projectId, entry);
    });
    return map;
  }, [reports]);
  const openCreate = () => {
    setName("");
    setDescription("");
    setError(null);
    setCreating(true);
  };
  const openEdit = (project) => {
    setName(project.name);
    setDescription(project.description);
    setError(null);
    setEditing(project);
  };
  const save = () => {
    if (name.trim().length < 2) {
      setError("Give the project a name.");
      return;
    }
    if (editing) {
      updateProject(editing.id, {
        name: name.trim(),
        description: description.trim(),
      });
      notify("Project updated");
      setEditing(null);
    } else {
      addProject({ name: name.trim(), description: description.trim() });
      notify("Project created");
      setCreating(false);
    }
  };
  const members = users.filter((u) => u.role === "team_member" && u.isActive);
  const assigning = projects.find((project) => project.id === assigningId);
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Configuration"
        title="Projects & categories"
        description="Every weekly report is tagged to one of these, which is what makes the dashboard comparable."
        actions={
          isManager ? (
            <Button variant="primary" onClick={openCreate}>
              <PlusIcon className="h-4 w-4" />
              New project
            </Button>
          ) : null
        }
      />

      <Panel>
        <PanelHeader
          title="All projects"
          description={`${projects.length} active categor${projects.length === 1 ? "y" : "ies"}`}
        />

        <ul className="divide-y divide-line">
          {projects.map((project) => {
            const stats = usage.get(project.id) ?? { reports: 0, tasks: 0 };
            const assigned = users.filter((u) =>
              project.memberIds.includes(u.id),
            );
            return (
              <li
                key={project.id}
                className="flex flex-wrap items-start gap-4 px-5 py-4"
              >
                <div className="min-w-[240px] flex-1">
                  <p className="text-sm font-medium text-ink">{project.name}</p>
                  <p className="mt-0.5 text-[13px] text-ink-muted">
                    {project.description}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-4 text-2xs text-ink-faint">
                    <span className="tnum">{stats.reports} reports</span>
                    <span className="tnum">{stats.tasks} tasks logged</span>
                  </div>
                </div>

                <div className="flex min-w-[160px] items-center gap-1.5">
                  {assigned.length ? (
                    assigned
                      .slice(0, 4)
                      .map((member) => (
                        <Avatar key={member.id} name={member.name} size="sm" />
                      ))
                  ) : (
                    <span className="text-[13px] text-ink-faint">
                      No members assigned
                    </span>
                  )}
                  {assigned.length > 4 ? (
                    <span className="text-2xs text-ink-faint">
                      +{assigned.length - 4}
                    </span>
                  ) : null}
                </div>

                {isManager ? (
                  <div className="flex shrink-0 items-center gap-1.5">
                    <Button size="sm" onClick={() => setAssigningId(project.id)}>
                      <UsersIcon className="h-4 w-4" />
                      Members
                    </Button>
                    <Button size="sm" onClick={() => openEdit(project)}>
                      <PencilIcon className="h-4 w-4" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => setConfirmDelete(project)}
                      aria-label={`Delete ${project.name}`}
                    >
                      <Trash2Icon className="h-4 w-4" />
                    </Button>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      </Panel>

      <Modal
        open={creating || Boolean(editing)}
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
        title={editing ? "Edit project" : "New project"}
        description="Projects group weekly reports so workload can be compared across the team."
        footer={
          <>
            <Button
              onClick={() => {
                setCreating(false);
                setEditing(null);
              }}
            >
              Cancel
            </Button>
            <Button variant="primary" onClick={save}>
              {editing ? "Save changes" : "Create project"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field
            label="Name"
            htmlFor="project-name"
            required
            error={error ?? undefined}
          >
            <TextInput
              id="project-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Client B — Onboarding"
            />
          </Field>
          <Field label="Description" htmlFor="project-description">
            <TextArea
              id="project-description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What this project covers"
            />
          </Field>
        </div>
      </Modal>

      <Modal
        open={Boolean(assigning)}
        onClose={() => setAssigningId(null)}
        title={`Members — ${assigning?.name ?? ""}`}
        description="Assign the people who report against this project."
        footer={
          <Button variant="primary" onClick={() => setAssigningId(null)}>
            Done
          </Button>
        }
      >
        <ul className="space-y-1.5">
          {members.map((member) => {
            const active = Boolean(assigning?.memberIds.includes(member.id));
            return (
              <li key={member.id}>
                <button
                  type="button"
                  onClick={() =>
                    assigning && toggleProjectMember(assigning.id, member.id)
                  }
                  aria-pressed={active}
                  className={cn(
                    "flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors duration-150 ease-out",
                    active
                      ? "border-accent/40 bg-accent-soft"
                      : "border-line hover:border-line-strong",
                  )}
                >
                  <span className="flex items-center gap-2.5">
                    <Avatar name={member.name} size="sm" />
                    <span className="leading-tight">
                      <span className="block text-[13px] font-medium text-ink">
                        {member.name}
                      </span>
                      <span className="block text-2xs text-ink-faint">
                        {member.title}
                      </span>
                    </span>
                  </span>
                  <span
                    className={cn(
                      "text-2xs font-semibold uppercase tracking-wide",
                      active ? "text-accent" : "text-ink-faint",
                    )}
                  >
                    {active ? "Remove" : "Add"}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </Modal>

      <Modal
        open={Boolean(confirmDelete)}
        onClose={() => setConfirmDelete(null)}
        title={`Delete ${confirmDelete?.name ?? ""}?`}
        description="Existing reports keep their history, but they will no longer show a project."
        footer={
          <>
            <Button onClick={() => setConfirmDelete(null)}>Cancel</Button>
            <Button
              variant="danger"
              onClick={() => {
                if (confirmDelete) deleteProject(confirmDelete.id);
                notify("Project deleted", "info");
                setConfirmDelete(null);
              }}
            >
              Delete project
            </Button>
          </>
        }
      >
        <p className="text-[13px] text-ink-soft">
          This cannot be undone from the UI. Consider editing the project
          instead if it is only being renamed.
        </p>
      </Modal>
    </div>
  );
}
