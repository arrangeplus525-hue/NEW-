// 会社全体で共有するドメインモデル。
// Supabase接続後もテーブル構造とほぼ1対1になるように設計している。

export type ReferrerType = "individual" | "real_estate_agency" | "other";

export interface Referrer {
  id: string;
  name: string;
  type: ReferrerType;
  phone?: string;
  note?: string;
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  nameKana?: string;
  phone?: string;
  email?: string;
  postalCode?: string;
  address?: string;
  referrerId?: string | null;
  createdAt: string;
}

export type PriceItemType = "material" | "labor";

export interface PriceMasterItem {
  id: string;
  category: string;
  type: PriceItemType;
  name: string;
  unit: string;
  costPrice: number;
  marginRate: number; // 標準利益率 (0〜1)
  sellPrice: number; // costPrice / (1 - marginRate) から算出した標準販売単価
}

export type ProjectStatus = "estimate" | "contracted" | "in_progress" | "completed";

export interface Project {
  id: string;
  customerId: string;
  title: string;
  status: ProjectStatus;
  createdAt: string;
}

export interface EstimateLine {
  id: string;
  priceItemId: string;
  category: string;
  name: string;
  unit: string;
  quantity: number;
  costPrice: number; // 見積作成時点のスナップショット（後で単価マスタが変わっても過去見積は変わらない）
  sellPrice: number; // スナップショット。営業担当がこの単価だけは調整できる
}

export type EstimateStatus = "draft" | "sent" | "accepted" | "rejected";

export interface Estimate {
  id: string;
  estimateNumber: string;
  customerId: string;
  projectId: string;
  title: string;
  issueDate: string;
  lines: EstimateLine[];
  taxRate: number;
  status: EstimateStatus;
  createdAt: string;
}

// 職人（協力業者の個人・チーム）。将来は複数現場を掛け持ちするため、
// 案件に対して「割当」の形で紐付ける（職人マスタ自体は案件に依存しない）。
export interface Craftsman {
  id: string;
  name: string;
  specialty: string; // 例: 大工, 電気, 水道, クロス, 塗装
  phone?: string;
  note?: string;
  createdAt: string;
}

// 商社・仕入先（材料や設備の発注先）。
export interface Supplier {
  id: string;
  name: string;
  contactPerson?: string;
  phone?: string;
  note?: string;
  createdAt: string;
}

export type ProcessTaskStatus = "not_started" | "in_progress" | "done";

// 工程（案件ごとの作業スケジュール1件分）。
export interface ProcessTask {
  id: string;
  projectId: string;
  title: string;
  craftsmanId?: string | null;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  status: ProcessTaskStatus;
  note?: string;
}

export type PurchaseOrderStatus = "ordered" | "delivered";

// 商社発注（案件ごとの発注1件分）。
export interface PurchaseOrder {
  id: string;
  projectId: string;
  supplierId: string;
  title: string;
  amount: number;
  orderDate: string; // YYYY-MM-DD
  status: PurchaseOrderStatus;
  note?: string;
}

export type InvoiceStatus = "unpaid" | "partially_paid" | "paid";

// 請求書（案件ごとに複数発行できる。例: 着手金・中間金・完了金）。
// statusは入金記録に応じてサーバー側で自動計算し直す。
export interface Invoice {
  id: string;
  invoiceNumber: string;
  projectId: string;
  customerId: string;
  title: string;
  issueDate: string; // YYYY-MM-DD
  amount: number; // 請求金額（税込）
  status: InvoiceStatus;
  createdAt: string;
}

// 入金（請求書1件に対する入金1回分）。
export interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  paidDate: string; // YYYY-MM-DD
  note?: string;
}

export type PropertyType = "land" | "house" | "apartment";
export type PropertyStatus = "available" | "under_negotiation" | "contracted" | "sold";

// 物件（土地・戸建・マンション）。売買仲介・買取再販・建売のいずれからも参照される。
export interface Property {
  id: string;
  name: string;
  type: PropertyType;
  address: string;
  price: number; // 想定価格・売買価格
  status: PropertyStatus;
  note?: string;
  createdAt: string;
}

export type BrokerageDealStatus = "negotiating" | "contracted" | "settled";

// 売買仲介案件（Phase5）。売主・買主・契約日・決済日・仲介手数料を管理する。
export interface BrokerageDeal {
  id: string;
  propertyId: string;
  sellerCustomerId: string;
  buyerCustomerId?: string | null;
  contractDate?: string | null;
  settlementDate?: string | null;
  commissionAmount: number; // 仲介手数料
  loanUsed: boolean; // 住宅ローン利用有無
  status: BrokerageDealStatus;
  createdAt: string;
}

// 買取再販（Phase6）と土地仕入・建築（Phase7）は
// 「仕入 → 工事 → 販売 → 利益/ROI」という構造が同じため、
// kindで区別しつつ同じモデルにまとめている（別モデルにすると重複が大きいため）。
export type ResaleProjectKind = "purchase_resale" | "land_development";
export type ResaleProjectStatus = "acquired" | "in_progress" | "for_sale" | "sold";

export interface ResaleProject {
  id: string;
  kind: ResaleProjectKind;
  propertyId: string;
  acquisitionCost: number; // 仕入価格（買取再販は建物、土地仕入・建築は土地代）
  workBudget: number; // リフォーム費 or 建築費の予算
  workActualCost: number; // 実費（現状は手入力の積み上げ）
  targetSellPrice: number; // 販売想定価格
  actualSellPrice?: number | null; // 成約後の実売価格
  status: ResaleProjectStatus;
  createdAt: string;
}
