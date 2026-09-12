import React from "react";
import { cn } from "../../utils/cn";
import { initials } from "../../utils/labels";
const palette = [
  "bg-accent-soft text-accent",
  "bg-blue-50 text-blue-700",
  "bg-amber-50 text-amber-700",
  "bg-rose-50 text-rose-700",
  "bg-violet-50 text-violet-700",
  "bg-emerald-50 text-emerald-700",
];
function hue(seed) {
  let total = 0;
  for (let i = 0; i < seed.length; i += 1) total += seed.charCodeAt(i);
  return palette[total % palette.length];
}
const sizes = {
  sm: "h-7 w-7 text-2xs",
  md: "h-9 w-9 text-xs",
  lg: "h-14 w-14 text-base",
};
export function Avatar({ name, size = "md", className }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold",
        sizes[size],
        hue(name),
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}
