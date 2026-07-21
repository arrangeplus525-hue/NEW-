import type {
  BrokerageDeal,
  Craftsman,
  Customer,
  Estimate,
  Invoice,
  Payment,
  PriceMasterItem,
  ProcessTask,
  Project,
  ProjectStatus,
  Property,
  PurchaseOrder,
  Referrer,
  ResaleProject,
  Supplier,
} from "@/domain/types";
import type {
  BrokerageDealRepository,
  CraftsmanRepository,
  CustomerRepository,
  EstimateRepository,
  InvoiceRepository,
  NewBrokerageDealInput,
  NewCraftsmanInput,
  NewCustomerInput,
  NewInvoiceInput,
  NewPaymentInput,
  NewPriceMasterItemInput,
  NewProcessTaskInput,
  NewPropertyInput,
  NewPurchaseOrderInput,
  NewReferrerInput,
  NewResaleProjectInput,
  NewSupplierInput,
  PaymentRepository,
  PriceMasterRepository,
  ProcessTaskRepository,
  ProjectRepository,
  PropertyRepository,
  PurchaseOrderRepository,
  ReferrerRepository,
  ResaleProjectRepository,
  SupplierRepository,
  UpdateBrokerageDealInput,
  UpdateCraftsmanInput,
  UpdateCustomerInput,
  UpdatePriceMasterItemInput,
  UpdateProcessTaskInput,
  UpdatePropertyInput,
  UpdatePurchaseOrderInput,
  UpdateReferrerInput,
  UpdateResaleProjectInput,
  UpdateSupplierInput,
} from "./types";
import {
  mockCraftsmen,
  mockCustomers,
  mockPriceMasterItems,
  mockProperties,
  mockReferrers,
  mockSuppliers,
} from "./mock-data";
import { calcSellPriceFromMargin } from "@/lib/calculations/estimate-calculations";
import { generateDocumentNumber } from "@/lib/document-number";

// 開発中はメモリ上に保持するだけのモック実装。
// サーバー再起動でデータは消える点に注意。
// Supabase接続後は同じインターフェースを持つ SupabaseXxxRepository に差し替える。
//
// globalThis に保持しているのは、Next.jsの開発サーバーがServer ActionsとRoute
// Handlerを別々のモジュールグラフとしてコンパイルすることがあり、通常のモジュール
// スコープ変数だとインスタンスが分かれてデータが共有されないため。

interface MockStore {
  projects: Project[];
  estimates: Estimate[];
  priceMasterItems: PriceMasterItem[];
  customers: Customer[];
  referrers: Referrer[];
  craftsmen: Craftsman[];
  suppliers: Supplier[];
  processTasks: ProcessTask[];
  purchaseOrders: PurchaseOrder[];
  invoices: Invoice[];
  payments: Payment[];
  properties: Property[];
  brokerageDeals: BrokerageDeal[];
  resaleProjects: ResaleProject[];
}

const globalForMockStore = globalThis as unknown as { __mockStore?: MockStore };

const store: MockStore =
  globalForMockStore.__mockStore ??
  (globalForMockStore.__mockStore = {
    projects: [],
    estimates: [],
    priceMasterItems: [...mockPriceMasterItems],
    customers: [...mockCustomers],
    referrers: [...mockReferrers],
    craftsmen: [...mockCraftsmen],
    suppliers: [...mockSuppliers],
    processTasks: [],
    purchaseOrders: [],
    invoices: [],
    payments: [],
    properties: [...mockProperties],
    brokerageDeals: [],
    resaleProjects: [],
  });

// 入金記録の合計額と請求金額を比べて、請求書のstatusを算出し直す。
// Supabase移行時はDBトリガーかRPCに置き換える想定。
function recomputeInvoiceStatus(invoiceId: string): void {
  const invoice = store.invoices.find((i) => i.id === invoiceId);
  if (!invoice) return;
  const paidTotal = store.payments
    .filter((p) => p.invoiceId === invoiceId)
    .reduce((sum, p) => sum + p.amount, 0);
  invoice.status = paidTotal <= 0 ? "unpaid" : paidTotal < invoice.amount ? "partially_paid" : "paid";
}

class MockCustomerRepository implements CustomerRepository {
  async list(): Promise<Customer[]> {
    return store.customers;
  }
  async getById(id: string): Promise<Customer | null> {
    return store.customers.find((c) => c.id === id) ?? null;
  }
  async create(input: NewCustomerInput): Promise<Customer> {
    const customer: Customer = {
      ...input,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    store.customers.push(customer);
    return customer;
  }
  async update(input: UpdateCustomerInput): Promise<Customer> {
    const index = store.customers.findIndex((c) => c.id === input.id);
    if (index === -1) {
      throw new Error("顧客が見つかりません");
    }
    const updated: Customer = { ...store.customers[index], ...input };
    store.customers[index] = updated;
    return updated;
  }
}

class MockReferrerRepository implements ReferrerRepository {
  async list(): Promise<Referrer[]> {
    return store.referrers;
  }
  async create(input: NewReferrerInput): Promise<Referrer> {
    const referrer: Referrer = {
      ...input,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    store.referrers.push(referrer);
    return referrer;
  }
  async update(input: UpdateReferrerInput): Promise<Referrer> {
    const index = store.referrers.findIndex((r) => r.id === input.id);
    if (index === -1) {
      throw new Error("紹介元が見つかりません");
    }
    const updated: Referrer = { ...store.referrers[index], ...input };
    store.referrers[index] = updated;
    return updated;
  }
  async remove(id: string): Promise<void> {
    store.referrers = store.referrers.filter((r) => r.id !== id);
  }
}

class MockPriceMasterRepository implements PriceMasterRepository {
  async list(): Promise<PriceMasterItem[]> {
    return store.priceMasterItems;
  }
  async create(input: NewPriceMasterItemInput): Promise<PriceMasterItem> {
    const item: PriceMasterItem = {
      ...input,
      id: crypto.randomUUID(),
      sellPrice: calcSellPriceFromMargin(input.costPrice, input.marginRate),
    };
    store.priceMasterItems.push(item);
    return item;
  }
  async update(input: UpdatePriceMasterItemInput): Promise<PriceMasterItem> {
    const index = store.priceMasterItems.findIndex((p) => p.id === input.id);
    if (index === -1) {
      throw new Error("単価マスタ項目が見つかりません");
    }
    const updated: PriceMasterItem = {
      ...input,
      sellPrice: calcSellPriceFromMargin(input.costPrice, input.marginRate),
    };
    store.priceMasterItems[index] = updated;
    return updated;
  }
  async remove(id: string): Promise<void> {
    store.priceMasterItems = store.priceMasterItems.filter((p) => p.id !== id);
  }
}

class MockProjectRepository implements ProjectRepository {
  async list(): Promise<Project[]> {
    return store.projects;
  }
  async getById(id: string): Promise<Project | null> {
    return store.projects.find((p) => p.id === id) ?? null;
  }
  async listByCustomer(customerId: string): Promise<Project[]> {
    return store.projects.filter((p) => p.customerId === customerId);
  }
  async createForCustomer(customerId: string, title: string, siteAddress?: string): Promise<Project> {
    const project: Project = {
      id: crypto.randomUUID(),
      customerId,
      title,
      siteAddress,
      status: "estimate",
      createdAt: new Date().toISOString(),
    };
    store.projects.push(project);
    return project;
  }
  async updateStatus(id: string, status: ProjectStatus): Promise<Project> {
    const index = store.projects.findIndex((p) => p.id === id);
    if (index === -1) {
      throw new Error("案件が見つかりません");
    }
    const updated: Project = { ...store.projects[index], status };
    store.projects[index] = updated;
    return updated;
  }
}

class MockEstimateRepository implements EstimateRepository {
  async save(estimate: Estimate): Promise<Estimate> {
    const index = store.estimates.findIndex((e) => e.id === estimate.id);
    if (index >= 0) {
      store.estimates[index] = estimate;
    } else {
      store.estimates.push(estimate);
    }
    return estimate;
  }
  async list(): Promise<Estimate[]> {
    return store.estimates;
  }
  async getById(id: string): Promise<Estimate | null> {
    return store.estimates.find((e) => e.id === id) ?? null;
  }
  async listByProject(projectId: string): Promise<Estimate[]> {
    return store.estimates.filter((e) => e.projectId === projectId);
  }
}

class MockCraftsmanRepository implements CraftsmanRepository {
  async list(): Promise<Craftsman[]> {
    return store.craftsmen;
  }
  async create(input: NewCraftsmanInput): Promise<Craftsman> {
    const craftsman: Craftsman = { ...input, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    store.craftsmen.push(craftsman);
    return craftsman;
  }
  async update(input: UpdateCraftsmanInput): Promise<Craftsman> {
    const index = store.craftsmen.findIndex((c) => c.id === input.id);
    if (index === -1) {
      throw new Error("職人が見つかりません");
    }
    const updated: Craftsman = { ...store.craftsmen[index], ...input };
    store.craftsmen[index] = updated;
    return updated;
  }
  async remove(id: string): Promise<void> {
    store.craftsmen = store.craftsmen.filter((c) => c.id !== id);
  }
}

class MockSupplierRepository implements SupplierRepository {
  async list(): Promise<Supplier[]> {
    return store.suppliers;
  }
  async create(input: NewSupplierInput): Promise<Supplier> {
    const supplier: Supplier = { ...input, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    store.suppliers.push(supplier);
    return supplier;
  }
  async update(input: UpdateSupplierInput): Promise<Supplier> {
    const index = store.suppliers.findIndex((s) => s.id === input.id);
    if (index === -1) {
      throw new Error("商社が見つかりません");
    }
    const updated: Supplier = { ...store.suppliers[index], ...input };
    store.suppliers[index] = updated;
    return updated;
  }
  async remove(id: string): Promise<void> {
    store.suppliers = store.suppliers.filter((s) => s.id !== id);
  }
}

class MockProcessTaskRepository implements ProcessTaskRepository {
  async list(): Promise<ProcessTask[]> {
    return store.processTasks;
  }
  async listByProject(projectId: string): Promise<ProcessTask[]> {
    return store.processTasks.filter((t) => t.projectId === projectId);
  }
  async create(input: NewProcessTaskInput): Promise<ProcessTask> {
    const task: ProcessTask = { ...input, id: crypto.randomUUID() };
    store.processTasks.push(task);
    return task;
  }
  async update(input: UpdateProcessTaskInput): Promise<ProcessTask> {
    const index = store.processTasks.findIndex((t) => t.id === input.id);
    if (index === -1) {
      throw new Error("工程が見つかりません");
    }
    store.processTasks[index] = input;
    return input;
  }
  async remove(id: string): Promise<void> {
    store.processTasks = store.processTasks.filter((t) => t.id !== id);
  }
}

class MockPurchaseOrderRepository implements PurchaseOrderRepository {
  async listByProject(projectId: string): Promise<PurchaseOrder[]> {
    return store.purchaseOrders.filter((o) => o.projectId === projectId);
  }
  async create(input: NewPurchaseOrderInput): Promise<PurchaseOrder> {
    const order: PurchaseOrder = { ...input, id: crypto.randomUUID() };
    store.purchaseOrders.push(order);
    return order;
  }
  async update(input: UpdatePurchaseOrderInput): Promise<PurchaseOrder> {
    const index = store.purchaseOrders.findIndex((o) => o.id === input.id);
    if (index === -1) {
      throw new Error("発注が見つかりません");
    }
    store.purchaseOrders[index] = input;
    return input;
  }
  async remove(id: string): Promise<void> {
    store.purchaseOrders = store.purchaseOrders.filter((o) => o.id !== id);
  }
}

class MockInvoiceRepository implements InvoiceRepository {
  async list(): Promise<Invoice[]> {
    return store.invoices;
  }
  async listByProject(projectId: string): Promise<Invoice[]> {
    return store.invoices.filter((i) => i.projectId === projectId);
  }
  async getById(id: string): Promise<Invoice | null> {
    return store.invoices.find((i) => i.id === id) ?? null;
  }
  async create(input: NewInvoiceInput): Promise<Invoice> {
    const invoice: Invoice = {
      ...input,
      id: crypto.randomUUID(),
      invoiceNumber: generateDocumentNumber("INV"),
      status: "unpaid",
      createdAt: new Date().toISOString(),
    };
    store.invoices.push(invoice);
    return invoice;
  }
}

class MockPaymentRepository implements PaymentRepository {
  async list(): Promise<Payment[]> {
    return store.payments;
  }
  async listByInvoice(invoiceId: string): Promise<Payment[]> {
    return store.payments.filter((p) => p.invoiceId === invoiceId);
  }
  async create(input: NewPaymentInput): Promise<Payment> {
    const payment: Payment = { ...input, id: crypto.randomUUID() };
    store.payments.push(payment);
    recomputeInvoiceStatus(input.invoiceId);
    return payment;
  }
  async remove(id: string): Promise<void> {
    const payment = store.payments.find((p) => p.id === id);
    store.payments = store.payments.filter((p) => p.id !== id);
    if (payment) {
      recomputeInvoiceStatus(payment.invoiceId);
    }
  }
}

class MockPropertyRepository implements PropertyRepository {
  async list(): Promise<Property[]> {
    return store.properties;
  }
  async getById(id: string): Promise<Property | null> {
    return store.properties.find((p) => p.id === id) ?? null;
  }
  async create(input: NewPropertyInput): Promise<Property> {
    const property: Property = { ...input, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    store.properties.push(property);
    return property;
  }
  async update(input: UpdatePropertyInput): Promise<Property> {
    const index = store.properties.findIndex((p) => p.id === input.id);
    if (index === -1) {
      throw new Error("物件が見つかりません");
    }
    const updated: Property = { ...store.properties[index], ...input };
    store.properties[index] = updated;
    return updated;
  }
}

class MockBrokerageDealRepository implements BrokerageDealRepository {
  async list(): Promise<BrokerageDeal[]> {
    return store.brokerageDeals;
  }
  async create(input: NewBrokerageDealInput): Promise<BrokerageDeal> {
    const deal: BrokerageDeal = { ...input, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    store.brokerageDeals.push(deal);
    return deal;
  }
  async update(input: UpdateBrokerageDealInput): Promise<BrokerageDeal> {
    const index = store.brokerageDeals.findIndex((d) => d.id === input.id);
    if (index === -1) {
      throw new Error("売買仲介案件が見つかりません");
    }
    const updated: BrokerageDeal = { ...store.brokerageDeals[index], ...input };
    store.brokerageDeals[index] = updated;
    return updated;
  }
}

class MockResaleProjectRepository implements ResaleProjectRepository {
  async list(): Promise<ResaleProject[]> {
    return store.resaleProjects;
  }
  async create(input: NewResaleProjectInput): Promise<ResaleProject> {
    const project: ResaleProject = { ...input, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    store.resaleProjects.push(project);
    return project;
  }
  async update(input: UpdateResaleProjectInput): Promise<ResaleProject> {
    const index = store.resaleProjects.findIndex((p) => p.id === input.id);
    if (index === -1) {
      throw new Error("買取再販案件が見つかりません");
    }
    const updated: ResaleProject = { ...store.resaleProjects[index], ...input };
    store.resaleProjects[index] = updated;
    return updated;
  }
}

export const customerRepository: CustomerRepository = new MockCustomerRepository();
export const referrerRepository: ReferrerRepository = new MockReferrerRepository();
export const priceMasterRepository: PriceMasterRepository = new MockPriceMasterRepository();
export const projectRepository: ProjectRepository = new MockProjectRepository();
export const estimateRepository: EstimateRepository = new MockEstimateRepository();
export const craftsmanRepository: CraftsmanRepository = new MockCraftsmanRepository();
export const supplierRepository: SupplierRepository = new MockSupplierRepository();
export const processTaskRepository: ProcessTaskRepository = new MockProcessTaskRepository();
export const purchaseOrderRepository: PurchaseOrderRepository = new MockPurchaseOrderRepository();
export const invoiceRepository: InvoiceRepository = new MockInvoiceRepository();
export const paymentRepository: PaymentRepository = new MockPaymentRepository();
export const propertyRepository: PropertyRepository = new MockPropertyRepository();
export const brokerageDealRepository: BrokerageDealRepository = new MockBrokerageDealRepository();
export const resaleProjectRepository: ResaleProjectRepository = new MockResaleProjectRepository();
