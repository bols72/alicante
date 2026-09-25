"use client";

import Modal from "./Modal";
import { recurrenceLabel } from "@/lib/schedule";
import type { Reminder } from "@/lib/types";

interface Props {
  reminder: Reminder;
  queued: number;
  onAcknowledge: () => void;
  onSnooze: (minutes: number) => void;
}

const SNOOZE_OPTIONS = [5, 10, 15, 30];

export default function AlarmDialog({ reminder, queued, onAcknowledge, onSnooze }: Props) {
  return (
    <Modal labelledBy="alarm-title">
      <div className="p-6 text-center">
        <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-brand-100 text-brand-600 dark:bg-brand-500/20 dark:text-brand-100">
          <svg viewBox="0 0 24 24" className="animate-ring h-8 w-8" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
            <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
          </svg>
        </div>
        <p className="text-sm font-medium text-brand-600 tabular-nums dark:text-brand-100">
          {reminder.time} · {recurrenceLabel(reminder)}
        </p>
        <h2 id="alarm-title" className="mt-1 text-2xl font-bold tracking-tight">
          {reminder.title}
        </h2>
        {reminder.description && <p className="mt-2 text-slate-600 dark:text-slate-300">{reminder.description}</p>}

        <button
          autoFocus
          onClick={onAcknowledge}
          className="mt-6 w-full rounded-xl bg-brand-600 px-4 py-3 text-base font-semibold text-white shadow-md shadow-brand-600/30 hover:bg-brand-700"
        >
          Done – acknowledge
        </button>

        <div className="mt-4">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">Snooze</p>
          <div className="grid grid-cols-4 gap-2">
            {SNOOZE_OPTIONS.map((m) => (
              <button
                key={m}
                onClick={() => onSnooze(m)}
                className="rounded-lg border border-slate-300 py-2 text-sm font-medium hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
              >
                {m} min
              </button>
            ))}
          </div>
        </div>

        {queued > 0 && (
          <p className="mt-4 text-xs text-slate-500">
            {queued} more reminder{queued > 1 ? "s" : ""} waiting
          </p>
        )}
      </div>
    </Modal>
  );
}
