// リポジトリのインターフェース。
// 今はモック実装のみだが、Supabase接続時はこのインターフェースを満たすクラスに
// 差し替えるだけでよく、画面側のコードは一切変更不要になる。

import type {
  Customer,
  PriceMasterItem,
  Project,
  ProjectStatus,
  Estimate,
  Referrer,
  Craftsman,
  Supplier,
  ProcessTask,
  PurchaseOrder,
  Invoice,
  Payment,
  Property,
  BrokerageDeal,
  ResaleProject,
} from "@/domain/types";

export type NewCustomerInput = Omit<Customer, "id" | "createdAt">;
export type UpdateCustomerInput = Omit<Customer, "createdAt">;

export interface CustomerRepository {
  list(): Promise<Customer[]>;
  getById(id: string): Promise<Customer | null>;
  create(input: NewCustomerInput): Promise<Customer>;
  update(input: UpdateCustomerInput): Promise<Customer>;
}

export interface ReferrerRepository {
  list(): Promise<Referrer[]>;
}

export type NewPriceMasterItemInput = Omit<PriceMasterItem, "id" | "sellPrice">;
export type UpdatePriceMasterItemInput = Omit<PriceMasterItem, "sellPrice">;

export interface PriceMasterRepository {
  list(): Promise<PriceMasterItem[]>;
  create(input: NewPriceMasterItemInput): Promise<PriceMasterItem>;
  update(input: UpdatePriceMasterItemInput): Promise<PriceMasterItem>;
  remove(id: string): Promise<void>;
}

export interface ProjectRepository {
  list(): Promise<Project[]>;
  getById(id: string): Promise<Project | null>;
  listByCustomer(customerId: string): Promise<Project[]>;
  createForCustomer(customerId: string, title: string, siteAddress?: string): Promise<Project>;
  updateStatus(id: string, status: ProjectStatus): Promise<Project>;
}

export interface EstimateRepository {
  save(estimate: Estimate): Promise<Estimate>;
  list(): Promise<Estimate[]>;
  getById(id: string): Promise<Estimate | null>;
  listByProject(projectId: string): Promise<Estimate[]>;
}

export type NewCraftsmanInput = Omit<Craftsman, "id" | "createdAt">;
export type UpdateCraftsmanInput = Omit<Craftsman, "createdAt">;

export interface CraftsmanRepository {
  list(): Promise<Craftsman[]>;
  create(input: NewCraftsmanInput): Promise<Craftsman>;
  update(input: UpdateCraftsmanInput): Promise<Craftsman>;
  remove(id: string): Promise<void>;
}

export type NewSupplierInput = Omit<Supplier, "id" | "createdAt">;
export type UpdateSupplierInput = Omit<Supplier, "createdAt">;

export interface SupplierRepository {
  list(): Promise<Supplier[]>;
  create(input: NewSupplierInput): Promise<Supplier>;
  update(input: UpdateSupplierInput): Promise<Supplier>;
  remove(id: string): Promise<void>;
}

export type NewProcessTaskInput = Omit<ProcessTask, "id">;
export type UpdateProcessTaskInput = ProcessTask;

export interface ProcessTaskRepository {
  list(): Promise<ProcessTask[]>;
  listByProject(projectId: string): Promise<ProcessTask[]>;
  create(input: NewProcessTaskInput): Promise<ProcessTask>;
  update(input: UpdateProcessTaskInput): Promise<ProcessTask>;
  remove(id: string): Promise<void>;
}

export type NewPurchaseOrderInput = Omit<PurchaseOrder, "id">;
export type UpdatePurchaseOrderInput = PurchaseOrder;

export interface PurchaseOrderRepository {
  listByProject(projectId: string): Promise<PurchaseOrder[]>;
  create(input: NewPurchaseOrderInput): Promise<PurchaseOrder>;
  update(input: UpdatePurchaseOrderInput): Promise<PurchaseOrder>;
  remove(id: string): Promise<void>;
}

export type NewInvoiceInput = Omit<Invoice, "id" | "invoiceNumber" | "status" | "createdAt">;

export interface InvoiceRepository {
  list(): Promise<Invoice[]>;
  listByProject(projectId: string): Promise<Invoice[]>;
  getById(id: string): Promise<Invoice | null>;
  create(input: NewInvoiceInput): Promise<Invoice>;
}

export type NewPaymentInput = Omit<Payment, "id">;

export interface PaymentRepository {
  list(): Promise<Payment[]>;
  listByInvoice(invoiceId: string): Promise<Payment[]>;
  create(input: NewPaymentInput): Promise<Payment>;
  remove(id: string): Promise<void>;
}

export type NewPropertyInput = Omit<Property, "id" | "createdAt">;
export type UpdatePropertyInput = Omit<Property, "createdAt">;

export interface PropertyRepository {
  list(): Promise<Property[]>;
  getById(id: string): Promise<Property | null>;
  create(input: NewPropertyInput): Promise<Property>;
  update(input: UpdatePropertyInput): Promise<Property>;
}

export type NewBrokerageDealInput = Omit<BrokerageDeal, "id" | "createdAt">;
export type UpdateBrokerageDealInput = Omit<BrokerageDeal, "createdAt">;

export interface BrokerageDealRepository {
  list(): Promise<BrokerageDeal[]>;
  create(input: NewBrokerageDealInput): Promise<BrokerageDeal>;
  update(input: UpdateBrokerageDealInput): Promise<BrokerageDeal>;
}

export type NewResaleProjectInput = Omit<ResaleProject, "id" | "createdAt">;
export type UpdateResaleProjectInput = Omit<ResaleProject, "createdAt">;

export interface ResaleProjectRepository {
  list(): Promise<ResaleProject[]>;
  create(input: NewResaleProjectInput): Promise<ResaleProject>;
  update(input: UpdateResaleProjectInput): Promise<ResaleProject>;
}
