-- 実際の見積書フォーマット（表紙＋区分別内訳）に対応するための追加カラム。
-- 既存データに影響しないよう、すべてnullable/デフォルト値付き。

alter table projects add column site_address text;

alter table estimates add column overhead_fee numeric(12, 2) not null default 0;
alter table estimates add column adjusted_price numeric(12, 2);
