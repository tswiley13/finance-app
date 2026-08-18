-- Loan term tracking on debts: original term + months remaining (drives an
-- estimated payoff date). Run once in the Supabase SQL editor.
alter table debts add column if not exists term_months integer;
alter table debts add column if not exists months_remaining integer;
