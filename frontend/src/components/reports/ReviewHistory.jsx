import React from "react";
import { CheckCircle2Icon, MessageSquareIcon } from "lucide-react";
import { cn } from "../../utils/cn";
import { formatDateTime } from "../../utils/date";
export function ReviewHistory({ comments, users, emptyLabel }) {
  if (comments.length === 0) {
    return (
      <p className="px-5 py-5 text-[13px] text-ink-muted">
        {emptyLabel ?? "No review activity yet."}
      </p>
    );
  }
  return (
    <ol className="divide-y divide-line">
      {comments.map((c) => {
        const reviewer = users.find((u) => u.id === c.reviewerId);
        const approved = c.action === "approved";
        return (
          <li key={c.id} className="flex gap-3 px-5 py-4">
            <span
              className={cn(
                "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                approved
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-amber-50 text-amber-700",
              )}
            >
              {approved ? (
                <CheckCircle2Icon className="h-4 w-4" />
              ) : (
                <MessageSquareIcon className="h-4 w-4" />
              )}
            </span>
            <div className="min-w-0">
              <p className="text-[13px] font-medium text-ink">
                {reviewer?.name ?? "Manager"}{" "}
                <span className="font-normal text-ink-muted">
                  {approved ? "approved" : "requested changes on"} version{" "}
                  {c.versionNumber}
                </span>
              </p>
              {c.comment ? (
                <p className="mt-1 whitespace-pre-line text-[13px] leading-relaxed text-ink-soft">
                  {c.comment}
                </p>
              ) : null}
              <p className="mt-1.5 text-2xs text-ink-faint">
                {formatDateTime(c.createdAt)}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
