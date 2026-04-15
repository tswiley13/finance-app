-- =============================================
-- BRAVO SIX — SLATE APP
-- Complete Database Schema
-- =============================================


-- HOUSEHOLDS
create table households (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamp default now()
);

create table household_members (
  id uuid default gen_random_uuid() primary key,
  household_id uuid references households(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  role text not null default 'member',
  name text not null,
  created_at timestamp default now()
);


-- PAY PERIODS
create table pay_periods (
  id uuid default gen_random_uuid() primary key,
  household_id uuid references households(id) on delete cascade,
  name text not null,
  start_day integer not null,
  end_day integer not null,
  created_at timestamp default now()
);


-- INCOME
create table income (
  id uuid default gen_random_uuid() primary key,
  household_id uuid references households(id) on delete cascade,
  pay_period_id uuid references pay_periods(id) on delete set null,
  name text not null,
  owner text not null,
  type text not null,
  frequency text not null,
  fixed_amount numeric(10,2),
  hourly_rate numeric(10,2),
  hours_per_week numeric(10,2),
  overtime_rate numeric(10,2),
  tax_rate numeric(5,2),
  next_pay_date date,
  is_active boolean default true,
  created_at timestamp default now()
);


-- ACCOUNTS
create table accounts (
  id uuid default gen_random_uuid() primary key,
  household_id uuid references households(id) on delete cascade,
  name text not null,
  bank_name text,
  last_four text,
  account_type text not null,
  current_balance numeric(10,2) default 0,
  is_primary boolean default false,
  is_accumulating boolean default false,
  accumulation_target numeric(10,2),
  accumulation_current numeric(10,2) default 0,
  reset_type text default 'manual',
  reset_day integer,
  created_at timestamp default now()
);


-- BILLS
create table bills (
  id uuid default gen_random_uuid() primary key,
  household_id uuid references households(id) on delete cascade,
  pay_period_id uuid references pay_periods(id) on delete set null,
  account_id uuid references accounts(id) on delete set null,
  name text not null,
  amount numeric(10,2) not null,
  due_day integer not null,
  payment_method text not null,
  category text not null,
  owner text not null default 'joint',
  is_variable boolean default false,
  is_active boolean default true,
  is_paid boolean default false,
  paid_date date,
  paid_amount numeric(10,2),
  created_at timestamp default now()
);


-- ACCOUNT CONTRIBUTIONS
create table account_contributions (
  id uuid default gen_random_uuid() primary key,
  household_id uuid references households(id) on delete cascade,
  account_id uuid references accounts(id) on delete cascade,
  pay_period_id uuid references pay_periods(id) on delete cascade,
  amount numeric(10,2) not null,
  created_at timestamp default now()
);


-- DEBTS
create table debts (
  id uuid default gen_random_uuid() primary key,
  household_id uuid references households(id) on delete cascade,
  name text not null,
  owner text not null,
  category text not null,
  balance numeric(10,2) not null,
  interest_rate numeric(5,4),
  minimum_payment numeric(10,2),
  payoff_order integer,
  is_paid_off boolean default false,
  paid_off_date date,
  payment_freed_up numeric(10,2),
  created_at timestamp default now()
);


-- ALLOCATIONS
create table allocations (
  id uuid default gen_random_uuid() primary key,
  household_id uuid references households(id) on delete cascade,
  pay_period_id uuid references pay_periods(id) on delete cascade,
  account_id uuid references accounts(id) on delete cascade,
  income_id uuid references income(id) on delete cascade,
  amount numeric(10,2) not null,
  allocation_date date not null,
  notes text,
  created_at timestamp default now()
);


-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

alter table households enable row level security;
alter table household_members enable row level security;
alter table pay_periods enable row level security;
alter table income enable row level security;
alter table accounts enable row level security;
alter table bills enable row level security;
alter table account_contributions enable row level security;
alter table debts enable row level security;
alter table allocations enable row level security;


-- =============================================
-- RLS POLICIES
-- =============================================

create policy "household members only" on households for all
using (id in (
  select household_id from household_members
  where user_id = auth.uid()
));

create policy "household members only" on household_members for all
using (household_id in (
  select household_id from household_members
  where user_id = auth.uid()
));

create policy "household members only" on pay_periods for all
using (household_id in (
  select household_id from household_members
  where user_id = auth.uid()
));

create policy "household members only" on income for all
using (household_id in (
  select household_id from household_members
  where user_id = auth.uid()
));

create policy "household members only" on accounts for all
using (household_id in (
  select household_id from household_members
  where user_id = auth.uid()
));

create policy "household members only" on bills for all
using (household_id in (
  select household_id from household_members
  where user_id = auth.uid()
));

create policy "household members only" on account_contributions for all
using (household_id in (
  select household_id from household_members
  where user_id = auth.uid()
));

create policy "household members only" on debts for all
using (household_id in (
  select household_id from household_members
  where user_id = auth.uid()
));

create policy "household members only" on allocations for all
using (household_id in (
  select household_id from household_members
  where user_id = auth.uid()
));