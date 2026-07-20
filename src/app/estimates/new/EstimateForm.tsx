"use client";

import { useMemo, useState } from "react";
import type { Customer, EstimateLine, PriceMasterItem, Project } from "@/domain/types";
import { calcEstimateSummary, calcLineTotals } from "@/lib/calculations/estimate-calculations";
import { detectEstimateGaps } from "@/lib/ai/estimate-gap-detection";
import { saveEstimateAction } from "./actions";

function yen(n: number): string {
  return `¥${Math.round(n).toLocaleString("ja-JP")}`;
}

function percent(n: number): string {
  return `${(n * 100).toFixed(1)}%`;
}

export function EstimateForm({
  customers,
  priceItems,
  projects,
}: {
  customers: Customer[];
  priceItems: PriceMasterItem[];
  projects: Project[];
}) {
  const [customerId, setCustomerId] = useState(customers[0]?.id ?? "");
  const [selectedProjectId, setSelectedProjectId] = useState(""); // ""は「新しい案件を作成」
  const [title, setTitle] = useState("");
  const [lines, setLines] = useState<EstimateLine[]>([]);
  const [pickedItemId, setPickedItemId] = useState(priceItems[0]?.id ?? "");
  const [pickedQuantity, setPickedQuantity] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedEstimateId, setSavedEstimateId] = useState<string | null>(null);

  const categorizedItems = useMemo(() => {
    const groups = new Map<string, PriceMasterItem[]>();
    for (const item of priceItems) {
      const list = groups.get(item.category) ?? [];
      list.push(item);
      groups.set(item.category, list);
    }
    return Array.from(groups.entries());
  }, [priceItems]);

  const summary = useMemo(() => calcEstimateSummary(lines, 0.1), [lines]);
  const gapWarnings = useMemo(() => detectEstimateGaps(lines, priceItems), [lines, priceItems]);

  const customerProjects = useMemo(
    () => projects.filter((p) => p.customerId === customerId),
    [projects, customerId]
  );

  function handleCustomerChange(nextCustomerId: string) {
    setCustomerId(nextCustomerId);
    setSelectedProjectId("");
  }

  function addLine() {
    const item = priceItems.find((p) => p.id === pickedItemId);
    if (!item || pickedQuantity <= 0) return;
    const newLine: EstimateLine = {
      id: crypto.randomUUID(),
      priceItemId: item.id,
      category: item.category,
      name: item.name,
      unit: item.unit,
      quantity: pickedQuantity,
      costPrice: item.costPrice,
      sellPrice: item.sellPrice,
    };
    setLines((prev) => [...prev, newLine]);
    setPickedQuantity(1);
  }

  function updateLine(id: string, patch: Partial<Pick<EstimateLine, "quantity" | "sellPrice">>) {
    setLines((prev) => prev.map((line) => (line.id === id ? { ...line, ...patch } : line)));
  }

  function removeLine(id: string) {
    setLines((prev) => prev.filter((line) => line.id !== id));
  }

  async function handleSaveAndCreatePdf() {
    setError(null);
    if (!customerId) {
      setError("顧客を選択してください");
      return;
    }
    if (!title.trim()) {
      setError("件名を入力してください");
      return;
    }
    if (lines.length === 0) {
      setError("見積項目を1件以上追加してください");
      return;
    }

    setSaving(true);
    try {
      const { estimateId } = await saveEstimateAction({
        customerId,
        title,
        lines,
        projectId: selectedProjectId || undefined,
      });
      setSavedEstimateId(estimateId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "保存に失敗しました");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-4 pb-24 sm:p-8">
      <header>
        <h1 className="text-xl font-bold text-neutral-900">見積作成</h1>
        <p className="mt-1 text-sm text-neutral-500">
          顧客と件名を選び、工事項目を追加すると自動で利益率を計算します。
        </p>
      </header>

      <section className="space-y-4 rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-neutral-700">顧客</span>
            <select
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-base"
              value={customerId}
              onChange={(e) => handleCustomerChange(e.target.value)}
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          {customerProjects.length > 0 && (
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-neutral-700">案件</span>
              <select
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-base"
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
              >
                <option value="">+ 新しい案件を作成</option>
                {customerProjects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-neutral-700">
              {selectedProjectId ? "この見積の件名" : "件名（案件名にもなります）"}
            </span>
            <input
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-base"
              placeholder="例：浴室リフォーム工事"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>
        </div>
      </section>

      <section className="space-y-4 rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-neutral-700">工事項目を追加</h2>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="block flex-1">
            <span className="mb-1 block text-sm font-medium text-neutral-700">項目</span>
            <select
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-base"
              value={pickedItemId}
              onChange={(e) => setPickedItemId(e.target.value)}
            >
              {categorizedItems.map(([category, items]) => (
                <optgroup key={category} label={category}>
                  {items.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}（{yen(item.sellPrice)} / {item.unit}）
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </label>
          <label className="block w-full sm:w-28">
            <span className="mb-1 block text-sm font-medium text-neutral-700">数量</span>
            <input
              type="number"
              min={0}
              step="any"
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-base"
              value={pickedQuantity}
              onChange={(e) => setPickedQuantity(Number(e.target.value))}
            />
          </label>
          <button
            type="button"
            onClick={addLine}
            className="rounded-lg bg-neutral-900 px-4 py-2 text-base font-medium text-white hover:bg-neutral-700"
          >
            追加
          </button>
        </div>
      </section>

      <section className="rounded-xl border border-neutral-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-left text-neutral-500">
                <th className="px-4 py-3 font-medium">分類</th>
                <th className="px-4 py-3 font-medium">項目</th>
                <th className="px-4 py-3 font-medium">数量</th>
                <th className="px-4 py-3 font-medium">売価単価</th>
                <th className="px-4 py-3 font-medium">金額</th>
                <th className="px-4 py-3 font-medium">利益率</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {lines.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-neutral-400">
                    まだ項目がありません
                  </td>
                </tr>
              )}
              {lines.map((line) => {
                const totals = calcLineTotals(line);
                return (
                  <tr key={line.id} className="border-b border-neutral-100 last:border-0">
                    <td className="px-4 py-3 text-neutral-500">{line.category}</td>
                    <td className="px-4 py-3">
                      {line.name}
                      <span className="ml-1 text-neutral-400">/{line.unit}</span>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min={0}
                        step="any"
                        className="w-20 rounded border border-neutral-300 px-2 py-1"
                        value={line.quantity}
                        onChange={(e) => updateLine(line.id, { quantity: Number(e.target.value) })}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min={0}
                        className="w-28 rounded border border-neutral-300 px-2 py-1"
                        value={line.sellPrice}
                        onChange={(e) => updateLine(line.id, { sellPrice: Number(e.target.value) })}
                      />
                    </td>
                    <td className="px-4 py-3 font-medium">{yen(totals.sellTotal)}</td>
                    <td className="px-4 py-3 text-neutral-500">{percent(totals.marginRate)}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => removeLine(line.id)}
                        className="text-neutral-400 hover:text-red-600"
                        aria-label="削除"
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
      </section>

      {gapWarnings.length > 0 && (
        <section className="rounded-xl border border-amber-300 bg-amber-50 p-4">
          <h2 className="mb-2 text-sm font-semibold text-amber-800">見積チェック（ルールベース簡易版）</h2>
          <ul className="list-inside list-disc space-y-1 text-sm text-amber-800">
            {gapWarnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </section>
      )}

      <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-neutral-700">社内向けサマリー（PDFには出力されません）</h2>
        <dl className="grid grid-cols-2 gap-y-2 text-sm sm:grid-cols-4">
          <div>
            <dt className="text-neutral-500">原価合計</dt>
            <dd className="font-medium">{yen(summary.subtotalCost)}</dd>
          </div>
          <div>
            <dt className="text-neutral-500">売上合計</dt>
            <dd className="font-medium">{yen(summary.subtotalSell)}</dd>
          </div>
          <div>
            <dt className="text-neutral-500">粗利額</dt>
            <dd className="font-medium">{yen(summary.profitAmount)}</dd>
          </div>
          <div>
            <dt className="text-neutral-500">利益率</dt>
            <dd className="font-medium">{percent(summary.marginRate)}</dd>
          </div>
        </dl>
        <div className="mt-4 flex justify-between border-t border-neutral-200 pt-4 text-base">
          <span>消費税（10%）</span>
          <span>{yen(summary.taxAmount)}</span>
        </div>
        <div className="mt-1 flex justify-between text-lg font-bold">
          <span>お客様向け合計金額</span>
          <span>{yen(summary.totalAmount)}</span>
        </div>
      </section>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {savedEstimateId && !error && (
        <p className="text-sm text-green-700">
          保存しました。{" "}
          <a
            href={`/api/estimates/${savedEstimateId}/pdf`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold underline hover:text-green-800"
          >
            PDFを開く
          </a>
        </p>
      )}

      <div className="sticky bottom-4 flex justify-end">
        <button
          type="button"
          disabled={saving}
          onClick={handleSaveAndCreatePdf}
          className="rounded-lg bg-blue-600 px-6 py-3 text-base font-semibold text-white shadow-lg hover:bg-blue-500 disabled:opacity-50"
        >
          {saving ? "保存中..." : "見積を保存してPDF作成"}
        </button>
      </div>
    </div>
  );
}
