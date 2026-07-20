"use client";

import { useState } from "react";
import type { PriceItemType, PriceMasterItem } from "@/domain/types";
import { calcSellPriceFromMargin } from "@/lib/calculations/estimate-calculations";
import { createPriceItemAction, deletePriceItemAction, updatePriceItemAction } from "./actions";

function yen(n: number): string {
  return `¥${Math.round(n).toLocaleString("ja-JP")}`;
}

type DraftItem = Pick<PriceMasterItem, "category" | "type" | "name" | "unit" | "costPrice" | "marginRate">;

const emptyDraft: DraftItem = {
  category: "",
  type: "material",
  name: "",
  unit: "",
  costPrice: 0,
  marginRate: 0.3,
};

export function PriceMasterTable({ initialItems }: { initialItems: PriceMasterItem[] }) {
  const [items, setItems] = useState<PriceMasterItem[]>(
    [...initialItems].sort((a, b) => a.category.localeCompare(b.category, "ja"))
  );
  const [drafts, setDrafts] = useState<Record<string, DraftItem>>({});
  const [newItem, setNewItem] = useState<DraftItem>(emptyDraft);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function getDraft(item: PriceMasterItem): DraftItem {
    return drafts[item.id] ?? item;
  }

  function updateDraft(id: string, patch: Partial<DraftItem>) {
    setDrafts((prev) => {
      const base = prev[id] ?? items.find((i) => i.id === id)!;
      return { ...prev, [id]: { ...base, ...patch } };
    });
  }

  async function handleSave(item: PriceMasterItem) {
    setError(null);
    setSavingId(item.id);
    try {
      const draft = getDraft(item);
      const updated = await updatePriceItemAction({ id: item.id, ...draft });
      setItems((prev) => prev.map((i) => (i.id === item.id ? updated : i)));
      setDrafts((prev) => {
        const next = { ...prev };
        delete next[item.id];
        return next;
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "保存に失敗しました");
    } finally {
      setSavingId(null);
    }
  }

  async function handleDelete(id: string) {
    setError(null);
    try {
      await deletePriceItemAction(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "削除に失敗しました");
    }
  }

  async function handleAdd() {
    setError(null);
    try {
      const created = await createPriceItemAction(newItem);
      setItems((prev) => [...prev, created].sort((a, b) => a.category.localeCompare(b.category, "ja")));
      setNewItem(emptyDraft);
    } catch (e) {
      setError(e instanceof Error ? e.message : "追加に失敗しました");
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-4 pb-24 sm:p-8">
      <header>
        <h1 className="text-xl font-bold text-neutral-900">単価マスタ</h1>
        <p className="mt-1 text-sm text-neutral-500">
          原価と利益率から標準販売単価を自動計算します。ここで編集した内容は見積作成画面にすぐ反映されます。
        </p>
      </header>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <section className="rounded-xl border border-neutral-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-left text-neutral-500">
                <th className="px-3 py-3 font-medium">カテゴリ</th>
                <th className="px-3 py-3 font-medium">種別</th>
                <th className="px-3 py-3 font-medium">項目名</th>
                <th className="px-3 py-3 font-medium">単位</th>
                <th className="px-3 py-3 font-medium">原価</th>
                <th className="px-3 py-3 font-medium">利益率</th>
                <th className="px-3 py-3 font-medium">販売単価</th>
                <th className="px-3 py-3" />
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const draft = getDraft(item);
                const previewSellPrice =
                  draft.marginRate < 1 ? calcSellPriceFromMargin(draft.costPrice, draft.marginRate) : item.sellPrice;
                return (
                  <tr key={item.id} className="border-b border-neutral-100 last:border-0">
                    <td className="px-3 py-2">
                      <input
                        className="w-24 rounded border border-neutral-300 px-2 py-1"
                        value={draft.category}
                        onChange={(e) => updateDraft(item.id, { category: e.target.value })}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <select
                        className="rounded border border-neutral-300 px-2 py-1"
                        value={draft.type}
                        onChange={(e) => updateDraft(item.id, { type: e.target.value as PriceItemType })}
                      >
                        <option value="material">材料</option>
                        <option value="labor">工賃</option>
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <input
                        className="w-full min-w-[160px] rounded border border-neutral-300 px-2 py-1"
                        value={draft.name}
                        onChange={(e) => updateDraft(item.id, { name: e.target.value })}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        className="w-16 rounded border border-neutral-300 px-2 py-1"
                        value={draft.unit}
                        onChange={(e) => updateDraft(item.id, { unit: e.target.value })}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min={0}
                        className="w-24 rounded border border-neutral-300 px-2 py-1"
                        value={draft.costPrice}
                        onChange={(e) => updateDraft(item.id, { costPrice: Number(e.target.value) })}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min={0}
                        max={99}
                        step={1}
                        className="w-16 rounded border border-neutral-300 px-2 py-1"
                        value={Math.round(draft.marginRate * 100)}
                        onChange={(e) => updateDraft(item.id, { marginRate: Number(e.target.value) / 100 })}
                      />
                      <span className="ml-1 text-neutral-400">%</span>
                    </td>
                    <td className="px-3 py-2 font-medium">{yen(previewSellPrice)}</td>
                    <td className="whitespace-nowrap px-3 py-2 text-right">
                      <button
                        type="button"
                        disabled={savingId === item.id}
                        onClick={() => handleSave(item)}
                        className="mr-3 text-blue-600 hover:underline disabled:opacity-50"
                      >
                        保存
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(item.id)}
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
      </section>

      <section className="space-y-4 rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-neutral-700">新しい項目を追加</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <input
            className="rounded border border-neutral-300 px-2 py-2"
            placeholder="カテゴリ"
            value={newItem.category}
            onChange={(e) => setNewItem((prev) => ({ ...prev, category: e.target.value }))}
          />
          <select
            className="rounded border border-neutral-300 px-2 py-2"
            value={newItem.type}
            onChange={(e) => setNewItem((prev) => ({ ...prev, type: e.target.value as PriceItemType }))}
          >
            <option value="material">材料</option>
            <option value="labor">工賃</option>
          </select>
          <input
            className="rounded border border-neutral-300 px-2 py-2 sm:col-span-2"
            placeholder="項目名"
            value={newItem.name}
            onChange={(e) => setNewItem((prev) => ({ ...prev, name: e.target.value }))}
          />
          <input
            className="rounded border border-neutral-300 px-2 py-2"
            placeholder="単位（㎡等）"
            value={newItem.unit}
            onChange={(e) => setNewItem((prev) => ({ ...prev, unit: e.target.value }))}
          />
          <input
            type="number"
            min={0}
            className="rounded border border-neutral-300 px-2 py-2"
            placeholder="原価"
            value={newItem.costPrice}
            onChange={(e) => setNewItem((prev) => ({ ...prev, costPrice: Number(e.target.value) }))}
          />
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm text-neutral-600">
            利益率
            <input
              type="number"
              min={0}
              max={99}
              className="ml-2 w-20 rounded border border-neutral-300 px-2 py-1"
              value={Math.round(newItem.marginRate * 100)}
              onChange={(e) => setNewItem((prev) => ({ ...prev, marginRate: Number(e.target.value) / 100 }))}
            />
            %
          </label>
          <span className="text-sm text-neutral-500">
            → 販売単価目安:{" "}
            {yen(newItem.marginRate < 1 ? calcSellPriceFromMargin(newItem.costPrice, newItem.marginRate) : 0)}
          </span>
          <button
            type="button"
            onClick={handleAdd}
            className="ml-auto rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
          >
            追加
          </button>
        </div>
      </section>
    </div>
  );
}
