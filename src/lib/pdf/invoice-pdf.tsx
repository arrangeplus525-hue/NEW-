import path from "path";
import { Document, Page, Text, View, StyleSheet, Font, renderToBuffer } from "@react-pdf/renderer";

Font.register({
  family: "NotoSansJP",
  fonts: [
    { src: path.join(process.cwd(), "src/assets/fonts/NotoSansJP-Regular.woff"), fontWeight: "normal" },
    { src: path.join(process.cwd(), "src/assets/fonts/NotoSansJP-Bold.woff"), fontWeight: "bold" },
  ],
});

export interface InvoicePdfData {
  companyName: string;
  invoiceNumber: string;
  issueDateLabel: string;
  customerName: string;
  customerAddress?: string;
  title: string;
  amount: number;
}

const styles = StyleSheet.create({
  page: {
    fontFamily: "NotoSansJP",
    fontSize: 10,
    padding: 40,
    color: "#1a1a1a",
  },
  heading: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    letterSpacing: 4,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  customerBlock: { fontSize: 12 },
  customerName: { fontSize: 14, fontWeight: "bold", marginBottom: 4 },
  metaBlock: { fontSize: 9, textAlign: "right" },
  titleRow: { marginBottom: 16, fontSize: 12 },
  totalBox: {
    borderWidth: 1,
    borderColor: "#333",
    padding: 10,
    marginTop: 30,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  totalLabel: { fontSize: 12 },
  totalValue: { fontSize: 18, fontWeight: "bold" },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    fontSize: 8,
    color: "#666",
    textAlign: "center",
  },
});

function formatYen(amount: number): string {
  return `¥${Math.round(amount).toLocaleString("ja-JP")}`;
}

export function InvoiceDocument({ data }: { data: InvoicePdfData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.heading}>御請求書</Text>

        <View style={styles.metaRow}>
          <View style={styles.customerBlock}>
            <Text style={styles.customerName}>{data.customerName} 様</Text>
            {data.customerAddress ? <Text>{data.customerAddress}</Text> : null}
          </View>
          <View style={styles.metaBlock}>
            <Text>請求番号: {data.invoiceNumber}</Text>
            <Text>発行日: {data.issueDateLabel}</Text>
            <Text style={{ marginTop: 8, fontWeight: "bold" }}>{data.companyName}</Text>
          </View>
        </View>

        <View style={styles.titleRow}>
          <Text>件名: {data.title}</Text>
        </View>

        <View style={styles.totalBox}>
          <Text style={styles.totalLabel}>御請求金額（税込）</Text>
          <Text style={styles.totalValue}>{formatYen(data.amount)}</Text>
        </View>

        <Text style={styles.footer}>お振込手数料はお客様のご負担にてお願いいたします。</Text>
      </Page>
    </Document>
  );
}

export async function renderInvoicePdf(data: InvoicePdfData): Promise<Buffer> {
  return renderToBuffer(<InvoiceDocument data={data} />);
}
