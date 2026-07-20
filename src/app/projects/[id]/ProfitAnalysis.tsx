function yen(n: number): string {
  return `¥${Math.round(n).toLocaleString("ja-JP")}`;
}

function percent(n: number): string {
  return `${(n * 100).toFixed(1)}%`;
}

export function ProfitAnalysis({
  estimateRevenueTotal,
  estimateCostTotal,
  actualCostTotal,
  invoicedTotal,
  collectedTotal,
}: {
  estimateRevenueTotal: number;
  estimateCostTotal: number;
  actualCostTotal: number;
  invoicedTotal: number;
  collectedTotal: number;
}) {
  const estimateProfit = estimateRevenueTotal - estimateCostTotal;
  const estimateMarginRate = estimateRevenueTotal === 0 ? 0 : estimateProfit / estimateRevenueTotal;

  const actualProfit = estimateRevenueTotal - actualCostTotal;
  const actualMarginRate = estimateRevenueTotal === 0 ? 0 : actualProfit / estimateRevenueTotal;

  const outstandingTotal = invoicedTotal - collectedTotal;

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
