import React, { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  BarChart3Icon,
  ClipboardListIcon,
  FolderKanbanIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  MenuIcon,
  UsersIcon,
  XIcon,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { cn } from "../../utils/cn";
import { roleLabels } from "../../utils/labels";
import { Avatar } from "../ui/Avatar";
import { AiAssistant } from "../ai/AiAssistant";
const managerNav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboardIcon },
  { to: "/team", label: "Team reports", icon: ClipboardListIcon },
  { to: "/team/sections", label: "Section view", icon: BarChart3Icon },
  { to: "/projects", label: "Projects", icon: FolderKanbanIcon },
  { to: "/users", label: "People", icon: UsersIcon },
];
const memberNav = [
  { to: "/my-reports", label: "My reports", icon: ClipboardListIcon },
  { to: "/projects", label: "Projects", icon: FolderKanbanIcon },
];
export function AppShell() {
  const { user, isManager, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  if (!user) return null;
  const nav = isManager ? managerNav : memberNav;
  const navList = (
    <nav className="flex flex-col gap-0.5" aria-label="Main">
      {nav.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === "/team"}
          onClick={() => setMobileOpen(false)}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors duration-150 ease-out",
              isActive
                ? "bg-ink text-white"
                : "text-ink-muted hover:bg-line/60 hover:text-ink",
            )
          }
        >
          <item.icon className="h-4 w-4" />
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
  const sidebarBody = (
    <div className="flex h-full flex-col justify-between">
      <div className="space-y-6">
        <div className="flex items-center gap-2.5 px-1">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-sm font-bold text-white">
            N
          </span>
          <div className="leading-tight">
            <p className="text-sm font-semibold text-ink">Northlight</p>
            <p className="text-2xs text-ink-faint">Weekly reporting</p>
          </div>
        </div>
        {navList}
      </div>

      <div className="space-y-2 border-t border-line pt-4">
        <div className="flex items-center gap-2.5 px-1">
          <Avatar name={user.name} size="sm" />
          <div className="min-w-0 leading-tight">
            <p className="truncate text-[13px] font-medium text-ink">
              {user.name}
            </p>
            <p className="truncate text-2xs text-ink-faint">
              {roleLabels[user.role]}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            logout();
            navigate("/login");
          }}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium text-ink-muted transition-colors duration-150 ease-out hover:bg-line/60 hover:text-ink"
        >
          <LogOutIcon className="h-4 w-4" />
          Log out
        </button>
      </div>
    </div>
  );
  return (
    <div className="flex min-h-full w-full bg-canvas">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 border-r border-line bg-surface px-3 py-5 lg:block">
        {sidebarBody}
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-ink/25"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />

          <div className="absolute inset-y-0 left-0 w-64 border-r border-line bg-surface px-3 py-5 shadow-pop">
            {sidebarBody}
          </div>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="sticky top-0 z-30 flex items-center gap-3 border-b border-line bg-surface/90 px-4 py-3 backdrop-blur lg:hidden">
          <button
            type="button"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            onClick={() => setMobileOpen((v) => !v)}
            className="rounded-lg border border-line-strong p-2 text-ink"
          >
            {mobileOpen ? (
              <XIcon className="h-4 w-4" />
            ) : (
              <MenuIcon className="h-4 w-4" />
            )}
          </button>
          <span className="text-sm font-semibold text-ink">Northlight</span>
        </div>

        <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>

      {isManager ? <AiAssistant /> : null}
    </div>
  );
}
