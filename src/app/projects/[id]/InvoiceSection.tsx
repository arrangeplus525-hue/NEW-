"use client";

import { useState, type Dispatch, type SetStateAction } from "react";
import type { Invoice, InvoiceStatus, Payment } from "@/domain/types";
import { createInvoiceAction, createPaymentAction, deletePaymentAction } from "../actions";

function yen(n: number): string {
  return `¥${Math.round(n).toLocaleString("ja-JP")}`;
}

const statusLabel: Record<InvoiceStatus, string> = {
  unpaid: "未入金",
  partially_paid: "一部入金",
  paid: "入金完了",
};

const statusBadgeClass: Record<InvoiceStatus, string> = {
  unpaid: "bg-neutral-100 text-neutral-600",
  partially_paid: "bg-amber-100 text-amber-700",
  paid: "bg-green-100 text-green-700",
};

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function InvoiceSection({
  projectId,
  customerId,
  invoices,
  setInvoices,
  paymentsByInvoice,
  setPaymentsByInvoice,
}: {
  projectId: string;
  customerId: string;
  invoices: Invoice[];
  setInvoices: Dispatch<SetStateAction<Invoice[]>>;
  paymentsByInvoice: Record<string, Payment[]>;
  setPaymentsByInvoice: Dispatch<SetStateAction<Record<string, Payment[]>>>;
}) {
  const [newInvoice, setNewInvoice] = useState({ title: "", amount: 0, issueDate: today() });
  const [paymentDrafts, setPaymentDrafts] = useState<Record<string, { amount: number; paidDate: string }>>({});
  const [error, setError] = useState<string | null>(null);

  function getPaymentDraft(invoiceId: string) {
    return paymentDrafts[invoiceId] ?? { amount: 0, paidDate: today() };
  }

  async function handleCreateInvoice() {
    setError(null);
    try {
      const created = await createInvoiceAction({ ...newInvoice, projectId, customerId });
      setInvoices((prev) => [...prev, created]);
      setPaymentsByInvoice((prev) => ({ ...prev, [created.id]: [] }));
      setNewInvoice({ title: "", amount: 0, issueDate: today() });
    } catch (e) {
      setError(e instanceof Error ? e.message : "請求書の発行に失敗しました");
    }
  }

  async function handleAddPayment(invoice: Invoice) {
    setError(null);
    try {
      const draft = getPaymentDraft(invoice.id);
      const payment = await createPaymentAction({ ...draft, invoiceId: invoice.id });
      const paidTotal = [...(paymentsByInvoice[invoice.id] ?? []), payment].reduce((s, p) => s + p.amount, 0);
      setPaymentsByInvoice((prev) => ({ ...prev, [invoice.id]: [...(prev[invoice.id] ?? []), payment] }));
      setInvoices((prev) =>
        prev.map((i) =>
          i.id === invoice.id
            ? { ...i, status: paidTotal <= 0 ? "unpaid" : paidTotal < i.amount ? "partially_paid" : "paid" }
            : i
        )
      );
      setPaymentDrafts((prev) => ({ ...prev, [invoice.id]: { amount: 0, paidDate: today() } }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "入金の記録に失敗しました");
    }
  }

  async function handleDeletePayment(invoice: Invoice, paymentId: string) {
    setError(null);
    try {
      await deletePaymentAction(paymentId);
      const remaining = (paymentsByInvoice[invoice.id] ?? []).filter((p) => p.id !== paymentId);
      const paidTotal = remaining.reduce((s, p) => s + p.amount, 0);
      setPaymentsByInvoice((prev) => ({ ...prev, [invoice.id]: remaining }));
      setInvoices((prev) =>
        prev.map((i) =>
          i.id === invoice.id
            ? { ...i, status: paidTotal <= 0 ? "unpaid" : paidTotal < i.amount ? "partially_paid" : "paid" }
            : i
        )
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "削除に失敗しました");
    }
  }

  return (
    <section className="rounded-xl border border-neutral-200 bg-white shadow-sm">
      <h2 className="border-b border-neutral-200 px-5 py-3 text-sm font-semibold text-neutral-700">請求・入金</h2>
      {error && <p className="px-5 pt-3 text-sm text-red-600">{error}</p>}

      <div className="space-y-4 p-5">
        {invoices.length === 0 && <p className="text-sm text-neutral-400">まだ請求書がありません</p>}
        {invoices.map((invoice) => {
          const payments = paymentsByInvoice[invoice.id] ?? [];
          const paidTotal = payments.reduce((s, p) => s + p.amount, 0);
          const remaining = invoice.amount - paidTotal;
          const draft = getPaymentDraft(invoice.id);
          return (
            <div key={invoice.id} className="rounded-lg border border-neutral-200 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="font-medium">{invoice.title}</span>
                  <span className="ml-2 text-xs text-neutral-400">{invoice.invoiceNumber}</span>
                  <span
                    className={`ml-2 rounded-full px-2 py-0.5 text-xs ${statusBadgeClass[invoice.status]}`}
                  >
                    {statusLabel[invoice.status]}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="font-semibold">{yen(invoice.amount)}</span>
                  <a
                    href={`/api/invoices/${invoice.id}/pdf`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    PDF
                  </a>
                </div>
              </div>

              {payments.length > 0 && (
                <ul className="mt-3 space-y-1 text-sm text-neutral-600">
                  {payments.map((p) => (
                    <li key={p.id} className="flex items-center justify-between">
                      <span>
                        {new Date(p.paidDate).toLocaleDateString("ja-JP")} 入金: {yen(p.amount)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeletePayment(invoice, p.id)}
                        className="text-neutral-400 hover:text-red-600"
                      >
                        取消
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-3 flex flex-wrap items-end justify-between gap-3 border-t border-neutral-100 pt-3">
                <div className="flex items-end gap-2">
                  <label className="block">
                    <span className="mb-1 block text-xs text-neutral-500">入金日</span>
                    <input
                      type="date"
                      className="rounded border border-neutral-300 px-2 py-1 text-sm"
                      value={draft.paidDate}
                      onChange={(e) =>
                        setPaymentDrafts((prev) => ({
                          ...prev,
                          [invoice.id]: { ...draft, paidDate: e.target.value },
                        }))
                      }
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-xs text-neutral-500">入金額</span>
                    <input
                      type="number"
                      min={0}
                      className="w-28 rounded border border-neutral-300 px-2 py-1 text-sm"
                      value={draft.amount}
                      onChange={(e) =>
                        setPaymentDrafts((prev) => ({
                          ...prev,
                          [invoice.id]: { ...draft, amount: Number(e.target.value) },
                        }))
                      }
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => handleAddPayment(invoice)}
                    className="rounded-lg bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-neutral-700"
                  >
                    入金を記録
                  </button>
                </div>
                <span className="text-sm text-neutral-500">残額: {yen(remaining)}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-end gap-3 border-t border-neutral-200 p-5">
        <label className="block">
          <span className="mb-1 block text-xs text-neutral-500">件名</span>
          <input
            className="w-40 rounded border border-neutral-300 px-2 py-1.5"
            placeholder="例：着手金"
            value={newInvoice.title}
            onChange={(e) => setNewInvoice((prev) => ({ ...prev, title: e.target.value }))}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs text-neutral-500">金額</span>
          <input
            type="number"
            min={0}
            className="w-28 rounded border border-neutral-300 px-2 py-1.5"
            value={newInvoice.amount}
            onChange={(e) => setNewInvoice((prev) => ({ ...prev, amount: Number(e.target.value) }))}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs text-neutral-500">発行日</span>
          <input
            type="date"
            className="rounded border border-neutral-300 px-2 py-1.5"
            value={newInvoice.issueDate}
            onChange={(e) => setNewInvoice((prev) => ({ ...prev, issueDate: e.target.value }))}
          />
        </label>
        <button
          type="button"
          onClick={handleCreateInvoice}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
        >
          請求書を発行
        </button>
      </div>
    </section>
  );
}
