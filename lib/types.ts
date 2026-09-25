export type Recurrence = "daily" | "weekdays" | "custom" | "once";

export interface Reminder {
  id: string;
  title: string;
  description: string;
  /** Local time of day, "HH:MM" (24h). */
  time: string;
  recurrence: Recurrence;
  /** ISO weekdays (1 = Monday ... 7 = Sunday), used when recurrence is "custom". */
  days_of_week: number[];
  /** "YYYY-MM-DD", used when recurrence is "once". */
  one_time_date: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export type ReminderInput = Pick<
  Reminder,
  "title" | "description" | "time" | "recurrence" | "days_of_week" | "one_time_date" | "active"
>;
