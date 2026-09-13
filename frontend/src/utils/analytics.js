import { currentVersion } from "./reports";
import { recentWeekStarts, shortWeekLabel } from "./date";
export function summaryFor(reports, users, weekStartDate) {
  const members = users.filter((u) => u.role === "team_member" && u.isActive);
  const weekReports = reports.filter((r) => r.weekStartDate === weekStartDate);
  const counted = weekReports.filter((r) =>
    ["submitted", "needs_correction", "approved"].includes(r.status),
  );
  const openBlockers = weekReports
    .filter((r) => r.status !== "approved")
    .reduce((sum, r) => sum + currentVersion(r).blockers.length, 0);
  return {
    submitted: weekReports.filter((r) => r.status === "submitted").length,
    totalMembers: members.length,
    complianceRate: members.length
      ? Math.round((counted.length / members.length) * 100)
      : 0,
    pending: Math.max(members.length - counted.length, 0),
    needsCorrection: weekReports.filter((r) => r.status === "needs_correction")
      .length,
    approved: weekReports.filter((r) => r.status === "approved").length,
    openBlockers,
  };
}
export function tasksTrend(reports, weeksCount = 6) {
  return recentWeekStarts(weeksCount).map((week) => {
    const weekReports = reports.filter((r) => r.weekStartDate === week);
    let completed = 0;
    let total = 0;
    weekReports.forEach((r) => {
      const v = currentVersion(r);
      total += v.tasks.length;
      completed += v.tasks.filter((t) => t.status === "done").length;
    });
    return { week: shortWeekLabel(week), completed, total };
  });
}
export function statusByMember(reports, users, weekStartDate) {
  return users
    .filter((u) => u.role === "team_member" && u.isActive)
    .map((u) => {
      const report = reports.find(
        (r) => r.userId === u.id && r.weekStartDate === weekStartDate,
      );
      return {
        userId: u.id,
        name: u.name,
        status: report ? report.status : "not_started",
        reportId: report?.id,
      };
    });
}
export function workloadByProject(reports, projects, weekStartDate) {
  return projects
    .map((p) => {
      const weekReports = reports.filter(
        (r) => r.projectId === p.id && r.weekStartDate === weekStartDate,
      );
      let tasks = 0;
      let hours = 0;
      weekReports.forEach((r) => {
        const v = currentVersion(r);
        tasks += v.tasks.length;
        hours += v.tasks.reduce((s, t) => s + t.timeSpentHours, 0);
      });
      return { project: p.name.replace(/^Client A — /, ""), tasks, hours };
    })
    .filter((row) => row.tasks > 0);
}
export function hoursByType(reports, weekStartDate) {
  const totals = new Map();
  reports
    .filter((r) => r.weekStartDate === weekStartDate)
    .forEach((r) => {
      currentVersion(r).hours.forEach((h) => {
        totals.set(h.taskType, (totals.get(h.taskType) ?? 0) + Number(h.hours));
      });
    });
  return Array.from(totals.entries())
    .map(([type, hours]) => ({ type, hours }))
    .sort((a, b) => b.hours - a.hours);
}
export function activityFeed(reports, comments, users, limit = 12) {
  const items = [];
  const name = (id) => users.find((u) => u.id === id)?.name ?? "Someone";
  reports.forEach((r) => {
    (r.versions ?? []).forEach((v) => {
      if (!v.submittedAt) return;
      items.push({
        id: `${r.id}-v${v.versionNumber}-sub`,
        kind: "report_submitted",
        reportId: r.id,
        userId: r.userId,
        actorId: r.userId,
        label: `${name(r.userId)} submitted a report`,
        detail:
          v.versionNumber > 1
            ? `Resubmitted as version ${v.versionNumber}`
            : "Version 1",
        at: v.submittedAt,
      });
    });
  });
  comments.forEach((c) => {
    items.push({
      id: c.id,
      kind: "review_action",
      reportId: c.reportId,
      userId: reports.find((r) => r.id === c.reportId)?.userId ?? "",
      actorId: c.reviewerId,
      label:
        c.action === "approved"
          ? `${name(c.reviewerId)} approved ${name(reports.find((r) => r.id === c.reportId)?.userId ?? "")}'s report`
          : `${name(c.reviewerId)} requested changes on ${name(reports.find((r) => r.id === c.reportId)?.userId ?? "")}'s report`,
      detail: c.comment,
      at: c.createdAt,
    });
  });
  return items.sort((a, b) => b.at.localeCompare(a.at)).slice(0, limit);
}
export function memberStats(reports, userId) {
  const own = reports.filter((r) => r.userId === userId);
  const versions = own.map(currentVersion);
  const tasks = versions.flatMap((v) => v.tasks);
  const totalHours = versions.flatMap((v) => v.hours).reduce((s, h) => s + Number(h.hours), 0);
  const wholeHours = Math.floor(totalHours);
  const minutes = Math.round((totalHours - wholeHours) * 60);
  const corrections = own.filter(
    (r) => (r.versions?.length ?? 0) > 1 || r.status === "needs_correction",
  ).length;
  return {
    totalReports: own.length,
    approved: own.filter((r) => r.status === "approved").length,
    corrections,
    tasksCompleted: tasks.filter((t) => t.status === "done").length,
    tasksTotal: tasks.length,
    hoursLogged: `${wholeHours}h ${minutes}m`,
  };
}
