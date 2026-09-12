import React from "react";
import { MessageSquareWarningIcon } from "lucide-react";
import { formatDateTime } from "../../utils/date";
export function CorrectionBanner({ comment, reviewer, action }) {
  return (
    <div className="flex flex-wrap items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
      <MessageSquareWarningIcon className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-amber-900">
          Changes requested by {reviewer?.name ?? "your manager"}
        </p>
        <p className="mt-1 whitespace-pre-line text-[13px] leading-relaxed text-amber-900/90">
          {comment.comment}
        </p>
        <p className="mt-1.5 text-2xs text-amber-700">
          On version {comment.versionNumber} ·{" "}
          {formatDateTime(comment.createdAt)}
        </p>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
