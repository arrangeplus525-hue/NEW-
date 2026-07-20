"use client";

import { useState } from "react";
import type { Property, ResaleProject, ResaleProjectKind, ResaleProjectStatus } from "@/domain/types";
import { calcResaleProfit } from "@/lib/calculations/resale-calculations";
import { createResaleProjectAction, updateResaleProjectAction } from "./actions";

type Draft = Pick<
  ResaleProject,
  "kind" | "propertyId" | "acquisitionCost" | "workBudget" | "workActualCost" | "targetSellPrice" | "actualSellPrice" | "status"
>;

const kindLabel: Record<ResaleProjectKind, string> = {
  purchase_resale: "買取再販",
  land_development: "土地仕入・建築",
};

const statusLabel: Record<ResaleProjectStatus, string> = {
  acquired: "仕入済み",
  in_progress: "工事中",
  for_sale: "販売中",
  sold: "成約済み",
};

function yen(n: number): string {
  return `¥${Math.round(n).toLocaleString("ja-JP")}`;
}

function percent(n: number): string {
  return `${(n * 100).toFixed(1)}%`;
}

function emptyDraft(properties: Property[]): Draft {
  return {
    kind: "purchase_resale",
    propertyId: properties[0]?.id ?? "",
    acquisitionCost: 0,
    workBudget: 0,
    workActualCost: 0,
    targetSellPrice: 0,
    actualSellPrice: null,
    status: "acquired",
  };
}

export function ResaleTable({
  initialProjects,
  properties,
}: {
  initialProjects: ResaleProject[];
  properties: Property[];
}) {
  const [projects, setProjects] = useState<ResaleProject[]>(initialProjects);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [newProject, setNewProject] = useState<Draft>(emptyDraft(properties));
  const [error, setError] = useState<string | null>(null);

  const propertyNameById = new Map(properties.map((p) => [p.id, p.name]));

  function getDraft(project: ResaleProject): Draft {
    return drafts[project.id] ?? project;
  }

  function updateDraft(id: string, patch: Partial<Draft>) {
    setDrafts((prev) => {
      const base = prev[id] ?? projects.find((p) => p.id === id)!;
      return { ...prev, [id]: { ...base, ...patch } };
    });
  }

  async function handleSave(project: ResaleProject) {
    setError(null);
    try {
      const draft = getDraft(project);
      const updated = await updateResaleProjectAction({ id: project.id, ...draft });
      setProjects((prev) => prev.map((p) => (p.id === project.id ? updated : p)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "保存に失敗しました");
    }
  }

  async function handleAdd() {
    setError(null);
    try {
      const created = await createResaleProjectAction(newProject);
      setProjects((prev) => [...prev, created]);
      setNewProject(emptyDraft(properties));
    } catch (e) {
      setError(e instanceof Error ? e.message : "登録に失敗しました");
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-4 pb-24 sm:p-8">
      <header>
        <h1 className="text-xl font-bold text-neutral-900">買取再販・土地仕入建築</h1>
        <p className="mt-1 text-sm text-neutral-500">
          仕入 → 工事 → 販売の流れと、利益・ROIを管理します。
        </p>
      </header>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <section className="rounded-xl border border-neutral-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-left text-neutral-500">
                <th className="px-3 py-3 font-medium">種別</th>
                <th className="px-3 py-3 font-medium">物件</th>
                <th className="px-3 py-3 font-medium">仕入価格</th>
                <th className="px-3 py-3 font-medium">工事予算</th>
                <th className="px-3 py-3 font-medium">工事実費</th>
                <th className="px-3 py-3 font-medium">販売価格</th>
                <th className="px-3 py-3 font-medium">実売価格</th>
                <th className="px-3 py-3 font-medium">利益</th>
                <th className="px-3 py-3 font-medium">ROI</th>
                <th className="px-3 py-3 font-medium">状態</th>
                <th className="px-3 py-3" />
              </tr>
            </thead>
            <tbody>
              {projects.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-neutral-400">
                    まだ買取再販・建売案件がありません
                  </td>
                </tr>
              )}
              {projects.map((project) => {
                const draft = getDraft(project);
                const { profit, roi } = calcResaleProfit(draft);
                return (
                  <tr key={project.id} className="border-b border-neutral-100 last:border-0">
                    <td className="px-3 py-2 text-neutral-700">{kindLabel[project.kind]}</td>
                    <td className="px-3 py-2 text-neutral-700">{propertyNameById.get(project.propertyId) ?? "-"}</td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min={0}
                        className="w-28 rounded border border-neutral-300 px-2 py-1"
                        value={draft.acquisitionCost}
                        onChange={(e) => updateDraft(project.id, { acquisitionCost: Number(e.target.value) })}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min={0}
                        className="w-28 rounded border border-neutral-300 px-2 py-1"
                        value={draft.workBudget}
                        onChange={(e) => updateDraft(project.id, { workBudget: Number(e.target.value) })}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min={0}
                        className="w-28 rounded border border-neutral-300 px-2 py-1"
                        value={draft.workActualCost}
                        onChange={(e) => updateDraft(project.id, { workActualCost: Number(e.target.value) })}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min={0}
                        className="w-28 rounded border border-neutral-300 px-2 py-1"
                        value={draft.targetSellPrice}
                        onChange={(e) => updateDraft(project.id, { targetSellPrice: Number(e.target.value) })}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min={0}
                        className="w-28 rounded border border-neutral-300 px-2 py-1"
                        value={draft.actualSellPrice ?? ""}
                        placeholder="未成約"
                        onChange={(e) =>
                          updateDraft(project.id, {
                            actualSellPrice: e.target.value === "" ? null : Number(e.target.value),
                          })
                        }
                      />
                    </td>
                    <td className={`px-3 py-2 font-medium ${profit < 0 ? "text-red-600" : ""}`}>{yen(profit)}</td>
                    <td className="px-3 py-2">{percent(roi)}</td>
                    <td className="px-3 py-2">
                      <select
                        className="rounded border border-neutral-300 px-2 py-1"
                        value={draft.status}
                        onChange={(e) => updateDraft(project.id, { status: e.target.value as ResaleProjectStatus })}
                      >
                        {Object.entries(statusLabel).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-right">
                      <button type="button" onClick={() => handleSave(project)} className="text-blue-600 hover:underline">
                        保存
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-4 rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-neutral-700">新しい案件を登録</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <select
            className="rounded border border-neutral-300 px-3 py-2"
            value={newProject.kind}
            onChange={(e) => setNewProject((prev) => ({ ...prev, kind: e.target.value as ResaleProjectKind }))}
          >
            {Object.entries(kindLabel).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <select
            className="rounded border border-neutral-300 px-3 py-2"
            value={newProject.propertyId}
            onChange={(e) => setNewProject((prev) => ({ ...prev, propertyId: e.target.value }))}
          >
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <input
            type="number"
            min={0}
            className="rounded border border-neutral-300 px-3 py-2"
            placeholder="仕入価格"
            value={newProject.acquisitionCost}
            onChange={(e) => setNewProject((prev) => ({ ...prev, acquisitionCost: Number(e.target.value) }))}
          />
          <input
            type="number"
            min={0}
            className="rounded border border-neutral-300 px-3 py-2"
            placeholder="工事予算"
            value={newProject.workBudget}
            onChange={(e) => setNewProject((prev) => ({ ...prev, workBudget: Number(e.target.value) }))}
          />
          <input
            type="number"
            min={0}
            className="rounded border border-neutral-300 px-3 py-2"
            placeholder="販売想定価格"
            value={newProject.targetSellPrice}
            onChange={(e) => setNewProject((prev) => ({ ...prev, targetSellPrice: Number(e.target.value) }))}
          />
        </div>
        <button
          type="button"
          onClick={handleAdd}
          className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
        >
          登録
        </button>
      </section>
    </div>
  );
}
