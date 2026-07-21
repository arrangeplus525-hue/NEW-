import { notFound } from "next/navigation";
import {
  craftsmanRepository,
  customerRepository,
  estimateRepository,
  invoiceRepository,
  paymentRepository,
  processTaskRepository,
  projectRepository,
  purchaseOrderRepository,
  referrerRepository,
  supplierRepository,
} from "@/repositories";
import { calcEstimateSummary } from "@/lib/calculations/estimate-calculations";
import { ProjectDetail } from "./ProjectDetail";

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const project = await projectRepository.getById(id);
  if (!project) {
    notFound();
  }

  const [customer, estimates, craftsmen, suppliers, processTasks, purchaseOrders, invoices] = await Promise.all([
    customerRepository.getById(project.customerId),
    estimateRepository.listByProject(id),
    craftsmanRepository.list(),
    supplierRepository.list(),
    processTaskRepository.listByProject(id),
    purchaseOrderRepository.listByProject(id),
    invoiceRepository.listByProject(id),
  ]);

  const estimateSummaries = estimates.map((estimate) => ({
    estimate,
    summary: calcEstimateSummary(estimate.lines, estimate.taxRate),
  }));

  const paymentsByInvoiceEntries = await Promise.all(
    invoices.map(async (invoice) => [invoice.id, await paymentRepository.listByInvoice(invoice.id)] as const)
  );
  const paymentsByInvoice = Object.fromEntries(paymentsByInvoiceEntries);

  const referrer = customer?.referrerId
    ? (await referrerRepository.list()).find((r) => r.id === customer.referrerId) ?? null
    : null;

  const estimateRevenueTotal = estimateSummaries.reduce((sum, e) => sum + e.summary.subtotalSell, 0);
  const estimateCostTotal = estimateSummaries.reduce((sum, e) => sum + e.summary.subtotalCost, 0);
  const actualCostTotal = purchaseOrders.reduce((sum, o) => sum + o.amount, 0);

  return (
    <ProjectDetail
      project={project}
      customer={customer}
      referrer={referrer}
      estimateSummaries={estimateSummaries}
      craftsmen={craftsmen}
      suppliers={suppliers}
      initialProcessTasks={processTasks}
      initialPurchaseOrders={purchaseOrders}
      initialInvoices={invoices}
      initialPaymentsByInvoice={paymentsByInvoice}
      profitAnalysis={{ estimateRevenueTotal, estimateCostTotal, actualCostTotal }}
    />
  );
}
