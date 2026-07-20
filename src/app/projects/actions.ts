"use server";

import type { Invoice, Payment, Project, ProjectStatus, ProcessTask, PurchaseOrder } from "@/domain/types";
import {
  craftsmanRepository,
  estimateRepository,
  invoiceRepository,
  paymentRepository,
  processTaskRepository,
  projectRepository,
  purchaseOrderRepository,
} from "@/repositories";
import type {
  NewInvoiceInput,
  NewPaymentInput,
  NewProcessTaskInput,
  NewPurchaseOrderInput,
  UpdateProcessTaskInput,
  UpdatePurchaseOrderInput,
} from "@/repositories/types";
import { suggestCraftsmanForCategory } from "@/lib/ai/craftsman-suggestion";

export async function updateProjectStatusAction(id: string, status: ProjectStatus): Promise<Project> {
  return projectRepository.updateStatus(id, status);
}

export async function createProcessTaskAction(input: NewProcessTaskInput): Promise<ProcessTask> {
  if (!input.title.trim()) {
    throw new Error("工程名を入力してください");
  }
  return processTaskRepository.create(input);
}

export async function updateProcessTaskAction(input: UpdateProcessTaskInput): Promise<ProcessTask> {
  if (!input.title.trim()) {
    throw new Error("工程名を入力してください");
  }
  return processTaskRepository.update(input);
}

export async function deleteProcessTaskAction(id: string): Promise<void> {
  await processTaskRepository.remove(id);
}

export async function createPurchaseOrderAction(input: NewPurchaseOrderInput): Promise<PurchaseOrder> {
  if (!input.title.trim()) {
    throw new Error("発注内容を入力してください");
  }
  if (!input.supplierId) {
    throw new Error("商社を選択してください");
  }
  return purchaseOrderRepository.create(input);
}

export async function updatePurchaseOrderAction(input: UpdatePurchaseOrderInput): Promise<PurchaseOrder> {
  if (!input.title.trim()) {
    throw new Error("発注内容を入力してください");
  }
  return purchaseOrderRepository.update(input);
}

export async function deletePurchaseOrderAction(id: string): Promise<void> {
  await purchaseOrderRepository.remove(id);
}

export async function createInvoiceAction(input: NewInvoiceInput): Promise<Invoice> {
  if (!input.title.trim()) {
    throw new Error("請求書の件名を入力してください");
  }
  if (input.amount <= 0) {
    throw new Error("請求金額を入力してください");
  }
  return invoiceRepository.create(input);
}

export async function createPaymentAction(input: NewPaymentInput): Promise<Payment> {
  if (input.amount <= 0) {
    throw new Error("入金額を入力してください");
  }
  return paymentRepository.create(input);
}

export async function deletePaymentAction(id: string): Promise<void> {
  await paymentRepository.remove(id);
}

// 「工程自動生成・職人提案」のルールベース簡易版。
// 見積項目のカテゴリごとに1つの工程を作り、明日から3日間ずつ順番に割り当てる。
// 担当職人は専門（specialty）とカテゴリ名の簡易マッチングで提案する。本物のAIではない。
export async function generateProcessTasksFromEstimatesAction(projectId: string): Promise<ProcessTask[]> {
  const [estimates, craftsmen] = await Promise.all([
    estimateRepository.listByProject(projectId),
    craftsmanRepository.list(),
  ]);

  const categories: string[] = [];
  for (const estimate of estimates) {
    for (const line of estimate.lines) {
      if (!categories.includes(line.category)) {
        categories.push(line.category);
      }
    }
  }

  if (categories.length === 0) {
    throw new Error("この案件には見積項目がありません");
  }

  const created: ProcessTask[] = [];
  const cursor = new Date();
  cursor.setDate(cursor.getDate() + 1); // 明日から

  for (const category of categories) {
    const startDate = cursor.toISOString().slice(0, 10);
    const endCursor = new Date(cursor);
    endCursor.setDate(endCursor.getDate() + 2); // 3日間（開始日を含む）
    const endDate = endCursor.toISOString().slice(0, 10);

    const task = await processTaskRepository.create({
      projectId,
      title: `${category}工事`,
      craftsmanId: suggestCraftsmanForCategory(category, craftsmen),
      startDate,
      endDate,
      status: "not_started",
    });
    created.push(task);

    cursor.setTime(endCursor.getTime());
    cursor.setDate(cursor.getDate() + 1); // 次の工程は翌日から
  }

  return created;
}
