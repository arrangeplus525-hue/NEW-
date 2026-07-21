"use client";

import { useState } from "react";
import type { Referrer } from "@/domain/types";
import { updateProjectCommissionsAction } from "../actions";

function yen(n: number): string {
  return `¥${Math.round(n).toLocaleString("ja-JP")}`;
}

function percent(n: number): string {
  return `${(n * 100).toFixed(1)}%`;
}

export function ProfitAnalysis({
  projectId,
  referrer,
  referralCommissionRate,
  personalKickbackAmount,
  personalKickbackNote,
  estimateRevenueTotal,
  estimateCostTotal,
  actualCostTotal,
  invoicedTotal,
  collectedTotal,
}: {
  projectId: string;
  referrer: Referrer | null;
  referralCommissionRate?: number;
  personalKickbackAmount?: number;
  personalKickbackNote?: string;
  estimateRevenueTotal: number;
  estimateCostTotal: number;
  actualCostTotal: number;
  invoicedTotal: number;
  collectedTotal: number;
}) {
  const [commissionRatePct, setCommissionRatePct] = useState(
    Math.round((referralCommissionRate ?? referrer?.commissionRate ?? 0) * 100)
  );
  const [kickbackYen, setKickbackYen] = useState(personalKickbackAmount ?? 0);
  const [kickbackNote, setKickbackNote] = useState(personalKickbackNote ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const estimateProfit = estimateRevenueTotal - estimateCostTotal;
  const estimateMarginRate = estimateRevenueTotal === 0 ? 0 : estimateProfit / estimateRevenueTotal;

  const actualProfit = estimateRevenueTotal - actualCostTotal;
  const actualMarginRate = estimateRevenueTotal === 0 ? 0 : actualProfit / estimateRevenueTotal;

  const outstandingTotal = invoicedTotal - collectedTotal;

  const commissionAmount = estimateRevenueTotal * (commissionRatePct / 100);
  const kickbackAmount = kickbackYen;
  const netProfit = actualProfit - commissionAmount - kickbackAmount;
  const netMarginRate = estimateRevenueTotal === 0 ? 0 : netProfit / estimateRevenueTotal;

  async function handleSaveCommissions() {
    setSaving(true);
    setSaved(false);
    try {
      await updateProjectCommissionsAction(projectId, {
        referralCommissionRate: commissionRatePct / 100,
        personalKickbackAmount: kickbackYen,
        personalKickbackNote: kickbackNote,
      });
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-sm font-semibold text-neutral-700">利益分析</h2>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div>
          <dt className="text-xs text-neutral-500">見積売上合計</dt>
          <dd className="text-lg font-semibold">{yen(estimateRevenueTotal)}</dd>
        </div>
        <div>
          <dt className="text-xs text-neutral-500">見積原価合計</dt>
          <dd className="text-lg font-semibold">{yen(estimateCostTotal)}</dd>
        </div>
        <div>
          <dt className="text-xs text-neutral-500">見積上の粗利</dt>
          <dd className="text-lg font-semibold">{yen(estimateProfit)}</dd>
        </div>
        <div>
          <dt className="text-xs text-neutral-500">見積上の利益率</dt>
          <dd className="text-lg font-semibold">{percent(estimateMarginRate)}</dd>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 border-t border-neutral-100 pt-4 sm:grid-cols-4">
        <div>
          <dt className="text-xs text-neutral-500">実際原価（発注合計）</dt>
          <dd className="text-lg font-semibold">{yen(actualCostTotal)}</dd>
        </div>
        <div>
          <dt className="text-xs text-neutral-500">実際の粗利（見込）</dt>
          <dd className={`text-lg font-semibold ${actualProfit < estimateProfit ? "text-red-600" : ""}`}>
            {yen(actualProfit)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-neutral-500">実際の利益率（見込）</dt>
          <dd className="text-lg font-semibold">{percent(actualMarginRate)}</dd>
        </div>
        <div>
          <dt className="text-xs text-neutral-500">原価差異（発注 - 見積）</dt>
          <dd className={`text-lg font-semibold ${actualCostTotal > estimateCostTotal ? "text-red-600" : ""}`}>
            {yen(actualCostTotal - estimateCostTotal)}
          </dd>
        </div>
      </div>

      <div className="mt-4 border-t border-neutral-100 pt-4">
        <h3 className="mb-3 text-xs font-semibold text-neutral-500">紹介料・個人バック</h3>
        <div className="flex flex-wrap items-end gap-4">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-neutral-600">
              紹介料率{referrer && <span className="text-neutral-400">（{referrer.name} 基本 {Math.round((referrer.commissionRate ?? 0) * 100)}%）</span>}
            </span>
            <span className="flex items-center gap-1">
              <input
                type="number"
                min={0}
                max={100}
                className="w-20 rounded border border-neutral-300 px-2 py-1"
                value={commissionRatePct}
                onChange={(e) => {
                  setCommissionRatePct(Number(e.target.value));
                  setSaved(false);
                }}
              />
              <span className="text-neutral-400">%</span>
            </span>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-neutral-600">個人バック（固定額）</span>
            <span className="flex items-center gap-1">
              <span className="text-neutral-400">¥</span>
              <input
                type="number"
                min={0}
                step={10000}
                className="w-28 rounded border border-neutral-300 px-2 py-1"
                value={kickbackYen}
                onChange={(e) => {
                  setKickbackYen(Number(e.target.value));
                  setSaved(false);
                }}
              />
            </span>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-neutral-600">バック先（営業マン名等）</span>
            <input
              className="w-48 rounded border border-neutral-300 px-2 py-1"
              placeholder="例）〇〇さん"
              value={kickbackNote}
              onChange={(e) => {
                setKickbackNote(e.target.value);
                setSaved(false);
              }}
            />
          </label>
          <button
            type="button"
            disabled={saving}
            onClick={handleSaveCommissions}
            className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50"
          >
            {saving ? "保存中..." : "保存"}
          </button>
          {saved && <span className="text-sm text-green-600">保存しました</span>}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <dt className="text-xs text-neutral-500">紹介料</dt>
            <dd className="text-lg font-semibold">{yen(commissionAmount)}</dd>
          </div>
          <div>
            <dt className="text-xs text-neutral-500">個人バック</dt>
            <dd className="text-lg font-semibold">{yen(kickbackAmount)}</dd>
          </div>
          <div>
            <dt className="text-xs text-neutral-500">実質利益（バック考慮後）</dt>
            <dd className={`text-lg font-semibold ${netProfit < actualProfit ? "text-amber-600" : ""}`}>
              {yen(netProfit)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-neutral-500">実質利益率</dt>
            <dd className="text-lg font-semibold">{percent(netMarginRate)}</dd>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 border-t border-neutral-100 pt-4 sm:grid-cols-3">
        <div>
          <dt className="text-xs text-neutral-500">請求合計</dt>
          <dd className="text-lg font-semibold">{yen(invoicedTotal)}</dd>
        </div>
        <div>
          <dt className="text-xs text-neutral-500">入金合計</dt>
          <dd className="text-lg font-semibold">{yen(collectedTotal)}</dd>
        </div>
        <div>
          <dt className="text-xs text-neutral-500">未収金</dt>
          <dd className={`text-lg font-semibold ${outstandingTotal > 0 ? "text-amber-600" : ""}`}>
            {yen(outstandingTotal)}
          </dd>
        </div>
      </div>
    </section>
  );
}
