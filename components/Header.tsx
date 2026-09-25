"use client";

interface Props {
  now: Date | null;
  mode: "supabase" | "local" | null;
  notificationPermission: NotificationPermission | "unsupported";
  onEnableNotifications: () => void;
}

export default function Header({ now, mode, notificationPermission, onEnableNotifications }: Props) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand-600 text-white shadow-md shadow-brand-600/30">
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M3 15 12 6l9 9" />
              <path d="M8 15l4-4 4 4" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Wingman</h1>
            <p className="hidden text-xs text-slate-500 sm:block dark:text-slate-400">Your co-pilot for the working day</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {mode === "local" && (
            <span
              title="Supabase is not configured. Reminders are stored in this browser only."
              className="hidden rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800 sm:inline dark:bg-amber-500/15 dark:text-amber-300"
            >
              Demo mode
            </span>
          )}
          {notificationPermission === "default" && (
            <button
              onClick={onEnableNotifications}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Enable notifications
            </button>
          )}
          <div className="text-right tabular-nums">
            <div className="text-lg font-semibold leading-tight">
              {now ? now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "--:--:--"}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {now ? now.toLocaleDateString([], { weekday: "long", day: "numeric", month: "short" }) : " "}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
