import React from "react";
import { PlusIcon, Trash2Icon } from "lucide-react";
import { makeId } from "../../utils/id";
import { priorityLabels, taskStatusLabels } from "../../utils/labels";
import { Button } from "../ui/Button";
import { Select, TextInput } from "../ui/Field";
export function emptyTask() {
  return {
    id: makeId("task"),
    taskName: "",
    priority: "medium",
    plannedPercent: 0,
    actualPercent: 0,
    status: "in_progress",
    timePlannedHours: 0,
    timeSpentHours: 0,
    outputDeliverable: "",
  };
}
export function TaskTableEditor({ tasks, onChange, error }) {
  const update = (id, patch) =>
    onChange(tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  const num = (raw) => {
    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
  };
  return (
    <div>
      {tasks.length === 0 ? (
        <p className="rounded-lg border border-dashed border-line-strong bg-subtle px-4 py-6 text-center text-[13px] text-ink-muted">
          No tasks yet. Add the work you completed this week.
        </p>
      ) : (
        <div className="overflow-x-auto scroll-thin">
          <table className="w-full min-w-[900px] border-collapse text-left">
            <thead>
              <tr className="text-2xs uppercase tracking-wide text-ink-faint">
                <th scope="col" className="pb-2 pr-3 font-medium">
                  Task name
                </th>
                <th scope="col" className="px-2 pb-2 font-medium">
                  Priority
                </th>
                <th scope="col" className="px-2 pb-2 font-medium">
                  Planned %
                </th>
                <th scope="col" className="px-2 pb-2 font-medium">
                  Actual %
                </th>
                <th scope="col" className="px-2 pb-2 font-medium">
                  Status
                </th>
                <th scope="col" className="px-2 pb-2 font-medium">
                  Time plan / spent
                </th>
                <th scope="col" className="px-2 pb-2 font-medium">
                  Output
                </th>
                <th scope="col" className="pb-2 pl-2">
                  <span className="sr-only">Remove</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task, index) => (
                <tr key={task.id} className="align-top">
                  <td className="py-1.5 pr-3">
                    <TextInput
                      aria-label={`Task ${index + 1} name`}
                      value={task.taskName}
                      onChange={(e) =>
                        update(task.id, { taskName: e.target.value })
                      }
                      placeholder="e.g. Invoice table virtualization"
                      className="min-w-[180px]"
                    />
                  </td>
                  <td className="px-2 py-1.5">
                    <Select
                      aria-label={`Task ${index + 1} priority`}
                      value={task.priority}
                      onChange={(e) =>
                        update(task.id, { priority: e.target.value })
                      }
                      className="w-[110px]"
                    >
                      {Object.keys(priorityLabels).map((p) => (
                        <option key={p} value={p}>
                          {priorityLabels[p]}
                        </option>
                      ))}
                    </Select>
                  </td>
                  <td className="px-2 py-1.5">
                    <TextInput
                      aria-label={`Task ${index + 1} planned percent`}
                      type="number"
                      min={0}
                      max={100}
                      value={task.plannedPercent}
                      onChange={(e) =>
                        update(task.id, { plannedPercent: num(e.target.value) })
                      }
                      className="w-[86px] tnum"
                    />
                  </td>
                  <td className="px-2 py-1.5">
                    <TextInput
                      aria-label={`Task ${index + 1} actual percent`}
                      type="number"
                      min={0}
                      max={100}
                      value={task.actualPercent}
                      onChange={(e) =>
                        update(task.id, { actualPercent: num(e.target.value) })
                      }
                      className="w-[86px] tnum"
                    />
                  </td>
                  <td className="px-2 py-1.5">
                    <Select
                      aria-label={`Task ${index + 1} status`}
                      value={task.status}
                      onChange={(e) =>
                        update(task.id, { status: e.target.value })
                      }
                      className="w-[130px]"
                    >
                      {Object.keys(taskStatusLabels).map((s) => (
                        <option key={s} value={s}>
                          {taskStatusLabels[s]}
                        </option>
                      ))}
                    </Select>
                  </td>
                  <td className="px-2 py-1.5">
                    <div className="flex items-center gap-1.5">
                      <TextInput
                        aria-label={`Task ${index + 1} planned hours`}
                        type="number"
                        min={0}
                        value={task.timePlannedHours}
                        onChange={(e) =>
                          update(task.id, {
                            timePlannedHours: num(e.target.value),
                          })
                        }
                        className="w-[70px] tnum"
                      />

                      <span className="text-ink-faint">/</span>
                      <TextInput
                        aria-label={`Task ${index + 1} hours spent`}
                        type="number"
                        min={0}
                        value={task.timeSpentHours}
                        onChange={(e) =>
                          update(task.id, {
                            timeSpentHours: num(e.target.value),
                          })
                        }
                        className="w-[70px] tnum"
                      />
                    </div>
                  </td>
                  <td className="px-2 py-1.5">
                    <TextInput
                      aria-label={`Task ${index + 1} output`}
                      value={task.outputDeliverable}
                      onChange={(e) =>
                        update(task.id, { outputDeliverable: e.target.value })
                      }
                      placeholder="PR, doc, deploy…"
                      className="min-w-[150px]"
                    />
                  </td>
                  <td className="py-1.5 pl-2">
                    <button
                      type="button"
                      aria-label={`Remove task ${index + 1}`}
                      onClick={() =>
                        onChange(tasks.filter((t) => t.id !== task.id))
                      }
                      className="mt-2 rounded-md p-1.5 text-ink-faint transition-colors duration-150 ease-out hover:bg-rose-50 hover:text-rose-600"
                    >
                      <Trash2Icon className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {error ? <p className="mt-2 text-xs text-rose-600">{error}</p> : null}

      <Button
        size="sm"
        className="mt-3"
        onClick={() => onChange([...tasks, emptyTask()])}
      >
        <PlusIcon className="h-4 w-4" />
        Add task
      </Button>
    </div>
  );
}
