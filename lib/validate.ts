import type { Recurrence, ReminderInput } from "./types";

const RECURRENCES: Recurrence[] = ["daily", "weekdays", "custom", "once"];
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Validates and normalizes an untrusted reminder payload. Returns an error string on failure. */
export function parseReminderInput(body: unknown): ReminderInput | string {
  if (typeof body !== "object" || body === null) return "Invalid payload";
  const b = body as Record<string, unknown>;

  const title = typeof b.title === "string" ? b.title.trim() : "";
  if (!title || title.length > 120) return "Title is required (max 120 characters)";

  const description = typeof b.description === "string" ? b.description.trim().slice(0, 1000) : "";

  const time = typeof b.time === "string" ? b.time.slice(0, 5) : "";
  if (!TIME_RE.test(time)) return "Time must be HH:MM";

  const recurrence = b.recurrence as Recurrence;
  if (!RECURRENCES.includes(recurrence)) return "Invalid recurrence";

  const days_of_week = Array.isArray(b.days_of_week)
    ? [...new Set(b.days_of_week.map(Number).filter((d) => Number.isInteger(d) && d >= 1 && d <= 7))].sort()
    : [];
  if (recurrence === "custom" && days_of_week.length === 0) return "Pick at least one weekday";

  const one_time_date = typeof b.one_time_date === "string" && DATE_RE.test(b.one_time_date) ? b.one_time_date : null;
  if (recurrence === "once" && !one_time_date) return "Pick a date for a one-time reminder";

  return {
    title,
    description,
    time,
    recurrence,
    days_of_week: recurrence === "custom" ? days_of_week : [],
    one_time_date: recurrence === "once" ? one_time_date : null,
    active: b.active === undefined ? true : Boolean(b.active),
  };
}
