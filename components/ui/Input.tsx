import type { InputHTMLAttributes } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

const base =
  "h-10 w-full rounded-md border bg-white px-3 text-sm text-navy-950 placeholder:text-slate-400 hover:border-teal-700 focus:border-teal-700 focus:outline-2 focus:outline-teal-700 disabled:cursor-not-allowed disabled:bg-navy-50 disabled:text-slate-400";

export function Input({ label, error, hint, id, className = "", ...rest }: InputProps) {
  const inputId = id ?? `input-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  return (
    <div className={className}>
      <label htmlFor={inputId} className="mb-1 block text-sm font-medium">
        {label}
      </label>
      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={[hintId, errorId].filter(Boolean).join(" ") || undefined}
        className={`${base} ${error ? "border-red-500" : "border-navy-100"}`}
        {...rest}
      />
      {hint && !error && (
        <p id={hintId} className="mt-1 text-xs text-slate-500">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="mt-1 text-xs text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}

export function SearchInput(props: InputProps & { onSearch?: () => void }) {
  const { onSearch, ...rest } = props;
  return (
    <div role="search">
      <Input type="search" {...rest} />
      {onSearch && <span className="sr-only">Press Enter to search</span>}
    </div>
  );
}
