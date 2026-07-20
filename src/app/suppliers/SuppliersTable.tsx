"use client";

import { useState } from "react";
import type { Supplier } from "@/domain/types";
import { createSupplierAction, deleteSupplierAction, updateSupplierAction } from "./actions";

type Draft = Pick<Supplier, "name" | "contactPerson" | "phone" | "note">;

const emptyDraft: Draft = { name: "", contactPerson: "", phone: "", note: "" };

export function SuppliersTable({ initialSuppliers }: { initialSuppliers: Supplier[] }) {
  const [items, setItems] = useState<Supplier[]>(initialSuppliers);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [newItem, setNewItem] = useState<Draft>(emptyDraft);
  const [error, setError] = useState<string | null>(null);

  function getDraft(item: Supplier): Draft {
    return drafts[item.id] ?? item;
  }

  function updateDraft(id: string, patch: Partial<Draft>) {
    setDrafts((prev) => {
      const base = prev[id] ?? items.find((i) => i.id === id)!;
      return { ...prev, [id]: { ...base, ...patch } };
    });
  }

  async function handleSave(item: Supplier) {
    setError(null);
    try {
      const draft = getDraft(item);
      const updated = await updateSupplierAction({ id: item.id, ...draft });
      setItems((prev) => prev.map((i) => (i.id === item.id ? updated : i)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "保存に失敗しました");
    }
  }

  async function handleDelete(id: string) {
    setError(null);
    try {
      await deleteSupplierAction(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "削除に失敗しました");
    }
  }

  async function handleAdd() {
    setError(null);
    try {
      const created = await createSupplierAction(newItem);
      setItems((prev) => [...prev, created]);
      setNewItem(emptyDraft);
    } catch (e) {
      setError(e instanceof Error ? e.message : "追加に失敗しました");
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-4 pb-24 sm:p-8">
      <header>
        <h1 className="text-xl font-bold text-neutral-900">商社管理</h1>
        <p className="mt-1 text-sm text-neutral-500">案件ごとの発注先として選べる商社・仕入先の一覧です。</p>
      </header>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <section className="rounded-xl border border-neutral-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-left text-neutral-500">
                <th className="px-4 py-3 font-medium">商社名</th>
                <th className="px-4 py-3 font-medium">担当者</th>
                <th className="px-4 py-3 font-medium">電話番号</th>
                <th className="px-4 py-3 font-medium">備考</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {items.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-neutral-400">
                    まだ商社が登録されていません
                  </td>
                </tr>
              )}
              {items.map((item) => {
                const draft = getDraft(item);
                return (
                  <tr key={item.id} className="border-b border-neutral-100 last:border-0">
                    <td className="px-4 py-2">
                      <input
                        className="w-full min-w-[140px] rounded border border-neutral-300 px-2 py-1"
                        value={draft.name}
                        onChange={(e) => updateDraft(item.id, { name: e.target.value })}
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        className="w-24 rounded border border-neutral-300 px-2 py-1"
                        value={draft.contactPerson ?? ""}
                        onChange={(e) => updateDraft(item.id, { contactPerson: e.target.value })}
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        className="w-32 rounded border border-neutral-300 px-2 py-1"
                        value={draft.phone ?? ""}
                        onChange={(e) => updateDraft(item.id, { phone: e.target.value })}
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        className="w-full min-w-[120px] rounded border border-neutral-300 px-2 py-1"
                        value={draft.note ?? ""}
                        onChange={(e) => updateDraft(item.id, { note: e.target.value })}
                      />
                    </td>
                    <td className="whitespace-nowrap px-4 py-2 text-right">
                      <button
                        type="button"
                        onClick={() => handleSave(item)}
                        className="mr-3 text-blue-600 hover:underline"
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
        <h2 className="text-sm font-semibold text-neutral-700">新しい商社を登録</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <input
            className="rounded border border-neutral-300 px-3 py-2"
            placeholder="商社名（必須）"
            value={newItem.name}
            onChange={(e) => setNewItem((prev) => ({ ...prev, name: e.target.value }))}
          />
          <input
            className="rounded border border-neutral-300 px-3 py-2"
            placeholder="担当者"
            value={newItem.contactPerson}
            onChange={(e) => setNewItem((prev) => ({ ...prev, contactPerson: e.target.value }))}
          />
          <input
            className="rounded border border-neutral-300 px-3 py-2"
            placeholder="電話番号"
            value={newItem.phone}
            onChange={(e) => setNewItem((prev) => ({ ...prev, phone: e.target.value }))}
          />
          <input
            className="rounded border border-neutral-300 px-3 py-2"
            placeholder="備考"
            value={newItem.note}
            onChange={(e) => setNewItem((prev) => ({ ...prev, note: e.target.value }))}
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
