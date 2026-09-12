import React from "react";
import { Link } from "react-router-dom";
import { Avatar } from "../ui/Avatar";
import { StatusBadge } from "../ui/StatusBadge";
export function MemberStatusList({ rows }) {
  return (
    <ul className="divide-y divide-line">
      {rows.map((row) => (
        <li
          key={row.userId}
          className="flex items-center justify-between gap-3 px-5 py-3"
        >
          <Link
            to={`/team/members/${row.userId}`}
            className="flex min-w-0 items-center gap-2.5 text-[13px] font-medium text-ink hover:text-accent"
          >
            <Avatar name={row.name} size="sm" />
            <span className="truncate">{row.name}</span>
          </Link>
          <div className="flex shrink-0 items-center gap-3">
            <StatusBadge status={row.status} />
            {row.reportId ? (
              <Link
                to={`/reports/${row.reportId}`}
                className="text-[13px] text-ink-muted transition-colors duration-150 ease-out hover:text-ink"
              >
                View
              </Link>
            ) : (
              <span className="text-[13px] text-ink-faint">—</span>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
