"use client";

import { useState } from "react";
import type { Property, PropertyStatus, PropertyType } from "@/domain/types";
import { createPropertyAction, updatePropertyAction } from "./actions";

type Draft = Pick<Property, "name" | "type" | "address" | "price" | "status" | "note">;

const typeLabel: Record<PropertyType, string> = {
  land: "土地",
  house: "戸建",
  apartment: "マンション",
};

const statusLabel: Record<PropertyStatus, string> = {
  available: "公開中",
  under_negotiation: "商談中",
  contracted: "契約済み",
  sold: "成約済み",
};

const emptyDraft: Draft = { name: "", type: "house", address: "", price: 0, status: "available", note: "" };

export function PropertiesTable({ initialProperties }: { initialProperties: Property[] }) {
  const [items, setItems] = useState<Property[]>(initialProperties);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [newItem, setNewItem] = useState<Draft>(emptyDraft);
  const [error, setError] = useState<string | null>(null);

  function getDraft(item: Property): Draft {
    return drafts[item.id] ?? item;
  }

  function updateDraft(id: string, patch: Partial<Draft>) {
    setDrafts((prev) => {
      const base = prev[id] ?? items.find((i) => i.id === id)!;
      return { ...prev, [id]: { ...base, ...patch } };
    });
  }

  async function handleSave(item: Property) {
    setError(null);
    try {
      const draft = getDraft(item);
      const updated = await updatePropertyAction({ id: item.id, ...draft });
      setItems((prev) => prev.map((i) => (i.id === item.id ? updated : i)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "保存に失敗しました");
    }
  }

  async function handleAdd() {
    setError(null);
    try {
      const created = await createPropertyAction(newItem);
      setItems((prev) => [...prev, created]);
      setNewItem(emptyDraft);
    } catch (e) {
      setError(e instanceof Error ? e.message : "登録に失敗しました");
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-4 pb-24 sm:p-8">
      <header>
        <h1 className="text-xl font-bold text-neutral-900">物件管理</h1>
        <p className="mt-1 text-sm text-neutral-500">
          売買仲介・買取再販・土地仕入のいずれからも参照される物件マスタです。
        </p>
      </header>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <section className="rounded-xl border border-neutral-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-left text-neutral-500">
                <th className="px-3 py-3 font-medium">物件名</th>
                <th className="px-3 py-3 font-medium">種別</th>
                <th className="px-3 py-3 font-medium">住所</th>
                <th className="px-3 py-3 font-medium">価格</th>
                <th className="px-3 py-3 font-medium">状態</th>
                <th className="px-3 py-3" />
              </tr>
            </thead>
            <tbody>
              {items.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-neutral-400">
                    まだ物件が登録されていません
                  </td>
                </tr>
              )}
              {items.map((item) => {
                const draft = getDraft(item);
                return (
                  <tr key={item.id} className="border-b border-neutral-100 last:border-0">
                    <td className="px-3 py-2">
                      <input
                        className="w-full min-w-[160px] rounded border border-neutral-300 px-2 py-1"
                        value={draft.name}
                        onChange={(e) => updateDraft(item.id, { name: e.target.value })}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <select
                        className="rounded border border-neutral-300 px-2 py-1"
                        value={draft.type}
                        onChange={(e) => updateDraft(item.id, { type: e.target.value as PropertyType })}
                      >
                        {Object.entries(typeLabel).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <input
                        className="w-full min-w-[180px] rounded border border-neutral-300 px-2 py-1"
                        value={draft.address}
                        onChange={(e) => updateDraft(item.id, { address: e.target.value })}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min={0}
                        className="w-32 rounded border border-neutral-300 px-2 py-1"
                        value={draft.price}
                        onChange={(e) => updateDraft(item.id, { price: Number(e.target.value) })}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <select
                        className="rounded border border-neutral-300 px-2 py-1"
                        value={draft.status}
                        onChange={(e) => updateDraft(item.id, { status: e.target.value as PropertyStatus })}
                      >
                        {Object.entries(statusLabel).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-right">
                      <button
                        type="button"
                        onClick={() => handleSave(item)}
                        className="text-blue-600 hover:underline"
                      >
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
        <h2 className="text-sm font-semibold text-neutral-700">新しい物件を登録</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <input
            className="rounded border border-neutral-300 px-3 py-2"
            placeholder="物件名（必須）"
            value={newItem.name}
            onChange={(e) => setNewItem((prev) => ({ ...prev, name: e.target.value }))}
          />
          <select
            className="rounded border border-neutral-300 px-3 py-2"
            value={newItem.type}
            onChange={(e) => setNewItem((prev) => ({ ...prev, type: e.target.value as PropertyType }))}
          >
            {Object.entries(typeLabel).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <input
            className="rounded border border-neutral-300 px-3 py-2 sm:col-span-2"
            placeholder="住所"
            value={newItem.address}
            onChange={(e) => setNewItem((prev) => ({ ...prev, address: e.target.value }))}
          />
          <input
            type="number"
            min={0}
            className="rounded border border-neutral-300 px-3 py-2"
            placeholder="価格"
            value={newItem.price}
            onChange={(e) => setNewItem((prev) => ({ ...prev, price: Number(e.target.value) }))}
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
