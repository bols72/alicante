"use client";

import type { Reminder, ReminderInput } from "./types";
import { SAMPLE_REMINDERS } from "./samples";

/**
 * Data access used by the dashboard. With Supabase configured it calls the API routes;
 * otherwise it falls back to a local demo mode that keeps reminders in localStorage.
 */
export interface ReminderStore {
  mode: "supabase" | "local";
  list(): Promise<Reminder[]>;
  create(items: ReminderInput[]): Promise<Reminder[]>;
  update(id: string, input: ReminderInput): Promise<Reminder>;
  setActive(id: string, active: boolean): Promise<Reminder>;
  remove(id: string): Promise<void>;
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed (${res.status})`);
  }
  return (res.status === 204 ? undefined : await res.json()) as T;
}

const apiStore: ReminderStore = {
  mode: "supabase",
  async list() {
    return (await request<{ reminders: Reminder[] }>("/api/reminders")).reminders;
  },
  async create(items) {
    const res = await request<{ reminders: Reminder[] }>("/api/reminders", {
      method: "POST",
      body: JSON.stringify(items),
    });
    return res.reminders;
  },
  async update(id, input) {
    const res = await request<{ reminder: Reminder }>(`/api/reminders/${id}`, {
      method: "PUT",
      body: JSON.stringify(input),
    });
    return res.reminder;
  },
  async setActive(id, active) {
    const res = await request<{ reminder: Reminder }>(`/api/reminders/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ active }),
    });
    return res.reminder;
  },
  async remove(id) {
    await request<void>(`/api/reminders/${id}`, { method: "DELETE" });
  },
};

const LOCAL_KEY = "wingman.reminders";

function readLocal(): Reminder[] | null {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    return raw ? (JSON.parse(raw) as Reminder[]) : null;
  } catch {
    return null;
  }
}

function writeLocal(reminders: Reminder[]) {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(reminders));
  } catch {
    // Storage unavailable (private mode etc.) – changes live only for this page view.
  }
}

function makeLocal(input: ReminderInput): Reminder {
  const stamp = new Date().toISOString();
  return { ...input, id: crypto.randomUUID(), created_at: stamp, updated_at: stamp };
}

let memory: Reminder[] = [];

const localStore: ReminderStore = {
  mode: "local",
  async list() {
    const stored = readLocal();
    if (stored === null) {
      // First visit in demo mode: start with the suggested reminders.
      memory = SAMPLE_REMINDERS.map(makeLocal);
      writeLocal(memory);
    } else {
      memory = stored;
    }
    return memory;
  },
  async create(items) {
    const created = items.map(makeLocal);
    memory = [...memory, ...created];
    writeLocal(memory);
    return created;
  },
  async update(id, input) {
    let updated: Reminder | undefined;
    memory = memory.map((r) =>
      r.id === id ? (updated = { ...r, ...input, updated_at: new Date().toISOString() }) : r,
    );
    if (!updated) throw new Error("Not found");
    writeLocal(memory);
    return updated;
  },
  async setActive(id, active) {
    const current = memory.find((r) => r.id === id);
    if (!current) throw new Error("Not found");
    return this.update(id, { ...current, active });
  },
  async remove(id) {
    memory = memory.filter((r) => r.id !== id);
    writeLocal(memory);
  },
};

/** Picks the store based on whether the server has Supabase configured. */
export async function resolveStore(): Promise<{ store: ReminderStore; reminders: Reminder[] }> {
  const res = await request<{ configured: boolean; reminders: Reminder[] }>("/api/reminders");
  if (res.configured) return { store: apiStore, reminders: res.reminders };
  return { store: localStore, reminders: await localStore.list() };
}
