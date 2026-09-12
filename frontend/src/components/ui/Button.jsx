import React from "react";
import { cn } from "../../utils/cn";
const base =
  "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-[background-color,color,border-color,box-shadow,transform] duration-150 ease-out disabled:cursor-not-allowed disabled:opacity-45 active:translate-y-px";
const variants = {
  primary: "bg-ink text-white hover:bg-ink-soft shadow-card",
  accent: "bg-accent text-white hover:bg-accent-hover shadow-card",
  secondary: "bg-surface text-ink border border-line-strong hover:bg-subtle",
  ghost: "text-ink-muted hover:text-ink hover:bg-line/60",
  danger: "bg-white text-rose-700 border border-rose-200 hover:bg-rose-50",
};
const sizes = {
  sm: "h-8 px-3 text-[13px]",
  md: "h-10 px-4 text-sm",
};
export function Button({
  variant = "secondary",
  size = "md",
  className,
  type = "button",
  ...props
}) {
  return (
    <button
      type={type}
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    />
  );
}
