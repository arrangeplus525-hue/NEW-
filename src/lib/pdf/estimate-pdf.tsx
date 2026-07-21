import path from "path";
import {
  Document,
  Page,
  Text,
  View,
  Image,
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

const LOGO_PATH = path.join(process.cwd(), "src/assets/images/company-logo.jpeg");
const SEAL_PATH = path.join(process.cwd(), "src/assets/images/company-seal.jpeg");

// 顧客に渡すPDFには売価情報だけを載せる。原価・利益率は社内情報のため含めない。
export interface EstimatePdfLine {
  category: string;
  name: string;
  unit: string;
  quantity: number;
  sellPrice: number;
  lineTotal: number;
}

export interface EstimatePdfCompany {
  name: string;
  postalCode: string;
  address: string;
  tel: string;
  fax: string;
  email: string;
  invoiceRegistrationNumber: string;
}

export interface EstimatePdfData {
  company: EstimatePdfCompany;
  estimateNumber: string;
  issueDateLabel: string;
  customerName: string;
  siteName: string;
  siteAddress?: string;
  title: string;
  lines: EstimatePdfLine[];
  subtotalSell: number; // 小計①
  overheadFee: number; // 諸経費②
  adjustedPrice: number; // 調整後価格
  discount: number; // 値引き（①+②の合計 − 調整後価格）
  taxAmount: number;
  totalAmount: number;
}

const PINK = "#f6d5da";

const styles = StyleSheet.create({
  page: {
    fontFamily: "NotoSansJP",
    fontSize: 9,
    padding: 24,
    color: "#1a1a1a",
  },
  pageNumber: {
    position: "absolute",
    top: 16,
    right: 24,
    fontSize: 9,
  },
  titleBand: {
    backgroundColor: PINK,
    borderWidth: 1,
    borderColor: "#333",
    marginHorizontal: 160,
    marginBottom: 6,
    paddingVertical: 5,
  },
  titleText: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    letterSpacing: 6,
  },
  dateRow: {
    textAlign: "right",
    fontSize: 9,
    marginBottom: 4,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  leftCol: {
    width: "58%",
  },
  companyBox: {
    width: "40%",
    fontSize: 8,
    lineHeight: 1.5,
  },
  companyHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  companyLogo: {
    width: 28,
    height: 24,
    marginRight: 6,
  },
  companyName: {
    fontSize: 11,
    fontWeight: "bold",
  },
  companySealRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  companySeal: {
    width: 52,
    height: 50,
  },
  customerLine: {
    fontSize: 13,
    fontWeight: "bold",
    marginBottom: 4,
    borderBottomWidth: 1,
    borderColor: "#333",
    paddingBottom: 2,
  },
  greetingBox: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#666",
    padding: 6,
    fontSize: 7.5,
    lineHeight: 1.35,
  },
  siteInfo: {
    marginTop: 5,
    marginBottom: 5,
    fontSize: 9,
  },
  siteInfoLine: {
    marginBottom: 2,
  },
  amountBox: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  amountLabel: {
    fontSize: 11,
    fontWeight: "bold",
    marginRight: 12,
  },
  amountValue: {
    fontSize: 20,
    fontWeight: "bold",
  },
  amountTaxNote: {
    fontSize: 8,
    marginLeft: 12,
  },
  table: {
    width: "100%",
    marginBottom: 6,
  },
  tableHeaderRow: {
    flexDirection: "row",
    backgroundColor: PINK,
    borderWidth: 1,
    borderColor: "#333",
    paddingVertical: 3,
  },
  tableRow: {
    flexDirection: "row",
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#333",
    paddingVertical: 3,
  },
  colNo: { width: "4%", textAlign: "center" },
  colCategory: { width: "18%", paddingLeft: 2 },
  colSpec: { width: "32%", paddingLeft: 2 },
  colQty: { width: "8%", textAlign: "center" },
  colUnit: { width: "8%", textAlign: "center" },
  colPrice: { width: "15%", textAlign: "right", paddingRight: 4 },
  colAmount: { width: "15%", textAlign: "right", paddingRight: 4 },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  notesBox: {
    width: "48%",
    borderWidth: 1,
    borderColor: "#333",
    padding: 6,
    fontSize: 7.5,
    lineHeight: 1.6,
  },
  summaryBox: {
    width: "48%",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#333",
    paddingVertical: 3,
    paddingHorizontal: 6,
    marginTop: -1,
  },
  summaryRowHighlight: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#333",
    paddingVertical: 3,
    paddingHorizontal: 6,
    marginTop: -1,
    backgroundColor: "#fdf5b3",
  },
  summaryRowFinal: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#333",
    paddingVertical: 5,
    paddingHorizontal: 6,
    marginTop: -1,
    backgroundColor: "#f0f0f0",
  },
  summaryLabel: {
    fontSize: 9,
  },
  summaryValue: {
    fontSize: 9,
  },
  detailHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  detailAnnexLabel: {
    fontSize: 8,
  },
  detailCategoryBadge: {
    backgroundColor: PINK,
    borderWidth: 1,
    borderColor: "#333",
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  detailCategoryText: {
    fontSize: 11,
    fontWeight: "bold",
  },
  detailColName: { width: "30%", paddingLeft: 2 },
  detailColSpec: { width: "30%", paddingLeft: 2 },
  detailColQty: { width: "10%", textAlign: "center" },
  detailColUnit: { width: "10%", textAlign: "center" },
  detailColPrice: { width: "10%", textAlign: "right", paddingRight: 4 },
  detailColAmount: { width: "10%", textAlign: "right", paddingRight: 4 },
  detailSubtotalRow: {
    flexDirection: "row",
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#333",
    paddingVertical: 4,
    backgroundColor: PINK,
  },
});

function formatYen(amount: number): string {
  return `¥${Math.round(amount).toLocaleString("ja-JP")}`;
}

// NotoSansJPのこのサブセットには「㎡」の字形が含まれていないため、
// フォントに存在する文字だけで表示できる「m²」に変換する（データ自体は変更しない）。
function formatUnit(unit: string): string {
  return unit === "㎡" ? "m²" : unit;
}

function groupByCategory(lines: EstimatePdfLine[]): [string, EstimatePdfLine[]][] {
  const groups = new Map<string, EstimatePdfLine[]>();
  for (const line of lines) {
    const list = groups.get(line.category) ?? [];
    list.push(line);
    groups.set(line.category, list);
  }
  return Array.from(groups.entries());
}

export function EstimateDocument({ data }: { data: EstimatePdfData }) {
  const categories = groupByCategory(data.lines);
  const totalPages = 1 + categories.length;
  const combinedTotal = data.subtotalSell + data.overheadFee;

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <Text style={styles.pageNumber}>（1/{totalPages}）</Text>
        <Text style={styles.dateRow}>{data.issueDateLabel}</Text>

        <View style={styles.titleBand}>
          <Text style={styles.titleText}>御 見 積 書</Text>
        </View>

        <View style={styles.topRow}>
          <View style={styles.leftCol}>
            <Text style={styles.customerLine}>{data.customerName} 様</Text>
            <Text style={{ fontSize: 8, marginBottom: 8 }}>下記の通り御見積申し上げます。</Text>
            <View style={styles.greetingBox}>
              <Text>
                拝啓　時下ますますご清栄のこととお喜び申し上げます。平素は格別のご高配を賜り、厚く御礼申し上げます。
              </Text>
              <Text>
                この度は弊社に見積りの機をお与え下さいまして誠に有難うございます。左記の通りお見積り申し上げます。
              </Text>
              <Text>ご検討の程よろしくお願い申し上げます。　　　　　　　　　　　　　　　　　　　　　　　　敬具</Text>
            </View>
            <View style={styles.siteInfo}>
              <Text style={styles.siteInfoLine}>【　現場名　】{data.siteName}</Text>
              {data.siteAddress ? (
                <Text style={styles.siteInfoLine}>【 現場住所 】{data.siteAddress}</Text>
              ) : null}
            </View>
            <View style={styles.amountBox}>
              <Text style={styles.amountLabel}>【御見積金額】</Text>
              <Text style={styles.amountValue}>{formatYen(data.totalAmount)} —</Text>
              <Text style={styles.amountTaxNote}>（内消費税額 {formatYen(data.taxAmount)}-)</Text>
            </View>
          </View>

          <View style={styles.companyBox}>
            <View style={styles.companyHeaderRow}>
              <Image src={LOGO_PATH} style={styles.companyLogo} />
              <Text style={styles.companyName}>{data.company.name}</Text>
            </View>
            <View style={styles.companySealRow}>
              <View>
                <Text>本社</Text>
                <Text>〒{data.company.postalCode}</Text>
                <Text>{data.company.address}</Text>
                <Text>TEL：{data.company.tel}</Text>
                <Text>FAX：{data.company.fax}</Text>
                <Text>MAIL：{data.company.email}</Text>
                <Text>登録番号：{data.company.invoiceRegistrationNumber}</Text>
              </View>
              <Image src={SEAL_PATH} style={styles.companySeal} />
            </View>
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <Text style={styles.colNo}>№</Text>
            <Text style={styles.colCategory}>名称</Text>
            <Text style={styles.colSpec}>仕様・規格</Text>
            <Text style={styles.colQty}>数量</Text>
            <Text style={styles.colUnit}>単位</Text>
            <Text style={styles.colPrice}>単価</Text>
            <Text style={styles.colAmount}>金額</Text>
          </View>
          {categories.map(([category, catLines], i) => {
            const categoryTotal = catLines.reduce((sum, l) => sum + l.lineTotal, 0);
            return (
              <View style={styles.tableRow} key={category}>
                <Text style={styles.colNo}>{i + 1}</Text>
                <Text style={styles.colCategory}>{category}</Text>
                <Text style={styles.colSpec}></Text>
                <Text style={styles.colQty}>1</Text>
                <Text style={styles.colUnit}>式</Text>
                <Text style={styles.colPrice}>{formatYen(categoryTotal)}</Text>
                <Text style={styles.colAmount}>{formatYen(categoryTotal)}</Text>
              </View>
            );
          })}
        </View>

        <View style={styles.bottomRow}>
          <View style={styles.notesBox}>
            <Text style={{ fontWeight: "bold", marginBottom: 2 }}>備考</Text>
            <Text>外の商材はメーカー現調後仕様が変わることがあります。</Text>
            <Text>各メーカー材料値上げ予定の為、お見積り有効期限は60日間となります。</Text>
            <Text>仕様の色などによって金額が上がる場合があります。</Text>
            <Text>クロスの貼替えは下地の状態やクロス材によって凹凸が目立つ場合があります。</Text>
          </View>

          <View style={styles.summaryBox}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>小計(1)</Text>
              <Text style={styles.summaryValue}>{formatYen(data.subtotalSell)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>諸経費(2)</Text>
              <Text style={styles.summaryValue}>{formatYen(data.overheadFee)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>(1)+(2)の合計</Text>
              <Text style={styles.summaryValue}>{formatYen(combinedTotal)}</Text>
            </View>
            <View style={styles.summaryRowHighlight}>
              <Text style={styles.summaryLabel}>値引き</Text>
              <Text style={styles.summaryValue}>{formatYen(data.discount)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>調整後価格</Text>
              <Text style={styles.summaryValue}>{formatYen(data.adjustedPrice)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>消費税（10％）</Text>
              <Text style={styles.summaryValue}>{formatYen(data.taxAmount)}</Text>
            </View>
            <View style={styles.summaryRowFinal}>
              <Text style={{ fontSize: 10, fontWeight: "bold" }}>総額</Text>
              <Text style={{ fontSize: 10, fontWeight: "bold" }}>{formatYen(data.totalAmount)}</Text>
            </View>
          </View>
        </View>
      </Page>

      {categories.map(([category, catLines], i) => {
        const categoryTotal = catLines.reduce((sum, l) => sum + l.lineTotal, 0);
        return (
          <Page size="A4" orientation="landscape" style={styles.page} key={category}>
            <Text style={styles.pageNumber}>
              （{i + 2}/{totalPages}）
            </Text>
            <View style={styles.detailHeaderRow}>
              <Text style={styles.detailAnnexLabel}>別紙　内訳</Text>
            </View>
            <View style={styles.titleBand}>
              <Text style={styles.titleText}>御 見 積 書</Text>
            </View>
            <View style={styles.detailCategoryBadge}>
              <Text style={styles.detailCategoryText}>
                {i + 1}　{category}
              </Text>
            </View>
            <View style={styles.table}>
              <View style={styles.tableHeaderRow}>
                <Text style={styles.detailColName}>名称</Text>
                <Text style={styles.detailColSpec}>仕様・規格</Text>
                <Text style={styles.detailColQty}>数量</Text>
                <Text style={styles.detailColUnit}>単位</Text>
                <Text style={styles.detailColPrice}>単価</Text>
                <Text style={styles.detailColAmount}>金額</Text>
              </View>
              {catLines.map((line, li) => (
                <View style={styles.tableRow} key={li}>
                  <Text style={styles.detailColName}>{line.name}</Text>
                  <Text style={styles.detailColSpec}></Text>
                  <Text style={styles.detailColQty}>{line.quantity}</Text>
                  <Text style={styles.detailColUnit}>{formatUnit(line.unit)}</Text>
                  <Text style={styles.detailColPrice}>{formatYen(line.sellPrice)}</Text>
                  <Text style={styles.detailColAmount}>{formatYen(line.lineTotal)}</Text>
                </View>
              ))}
              <View style={styles.detailSubtotalRow}>
                <Text style={styles.detailColName}></Text>
                <Text style={styles.detailColSpec}></Text>
                <Text style={styles.detailColQty}></Text>
                <Text style={styles.detailColUnit}></Text>
                <Text style={[styles.detailColPrice, { fontWeight: "bold" }]}>小計</Text>
                <Text style={[styles.detailColAmount, { fontWeight: "bold" }]}>{formatYen(categoryTotal)}</Text>
              </View>
            </View>
          </Page>
        );
      })}
    </Document>
  );
}

export async function renderEstimatePdf(data: EstimatePdfData): Promise<Buffer> {
  return renderToBuffer(<EstimateDocument data={data} />);
}
