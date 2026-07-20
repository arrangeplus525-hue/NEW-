"use client";

import { useState } from "react";
import type { PurchaseOrder, PurchaseOrderStatus, Supplier } from "@/domain/types";
import { createPurchaseOrderAction, deletePurchaseOrderAction, updatePurchaseOrderAction } from "../actions";

type Draft = Pick<PurchaseOrder, "supplierId" | "title" | "amount" | "orderDate" | "status">;

const statusOptions: { value: PurchaseOrderStatus; label: string }[] = [
  { value: "ordered", label: "発注済み" },
  { value: "delivered", label: "納品済み" },
];

function yen(n: number): string {
  return `¥${Math.round(n).toLocaleString("ja-JP")}`;
}

function emptyDraft(firstSupplierId: string): Draft {
  return {
    supplierId: firstSupplierId,
    title: "",
    amount: 0,
    orderDate: new Date().toISOString().slice(0, 10),
    status: "ordered",
  };
}

export function PurchaseOrderSection({
  projectId,
  initialOrders,
  suppliers,
}: {
  projectId: string;
  initialOrders: PurchaseOrder[];
  suppliers: Supplier[];
}) {
  const [orders, setOrders] = useState<PurchaseOrder[]>(initialOrders);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [newOrder, setNewOrder] = useState<Draft>(emptyDraft(suppliers[0]?.id ?? ""));
  const [error, setError] = useState<string | null>(null);

  function getDraft(order: PurchaseOrder): Draft {
    return drafts[order.id] ?? order;
  }

  function updateDraft(id: string, patch: Partial<Draft>) {
    setDrafts((prev) => {
      const base = prev[id] ?? orders.find((o) => o.id === id)!;
      return { ...prev, [id]: { ...base, ...patch } };
    });
  }

  async function handleSave(order: PurchaseOrder) {
    setError(null);
    try {
      const draft = getDraft(order);
      const updated = await updatePurchaseOrderAction({ ...order, ...draft });
      setOrders((prev) => prev.map((o) => (o.id === order.id ? updated : o)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "保存に失敗しました");
    }
  }

  async function handleDelete(id: string) {
    setError(null);
    try {
      await deletePurchaseOrderAction(id);
      setOrders((prev) => prev.filter((o) => o.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "削除に失敗しました");
    }
  }

  async function handleAdd() {
    setError(null);
    try {
      const created = await createPurchaseOrderAction({ ...newOrder, projectId });
      setOrders((prev) => [...prev, created]);
      setNewOrder(emptyDraft(suppliers[0]?.id ?? ""));
    } catch (e) {
      setError(e instanceof Error ? e.message : "追加に失敗しました");
    }
  }

  return (
    <section className="rounded-xl border border-neutral-200 bg-white shadow-sm">
      <h2 className="border-b border-neutral-200 px-5 py-3 text-sm font-semibold text-neutral-700">商社発注</h2>
      {error && <p className="px-5 pt-3 text-sm text-red-600">{error}</p>}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-left text-neutral-500">
              <th className="px-4 py-3 font-medium">商社</th>
              <th className="px-4 py-3 font-medium">発注内容</th>
              <th className="px-4 py-3 font-medium">金額</th>
              <th className="px-4 py-3 font-medium">発注日</th>
              <th className="px-4 py-3 font-medium">状態</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-neutral-400">
                  まだ発注がありません
                </td>
              </tr>
            )}
            {orders.map((order) => {
              const draft = getDraft(order);
              return (
                <tr key={order.id} className="border-b border-neutral-100 last:border-0">
                  <td className="px-4 py-2">
                    <select
                      className="rounded border border-neutral-300 px-2 py-1"
                      value={draft.supplierId}
                      onChange={(e) => updateDraft(order.id, { supplierId: e.target.value })}
                    >
                      {suppliers.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-2">
                    <input
                      className="w-full min-w-[140px] rounded border border-neutral-300 px-2 py-1"
                      value={draft.title}
                      onChange={(e) => updateDraft(order.id, { title: e.target.value })}
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="number"
                      min={0}
                      className="w-28 rounded border border-neutral-300 px-2 py-1"
                      value={draft.amount}
                      onChange={(e) => updateDraft(order.id, { amount: Number(e.target.value) })}
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="date"
                      className="rounded border border-neutral-300 px-2 py-1"
                      value={draft.orderDate}
                      onChange={(e) => updateDraft(order.id, { orderDate: e.target.value })}
                    />
                  </td>
                  <td className="px-4 py-2">
                    <select
                      className="rounded border border-neutral-300 px-2 py-1"
                      value={draft.status}
                      onChange={(e) => updateDraft(order.id, { status: e.target.value as PurchaseOrderStatus })}
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
                      onClick={() => handleSave(order)}
                      className="mr-3 text-blue-600 hover:underline"
                    >
                      保存
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(order.id)}
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
          <span className="mb-1 block text-xs text-neutral-500">商社</span>
          <select
            className="rounded border border-neutral-300 px-2 py-1.5"
            value={newOrder.supplierId}
            onChange={(e) => setNewOrder((prev) => ({ ...prev, supplierId: e.target.value }))}
          >
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs text-neutral-500">発注内容</span>
          <input
            className="w-40 rounded border border-neutral-300 px-2 py-1.5"
            placeholder="例：クロス材一式"
            value={newOrder.title}
            onChange={(e) => setNewOrder((prev) => ({ ...prev, title: e.target.value }))}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs text-neutral-500">金額</span>
          <input
            type="number"
            min={0}
            className="w-28 rounded border border-neutral-300 px-2 py-1.5"
            value={newOrder.amount}
            onChange={(e) => setNewOrder((prev) => ({ ...prev, amount: Number(e.target.value) }))}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs text-neutral-500">発注日</span>
          <input
            type="date"
            className="rounded border border-neutral-300 px-2 py-1.5"
            value={newOrder.orderDate}
            onChange={(e) => setNewOrder((prev) => ({ ...prev, orderDate: e.target.value }))}
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
      {orders.length > 0 && (
        <div className="border-t border-neutral-200 px-5 py-3 text-right text-sm text-neutral-600">
          発注金額合計: <span className="font-semibold">{yen(orders.reduce((sum, o) => sum + o.amount, 0))}</span>
        </div>
      )}
    </section>
  );
}
