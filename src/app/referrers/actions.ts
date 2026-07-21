"use server";

import type { NewReferrerInput, UpdateReferrerInput } from "@/repositories/types";
import { referrerRepository } from "@/repositories";
import type { Referrer } from "@/domain/types";

export async function createReferrerAction(input: NewReferrerInput): Promise<Referrer> {
  if (!input.name.trim()) {
    throw new Error("名前を入力してください");
  }
  return referrerRepository.create(input);
}

export async function updateReferrerAction(input: UpdateReferrerInput): Promise<Referrer> {
  if (!input.name.trim()) {
    throw new Error("名前を入力してください");
  }
  return referrerRepository.update(input);
}

export async function deleteReferrerAction(id: string): Promise<void> {
  await referrerRepository.remove(id);
}
