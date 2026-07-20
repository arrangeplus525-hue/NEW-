import type { Craftsman, Customer, PriceMasterItem, Property, Referrer, Supplier } from "@/domain/types";
import { calcSellPriceFromMargin } from "@/lib/calculations/estimate-calculations";

export const mockReferrers: Referrer[] = [
  {
    id: "ref-1",
    name: "中部不動産",
    type: "real_estate_agency",
    phone: "052-000-1111",
    createdAt: "2026-01-10T00:00:00Z",
  },
  {
    id: "ref-2",
    name: "鈴木様（知人紹介）",
    type: "individual",
    createdAt: "2026-02-01T00:00:00Z",
  },
];

export const mockCustomers: Customer[] = [
  {
    id: "cus-1",
    name: "山田太郎",
    nameKana: "ヤマダタロウ",
    phone: "090-1234-5678",
    email: "yamada@example.com",
    postalCode: "460-0008",
    address: "愛知県名古屋市中区栄1-1-1",
    referrerId: "ref-1",
    createdAt: "2026-03-01T00:00:00Z",
  },
  {
    id: "cus-2",
    name: "佐藤花子",
    nameKana: "サトウハナコ",
    phone: "080-9876-5432",
    postalCode: "461-0005",
    address: "愛知県名古屋市東区東桜2-2-2",
    referrerId: null,
    createdAt: "2026-04-15T00:00:00Z",
  },
];

function priceItem(
  id: string,
  category: string,
  type: "material" | "labor",
  name: string,
  unit: string,
  costPrice: number,
  marginRate: number
): PriceMasterItem {
  return {
    id,
    category,
    type,
    name,
    unit,
    costPrice,
    marginRate,
    sellPrice: calcSellPriceFromMargin(costPrice, marginRate),
  };
}

export const mockPriceMasterItems: PriceMasterItem[] = [
  priceItem("pm-1", "解体", "labor", "内装解体工事", "㎡", 3000, 0.3),
  priceItem("pm-2", "水回り", "material", "ユニットバス（標準グレード）", "式", 500000, 0.25),
  priceItem("pm-3", "水回り", "labor", "ユニットバス設置工事", "式", 150000, 0.3),
  priceItem("pm-4", "内装", "material", "フローリング材（複合フローリング）", "㎡", 6000, 0.35),
  priceItem("pm-5", "内装", "labor", "フローリング施工", "㎡", 3500, 0.3),
  priceItem("pm-6", "内装", "material", "クロス（量産品）", "㎡", 800, 0.4),
  priceItem("pm-7", "内装", "labor", "クロス施工", "㎡", 1200, 0.3),
  priceItem("pm-8", "電気", "labor", "コンセント増設工事", "箇所", 8000, 0.3),
  priceItem("pm-9", "外装", "material", "外壁塗装材（シリコン系）", "㎡", 1800, 0.3),
  priceItem("pm-10", "外装", "labor", "外壁塗装工事", "㎡", 2200, 0.3),
];

export const mockCraftsmen: Craftsman[] = [
  {
    id: "cr-1",
    name: "鈴木工務店",
    specialty: "大工",
    phone: "052-111-2222",
    createdAt: "2026-01-05T00:00:00Z",
  },
  {
    id: "cr-2",
    name: "田中電気",
    specialty: "電気",
    phone: "052-222-3333",
    createdAt: "2026-01-05T00:00:00Z",
  },
  {
    id: "cr-3",
    name: "高橋設備",
    specialty: "水道",
    phone: "052-333-4444",
    createdAt: "2026-01-05T00:00:00Z",
  },
];

export const mockSuppliers: Supplier[] = [
  {
    id: "sp-1",
    name: "中部建材商事",
    contactPerson: "渡辺様",
    phone: "052-444-5555",
    createdAt: "2026-01-05T00:00:00Z",
  },
  {
    id: "sp-2",
    name: "東海設備卸",
    contactPerson: "伊藤様",
    phone: "052-555-6666",
    createdAt: "2026-01-05T00:00:00Z",
  },
];

export const mockProperties: Property[] = [
  {
    id: "prop-1",
    name: "中古戸建（栄1丁目）",
    type: "house",
    address: "愛知県名古屋市中区栄1-2-3",
    price: 28000000,
    status: "available",
    createdAt: "2026-05-01T00:00:00Z",
  },
  {
    id: "prop-2",
    name: "更地（東桜2丁目）",
    type: "land",
    address: "愛知県名古屋市東区東桜2-3-4",
    price: 15000000,
    status: "available",
    createdAt: "2026-05-10T00:00:00Z",
  },
];
