// Supabase接続時の本番実装。src/repositories/types.ts のインターフェースを満たすだけで、
// 画面・サーバーアクション側のコードは一切変更していない。
// カラム名はDBがsnake_case、アプリ（TypeScript）側はcamelCaseなので、ここで変換する。

import type {
  BrokerageDeal,
  Craftsman,
  Customer,
  Estimate,
  EstimateLine,
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
import { calcSellPriceFromMargin } from "@/lib/calculations/estimate-calculations";
import { generateDocumentNumber } from "@/lib/document-number";
import { getSupabaseClient } from "@/lib/supabase/client";

function n(value: unknown): number {
  return Number(value ?? 0);
}

// ---------- Referrer ----------

function mapReferrer(row: Record<string, unknown>): Referrer {
  return {
    id: row.id as string,
    name: row.name as string,
    type: row.type as Referrer["type"],
    phone: (row.phone as string) ?? undefined,
    note: (row.note as string) ?? undefined,
    createdAt: row.created_at as string,
  };
}

class SupabaseReferrerRepository implements ReferrerRepository {
  async list(): Promise<Referrer[]> {
    const { data, error } = await getSupabaseClient().from("referrers").select("*").order("created_at");
    if (error) throw error;
    return (data ?? []).map(mapReferrer);
  }
  async create(input: NewReferrerInput): Promise<Referrer> {
    const { data, error } = await getSupabaseClient()
      .from("referrers")
      .insert({
        name: input.name,
        type: input.type,
        phone: input.phone ?? null,
        note: input.note ?? null,
      })
      .select()
      .single();
    if (error) throw error;
    return mapReferrer(data);
  }
  async update(input: UpdateReferrerInput): Promise<Referrer> {
    const { data, error } = await getSupabaseClient()
      .from("referrers")
      .update({
        name: input.name,
        type: input.type,
        phone: input.phone ?? null,
        note: input.note ?? null,
      })
      .eq("id", input.id)
      .select()
      .single();
    if (error) throw error;
    return mapReferrer(data);
  }
  async remove(id: string): Promise<void> {
    const { error } = await getSupabaseClient().from("referrers").delete().eq("id", id);
    if (error) throw error;
  }
}

// ---------- Customer ----------

function mapCustomer(row: Record<string, unknown>): Customer {
  return {
    id: row.id as string,
    name: row.name as string,
    nameKana: (row.name_kana as string) ?? undefined,
    phone: (row.phone as string) ?? undefined,
    email: (row.email as string) ?? undefined,
    postalCode: (row.postal_code as string) ?? undefined,
    address: (row.address as string) ?? undefined,
    referrerId: (row.referrer_id as string) ?? null,
    createdAt: row.created_at as string,
  };
}

class SupabaseCustomerRepository implements CustomerRepository {
  async list(): Promise<Customer[]> {
    const { data, error } = await getSupabaseClient().from("customers").select("*").order("created_at");
    if (error) throw error;
    return (data ?? []).map(mapCustomer);
  }
  async getById(id: string): Promise<Customer | null> {
    const { data, error } = await getSupabaseClient().from("customers").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    return data ? mapCustomer(data) : null;
  }
  async create(input: NewCustomerInput): Promise<Customer> {
    const { data, error } = await getSupabaseClient()
      .from("customers")
      .insert({
        name: input.name,
        name_kana: input.nameKana,
        phone: input.phone,
        email: input.email,
        postal_code: input.postalCode,
        address: input.address,
        referrer_id: input.referrerId,
      })
      .select()
      .single();
    if (error) throw error;
    return mapCustomer(data);
  }
  async update(input: UpdateCustomerInput): Promise<Customer> {
    const { data, error } = await getSupabaseClient()
      .from("customers")
      .update({
        name: input.name,
        name_kana: input.nameKana,
        phone: input.phone,
        email: input.email,
        postal_code: input.postalCode,
        address: input.address,
        referrer_id: input.referrerId,
      })
      .eq("id", input.id)
      .select()
      .single();
    if (error) throw error;
    return mapCustomer(data);
  }
}

// ---------- PriceMasterItem ----------

function mapPriceMasterItem(row: Record<string, unknown>): PriceMasterItem {
  return {
    id: row.id as string,
    category: row.category as string,
    type: row.type as PriceMasterItem["type"],
    name: row.name as string,
    unit: row.unit as string,
    costPrice: n(row.cost_price),
    marginRate: n(row.margin_rate),
    sellPrice: n(row.sell_price),
  };
}

class SupabasePriceMasterRepository implements PriceMasterRepository {
  async list(): Promise<PriceMasterItem[]> {
    const { data, error } = await getSupabaseClient().from("price_master_items").select("*").order("category");
    if (error) throw error;
    return (data ?? []).map(mapPriceMasterItem);
  }
  async create(input: NewPriceMasterItemInput): Promise<PriceMasterItem> {
    const sellPrice = calcSellPriceFromMargin(input.costPrice, input.marginRate);
    const { data, error } = await getSupabaseClient()
      .from("price_master_items")
      .insert({
        category: input.category,
        type: input.type,
        name: input.name,
        unit: input.unit,
        cost_price: input.costPrice,
        margin_rate: input.marginRate,
        sell_price: sellPrice,
      })
      .select()
      .single();
    if (error) throw error;
    return mapPriceMasterItem(data);
  }
  async update(input: UpdatePriceMasterItemInput): Promise<PriceMasterItem> {
    const sellPrice = calcSellPriceFromMargin(input.costPrice, input.marginRate);
    const { data, error } = await getSupabaseClient()
      .from("price_master_items")
      .update({
        category: input.category,
        type: input.type,
        name: input.name,
        unit: input.unit,
        cost_price: input.costPrice,
        margin_rate: input.marginRate,
        sell_price: sellPrice,
        updated_at: new Date().toISOString(),
      })
      .eq("id", input.id)
      .select()
      .single();
    if (error) throw error;
    return mapPriceMasterItem(data);
  }
  async remove(id: string): Promise<void> {
    const { error } = await getSupabaseClient().from("price_master_items").delete().eq("id", id);
    if (error) throw error;
  }
}

// ---------- Project ----------

function mapProject(row: Record<string, unknown>): Project {
  return {
    id: row.id as string,
    customerId: row.customer_id as string,
    title: row.title as string,
    siteAddress: (row.site_address as string | null) ?? undefined,
    status: row.status as ProjectStatus,
    createdAt: row.created_at as string,
  };
}

class SupabaseProjectRepository implements ProjectRepository {
  async list(): Promise<Project[]> {
    const { data, error } = await getSupabaseClient().from("projects").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map(mapProject);
  }
  async getById(id: string): Promise<Project | null> {
    const { data, error } = await getSupabaseClient().from("projects").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    return data ? mapProject(data) : null;
  }
  async listByCustomer(customerId: string): Promise<Project[]> {
    const { data, error } = await getSupabaseClient()
      .from("projects")
      .select("*")
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map(mapProject);
  }
  async createForCustomer(customerId: string, title: string, siteAddress?: string): Promise<Project> {
    const { data, error } = await getSupabaseClient()
      .from("projects")
      .insert({ customer_id: customerId, title, site_address: siteAddress ?? null, status: "estimate" })
      .select()
      .single();
    if (error) throw error;
    return mapProject(data);
  }
  async updateStatus(id: string, status: ProjectStatus): Promise<Project> {
    const { data, error } = await getSupabaseClient().from("projects").update({ status }).eq("id", id).select().single();
    if (error) throw error;
    return mapProject(data);
  }
}

// ---------- Estimate (+ lines) ----------

function mapEstimateLine(row: Record<string, unknown>): EstimateLine {
  return {
    id: row.id as string,
    priceItemId: row.price_item_id as string,
    category: row.category as string,
    name: row.name as string,
    unit: row.unit as string,
    quantity: n(row.quantity),
    costPrice: n(row.cost_price),
    sellPrice: n(row.sell_price),
  };
}

class SupabaseEstimateRepository implements EstimateRepository {
  async save(estimate: Estimate): Promise<Estimate> {
    const supabase = getSupabaseClient();

    const { error: upsertError } = await supabase.from("estimates").upsert({
      id: estimate.id,
      estimate_number: estimate.estimateNumber,
      customer_id: estimate.customerId,
      project_id: estimate.projectId,
      title: estimate.title,
      issue_date: estimate.issueDate,
      tax_rate: estimate.taxRate,
      overhead_fee: estimate.overheadFee ?? 0,
      adjusted_price: estimate.adjustedPrice ?? null,
      status: estimate.status,
      created_at: estimate.createdAt,
    });
    if (upsertError) throw upsertError;

    // 明細は全削除→再挿入で置き換える（部分更新の複雑さを避けるため）。
    const { error: deleteError } = await supabase.from("estimate_lines").delete().eq("estimate_id", estimate.id);
    if (deleteError) throw deleteError;

    if (estimate.lines.length > 0) {
      const { error: insertError } = await supabase.from("estimate_lines").insert(
        estimate.lines.map((line, index) => ({
          id: line.id,
          estimate_id: estimate.id,
          price_item_id: line.priceItemId,
          category: line.category,
          name: line.name,
          unit: line.unit,
          quantity: line.quantity,
          cost_price: line.costPrice,
          sell_price: line.sellPrice,
          sort_order: index,
        }))
      );
      if (insertError) throw insertError;
    }

    return estimate;
  }

  async list(): Promise<Estimate[]> {
    const { data, error } = await getSupabaseClient()
      .from("estimates")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return this.hydrate(data ?? []);
  }

  async getById(id: string): Promise<Estimate | null> {
    const { data, error } = await getSupabaseClient().from("estimates").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    if (!data) return null;
    const [estimate] = await this.hydrate([data]);
    return estimate ?? null;
  }

  async listByProject(projectId: string): Promise<Estimate[]> {
    const { data, error } = await getSupabaseClient()
      .from("estimates")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at");
    if (error) throw error;
    return this.hydrate(data ?? []);
  }

  private async hydrate(estimateRows: Record<string, unknown>[]): Promise<Estimate[]> {
    if (estimateRows.length === 0) return [];
    const ids = estimateRows.map((r) => r.id as string);
    const { data: lineRows, error } = await getSupabaseClient()
      .from("estimate_lines")
      .select("*")
      .in("estimate_id", ids)
      .order("sort_order");
    if (error) throw error;

    const linesByEstimate = new Map<string, EstimateLine[]>();
    for (const row of lineRows ?? []) {
      const estimateId = row.estimate_id as string;
      const list = linesByEstimate.get(estimateId) ?? [];
      list.push(mapEstimateLine(row));
      linesByEstimate.set(estimateId, list);
    }

    return estimateRows.map((row) => ({
      id: row.id as string,
      estimateNumber: row.estimate_number as string,
      customerId: row.customer_id as string,
      projectId: row.project_id as string,
      title: row.title as string,
      issueDate: row.issue_date as string,
      lines: linesByEstimate.get(row.id as string) ?? [],
      taxRate: n(row.tax_rate),
      overheadFee: n(row.overhead_fee),
      adjustedPrice: row.adjusted_price != null ? n(row.adjusted_price) : undefined,
      status: row.status as Estimate["status"],
      createdAt: row.created_at as string,
    }));
  }
}

// ---------- Craftsman ----------

function mapCraftsman(row: Record<string, unknown>): Craftsman {
  return {
    id: row.id as string,
    name: row.name as string,
    specialty: row.specialty as string,
    phone: (row.phone as string) ?? undefined,
    note: (row.note as string) ?? undefined,
    createdAt: row.created_at as string,
  };
}

class SupabaseCraftsmanRepository implements CraftsmanRepository {
  async list(): Promise<Craftsman[]> {
    const { data, error } = await getSupabaseClient().from("craftsmen").select("*").order("created_at");
    if (error) throw error;
    return (data ?? []).map(mapCraftsman);
  }
  async create(input: NewCraftsmanInput): Promise<Craftsman> {
    const { data, error } = await getSupabaseClient()
      .from("craftsmen")
      .insert({ name: input.name, specialty: input.specialty, phone: input.phone, note: input.note })
      .select()
      .single();
    if (error) throw error;
    return mapCraftsman(data);
  }
  async update(input: UpdateCraftsmanInput): Promise<Craftsman> {
    const { data, error } = await getSupabaseClient()
      .from("craftsmen")
      .update({ name: input.name, specialty: input.specialty, phone: input.phone, note: input.note })
      .eq("id", input.id)
      .select()
      .single();
    if (error) throw error;
    return mapCraftsman(data);
  }
  async remove(id: string): Promise<void> {
    const { error } = await getSupabaseClient().from("craftsmen").delete().eq("id", id);
    if (error) throw error;
  }
}

// ---------- Supplier ----------

function mapSupplier(row: Record<string, unknown>): Supplier {
  return {
    id: row.id as string,
    name: row.name as string,
    contactPerson: (row.contact_person as string) ?? undefined,
    phone: (row.phone as string) ?? undefined,
    note: (row.note as string) ?? undefined,
    createdAt: row.created_at as string,
  };
}

class SupabaseSupplierRepository implements SupplierRepository {
  async list(): Promise<Supplier[]> {
    const { data, error } = await getSupabaseClient().from("suppliers").select("*").order("created_at");
    if (error) throw error;
    return (data ?? []).map(mapSupplier);
  }
  async create(input: NewSupplierInput): Promise<Supplier> {
    const { data, error } = await getSupabaseClient()
      .from("suppliers")
      .insert({ name: input.name, contact_person: input.contactPerson, phone: input.phone, note: input.note })
      .select()
      .single();
    if (error) throw error;
    return mapSupplier(data);
  }
  async update(input: UpdateSupplierInput): Promise<Supplier> {
    const { data, error } = await getSupabaseClient()
      .from("suppliers")
      .update({ name: input.name, contact_person: input.contactPerson, phone: input.phone, note: input.note })
      .eq("id", input.id)
      .select()
      .single();
    if (error) throw error;
    return mapSupplier(data);
  }
  async remove(id: string): Promise<void> {
    const { error } = await getSupabaseClient().from("suppliers").delete().eq("id", id);
    if (error) throw error;
  }
}

// ---------- ProcessTask ----------

function mapProcessTask(row: Record<string, unknown>): ProcessTask {
  return {
    id: row.id as string,
    projectId: row.project_id as string,
    title: row.title as string,
    craftsmanId: (row.craftsman_id as string) ?? null,
    startDate: row.start_date as string,
    endDate: row.end_date as string,
    status: row.status as ProcessTask["status"],
    note: (row.note as string) ?? undefined,
  };
}

class SupabaseProcessTaskRepository implements ProcessTaskRepository {
  async list(): Promise<ProcessTask[]> {
    const { data, error } = await getSupabaseClient().from("process_tasks").select("*").order("start_date");
    if (error) throw error;
    return (data ?? []).map(mapProcessTask);
  }
  async listByProject(projectId: string): Promise<ProcessTask[]> {
    const { data, error } = await getSupabaseClient()
      .from("process_tasks")
      .select("*")
      .eq("project_id", projectId)
      .order("start_date");
    if (error) throw error;
    return (data ?? []).map(mapProcessTask);
  }
  async create(input: NewProcessTaskInput): Promise<ProcessTask> {
    const { data, error } = await getSupabaseClient()
      .from("process_tasks")
      .insert({
        project_id: input.projectId,
        title: input.title,
        craftsman_id: input.craftsmanId,
        start_date: input.startDate,
        end_date: input.endDate,
        status: input.status,
        note: input.note,
      })
      .select()
      .single();
    if (error) throw error;
    return mapProcessTask(data);
  }
  async update(input: UpdateProcessTaskInput): Promise<ProcessTask> {
    const { data, error } = await getSupabaseClient()
      .from("process_tasks")
      .update({
        title: input.title,
        craftsman_id: input.craftsmanId,
        start_date: input.startDate,
        end_date: input.endDate,
        status: input.status,
        note: input.note,
      })
      .eq("id", input.id)
      .select()
      .single();
    if (error) throw error;
    return mapProcessTask(data);
  }
  async remove(id: string): Promise<void> {
    const { error } = await getSupabaseClient().from("process_tasks").delete().eq("id", id);
    if (error) throw error;
  }
}

// ---------- PurchaseOrder ----------

function mapPurchaseOrder(row: Record<string, unknown>): PurchaseOrder {
  return {
    id: row.id as string,
    projectId: row.project_id as string,
    supplierId: row.supplier_id as string,
    title: row.title as string,
    amount: n(row.amount),
    orderDate: row.order_date as string,
    status: row.status as PurchaseOrder["status"],
    note: (row.note as string) ?? undefined,
  };
}

class SupabasePurchaseOrderRepository implements PurchaseOrderRepository {
  async listByProject(projectId: string): Promise<PurchaseOrder[]> {
    const { data, error } = await getSupabaseClient()
      .from("purchase_orders")
      .select("*")
      .eq("project_id", projectId)
      .order("order_date");
    if (error) throw error;
    return (data ?? []).map(mapPurchaseOrder);
  }
  async create(input: NewPurchaseOrderInput): Promise<PurchaseOrder> {
    const { data, error } = await getSupabaseClient()
      .from("purchase_orders")
      .insert({
        project_id: input.projectId,
        supplier_id: input.supplierId,
        title: input.title,
        amount: input.amount,
        order_date: input.orderDate,
        status: input.status,
        note: input.note,
      })
      .select()
      .single();
    if (error) throw error;
    return mapPurchaseOrder(data);
  }
  async update(input: UpdatePurchaseOrderInput): Promise<PurchaseOrder> {
    const { data, error } = await getSupabaseClient()
      .from("purchase_orders")
      .update({
        supplier_id: input.supplierId,
        title: input.title,
        amount: input.amount,
        order_date: input.orderDate,
        status: input.status,
        note: input.note,
      })
      .eq("id", input.id)
      .select()
      .single();
    if (error) throw error;
    return mapPurchaseOrder(data);
  }
  async remove(id: string): Promise<void> {
    const { error } = await getSupabaseClient().from("purchase_orders").delete().eq("id", id);
    if (error) throw error;
  }
}

// ---------- Invoice ----------

function mapInvoice(row: Record<string, unknown>): Invoice {
  return {
    id: row.id as string,
    invoiceNumber: row.invoice_number as string,
    projectId: row.project_id as string,
    customerId: row.customer_id as string,
    title: row.title as string,
    issueDate: row.issue_date as string,
    amount: n(row.amount),
    status: row.status as Invoice["status"],
    createdAt: row.created_at as string,
  };
}

class SupabaseInvoiceRepository implements InvoiceRepository {
  async list(): Promise<Invoice[]> {
    const { data, error } = await getSupabaseClient().from("invoices").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map(mapInvoice);
  }
  async listByProject(projectId: string): Promise<Invoice[]> {
    const { data, error } = await getSupabaseClient()
      .from("invoices")
      .select("*")
      .eq("project_id", projectId)
      .order("issue_date");
    if (error) throw error;
    return (data ?? []).map(mapInvoice);
  }
  async getById(id: string): Promise<Invoice | null> {
    const { data, error } = await getSupabaseClient().from("invoices").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    return data ? mapInvoice(data) : null;
  }
  async create(input: NewInvoiceInput): Promise<Invoice> {
    const { data, error } = await getSupabaseClient()
      .from("invoices")
      .insert({
        invoice_number: generateDocumentNumber("INV"),
        project_id: input.projectId,
        customer_id: input.customerId,
        title: input.title,
        issue_date: input.issueDate,
        amount: input.amount,
        status: "unpaid",
      })
      .select()
      .single();
    if (error) throw error;
    return mapInvoice(data);
  }
}

// ---------- Payment ----------

function mapPayment(row: Record<string, unknown>): Payment {
  return {
    id: row.id as string,
    invoiceId: row.invoice_id as string,
    amount: n(row.amount),
    paidDate: row.paid_date as string,
    note: (row.note as string) ?? undefined,
  };
}

// 入金記録の合計額と請求金額を比べて、請求書のstatusを算出し直す。
// Supabaseにはトリガーを設定していないため、アプリ側でこのタイミングに計算する。
async function recomputeInvoiceStatus(invoiceId: string): Promise<void> {
  const supabase = getSupabaseClient();
  const [{ data: invoice, error: invoiceError }, { data: payments, error: paymentsError }] = await Promise.all([
    supabase.from("invoices").select("amount").eq("id", invoiceId).maybeSingle(),
    supabase.from("payments").select("amount").eq("invoice_id", invoiceId),
  ]);
  if (invoiceError) throw invoiceError;
  if (paymentsError) throw paymentsError;
  if (!invoice) return;

  const paidTotal = (payments ?? []).reduce((sum, p) => sum + n(p.amount), 0);
  const amount = n(invoice.amount);
  const status = paidTotal <= 0 ? "unpaid" : paidTotal < amount ? "partially_paid" : "paid";

  const { error: updateError } = await supabase.from("invoices").update({ status }).eq("id", invoiceId);
  if (updateError) throw updateError;
}

class SupabasePaymentRepository implements PaymentRepository {
  async list(): Promise<Payment[]> {
    const { data, error } = await getSupabaseClient().from("payments").select("*").order("paid_date");
    if (error) throw error;
    return (data ?? []).map(mapPayment);
  }
  async listByInvoice(invoiceId: string): Promise<Payment[]> {
    const { data, error } = await getSupabaseClient()
      .from("payments")
      .select("*")
      .eq("invoice_id", invoiceId)
      .order("paid_date");
    if (error) throw error;
    return (data ?? []).map(mapPayment);
  }
  async create(input: NewPaymentInput): Promise<Payment> {
    const { data, error } = await getSupabaseClient()
      .from("payments")
      .insert({ invoice_id: input.invoiceId, amount: input.amount, paid_date: input.paidDate, note: input.note })
      .select()
      .single();
    if (error) throw error;
    await recomputeInvoiceStatus(input.invoiceId);
    return mapPayment(data);
  }
  async remove(id: string): Promise<void> {
    const { data: payment, error: fetchError } = await getSupabaseClient()
      .from("payments")
      .select("invoice_id")
      .eq("id", id)
      .maybeSingle();
    if (fetchError) throw fetchError;
    const { error } = await getSupabaseClient().from("payments").delete().eq("id", id);
    if (error) throw error;
    if (payment) {
      await recomputeInvoiceStatus(payment.invoice_id as string);
    }
  }
}

// ---------- Property ----------

function mapProperty(row: Record<string, unknown>): Property {
  return {
    id: row.id as string,
    name: row.name as string,
    type: row.type as Property["type"],
    address: row.address as string,
    price: n(row.price),
    status: row.status as Property["status"],
    note: (row.note as string) ?? undefined,
    createdAt: row.created_at as string,
  };
}

class SupabasePropertyRepository implements PropertyRepository {
  async list(): Promise<Property[]> {
    const { data, error } = await getSupabaseClient().from("properties").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map(mapProperty);
  }
  async getById(id: string): Promise<Property | null> {
    const { data, error } = await getSupabaseClient().from("properties").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    return data ? mapProperty(data) : null;
  }
  async create(input: NewPropertyInput): Promise<Property> {
    const { data, error } = await getSupabaseClient()
      .from("properties")
      .insert({
        name: input.name,
        type: input.type,
        address: input.address,
        price: input.price,
        status: input.status,
        note: input.note,
      })
      .select()
      .single();
    if (error) throw error;
    return mapProperty(data);
  }
  async update(input: UpdatePropertyInput): Promise<Property> {
    const { data, error } = await getSupabaseClient()
      .from("properties")
      .update({
        name: input.name,
        type: input.type,
        address: input.address,
        price: input.price,
        status: input.status,
        note: input.note,
      })
      .eq("id", input.id)
      .select()
      .single();
    if (error) throw error;
    return mapProperty(data);
  }
}

// ---------- BrokerageDeal ----------

function mapBrokerageDeal(row: Record<string, unknown>): BrokerageDeal {
  return {
    id: row.id as string,
    propertyId: row.property_id as string,
    sellerCustomerId: row.seller_customer_id as string,
    buyerCustomerId: (row.buyer_customer_id as string) ?? null,
    contractDate: (row.contract_date as string) ?? null,
    settlementDate: (row.settlement_date as string) ?? null,
    commissionAmount: n(row.commission_amount),
    loanUsed: Boolean(row.loan_used),
    status: row.status as BrokerageDeal["status"],
    createdAt: row.created_at as string,
  };
}

class SupabaseBrokerageDealRepository implements BrokerageDealRepository {
  async list(): Promise<BrokerageDeal[]> {
    const { data, error } = await getSupabaseClient()
      .from("brokerage_deals")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map(mapBrokerageDeal);
  }
  async create(input: NewBrokerageDealInput): Promise<BrokerageDeal> {
    const { data, error } = await getSupabaseClient()
      .from("brokerage_deals")
      .insert({
        property_id: input.propertyId,
        seller_customer_id: input.sellerCustomerId,
        buyer_customer_id: input.buyerCustomerId,
        contract_date: input.contractDate,
        settlement_date: input.settlementDate,
        commission_amount: input.commissionAmount,
        loan_used: input.loanUsed,
        status: input.status,
      })
      .select()
      .single();
    if (error) throw error;
    return mapBrokerageDeal(data);
  }
  async update(input: UpdateBrokerageDealInput): Promise<BrokerageDeal> {
    const { data, error } = await getSupabaseClient()
      .from("brokerage_deals")
      .update({
        property_id: input.propertyId,
        seller_customer_id: input.sellerCustomerId,
        buyer_customer_id: input.buyerCustomerId,
        contract_date: input.contractDate,
        settlement_date: input.settlementDate,
        commission_amount: input.commissionAmount,
        loan_used: input.loanUsed,
        status: input.status,
      })
      .eq("id", input.id)
      .select()
      .single();
    if (error) throw error;
    return mapBrokerageDeal(data);
  }
}

// ---------- ResaleProject ----------

function mapResaleProject(row: Record<string, unknown>): ResaleProject {
  return {
    id: row.id as string,
    kind: row.kind as ResaleProject["kind"],
    propertyId: row.property_id as string,
    acquisitionCost: n(row.acquisition_cost),
    workBudget: n(row.work_budget),
    workActualCost: n(row.work_actual_cost),
    targetSellPrice: n(row.target_sell_price),
    actualSellPrice: row.actual_sell_price === null ? null : n(row.actual_sell_price),
    status: row.status as ResaleProject["status"],
    createdAt: row.created_at as string,
  };
}

class SupabaseResaleProjectRepository implements ResaleProjectRepository {
  async list(): Promise<ResaleProject[]> {
    const { data, error } = await getSupabaseClient()
      .from("resale_projects")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map(mapResaleProject);
  }
  async create(input: NewResaleProjectInput): Promise<ResaleProject> {
    const { data, error } = await getSupabaseClient()
      .from("resale_projects")
      .insert({
        kind: input.kind,
        property_id: input.propertyId,
        acquisition_cost: input.acquisitionCost,
        work_budget: input.workBudget,
        work_actual_cost: input.workActualCost,
        target_sell_price: input.targetSellPrice,
        actual_sell_price: input.actualSellPrice,
        status: input.status,
      })
      .select()
      .single();
    if (error) throw error;
    return mapResaleProject(data);
  }
  async update(input: UpdateResaleProjectInput): Promise<ResaleProject> {
    const { data, error } = await getSupabaseClient()
      .from("resale_projects")
      .update({
        kind: input.kind,
        property_id: input.propertyId,
        acquisition_cost: input.acquisitionCost,
        work_budget: input.workBudget,
        work_actual_cost: input.workActualCost,
        target_sell_price: input.targetSellPrice,
        actual_sell_price: input.actualSellPrice,
        status: input.status,
      })
      .eq("id", input.id)
      .select()
      .single();
    if (error) throw error;
    return mapResaleProject(data);
  }
}

export const customerRepository: CustomerRepository = new SupabaseCustomerRepository();
export const referrerRepository: ReferrerRepository = new SupabaseReferrerRepository();
export const priceMasterRepository: PriceMasterRepository = new SupabasePriceMasterRepository();
export const projectRepository: ProjectRepository = new SupabaseProjectRepository();
export const estimateRepository: EstimateRepository = new SupabaseEstimateRepository();
export const craftsmanRepository: CraftsmanRepository = new SupabaseCraftsmanRepository();
export const supplierRepository: SupplierRepository = new SupabaseSupplierRepository();
export const processTaskRepository: ProcessTaskRepository = new SupabaseProcessTaskRepository();
export const purchaseOrderRepository: PurchaseOrderRepository = new SupabasePurchaseOrderRepository();
export const invoiceRepository: InvoiceRepository = new SupabaseInvoiceRepository();
export const paymentRepository: PaymentRepository = new SupabasePaymentRepository();
export const propertyRepository: PropertyRepository = new SupabasePropertyRepository();
export const brokerageDealRepository: BrokerageDealRepository = new SupabaseBrokerageDealRepository();
export const resaleProjectRepository: ResaleProjectRepository = new SupabaseResaleProjectRepository();
