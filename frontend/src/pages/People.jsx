import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { SearchIcon, UserPlusIcon } from "lucide-react";
import { useData } from "../contexts/DataContext";
import { roleLabels } from "../utils/labels";
import { currentWeekStart, formatDate } from "../utils/date";
import { PageHeader } from "../components/ui/PageHeader";
import { Panel, PanelHeader } from "../components/ui/Panel";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { Field, Select, TextInput } from "../components/ui/Field";
import { Avatar } from "../components/ui/Avatar";
import { StatusBadge } from "../components/ui/StatusBadge";
import { useToast } from "../components/ui/Toast";
export function People() {
  const { users, reports, inviteUser, updateUser } = useData();
  const { notify } = useToast();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [inviting, setInviting] = useState(false);
  const [confirmDeactivate, setConfirmDeactivate] = useState(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    title: "",
    role: "team_member",
  });
  const [error, setError] = useState(null);
  const filtered = useMemo(
    () =>
      users
        .filter((u) => (roleFilter === "all" ? true : u.role === roleFilter))
        .filter((u) =>
          search.trim()
            ? `${u.name} ${u.email} ${u.title}`
                .toLowerCase()
                .includes(search.toLowerCase())
            : true,
        ),
    [users, roleFilter, search],
  );
  const weekStatus = (userId) => {
    const report = reports.find(
      (r) => r.userId === userId && r.weekStartDate === currentWeekStart(),
    );
    return report ? report.status : "not_started";
  };
  const invite = () => {
    if (form.name.trim().length < 2) return setError("Enter a full name.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
      return setError("Enter a valid email address.");
    if (
      users.some(
        (u) => u.email.toLowerCase() === form.email.trim().toLowerCase(),
      )
    )
      return setError("That email is already on the team.");
    inviteUser({
      name: form.name.trim(),
      email: form.email.trim(),
      title: form.title.trim() || "Team member",
      role: form.role,
    });
    notify(`Invited ${form.name.trim()}`);
    setForm({ name: "", email: "", title: "", role: "team_member" });
    setError(null);
    setInviting(false);
  };
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Administration"
        title="People"
        description="Invite team members, set roles, and deactivate people who have left without losing their report history."
        actions={
          <Button variant="primary" onClick={() => setInviting(true)}>
            <UserPlusIcon className="h-4 w-4" />
            Invite member
          </Button>
        }
      />

      <Panel>
        <PanelHeader
          title="Team"
          description={`${users.filter((u) => u.isActive).length} active`}
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
                <TextInput
                  aria-label="Search people"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search name or email"
                  className="w-56 pl-9"
                />
              </div>
              <Select
                aria-label="Filter by role"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-40"
              >
                <option value="all">All roles</option>
                <option value="team_member">Team members</option>
                <option value="manager">Managers</option>
              </Select>
            </div>
          }
        />

        <div className="overflow-x-auto scroll-thin">
          <table className="w-full min-w-[760px] border-collapse text-left">
            <thead>
              <tr className="border-b border-line text-2xs uppercase tracking-wide text-ink-faint">
                <th scope="col" className="px-5 py-2.5 font-medium">
                  Person
                </th>
                <th scope="col" className="px-3 py-2.5 font-medium">
                  Role
                </th>
                <th scope="col" className="px-3 py-2.5 font-medium">
                  This week
                </th>
                <th scope="col" className="px-3 py-2.5 font-medium">
                  Joined
                </th>
                <th scope="col" className="px-5 py-2.5 font-medium">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((person) => (
                <tr
                  key={person.id}
                  className="border-b border-line/70 transition-colors duration-150 ease-out last:border-0 hover:bg-subtle"
                >
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={person.name} size="sm" />
                      <div className="leading-tight">
                        {person.role === "team_member" ? (
                          <Link
                            to={`/team/members/${person.id}`}
                            className="text-[13px] font-medium text-ink hover:text-accent"
                          >
                            {person.name}
                          </Link>
                        ) : (
                          <span className="text-[13px] font-medium text-ink">
                            {person.name}
                          </span>
                        )}
                        <p className="text-2xs text-ink-faint">
                          {person.email}
                        </p>
                      </div>
                      {!person.isActive ? (
                        <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-2xs font-medium text-zinc-600">
                          Deactivated
                        </span>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <Select
                      aria-label={`Role for ${person.name}`}
                      value={person.role}
                      onChange={(e) => {
                        updateUser(person.id, { role: e.target.value });
                        notify(
                          `${person.name} is now a ${roleLabels[e.target.value].toLowerCase()}`,
                        );
                      }}
                      className="h-9 w-40 text-[13px]"
                    >
                      <option value="team_member">Team member</option>
                      <option value="manager">Manager</option>
                    </Select>
                  </td>
                  <td className="px-3 py-3">
                    {person.role === "team_member" ? (
                      <StatusBadge status={weekStatus(person.id)} />
                    ) : (
                      <span className="text-[13px] text-ink-faint">—</span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-[13px] text-ink-muted">
                    {formatDate(person.createdAt)}
                  </td>
                  <td className="px-5 py-3">
                    {person.isActive ? (
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => setConfirmDeactivate(person)}
                      >
                        Deactivate
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => {
                          updateUser(person.id, { isActive: true });
                          notify(`${person.name} reactivated`);
                        }}
                      >
                        Reactivate
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Modal
        open={inviting}
        onClose={() => setInviting(false)}
        title="Invite a team member"
        description="They will be able to sign in and file weekly reports straight away."
        footer={
          <>
            <Button onClick={() => setInviting(false)}>Cancel</Button>
            <Button variant="primary" onClick={invite}>
              Send invite
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field
            label="Full name"
            htmlFor="invite-name"
            required
            error={error ?? undefined}
          >
            <TextInput
              id="invite-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Jordan Vale"
            />
          </Field>
          <Field label="Work email" htmlFor="invite-email" required>
            <TextInput
              id="invite-email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="jordan@northlight.io"
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Job title" htmlFor="invite-title">
              <TextInput
                id="invite-title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Backend Engineer"
              />
            </Field>
            <Field label="Role" htmlFor="invite-role">
              <Select
                id="invite-role"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              >
                <option value="team_member">Team member</option>
                <option value="manager">Manager</option>
              </Select>
            </Field>
          </div>
        </div>
      </Modal>

      <Modal
        open={Boolean(confirmDeactivate)}
        onClose={() => setConfirmDeactivate(null)}
        title={`Deactivate ${confirmDeactivate?.name ?? ""}?`}
        description="They lose access immediately, but every report and review comment stays intact."
        footer={
          <>
            <Button onClick={() => setConfirmDeactivate(null)}>Cancel</Button>
            <Button
              variant="danger"
              onClick={() => {
                if (confirmDeactivate) {
                  updateUser(confirmDeactivate.id, { isActive: false });
                  notify(`${confirmDeactivate.name} deactivated`, "info");
                }
                setConfirmDeactivate(null);
              }}
            >
              Deactivate
            </Button>
          </>
        }
      >
        <p className="text-[13px] text-ink-soft">
          Deactivating is preferred over deleting so the manager's review trail
          and the team's historical dashboards stay accurate.
        </p>
      </Modal>
    </div>
  );
}
