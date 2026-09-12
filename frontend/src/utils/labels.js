export const statusLabels = {
  draft: "Draft",
  submitted: "Submitted",
  needs_correction: "Needs correction",
  approved: "Approved",
  not_started: "Not started",
};
export const statusStyles = {
  draft: "bg-zinc-100 text-zinc-700 ring-zinc-200",
  submitted: "bg-blue-50 text-blue-800 ring-blue-200",
  needs_correction: "bg-amber-50 text-amber-800 ring-amber-200",
  approved: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  not_started: "bg-white text-ink-faint ring-line-strong",
};
export const statusDot = {
  draft: "bg-zinc-400",
  submitted: "bg-blue-600",
  needs_correction: "bg-amber-500",
  approved: "bg-emerald-600",
  not_started: "bg-zinc-300",
};
export const statusChartColor = {
  draft: "#A1A1AA",
  submitted: "#1D4ED8",
  needs_correction: "#B45309",
  approved: "#15803D",
  not_started: "#D4D4D8",
};
export const priorityLabels = {
  low: "Low",
  medium: "Medium",
  high: "High",
};
export const priorityStyles = {
  low: "text-ink-muted",
  medium: "text-ink-soft",
  high: "text-amber-700",
};
export const taskStatusLabels = {
  not_started: "Not started",
  in_progress: "In progress",
  blocked: "Blocked",
  done: "Done",
};
export const taskStatusStyles = {
  not_started: "bg-zinc-100 text-zinc-600",
  in_progress: "bg-blue-50 text-blue-700",
  blocked: "bg-rose-50 text-rose-700",
  done: "bg-emerald-50 text-emerald-700",
};
export const roleLabels = {
  team_member: "Team member",
  manager: "Manager",
};
export function initials(name) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
