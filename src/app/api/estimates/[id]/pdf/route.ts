import { customerRepository, estimateRepository, projectRepository } from "@/repositories";
import { renderEstimatePdf } from "@/lib/pdf/estimate-pdf";
import { calcLineTotals } from "@/lib/calculations/estimate-calculations";
import { COMPANY_INFO } from "@/domain/company";

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

  const project = await projectRepository.getById(estimate.projectId);

  // PDF表紙専用の計算：小計①（各行の売価合計）→ 諸経費②を加算 → 調整後価格（手入力、未入力なら①+②）
  // → 値引き（①+②の合計－調整後価格）→ 消費税は調整後価格に課税。
  // 既存のcalcEstimateSummary（社内向けサマリー・利益計算）はこのPDF専用ロジックとは独立しており、変更していない。
  const lines = estimate.lines.map((line) => {
    const totals = calcLineTotals(line);
    return {
      category: line.category,
      name: line.name,
      unit: line.unit,
      quantity: line.quantity,
      sellPrice: line.sellPrice,
      lineTotal: totals.sellTotal,
    };
  });
  const subtotalSell = lines.reduce((sum, l) => sum + l.lineTotal, 0);
  const overheadFee = estimate.overheadFee ?? 0;
  const combinedTotal = subtotalSell + overheadFee;
  const adjustedPrice = estimate.adjustedPrice ?? combinedTotal;
  const discount = combinedTotal - adjustedPrice;
  const taxAmount = Math.round(adjustedPrice * estimate.taxRate);
  const totalAmount = adjustedPrice + taxAmount;

  // 顧客向けPDFには売価のみを載せる。原価・利益率は社内情報のため出力しない。
  const pdfBuffer = await renderEstimatePdf({
    company: COMPANY_INFO,
    estimateNumber: estimate.estimateNumber,
    issueDateLabel: new Date(estimate.issueDate).toLocaleDateString("ja-JP"),
    customerName: customer.name,
    siteName: project?.title ?? estimate.title,
    siteAddress: project?.siteAddress,
    title: estimate.title,
    lines,
    subtotalSell,
    overheadFee,
    adjustedPrice,
    discount,
    taxAmount,
    totalAmount,
  });

  return new Response(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      // "attachment"だとスマホのブラウザで新しいタブが何も表示されず開けないことがあるため、
      // ブラウザ内でそのまま表示させる"inline"にする。
      "Content-Disposition": `inline; filename="estimate-${estimate.estimateNumber}.pdf"`,
    },
  });
}
