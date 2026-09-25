"use client";

import { useState } from "react";
import Toggle from "./Toggle";
import { recurrenceLabel, type TodayStatus } from "@/lib/schedule";
import type { Reminder } from "@/lib/types";

interface Props {
  reminder: Reminder;
  /** Status today, or null when the reminder doesn't occur today / is inactive. */
  status: TodayStatus | null;
  onToggle: (active: boolean) => void;
  onEdit: () => void;
  onDelete: () => void;
  onTest: () => void;
}

export const STATUS_STYLES: Record<TodayStatus, { label: string; className: string }> = {
  upcoming: { label: "Upcoming", className: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300" },
  due: { label: "Due now", className: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300" },
  snoozed: { label: "Snoozed", className: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300" },
  done: { label: "Done", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300" },
  missed: { label: "Passed", className: "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400" },
};

export default function ReminderCard({ reminder, status, onToggle, onEdit, onDelete, onTest }: Props) {
  const [confirming, setConfirming] = useState(false);

  return (
    <article
      className={`group rounded-2xl border bg-white p-4 shadow-sm transition hover:shadow-md dark:bg-slate-900 ${
        reminder.active ? "border-slate-200 dark:border-slate-800" : "border-dashed border-slate-300 opacity-70 dark:border-slate-700"
      }`}
    >
      <div className="flex items-start gap-4">
        <div className="w-16 shrink-0 rounded-xl bg-slate-100 py-2 text-center dark:bg-slate-800">
          <div className="text-lg font-bold tabular-nums">{reminder.time}</div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate font-semibold">{reminder.title}</h3>
            {status && (
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[status].className}`}>
                {STATUS_STYLES[status].label}
              </span>
            )}
          </div>
          {reminder.description && (
            <p className="mt-0.5 line-clamp-2 text-sm text-slate-600 dark:text-slate-400">{reminder.description}</p>
          )}
          <p className="mt-1.5 flex items-center gap-1 text-xs text-slate-500">
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
              <path d="M17 2l4 4-4 4" />
              <path d="M3 11v-1a4 4 0 0 1 4-4h14" />
              <path d="M7 22l-4-4 4-4" />
              <path d="M21 13v1a4 4 0 0 1-4 4H3" />
            </svg>
            {recurrenceLabel(reminder)}
          </p>
        </div>

        <Toggle checked={reminder.active} onChange={onToggle} label={reminder.active ? "Deactivate reminder" : "Activate reminder"} />
      </div>

      <div className="mt-3 flex items-center justify-end gap-1 border-t border-slate-100 pt-3 text-sm dark:border-slate-800">
        {confirming ? (
          <>
            <span className="mr-auto text-slate-600 dark:text-slate-400">Delete this reminder?</span>
            <button onClick={() => setConfirming(false)} className="rounded-lg px-3 py-1.5 font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">
              Cancel
            </button>
            <button onClick={onDelete} className="rounded-lg bg-rose-600 px-3 py-1.5 font-medium text-white hover:bg-rose-700">
              Delete
            </button>
          </>
        ) : (
          <>
            <button onClick={onTest} className="mr-auto rounded-lg px-3 py-1.5 font-medium text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" title="Show the alarm popup now">
              Test alarm
            </button>
            <button onClick={onEdit} className="rounded-lg px-3 py-1.5 font-medium text-brand-600 hover:bg-brand-50 dark:text-brand-100 dark:hover:bg-slate-800">
              Edit
            </button>
            <button onClick={() => setConfirming(true)} className="rounded-lg px-3 py-1.5 font-medium text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-slate-800">
              Delete
            </button>
          </>
        )}
      </div>
    </article>
  );
}
