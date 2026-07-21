"use server";

import type { Estimate, EstimateLine } from "@/domain/types";
import { customerRepository, estimateRepository, projectRepository } from "@/repositories";
import { generateDocumentNumber } from "@/lib/document-number";

export interface SaveEstimateInput {
  customerId: string;
  title: string;
  lines: EstimateLine[];
  // 指定があれば既存案件に追加、無ければ件名を案件名として新規案件を作成する。
  projectId?: string;
  siteAddress?: string; // 新規案件作成時のみ使用（現場住所）
  overheadFee?: number; // 諸経費
  adjustedPrice?: number; // 調整後価格
}

export async function saveEstimateAction(input: SaveEstimateInput): Promise<{ estimateId: string }> {
  const customer = await customerRepository.getById(input.customerId);
  if (!customer) {
    throw new Error("顧客が見つかりません");
  }
  if (input.lines.length === 0) {
    throw new Error("見積項目を1件以上追加してください");
  }

  let project;
  if (input.projectId) {
    project = await projectRepository.getById(input.projectId);
    if (!project || project.customerId !== customer.id) {
      throw new Error("案件が見つかりません");
    }
  } else {
    project = await projectRepository.createForCustomer(customer.id, input.title, input.siteAddress);
  }

  const estimate: Estimate = {
    id: crypto.randomUUID(),
    estimateNumber: generateDocumentNumber("EST"),
    customerId: customer.id,
    projectId: project.id,
    title: input.title,
    issueDate: new Date().toISOString(),
    lines: input.lines,
    taxRate: 0.1,
    overheadFee: input.overheadFee,
    adjustedPrice: input.adjustedPrice,
    status: "draft",
    createdAt: new Date().toISOString(),
  };

  await estimateRepository.save(estimate);

  return { estimateId: estimate.id };
}
