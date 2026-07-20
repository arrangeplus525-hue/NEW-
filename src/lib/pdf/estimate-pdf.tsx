import path from "path";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  renderToBuffer,
} from "@react-pdf/renderer";

Font.register({
  family: "NotoSansJP",
  fonts: [
    { src: path.join(process.cwd(), "src/assets/fonts/NotoSansJP-Regular.woff"), fontWeight: "normal" },
    { src: path.join(process.cwd(), "src/assets/fonts/NotoSansJP-Bold.woff"), fontWeight: "bold" },
  ],
});

// 顧客に渡すPDFには売価情報だけを載せる。原価・利益率は社内情報のため含めない。
export interface EstimatePdfLine {
  category: string;
  name: string;
  unit: string;
  quantity: number;
  sellPrice: number;
  lineTotal: number;
}

export interface EstimatePdfData {
  companyName: string;
  estimateNumber: string;
  issueDateLabel: string;
  customerName: string;
  customerAddress?: string;
  title: string;
  lines: EstimatePdfLine[];
  subtotalSell: number;
  taxAmount: number;
  totalAmount: number;
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
  customerBlock: {
    fontSize: 12,
  },
  customerName: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 4,
  },
  metaBlock: {
    fontSize: 9,
    textAlign: "right",
  },
  titleRow: {
    marginBottom: 16,
    fontSize: 12,
  },
  totalBox: {
    borderWidth: 1,
    borderColor: "#333",
    padding: 10,
    marginBottom: 20,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  totalLabel: {
    fontSize: 12,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: "bold",
  },
  table: {
    width: "100%",
  },
  tableHeaderRow: {
    flexDirection: "row",
    backgroundColor: "#f0f0f0",
    borderBottomWidth: 1,
    borderColor: "#333",
    paddingVertical: 6,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: "#ddd",
    paddingVertical: 6,
  },
  colCategory: { width: "15%" },
  colName: { width: "35%" },
  colUnit: { width: "10%", textAlign: "center" },
  colQty: { width: "10%", textAlign: "right" },
  colPrice: { width: "15%", textAlign: "right" },
  colLineTotal: { width: "15%", textAlign: "right" },
  summarySection: {
    marginTop: 16,
    alignItems: "flex-end",
  },
  summaryRow: {
    flexDirection: "row",
    width: 220,
    justifyContent: "space-between",
    paddingVertical: 3,
  },
  summaryRowFinal: {
    flexDirection: "row",
    width: 220,
    justifyContent: "space-between",
    paddingVertical: 5,
    borderTopWidth: 1,
    borderColor: "#333",
    marginTop: 3,
  },
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

export function EstimateDocument({ data }: { data: EstimatePdfData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.heading}>御見積書</Text>

        <View style={styles.metaRow}>
          <View style={styles.customerBlock}>
            <Text style={styles.customerName}>{data.customerName} 様</Text>
            {data.customerAddress ? <Text>{data.customerAddress}</Text> : null}
          </View>
          <View style={styles.metaBlock}>
            <Text>見積番号: {data.estimateNumber}</Text>
            <Text>発行日: {data.issueDateLabel}</Text>
            <Text style={{ marginTop: 8, fontWeight: "bold" }}>{data.companyName}</Text>
          </View>
        </View>

        <View style={styles.titleRow}>
          <Text>件名: {data.title}</Text>
        </View>

        <View style={styles.totalBox}>
          <Text style={styles.totalLabel}>御見積金額（税込）</Text>
          <Text style={styles.totalValue}>{formatYen(data.totalAmount)}</Text>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <Text style={styles.colCategory}>分類</Text>
            <Text style={styles.colName}>項目</Text>
            <Text style={styles.colUnit}>単位</Text>
            <Text style={styles.colQty}>数量</Text>
            <Text style={styles.colPrice}>単価</Text>
            <Text style={styles.colLineTotal}>金額</Text>
          </View>
          {data.lines.map((line, i) => (
            <View style={styles.tableRow} key={i}>
              <Text style={styles.colCategory}>{line.category}</Text>
              <Text style={styles.colName}>{line.name}</Text>
              <Text style={styles.colUnit}>{line.unit}</Text>
              <Text style={styles.colQty}>{line.quantity}</Text>
              <Text style={styles.colPrice}>{formatYen(line.sellPrice)}</Text>
              <Text style={styles.colLineTotal}>{formatYen(line.lineTotal)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.summarySection}>
          <View style={styles.summaryRow}>
            <Text>小計</Text>
            <Text>{formatYen(data.subtotalSell)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text>消費税</Text>
            <Text>{formatYen(data.taxAmount)}</Text>
          </View>
          <View style={styles.summaryRowFinal}>
            <Text style={{ fontWeight: "bold" }}>合計</Text>
            <Text style={{ fontWeight: "bold" }}>{formatYen(data.totalAmount)}</Text>
          </View>
        </View>

        <Text style={styles.footer}>
          本見積書の有効期限は発行日より30日間です。ご不明点はお気軽にお問い合わせください。
        </Text>
      </Page>
    </Document>
  );
}

export async function renderEstimatePdf(data: EstimatePdfData): Promise<Buffer> {
  return renderToBuffer(<EstimateDocument data={data} />);
}
