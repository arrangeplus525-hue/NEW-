"use server";

import type { NewCraftsmanInput, UpdateCraftsmanInput } from "@/repositories/types";
import { craftsmanRepository } from "@/repositories";
import type { Craftsman } from "@/domain/types";

export async function createCraftsmanAction(input: NewCraftsmanInput): Promise<Craftsman> {
  if (!input.name.trim()) {
    throw new Error("職人名（会社名）を入力してください");
  }
  return craftsmanRepository.create(input);
}

export async function updateCraftsmanAction(input: UpdateCraftsmanInput): Promise<Craftsman> {
  if (!input.name.trim()) {
    throw new Error("職人名（会社名）を入力してください");
  }
  return craftsmanRepository.update(input);
}

export async function deleteCraftsmanAction(id: string): Promise<void> {
  await craftsmanRepository.remove(id);
}
