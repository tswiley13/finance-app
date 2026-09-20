-- Lets a budget line be assigned to a specific group/card on the Budget page,
-- overriding the name-based default. Run once in the Supabase SQL editor.
alter table budgets add column if not exists group_name text;
