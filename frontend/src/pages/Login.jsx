import React, { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { ArrowRightIcon, CheckIcon } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useData } from "../contexts/DataContext";
import { DEMO_PASSWORD } from "../data/users";
import { Button } from "../components/ui/Button";
import { Field, Select, TextInput } from "../components/ui/Field";
import { Avatar } from "../components/ui/Avatar";
import { cn } from "../utils/cn";
export function Login() {
  const { user, login, register } = useAuth();
  const { users } = useData();
  const navigate = useNavigate();
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("amara@northlight.io");
  const [password, setPassword] = useState(DEMO_PASSWORD);
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [role, setRole] = useState("team_member");
  const [error, setError] = useState(null);
  if (user) return <Navigate to="/" replace />;
  const demoAccounts = [
    users.find((u) => u.role === "manager"),
    users.find((u) => u.id === "u-2"),
    users.find((u) => u.id === "u-5"),
  ].filter(Boolean);
  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    if (mode === "login") {
      if (!email.trim()) return setError("Enter your email address.");
      try {
        await login(email, password);
        return navigate("/");
      } catch (requestError) {
        return setError(requestError.message ?? "Unable to sign in.");
      }
    }
    if (name.trim().length < 2) return setError("Enter your full name.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      return setError("Enter a valid email address.");
    try {
      await register({ name, email, password, role, title: title || "Team member" });
      navigate("/");
    } catch (requestError) {
      setError(requestError.message ?? "Unable to create the account.");
    }
  };
  return (
    <div className="flex min-h-full w-full bg-canvas">
      <div className="flex w-full flex-col justify-center px-5 py-10 sm:px-10 lg:w-[52%] lg:px-16">
        <div className="mx-auto w-full max-w-md">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-sm font-bold text-white">
              N
            </span>
            <div className="leading-tight">
              <p className="text-sm font-semibold text-ink">Northlight</p>
              <p className="text-2xs text-ink-faint">Weekly reporting</p>
            </div>
          </div>

          <h1 className="mt-10 text-3xl font-semibold tracking-[-0.02em] text-ink">
            {mode === "login"
              ? "Sign in to your workspace"
              : "Create your account"}
          </h1>
          <p className="mt-2 text-sm text-ink-muted">
            {mode === "login"
              ? "Weekly reports, review cycles and team insight in one place."
              : "Team members file weekly reports; managers review them and see the whole team."}
          </p>

          <form className="mt-8 space-y-4" onSubmit={submit} noValidate>
            {mode === "register" ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Full name" htmlFor="name" required>
                  <TextInput
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="name"
                    placeholder="Jordan Vale"
                  />
                </Field>
                <Field label="Job title" htmlFor="title">
                  <TextInput
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Backend Engineer"
                  />
                </Field>
              </div>
            ) : null}

            <Field label="Work email" htmlFor="email" required>
              <TextInput
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                placeholder="you@northlight.io"
              />
            </Field>

            <Field
              label="Password"
              htmlFor="password"
              required
              hint={
                mode === "login"
                  ? `Demo password: ${DEMO_PASSWORD}`
                  : "At least 6 characters."
              }
            >
              <TextInput
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
              />
            </Field>

            {mode === "register" ? (
              <Field
                label="Role"
                htmlFor="role"
                hint="Managers get the team dashboard and review queue."
              >
                <Select
                  id="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  <option value="team_member">Team member</option>
                  <option value="manager">Manager</option>
                </Select>
              </Field>
            ) : null}

            {error ? (
              <p
                role="alert"
                className="rounded-lg bg-rose-50 px-3 py-2 text-[13px] text-rose-700"
              >
                {error}
              </p>
            ) : null}

            <Button type="submit" variant="primary" className="w-full">
              {mode === "login" ? "Sign in" : "Create account"}
              <ArrowRightIcon className="h-4 w-4" />
            </Button>
          </form>

          <p className="mt-5 text-[13px] text-ink-muted">
            {mode === "login"
              ? "Don't have an account?"
              : "Already have an account?"}{" "}
            <button
              type="button"
              onClick={() => {
                setMode(mode === "login" ? "register" : "login");
                setError(null);
              }}
              className="font-medium text-accent underline-offset-4 hover:underline"
            >
              {mode === "login" ? "Register" : "Sign in"}
            </button>
          </p>
        </div>
      </div>

      <aside className="relative hidden w-[48%] flex-col justify-between border-l border-line bg-surface px-14 py-14 lg:flex">
        <div>
          <p className="text-[13px] font-medium text-ink-muted">
            The weekly loop
          </p>
          <ol className="mt-5 space-y-5">
            {[
              [
                "Draft",
                "Team member fills the fixed weekly template — tasks, blockers, wins, hours.",
              ],
              ["Submitted", "The report lands in the manager review queue."],
              [
                "Needs correction",
                "Manager sends it back with one clear comment; the member edits and resubmits.",
              ],
              [
                "Approved",
                "Locked in, and every prior version stays readable.",
              ],
            ].map(([label, body], index) => (
              <li key={label} className="flex gap-4">
                <span
                  className={cn(
                    "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-2xs font-semibold",
                    index === 3
                      ? "bg-accent text-white"
                      : "bg-line text-ink-muted",
                  )}
                >
                  {index === 3 ? (
                    <CheckIcon className="h-3.5 w-3.5" />
                  ) : (
                    index + 1
                  )}
                </span>
                <div>
                  <p className="text-sm font-medium text-ink">{label}</p>
                  <p className="mt-0.5 max-w-sm text-[13px] leading-relaxed text-ink-muted">
                    {body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div className="rounded-xl border border-line bg-subtle p-5">
          <p className="text-[13px] font-medium text-ink">Demo accounts</p>
          <p className="mt-1 text-2xs text-ink-faint">
            Password for all seeded accounts: {DEMO_PASSWORD}
          </p>
          <ul className="mt-3 space-y-1.5">
            {demoAccounts.map((account) => (
              <li key={account.id}>
                <button
                  type="button"
                  onClick={() => {
                    setMode("login");
                    setEmail(account.email);
                    setPassword(DEMO_PASSWORD);
                    setError(null);
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg border border-transparent bg-surface px-3 py-2 text-left transition-colors duration-150 ease-out hover:border-line-strong"
                >
                  <Avatar name={account.name} size="sm" />
                  <span className="min-w-0">
                    <span className="block truncate text-[13px] font-medium text-ink">
                      {account.name}
                    </span>
                    <span className="block truncate text-2xs text-ink-faint">
                      {account.title}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}
