-- Planning fields: debt original balance + a self-reported monthly
-- discretionary spending estimate on the household. Run once in Supabase.
alter table debts add column if not exists original_balance numeric(10,2);
alter table households add column if not exists monthly_discretionary numeric(10,2);
