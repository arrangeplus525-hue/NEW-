"use server";

import type { Estimate, EstimateLine } from "@/domain/types";
import { customerRepository, estimateRepository, projectRepository } from "@/repositories";
import { generateDocumentNumber } from "@/lib/document-number";

export interface NewCustomerFields {
  name: string;
  phone?: string;
  email?: string;
  postalCode?: string;
  address?: string;
}

export interface SaveEstimateInput {
  // customerIdかnewCustomerのどちらか一方を指定する。
  // 顧客管理に未登録のまま見積を作ることが多いため、その場で新規顧客登録もできるようにしている。
  customerId?: string;
  newCustomer?: NewCustomerFields;
  title: string;
  lines: EstimateLine[];
  // 指定があれば既存案件に追加、無ければ件名を案件名として新規案件を作成する。
  projectId?: string;
  siteAddress?: string; // 新規案件作成時のみ使用（現場住所）
  overheadFee?: number; // 諸経費
  adjustedPrice?: number; // 調整後価格
}

export async function saveEstimateAction(input: SaveEstimateInput): Promise<{ estimateId: string }> {
  let customer;
  if (input.newCustomer) {
    if (!input.newCustomer.name.trim()) {
      throw new Error("顧客名を入力してください");
    }
    customer = await customerRepository.create({
      name: input.newCustomer.name,
      phone: input.newCustomer.phone,
      email: input.newCustomer.email,
      postalCode: input.newCustomer.postalCode,
      address: input.newCustomer.address,
    });
  } else if (input.customerId) {
    customer = await customerRepository.getById(input.customerId);
    if (!customer) {
      throw new Error("顧客が見つかりません");
    }
  } else {
    throw new Error("顧客を選択するか、新しい顧客情報を入力してください");
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
