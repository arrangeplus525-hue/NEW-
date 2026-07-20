import type { ResaleProject } from "@/domain/types";

export function calcResaleProfit(project: Pick<ResaleProject, "acquisitionCost" | "workActualCost" | "targetSellPrice" | "actualSellPrice">) {
  const sellPrice = project.actualSellPrice ?? project.targetSellPrice;
  const cost = project.acquisitionCost + project.workActualCost;
  const profit = sellPrice - cost;
  const roi = cost === 0 ? 0 : profit / cost;
  return { profit, roi };
}
