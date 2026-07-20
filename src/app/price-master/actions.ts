"use server";

import type { NewPriceMasterItemInput, UpdatePriceMasterItemInput } from "@/repositories/types";
import { priceMasterRepository } from "@/repositories";
import type { PriceMasterItem } from "@/domain/types";

export async function createPriceItemAction(input: NewPriceMasterItemInput): Promise<PriceMasterItem> {
  if (!input.name.trim()) {
    throw new Error("項目名を入力してください");
  }
  if (!input.category.trim()) {
    throw new Error("カテゴリを入力してください");
  }
  return priceMasterRepository.create(input);
}

export async function updatePriceItemAction(input: UpdatePriceMasterItemInput): Promise<PriceMasterItem> {
  if (!input.name.trim()) {
    throw new Error("項目名を入力してください");
  }
  return priceMasterRepository.update(input);
}

export async function deletePriceItemAction(id: string): Promise<void> {
  await priceMasterRepository.remove(id);
}
