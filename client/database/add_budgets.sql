-- Monthly budget lines. One row per household per category; the budgeted
-- amount is a monthly figure. Bills are NOT stored here — the Budget page pulls
-- each category's monthly bill total live from the bills table. Run once in the
-- Supabase SQL editor.
create table if not exists budgets (
  id uuid default gen_random_uuid() primary key,
  household_id uuid references households(id) on delete cascade,
  category text not null,
  amount numeric(10,2) not null default 0,
  created_at timestamp default now(),
  unique (household_id, category)
);

alter table budgets enable row level security;
drop policy if exists "household members only" on budgets;
create policy "household members only" on budgets for all
using (household_id in (
  select household_id from household_members
  where user_id = auth.uid()
));
