// Stryde finance engine — pure functions, no React, no platform APIs.
//
// Everything takes an explicit `ctx` so the same math runs identically on web
// and mobile. Keeping this UI-free is the whole point: the numbers can never
// drift between the two apps, and the logic is testable in isolation.
//
// ctx shape (all optional unless noted):
//   payPeriods        [{ id, start_date, end_date }]           (required)
//   income            [{ id, name, fixed_amount, frequency, next_pay_date }]
//   bills             [{ id, name, amount, frequency, due_day, due_day_2,
//                        due_month, account_id, transfer_to_account_id, is_active }]
//   accounts          [{ id, name, current_balance, is_primary, is_accumulating,
//                        accumulation_target, due_day, minimum_buffer }]
//   billPayments      { `${billId}-${periodStart}`: { is_paid, paid_amount } }
//   skippedBillPeriods Set of `${billId}-${periodStart}`
//   earlyPayments      Set of `${incomeId}-${periodStart}`  (income marked "Got Paid")
//   transfers          { [accountId]: amount }  — WTMG transfers for the CURRENT period
//   today              Date (defaults to now)

import { localDateStr, startOfToday } from "./dates.js";

// ── Payment record helpers ───────────────────────────────────────────────────

export function getBillPaymentRecord(billPayments, billId, periodStart) {
  return (billPayments || {})[`${billId}-${periodStart}`] || null;
}

export function isBillPaidInPeriod(billPayments, billId, periodStart) {
  const p = getBillPaymentRecord(billPayments, billId, periodStart);
  return p ? (p.is_paid || (p.paid_amount || 0) > 0) : false;
}

export function getBillPaidAmount(billPayments, billId, periodStart) {
  const p = getBillPaymentRecord(billPayments, billId, periodStart);
  return p ? (p.paid_amount || 0) : 0;
}

export function isBillSkipped(skippedBillPeriods, billId, periodStart) {
  return !!(skippedBillPeriods && skippedBillPeriods.has(`${billId}-${periodStart}`));
}

// ── Bill scheduling ──────────────────────────────────────────────────────────

/** Does a bill with this due_day land inside [periodStart, periodEnd]? */
function dueDayInPeriod(day, periodStart, periodEnd) {
  if (!day) return false;
  const thisMonth = new Date(periodStart.getFullYear(), periodStart.getMonth(), day, 23, 59, 59);
  const nextMonth = new Date(periodStart.getFullYear(), periodStart.getMonth() + 1, day, 23, 59, 59);
  return (
    (thisMonth >= periodStart && thisMonth <= periodEnd) ||
    (nextMonth >= periodStart && nextMonth <= periodEnd)
  );
}

/** Is this bill due within the given pay period? Handles every frequency. */
export function isBillDueInPeriod(bill, periodStart, periodEnd) {
  const freq = bill.frequency || "monthly";

  // Every paycheck — always lands in every period.
  if (freq === "biweekly" || freq === "payday") return true;

  if (freq === "quarterly") {
    if (!bill.due_month || !bill.due_day) return false;
    const startMonth = bill.due_month - 1;
    return [0, 3, 6, 9].some((offset) => {
      const m = (startMonth + offset) % 12;
      const y = periodStart.getFullYear() + (startMonth + offset >= 12 ? 1 : 0);
      const d = new Date(y, m, bill.due_day, 23, 59, 59);
      return d >= periodStart && d <= periodEnd;
    });
  }

  if (freq === "annually") {
    if (!bill.due_month || !bill.due_day) return false;
    const thisYear = new Date(periodStart.getFullYear(), bill.due_month - 1, bill.due_day, 23, 59, 59);
    const nextYear = new Date(periodStart.getFullYear() + 1, bill.due_month - 1, bill.due_day, 23, 59, 59);
    return (
      (thisYear >= periodStart && thisYear <= periodEnd) ||
      (nextYear >= periodStart && nextYear <= periodEnd)
    );
  }

  if (freq === "semi-monthly") {
    return dueDayInPeriod(bill.due_day, periodStart, periodEnd) ||
           dueDayInPeriod(bill.due_day_2, periodStart, periodEnd);
  }

  return dueDayInPeriod(bill.due_day, periodStart, periodEnd);
}

/** The date a bill effectively hits within a period — used only for sorting. */
function billActualDate(bill, periodStart, periodEnd) {
  const freq = bill.frequency || "monthly";
  if (freq === "payday" || freq === "biweekly") return periodStart;
  if (!bill.due_day) return periodEnd;
  const thisMonth = new Date(periodStart.getFullYear(), periodStart.getMonth(), bill.due_day);
  const nextMonth = new Date(periodStart.getFullYear(), periodStart.getMonth() + 1, bill.due_day);
  if (thisMonth >= periodStart && thisMonth <= periodEnd) return thisMonth;
  if (nextMonth >= periodStart && nextMonth <= periodEnd) return nextMonth;
  return nextMonth;
}

// ── Income scheduling ────────────────────────────────────────────────────────

/** All deposits for one income source landing inside a period. */
function incomeItemsInPeriod(inc, periodStart, periodEnd) {
  const out = [];
  if (!inc.next_pay_date || !inc.fixed_amount) return out;

  const baseDate = new Date(inc.next_pay_date + "T12:00:00");
  const interval = inc.frequency === "weekly" ? 7 : inc.frequency === "biweekly" ? 14 : 0;

  if (interval === 0) {
    // Monthly — the pay day may fall in the period's start month or end month.
    const payDay = baseDate.getDate();
    [
      new Date(periodStart.getFullYear(), periodStart.getMonth(), payDay, 12, 0, 0),
      new Date(periodEnd.getFullYear(), periodEnd.getMonth(), payDay, 12, 0, 0),
    ].forEach((d) => {
      if (d >= periodStart && d <= periodEnd) {
        out.push({ ...inc, actualPayDate: localDateStr(d) });
      }
    });
    return out;
  }

  // Walk back to at-or-before periodEnd, then sweep forward.
  let payDate = new Date(baseDate);
  while (payDate > periodEnd) payDate.setDate(payDate.getDate() - interval);
  while (payDate <= periodEnd) {
    if (payDate >= periodStart) {
      out.push({ ...inc, actualPayDate: localDateStr(payDate) });
    }
    payDate = new Date(payDate);
    payDate.setDate(payDate.getDate() + interval);
  }
  return out;
}

// ── Accumulating-account contributions ("Set Aside") ─────────────────────────

function buildContributions(ctx, upcomingPeriods, today) {
  const { accounts = [], bills = [] } = ctx;
  const contributions = [];
  const covered = new Set();

  const periodsUntil = (dueDate) => {
    let count = 0;
    for (const p of upcomingPeriods) {
      count++;
      if (dueDate <= new Date(p.end_date + "T23:59:59")) break;
    }
    return Math.max(1, count);
  };

  const nextDue = (day) => {
    let d = new Date(today.getFullYear(), today.getMonth(), day);
    if (d <= today) d = new Date(today.getFullYear(), today.getMonth() + 1, day);
    return d;
  };

  // Account-driven: accumulating account with a due_day + target.
  accounts.forEach((acct) => {
    if (!acct.is_accumulating || !acct.due_day || !acct.accumulation_target) return;
    const target = acct.accumulation_target;
    const saved = Math.min(acct.current_balance || 0, target);
    const stillNeeded = Math.max(0, target - saved);
    if (stillNeeded === 0) return;
    const dueDate = nextDue(acct.due_day);
    covered.add(acct.id);
    contributions.push({
      name: acct.name,
      amount: stillNeeded / periodsUntil(dueDate),
      dueDate, saved, target, accountId: acct.id,
    });
  });

  // Bill-driven: a bill that transfers into an accumulating account.
  bills.forEach((bill) => {
    if (!bill.transfer_to_account_id) return;
    const dest = accounts.find((a) => a.id === bill.transfer_to_account_id);
    if (!dest?.is_accumulating) return;
    if (covered.has(dest.id)) return;
    const target = bill.amount;
    const saved = Math.min(dest.current_balance || 0, target);
    const stillNeeded = Math.max(0, target - saved);
    if (stillNeeded === 0) return;
    const dueDate = nextDue(bill.due_day);
    covered.add(dest.id);
    contributions.push({
      name: dest.name,
      amount: stillNeeded / periodsUntil(dueDate),
      dueDate, saved, target, accountId: dest.id,
    });
  });

  return contributions;
}

// ── Pay period breakdown ─────────────────────────────────────────────────────

/**
 * Build the upcoming pay periods with their income + bills.
 * Returns items: { period, isCurrentPeriod, income, incomeItems, bills, billsTotal, leftOver, contributions }
 */
export function getPayPeriodBreakdown(ctx, limit = 10) {
  const { payPeriods = [], income = [], bills = [], billPayments = {} } = ctx;
  const today = ctx.today ? new Date(ctx.today) : startOfToday();
  today.setHours(0, 0, 0, 0);

  const upcomingPeriods = [...payPeriods]
    .filter((p) => new Date(p.end_date + "T12:00:00") >= today)
    .sort((a, b) => new Date(a.start_date) - new Date(b.start_date))
    .slice(0, limit);

  const allContributions = buildContributions(ctx, upcomingPeriods, today);

  return upcomingPeriods.map((period) => {
    const periodStart = new Date(period.start_date + "T00:00:00");
    const periodEnd = new Date(period.end_date + "T23:59:59");

    let periodIncome = 0;
    const periodIncomeItems = [];
    income.forEach((inc) => {
      const items = incomeItemsInPeriod(inc, periodStart, periodEnd);
      items.forEach((it) => {
        periodIncome += inc.fixed_amount;
        periodIncomeItems.push(it);
      });
    });

    const periodBills = bills
      .filter((b) => b.is_active !== false)
      .filter((b) => isBillDueInPeriod(b, periodStart, periodEnd))
      .sort((a, b) => {
        const da = billActualDate(a, periodStart, periodEnd);
        const db = billActualDate(b, periodStart, periodEnd);
        if (da - db !== 0) return da - db;
        return (a.name || "").localeCompare(b.name || "");
      });

    // Nets out anything already paid for this period.
    const billsTotal = periodBills.reduce((sum, b) => {
      const paid = getBillPaidAmount(billPayments, b.id, period.start_date);
      return sum + ((b.amount || 0) - paid);
    }, 0);

    return {
      period,
      isCurrentPeriod: periodStart <= today && periodEnd >= today,
      income: periodIncome,
      incomeItems: periodIncomeItems,
      bills: periodBills,
      billsTotal,
      leftOver: periodIncome - billsTotal,
      contributions: allContributions.filter((c) => periodStart < c.dueDate),
    };
  });
}

// ── End balance chain ────────────────────────────────────────────────────────

/** Sum of the primary (non-accumulating) account balances. */
export function getPrimaryBalance(accounts = []) {
  return accounts
    .filter((a) => a.is_primary && !a.is_accumulating)
    .reduce((sum, a) => sum + (a.current_balance || 0), 0);
}

/**
 * The bills a period subtracts from the running balance.
 *
 * Accumulating accounts are excluded — they're funded gradually via their own
 * contribution rows, not by subtracting the whole bill.
 *
 * For the CURRENT period, bills paid out of a non-primary "bills" account are
 * excluded once the WTMG transfer is confirmed: the live primary balance already
 * dropped when that money moved, so subtracting the bills too would double-count.
 *
 * For FUTURE periods no transfer is modelled and the running balance is the whole
 * money pool, so the bill itself is the outflow — always subtract it.
 */
export function getBillsForEndBalance(item, ctx) {
  const { accounts = [], billPayments = {}, skippedBillPeriods, transfers = {} } = ctx;
  const periodKey = item.period.start_date;
  const isCurrent = item.isCurrentPeriod;

  // Unpaid totals per account, for the current-period transfer check.
  const unpaidByAcct = {};
  if (isCurrent) {
    item.bills.forEach((b) => {
      if (isBillSkipped(skippedBillPeriods, b.id, periodKey)) return;
      if (isBillPaidInPeriod(billPayments, b.id, periodKey)) return;
      if (!b.account_id) return;
      unpaidByAcct[b.account_id] = (unpaidByAcct[b.account_id] || 0) + (b.amount || 0);
    });
  }

  return item.bills
    .filter((b) => {
      if (isBillSkipped(skippedBillPeriods, b.id, periodKey)) return false;
      if (isBillPaidInPeriod(billPayments, b.id, periodKey)) return false;
      if (b.account_id) {
        const acct = accounts.find((a) => a.id === b.account_id);
        if (acct?.is_accumulating) return false;
        const isPrimary = acct?.is_primary && !acct?.is_accumulating;
        if (!isPrimary && isCurrent) {
          const transferred = transfers[b.account_id] || 0;
          const totalForAcct = unpaidByAcct[b.account_id] || 0;
          if (transferred >= totalForAcct) return false;
        }
      }
      return true;
    })
    .reduce((sum, b) => sum + (b.amount || 0), 0);
}

/**
 * Chain the running balance across periods.
 * Adds: startBalance, pendingIncome, billsDeducted, billsForEndBalance, endBalance, isCurrent.
 */
export function enrichBreakdown(breakdown, ctx) {
  const { accounts = [], billPayments = {}, skippedBillPeriods, earlyPayments } = ctx;
  const today = ctx.today ? new Date(ctx.today) : new Date();

  let runningBalance = getPrimaryBalance(accounts);

  return breakdown.map((item) => {
    const isCurrent = item.isCurrentPeriod;
    const startBalance = runningBalance;
    const periodKey = item.period.start_date;

    // Current period: the primary balance already includes income that landed.
    // Only count deposits still to come. Future periods: count it all, minus
    // anything already marked received early (it's in the balance already).
    const pendingIncome = isCurrent
      ? item.incomeItems
          .filter((inc) => {
            if (earlyPayments?.has(`${inc.id}-${periodKey}`)) return false;
            return inc.actualPayDate && new Date(inc.actualPayDate + "T12:00:00") > today;
          })
          .reduce((sum, inc) => sum + (inc.fixed_amount || 0), 0)
      : item.incomeItems
          .filter((inc) => !earlyPayments?.has(`${inc.id}-${periodKey}`))
          .reduce((sum, inc) => sum + (inc.fixed_amount || 0), 0);

    // Bills tile: unpaid amounts, minus anything skipped.
    const skippedUnpaid = item.bills
      .filter((b) => isBillSkipped(skippedBillPeriods, b.id, periodKey))
      .reduce((sum, b) => sum + ((b.amount || 0) - getBillPaidAmount(billPayments, b.id, periodKey)), 0);
    const billsDeducted = item.billsTotal - skippedUnpaid;

    const billsForEndBalance = getBillsForEndBalance(item, ctx);
    const endBalance = startBalance + pendingIncome - billsForEndBalance;
    runningBalance = endBalance;

    return { ...item, startBalance, pendingIncome, billsDeducted, billsForEndBalance, endBalance, isCurrent };
  });
}

// ── Monthly Projection (the 4 dashboard tiles) ───────────────────────────────

/**
 * The four tiles, which must always tie out as:
 *   availableThisMonth = availableNow + incomeThisMonth - billsRemaining
 *
 * billsRemaining = unpaid bills for the current period plus any upcoming period
 * that ENDS within this calendar month. A period that merely *starts* this month
 * but ends in the next (e.g. Jul 30 - Aug 12) belongs to next month.
 */
export function getMonthlyProjection(rows, ctx) {
  const { accounts = [], earlyPayments } = ctx;
  const today = ctx.today ? new Date(ctx.today) : new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const monthEndDate = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);

  const availableNow = getPrimaryBalance(accounts);

  // Deposits still to land, inside this calendar month, not already received.
  const incomeThisMonth = rows
    .flatMap((item) => item.incomeItems.map((inc) => ({ ...inc, _ps: item.period.start_date })))
    .filter((inc) => {
      if (!inc.actualPayDate) return false;
      const d = new Date(inc.actualPayDate + "T12:00:00");
      if (!(d.getMonth() === currentMonth && d.getFullYear() === currentYear && d > today)) return false;
      if (earlyPayments?.has(`${inc.id}-${inc._ps}`)) return false;
      return true;
    })
    .reduce((sum, inc) => sum + (inc.fixed_amount || 0), 0);

  const billsRemaining = rows
    .filter((item) => {
      if (item.isCurrent) return true;
      const pStart = new Date(item.period.start_date + "T00:00:00");
      const pEnd = new Date(item.period.end_date + "T23:59:59");
      return pStart > today && pEnd <= monthEndDate;
    })
    .reduce((sum, item) => sum + (item.billsDeducted || 0), 0);

  return {
    availableNow,
    incomeThisMonth,
    billsRemaining,
    availableThisMonth: availableNow + incomeThisMonth - billsRemaining,
  };
}

// ── Where The Money Goes ─────────────────────────────────────────────────────

/**
 * The single total to move to cover a period's bills.
 *
 * We deliberately do NOT route this per account: users know their own setup and
 * distribute it themselves. Bills funded gradually through an accumulating
 * account are excluded; already paid/skipped bills don't need funding.
 */
export function getBillsToTransfer(item, ctx) {
  const { accounts = [], billPayments = {}, skippedBillPeriods } = ctx;
  const periodKey = item.period.start_date;

  return (item.bills || []).reduce((sum, bill) => {
    if (isBillSkipped(skippedBillPeriods, bill.id, periodKey)) return sum;
    if (isBillPaidInPeriod(billPayments, bill.id, periodKey)) return sum;
    if (bill.transfer_to_account_id) {
      const dest = accounts.find((a) => a.id === bill.transfer_to_account_id);
      if (dest?.is_accumulating) return sum;
      return sum + (bill.amount || 0);
    }
    const acct = accounts.find((a) => a.id === bill.account_id);
    if (acct?.is_accumulating) return sum;
    return sum + (bill.amount || 0);
  }, 0);
}

// ── Monthly Overview ─────────────────────────────────────────────────────────

/** Group bills the way the Monthly Overview page shows them. */
export function groupBillsForOverview(bills = []) {
  const active = bills.filter((b) => b.is_active !== false);
  return {
    everyPaycheck: active.filter((b) => (b.frequency || "monthly") === "payday"),
    firstHalf: active.filter((b) => (b.frequency || "monthly") === "monthly" && b.due_day >= 1 && b.due_day <= 15),
    secondHalf: active.filter((b) => (b.frequency || "monthly") === "monthly" && b.due_day >= 16 && b.due_day <= 31),
    noDueDay: active.filter((b) => (b.frequency || "monthly") === "monthly" && !b.due_day),
  };
}

/** Monthly income / bills / remaining totals for the Monthly Overview page. */
export function getMonthlyTotals(ctx) {
  const { income = [], bills = [] } = ctx;
  const monthlyIncome = income.reduce(
    (sum, i) => sum + (i.fixed_amount || 0) * incMultiplierOf(i.frequency),
    0
  );
  const monthlyBills = bills
    .filter((b) => b.is_active !== false)
    .reduce((sum, b) => sum + (b.amount || 0) * billMultiplierOf(b.frequency), 0);
  const remaining = monthlyIncome - monthlyBills;
  return { monthlyIncome, monthlyBills, remaining, annual: remaining * 12 };
}

function incMultiplierOf(freq) {
  if (freq === "biweekly") return 2;
  if (freq === "weekly") return 4;
  return 1;
}
function billMultiplierOf(freq) {
  if (freq === "payday" || freq === "biweekly") return 2;
  return 1;
}
