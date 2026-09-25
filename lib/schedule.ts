import type { Reminder } from "./types";

/** How long after its scheduled time a reminder still pops up (e.g. when the app was opened late). */
export const ALARM_WINDOW_MS = 60 * 60 * 1000;

export const WEEKDAYS = [
  { iso: 1, short: "Mon" },
  { iso: 2, short: "Tue" },
  { iso: 3, short: "Wed" },
  { iso: 4, short: "Thu" },
  { iso: 5, short: "Fri" },
  { iso: 6, short: "Sat" },
  { iso: 7, short: "Sun" },
];

/** Local date key, "YYYY-MM-DD". */
export function dateKey(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export function isoWeekday(d: Date): number {
  return d.getDay() === 0 ? 7 : d.getDay();
}

export function occursOn(r: Reminder, d: Date): boolean {
  switch (r.recurrence) {
    case "daily":
      return true;
    case "weekdays":
      return isoWeekday(d) <= 5;
    case "custom":
      return r.days_of_week.includes(isoWeekday(d));
    case "once":
      return r.one_time_date === dateKey(d);
  }
}

/** The reminder's scheduled moment on the given day (local time). */
export function scheduledAt(r: Reminder, d: Date): Date {
  const [h, m] = r.time.split(":").map(Number);
  const at = new Date(d);
  at.setHours(h, m, 0, 0);
  return at;
}

export function recurrenceLabel(r: Reminder): string {
  switch (r.recurrence) {
    case "daily":
      return "Every day";
    case "weekdays":
      return "Weekdays (Mon–Fri)";
    case "custom":
      return WEEKDAYS.filter((w) => r.days_of_week.includes(w.iso))
        .map((w) => w.short)
        .join(", ");
    case "once":
      return r.one_time_date ? `Once on ${r.one_time_date}` : "Once";
  }
}

/** Per-device alarm state, kept in localStorage. */
export interface AlarmState {
  /** Epoch ms of the last acknowledgement. It counts for today only if it came after today's scheduled time. */
  ackedAt?: number;
  /** Epoch ms the reminder is snoozed until, and the day that snooze belongs to. */
  snoozedUntil?: number;
  snoozeDay?: string;
}

export type TodayStatus = "done" | "due" | "snoozed" | "upcoming" | "missed";

export function todayStatus(r: Reminder, state: AlarmState | undefined, now: Date): TodayStatus {
  const today = dateKey(now);
  const at = scheduledAt(r, now).getTime();
  if (state?.ackedAt && state.ackedAt >= at && dateKey(new Date(state.ackedAt)) === today) return "done";
  if (state?.snoozeDay === today && state.snoozedUntil) {
    return now.getTime() >= state.snoozedUntil ? "due" : "snoozed";
  }
  if (now.getTime() < at) return "upcoming";
  // Don't pop up for a time that had already passed when the reminder was created/changed
  // (a change within the scheduled minute itself still fires).
  const changed = Date.parse(r.updated_at);
  if (!Number.isNaN(changed) && changed - at >= 60_000) return "missed";
  return now.getTime() - at <= ALARM_WINDOW_MS ? "due" : "missed";
}
