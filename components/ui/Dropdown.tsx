"use client";

import { useEffect, useRef, useState } from "react";

export function Dropdown({
  label,
  items,
}: {
  label: string;
  items: Array<{ id: string; label: string; onSelect: () => void }>;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open ]);

  return (
    <div ref={ref} className="relative inline-block">
      <button
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-10 items-center gap-2 rounded-md border border-navy-100 bg-white px-4 text-sm font-medium hover:border-teal-700 focus-visible:outline-2 focus-visible:outline-teal-700"
      >
        {label}
        <span aria-hidden="true">▾</span>
      </button>
      {open && (
        <div
          role="menu"
          aria-label={label}
          className="absolute z-40 mt-2 min-w-48 rounded-md border border-navy-100 bg-white p-1 shadow-lg"
        >
          {items.map((item) => (
            <button
              key={item.id}
              role="menuitem"
              onClick={() => {
                item.onSelect();
                setOpen(false);
              }}
              className="block w-full rounded-sm px-3 py-2 text-left text-sm hover:bg-navy-50 focus-visible:outline-2 focus-visible:outline-teal-700"
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
