// Builds a human- and AI-readable summary of a household's finances, plus a
// spreadsheet-friendly CSV. Pure and self-contained: give it the raw records
// and the already-computed projection numbers, get back { markdown, csv }.
//
// The multipliers mirror the app's own tile math (biweekly counted as 2/month)
// so the summary's totals match what users see on screen.

const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function fmtMoney(n) {
  const v = Number(n) || 0;
  return (v < 0 ? "-$" : "$") + Math.abs(v).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// "2026-08-20" -> "Aug 20, 2026" (noon avoids TZ drift). Falls back to input.
function fmtDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T12:00:00");
  if (isNaN(d)) return String(dateStr);
  return `${MONTHS_SHORT[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}
function fmtShort(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T12:00:00");
  if (isNaN(d)) return String(dateStr);
  return `${MONTHS_SHORT[d.getMonth()]} ${d.getDate()}`;
}

function incomePerMonth(i) {
  const f = i.frequency;
  const m = f === "biweekly" ? 2 : f === "weekly" ? 4 : f === "semi-monthly" ? 2 : 1;
  return (i.fixed_amount || 0) * m;
}
function billPerMonth(b) {
  const f = b.frequency || "monthly";
  if (f === "one-time") return 0;
  const m =
    f === "payday" || f === "biweekly" ? 2 :
    f === "semi-monthly" ? 2 :
    f === "quarterly" ? 1 / 3 :
    f === "annually" ? 1 / 12 : 1;
  return (b.amount || 0) * m;
}
function billCadence(b) {
  const f = b.frequency || "monthly";
  if (f === "one-time") return b.due_date ? `one-time ${fmtShort(b.due_date)}` : "one-time";
  if (f === "payday") return "every payday";
  if (f === "biweekly") return "biweekly";
  if (f === "weekly") return "weekly";
  if (f === "semi-monthly") return `semi-monthly (${b.due_day} & ${b.due_day_2})`;
  if (f === "quarterly") return "quarterly";
  if (f === "annually") return "annually";
  return b.due_day ? `monthly (due ${b.due_day})` : "monthly";
}
function acctKind(a) {
  if (a.is_accumulating) return "savings/accumulating";
  if (a.is_primary) return "primary/spending";
  return "bills";
}
function pct(rate) {
  if (rate == null) return "";
  return `${(rate * 100).toFixed(2).replace(/\.00$/, "")}%`;
}
// Estimated payoff month = base date + N months, as "Mon YYYY".
function payoffLabel(monthsRemaining, fromISO) {
  const m = Number(monthsRemaining);
  if (!m || m <= 0 || !fromISO) return "";
  const base = new Date(fromISO + "T12:00:00");
  if (isNaN(base)) return "";
  const d = new Date(base.getFullYear(), base.getMonth() + m, 1);
  return `${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`;
}

export function buildFinancialSummary({
  accounts = [], income = [], bills = [], debts = [], rows = [],
  snapshot = null, generatedAt = null,
} = {}) {
  const openDebts = debts.filter((d) => !d.is_paid_off);
  const recurringBills = bills.filter((b) => b.is_active !== false && (b.frequency || "monthly") !== "one-time");
  const oneTimeBills = bills.filter((b) => b.is_active !== false && (b.frequency || "monthly") === "one-time");

  const totalAccounts = accounts.reduce((s, a) => s + (a.current_balance || 0), 0);
  const totalDebt = openDebts.reduce((s, d) => s + (d.balance || 0), 0);
  const totalMinPayments = openDebts.reduce((s, d) => s + (d.minimum_payment || 0), 0);
  const monthlyIncome = income.filter((i) => i.is_active !== false).reduce((s, i) => s + incomePerMonth(i), 0);
  const monthlyBills = recurringBills.reduce((s, b) => s + billPerMonth(b), 0);
  const genISO = generatedAt ? (typeof generatedAt === "string" ? generatedAt.slice(0, 10) : toISO(generatedAt)) : null;
  const genStr = genISO ? fmtDate(genISO) : "";

  // ── Markdown ───────────────────────────────────────────────────────────────
  const md = [];
  md.push("# Stryde Financial Summary");
  if (genStr) md.push(`_Generated ${genStr}_`);
  md.push("");
  md.push("You are helping me plan my personal finances. Below is a snapshot of my accounts, income, bills, debts, and my upcoming pay-period projection from my budgeting app. Please review it and help me with budgeting, saving, and debt payoff. Ask me anything you need.");
  md.push("");

  md.push("## Snapshot");
  if (snapshot) {
    md.push(`- **Available now:** ${fmtMoney(snapshot.availableNow)}`);
    md.push(`- **Income remaining this month:** ${fmtMoney(snapshot.incomeThisMonth)}`);
    md.push(`- **Bills remaining this month:** ${fmtMoney(snapshot.billsRemaining)}`);
    md.push(`- **Projected available this month:** ${fmtMoney(snapshot.availableThisMonth)}`);
  }
  md.push(`- **Total across accounts:** ${fmtMoney(totalAccounts)}`);
  md.push(`- **Total debt (open):** ${fmtMoney(totalDebt)}`);
  md.push(`- **Net position:** ${fmtMoney(totalAccounts - totalDebt)}`);
  md.push(`- **Recurring monthly income:** ${fmtMoney(monthlyIncome)}`);
  md.push(`- **Recurring monthly bills:** ${fmtMoney(monthlyBills)}`);
  md.push("");

  md.push("## Accounts");
  if (accounts.length) {
    md.push("| Account | Balance | Type |");
    md.push("|---|---|---|");
    accounts.forEach((a) => md.push(`| ${a.name} | ${fmtMoney(a.current_balance)} | ${acctKind(a)} |`));
  } else md.push("_None_");
  md.push("");

  md.push("## Income");
  if (income.length) {
    md.push("| Source | Per check | Frequency | Monthly |");
    md.push("|---|---|---|---|");
    income.filter((i) => i.is_active !== false).forEach((i) =>
      md.push(`| ${i.name} | ${fmtMoney(i.fixed_amount)} | ${i.frequency || "monthly"} | ${fmtMoney(incomePerMonth(i))} |`));
    md.push(`| **Total** | | | **${fmtMoney(monthlyIncome)}** |`);
  } else md.push("_None_");
  md.push("");

  md.push("## Bills");
  md.push(`Recurring monthly obligation: **${fmtMoney(monthlyBills)}**`);
  md.push("");
  if (recurringBills.length) {
    md.push("| Bill | Amount | Cadence | Account |");
    md.push("|---|---|---|---|");
    recurringBills
      .slice()
      .sort((a, b) => (b.amount || 0) - (a.amount || 0))
      .forEach((b) => md.push(`| ${b.name} | ${fmtMoney(b.amount)} | ${billCadence(b)} | ${acctName(accounts, b.account_id)} |`));
  } else md.push("_No recurring bills_");
  md.push("");
  if (oneTimeBills.length) {
    md.push("**Upcoming one-time payments:**");
    md.push("");
    md.push("| Payment | Amount | Date |");
    md.push("|---|---|---|");
    oneTimeBills
      .slice()
      .sort((a, b) => String(a.due_date).localeCompare(String(b.due_date)))
      .forEach((b) => md.push(`| ${b.name} | ${fmtMoney(b.amount)} | ${b.due_date ? fmtShort(b.due_date) : "—"} |`));
    md.push("");
  }

  md.push("## Debts");
  if (openDebts.length) {
    md.push("| Debt | Balance | APR | Min payment | Months left | Est. payoff |");
    md.push("|---|---|---|---|---|---|");
    openDebts
      .slice()
      .sort((a, b) => (b.balance || 0) - (a.balance || 0))
      .forEach((d) => {
        const left = d.months_remaining > 0
          ? `${d.months_remaining}${d.term_months ? ` / ${d.term_months}` : ""}`
          : "—";
        md.push(`| ${d.name} | ${fmtMoney(d.balance)} | ${pct(d.interest_rate) || "—"} | ${fmtMoney(d.minimum_payment)} | ${left} | ${payoffLabel(d.months_remaining, genISO) || "—"} |`);
      });
    md.push(`| **Total** | **${fmtMoney(totalDebt)}** | | **${fmtMoney(totalMinPayments)}** | | |`);
  } else md.push("_No open debts_ 🎉");
  md.push("");

  if (rows.length) {
    md.push("## Pay-period projection");
    md.push("Each period: starting balance + income − bills = projected end balance.");
    md.push("");
    md.push("| Period | Start | Income | Bills | End balance |");
    md.push("|---|---|---|---|---|");
    rows.forEach((r) => {
      const label = `${fmtShort(r.period.start_date)}–${fmtShort(r.period.end_date)}${r.isCurrent || r.isCurrentPeriod ? " (current)" : ""}`;
      md.push(`| ${label} | ${fmtMoney(r.startBalance)} | ${fmtMoney(r.pendingIncome != null ? r.pendingIncome : r.income)} | ${fmtMoney(r.billsDeducted)} | ${fmtMoney(r.endBalance)} |`);
    });
    md.push("");
  }

  // ── CSV (spreadsheet-friendly, one line item per row) ────────────────────────
  const csvRows = [["Category", "Name", "Amount", "Detail", "Balance"]];
  accounts.forEach((a) => csvRows.push(["Account", a.name, "", acctKind(a), num(a.current_balance)]));
  income.filter((i) => i.is_active !== false).forEach((i) =>
    csvRows.push(["Income", i.name, num(i.fixed_amount), `${i.frequency || "monthly"} (monthly ${num(incomePerMonth(i))})`, ""]));
  recurringBills.forEach((b) => csvRows.push(["Bill", b.name, num(b.amount), billCadence(b), ""]));
  oneTimeBills.forEach((b) => csvRows.push(["One-time bill", b.name, num(b.amount), b.due_date || "", ""]));
  openDebts.forEach((d) => {
    const parts = [`${pct(d.interest_rate)} APR`, `min ${num(d.minimum_payment)}`];
    if (d.months_remaining > 0) parts.push(`${d.months_remaining} mo left${d.term_months ? ` of ${d.term_months}` : ""}`);
    const payoff = payoffLabel(d.months_remaining, genISO);
    if (payoff) parts.push(`payoff ${payoff}`);
    csvRows.push(["Debt", d.name, "", parts.join(", "), num(d.balance)]);
  });
  rows.forEach((r) => {
    const label = `${fmtShort(r.period.start_date)}-${fmtShort(r.period.end_date)}${r.isCurrent || r.isCurrentPeriod ? " (current)" : ""}`;
    csvRows.push(["Period", label, "", `start ${num(r.startBalance)}, income ${num(r.pendingIncome != null ? r.pendingIncome : r.income)}, bills ${num(r.billsDeducted)}`, num(r.endBalance)]);
  });
  const csv = csvRows.map((row) => row.map(csvCell).join(",")).join("\n");

  return { markdown: md.join("\n"), csv };
}

function acctName(accounts, id) {
  return accounts.find((a) => a.id === id)?.name || "—";
}
function num(n) {
  return (Number(n) || 0).toFixed(2);
}
function csvCell(v) {
  const s = String(v == null ? "" : v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
function toISO(d) {
  // Local YYYY-MM-DD without pulling in Date.now-based helpers.
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
