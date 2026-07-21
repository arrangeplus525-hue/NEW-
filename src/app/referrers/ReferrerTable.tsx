"use client";

import { useState } from "react";
import type { Referrer, ReferrerType } from "@/domain/types";
import { createReferrerAction, deleteReferrerAction, updateReferrerAction } from "./actions";

type DraftItem = Pick<Referrer, "name" | "type" | "phone" | "note">;

const emptyDraft: DraftItem = {
  name: "",
  type: "real_estate_agency",
  phone: "",
  note: "",
};

const TYPE_LABELS: Record<ReferrerType, string> = {
  individual: "個人",
  real_estate_agency: "不動産仲介会社",
  other: "その他",
};

export function ReferrerTable({ initialItems }: { initialItems: Referrer[] }) {
  const [items, setItems] = useState<Referrer[]>(
    [...initialItems].sort((a, b) => a.name.localeCompare(b.name, "ja"))
  );
  const [drafts, setDrafts] = useState<Record<string, DraftItem>>({});
  const [newItem, setNewItem] = useState<DraftItem>(emptyDraft);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function getDraft(item: Referrer): DraftItem {
    return drafts[item.id] ?? item;
  }

  function updateDraft(id: string, patch: Partial<DraftItem>) {
    setDrafts((prev) => {
      const base = prev[id] ?? items.find((i) => i.id === id)!;
      return { ...prev, [id]: { ...base, ...patch } };
    });
  }

  async function handleSave(item: Referrer) {
    setError(null);
    setSavingId(item.id);
    try {
      const draft = getDraft(item);
      const updated = await updateReferrerAction({ id: item.id, ...draft });
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
      await deleteReferrerAction(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "削除に失敗しました");
    }
  }

  async function handleAdd() {
    setError(null);
    try {
      const created = await createReferrerAction(newItem);
      setItems((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name, "ja")));
      setNewItem(emptyDraft);
    } catch (e) {
      setError(e instanceof Error ? e.message : "追加に失敗しました");
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-4 pb-24 sm:p-8">
      <header>
        <h1 className="text-xl font-bold text-neutral-900">紹介元管理</h1>
        <p className="mt-1 text-sm text-neutral-500">
          仲介会社・紹介者の情報を管理します。ここで登録した紹介元は顧客登録時に選択できます。
        </p>
      </header>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <section className="rounded-xl border border-neutral-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-left text-neutral-500">
                <th className="px-3 py-3 font-medium">名前</th>
                <th className="px-3 py-3 font-medium">種別</th>
                <th className="px-3 py-3 font-medium">電話番号</th>
                <th className="px-3 py-3 font-medium">メモ</th>
                <th className="px-3 py-3" />
              </tr>
            </thead>
            <tbody>
              {items.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-neutral-400">
                    まだ紹介元がありません
                  </td>
                </tr>
              )}
              {items.map((item) => {
                const draft = getDraft(item);
                return (
                  <tr key={item.id} className="border-b border-neutral-100 last:border-0">
                    <td className="px-3 py-2">
                      <input
                        className="w-full min-w-[140px] rounded border border-neutral-300 px-2 py-1"
                        value={draft.name}
                        onChange={(e) => updateDraft(item.id, { name: e.target.value })}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <select
                        className="rounded border border-neutral-300 px-2 py-1"
                        value={draft.type}
                        onChange={(e) => updateDraft(item.id, { type: e.target.value as ReferrerType })}
                      >
                        {Object.entries(TYPE_LABELS).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <input
                        className="w-32 rounded border border-neutral-300 px-2 py-1"
                        value={draft.phone ?? ""}
                        onChange={(e) => updateDraft(item.id, { phone: e.target.value })}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        className="w-full min-w-[140px] rounded border border-neutral-300 px-2 py-1"
                        value={draft.note ?? ""}
                        onChange={(e) => updateDraft(item.id, { note: e.target.value })}
                      />
                    </td>
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
        <h2 className="text-sm font-semibold text-neutral-700">新しい紹介元を追加</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <input
            className="rounded border border-neutral-300 px-2 py-2 sm:col-span-2"
            placeholder="名前"
            value={newItem.name}
            onChange={(e) => setNewItem((prev) => ({ ...prev, name: e.target.value }))}
          />
          <select
            className="rounded border border-neutral-300 px-2 py-2"
            value={newItem.type}
            onChange={(e) => setNewItem((prev) => ({ ...prev, type: e.target.value as ReferrerType }))}
          >
            {Object.entries(TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <input
            className="rounded border border-neutral-300 px-2 py-2"
            placeholder="電話番号"
            value={newItem.phone ?? ""}
            onChange={(e) => setNewItem((prev) => ({ ...prev, phone: e.target.value }))}
          />
          <input
            className="rounded border border-neutral-300 px-2 py-2 sm:col-span-4"
            placeholder="メモ"
            value={newItem.note ?? ""}
            onChange={(e) => setNewItem((prev) => ({ ...prev, note: e.target.value }))}
          />
        </div>
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleAdd}
            className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
          >
            追加
          </button>
        </div>
      </section>
    </div>
  );
}
