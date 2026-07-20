import type { Craftsman } from "@/domain/types";

// 「職人提案」のルールベース簡易版。
// カテゴリ名と職人の専門（specialty）を文字列突き合わせで推測するだけの単純なルール。
// 単価マスタのカテゴリは自由入力のため、直接一致しない場合は簡単な同義語ヒントで補う。
const CATEGORY_SPECIALTY_HINTS: Record<string, string[]> = {
  水回り: ["水道", "設備"],
  解体: ["大工"],
  内装: ["大工", "クロス"],
  外装: ["塗装", "大工"],
  電気: ["電気"],
};

export function suggestCraftsmanForCategory(category: string, craftsmen: Craftsman[]): string | null {
  const direct = craftsmen.find(
    (c) => c.specialty === category || category.includes(c.specialty) || c.specialty.includes(category)
  );
  if (direct) return direct.id;

  const hints = CATEGORY_SPECIALTY_HINTS[category] ?? [];
  for (const hint of hints) {
    const match = craftsmen.find((c) => c.specialty.includes(hint));
    if (match) return match.id;
  }
  return null;
}
