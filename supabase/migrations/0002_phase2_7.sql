-- Phase2〜7: 案件管理・工程・職人・商社・請求入金・売買仲介・買取再販/建築の
-- テーブル定義。0001と同じ方針で、src/domain/types.ts と1対1になるようにしている。

-- Phase3: 職人・商社マスタ
create table craftsmen (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  specialty text not null,
  phone text,
  note text,
  created_at timestamptz not null default now()
);

create table suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact_person text,
  phone text,
  note text,
  created_at timestamptz not null default now()
);

-- Phase3: 工程（案件ごとの作業スケジュール）
create table process_tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  title text not null,
  craftsman_id uuid references craftsmen(id) on delete set null,
  start_date date not null,
  end_date date not null,
  status text not null default 'not_started'
    check (status in ('not_started', 'in_progress', 'done')),
  note text
);

create index process_tasks_project_id_idx on process_tasks(project_id);
create index process_tasks_dates_idx on process_tasks(start_date, end_date);

-- Phase3: 商社発注（案件ごとの発注）
create table purchase_orders (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  supplier_id uuid not null references suppliers(id) on delete restrict,
  title text not null,
  amount numeric(12, 2) not null check (amount >= 0),
  order_date date not null,
  status text not null default 'ordered'
    check (status in ('ordered', 'delivered')),
  note text
);

create index purchase_orders_project_id_idx on purchase_orders(project_id);

-- Phase4: 請求書（案件ごとに複数発行できる。着手金・中間金・完了金など）
create table invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_number text not null unique,
  project_id uuid not null references projects(id) on delete cascade,
  customer_id uuid not null references customers(id) on delete restrict,
  title text not null,
  issue_date date not null,
  amount numeric(12, 2) not null check (amount >= 0),
  -- statusは入金記録に応じてアプリ側（将来はDBトリガー）で自動計算し直す。
  status text not null default 'unpaid'
    check (status in ('unpaid', 'partially_paid', 'paid')),
  created_at timestamptz not null default now()
);

create index invoices_project_id_idx on invoices(project_id);

-- Phase4: 入金（請求書1件に対する入金1回分）
create table payments (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references invoices(id) on delete cascade,
  amount numeric(12, 2) not null check (amount >= 0),
  paid_date date not null,
  note text
);

create index payments_invoice_id_idx on payments(invoice_id);

-- Phase5-7: 物件（土地・戸建・マンション）。売買仲介・買取再販・土地仕入建築の
-- いずれからも参照される共通マスタ。
create table properties (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null check (type in ('land', 'house', 'apartment')),
  address text not null,
  price numeric(14, 2) not null check (price >= 0),
  status text not null default 'available'
    check (status in ('available', 'under_negotiation', 'contracted', 'sold')),
  note text,
  created_at timestamptz not null default now()
);

-- Phase5: 売買仲介案件
create table brokerage_deals (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references properties(id) on delete restrict,
  seller_customer_id uuid not null references customers(id) on delete restrict,
  buyer_customer_id uuid references customers(id) on delete set null,
  contract_date date,
  settlement_date date,
  commission_amount numeric(12, 2) not null default 0 check (commission_amount >= 0),
  loan_used boolean not null default false,
  status text not null default 'negotiating'
    check (status in ('negotiating', 'contracted', 'settled')),
  created_at timestamptz not null default now()
);

create index brokerage_deals_property_id_idx on brokerage_deals(property_id);

-- Phase6/7: 買取再販・土地仕入建築。
-- 「仕入 → 工事 → 販売 → 利益/ROI」という構造が同じため、kindで区別しつつ
-- 同じテーブルにまとめている（別テーブルにすると重複が大きいため）。
create table resale_projects (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('purchase_resale', 'land_development')),
  property_id uuid not null references properties(id) on delete restrict,
  acquisition_cost numeric(14, 2) not null default 0 check (acquisition_cost >= 0),
  work_budget numeric(14, 2) not null default 0 check (work_budget >= 0),
  work_actual_cost numeric(14, 2) not null default 0 check (work_actual_cost >= 0),
  target_sell_price numeric(14, 2) not null default 0 check (target_sell_price >= 0),
  actual_sell_price numeric(14, 2),
  status text not null default 'acquired'
    check (status in ('acquired', 'in_progress', 'for_sale', 'sold')),
  created_at timestamptz not null default now()
);

create index resale_projects_property_id_idx on resale_projects(property_id);

-- 補足:
--   - Supabase Authとの連携、Row Level Securityの適用はまだ行っていない。
--     社内スタッフのログイン管理を実装するタイミングで対応する想定。
--   - PDF（見積書・請求書）はSupabase Storageに保存する形に将来切り替える。
