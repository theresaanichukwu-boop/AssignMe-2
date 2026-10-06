import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "accent" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary: "bg-navy-950 text-white hover:bg-navy-900 disabled:bg-navy-100",
  secondary:
    "border border-navy-100 bg-white text-navy-950 hover:border-teal-700 hover:text-teal-800 disabled:text-slate-400",
  accent: "bg-teal-700 text-white hover:bg-teal-600 disabled:bg-teal-100",
  ghost: "text-navy-950 hover:bg-navy-50 disabled:text-slate-400",
  danger: "bg-coral-600 text-white hover:bg-coral-700 disabled:bg-coral-100",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-base",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  className = "",
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled ?? loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading && (
        <span
          aria-hidden="true"
          className="h-4 w-4 animate-spin rounded-pill border-2 border-current border-t-transparent"
        />
      )}
      {children}
    </button>
  );
}
