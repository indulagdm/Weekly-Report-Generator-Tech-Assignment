import {
  addWeeks,
  endOfWeek,
  format,
  formatDistanceToNowStrict,
  parseISO,
  startOfWeek,
} from "date-fns";
const WEEK_OPTS = { weekStartsOn: 1 };
export function toISODate(date) {
  return format(date, "yyyy-MM-dd");
}
export function weekStartOf(date) {
  return toISODate(startOfWeek(date, WEEK_OPTS));
}
export function weekEndOf(weekStartISO) {
  return toISODate(endOfWeek(parseISO(weekStartISO), WEEK_OPTS));
}
export function currentWeekStart() {
  return weekStartOf(new Date());
}
/** Week starts for the last `count` weeks, oldest first (includes current week). */
export function recentWeekStarts(count) {
  const base = startOfWeek(new Date(), WEEK_OPTS);
  return Array.from({ length: count }, (_, i) =>
    toISODate(addWeeks(base, i - (count - 1))),
  );
}
export function weekLabel(weekStartISO) {
  const start = parseISO(weekStartISO);
  const end = parseISO(weekEndOf(weekStartISO));
  const sameMonth = format(start, "MMM") === format(end, "MMM");
  return sameMonth
    ? `${format(start, "MMM d")} – ${format(end, "d, yyyy")}`
    : `${format(start, "MMM d")} – ${format(end, "MMM d, yyyy")}`;
}
export function shortWeekLabel(weekStartISO) {
  return format(parseISO(weekStartISO), "MMM d");
}
export function formatDateTime(iso) {
  return format(parseISO(iso), "MMM d, yyyy 'at' h:mm a");
}
export function formatDate(iso) {
  return format(parseISO(iso), "MMM d, yyyy");
}
export function relativeTime(iso) {
  return `${formatDistanceToNowStrict(parseISO(iso))} ago`;
}
export function isCurrentWeek(weekStartISO) {
  return weekStartISO === currentWeekStart();
}
