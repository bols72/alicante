"use client";

import { useCallback, useEffect, useState } from "react";
import type { AlarmState } from "./schedule";

const KEY = "wingman.alarms";

/** Acknowledge/snooze state per reminder, stored on this device. */
export function useAlarmState() {
  const [states, setStates] = useState<Record<string, AlarmState>>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setStates(JSON.parse(raw));
    } catch {
      // ignore unreadable storage
    }
  }, []);

  const update = useCallback((id: string, next: AlarmState | null) => {
    setStates((prev) => {
      const copy = { ...prev };
      if (next) copy[id] = next;
      else delete copy[id];
      try {
        localStorage.setItem(KEY, JSON.stringify(copy));
      } catch {
        // ignore
      }
      return copy;
    });
  }, []);

  return { states, update };
}
