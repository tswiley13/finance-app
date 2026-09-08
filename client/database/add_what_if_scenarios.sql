-- Saved What-If scenarios. Run once in the Supabase SQL editor.
create table if not exists what_if_scenarios (
  id uuid default gen_random_uuid() primary key,
  household_id uuid references households(id) on delete cascade,
  name text not null,
  data jsonb not null default '{}',   -- { bills, income, extraBills, extraIncome }
  created_at timestamp default now(),
  updated_at timestamp default now()
);
alter table what_if_scenarios enable row level security;
drop policy if exists "household members only" on what_if_scenarios;
create policy "household members only" on what_if_scenarios for all
using (household_id in (
  select household_id from household_members
  where user_id = auth.uid()
));
