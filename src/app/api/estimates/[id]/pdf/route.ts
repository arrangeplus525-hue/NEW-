import { customerRepository, estimateRepository } from "@/repositories";
import { renderEstimatePdf } from "@/lib/pdf/estimate-pdf";
import { calcEstimateSummary, calcLineTotals } from "@/lib/calculations/estimate-calculations";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const estimates = await estimateRepository.list();
  const estimate = estimates.find((e) => e.id === id);
  if (!estimate) {
    return new Response("見積が見つかりません", { status: 404 });
  }

  const customer = await customerRepository.getById(estimate.customerId);
  if (!customer) {
    return new Response("顧客が見つかりません", { status: 404 });
  }

  const summary = calcEstimateSummary(estimate.lines, estimate.taxRate);

  // 顧客向けPDFには売価のみを載せる。原価・利益率は社内情報のため出力しない。
  const pdfBuffer = await renderEstimatePdf({
    companyName: "株式会社サンプルリフォーム",
    estimateNumber: estimate.estimateNumber,
    issueDateLabel: new Date(estimate.issueDate).toLocaleDateString("ja-JP"),
    customerName: customer.name,
    customerAddress: customer.address,
    title: estimate.title,
    lines: estimate.lines.map((line) => {
      const totals = calcLineTotals(line);
      return {
        category: line.category,
        name: line.name,
        unit: line.unit,
        quantity: line.quantity,
        sellPrice: line.sellPrice,
        lineTotal: totals.sellTotal,
      };
    }),
    subtotalSell: summary.subtotalSell,
    taxAmount: summary.taxAmount,
    totalAmount: summary.totalAmount,
  });

  return new Response(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="estimate-${estimate.estimateNumber}.pdf"`,
    },
  });
}
