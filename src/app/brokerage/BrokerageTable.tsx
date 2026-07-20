"use client";

import { useState } from "react";
import type { BrokerageDeal, BrokerageDealStatus, Customer, Property } from "@/domain/types";
import { createBrokerageDealAction, updateBrokerageDealAction } from "./actions";

type Draft = Pick<
  BrokerageDeal,
  "propertyId" | "sellerCustomerId" | "buyerCustomerId" | "contractDate" | "settlementDate" | "commissionAmount" | "loanUsed" | "status"
>;

const statusLabel: Record<BrokerageDealStatus, string> = {
  negotiating: "商談中",
  contracted: "契約済み",
  settled: "決済完了",
};

function yen(n: number): string {
  return `¥${Math.round(n).toLocaleString("ja-JP")}`;
}

function emptyDraft(properties: Property[], customers: Customer[]): Draft {
  return {
    propertyId: properties[0]?.id ?? "",
    sellerCustomerId: customers[0]?.id ?? "",
    buyerCustomerId: null,
    contractDate: null,
    settlementDate: null,
    commissionAmount: 0,
    loanUsed: false,
    status: "negotiating",
  };
}

export function BrokerageTable({
  initialDeals,
  properties,
  customers,
}: {
  initialDeals: BrokerageDeal[];
  properties: Property[];
  customers: Customer[];
}) {
  const [deals, setDeals] = useState<BrokerageDeal[]>(initialDeals);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [newDeal, setNewDeal] = useState<Draft>(emptyDraft(properties, customers));
  const [error, setError] = useState<string | null>(null);

  const propertyNameById = new Map(properties.map((p) => [p.id, p.name]));
  const customerNameById = new Map(customers.map((c) => [c.id, c.name]));

  function getDraft(deal: BrokerageDeal): Draft {
    return drafts[deal.id] ?? deal;
  }

  function updateDraft(id: string, patch: Partial<Draft>) {
    setDrafts((prev) => {
      const base = prev[id] ?? deals.find((d) => d.id === id)!;
      return { ...prev, [id]: { ...base, ...patch } };
    });
  }

  async function handleSave(deal: BrokerageDeal) {
    setError(null);
    try {
      const draft = getDraft(deal);
      const updated = await updateBrokerageDealAction({ id: deal.id, ...draft });
      setDeals((prev) => prev.map((d) => (d.id === deal.id ? updated : d)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "保存に失敗しました");
    }
  }

  async function handleAdd() {
    setError(null);
    try {
      const created = await createBrokerageDealAction(newDeal);
      setDeals((prev) => [...prev, created]);
      setNewDeal(emptyDraft(properties, customers));
    } catch (e) {
      setError(e instanceof Error ? e.message : "登録に失敗しました");
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-4 pb-24 sm:p-8">
      <header>
        <h1 className="text-xl font-bold text-neutral-900">売買仲介</h1>
        <p className="mt-1 text-sm text-neutral-500">売主・買主・契約日・決済日・仲介手数料を管理します。</p>
      </header>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <section className="rounded-xl border border-neutral-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-left text-neutral-500">
                <th className="px-3 py-3 font-medium">物件</th>
                <th className="px-3 py-3 font-medium">売主</th>
                <th className="px-3 py-3 font-medium">買主</th>
                <th className="px-3 py-3 font-medium">契約日</th>
                <th className="px-3 py-3 font-medium">決済日</th>
                <th className="px-3 py-3 font-medium">仲介手数料</th>
                <th className="px-3 py-3 font-medium">ローン</th>
                <th className="px-3 py-3 font-medium">状態</th>
                <th className="px-3 py-3" />
              </tr>
            </thead>
            <tbody>
              {deals.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-neutral-400">
                    まだ売買仲介案件がありません
                  </td>
                </tr>
              )}
              {deals.map((deal) => {
                const draft = getDraft(deal);
                return (
                  <tr key={deal.id} className="border-b border-neutral-100 last:border-0">
                    <td className="px-3 py-2 text-neutral-700">{propertyNameById.get(deal.propertyId) ?? "-"}</td>
                    <td className="px-3 py-2 text-neutral-700">
                      {customerNameById.get(deal.sellerCustomerId) ?? "-"}
                    </td>
                    <td className="px-3 py-2">
                      <select
                        className="rounded border border-neutral-300 px-2 py-1"
                        value={draft.buyerCustomerId ?? ""}
                        onChange={(e) => updateDraft(deal.id, { buyerCustomerId: e.target.value || null })}
                      >
                        <option value="">未定</option>
                        {customers.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="date"
                        className="rounded border border-neutral-300 px-2 py-1"
                        value={draft.contractDate ?? ""}
                        onChange={(e) => updateDraft(deal.id, { contractDate: e.target.value || null })}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="date"
                        className="rounded border border-neutral-300 px-2 py-1"
                        value={draft.settlementDate ?? ""}
                        onChange={(e) => updateDraft(deal.id, { settlementDate: e.target.value || null })}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min={0}
                        className="w-28 rounded border border-neutral-300 px-2 py-1"
                        value={draft.commissionAmount}
                        onChange={(e) => updateDraft(deal.id, { commissionAmount: Number(e.target.value) })}
                      />
                    </td>
                    <td className="px-3 py-2 text-center">
                      <input
                        type="checkbox"
                        checked={draft.loanUsed}
                        onChange={(e) => updateDraft(deal.id, { loanUsed: e.target.checked })}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <select
                        className="rounded border border-neutral-300 px-2 py-1"
                        value={draft.status}
                        onChange={(e) => updateDraft(deal.id, { status: e.target.value as BrokerageDealStatus })}
                      >
                        {Object.entries(statusLabel).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-right">
                      <button type="button" onClick={() => handleSave(deal)} className="text-blue-600 hover:underline">
                        保存
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {deals.length > 0 && (
          <div className="border-t border-neutral-200 px-5 py-3 text-right text-sm text-neutral-600">
            仲介手数料合計: <span className="font-semibold">{yen(deals.reduce((s, d) => s + d.commissionAmount, 0))}</span>
          </div>
        )}
      </section>

      <section className="space-y-4 rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-neutral-700">新しい売買仲介案件を登録</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <select
            className="rounded border border-neutral-300 px-3 py-2"
            value={newDeal.propertyId}
            onChange={(e) => setNewDeal((prev) => ({ ...prev, propertyId: e.target.value }))}
          >
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <select
            className="rounded border border-neutral-300 px-3 py-2"
            value={newDeal.sellerCustomerId}
            onChange={(e) => setNewDeal((prev) => ({ ...prev, sellerCustomerId: e.target.value }))}
          >
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}（売主）
              </option>
            ))}
          </select>
          <input
            type="number"
            min={0}
            className="rounded border border-neutral-300 px-3 py-2"
            placeholder="仲介手数料"
            value={newDeal.commissionAmount}
            onChange={(e) => setNewDeal((prev) => ({ ...prev, commissionAmount: Number(e.target.value) }))}
          />
          <label className="flex items-center gap-2 text-sm text-neutral-600">
            <input
              type="checkbox"
              checked={newDeal.loanUsed}
              onChange={(e) => setNewDeal((prev) => ({ ...prev, loanUsed: e.target.checked }))}
            />
            住宅ローン利用
          </label>
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
