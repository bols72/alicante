import { NextResponse } from "next/server";
import { explainError, getSupabase, isSupabaseConfigured, normalizeRow, supabaseConfigError } from "@/lib/supabase";
import { parseReminderInput } from "@/lib/validate";
import type { Reminder } from "@/lib/types";

type Context = { params: Promise<{ id: string }> };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function guard(id: string) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });
  }
  const configError = supabaseConfigError();
  if (configError) return NextResponse.json({ error: configError }, { status: 500 });
  if (!UUID_RE.test(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  return null;
}

export async function PUT(request: Request, { params }: Context) {
  const { id } = await params;
  const blocked = guard(id);
  if (blocked) return blocked;

  const parsed = parseReminderInput(await request.json().catch(() => null));
  if (typeof parsed === "string") return NextResponse.json({ error: parsed }, { status: 400 });

  const { data, error } = await getSupabase().from("reminders").update(parsed).eq("id", id).select("*").maybeSingle();
  if (error) return NextResponse.json({ error: explainError(error) }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ reminder: normalizeRow(data as Reminder) });
}

/** Toggle active state without resending the whole reminder. */
export async function PATCH(request: Request, { params }: Context) {
  const { id } = await params;
  const blocked = guard(id);
  if (blocked) return blocked;

  const body = await request.json().catch(() => null);
  if (typeof body?.active !== "boolean") {
    return NextResponse.json({ error: "Body must be { active: boolean }" }, { status: 400 });
  }
  const { data, error } = await getSupabase()
    .from("reminders")
    .update({ active: body.active })
    .eq("id", id)
    .select("*")
    .maybeSingle();
  if (error) return NextResponse.json({ error: explainError(error) }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ reminder: normalizeRow(data as Reminder) });
}

export async function DELETE(_request: Request, { params }: Context) {
  const { id } = await params;
  const blocked = guard(id);
  if (blocked) return blocked;

  const { error } = await getSupabase().from("reminders").delete().eq("id", id);
  if (error) return NextResponse.json({ error: explainError(error) }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
