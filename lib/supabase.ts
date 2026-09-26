import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Reminder } from "./types";

let client: SupabaseClient | null = null;

/** Env values often get pasted with quotes or spaces (e.g. in the Vercel dashboard). */
function clean(value: string | undefined): string | undefined {
  const v = value?.trim().replace(/^["']|["']$/g, "").trim();
  return v || undefined;
}

/** Supabase "Secret key" (sb_secret_...), or the legacy service_role key. */
function serverKey(): string | undefined {
  return clean(process.env.SUPABASE_SECRET_KEY) || clean(process.env.SUPABASE_SERVICE_ROLE_KEY);
}

/**
 * Reduces SUPABASE_URL to the bare project URL. supabase-js appends /rest/v1/..., so a value like
 * "https://abcd.supabase.co/rest/v1" makes every request fail with "Invalid path specified in request URL".
 * Also accepts the dashboard link https://supabase.com/dashboard/project/<ref>. Keep in sync with scripts/check-supabase.mjs.
 */
export function normalizeSupabaseUrl(raw: string | undefined): string | null {
  const value = clean(raw);
  if (!value) return null;
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
  } catch {
    return null;
  }
  const dashboard = url.pathname.match(/\/project\/([a-z0-9]+)/i);
  if (/(^|\.)supabase\.com$/i.test(url.hostname) && dashboard) return `https://${dashboard[1]}.supabase.co`;
  return url.origin;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(clean(process.env.SUPABASE_URL) && serverKey());
}

/** A human-readable problem with the Supabase settings, or null when they look usable. */
export function supabaseConfigError(): string | null {
  if (!normalizeSupabaseUrl(process.env.SUPABASE_URL)) {
    return "SUPABASE_URL is not a valid URL. Use the project URL, e.g. https://abcd1234.supabase.co";
  }
  return null;
}

/** Server-side Supabase client using the secret key. Never import from client components. */
export function getSupabase(): SupabaseClient {
  const url = normalizeSupabaseUrl(process.env.SUPABASE_URL);
  const key = serverKey();
  if (!url || !key) throw new Error("Supabase is not configured");
  client ??= createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}

/** Turns common Supabase failures into messages that say how to fix them. */
export function explainError(error: { message: string; code?: string }): string {
  const msg = error.message ?? "";
  if (/invalid path specified/i.test(msg)) {
    return "Supabase rejected the request path. SUPABASE_URL must be the bare project URL, e.g. https://abcd1234.supabase.co";
  }
  if (error.code === "PGRST205" || error.code === "42P01" || /could not find the table|does not exist/i.test(msg)) {
    return "The reminders table doesn't exist yet. Run supabase/schema.sql in the Supabase SQL editor.";
  }
  if (/invalid api key|unregistered api key|jwt|unauthorized|permission denied/i.test(msg) || error.code === "42501") {
    return "Supabase refused the API key. Set SUPABASE_SECRET_KEY to a secret key (sb_secret_...), not the publishable key.";
  }
  if (!msg.trim() || /fetch failed|enotfound|getaddrinfo/i.test(msg)) {
    return "Could not reach Supabase. Check that SUPABASE_URL points to your project, e.g. https://abcd1234.supabase.co";
  }
  return msg;
}

/** Postgres returns time as "HH:MM:SS"; the app works with "HH:MM". */
export function normalizeRow(row: Reminder): Reminder {
  return { ...row, time: row.time.slice(0, 5), days_of_week: row.days_of_week ?? [] };
}
