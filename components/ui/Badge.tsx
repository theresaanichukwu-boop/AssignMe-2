import type { HTMLAttributes } from "react";

type Tone = "neutral" | "success" | "warning" | "error" | "info" | "accent";

const tones: Record<Tone, string> = {
  neutral: "bg-navy-50 text-navy-900",
  success: "bg-teal-50 text-teal-800",
  warning: "bg-amber-50 text-amber-800",
  error: "bg-red-50 text-red-800",
  info: "bg-navy-100 text-navy-900",
  accent: "bg-coral-50 text-coral-700",
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
}

export function Badge({ tone = "neutral", className = "", ...rest }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-pill px-2.5 py-0.5 text-xs font-medium ${tones[tone]} ${className}`}
      {...rest}
    />
  );
}
