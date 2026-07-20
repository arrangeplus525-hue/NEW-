"use server";

import type { NewPropertyInput, UpdatePropertyInput } from "@/repositories/types";
import { propertyRepository } from "@/repositories";
import type { Property } from "@/domain/types";

export async function createPropertyAction(input: NewPropertyInput): Promise<Property> {
  if (!input.name.trim()) {
    throw new Error("物件名を入力してください");
  }
  return propertyRepository.create(input);
}

export async function updatePropertyAction(input: UpdatePropertyInput): Promise<Property> {
  if (!input.name.trim()) {
    throw new Error("物件名を入力してください");
  }
  return propertyRepository.update(input);
}
