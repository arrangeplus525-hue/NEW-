import type { EstimateLine, PriceMasterItem } from "@/domain/types";

// 「見積漏れ検知」のルールベース簡易版。
// 同じカテゴリに材料はあるのに工賃（施工費）が無い、またはその逆のケースを検知する。
// 本物のAIではなく、単価マスタのtype（material/labor）を突き合わせるだけの単純なルール。
export function detectEstimateGaps(lines: EstimateLine[], priceItems: PriceMasterItem[]): string[] {
  const priceItemById = new Map(priceItems.map((p) => [p.id, p]));
  const categoriesWithMaterial = new Set<string>();
  const categoriesWithLabor = new Set<string>();

  for (const line of lines) {
    const item = priceItemById.get(line.priceItemId);
    if (!item) continue;
    if (item.type === "material") categoriesWithMaterial.add(line.category);
    if (item.type === "labor") categoriesWithLabor.add(line.category);
  }

  const warnings: string[] = [];
  for (const category of categoriesWithMaterial) {
    if (!categoriesWithLabor.has(category)) {
      warnings.push(`「${category}」に材料はありますが、工賃（施工費）が見当たりません。`);
    }
  }
  for (const category of categoriesWithLabor) {
    if (!categoriesWithMaterial.has(category)) {
      warnings.push(`「${category}」に工賃はありますが、材料費が見当たりません。`);
    }
  }
  return warnings;
}
