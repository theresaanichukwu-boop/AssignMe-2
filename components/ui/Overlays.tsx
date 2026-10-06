"use client";

import { useEffect } from "react";

export function Modal({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/50 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-xl font-semibold">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="rounded-md px-2 py-1 text-slate-500 hover:bg-navy-50 focus-visible:outline-2 focus-visible:outline-teal-700"
          >
            ✕
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}

export function Drawer({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-50 bg-navy-950/50"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <aside className="absolute right-0 top-0 h-full w-full max-w-md overflow-y-auto bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-xl font-semibold">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close panel"
            className="rounded-md px-2 py-1 text-slate-500 hover:bg-navy-50 focus-visible:outline-2 focus-visible:outline-teal-700"
          >
            ✕
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </aside>
    </div>
  );
}

export function Toast({ message, tone = "neutral" }: { message: string; tone?: "neutral" | "success" | "error" }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`rounded-md border px-4 py-3 text-sm shadow-lg ${tone === "success" ? "border-teal-600/30 bg-teal-50 text-teal-800" : tone === "error" ? "border-red-500/30 bg-red-50 text-red-800" : "border-navy-100 bg-white text-navy-950"}`}
    >
      {message}
    </div>
  );
}
