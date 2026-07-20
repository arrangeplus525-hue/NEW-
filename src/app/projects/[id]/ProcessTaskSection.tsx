"use client";

import { useState } from "react";
import type { Craftsman, ProcessTask, ProcessTaskStatus } from "@/domain/types";
import {
  createProcessTaskAction,
  deleteProcessTaskAction,
  generateProcessTasksFromEstimatesAction,
  updateProcessTaskAction,
} from "../actions";

type Draft = Pick<ProcessTask, "title" | "craftsmanId" | "startDate" | "endDate" | "status" | "note">;

const statusOptions: { value: ProcessTaskStatus; label: string }[] = [
  { value: "not_started", label: "未着手" },
  { value: "in_progress", label: "進行中" },
  { value: "done", label: "完了" },
];

function emptyDraft(): Draft {
  const today = new Date().toISOString().slice(0, 10);
  return { title: "", craftsmanId: "", startDate: today, endDate: today, status: "not_started", note: "" };
}

export function ProcessTaskSection({
  projectId,
  initialTasks,
  craftsmen,
}: {
  projectId: string;
  initialTasks: ProcessTask[];
  craftsmen: Craftsman[];
}) {
  const [tasks, setTasks] = useState<ProcessTask[]>(initialTasks);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [newTask, setNewTask] = useState<Draft>(emptyDraft());
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  function getDraft(task: ProcessTask): Draft {
    return drafts[task.id] ?? task;
  }

  function updateDraft(id: string, patch: Partial<Draft>) {
    setDrafts((prev) => {
      const base = prev[id] ?? tasks.find((t) => t.id === id)!;
      return { ...prev, [id]: { ...base, ...patch } };
    });
  }

  async function handleSave(task: ProcessTask) {
    setError(null);
    try {
      const draft = getDraft(task);
      const updated = await updateProcessTaskAction({ ...task, ...draft });
      setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "保存に失敗しました");
    }
  }

  async function handleDelete(id: string) {
    setError(null);
    try {
      await deleteProcessTaskAction(id);
      setTasks((prev) => prev.filter((t) => t.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "削除に失敗しました");
    }
  }

  async function handleAdd() {
    setError(null);
    try {
      const created = await createProcessTaskAction({
        ...newTask,
        projectId,
        craftsmanId: newTask.craftsmanId || null,
      });
      setTasks((prev) => [...prev, created]);
      setNewTask(emptyDraft());
    } catch (e) {
      setError(e instanceof Error ? e.message : "追加に失敗しました");
    }
  }

  async function handleGenerate() {
    setError(null);
    setGenerating(true);
    try {
      const created = await generateProcessTasksFromEstimatesAction(projectId);
      setTasks((prev) => [...prev, ...created]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "工程の自動生成に失敗しました");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <section className="rounded-xl border border-neutral-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-3">
        <h2 className="text-sm font-semibold text-neutral-700">工程管理</h2>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={generating}
          className="text-sm text-blue-600 hover:underline disabled:opacity-50"
          title="見積項目のカテゴリから工程と担当職人をルールベースで自動生成します（簡易版）"
        >
          {generating ? "生成中..." : "見積から工程を自動生成（簡易AI）"}
        </button>
      </div>
      {error && <p className="px-5 pt-3 text-sm text-red-600">{error}</p>}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-left text-neutral-500">
              <th className="px-4 py-3 font-medium">工程名</th>
              <th className="px-4 py-3 font-medium">担当職人</th>
              <th className="px-4 py-3 font-medium">開始日</th>
              <th className="px-4 py-3 font-medium">終了日</th>
              <th className="px-4 py-3 font-medium">状態</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {tasks.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-neutral-400">
                  まだ工程がありません
                </td>
              </tr>
            )}
            {tasks.map((task) => {
              const draft = getDraft(task);
              return (
                <tr key={task.id} className="border-b border-neutral-100 last:border-0">
                  <td className="px-4 py-2">
                    <input
                      className="w-full min-w-[140px] rounded border border-neutral-300 px-2 py-1"
                      value={draft.title}
                      onChange={(e) => updateDraft(task.id, { title: e.target.value })}
                    />
                  </td>
                  <td className="px-4 py-2">
                    <select
                      className="rounded border border-neutral-300 px-2 py-1"
                      value={draft.craftsmanId ?? ""}
                      onChange={(e) => updateDraft(task.id, { craftsmanId: e.target.value || null })}
                    >
                      <option value="">未割当</option>
                      {craftsmen.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="date"
                      className="rounded border border-neutral-300 px-2 py-1"
                      value={draft.startDate}
                      onChange={(e) => updateDraft(task.id, { startDate: e.target.value })}
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="date"
                      className="rounded border border-neutral-300 px-2 py-1"
                      value={draft.endDate}
                      onChange={(e) => updateDraft(task.id, { endDate: e.target.value })}
                    />
                  </td>
                  <td className="px-4 py-2">
                    <select
                      className="rounded border border-neutral-300 px-2 py-1"
                      value={draft.status}
                      onChange={(e) => updateDraft(task.id, { status: e.target.value as ProcessTaskStatus })}
                    >
                      {statusOptions.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="whitespace-nowrap px-4 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => handleSave(task)}
                      className="mr-3 text-blue-600 hover:underline"
                    >
                      保存
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(task.id)}
                      className="text-neutral-400 hover:text-red-600"
                    >
                      削除
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-end gap-3 border-t border-neutral-200 p-5">
        <label className="block">
          <span className="mb-1 block text-xs text-neutral-500">工程名</span>
          <input
            className="w-40 rounded border border-neutral-300 px-2 py-1.5"
            placeholder="例：解体工事"
            value={newTask.title}
            onChange={(e) => setNewTask((prev) => ({ ...prev, title: e.target.value }))}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs text-neutral-500">担当職人</span>
          <select
            className="rounded border border-neutral-300 px-2 py-1.5"
            value={newTask.craftsmanId ?? ""}
            onChange={(e) => setNewTask((prev) => ({ ...prev, craftsmanId: e.target.value }))}
          >
            <option value="">未割当</option>
            {craftsmen.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs text-neutral-500">開始日</span>
          <input
            type="date"
            className="rounded border border-neutral-300 px-2 py-1.5"
            value={newTask.startDate}
            onChange={(e) => setNewTask((prev) => ({ ...prev, startDate: e.target.value }))}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs text-neutral-500">終了日</span>
          <input
            type="date"
            className="rounded border border-neutral-300 px-2 py-1.5"
            value={newTask.endDate}
            onChange={(e) => setNewTask((prev) => ({ ...prev, endDate: e.target.value }))}
          />
        </label>
        <button
          type="button"
          onClick={handleAdd}
          className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
        >
          追加
        </button>
      </div>
    </section>
  );
}
