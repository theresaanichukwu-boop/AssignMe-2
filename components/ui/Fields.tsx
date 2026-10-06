import type { TextareaHTMLAttributes, SelectHTMLAttributes } from "react";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
}

export function Textarea({ label, error, id, className = "", ...rest }: TextareaProps) {
  const inputId = id ?? `textarea-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  return (
    <div className={className}>
      <label htmlFor={inputId} className="mb-1 block text-sm font-medium">
        {label}
      </label>
      <textarea
        id={inputId}
        rows={4}
        aria-invalid={error ? true : undefined}
        className={`w-full rounded-md border bg-white px-3 py-2 text-sm hover:border-teal-700 focus:border-teal-700 focus:outline-2 focus:outline-teal-700 disabled:cursor-not-allowed disabled:bg-navy-50 ${error ? "border-red-500" : "border-navy-100"}`}
        {...rest}
      />
      {error && (
        <p role="alert" className="mt-1 text-xs text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  options: Array<{ value: string; label: string }>;
}

export function Select({ label, error, id, options, className = "", ...rest }: SelectProps) {
  const inputId = id ?? `select-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  return (
    <div className={className}>
      <label htmlFor={inputId} className="mb-1 block text-sm font-medium">
        {label}
      </label>
      <select
        id={inputId}
        aria-invalid={error ? true : undefined}
        className={`h-10 w-full rounded-md border bg-white px-3 text-sm hover:border-teal-700 focus:border-teal-700 focus:outline-2 focus:outline-teal-700 disabled:cursor-not-allowed disabled:bg-navy-50 ${error ? "border-red-500" : "border-navy-100"}`}
        {...rest}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {error && (
        <p role="alert" className="mt-1 text-xs text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
