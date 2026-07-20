// 全画面・全サーバーアクションはここからリポジトリをimportする。
// SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY が設定されていればSupabase実装、
// 無ければローカル開発用のモック実装を使う。呼び出し側のコードは変更不要。

import { isSupabaseConfigured } from "@/lib/supabase/client";
import * as mock from "./mock-repositories";
import * as supabase from "./supabase-repositories";

const impl = isSupabaseConfigured() ? supabase : mock;

export const customerRepository = impl.customerRepository;
export const referrerRepository = impl.referrerRepository;
export const priceMasterRepository = impl.priceMasterRepository;
export const projectRepository = impl.projectRepository;
export const estimateRepository = impl.estimateRepository;
export const craftsmanRepository = impl.craftsmanRepository;
export const supplierRepository = impl.supplierRepository;
export const processTaskRepository = impl.processTaskRepository;
export const purchaseOrderRepository = impl.purchaseOrderRepository;
export const invoiceRepository = impl.invoiceRepository;
export const paymentRepository = impl.paymentRepository;
export const propertyRepository = impl.propertyRepository;
export const brokerageDealRepository = impl.brokerageDealRepository;
export const resaleProjectRepository = impl.resaleProjectRepository;
