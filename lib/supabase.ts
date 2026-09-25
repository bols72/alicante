import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Reminder } from "./types";

let client: SupabaseClient | null = null;

/** Supabase "Secret key" (sb_secret_...), or the legacy service_role key. */
function serverKey(): string | undefined {
  return process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(process.env.SUPABASE_URL && serverKey());
}

/** Server-side Supabase client using the secret key. Never import from client components. */
export function getSupabase(): SupabaseClient {
  if (!isSupabaseConfigured()) throw new Error("Supabase is not configured");
  client ??= createClient(process.env.SUPABASE_URL!, serverKey()!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}

/** Postgres returns time as "HH:MM:SS"; the app works with "HH:MM". */
export function normalizeRow(row: Reminder): Reminder {
  return { ...row, time: row.time.slice(0, 5), days_of_week: row.days_of_week ?? [] };
}
