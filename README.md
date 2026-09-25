# Wingman

A reminder dashboard for a consultant's working day, built with **Next.js (App Router)**, **Tailwind CSS** and **Supabase**, ready to deploy on **Vercel**.

When a reminder is due, Wingman plays a chime and opens a popup where you can **acknowledge** it or **snooze** it for 5/10/15/30 minutes.

## Features

- Dashboard with a live clock, a "next up" card, today's schedule and all reminders
- Create, edit and delete reminders
- Turn reminders on or off for the daily schedule
- Each reminder has a title, description, time and a recurrence: **daily**, **weekdays (Mon–Fri)**, **custom weekdays** or **once** (on one date)
- Alarm popup with acknowledge or snooze, a sound, a `(n) Wingman` tab title, and optional browser notifications when the tab is in the background
- A "Test alarm" button on each reminder
- Suggested sample reminders you can load with one click
- **Demo mode**: without Supabase settings, the app still runs and stores reminders in the browser's localStorage

### Sample reminders

| Time  | Reminder                 | Recurrence |
|-------|--------------------------|------------|
| 08:30 | Check email & Teams      | Weekdays   |
| 09:15 | Daily stand-up           | Weekdays   |
| 12:00 | Lunch break              | Daily      |
| 14:30 | Stretch & drink water    | Weekdays   |
| 15:30 | Update task board        | Weekdays   |
| 16:30 | **Time reporting in BLIKK** | Weekdays |
| 16:45 | Plan tomorrow            | Weekdays   |
| 15:00 | Submit weekly expenses   | Fridays    |
| 14:00 | Weekly status to client  | Fridays (inactive) |

## How alarms work

- Times are in the browser's local time zone. The dashboard checks every second.
- A reminder pops up when its time arrives, if it is active and scheduled for today. If you open the app up to 60 minutes late, it still pops up. After that it is shown as *Passed*.
- A reminder created or changed after today's time won't pop up until its next occurrence.
- Acknowledge and snooze state is stored per device (localStorage). The reminders themselves are stored in Supabase.
- The alarm only fires while Wingman is open in a browser tab. Keep it pinned. Browsers allow sound only after you have clicked on the page once.

## Run locally

Requirements: Node.js 20.9+.

```bash
npm install
cp .env.example .env.local   # optional: fill in Supabase settings, or leave empty for demo mode
npm run dev
```

Open http://localhost:3000.

Other scripts: `npm run build`, `npm start`, `npm run lint` (type check).

## Set up Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. Open **SQL Editor** and run [`supabase/schema.sql`](supabase/schema.sql). You can also run [`supabase/seed.sql`](supabase/seed.sql) to add the sample reminders, or use the "Load sample reminders" button in the app.
3. Under **Project Settings → API**, copy the project URL and the `service_role` key into `.env.local`:

   ```
   SUPABASE_URL=https://xxxx.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=eyJ...
   ```

The browser never talks to Supabase directly. All reads and writes go through the Next.js API routes in `app/api/reminders`, which use the service-role key on the server. Row Level Security is enabled on the table with no public policies, so the anon key can't read or change reminders.

## Deploy to Vercel

1. Push this repository to GitHub.
2. In Vercel, click **Add New → Project** and import the repository. The framework preset (Next.js) is detected automatically.
3. Add the environment variables `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` (for Production and Preview).
4. Click **Deploy**.

Or use the CLI: `npx vercel` and then `npx vercel --prod`.

> **Note:** Wingman has no login. Anyone with the URL can manage the reminders. For a personal deployment, turn on Vercel's Deployment Protection (password or Vercel Authentication). You can also add Supabase Auth later.

## Project structure

```
app/
  api/reminders/route.ts        GET (list), POST (create one or many)
  api/reminders/[id]/route.ts   PUT (edit), PATCH (activate/deactivate), DELETE
  layout.tsx, page.tsx, globals.css
components/                     Dashboard, Header, ReminderCard, ReminderForm, AlarmDialog, Modal, Toggle
lib/
  schedule.ts                   recurrence + due/snooze logic
  store.ts                      client data layer (API or local demo mode)
  supabase.ts                   server-only Supabase client
  validate.ts                   input validation for the API
  samples.ts                    suggested reminders
supabase/schema.sql, seed.sql   database schema and sample data
```
