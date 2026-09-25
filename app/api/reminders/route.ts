import { NextResponse } from "next/server";
import { getSupabase, isSupabaseConfigured, normalizeRow } from "@/lib/supabase";
import { parseReminderInput } from "@/lib/validate";
import type { Reminder, ReminderInput } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ configured: false, reminders: [] });
  }
  const { data, error } = await getSupabase()
    .from("reminders")
    .select("*")
    .order("time", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ configured: true, reminders: (data as Reminder[]).map(normalizeRow) });
}

/** Create one reminder, or several when the body is an array (used to load the sample reminders). */
export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });
  }
  const body = await request.json().catch(() => null);
  const items = Array.isArray(body) ? body.slice(0, 50) : [body];
  const parsed: ReminderInput[] = [];
  for (const item of items) {
    const result = parseReminderInput(item);
    if (typeof result === "string") return NextResponse.json({ error: result }, { status: 400 });
    parsed.push(result);
  }
  const { data, error } = await getSupabase().from("reminders").insert(parsed).select("*");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ reminders: (data as Reminder[]).map(normalizeRow) }, { status: 201 });
}
