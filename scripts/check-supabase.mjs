// Checks the Supabase settings Wingman uses: URL, key and the reminders table.
// Usage: npm run check:supabase  (reads .env.local, then the process environment). Never prints the key.
import { createClient } from "@supabase/supabase-js";

for (const file of [".env.local", ".env"]) {
  try {
    process.loadEnvFile(file);
  } catch {
    // file not present
  }
}

const clean = (v) => v?.trim().replace(/^["']|["']$/g, "").trim() || undefined;

// Same rules as normalizeSupabaseUrl in lib/supabase.ts.
function normalizeUrl(raw) {
  const value = clean(raw);
  if (!value) return null;
  try {
    const url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
    const dashboard = url.pathname.match(/\/project\/([a-z0-9]+)/i);
    if (/(^|\.)supabase\.com$/i.test(url.hostname) && dashboard) return `https://${dashboard[1]}.supabase.co`;
    return url.origin;
  } catch {
    return null;
  }
}

const rawUrl = clean(process.env.SUPABASE_URL);
const url = normalizeUrl(rawUrl);
const key = clean(process.env.SUPABASE_SECRET_KEY) || clean(process.env.SUPABASE_SERVICE_ROLE_KEY);

const fail = (msg) => {
  console.error(`✗ ${msg}`);
  process.exit(1);
};

if (!rawUrl) fail("SUPABASE_URL is not set");
if (!url) fail("SUPABASE_URL is not a valid URL");
console.log(`✓ SUPABASE_URL → ${url}${url !== rawUrl ? `  (normalized from a value with extra path/characters)` : ""}`);

if (!key) fail("SUPABASE_SECRET_KEY (or SUPABASE_SERVICE_ROLE_KEY) is not set");
const kind = key.startsWith("sb_secret_") ? "secret key" : key.startsWith("sb_publishable_") ? "PUBLISHABLE key" : "legacy JWT key";
console.log(`✓ key present (${kind}, ${key.length} chars)`);
if (kind === "PUBLISHABLE key") fail("That's the publishable key. Use a secret key (sb_secret_...) from Project Settings → API Keys.");

const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

const { count, error: selectError } = await db.from("reminders").select("*", { count: "exact", head: true });
if (selectError) fail(`select failed: ${selectError.message}${selectError.code ? ` (${selectError.code})` : ""}`);
console.log(`✓ reminders table readable (${count} rows)`);

const { data: inserted, error: insertError } = await db
  .from("reminders")
  .insert({ title: "Wingman connection check", time: "00:00", recurrence: "daily", active: false })
  .select("id")
  .single();
if (insertError) fail(`insert failed: ${insertError.message}`);
const { error: deleteError } = await db.from("reminders").delete().eq("id", inserted.id);
if (deleteError) fail(`delete failed: ${deleteError.message} (row ${inserted.id} left behind)`);
console.log("✓ insert + delete work");
console.log("All good – Wingman can use this Supabase project.");
