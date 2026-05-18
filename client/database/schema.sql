-- =============================================
-- STRYDE — Personal Finance App
-- Database Schema (current as of May 2026)
-- =============================================


-- HOUSEHOLDS
create table households (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  invite_code text,
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
  start_date date not null,
  end_date date not null,
  created_at timestamp default now()
);


-- ACCOUNTS
create table accounts (
  id uuid default gen_random_uuid() primary key,
  household_id uuid references households(id) on delete cascade,
  name text not null,
  bank_name text,
  last_four text,
  account_type text not null,        -- 'checking' | 'savings' | 'credit'
  current_balance numeric(10,2) default 0,
  is_primary boolean default false,
  is_accumulating boolean default false,
  accumulation_target numeric(10,2),
  accumulation_current numeric(10,2) default 0,
  due_day integer,                   -- day of month savings are due
  reset_type text default 'manual',  -- 'manual' | 'monthly'
  reset_day integer,
  minimum_buffer numeric(10,2) default 0,
  created_at timestamp default now()
);


-- INCOME (defined after accounts so deposit_account_id foreign key resolves)
create table income (
  id uuid default gen_random_uuid() primary key,
  household_id uuid references households(id) on delete cascade,
  name text not null,
  owner text not null,
  type text not null,
  frequency text not null,           -- 'weekly' | 'biweekly' | 'monthly'
  fixed_amount numeric(10,2),
  next_pay_date date,
  deposit_account_id uuid references accounts(id) on delete set null,
  is_active boolean default true,
  created_at timestamp default now()
);


-- BILLS
create table bills (
  id uuid default gen_random_uuid() primary key,
  household_id uuid references households(id) on delete cascade,
  account_id uuid references accounts(id) on delete set null,
  transfer_to_account_id uuid references accounts(id) on delete set null,
  name text not null,
  amount numeric(10,2) not null,
  due_day integer not null,
  due_day_2 integer,                 -- second due day for semi-monthly bills
  frequency text not null default 'monthly',  -- 'monthly' | 'semi-monthly' | 'biweekly' | 'quarterly' | 'annually'
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


-- DEBTS
create table debts (
  id uuid default gen_random_uuid() primary key,
  household_id uuid references households(id) on delete cascade,
  name text not null,
  owner text not null,
  category text not null,
  balance numeric(10,2) not null,
  interest_rate numeric(5,4),        -- stored as decimal (e.g. 0.2499 = 24.99%)
  minimum_payment numeric(10,2),
  payoff_order integer,
  is_paid_off boolean default false,
  paid_off_date date,
  payment_freed_up numeric(10,2),
  created_at timestamp default now()
);


-- CATEGORIES (user-defined bill categories)
create table categories (
  id uuid default gen_random_uuid() primary key,
  household_id uuid references households(id) on delete cascade,
  name text not null,
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
alter table debts enable row level security;
alter table categories enable row level security;


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

create policy "household members only" on debts for all
using (household_id in (
  select household_id from household_members
  where user_id = auth.uid()
));

create policy "household members only" on categories for all
using (household_id in (
  select household_id from household_members
  where user_id = auth.uid()
));


-- =============================================
-- MIGRATIONS (columns added after initial schema)
-- =============================================

-- Run these if starting from the original schema:

-- ALTER TABLE households ADD COLUMN IF NOT EXISTS invite_code text;

-- ALTER TABLE pay_periods ADD COLUMN IF NOT EXISTS start_date date;
-- ALTER TABLE pay_periods ADD COLUMN IF NOT EXISTS end_date date;

-- ALTER TABLE income ADD COLUMN IF NOT EXISTS deposit_account_id uuid references accounts(id) on delete set null;

-- ALTER TABLE accounts ADD COLUMN IF NOT EXISTS due_day integer;
-- ALTER TABLE accounts ADD COLUMN IF NOT EXISTS minimum_buffer numeric(10,2) default 0;

-- ALTER TABLE bills ADD COLUMN IF NOT EXISTS transfer_to_account_id uuid references accounts(id) on delete set null;
-- ALTER TABLE bills ADD COLUMN IF NOT EXISTS frequency text NOT NULL DEFAULT 'monthly';
-- ALTER TABLE bills ADD COLUMN IF NOT EXISTS due_day_2 integer;
-- ALTER TABLE bills ADD COLUMN IF NOT EXISTS paid_amount numeric(10,2);
