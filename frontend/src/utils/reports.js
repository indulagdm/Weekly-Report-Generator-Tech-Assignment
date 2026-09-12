import { makeId } from "./id";
export function currentVersion(report) {
  if (!report?.versions?.length) return emptyContent();
  return (
    report.versions.find(
      (v) => v.versionNumber === report.currentVersionNumber,
    ) ?? report.versions[report.versions.length - 1]
  );
}
export function emptyContent() {
  return {
    tasks: [],
    blockers: [],
    achievements: [],
    hours: [],
    tasksPlannedNextWeek: "",
    notes: "",
    links: "",
  };
}
function cloneContent(version) {
  return {
    tasks: version.tasks.map((t) => ({ ...t, id: makeId("task") })),
    blockers: version.blockers.map((b) => ({ ...b, id: makeId("blk") })),
    achievements: version.achievements.map((a) => ({
      ...a,
      id: makeId("ach"),
    })),
    hours: version.hours.map((h) => ({ ...h, id: makeId("hrs") })),
    tasksPlannedNextWeek: version.tasksPlannedNextWeek,
    notes: version.notes,
    links: version.links,
  };
}
/**
 * Mirrors the backend `report.service.js` rule:
 * editing a version that has already been submitted/reviewed clones it into a
 * new version first, so the reviewed content stays intact. Missing keys in the
 * patch are left untouched (never cleared).
 */
export function applyContentEdit(report, patch) {
  const current = currentVersion(report);
  const now = new Date().toISOString();
  if (current.submittedAt) {
    const nextNumber = report.currentVersionNumber + 1;
    const cloned = cloneContent(current);
    const newVersion = {
      ...cloned,
      ...patch,
      id: makeId("ver"),
      versionNumber: nextNumber,
      submittedAt: null,
      createdAt: now,
    };
    return {
      ...report,
      versions: [...report.versions, newVersion],
      currentVersionNumber: nextNumber,
      updatedAt: now,
    };
  }
  return {
    ...report,
    versions: report.versions.map((v) =>
      v.versionNumber === current.versionNumber ? { ...v, ...patch } : v,
    ),
    updatedAt: now,
  };
}
export function canEditReport(report) {
  return report.status === "draft" || report.status === "needs_correction";
}
export function totalPlannedHours(hours) {
  return hours.reduce((sum, h) => sum + (Number(h.hours) || 0), 0);
}
export function taskCompletion(tasks) {
  return {
    done: tasks.filter((t) => t.status === "done").length,
    total: tasks.length,
  };
}
export function timeSpent(tasks) {
  return tasks.reduce((sum, t) => sum + (Number(t.timeSpentHours) || 0), 0);
}
