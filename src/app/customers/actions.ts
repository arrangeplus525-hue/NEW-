"use server";

import type { NewCustomerInput, UpdateCustomerInput } from "@/repositories/types";
import { customerRepository } from "@/repositories";
import type { Customer } from "@/domain/types";

export async function createCustomerAction(input: NewCustomerInput): Promise<Customer> {
  if (!input.name.trim()) {
    throw new Error("顧客名を入力してください");
  }
  return customerRepository.create(input);
}

export async function updateCustomerAction(input: UpdateCustomerInput): Promise<Customer> {
  if (!input.name.trim()) {
    throw new Error("顧客名を入力してください");
  }
  return customerRepository.update(input);
}
