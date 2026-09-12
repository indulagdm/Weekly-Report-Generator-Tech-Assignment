import { currentVersion } from "./reports";
import { hoursByType, statusByMember, summaryFor } from "./analytics";
import { weekLabel } from "./date";
export const suggestedQuestions = [
  "Summarize this week for the team",
  "Who has not submitted yet?",
  "What are the recurring blockers?",
  "Where did our time go this week?",
];
function teamSummary(ctx) {
  const s = summaryFor(ctx.reports, ctx.users, ctx.weekStartDate);
  const weekReports = ctx.reports.filter(
    (r) => r.weekStartDate === ctx.weekStartDate,
  );
  const tasks = weekReports.flatMap((r) => currentVersion(r).tasks);
  const done = tasks.filter((t) => t.status === "done").length;
  const keyWins = weekReports
    .flatMap((r) =>
      currentVersion(r).achievements.filter((a) => a.isKeyAchievement),
    )
    .slice(0, 3);
  return [
    `Week of ${weekLabel(ctx.weekStartDate)} — ${s.submitted} submitted, ${s.approved} approved, ${s.needsCorrection} needing correction, ${s.pending} still pending (${s.complianceRate}% compliance).`,
    `The team logged ${tasks.length} tasks and closed ${done} of them.`,
    keyWins.length
      ? `Highlights: ${keyWins.map((a) => a.description).join(" · ")}`
      : "No key achievements flagged yet this week.",
  ].join("\n\n");
}
function pendingMembers(ctx) {
  const rows = statusByMember(ctx.reports, ctx.users, ctx.weekStartDate);
  const outstanding = rows.filter(
    (r) => r.status === "not_started" || r.status === "draft",
  );
  if (outstanding.length === 0)
    return "Everyone on the team has submitted a report for this week.";
  return `Still outstanding for ${weekLabel(ctx.weekStartDate)}:\n\n${outstanding
    .map(
      (r) =>
        `• ${r.name} — ${r.status === "draft" ? "draft in progress" : "not started"}`,
    )
    .join("\n")}`;
}
function blockerDigest(ctx) {
  const all = ctx.reports.flatMap((r) =>
    currentVersion(r).blockers.map((b) => ({
      description: b.description,
      key: b.isKeyIssue,
      user: ctx.users.find((u) => u.id === r.userId)?.name ?? "Unknown",
      week: r.weekStartDate,
    })),
  );
  const thisWeek = all.filter((b) => b.week === ctx.weekStartDate);
  const staging = all.filter((b) => /staging/i.test(b.description));
  const source = thisWeek.length ? thisWeek : all.slice(-4);
  return [
    `${source.length} blocker${source.length === 1 ? "" : "s"} on the board:`,
    source
      .map(
        (b) => `• ${b.user}: ${b.description}${b.key ? "  [key issue]" : ""}`,
      )
      .join("\n"),
    staging.length > 1
      ? `Recurring theme: the staging database reset has now blocked work in ${staging.length} separate reports — worth assigning an owner.`
      : "",
  ]
    .filter(Boolean)
    .join("\n\n");
}
function hoursDigest(ctx) {
  const slices = hoursByType(ctx.reports, ctx.weekStartDate);
  const total = slices.reduce((s, x) => s + x.hours, 0);
  if (!total) return "No hours have been logged for this week yet.";
  const lines = slices.map(
    (s) => `• ${s.type}: ${s.hours}h (${Math.round((s.hours / total) * 100)}%)`,
  );
  const meetings = slices.find((s) => s.type === "Meetings");
  return [
    `${total}h logged team-wide for ${weekLabel(ctx.weekStartDate)}:`,
    lines.join("\n"),
    meetings && meetings.hours / total > 0.2
      ? "Meetings are over 20% of logged time — worth a look at the recurring invites."
      : "",
  ]
    .filter(Boolean)
    .join("\n\n");
}
function memberDigest(ctx, user) {
  const own = ctx.reports
    .filter((r) => r.userId === user.id)
    .sort((a, b) => b.weekStartDate.localeCompare(a.weekStartDate));
  if (own.length === 0) return `${user.name} has no reports on file yet.`;
  const latest = own[0];
  const v = currentVersion(latest);
  const project = ctx.projects.find((p) => p.id === latest.projectId);
  return [
    `${user.name} — latest report is ${weekLabel(latest.weekStartDate)} on ${project?.name ?? "an unassigned project"}, currently ${latest.status.replace("_", " ")}.`,
    `Tasks: ${v.tasks.map((t) => `${t.taskName} (${t.actualPercent}%)`).join(", ") || "none logged"}.`,
    v.blockers.length
      ? `Blockers: ${v.blockers.map((b) => b.description).join("; ")}`
      : "No blockers reported.",
  ].join("\n\n");
}
export function answerQuestion(question, ctx) {
  const q = question.toLowerCase();
  const named = ctx.users.find((u) =>
    q.includes(u.name.split(" ")[0].toLowerCase()),
  );
  if (named) return memberDigest(ctx, named);
  const project = ctx.projects.find((p) =>
    q.includes(p.name.toLowerCase().replace("client a — ", "")),
  );
  if (project) {
    const rows = ctx.reports.filter(
      (r) =>
        r.projectId === project.id && r.weekStartDate === ctx.weekStartDate,
    );
    if (rows.length === 0)
      return `No reports were filed against ${project.name} this week.`;
    return `${project.name} this week:\n\n${rows
      .map((r) => {
        const v = currentVersion(r);
        const who = ctx.users.find((u) => u.id === r.userId)?.name ?? "Someone";
        return `• ${who}: ${v.tasks.map((t) => t.taskName).join(", ") || "no tasks logged"}`;
      })
      .join("\n")}`;
  }
  if (/blocker|blocked|stuck|risk/.test(q)) return blockerDigest(ctx);
  if (/hour|time|meeting|capacity/.test(q)) return hoursDigest(ctx);
  if (/pending|not submitted|missing|chase|outstanding|who has/.test(q))
    return pendingMembers(ctx);
  if (/summar|overview|how.*week|what happened|highlight/.test(q))
    return teamSummary(ctx);
  return `${teamSummary(ctx)}\n\nAsk me about a specific person, a project, blockers, or where time went.`;
}
