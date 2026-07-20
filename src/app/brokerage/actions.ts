"use server";

import type { NewBrokerageDealInput, UpdateBrokerageDealInput } from "@/repositories/types";
import { brokerageDealRepository } from "@/repositories";
import type { BrokerageDeal } from "@/domain/types";

export async function createBrokerageDealAction(input: NewBrokerageDealInput): Promise<BrokerageDeal> {
  if (!input.propertyId) {
    throw new Error("物件を選択してください");
  }
  if (!input.sellerCustomerId) {
    throw new Error("売主を選択してください");
  }
  return brokerageDealRepository.create(input);
}

export async function updateBrokerageDealAction(input: UpdateBrokerageDealInput): Promise<BrokerageDeal> {
  return brokerageDealRepository.update(input);
}
