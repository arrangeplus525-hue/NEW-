import type { EstimateLine } from "@/domain/types";

// 原価と利益率から標準販売単価を算出する。
// 例: 原価70,000円・利益率30%なら 70,000 / (1 - 0.3) = 100,000円
export function calcSellPriceFromMargin(costPrice: number, marginRate: number): number {
  if (marginRate >= 1) {
    throw new Error("利益率は100%未満で指定してください");
  }
  return Math.round(costPrice / (1 - marginRate));
}

export interface LineTotals {
  costTotal: number;
  sellTotal: number;
  profit: number;
  marginRate: number;
}

export function calcLineTotals(line: Pick<EstimateLine, "quantity" | "costPrice" | "sellPrice">): LineTotals {
  const costTotal = line.costPrice * line.quantity;
  const sellTotal = line.sellPrice * line.quantity;
  const profit = sellTotal - costTotal;
  const marginRate = sellTotal === 0 ? 0 : profit / sellTotal;
  return { costTotal, sellTotal, profit, marginRate };
}

export interface EstimateSummary {
  subtotalCost: number;
  subtotalSell: number;
  profitAmount: number;
  marginRate: number;
  taxAmount: number;
  totalAmount: number;
}

export function calcEstimateSummary(lines: EstimateLine[], taxRate: number): EstimateSummary {
  const totals = lines.reduce(
    (acc, line) => {
      const { costTotal, sellTotal } = calcLineTotals(line);
      acc.subtotalCost += costTotal;
      acc.subtotalSell += sellTotal;
      return acc;
    },
    { subtotalCost: 0, subtotalSell: 0 }
  );

  const profitAmount = totals.subtotalSell - totals.subtotalCost;
  const marginRate = totals.subtotalSell === 0 ? 0 : profitAmount / totals.subtotalSell;
  const taxAmount = Math.round(totals.subtotalSell * taxRate);
  const totalAmount = totals.subtotalSell + taxAmount;

  return {
    subtotalCost: totals.subtotalCost,
    subtotalSell: totals.subtotalSell,
    profitAmount,
    marginRate,
    taxAmount,
    totalAmount,
  };
}
