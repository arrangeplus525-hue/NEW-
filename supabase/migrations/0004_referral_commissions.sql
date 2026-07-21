-- 紹介元マスタの基本紹介料率、案件ごとの紹介料率上書き・個人バックを追加
alter table referrers add column if not exists commission_rate numeric(5,4);
alter table projects add column if not exists referral_commission_rate numeric(5,4);
alter table projects add column if not exists personal_kickback_amount numeric(12,2);
alter table projects add column if not exists personal_kickback_note text;
