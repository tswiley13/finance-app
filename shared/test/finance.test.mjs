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
assert.equal(Number(proj.billsRemaining.toFixed(2)), 4002.71,
  "Bills Remaining = current unpaid (1268.71) + Jul 16-29 (1734) + Jul 30-Aug 12's July-due payday bills (food+gas+lawyer=1000, due Jul 30); only that period's Aug bills are excluded");
assert.equal(Number(proj.availableThisMonth.toFixed(2)), 2290.60,
  "Available This Month = 339.31 + 5954.00 - 4002.71");

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

// ── Pre-paying a FUTURE period's bill must not move its projection ────────────
// Got paid early -> you pre-fund next period's bills. That money leaves your
// spending, so the future period's End Balance and BILLS must stay put whether
// or not the bill is marked paid. (The current period is different — there the
// live balance already reflects payments, so paid bills ARE excluded.)
const futIdx = 1; // Jul 16-29 in this fixture is a future period
{
  const unpaidCtx = { ...ctx, billPayments: {} };
  const unpaidRows = enrichBreakdown(getPayPeriodBreakdown(unpaidCtx), unpaidCtx);

  // Pre-pay the whole Jul 16-29 period (all its bills marked paid early).
  const paidPayments = {};
  unpaidRows[futIdx].bills.forEach((b) => {
    paidPayments[`${b.id}-2026-07-16`] = { is_paid: true, paid_amount: b.amount };
  });
  const paidCtx = { ...ctx, billPayments: paidPayments };
  const paidRows = enrichBreakdown(getPayPeriodBreakdown(paidCtx), paidCtx);

  assert.equal(
    Number(paidRows[futIdx].endBalance.toFixed(2)),
    Number(unpaidRows[futIdx].endBalance.toFixed(2)),
    "future period End Balance is unchanged by pre-paying its bills"
  );
  // Bills Remaining SHOULD drop — you paid those bills, fewer are left.
  assert.ok(
    paidRows[futIdx].billsDeducted < unpaidRows[futIdx].billsDeducted,
    "future period Bills Remaining drops as you pre-pay"
  );
  // End Balance holds because the money left regardless; the gap between what
  // Bills Remaining shows and what the End Balance subtracts is the pre-paid
  // amount that's already gone.
  const r = paidRows[futIdx];
  const prePaid = unpaidRows[futIdx].billsDeducted - r.billsDeducted;
  assert.equal(
    Number((r.startBalance + r.pendingIncome - r.billsDeducted - prePaid).toFixed(2)),
    Number(r.endBalance.toFixed(2)),
    "end balance = start + income - remaining - pre-paid"
  );
}

// Current period still excludes paid bills (unchanged behavior).
{
  const cur = rows[0]; // current
  const paidCur = { ...ctx, billPayments: { ...billPayments, "boat-2026-07-02": { is_paid: true, paid_amount: 165 } } };
  const paidCurRows = enrichBreakdown(getPayPeriodBreakdown(paidCur), paidCur);
  assert.ok(paidCurRows[0].billsDeducted < cur.billsDeducted,
    "current period BILLS still drops when a bill is paid");
}

console.log("✓ future pre-payment tests passed");

// ── Paying a bill at a CUSTOM amount uses the real amount, not the template ───
// A bigger-than-usual electric bill: template is $604 (allstate) but you
// actually pay $654. The period must reflect the $654 that left, not the $604
// template — and the extra must not vanish (or, worse, shrink the total).
import { isBillFullyPaid, getBillPeriodCost } from "../src/index.js";
{
  const templateAmt = 604; // allstate
  const actualPaid = 654;  // $50 higher this month
  const key = "allstate-2026-07-16"; // future period p2

  // Baseline: paid at the template amount.
  const atTemplate = { ...ctx, billPayments: { ...billPayments, [key]: { is_paid: true, paid_amount: templateAmt } } };
  const atTemplateRows = enrichBreakdown(getPayPeriodBreakdown(atTemplate), atTemplate);

  // Same bill, paid $50 higher.
  const atActual = { ...ctx, billPayments: { ...billPayments, [key]: { is_paid: true, paid_amount: actualPaid } } };
  const atActualRows = enrichBreakdown(getPayPeriodBreakdown(atActual), atActual);

  // A future period's projected End Balance must be $50 LOWER — that money left.
  assert.equal(
    Number((atTemplateRows[futIdx].endBalance - atActualRows[futIdx].endBalance).toFixed(2)),
    50,
    "paying $50 over the template lowers the future End Balance by $50"
  );

  // Bills Remaining for a fully-paid bill is 0 — never negative from over-paying.
  const allstateBill = bills.find((b) => b.id === "allstate");
  assert.equal(getBillPeriodCost(atActual.billPayments, allstateBill, "2026-07-16"), actualPaid,
    "period cost of a fully-paid bill is the real amount paid");
  assert.ok(isBillFullyPaid(atActual.billPayments, allstateBill, "2026-07-16"),
    "over-paid bill is fully paid");
  assert.ok(atActualRows[futIdx].billsDeducted >= 0,
    "Bills Remaining never goes negative from an over-payment");

  // Under-paying but flagged paid (e.g. a discount): cost tracks the real $580.
  const under = { ...ctx, billPayments: { ...billPayments, [key]: { is_paid: true, paid_amount: 580 } } };
  const underRows = enrichBreakdown(getPayPeriodBreakdown(under), under);
  assert.equal(
    Number((underRows[futIdx].endBalance - atTemplateRows[futIdx].endBalance).toFixed(2)),
    24,
    "paying $24 under the template raises the future End Balance by $24"
  );
}

console.log("✓ custom-amount payment tests passed");

// ── One-time payments land in exactly one period, then finish when paid ───────
import { isBillDueInPeriod, isOneTimeBillDone } from "../src/index.js";
{
  // A $400 car repair dated Jul 20 — inside the Jul 16-29 period only.
  const repair = { id: "repair", name: "Car Repair", amount: 400, frequency: "one-time", due_date: "2026-07-20", account_id: "billsacct" };
  const oneTimeCtx = { ...ctx, bills: [...bills, repair] };
  const otRows = enrichBreakdown(getPayPeriodBreakdown(oneTimeCtx), oneTimeCtx);

  const inPeriod = (row) => row.bills.some((b) => b.id === "repair");
  assert.ok(!inPeriod(otRows[0]), "one-time bill NOT in the Jul 2-15 period");
  assert.ok(inPeriod(otRows[1]), "one-time bill IS in the Jul 16-29 period (contains Jul 20)");
  assert.ok(!inPeriod(otRows[2]), "one-time bill NOT in the Jul 30-Aug 12 period");

  // It adds its amount to that period's bills total, exactly once.
  const baseRows = enrichBreakdown(getPayPeriodBreakdown(ctx), ctx);
  assert.equal(
    Number((otRows[1].billsDeducted - baseRows[1].billsDeducted).toFixed(2)),
    400,
    "one-time bill adds its full amount to its period's Bills Remaining"
  );

  // A one-time bill with no date lands nowhere (guards against orphans).
  const noDate = { ...repair, due_date: null };
  const pStart = new Date("2026-07-16T00:00:00");
  const pEnd = new Date("2026-07-29T23:59:59");
  assert.ok(!isBillDueInPeriod(noDate, pStart, pEnd), "dateless one-time bill lands in no period");

  // Once paid, it's done — drops off the active Bills list.
  assert.ok(!isOneTimeBillDone(repair, {}), "unpaid one-time bill is not done");
  assert.ok(
    isOneTimeBillDone(repair, { "repair-2026-07-16": { is_paid: true, paid_amount: 400 } }),
    "paid one-time bill is done"
  );
}

console.log("✓ one-time payment tests passed");

// ── Bill start_date ──────────────────────────────────────────────────────
// A recurring bill is not active until its start_date; a period that ends
// before it begins must not include it. (NULL start_date = always active.)
{
  const pStart = new Date("2026-07-16T00:00:00");
  const pEnd = new Date("2026-07-29T23:59:59");
  const monthly = { id: "sav", name: "Savings", amount: 200, frequency: "monthly", due_day: 20, account_id: "billsacct" };

  // No start_date → active (due_day 20 lands in the period).
  assert.ok(isBillDueInPeriod(monthly, pStart, pEnd), "bill with no start_date is active");

  // start_date in the future → the whole period ends before it → excluded.
  assert.ok(
    !isBillDueInPeriod({ ...monthly, start_date: "2026-08-01" }, pStart, pEnd),
    "bill starting Aug 1 is excluded from a July period that ends before it"
  );

  // start_date inside the period → active (due day still lands).
  assert.ok(
    isBillDueInPeriod({ ...monthly, start_date: "2026-07-18" }, pStart, pEnd),
    "bill starting mid-period is active that period"
  );

  // start_date in the past → active.
  assert.ok(
    isBillDueInPeriod({ ...monthly, start_date: "2026-01-01" }, pStart, pEnd),
    "bill started in the past is active"
  );

  // Projection level: a savings bill added now but starting next month only
  // shows up from the period that reaches its start date onward.
  const futureSav = { id: "futuresav", name: "New Savings", amount: 150, frequency: "monthly", due_day: 5, start_date: "2026-08-01", account_id: "billsacct" };
  const savCtx = { ...ctx, bills: [...bills, futureSav] };
  const savRows = enrichBreakdown(getPayPeriodBreakdown(savCtx), savCtx);
  const hasSav = (row) => row.bills.some((b) => b.id === "futuresav");
  assert.ok(!hasSav(savRows[0]), "future-start savings NOT in the first (July) period");
  assert.ok(savRows.some(hasSav), "future-start savings appears once its start month is reached");
}

console.log("✓ bill start_date tests passed");

// ── Financial summary export (markdown + csv) ────────────────────────────────
import { buildFinancialSummary } from "../src/index.js";
{
  const summary = buildFinancialSummary({
    accounts,
    income,
    bills: [...bills, { id: "repair", name: "Car Repair", amount: 400, frequency: "one-time", due_date: "2026-07-20", account_id: "billsacct" }],
    debts: [{ id: "cc", name: "Visa", balance: 1200, interest_rate: 0.199, minimum_payment: 35, is_paid_off: false }],
    rows,
    snapshot: getMonthlyProjection(rows, ctx),
    generatedAt: "2026-07-09",
  });

  assert.ok(summary.markdown.includes("# Stryde Financial Summary"), "markdown has a title");
  assert.ok(summary.markdown.includes("## Accounts") && summary.markdown.includes("## Debts"), "markdown has sections");
  assert.ok(summary.markdown.includes("Spending") && summary.markdown.includes("Visa"), "markdown lists real records");
  assert.ok(summary.markdown.includes("Car Repair"), "one-time bill appears under upcoming payments");
  assert.ok(/Available now:/.test(summary.markdown), "snapshot present");

  // Biweekly income averages 26/12, not ×2 (2977 * 26/12 = 6450.17).
  assert.ok(summary.markdown.includes("$6,450.17"), "biweekly income averaged as 26/12, not doubled");
  // Discretionary-spending blindness is called out so an AI won't treat surplus as free.
  assert.ok(/discretionary/i.test(summary.markdown), "export warns it omits discretionary spending");

  // Every projection row must reconcile: start + income - bills = end.
  const projRows = enrichBreakdown(getPayPeriodBreakdown(ctx), ctx);
  projRows.forEach((r) => {
    const end = r.startBalance + (r.pendingIncome || 0) - (r.billsForEndBalance || 0);
    assert.equal(Number(end.toFixed(2)), Number(r.endBalance.toFixed(2)),
      `projection row ${r.period.start_date} reconciles start+income-bills=end`);
  });

  // CSV: header + one row per record, quoting fields that contain commas.
  const lines = summary.csv.split("\n");
  assert.equal(lines[0], "Category,Name,Amount,Detail,Balance", "csv header");
  assert.ok(lines.some((l) => l.startsWith("Account,Spending,")), "csv has account rows");
  assert.ok(lines.some((l) => l.startsWith("Debt,Visa,")), "csv has debt rows");
  assert.ok(lines.length > 6, "csv has multiple line items");
}

console.log("✓ financial summary export tests passed");

// ── Debt term / months-remaining → estimated payoff date in the export ───────
{
  const summary = buildFinancialSummary({
    accounts, income, bills, rows,
    debts: [{ id: "auto", name: "Auto Loan", balance: 18000, interest_rate: 0.069, minimum_payment: 420, term_months: 60, months_remaining: 5, is_paid_off: false }],
    snapshot: getMonthlyProjection(rows, ctx),
    generatedAt: "2026-07-09", // + 5 months → Dec 2026
  });
  assert.ok(/Est\. payoff/.test(summary.markdown), "debt table has a payoff column");
  assert.ok(summary.markdown.includes("5 / 60"), "shows months remaining of term");
  assert.ok(summary.markdown.includes("Dec 2026"), "payoff date = generated month + months remaining");
  assert.ok(summary.csv.split("\n").some((l) => l.includes("payoff Dec 2026")), "csv debt row includes payoff date");
}

console.log("✓ debt payoff-date tests passed");

// ── Discretionary estimate, original balance, honest account labels ──────────
{
  const withDisc = buildFinancialSummary({
    accounts: [
      { id: "sp", name: "Spending", current_balance: 500, is_primary: true, account_type: "checking" },
      { id: "sav", name: "Travis Savings", current_balance: 10, account_type: "savings" },
      { id: "esc", name: "Mortgage", current_balance: 55, is_accumulating: true, accumulation_target: 2000, account_type: "savings" },
    ],
    income, bills, rows,
    debts: [{ id: "auto", name: "Auto Loan", balance: 18000, original_balance: 30000, interest_rate: 0.069, minimum_payment: 420, term_months: 60, months_remaining: 40, is_paid_off: false }],
    snapshot: getMonthlyProjection(rows, ctx),
    generatedAt: "2026-07-09",
    monthlyDiscretionary: 2500,
  });
  // Account labels must reflect the account's own type, not a "bills" guess.
  assert.ok(withDisc.markdown.includes("| Travis Savings | $10.00 | savings |"), "savings account labeled savings, not bills");
  assert.ok(/Mortgage \| \$55\.00 \| sinking fund/.test(withDisc.markdown), "accumulating account labeled sinking fund");
  assert.ok(withDisc.markdown.includes("primary checking (spending)"), "primary labeled spending");
  // Discretionary flows through and produces a free-cash line.
  assert.ok(withDisc.markdown.includes("Self-reported discretionary spending:"), "discretionary shown");
  assert.ok(/Estimated monthly free cash/.test(withDisc.markdown), "free-cash line present");
  assert.ok(withDisc.csv.split("\n").some((l) => l.startsWith("Spending,Discretionary")), "csv has a discretionary row");
  // Original balance appears in the debts table.
  assert.ok(withDisc.markdown.includes("$30,000.00"), "original balance shown in debts");

  // Without a discretionary estimate, the strong blindness warning stays.
  const noDisc = buildFinancialSummary({ accounts, income, bills, debts: [], rows, snapshot: getMonthlyProjection(rows, ctx), generatedAt: "2026-07-09" });
  assert.ok(/does NOT include discretionary/i.test(noDisc.markdown), "blindness warning present when no estimate given");
}

console.log("✓ planning-fields export tests passed");

// ── Open-ended savings projection ─────────────────────────────────────────────
// A bill that transfers into a plain savings account is "paying yourself": it
// reduces available money (billsTotal) AND grows a projected savings balance,
// with no goal cap. Verifies the savings balance accumulates period over period.
{
  const svAccounts = [
    { id: "spend", name: "Spending", current_balance: 1000, is_primary: true, is_accumulating: false, account_type: "checking" },
    { id: "sav", name: "Emergency Fund", current_balance: 4000, is_accumulating: false, account_type: "savings" },
  ];
  const svPeriods = [
    { id: "p1", start_date: "2026-07-02", end_date: "2026-07-15" }, // current
    { id: "p2", start_date: "2026-07-16", end_date: "2026-07-29" },
    { id: "p3", start_date: "2026-07-30", end_date: "2026-08-12" },
  ];
  const svIncome = [
    { id: "pay", name: "Payroll", fixed_amount: 2000, frequency: "biweekly", next_pay_date: "2026-07-02" },
  ];
  const svBills = [
    // $300 into savings every paycheck
    { id: "save", name: "Savings", amount: 300, frequency: "payday", account_id: "spend", transfer_to_account_id: "sav" },
  ];
  const svCtx = {
    payPeriods: svPeriods, income: svIncome, bills: svBills, accounts: svAccounts,
    billPayments: {}, skippedBillPeriods: new Set(), earlyPayments: new Set(),
    transfers: {}, today: TODAY,
  };
  const svRows = enrichBreakdown(getPayPeriodBreakdown(svCtx), svCtx);

  assert.equal(svRows[0].savingsStart, 4000, "savings starts at current balance");
  assert.equal(svRows[0].savingsAdded, 300, "each period adds the savings transfer");
  assert.equal(svRows[0].savingsEnd, 4300, "savings grows by 300 in period 1");
  assert.equal(svRows[1].savingsStart, 4300, "period 2 starts where period 1 ended");
  assert.equal(svRows[2].savingsEnd, 4900, "savings compounds across all 3 periods");

  // The savings transfer still reduces leftover (money left checking).
  assert.equal(svRows[0].billsTotal, 300, "savings transfer counts as an outflow");

  // One savings contribution row surfaces per period for the UI.
  assert.equal(svRows[0].savingsContributions.length, 1, "one savings contribution row");
  assert.equal(svRows[0].savingsContributions[0].name, "Emergency Fund", "named for the destination account");

  const svProj = getMonthlyProjection(svRows, svCtx);
  assert.equal(svProj.savingsNow, 4000, "projection reports current savings");
  assert.equal(svProj.projectedSavings, 4900, "projection reports end-of-window savings");

  // Category-driven linking: a bill whose category is "Savings" and whose account
  // IS a savings account counts without needing transfer_to_account_id.
  const catBills = [
    { id: "save2", name: "Savings", amount: 300, frequency: "payday", account_id: "sav", category: "Savings" },
  ];
  const catCtx = { ...svCtx, bills: catBills };
  const catRows = enrichBreakdown(getPayPeriodBreakdown(catCtx), catCtx);
  assert.equal(catRows[0].savingsAdded, 300, "category=Savings bill linked by category, no checkbox");
  assert.equal(catRows[2].savingsEnd, 4900, "category-driven savings compounds the same way");

  // A savings-category bill pointing at a non-savings account does NOT count
  // (prevents mis-flagging a normal bill as savings).
  const badCtx = {
    ...svCtx,
    bills: [{ id: "x", name: "Savings", amount: 300, frequency: "payday", account_id: "spend", category: "Savings" }],
  };
  const badRows = enrichBreakdown(getPayPeriodBreakdown(badCtx), badCtx);
  assert.equal(badRows[0].savingsAdded, 0, "category=Savings but account isn't savings → not counted");

  console.log("✓ open-ended savings projection tests passed");
}

// ── Distribution plan ─────────────────────────────────────────────────────────
// Each payday's money is MOVED out of checking into the accounts that fund the
// bills: a dedicated "bills" account, savings, an envelope. The card shows how
// much to move where. Bills paid straight from checking need no move and land in
// a "from checking" bucket. Group amounts sum to billsTotal.
{
  const trAccounts = [
    { id: "chk", name: "Checking", current_balance: 3000, is_primary: true, is_accumulating: false, account_type: "checking" },
    { id: "wbills", name: "Wiley Bills", current_balance: 0, is_primary: false, is_accumulating: false, account_type: "checking" },
    { id: "env", name: "Food/Gas", current_balance: 200, is_primary: false, is_accumulating: false, account_type: "checking" },
    { id: "sav", name: "Savings", current_balance: 5000, is_primary: false, is_accumulating: false, account_type: "savings" },
    { id: "goal", name: "Car Fund", current_balance: 0, is_primary: false, is_accumulating: true, account_type: "savings", accumulation_target: 6000 },
  ];
  const trPeriods = [{ id: "p1", start_date: "2026-07-02", end_date: "2026-07-15" }];
  const trIncome = [{ id: "pay", name: "Payroll", fixed_amount: 7514, frequency: "biweekly", next_pay_date: "2026-07-02" }];
  const trBills = [
    { id: "rent", name: "Rent", amount: 1500, frequency: "payday", account_id: "wbills" },   // funded via Wiley Bills
    { id: "aps", name: "APS", amount: 1080, frequency: "payday", account_id: "wbills" },      // funded via Wiley Bills
    { id: "food", name: "Food", amount: 500, frequency: "payday", account_id: "env" },        // funded via Food/Gas
    { id: "gas", name: "Gas", amount: 300, frequency: "payday", account_id: "env" },          // funded via Food/Gas
    { id: "save", name: "Savings", amount: 4000, frequency: "payday", account_id: "chk", transfer_to_account_id: "sav" }, // → Savings
    { id: "netflix", name: "Netflix", amount: 20, frequency: "payday", account_id: "chk" },   // straight from checking
  ];
  const trCtx = {
    payPeriods: trPeriods, income: trIncome, bills: trBills, accounts: trAccounts,
    billPayments: {}, skippedBillPeriods: new Set(), earlyPayments: new Set(),
    transfers: {}, today: TODAY,
  };
  const r = getPayPeriodBreakdown(trCtx)[0];
  const byId = Object.fromEntries(r.distribution.map((g) => [g.accountId ?? "__checking", g]));

  assert.equal(r.billsTotal, 7400, "billsTotal = every unpaid bill");
  assert.equal(byId.wbills.amount, 2580, "Rent+APS roll into the Wiley Bills move");
  assert.equal(byId.env.amount, 800, "Food+Gas roll into the Food/Gas move");
  assert.equal(byId.sav.amount, 4000, "Savings transfer on its own");
  assert.equal(byId.sav.isSavings, true, "savings destination flagged");
  assert.equal(byId.__checking.amount, 20, "Netflix is paid straight from checking");
  assert.equal(byId.__checking.isChecking, true, "checking bucket flagged");
  assert.equal(r.distribution.reduce((s, g) => s + g.amount, 0), r.billsTotal, "moves sum to billsTotal");
  // Sorted most-money-first.
  assert.equal(r.distribution[0].accountId, "sav", "largest move (Savings) first");

  // Accumulating (goal) destinations are excluded — funded via Set Aside rows.
  const goalCtx = { ...trCtx, bills: [{ id: "car", name: "Car", amount: 500, frequency: "payday", transfer_to_account_id: "goal" }] };
  const gr = getPayPeriodBreakdown(goalCtx)[0];
  assert.equal(gr.distribution.length, 0, "goal-destined money is not in the distribution plan");

  // is_transfer breaks an item out of its funding account into its own line, so
  // Food/Gas drafted from the SAME bills account still show separately.
  const breakoutCtx = {
    ...trCtx,
    bills: [
      { id: "rent", name: "Rent", amount: 1500, frequency: "payday", account_id: "wbills" },
      { id: "food", name: "Food", amount: 500, frequency: "payday", account_id: "wbills", is_transfer: true },
      { id: "gas", name: "Gas", amount: 300, frequency: "payday", account_id: "wbills", is_transfer: true },
    ],
  };
  const br = getPayPeriodBreakdown(breakoutCtx)[0];
  const brById = Object.fromEntries(br.distribution.map((g) => [g.accountId ?? g.name, g]));
  assert.equal(brById.wbills.amount, 1500, "Rent stays under Wiley Bills");
  assert.equal(brById.Food.amount, 500, "Food broke out as its own move line");
  assert.equal(brById.Gas.amount, 300, "Gas broke out as its own move line");
  assert.equal(br.distribution.reduce((s, g) => s + g.amount, 0), br.billsTotal, "still sums to billsTotal");

  console.log("✓ distribution plan tests passed");
}
