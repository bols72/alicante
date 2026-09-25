import type { ReminderInput } from "./types";

/** Suggested reminders for a consultant's working day (kept in sync with supabase/seed.sql). */
export const SAMPLE_REMINDERS: ReminderInput[] = [
  { title: "Check email & Teams", description: "Scan inbox and Teams channels for anything urgent before the day starts.", time: "08:30", recurrence: "weekdays", days_of_week: [], one_time_date: null, active: true },
  { title: "Daily stand-up", description: "Join the client stand-up. Prepare: yesterday, today, blockers.", time: "09:15", recurrence: "weekdays", days_of_week: [], one_time_date: null, active: true },
  { title: "Lunch break", description: "Step away from the screen and eat something.", time: "12:00", recurrence: "daily", days_of_week: [], one_time_date: null, active: true },
  { title: "Stretch & drink water", description: "Short break: stand up, stretch, refill your water bottle.", time: "14:30", recurrence: "weekdays", days_of_week: [], one_time_date: null, active: true },
  { title: "Update task board", description: "Move tickets in Jira/Azure DevOps and add comments on progress.", time: "15:30", recurrence: "weekdays", days_of_week: [], one_time_date: null, active: true },
  { title: "Time reporting in BLIKK", description: "Report today's hours in BLIKK per project and activity.", time: "16:30", recurrence: "weekdays", days_of_week: [], one_time_date: null, active: true },
  { title: "Plan tomorrow", description: "Write down the top 3 priorities for tomorrow.", time: "16:45", recurrence: "weekdays", days_of_week: [], one_time_date: null, active: true },
  { title: "Submit weekly expenses", description: "Upload receipts and submit expenses/travel for the week.", time: "15:00", recurrence: "custom", days_of_week: [5], one_time_date: null, active: true },
  { title: "Weekly status to client", description: "Send a short status update: done, next, risks.", time: "14:00", recurrence: "custom", days_of_week: [5], one_time_date: null, active: false },
];
