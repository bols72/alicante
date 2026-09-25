"use client";

import { useState } from "react";
import Modal from "./Modal";
import { WEEKDAYS, dateKey } from "@/lib/schedule";
import type { Recurrence, Reminder, ReminderInput } from "@/lib/types";

interface Props {
  initial?: Reminder;
  onCancel: () => void;
  onSave: (input: ReminderInput) => Promise<void>;
}

const RECURRENCE_OPTIONS: { value: Recurrence; label: string; hint: string }[] = [
  { value: "daily", label: "Daily", hint: "Every day" },
  { value: "weekdays", label: "Weekdays", hint: "Mon–Fri" },
  { value: "custom", label: "Custom", hint: "Pick days" },
  { value: "once", label: "Once", hint: "One date" },
];

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30 dark:border-slate-700 dark:bg-slate-950";

export default function ReminderForm({ initial, onCancel, onSave }: Props) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [time, setTime] = useState(initial?.time ?? "09:00");
  const [recurrence, setRecurrence] = useState<Recurrence>(initial?.recurrence ?? "weekdays");
  const [days, setDays] = useState<number[]>(initial?.days_of_week ?? [1, 2, 3, 4, 5]);
  const [date, setDate] = useState(initial?.one_time_date ?? dateKey(new Date()));
  const [active, setActive] = useState(initial?.active ?? true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleDay = (iso: number) =>
    setDays((d) => (d.includes(iso) ? d.filter((x) => x !== iso) : [...d, iso].sort()));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return setError("Please give the reminder a title.");
    if (recurrence === "custom" && days.length === 0) return setError("Pick at least one weekday.");
    setSaving(true);
    setError(null);
    try {
      await onSave({
        title: title.trim(),
        description: description.trim(),
        time,
        recurrence,
        days_of_week: recurrence === "custom" ? days : [],
        one_time_date: recurrence === "once" ? date : null,
        active,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the reminder.");
      setSaving(false);
    }
  }

  return (
    <Modal onClose={onCancel} labelledBy="reminder-form-title">
      <form onSubmit={submit} className="space-y-5 p-6">
        <h2 id="reminder-form-title" className="text-lg font-semibold">
          {initial ? "Edit reminder" : "New reminder"}
        </h2>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Title</span>
          <input autoFocus className={inputClass} value={title} maxLength={120} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Time reporting in BLIKK" />
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Description</span>
          <textarea className={`${inputClass} min-h-20 resize-y`} value={description} maxLength={1000} onChange={(e) => setDescription(e.target.value)} placeholder="What should you do when it goes off?" />
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Time</span>
          <input type="time" required className={`${inputClass} w-36 tabular-nums`} value={time} onChange={(e) => setTime(e.target.value)} />
        </label>

        <fieldset className="space-y-2">
          <legend className="mb-1.5 text-sm font-medium">Recurrence</legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {RECURRENCE_OPTIONS.map((opt) => (
              <button
                type="button"
                key={opt.value}
                onClick={() => setRecurrence(opt.value)}
                aria-pressed={recurrence === opt.value}
                className={`rounded-lg border px-3 py-2 text-left text-sm transition ${
                  recurrence === opt.value
                    ? "border-brand-500 bg-brand-50 text-brand-700 ring-1 ring-brand-500 dark:bg-brand-500/15 dark:text-brand-100"
                    : "border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                }`}
              >
                <div className="font-medium">{opt.label}</div>
                <div className="text-xs opacity-70">{opt.hint}</div>
              </button>
            ))}
          </div>

          {recurrence === "custom" && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {WEEKDAYS.map((w) => (
                <button
                  type="button"
                  key={w.iso}
                  onClick={() => toggleDay(w.iso)}
                  aria-pressed={days.includes(w.iso)}
                  className={`h-9 w-12 rounded-lg text-sm font-medium transition ${
                    days.includes(w.iso)
                      ? "bg-brand-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                  }`}
                >
                  {w.short}
                </button>
              ))}
            </div>
          )}

          {recurrence === "once" && (
            <input type="date" required className={`${inputClass} mt-1 w-48`} value={date} onChange={(e) => setDate(e.target.value)} />
          )}
        </fieldset>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" className="h-4 w-4 accent-brand-600" checked={active} onChange={(e) => setActive(e.target.checked)} />
          Active in the daily schedule
        </label>

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300">{error}</p>}

        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onCancel} className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">
            Cancel
          </button>
          <button type="submit" disabled={saving} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 disabled:opacity-60">
            {saving ? "Saving…" : initial ? "Save changes" : "Create reminder"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
