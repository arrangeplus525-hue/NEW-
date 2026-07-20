"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Customer, Referrer } from "@/domain/types";
import { createCustomerAction } from "./actions";

type NewCustomerDraft = {
  name: string;
  nameKana: string;
  phone: string;
  email: string;
  postalCode: string;
  address: string;
  referrerId: string;
};

const emptyDraft: NewCustomerDraft = {
  name: "",
  nameKana: "",
  phone: "",
  email: "",
  postalCode: "",
  address: "",
  referrerId: "",
};

export function CustomerList({
  initialCustomers,
  referrers,
}: {
  initialCustomers: Customer[];
  referrers: Referrer[];
}) {
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [draft, setDraft] = useState<NewCustomerDraft>(emptyDraft);
  const [error, setError] = useState<string | null>(null);

  const referrerNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const r of referrers) map.set(r.id, r.name);
    return map;
  }, [referrers]);

  async function handleAdd() {
    setError(null);
    try {
      const created = await createCustomerAction({
        name: draft.name,
        nameKana: draft.nameKana || undefined,
        phone: draft.phone || undefined,
        email: draft.email || undefined,
        postalCode: draft.postalCode || undefined,
        address: draft.address || undefined,
        referrerId: draft.referrerId || null,
      });
      setCustomers((prev) => [...prev, created]);
      setDraft(emptyDraft);
    } catch (e) {
      setError(e instanceof Error ? e.message : "登録に失敗しました");
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-4 pb-24 sm:p-8">
      <header>
        <h1 className="text-xl font-bold text-neutral-900">顧客管理</h1>
        <p className="mt-1 text-sm text-neutral-500">
          顧客情報は一度登録すれば、見積作成など他の画面からもそのまま利用できます。
        </p>
      </header>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <section className="rounded-xl border border-neutral-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-left text-neutral-500">
                <th className="px-4 py-3 font-medium">顧客名</th>
                <th className="px-4 py-3 font-medium">電話番号</th>
                <th className="px-4 py-3 font-medium">住所</th>
                <th className="px-4 py-3 font-medium">紹介元</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {customers.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-neutral-400">
                    まだ顧客が登録されていません
                  </td>
                </tr>
              )}
              {customers.map((c) => (
                <tr key={c.id} className="border-b border-neutral-100 last:border-0">
                  <td className="px-4 py-3 font-medium">{c.name}</td>
                  <td className="px-4 py-3 text-neutral-600">{c.phone ?? "-"}</td>
                  <td className="px-4 py-3 text-neutral-600">{c.address ?? "-"}</td>
                  <td className="px-4 py-3 text-neutral-600">
                    {c.referrerId ? (referrerNameById.get(c.referrerId) ?? "-") : "-"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/customers/${c.id}`} className="text-blue-600 hover:underline">
                      詳細・案件一覧
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-4 rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-neutral-700">新しい顧客を登録</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input
            className="rounded border border-neutral-300 px-3 py-2"
            placeholder="顧客名（必須）"
            value={draft.name}
            onChange={(e) => setDraft((prev) => ({ ...prev, name: e.target.value }))}
          />
          <input
            className="rounded border border-neutral-300 px-3 py-2"
            placeholder="フリガナ"
            value={draft.nameKana}
            onChange={(e) => setDraft((prev) => ({ ...prev, nameKana: e.target.value }))}
          />
          <input
            className="rounded border border-neutral-300 px-3 py-2"
            placeholder="電話番号"
            value={draft.phone}
            onChange={(e) => setDraft((prev) => ({ ...prev, phone: e.target.value }))}
          />
          <input
            className="rounded border border-neutral-300 px-3 py-2"
            placeholder="メールアドレス"
            value={draft.email}
            onChange={(e) => setDraft((prev) => ({ ...prev, email: e.target.value }))}
          />
          <input
            className="rounded border border-neutral-300 px-3 py-2"
            placeholder="郵便番号"
            value={draft.postalCode}
            onChange={(e) => setDraft((prev) => ({ ...prev, postalCode: e.target.value }))}
          />
          <input
            className="rounded border border-neutral-300 px-3 py-2"
            placeholder="住所"
            value={draft.address}
            onChange={(e) => setDraft((prev) => ({ ...prev, address: e.target.value }))}
          />
          <select
            className="rounded border border-neutral-300 px-3 py-2 sm:col-span-2"
            value={draft.referrerId}
            onChange={(e) => setDraft((prev) => ({ ...prev, referrerId: e.target.value }))}
          >
            <option value="">紹介元なし</option>
            {referrers.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
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
