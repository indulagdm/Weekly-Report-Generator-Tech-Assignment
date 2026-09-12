import React from "react";
import { PlusIcon, Trash2Icon } from "lucide-react";
import { TASK_TYPES } from "../../types";
import { makeId } from "../../utils/id";
import { cn } from "../../utils/cn";
import { Button } from "../ui/Button";
import { Field, Select, TextArea, TextInput } from "../ui/Field";
import { Panel, PanelHeader } from "../ui/Panel";
import { TaskTableEditor } from "./TaskTableEditor";
export function ReportForm({ value, onChange, errors }) {
  const totalHours = value.hours.reduce(
    (s, h) => s + (Number(h.hours) || 0),
    0,
  );
  const setKeyBlocker = (id) =>
    onChange({
      blockers: value.blockers.map((b) => ({
        ...b,
        isKeyIssue: b.id === id ? !b.isKeyIssue : false,
      })),
    });
  const setKeyAchievement = (id) =>
    onChange({
      achievements: value.achievements.map((a) => ({
        ...a,
        isKeyAchievement: a.id === id ? !a.isKeyAchievement : false,
      })),
    });
  const updateBlocker = (id, patch) =>
    onChange({
      blockers: value.blockers.map((b) =>
        b.id === id ? { ...b, ...patch } : b,
      ),
    });
  const updateAchievement = (id, patch) =>
    onChange({
      achievements: value.achievements.map((a) =>
        a.id === id ? { ...a, ...patch } : a,
      ),
    });
  const updateHours = (id, patch) =>
    onChange({
      hours: value.hours.map((h) => (h.id === id ? { ...h, ...patch } : h)),
    });
  return (
    <div className="space-y-5">
      <Panel>
        <PanelHeader
          title="Tasks completed"
          description="One row per task. Planned vs actual keeps the manager's view comparable across the team."
        />

        <div className="px-5 py-4">
          <TaskTableEditor
            tasks={value.tasks}
            onChange={(tasks) => onChange({ tasks })}
            error={errors.tasks}
          />
        </div>
      </Panel>

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel>
          <PanelHeader
            title="Blockers & challenges"
            description="Flag one as the key issue for the week."
          />

          <div className="space-y-2.5 px-5 py-4">
            {value.blockers.map((blocker, index) => (
              <div key={blocker.id} className="flex items-start gap-2">
                <TextInput
                  aria-label={`Blocker ${index + 1}`}
                  value={blocker.description}
                  onChange={(e) =>
                    updateBlocker(blocker.id, { description: e.target.value })
                  }
                  placeholder="What slowed you down?"
                />

                <button
                  type="button"
                  onClick={() => setKeyBlocker(blocker.id)}
                  aria-pressed={blocker.isKeyIssue}
                  className={cn(
                    "h-10 shrink-0 rounded-lg border px-2.5 text-2xs font-semibold uppercase tracking-wide transition-colors duration-150 ease-out",
                    blocker.isKeyIssue
                      ? "border-amber-300 bg-amber-50 text-amber-800"
                      : "border-line-strong text-ink-faint hover:text-ink",
                  )}
                >
                  Key
                </button>
                <button
                  type="button"
                  aria-label={`Remove blocker ${index + 1}`}
                  onClick={() =>
                    onChange({
                      blockers: value.blockers.filter(
                        (b) => b.id !== blocker.id,
                      ),
                    })
                  }
                  className="mt-2.5 rounded-md p-1.5 text-ink-faint transition-colors duration-150 ease-out hover:bg-rose-50 hover:text-rose-600"
                >
                  <Trash2Icon className="h-4 w-4" />
                </button>
              </div>
            ))}
            <Button
              size="sm"
              onClick={() =>
                onChange({
                  blockers: [
                    ...value.blockers,
                    { id: makeId("blk"), description: "", isKeyIssue: false },
                  ],
                })
              }
            >
              <PlusIcon className="h-4 w-4" />
              Add blocker
            </Button>
          </div>
        </Panel>

        <Panel>
          <PanelHeader
            title="Achievements & highlights"
            description="Flag one as the key achievement for the week."
          />

          <div className="space-y-2.5 px-5 py-4">
            {value.achievements.map((achievement, index) => (
              <div key={achievement.id} className="flex items-start gap-2">
                <TextInput
                  aria-label={`Achievement ${index + 1}`}
                  value={achievement.description}
                  onChange={(e) =>
                    updateAchievement(achievement.id, {
                      description: e.target.value,
                    })
                  }
                  placeholder="What went well?"
                />

                <button
                  type="button"
                  onClick={() => setKeyAchievement(achievement.id)}
                  aria-pressed={achievement.isKeyAchievement}
                  className={cn(
                    "h-10 shrink-0 rounded-lg border px-2.5 text-2xs font-semibold uppercase tracking-wide transition-colors duration-150 ease-out",
                    achievement.isKeyAchievement
                      ? "border-accent/40 bg-accent-soft text-accent"
                      : "border-line-strong text-ink-faint hover:text-ink",
                  )}
                >
                  Key
                </button>
                <button
                  type="button"
                  aria-label={`Remove achievement ${index + 1}`}
                  onClick={() =>
                    onChange({
                      achievements: value.achievements.filter(
                        (a) => a.id !== achievement.id,
                      ),
                    })
                  }
                  className="mt-2.5 rounded-md p-1.5 text-ink-faint transition-colors duration-150 ease-out hover:bg-rose-50 hover:text-rose-600"
                >
                  <Trash2Icon className="h-4 w-4" />
                </button>
              </div>
            ))}
            <Button
              size="sm"
              onClick={() =>
                onChange({
                  achievements: [
                    ...value.achievements,
                    {
                      id: makeId("ach"),
                      description: "",
                      isKeyAchievement: false,
                    },
                  ],
                })
              }
            >
              <PlusIcon className="h-4 w-4" />
              Add achievement
            </Button>
          </div>
        </Panel>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_1.2fr]">
        <Panel>
          <PanelHeader
            title="Hours by task type"
            description="Optional"
            actions={
              <span className="text-[13px] tnum font-medium text-ink">
                {totalHours}h
              </span>
            }
          />

          <div className="space-y-2.5 px-5 py-4">
            {value.hours.map((entry, index) => (
              <div key={entry.id} className="flex items-center gap-2">
                <Select
                  aria-label={`Hours row ${index + 1} type`}
                  value={entry.taskType}
                  onChange={(e) =>
                    updateHours(entry.id, { taskType: e.target.value })
                  }
                >
                  {TASK_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </Select>
                <TextInput
                  aria-label={`Hours row ${index + 1} hours`}
                  type="number"
                  min={0}
                  value={entry.hours}
                  onChange={(e) =>
                    updateHours(entry.id, {
                      hours: Math.max(Number(e.target.value) || 0, 0),
                    })
                  }
                  className="w-24 tnum"
                />

                <button
                  type="button"
                  aria-label={`Remove hours row ${index + 1}`}
                  onClick={() =>
                    onChange({
                      hours: value.hours.filter((h) => h.id !== entry.id),
                    })
                  }
                  className="rounded-md p-1.5 text-ink-faint transition-colors duration-150 ease-out hover:bg-rose-50 hover:text-rose-600"
                >
                  <Trash2Icon className="h-4 w-4" />
                </button>
              </div>
            ))}
            <Button
              size="sm"
              onClick={() =>
                onChange({
                  hours: [
                    ...value.hours,
                    { id: makeId("hrs"), taskType: "Development", hours: 0 },
                  ],
                })
              }
            >
              <PlusIcon className="h-4 w-4" />
              Add hours
            </Button>
          </div>
        </Panel>

        <div className="space-y-5">
          <Panel className="p-5">
            <Field
              label="Tasks planned for next week"
              htmlFor="next-week"
              required
              error={errors.next}
            >
              <TextArea
                id="next-week"
                rows={4}
                value={value.tasksPlannedNextWeek}
                onChange={(e) =>
                  onChange({ tasksPlannedNextWeek: e.target.value })
                }
                placeholder="What you intend to pick up next week"
              />
            </Field>
          </Panel>
          <Panel className="space-y-4 p-5">
            <Field
              label="Notes"
              htmlFor="notes"
              hint="Optional context for your manager."
            >
              <TextArea
                id="notes"
                rows={3}
                value={value.notes}
                onChange={(e) => onChange({ notes: e.target.value })}
                placeholder="Anything else worth knowing"
              />
            </Field>
            <Field label="Links" htmlFor="links" hint="PRs, docs, dashboards.">
              <TextInput
                id="links"
                value={value.links}
                onChange={(e) => onChange({ links: e.target.value })}
                placeholder="https://…"
              />
            </Field>
          </Panel>
        </div>
      </div>
    </div>
  );
}
