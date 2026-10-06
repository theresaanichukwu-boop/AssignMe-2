"use client";

import type { InputHTMLAttributes } from "react";
import { useId, useState } from "react";

export interface FileUploadProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
  accept?: string;
  maxSizeMb?: number;
}

export function FileUpload({
  label,
  accept = ".pdf,.docx,.txt,.md",
  maxSizeMb = 10,
  id,
  onChange,
  className = "",
  ...rest
}: FileUploadProps) {
  const autoId = useId();
  const inputId = id ?? `file-${autoId}`;
  const [error, setError] = useState<string | null>(null);

  return (
    <div className={className}>
      <label htmlFor={inputId} className="mb-1 block text-sm font-medium">
        {label}
      </label>
      <input
        id={inputId}
        type="file"
        accept={accept}
        aria-describedby={`${inputId}-hint`}
        aria-invalid={error ? true : undefined}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file && file.size > maxSizeMb * 1024 * 1024) {
            setError(`File exceeds ${maxSizeMb}MB limit.`);
            return;
          }
          setError(null);
          onChange?.(e);
        }}
        className="block w-full rounded-md border border-dashed border-navy-100 bg-navy-50 px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-navy-950 file:px-3 file:py-1.5 file:text-sm file:text-white hover:border-teal-700 focus:border-teal-700 focus:outline-2 focus:outline-teal-700"
        {...rest}
      />
      <p id={`${inputId}-hint`} className="mt-1 text-xs text-slate-500">
        Accepted: {accept}. Max {maxSizeMb}MB.
      </p>
      {error && (
        <p role="alert" className="mt-1 text-xs text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
