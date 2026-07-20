"use server";

import type { NewSupplierInput, UpdateSupplierInput } from "@/repositories/types";
import { supplierRepository } from "@/repositories";
import type { Supplier } from "@/domain/types";

export async function createSupplierAction(input: NewSupplierInput): Promise<Supplier> {
  if (!input.name.trim()) {
    throw new Error("商社名を入力してください");
  }
  return supplierRepository.create(input);
}

export async function updateSupplierAction(input: UpdateSupplierInput): Promise<Supplier> {
  if (!input.name.trim()) {
    throw new Error("商社名を入力してください");
  }
  return supplierRepository.update(input);
}

export async function deleteSupplierAction(id: string): Promise<void> {
  await supplierRepository.remove(id);
}
