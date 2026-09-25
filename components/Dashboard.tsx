"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Header from "./Header";
import ReminderCard, { STATUS_STYLES } from "./ReminderCard";
import ReminderForm from "./ReminderForm";
import AlarmDialog from "./AlarmDialog";
import { resolveStore, type ReminderStore } from "@/lib/store";
import { dateKey, occursOn, scheduledAt, todayStatus, type TodayStatus } from "@/lib/schedule";
import { SAMPLE_REMINDERS } from "@/lib/samples";
import { playChime, unlockAudio } from "@/lib/alarmSound";
import { useAlarmState } from "@/lib/useAlarmState";
import type { Reminder, ReminderInput } from "@/lib/types";

type Filter = "all" | "active" | "inactive";

const byTime = (a: Reminder, b: Reminder) => a.time.localeCompare(b.time) || a.title.localeCompare(b.title);

export default function Dashboard() {
  const [store, setStore] = useState<ReminderStore | null>(null);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState<Date | null>(null);
  const [editing, setEditing] = useState<Reminder | "new" | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("unsupported");
  const { states, update: setAlarmState } = useAlarmState();

  // Clock + initial load
  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 1000);
    if ("Notification" in window) setPermission(Notification.permission);
    window.addEventListener("pointerdown", unlockAudio);
    window.addEventListener("keydown", unlockAudio);

    resolveStore()
      .then(({ store, reminders }) => {
        setStore(store);
        setReminders(reminders);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load reminders"))
      .finally(() => setLoading(false));

    return () => {
      clearInterval(timer);
      window.removeEventListener("pointerdown", unlockAudio);
      window.removeEventListener("keydown", unlockAudio);
    };
  }, []);

  const today = now ? dateKey(now) : "";

  // Status of every reminder that matters today (active & scheduled today, or manually triggered).
  const statuses = useMemo(() => {
    const map = new Map<string, TodayStatus>();
    if (!now) return map;
    for (const r of reminders) {
      const s = states[r.id];
      const scheduledToday = r.active && occursOn(r, now);
      const triggeredToday = s?.snoozeDay === today && s.snoozedUntil !== undefined;
      if (scheduledToday || triggeredToday) map.set(r.id, todayStatus(r, s, now));
    }
    return map;
  }, [reminders, states, now, today]);

  const due = useMemo(() => reminders.filter((r) => statuses.get(r.id) === "due").sort(byTime), [reminders, statuses]);

  const todaysSchedule = useMemo(
    () => (now ? reminders.filter((r) => r.active && occursOn(r, now)).sort(byTime) : []),
    [reminders, now],
  );
  const nextUp = todaysSchedule.find((r) => statuses.get(r.id) === "upcoming" || statuses.get(r.id) === "snoozed");

  // Sound + system notification when a reminder becomes due; repeat the chime while it waits.
  const announced = useRef(new Set<string>());
  useEffect(() => {
    if (!now) return;
    let fresh = false;
    for (const r of due) {
      const key = `${r.id}:${today}:${states[r.id]?.snoozedUntil ?? ""}`;
      if (announced.current.has(key)) continue;
      announced.current.add(key);
      fresh = true;
      if (permission === "granted" && document.visibilityState !== "visible") {
        try {
          new Notification(`Wingman · ${r.time}`, { body: r.title, tag: r.id });
        } catch {
          // Some mobile browsers only allow notifications from a service worker.
        }
      }
    }
    if (fresh || (due.length > 0 && now.getSeconds() % 20 === 0)) playChime();
    document.title = due.length ? `(${due.length}) Wingman` : "Wingman";
  }, [due, now, today, states, permission]);

  const acknowledge = (r: Reminder) => setAlarmState(r.id, { ackedAt: Date.now() });
  const snooze = (r: Reminder, minutes: number) =>
    setAlarmState(r.id, { snoozedUntil: Date.now() + minutes * 60_000, snoozeDay: today });
  const testAlarm = (r: Reminder) => {
    unlockAudio();
    const at = new Date();
    setAlarmState(r.id, { snoozedUntil: at.getTime(), snoozeDay: dateKey(at) });
    setNow(at); // don't wait for the next clock tick
  };

  const run = useCallback(async (action: () => Promise<void>) => {
    setError(null);
    try {
      await action();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  }, []);

  async function save(input: ReminderInput) {
    if (!store) return;
    if (editing && editing !== "new") {
      const updated = await store.update(editing.id, input);
      setReminders((list) => list.map((r) => (r.id === updated.id ? updated : r)));
      setAlarmState(updated.id, null); // new time → alarm may fire again today
    } else {
      const created = await store.create([input]);
      setReminders((list) => [...list, ...created]);
    }
    setEditing(null);
  }

  const toggle = (r: Reminder, active: boolean) =>
    run(async () => {
      setReminders((list) => list.map((x) => (x.id === r.id ? { ...x, active } : x)));
      try {
        const updated = await store!.setActive(r.id, active);
        setReminders((list) => list.map((x) => (x.id === r.id ? updated : x)));
      } catch (err) {
        setReminders((list) => list.map((x) => (x.id === r.id ? r : x)));
        throw err;
      }
    });

  const remove = (r: Reminder) =>
    run(async () => {
      await store!.remove(r.id);
      setReminders((list) => list.filter((x) => x.id !== r.id));
      setAlarmState(r.id, null);
    });

  const loadSamples = () =>
    run(async () => {
      const created = await store!.create(SAMPLE_REMINDERS);
      setReminders((list) => [...list, ...created]);
    });

  async function enableNotifications() {
    unlockAudio();
    if ("Notification" in window) setPermission(await Notification.requestPermission());
  }

  const visible = reminders
    .filter((r) => (filter === "all" ? true : filter === "active" ? r.active : !r.active))
    .sort(byTime);
  const doneCount = todaysSchedule.filter((r) => statuses.get(r.id) === "done").length;
  const remainingCount = todaysSchedule.filter((r) => ["upcoming", "snoozed", "due"].includes(statuses.get(r.id) ?? "")).length;

  return (
    <>
      <Header now={now} mode={store?.mode ?? null} notificationPermission={permission} onEnableNotifications={enableNotifications} />

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6">
        {error && (
          <div className="flex items-start justify-between gap-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/30">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="font-medium underline">
              Dismiss
            </button>
          </div>
        )}

        {store?.mode === "local" && (
          <div className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800 ring-1 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-200 dark:ring-amber-500/30">
            <strong>Demo mode:</strong> Supabase isn&apos;t configured, so reminders are saved in this browser only. Set{" "}
            <code className="font-mono">SUPABASE_URL</code> and <code className="font-mono">SUPABASE_SERVICE_ROLE_KEY</code> to use the database.
          </div>
        )}

        {/* Summary */}
        <section className="grid gap-4 md:grid-cols-3">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600 to-violet-600 p-5 text-white shadow-lg shadow-brand-600/20 md:col-span-2">
            <p className="text-sm font-medium text-white/75">Next up today</p>
            {nextUp && now ? (
              <>
                <div className="mt-1 flex items-baseline gap-3">
                  <span className="text-4xl font-bold tabular-nums">{nextUp.time}</span>
                  <span className="text-sm text-white/80">{relative(scheduledAt(nextUp, now), now, states[nextUp.id]?.snoozedUntil)}</span>
                </div>
                <p className="mt-1 text-lg font-semibold">{nextUp.title}</p>
                {nextUp.description && <p className="mt-0.5 line-clamp-1 text-sm text-white/80">{nextUp.description}</p>}
              </>
            ) : (
              <p className="mt-2 text-lg font-semibold">{loading ? "Loading…" : "Nothing more scheduled today 🎉"}</p>
            )}
            <svg viewBox="0 0 24 24" className="absolute -right-6 -bottom-6 h-36 w-36 text-white/10" fill="currentColor" aria-hidden>
              <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1 10.4 3.3 3.3-1.4 1.4L11 13V6h2z" />
            </svg>
          </div>
          <div className="grid grid-cols-3 gap-3 md:grid-cols-1">
            <Stat label="Active reminders" value={reminders.filter((r) => r.active).length} />
            <Stat label="Remaining today" value={remainingCount} />
            <Stat label="Done today" value={doneCount} />
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Today timeline */}
          <section className="lg:col-span-1">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Today&apos;s schedule</h2>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              {todaysSchedule.length === 0 ? (
                <p className="py-6 text-center text-sm text-slate-500">No active reminders today.</p>
              ) : (
                <ol className="relative space-y-4 border-l border-slate-200 pl-5 dark:border-slate-800">
                  {todaysSchedule.map((r) => {
                    const s = statuses.get(r.id) ?? "upcoming";
                    return (
                      <li key={r.id} className="relative">
                        <span
                          className={`absolute top-1.5 -left-[26px] h-3 w-3 rounded-full ring-4 ring-white dark:ring-slate-900 ${
                            s === "done" ? "bg-emerald-500" : s === "due" ? "bg-rose-500" : s === "snoozed" ? "bg-amber-500" : s === "missed" ? "bg-slate-400" : "bg-brand-500"
                          }`}
                        />
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-sm font-medium ${s === "done" || s === "missed" ? "text-slate-400 line-through" : ""}`}>
                            <span className="tabular-nums">{r.time}</span> · {r.title}
                          </span>
                          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_STYLES[s].className}`}>{STATUS_STYLES[s].label}</span>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              )}
            </div>
          </section>

          {/* All reminders */}
          <section className="lg:col-span-2">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Reminders</h2>
              <div className="flex items-center gap-2">
                <div className="flex rounded-lg bg-slate-200/70 p-0.5 text-sm dark:bg-slate-800">
                  {(["all", "active", "inactive"] as Filter[]).map((f) => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={`rounded-md px-3 py-1 font-medium capitalize ${
                        filter === f ? "bg-white shadow-sm dark:bg-slate-950" : "text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setEditing("new")}
                  disabled={!store}
                  className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 disabled:opacity-50"
                >
                  <span className="text-lg leading-none">+</span> New reminder
                </button>
              </div>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-28 animate-pulse rounded-2xl bg-slate-200/70 dark:bg-slate-800" />
                ))}
              </div>
            ) : reminders.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed border-slate-300 p-10 text-center dark:border-slate-700">
                <p className="font-semibold">No reminders yet</p>
                <p className="mt-1 text-sm text-slate-500">Create your own or start with a set of suggested reminders for a consultant&apos;s day.</p>
                <div className="mt-4 flex justify-center gap-2">
                  <button onClick={loadSamples} disabled={!store} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800">
                    Load sample reminders
                  </button>
                  <button onClick={() => setEditing("new")} disabled={!store} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
                    New reminder
                  </button>
                </div>
              </div>
            ) : visible.length === 0 ? (
              <p className="py-10 text-center text-sm text-slate-500">No {filter} reminders.</p>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {visible.map((r) => (
                  <ReminderCard
                    key={r.id}
                    reminder={r}
                    status={statuses.get(r.id) ?? null}
                    onToggle={(active) => toggle(r, active)}
                    onEdit={() => setEditing(r)}
                    onDelete={() => remove(r)}
                    onTest={() => testAlarm(r)}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      {editing && <ReminderForm initial={editing === "new" ? undefined : editing} onCancel={() => setEditing(null)} onSave={save} />}

      {due.length > 0 && !editing && (
        <AlarmDialog reminder={due[0]} queued={due.length - 1} onAcknowledge={() => acknowledge(due[0])} onSnooze={(m) => snooze(due[0], m)} />
      )}
    </>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
      <div className="text-2xl font-bold tabular-nums">{value}</div>
      <div className="text-xs text-slate-500">{label}</div>
    </div>
  );
}

function relative(at: Date, now: Date, snoozedUntil?: number): string {
  const target = snoozedUntil && snoozedUntil > now.getTime() ? snoozedUntil : at.getTime();
  const mins = Math.max(0, Math.round((target - now.getTime()) / 60_000));
  const prefix = snoozedUntil && snoozedUntil > now.getTime() ? "snoozed, " : "";
  if (mins < 1) return `${prefix}in less than a minute`;
  if (mins < 60) return `${prefix}in ${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${prefix}in ${h} h${m ? ` ${m} min` : ""}`;
}
