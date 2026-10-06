import type { HTMLAttributes, ReactNode } from "react";

type Tone = "neutral" | "success" | "warning" | "error" | "info";

const tones: Record<Tone, string> = {
  neutral: "border-navy-100 bg-navy-50 text-navy-900",
  success: "border-teal-600/30 bg-teal-50 text-teal-800",
  warning: "border-amber-500/30 bg-amber-50 text-amber-800",
  error: "border-red-500/30 bg-red-50 text-red-800",
  info: "border-navy-800/20 bg-white text-navy-900",
};

export interface CardProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  title?: ReactNode;
}

export function Card({ title, className = "", children, ...rest }: CardProps) {
  return (
    <section
      className={`rounded-lg border border-navy-100 bg-white p-6 shadow-sm ${className}`}
      {...rest}
    >
      {title && <h3 className="text-lg font-semibold">{title}</h3>}
      {children}
    </section>
  );
}

export function Alert({
  tone = "neutral",
  role = "alert",
  className = "",
  children,
  ...rest
}: HTMLAttributes<HTMLDivElement> & { tone?: Tone }) {
  return (
    <div
      role={role}
      className={`rounded-md border p-4 text-sm ${tones[tone]} ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}
