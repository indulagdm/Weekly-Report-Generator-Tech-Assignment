import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { api } from "../apis/api";
import { useAuth } from "./AuthContext";

const DataContext = createContext(null);

const mapUser = (user) => user && ({
  ...user,
  isActive: user.is_active ?? user.isActive ?? true,
  createdAt: user.created_at ?? user.createdAt,
});

const mapProject = (project) => project && ({
  ...project,
  isActive: project.is_active ?? project.isActive ?? true,
  memberIds: project.memberIds ?? project.members?.map((member) => member.id) ?? [],
  createdAt: project.created_at ?? project.createdAt,
});

const mapTask = (task) => ({
  ...task,
  taskName: task.task_name ?? task.taskName ?? "",
  plannedPercent: task.planned_percent ?? task.plannedPercent ?? 0,
  actualPercent: task.actual_percent ?? task.actualPercent ?? 0,
  timePlannedHours: task.time_planned_hours ?? task.timePlannedHours ?? 0,
  timeSpentHours: task.time_spent_hours ?? task.timeSpentHours ?? 0,
  outputDeliverable: task.output_deliverable ?? task.outputDeliverable ?? "",
});

const mapVersion = (version) => ({
  ...version,
  versionNumber: version.version_number ?? version.versionNumber,
  submittedAt: version.submitted_at ?? version.submittedAt,
  createdAt: version.created_at ?? version.createdAt,
  tasks: (version.tasks ?? []).map(mapTask),
  blockers: (version.blockers ?? []).map((item) => ({
    ...item,
    isKeyIssue: item.is_key_issue ?? item.isKeyIssue ?? false,
  })),
  achievements: (version.achievements ?? []).map((item) => ({
    ...item,
    isKeyAchievement: item.is_key_achievement ?? item.isKeyAchievement ?? false,
  })),
  hours: (version.hours ?? version.hours_breakdown ?? []).map((item) => ({
    ...item,
    taskType: item.task_type ?? item.taskType,
  })),
  tasksPlannedNextWeek: version.tasks_planned_next_week ?? version.tasksPlannedNextWeek ?? "",
});

const mapReport = (report) => report && ({
  ...report,
  userId: report.user_id ?? report.userId,
  projectId: report.project_id ?? report.projectId,
  weekStartDate: report.week_start_date ?? report.weekStartDate,
  weekEndDate: report.week_end_date ?? report.weekEndDate,
  currentVersionNumber: report.current_version_number ?? report.currentVersionNumber ?? 1,
  createdAt: report.created_at ?? report.createdAt,
  updatedAt: report.updated_at ?? report.updatedAt,
  submittedAt: report.submitted_at ?? report.submittedAt,
  versions: (report.versions ?? []).map(mapVersion),
});

const contentPayload = (content) => ({
  notes: content.notes,
  links: content.links,
  tasks_planned_next_week: content.tasksPlannedNextWeek,
  tasks: content.tasks?.map((task) => ({
    task_name: task.taskName,
    priority: task.priority,
    planned_percent: task.plannedPercent,
    actual_percent: task.actualPercent,
    status: task.status,
    time_planned_hours: task.timePlannedHours,
    time_spent_hours: task.timeSpentHours,
    output_deliverable: task.outputDeliverable,
  })),
  blockers: content.blockers?.map((item) => ({
    description: item.description,
    is_key_issue: item.isKeyIssue,
  })),
  achievements: content.achievements?.map((item) => ({
    description: item.description,
    is_key_achievement: item.isKeyAchievement,
  })),
  hours_breakdown: content.hours?.map((item) => ({
    task_type: item.taskType,
    hours: item.hours,
  })),
});

async function loadReports(user) {
  const list = user.role === "manager"
    ? await api.review.list({ limit: 100 })
    : await api.reports.list({ limit: 100 });
  const rows = Array.isArray(list) ? list : [];
  const details = await Promise.all(rows.map((report) => (
    user.role === "manager" ? api.review.get(report.id) : api.reports.get(report.id)
  ).catch(() => report)));
  return details.map(mapReport);
}

export function DataProvider({ children }) {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [reports, setReports] = useState([]);
  const [comments, setComments] = useState([]);

  const reload = useCallback(async () => {
    if (!user) {
      setUsers([]);
      setProjects([]);
      setReports([]);
      setComments([]);
      return;
    }
    const [projectResult, reportResult, userResult] = await Promise.allSettled([
      api.projects.list({ is_active: true, limit: 100 }),
      loadReports(user),
      user.role === "manager" ? api.users.list({ limit: 100 }) : Promise.resolve([user]),
    ]);
    if (projectResult.status === "fulfilled") {
      const projectRows = Array.isArray(projectResult.value) ? projectResult.value : [];
      const fullProjects = await Promise.all(projectRows.map((project) => api.projects.get(project.id).catch(() => project)));
      setProjects(fullProjects.map(mapProject));
    }
    if (reportResult.status === "fulfilled") setReports(reportResult.value);
    if (userResult.status === "fulfilled") setUsers(userResult.value.map(mapUser));
  }, [user]);

  useEffect(() => { reload(); }, [reload]);

  const getUser = useCallback((id) => users.find((item) => item.id === id), [users]);
  const getProject = useCallback((id) => projects.find((item) => item.id === id), [projects]);
  const getReport = useCallback((id) => reports.find((item) => item.id === id), [reports]);
  const commentsFor = useCallback(
    (reportId) => comments
      .filter((item) => item.reportId === reportId || item.report_id === reportId)
      .sort((a, b) => (b.createdAt ?? b.created_at ?? "").localeCompare(a.createdAt ?? a.created_at ?? "")),
    [comments],
  );
  const latestComment = useCallback((reportId) => commentsFor(reportId)[0], [commentsFor]);

  const createReport = useCallback(async (input) => {
    const report = await api.reports.create({
      project_id: input.projectId,
      week_start_date: input.weekStartDate,
      week_end_date: input.weekEndDate,
    });
    const mapped = mapReport(report);
    setReports((current) => [mapped, ...current]);
    return mapped;
  }, []);

  const updateReportContent = useCallback(async (id, patch) => {
    const updated = mapReport(await api.reports.update(id, contentPayload(patch)));
    setReports((current) => current.map((report) => report.id === id ? updated : report));
    return updated;
  }, []);

  const updateReportProject = useCallback(async (id, projectId) => {
    const updated = mapReport(await api.reports.update(id, { project_id: projectId }));
    setReports((current) => current.map((report) => report.id === id ? updated : report));
    return updated;
  }, []);

  const submitReport = useCallback(async (id) => {
    const updated = mapReport(await api.reports.submit(id));
    setReports((current) => current.map((report) => report.id === id ? updated : report));
    return updated;
  }, []);

  const reviewReport = useCallback(async (id, _reviewerId, action, comment) => {
    const updated = mapReport(action === "approved"
      ? await api.review.approve(id, comment)
      : await api.review.requestChanges(id, comment));
    setReports((current) => current.map((report) => report.id === id ? updated : report));
    const nextComments = await api.review.comments(id).catch(() => []);
    setComments((current) => [
      ...current.filter((item) => item.reportId !== id && item.report_id !== id),
      ...nextComments.map((item) => ({
        ...item,
        reportId: item.report_id,
        reviewerId: item.reviewer_id,
        action: item.action === "approve" ? "approved" : item.action,
        versionNumber: item.version_number,
        createdAt: item.created_at,
      })),
    ]);
    return updated;
  }, []);

  const addProject = useCallback(async (input) => {
    const created = mapProject(await api.projects.create({ name: input.name, description: input.description }));
    setProjects((current) => [...current, created]);
    return created;
  }, []);

  const updateProject = useCallback(async (id, patch) => {
    const updated = mapProject(await api.projects.update(id, {
      ...patch,
      is_active: patch.isActive ?? patch.is_active,
    }));
    setProjects((current) => current.map((project) => project.id === id ? updated : project));
    return updated;
  }, []);

  const deleteProject = useCallback(async (id) => {
    await api.projects.remove(id);
    setProjects((current) => current.filter((project) => project.id !== id));
  }, []);

  const toggleProjectMember = useCallback(async (projectId, userId) => {
    const project = projects.find((item) => item.id === projectId);
    const assigned = project?.memberIds.includes(userId);
    if (assigned) await api.projects.unassign(projectId, userId);
    else await api.projects.assign(projectId, userId);
    const updated = mapProject(await api.projects.get(projectId));
    setProjects((current) => current.map((project) => project.id === projectId ? updated : project));
  }, [projects]);

  const inviteUser = useCallback(async (input) => {
    const created = mapUser(await api.users.create({ ...input, password: input.password || "Password123!" }));
    setUsers((current) => [...current, created]);
    return created;
  }, []);

  const updateUser = useCallback(async (id, patch) => {
    const updated = mapUser(await api.users.update(id, {
      ...patch,
      is_active: patch.isActive ?? patch.is_active,
    }));
    setUsers((current) => current.map((item) => item.id === id ? updated : item));
    return updated;
  }, []);

  const value = useMemo(() => ({
    users,
    projects,
    reports,
    comments,
    getUser,
    getProject,
    getReport,
    commentsFor,
    latestComment,
    createReport,
    updateReportContent,
    updateReportProject,
    submitReport,
    reviewReport,
    addProject,
    updateProject,
    deleteProject,
    toggleProjectMember,
    inviteUser,
    updateUser,
  }), [users, projects, reports, comments, getUser, getProject, getReport, commentsFor, latestComment, createReport, updateReportContent, updateReportProject, submitReport, reviewReport, addProject, updateProject, deleteProject, toggleProjectMember, inviteUser, updateUser]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) throw new Error("useData must be used within a DataProvider");
  return context;
}
