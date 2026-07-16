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
