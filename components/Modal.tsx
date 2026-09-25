"use client";

import { useEffect } from "react";

interface Props {
  onClose?: () => void;
  labelledBy: string;
  children: React.ReactNode;
}

export default function Modal({ onClose, labelledBy, children }: Props) {
  useEffect(() => {
    if (!onClose) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-4 backdrop-blur-sm sm:items-center" onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        className="animate-pop-in max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800"
      >
        {children}
      </div>
    </div>
  );
}
