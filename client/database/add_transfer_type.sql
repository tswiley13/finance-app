-- Bills & Transfers: an item is now explicitly a "bill" (money that leaves you —
-- rent, car payment, utilities) or a "transfer" (money you move into another
-- account you own — food/gas envelope, savings). This is chosen at creation
-- instead of being inferred from plumbing. Existing rows default to bills.
-- A transfer MAY point at a destination account (transfer_to_account_id); if it
-- points at a savings account, that account's projected balance grows.
-- Run once in the Supabase SQL editor.
alter table bills add column if not exists is_transfer boolean not null default false;
