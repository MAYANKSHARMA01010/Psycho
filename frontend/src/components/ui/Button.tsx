import { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-60 disabled:cursor-not-allowed",
  secondary:
    "border border-slate-200 bg-white text-slate-800 hover:bg-slate-50 disabled:opacity-60 disabled:cursor-not-allowed",
  ghost:
    "text-slate-600 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-60 disabled:cursor-not-allowed",
  danger:
    "bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-60 disabled:cursor-not-allowed",
};

const SIZES: Record<Size, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
};

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  leading?: ReactNode;
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  leading,
  children,
  className = "",
  disabled,
  ...rest
}: Props) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-semibold shadow-sm transition active:scale-[0.98] ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
    >
      {loading ? (
        <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-r-transparent" />
      ) : (
        leading
      )}
      {children}
    </button>
  );
}
