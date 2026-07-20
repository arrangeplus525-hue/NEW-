"use server";

import type { NewResaleProjectInput, UpdateResaleProjectInput } from "@/repositories/types";
import { resaleProjectRepository } from "@/repositories";
import type { ResaleProject } from "@/domain/types";

export async function createResaleProjectAction(input: NewResaleProjectInput): Promise<ResaleProject> {
  if (!input.propertyId) {
    throw new Error("物件を選択してください");
  }
  return resaleProjectRepository.create(input);
}

export async function updateResaleProjectAction(input: UpdateResaleProjectInput): Promise<ResaleProject> {
  return resaleProjectRepository.update(input);
}
