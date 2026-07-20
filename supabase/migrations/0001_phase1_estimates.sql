-- Phase1: 見積作成・単価マスタ・顧客管理の土台となるテーブル定義。
-- 現時点ではSupabaseに未接続（ローカルのモックデータのみ）。
-- Supabaseプロジェクトを用意したら、このファイルをそのまま
-- `supabase db push` または SQL Editor で実行すれば同じ構造で稼働する。
--
-- 設計方針:
--   - src/domain/types.ts のTypeScriptの型と1対1になるようにしている。
--   - 会社の成長（10人→100人）を見据え、他の事業（仲介・買取再販・建築など）が
--     増えても土台のテーブルを作り直さずに済むよう、顧客・案件・見積を分離している。

create extension if not exists "pgcrypto";

create table referrers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null check (type in ('individual', 'real_estate_agency', 'other')),
  phone text,
  note text,
  created_at timestamptz not null default now()
);

create table customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  name_kana text,
  phone text,
  email text,
  postal_code text,
  address text,
  referrer_id uuid references referrers(id) on delete set null,
  created_at timestamptz not null default now()
);

create index customers_referrer_id_idx on customers(referrer_id);

-- 単価マスタ: 材料・工賃を分けて管理し、標準利益率から標準販売単価を算出する。
create table price_master_items (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  type text not null check (type in ('material', 'labor')),
  name text not null,
  unit text not null,
  cost_price numeric(12, 2) not null check (cost_price >= 0),
  margin_rate numeric(5, 4) not null check (margin_rate >= 0 and margin_rate < 1),
  -- sell_priceは生成列にせず、単価マスタ編集時にアプリ側で計算して保存する
  -- （将来、特定商品だけ手動で売価を上書きしたいケースに対応しやすくするため）。
  sell_price numeric(12, 2) not null check (sell_price >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index price_master_items_category_idx on price_master_items(category);

-- 案件: Phase1では見積保存時に自動作成されるだけの最小限のテーブル。
-- Phase2（案件管理）で契約・工程・請求などとの紐付けを拡張していく。
create table projects (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id) on delete restrict,
  title text not null,
  status text not null default 'estimate'
    check (status in ('estimate', 'contracted', 'in_progress', 'completed')),
  created_at timestamptz not null default now()
);

create index projects_customer_id_idx on projects(customer_id);

create table estimates (
  id uuid primary key default gen_random_uuid(),
  estimate_number text not null unique,
  customer_id uuid not null references customers(id) on delete restrict,
  project_id uuid not null references projects(id) on delete restrict,
  title text not null,
  issue_date timestamptz not null default now(),
  tax_rate numeric(4, 3) not null default 0.10,
  status text not null default 'draft'
    check (status in ('draft', 'sent', 'accepted', 'rejected')),
  created_at timestamptz not null default now()
);

create index estimates_customer_id_idx on estimates(customer_id);
create index estimates_project_id_idx on estimates(project_id);

-- 見積明細: 単価マスタを参照するが、価格はスナップショットとして保持する。
-- こうすることで、後で単価マスタの原価や利益率を変更しても、
-- 過去に発行済みの見積書の金額は変わらない（会計上の整合性のため重要）。
create table estimate_lines (
  id uuid primary key default gen_random_uuid(),
  estimate_id uuid not null references estimates(id) on delete cascade,
  price_item_id uuid references price_master_items(id) on delete set null,
  category text not null,
  name text not null,
  unit text not null,
  quantity numeric(12, 2) not null check (quantity >= 0),
  cost_price numeric(12, 2) not null check (cost_price >= 0),
  sell_price numeric(12, 2) not null check (sell_price >= 0),
  sort_order int not null default 0
);

create index estimate_lines_estimate_id_idx on estimate_lines(estimate_id);

-- 補足（Phase2以降で対応する想定）:
--   - Supabase Authでログインユーザー（社内スタッフ）を管理し、
--     Row Level Security で「自社データのみアクセス可」を強制する。
--   - PDFはSupabase Storageに保存し、estimatesテーブルにpdf_pathを追加する。
--   - estimate_numberの採番はDBのシーケンスかRPC関数に置き換え、
--     アプリ側のランダム生成（Phase1の仮実装）から卒業する。
