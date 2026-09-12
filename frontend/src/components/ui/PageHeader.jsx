import React from "react";
import { cn } from "../../utils/cn";
export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}) {
  return (
    <header
      className={cn(
        "flex flex-wrap items-end justify-between gap-4",
        className,
      )}
    >
      <div className="min-w-0">
        {eyebrow ? (
          <p className="text-[13px] font-medium text-ink-muted">{eyebrow}</p>
        ) : null}
        <h1 className="mt-0.5 text-2xl font-semibold tracking-[-0.01em] text-ink">
          {title}
        </h1>
        {description ? (
          <p className="mt-1.5 max-w-2xl text-sm text-ink-muted">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </header>
  );
}
