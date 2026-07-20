"use client";

import { useState } from "react";
import Link from "next/link";
import type { Customer, Project, Referrer } from "@/domain/types";
import { updateCustomerAction } from "../actions";

const statusLabel: Record<Project["status"], string> = {
  estimate: "見積中",
  contracted: "契約済み",
  in_progress: "施工中",
  completed: "完了",
};

export function CustomerDetail({
  customer,
  referrers,
  projects,
}: {
  customer: Customer;
  referrers: Referrer[];
  projects: Project[];
}) {
  const [form, setForm] = useState(customer);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setError(null);
    setSaved(false);
    setSaving(true);
    try {
      await updateCustomerAction(form);
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "保存に失敗しました");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-4 pb-24 sm:p-8">
      <div>
        <Link href="/customers" className="text-sm text-neutral-500 hover:underline">
          ← 顧客一覧に戻る
        </Link>
      </div>

      <header>
        <h1 className="text-xl font-bold text-neutral-900">{customer.name} 様</h1>
        <p className="mt-1 text-sm text-neutral-500">顧客情報の編集と、この顧客の案件一覧です。</p>
      </header>

      <section className="grid grid-cols-1 gap-4 rounded-xl border border-neutral-200 bg-white p-5 shadow-sm sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-neutral-700">顧客名</span>
          <input
            className="w-full rounded-lg border border-neutral-300 px-3 py-2"
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-neutral-700">フリガナ</span>
          <input
            className="w-full rounded-lg border border-neutral-300 px-3 py-2"
            value={form.nameKana ?? ""}
            onChange={(e) => setForm((prev) => ({ ...prev, nameKana: e.target.value }))}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-neutral-700">電話番号</span>
          <input
            className="w-full rounded-lg border border-neutral-300 px-3 py-2"
            value={form.phone ?? ""}
            onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-neutral-700">メールアドレス</span>
          <input
            className="w-full rounded-lg border border-neutral-300 px-3 py-2"
            value={form.email ?? ""}
            onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-neutral-700">郵便番号</span>
          <input
            className="w-full rounded-lg border border-neutral-300 px-3 py-2"
            value={form.postalCode ?? ""}
            onChange={(e) => setForm((prev) => ({ ...prev, postalCode: e.target.value }))}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-neutral-700">住所</span>
          <input
            className="w-full rounded-lg border border-neutral-300 px-3 py-2"
            value={form.address ?? ""}
            onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
          />
        </label>
        <label className="block sm:col-span-2">
          <span className="mb-1 block text-sm font-medium text-neutral-700">紹介元</span>
          <select
            className="w-full rounded-lg border border-neutral-300 px-3 py-2"
            value={form.referrerId ?? ""}
            onChange={(e) => setForm((prev) => ({ ...prev, referrerId: e.target.value || null }))}
          >
            <option value="">紹介元なし</option>
            {referrers.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </label>

        {error && <p className="text-sm text-red-600 sm:col-span-2">{error}</p>}
        {saved && !error && <p className="text-sm text-green-700 sm:col-span-2">保存しました</p>}

        <div className="sm:col-span-2">
          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
          >
            {saving ? "保存中..." : "保存"}
          </button>
        </div>
      </section>

      <section className="rounded-xl border border-neutral-200 bg-white shadow-sm">
        <h2 className="border-b border-neutral-200 px-5 py-3 text-sm font-semibold text-neutral-700">
          案件一覧
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-left text-neutral-500">
                <th className="px-4 py-3 font-medium">件名</th>
                <th className="px-4 py-3 font-medium">状態</th>
                <th className="px-4 py-3 font-medium">作成日</th>
              </tr>
            </thead>
            <tbody>
              {projects.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-neutral-400">
                    まだ案件がありません
                  </td>
                </tr>
              )}
              {projects.map((p) => (
                <tr key={p.id} className="border-b border-neutral-100 last:border-0">
                  <td className="px-4 py-3">{p.title}</td>
                  <td className="px-4 py-3 text-neutral-600">{statusLabel[p.status]}</td>
                  <td className="px-4 py-3 text-neutral-600">
                    {new Date(p.createdAt).toLocaleDateString("ja-JP")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
