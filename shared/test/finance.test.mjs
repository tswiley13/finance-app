// Smoke tests for the finance engine, built to reproduce the real July 2026
// scenario we verified by hand against the live dashboard.
//
// Run: node shared/test/finance.test.mjs

import assert from "node:assert/strict";
import {
  getPayPeriodBreakdown,
  enrichBreakdown,
  getMonthlyProjection,
  getBillsToTransfer,
} from "../src/index.js";

const TODAY = new Date("2026-07-09T00:00:00");

const accounts = [
  { id: "spend", name: "Spending", current_balance: 339.31, is_primary: true, is_accumulating: false },
  { id: "billsacct", name: "Bills", current_balance: 1273.61, is_primary: false, is_accumulating: false },
];

const payPeriods = [
  { id: "p1", start_date: "2026-07-02", end_date: "2026-07-15" }, // current
  { id: "p2", start_date: "2026-07-16", end_date: "2026-07-29" },
  { id: "p3", start_date: "2026-07-30", end_date: "2026-08-12" }, // spills into August
];

const income = [
  { id: "pay", name: "Payroll", fixed_amount: 2977, frequency: "biweekly", next_pay_date: "2026-07-02" },
];

const bills = [
  // Every paycheck
  { id: "food", name: "Food", amount: 500, frequency: "payday", account_id: "billsacct" },
  { id: "gas", name: "Gas", amount: 300, frequency: "payday", account_id: "billsacct" },
  { id: "lawyer", name: "Lawyer", amount: 200, frequency: "payday", account_id: "billsacct" },
  // Current period (due 13th/15th)
  { id: "boat", name: "Boat Storage", amount: 165, frequency: "monthly", due_day: 13, account_id: "billsacct" },
  { id: "capone", name: "Capital One", amount: 1055.72, frequency: "monthly", due_day: 13, account_id: "billsacct" },
  { id: "google", name: "Google Storage", amount: 2.99, frequency: "monthly", due_day: 15, account_id: "billsacct" },
  { id: "swgas", name: "Southwest Gas", amount: 45, frequency: "monthly", due_day: 15, account_id: "billsacct" },
  // Next period (due 20th/26th/29th)
  { id: "allstate", name: "Allstate", amount: 604, frequency: "monthly", due_day: 20, account_id: "billsacct" },
  { id: "cox", name: "Cox Internet", amount: 105, frequency: "monthly", due_day: 26, account_id: "billsacct" },
  { id: "netflix", name: "Netflix", amount: 25, frequency: "monthly", due_day: 29, account_id: "billsacct" },
];

// The payday bills were already paid out of the Jul 2 paycheck.
const billPayments = {
  "food-2026-07-02": { is_paid: true, paid_amount: 500 },
  "gas-2026-07-02": { is_paid: true, paid_amount: 300 },
  "lawyer-2026-07-02": { is_paid: true, paid_amount: 200 },
};

const ctx = {
  payPeriods, income, bills, accounts, billPayments,
  skippedBillPeriods: new Set(),
  earlyPayments: new Set(),
  transfers: {},
  today: TODAY,
};

const breakdown = getPayPeriodBreakdown(ctx);
const rows = enrichBreakdown(breakdown, ctx);

// ── Periods ──────────────────────────────────────────────────────────────────
assert.equal(rows.length, 3, "three upcoming periods");
assert.equal(rows[0].isCurrent, true, "Jul 2-15 is current");

// ── Current period: only the unpaid bills count ──────────────────────────────
assert.equal(
  Number(rows[0].billsDeducted.toFixed(2)), 1268.71,
  "current period unpaid bills = 165 + 1055.72 + 2.99 + 45"
);

// ── Next period: full period bills ───────────────────────────────────────────
assert.equal(
  Number(rows[1].billsDeducted.toFixed(2)), 1734.00,
  "Jul 16-29 bills = 500 + 300 + 200 + 604 + 105 + 25"
);

// ── End balance chains: start + income - bills ───────────────────────────────
assert.equal(Number(rows[1].startBalance.toFixed(2)), Number(rows[0].endBalance.toFixed(2)),
  "next period starts where the current one ends");
assert.equal(
  Number((rows[1].startBalance + rows[1].pendingIncome - rows[1].billsForEndBalance).toFixed(2)),
  Number(rows[1].endBalance.toFixed(2)),
  "end balance = start + income - bills"
);

// ── Monthly Projection: the four tiles must tie out ──────────────────────────
const proj = getMonthlyProjection(rows, ctx);

assert.equal(Number(proj.availableNow.toFixed(2)), 339.31, "Available Now = primary balance");
assert.equal(Number(proj.incomeThisMonth.toFixed(2)), 5954.00,
  "Income This Month = Jul 16 + Jul 30 deposits (2 x 2977)");
assert.equal(Number(proj.billsRemaining.toFixed(2)), 3002.71,
  "Bills Remaining = current unpaid (1268.71) + Jul 16-29 (1734); Jul 30-Aug 12 excluded");
assert.equal(Number(proj.availableThisMonth.toFixed(2)), 3290.60,
  "Available This Month = 339.31 + 5954.00 - 3002.71");

// The identity that must always hold.
assert.equal(
  Number(proj.availableThisMonth.toFixed(2)),
  Number((proj.availableNow + proj.incomeThisMonth - proj.billsRemaining).toFixed(2)),
  "tiles tie out"
);

// ── WTMG: one total to move for the upcoming period ──────────────────────────
assert.equal(Number(getBillsToTransfer(rows[1], ctx).toFixed(2)), 1734.00,
  "Bills to transfer for Jul 16-29 matches that period's bills");

console.log("✓ all finance engine tests passed");
console.log(`  Available Now        $${proj.availableNow.toFixed(2)}`);
console.log(`  Income This Month    $${proj.incomeThisMonth.toFixed(2)}`);
console.log(`  Bills Remaining      $${proj.billsRemaining.toFixed(2)}`);
console.log(`  Available This Month $${proj.availableThisMonth.toFixed(2)}`);

// ── Current-period transfers ─────────────────────────────────────────────────
// The row_key MUST be the account id: that's what the end balance checks before
// it stops subtracting that account's bills, and it's what the web app writes.
import { getPeriodTransferGroups } from "../src/index.js";

const groups = getPeriodTransferGroups(rows[0], ctx);
assert.equal(groups.length, 1, "one funding account needs a transfer");
assert.equal(groups[0].accountId, "billsacct", "keyed by account id, not a synthetic key");
assert.equal(Number(groups[0].needed.toFixed(2)), 1268.71, "needs the unpaid bills total");
assert.equal(groups[0].done, false, "nothing transferred yet");

// Primary account bills never produce a transfer row (you don't pay yourself).
const primaryOnlyCtx = {
  ...ctx,
  bills: [{ id: "x", name: "Direct", amount: 50, frequency: "monthly", due_day: 13, account_id: "spend" }],
};
const primaryRows = enrichBreakdown(getPayPeriodBreakdown(primaryOnlyCtx), primaryOnlyCtx);
assert.equal(getPeriodTransferGroups(primaryRows[0], primaryOnlyCtx).length, 0,
  "no transfer row for the primary account");

// Once the transfer is recorded, the end balance stops subtracting those bills.
const afterCtx = { ...ctx, transfers: { billsacct: 1268.71 } };
const afterRows = enrichBreakdown(getPayPeriodBreakdown(afterCtx), afterCtx);
assert.equal(Number(afterRows[0].billsForEndBalance.toFixed(2)), 0,
  "transfer confirmed -> current period bills no longer hit the primary balance");
assert.equal(Number(afterRows[0].endBalance.toFixed(2)), 339.31,
  "end balance settles to the untouched primary balance");
assert.equal(getPeriodTransferGroups(afterRows[0], afterCtx).every((g) => g.done), true,
  "group reports done, so the tile hides");

console.log("✓ current-period transfer tests passed");

// ── "Got Paid" visibility ────────────────────────────────────────────────────
// Only a deposit that hasn't landed yet can be marked received early. Once the
// pay date arrives the money is already in the synced balance, so the button
// must not show — otherwise tapping it writes a record that moves no number,
// which reads as a broken button.
import { canMarkIncomeReceived, isIncomeFuture } from "../src/index.js";

const NOW = new Date("2026-07-16T14:43:00"); // mid-afternoon on payday

assert.equal(isIncomeFuture({ actualPayDate: "2026-07-16" }, NOW), false,
  "a deposit dated today has already landed");
assert.equal(isIncomeFuture({ actualPayDate: "2026-07-30" }, NOW), true,
  "a deposit two weeks out is still pending");
assert.equal(isIncomeFuture({ actualPayDate: "2026-07-02" }, NOW), false,
  "a past deposit has landed");

const todayCtx = { earlyPayments: new Set(), today: NOW };
assert.equal(canMarkIncomeReceived({ id: "pay", actualPayDate: "2026-07-16" }, "2026-07-16", todayCtx), false,
  "no Got Paid on payday itself — matches the web app");
assert.equal(canMarkIncomeReceived({ id: "pay", actualPayDate: "2026-07-30" }, "2026-07-16", todayCtx), true,
  "Got Paid offered for a future deposit");

const alreadyCtx = { earlyPayments: new Set(["pay-2026-07-16"]), today: NOW };
assert.equal(canMarkIncomeReceived({ id: "pay", actualPayDate: "2026-07-30" }, "2026-07-16", alreadyCtx), false,
  "already marked -> show Undo, not Got Paid");

console.log("✓ Got Paid visibility tests passed");

// ── Partial payments, skips, carry-over ──────────────────────────────────────
import { getCarryOverBills } from "../src/index.js";

// A partial payment reduces the period's bill total by what was actually paid.
const partialCtx = {
  ...ctx,
  billPayments: { ...billPayments, "capone-2026-07-02": { is_paid: false, paid_amount: 55.72 } },
};
const partialRows = enrichBreakdown(getPayPeriodBreakdown(partialCtx), partialCtx);
assert.equal(Number(partialRows[0].billsDeducted.toFixed(2)), 1212.99,
  "1268.71 - 55.72 partial = 1212.99 still owed");

// A skipped bill drops out of the period entirely.
const skipCtx = { ...ctx, skippedBillPeriods: new Set(["boat-2026-07-02"]) };
const skipRows = enrichBreakdown(getPayPeriodBreakdown(skipCtx), skipCtx);
assert.equal(Number(skipRows[0].billsDeducted.toFixed(2)), 1103.71,
  "skipping the $165 Boat Storage leaves 1103.71");
assert.equal(Number(skipRows[0].billsForEndBalance.toFixed(2)), 1103.71,
  "a skipped bill doesn't hit the end balance either");

// Carry-over: unpaid bills from the PREVIOUS period are still owed.
const carryPeriods = [
  { id: "p0", start_date: "2026-06-18", end_date: "2026-07-01" }, // previous
  ...payPeriods,
];
const carryCtx = { ...ctx, payPeriods: carryPeriods, billPayments: {} };
const carried = getCarryOverBills(carryCtx);
assert.ok(carried.length > 0, "previous period's unpaid bills carry over");
assert.equal(carried.every((b) => b._carryOverFrom === "2026-06-18"), true,
  "carry-over bills are tagged with the period they came from");

// Paying or skipping them in that period clears the carry-over.
const clearedCtx = {
  ...carryCtx,
  skippedBillPeriods: new Set(carried.map((b) => `${b.id}-2026-06-18`)),
};
assert.equal(getCarryOverBills(clearedCtx).length, 0,
  "skipping the previous period's bills clears the carry-over");

console.log("✓ partial / skip / carry-over tests passed");

// ── Available This Month stays stable when paying funded bills ────────────────
// A pre-funder transfers all bill money into a non-primary bills account. Those
// bills are then paid from that account, so marking one paid must NOT move
// "Available This Month" — the money already left primary via the transfer.
import { getFundedBillTotal } from "../src/index.js";

const preFundCtx = {
  ...ctx,
  transfers: { billsacct: 1268.71 }, // confirmed transfer covering all current bills
};
const preFundRows = enrichBreakdown(getPayPeriodBreakdown(preFundCtx), preFundCtx);
const before = getMonthlyProjection(preFundRows, preFundCtx);

// Now "pay" one funded bill (Boat Storage, $165) from the bills account.
const afterPayCtx = {
  ...preFundCtx,
  billPayments: { ...billPayments, "boat-2026-07-02": { is_paid: true, paid_amount: 165 } },
};
const afterPayRows = enrichBreakdown(getPayPeriodBreakdown(afterPayCtx), afterPayCtx);
const after = getMonthlyProjection(afterPayRows, afterPayCtx);

assert.equal(
  Number(after.availableThisMonth.toFixed(2)),
  Number(before.availableThisMonth.toFixed(2)),
  "paying a funded bill leaves Available This Month unchanged"
);
// Bills Remaining still drops — it's genuinely one fewer bill to pay.
assert.ok(after.billsRemaining < before.billsRemaining,
  "Bills Remaining still reflects the paid bill");

// The single-account case is untouched: no transfers -> funded is 0 -> tiles tie out.
assert.equal(getFundedBillTotal(rows[0], ctx), 0, "no transfer -> nothing funded");
const plainProj = getMonthlyProjection(rows, ctx);
assert.equal(
  Number(plainProj.availableThisMonth.toFixed(2)),
  Number((plainProj.availableNow + plainProj.incomeThisMonth - plainProj.billsRemaining).toFixed(2)),
  "single-account tiles still tie out exactly"
);

console.log("✓ funded-bill stability tests passed");
