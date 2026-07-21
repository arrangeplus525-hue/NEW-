import { customerRepository, invoiceRepository } from "@/repositories";
import { renderInvoicePdf } from "@/lib/pdf/invoice-pdf";
import { COMPANY_INFO } from "@/domain/company";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const invoice = await invoiceRepository.getById(id);
  if (!invoice) {
    return new Response("請求書が見つかりません", { status: 404 });
  }

  const customer = await customerRepository.getById(invoice.customerId);
  if (!customer) {
    return new Response("顧客が見つかりません", { status: 404 });
  }

  const pdfBuffer = await renderInvoicePdf({
    companyName: COMPANY_INFO.name,
    invoiceNumber: invoice.invoiceNumber,
    issueDateLabel: new Date(invoice.issueDate).toLocaleDateString("ja-JP"),
    customerName: customer.name,
    customerAddress: customer.address,
    title: invoice.title,
    amount: invoice.amount,
  });

  return new Response(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="invoice-${invoice.invoiceNumber}.pdf"`,
    },
  });
}
