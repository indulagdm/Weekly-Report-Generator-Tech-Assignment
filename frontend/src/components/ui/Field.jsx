import React from "react";
import { cn } from "../../utils/cn";
const control =
  "w-full rounded-lg border border-line-strong bg-surface px-3 text-sm text-ink placeholder:text-ink-faint transition-colors duration-150 ease-out focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 disabled:bg-subtle disabled:text-ink-muted";
export function Field({
  label,
  htmlFor,
  hint,
  error,
  required,
  children,
  className,
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label
        htmlFor={htmlFor}
        className="block text-[13px] font-medium text-ink-soft"
      >
        {label}
        {required ? <span className="ml-0.5 text-rose-600">*</span> : null}
      </label>
      {children}
      {error ? (
        <p className="text-xs text-rose-600">{error}</p>
      ) : hint ? (
        <p className="text-xs text-ink-faint">{hint}</p>
      ) : null}
    </div>
  );
}
export const TextInput = React.forwardRef(function TextInput(
  { className, ...props },
  ref,
) {
  return (
    <input ref={ref} className={cn(control, "h-10", className)} {...props} />
  );
});
export const Select = React.forwardRef(function Select(
  { className, children, ...props },
  ref,
) {
  return (
    <select
      ref={ref}
      className={cn(control, "h-10 pr-8", className)}
      {...props}
    >
      {children}
    </select>
  );
});
export const TextArea = React.forwardRef(function TextArea(
  { className, ...props },
  ref,
) {
  return (
    <textarea
      ref={ref}
      className={cn(control, "py-2.5 leading-relaxed", className)}
      {...props}
    />
  );
});
