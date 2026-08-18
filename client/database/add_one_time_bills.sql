-- One-time payments: a bill with frequency = 'one-time' lands in the single
-- pay period that contains due_date, then drops off the Bills list once paid.
-- Run once in the Supabase SQL editor.
alter table bills add column if not exists due_date date;
