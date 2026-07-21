"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type {
  Craftsman,
  Customer,
  Estimate,
  Invoice,
  Payment,
  ProcessTask,
  Project,
  ProjectStatus,
  PurchaseOrder,
  Referrer,
  Supplier,
} from "@/domain/types";
import type { EstimateSummary } from "@/lib/calculations/estimate-calculations";
import { updateProjectStatusAction } from "../actions";
import { ProcessTaskSection } from "./ProcessTaskSection";
import { PurchaseOrderSection } from "./PurchaseOrderSection";
import { InvoiceSection } from "./InvoiceSection";
import { ProfitAnalysis } from "./ProfitAnalysis";

const statusOptions: { value: ProjectStatus; label: string }[] = [
  { value: "estimate", label: "見積中" },
  { value: "contracted", label: "契約済み" },
  { value: "in_progress", label: "施工中" },
  { value: "completed", label: "完了" },
];

function yen(n: number): string {
  return `¥${Math.round(n).toLocaleString("ja-JP")}`;
}

export function ProjectDetail({
  project,
  customer,
  referrer,
  estimateSummaries,
  craftsmen,
  suppliers,
  initialProcessTasks,
  initialPurchaseOrders,
  initialInvoices,
  initialPaymentsByInvoice,
  profitAnalysis,
}: {
  project: Project;
  customer: Customer | null;
  referrer: Referrer | null;
  estimateSummaries: { estimate: Estimate; summary: EstimateSummary }[];
  craftsmen: Craftsman[];
  suppliers: Supplier[];
  initialProcessTasks: ProcessTask[];
  initialPurchaseOrders: PurchaseOrder[];
  initialInvoices: Invoice[];
  initialPaymentsByInvoice: Record<string, Payment[]>;
  profitAnalysis: {
    estimateRevenueTotal: number;
    estimateCostTotal: number;
    actualCostTotal: number;
  };
}) {
  const [status, setStatus] = useState<ProjectStatus>(project.status);
  const [saving, setSaving] = useState(false);
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [paymentsByInvoice, setPaymentsByInvoice] = useState(initialPaymentsByInvoice);

  const invoicedTotal = useMemo(() => invoices.reduce((sum, i) => sum + i.amount, 0), [invoices]);
  const collectedTotal = useMemo(
    () =>
      Object.values(paymentsByInvoice)
        .flat()
        .reduce((sum, p) => sum + p.amount, 0),
    [paymentsByInvoice]
  );

  async function handleStatusChange(next: ProjectStatus) {
    setStatus(next);
    setSaving(true);
    try {
      await updateProjectStatusAction(project.id, next);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-4 pb-24 sm:p-8">
      <div>
        <Link href="/projects" className="text-sm text-neutral-500 hover:underline">
          ← 案件一覧に戻る
        </Link>
      </div>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">{project.title}</h1>
          {customer && (
            <p className="mt-1 text-sm text-neutral-500">
              顧客:{" "}
              <Link href={`/customers/${customer.id}`} className="text-blue-600 hover:underline">
                {customer.name} 様
              </Link>
            </p>
          )}
        </div>
        <label className="flex items-center gap-2 text-sm">
          <span className="text-neutral-600">状態</span>
          <select
            className="rounded-lg border border-neutral-300 px-3 py-2"
            value={status}
            disabled={saving}
            onChange={(e) => handleStatusChange(e.target.value as ProjectStatus)}
          >
            {statusOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      </header>

      <section className="rounded-xl border border-neutral-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-3">
          <h2 className="text-sm font-semibold text-neutral-700">この案件の見積一覧</h2>
          <Link href="/estimates/new" className="text-sm text-blue-600 hover:underline">
            + 新しい見積を作成
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-left text-neutral-500">
                <th className="px-4 py-3 font-medium">見積番号</th>
                <th className="px-4 py-3 font-medium">件名</th>
                <th className="px-4 py-3 font-medium">発行日</th>
                <th className="px-4 py-3 font-medium">金額（税込）</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {estimateSummaries.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-neutral-400">
                    まだ見積がありません
                  </td>
                </tr>
              )}
              {estimateSummaries.map(({ estimate, summary }) => (
                <tr key={estimate.id} className="border-b border-neutral-100 last:border-0">
                  <td className="px-4 py-3 text-neutral-600">{estimate.estimateNumber}</td>
                  <td className="px-4 py-3">{estimate.title}</td>
                  <td className="px-4 py-3 text-neutral-600">
                    {new Date(estimate.issueDate).toLocaleDateString("ja-JP")}
                  </td>
                  <td className="px-4 py-3 font-medium">{yen(summary.totalAmount)}</td>
                  <td className="px-4 py-3 text-right">
                    <a
                      href={`/api/estimates/${estimate.id}/pdf`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      PDF
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <ProcessTaskSection projectId={project.id} initialTasks={initialProcessTasks} craftsmen={craftsmen} />

      <PurchaseOrderSection projectId={project.id} initialOrders={initialPurchaseOrders} suppliers={suppliers} />

      {customer && (
        <InvoiceSection
          projectId={project.id}
          customerId={customer.id}
          invoices={invoices}
          setInvoices={setInvoices}
          paymentsByInvoice={paymentsByInvoice}
          setPaymentsByInvoice={setPaymentsByInvoice}
        />
      )}

      <ProfitAnalysis
        {...profitAnalysis}
        invoicedTotal={invoicedTotal}
        collectedTotal={collectedTotal}
        projectId={project.id}
        referrer={referrer}
        referralCommissionRate={project.referralCommissionRate}
        personalKickbackAmount={project.personalKickbackAmount}
        personalKickbackNote={project.personalKickbackNote}
      />
    </div>
  );
}
