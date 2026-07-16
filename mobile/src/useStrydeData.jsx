// Loads everything the app needs once and hands back the shared finance
// engine's output. Mirrors the web dashboard's fetch so both apps read
// identical data.
//
// This lives in a provider rather than a plain hook on purpose: every screen
// calls useStrydeData(), and as a plain hook each one ran its own full fetch —
// ~10 Supabase queries per tab tap. Loading once and sharing keeps tab changes
// instant and cheap on cellular.
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "./supabase";
import {
  getPayPeriodBreakdown,
  enrichBreakdown,
  getMonthlyProjection,
  localDateStr,
} from "@stryde/shared";

const StrydeContext = createContext(null);

export function StrydeDataProvider({ children }) {
  const [state, setState] = useState({
    loading: true,
    error: null,
    userId: null,
    userEmail: "",
    household: null,
    needsOnboarding: false,
    payPeriods: [],
    income: [],
    bills: [],
    accounts: [],
    categories: [],
    debts: [],
    members: [],
    billPayments: {},
    skippedBillPeriods: new Set(),
    earlyPayments: new Set(),
    transfers: {},
    nextTransfers: {},
  });

  const load = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setState((s) => ({ ...s, loading: false, error: "Not signed in" }));
        return;
      }

      const { data: memberRow } = await supabase
        .from("household_members")
        .select("household_id")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();

      if (!memberRow) {
        setState((s) => ({ ...s, loading: false, needsOnboarding: true, userId: user.id, userEmail: user.email || "" }));
        return;
      }

      const householdId = memberRow.household_id;
      const [householdRes, periodsRes, incomeRes, billsRes, accountsRes, membersRes, categoriesRes, debtsRes] =
        await Promise.all([
          supabase.from("households").select("*").eq("id", householdId).maybeSingle(),
          supabase.from("pay_periods").select("*").eq("household_id", householdId).order("start_date"),
          supabase.from("income").select("*").eq("household_id", householdId),
          supabase.from("bills").select("*").eq("household_id", householdId),
          supabase.from("accounts").select("*").eq("household_id", householdId),
          supabase.from("household_members").select("*").eq("household_id", householdId),
          supabase.from("categories").select("*").eq("household_id", householdId).order("name"),
          supabase.from("debts").select("*").eq("household_id", householdId).order("payoff_order"),
        ]);

      const [skipRes, earlyRes, bpRes, transferRes] = await Promise.all([
        supabase.from("bill_skips").select("bill_id, period_start").eq("user_id", user.id),
        supabase.from("income_early_payments").select("income_id, period_start").eq("user_id", user.id),
        supabase.from("bill_payments").select("bill_id, period_start, paid_date, paid_amount, is_paid").eq("user_id", user.id),
        supabase.from("period_transfers").select("period_start, row_key, amount").eq("user_id", user.id),
      ]);

      const billPayments = {};
      (bpRes.data || []).forEach((r) => { billPayments[`${r.bill_id}-${r.period_start}`] = r; });

      const periods = periodsRes.data || [];
      const today = localDateStr();
      const sorted = [...periods].sort((a, b) => new Date(a.start_date) - new Date(b.start_date));
      const curIdx = sorted.findIndex((p) => p.start_date <= today && p.end_date >= today);
      const curPeriod = curIdx >= 0 ? sorted[curIdx] : null;
      const nextPeriod = curIdx >= 0 ? sorted[curIdx + 1] : null;

      const toMap = (rows, periodStart) =>
        (rows || [])
          .filter((r) => r.period_start === periodStart)
          .reduce((acc, r) => ({ ...acc, [r.row_key]: r.amount }), {});

      setState({
        loading: false,
        error: null,
        userId: user.id,
        userEmail: user.email || "",
        household: householdRes.data || null,
        needsOnboarding: false,
        payPeriods: periods,
        income: incomeRes.data || [],
        bills: billsRes.data || [],
        accounts: accountsRes.data || [],
        categories: categoriesRes.data || [],
        debts: debtsRes.data || [],
        members: membersRes.data || [],
        billPayments,
        skippedBillPeriods: new Set((skipRes.data || []).map((r) => `${r.bill_id}-${r.period_start}`)),
        earlyPayments: new Set((earlyRes.data || []).map((r) => `${r.income_id}-${r.period_start}`)),
        transfers: curPeriod ? toMap(transferRes.data, curPeriod.start_date) : {},
        nextTransfers: nextPeriod ? toMap(transferRes.data, nextPeriod.start_date) : {},
      });
    } catch (e) {
      setState((s) => ({ ...s, loading: false, error: e.message || String(e) }));
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Refetch when the signed-in user changes, so switching accounts doesn't
  // leave the previous household's data on screen.
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT") load();
    });
    return () => sub.subscription.unsubscribe();
  }, [load]);

  // Derived once per data change instead of on every screen's every render.
  const value = useMemo(() => {
    const ctx = {
      payPeriods: state.payPeriods,
      income: state.income,
      bills: state.bills,
      accounts: state.accounts,
      billPayments: state.billPayments,
      skippedBillPeriods: state.skippedBillPeriods,
      earlyPayments: state.earlyPayments,
      transfers: state.transfers,
    };

    const breakdown = state.loading ? [] : getPayPeriodBreakdown(ctx);
    const rows = state.loading ? [] : enrichBreakdown(breakdown, ctx);
    const projection = state.loading
      ? { availableNow: 0, incomeThisMonth: 0, billsRemaining: 0, availableThisMonth: 0 }
      : getMonthlyProjection(rows, ctx);

    return { ...state, ctx, rows, projection, reload: load };
  }, [state, load]);

  return <StrydeContext.Provider value={value}>{children}</StrydeContext.Provider>;
}

export function useStrydeData() {
  const value = useContext(StrydeContext);
  if (!value) {
    throw new Error("useStrydeData must be used inside <StrydeDataProvider>");
  }
  return value;
}

// ── Mutations ────────────────────────────────────────────────────────────────

/**
 * Record a payment against a bill for one period.
 *
 * Payments ACCUMULATE: paying $40 then $60 on a $100 bill leaves it fully paid,
 * not stuck at $60. Pass `amount` for a partial; omit it to pay the remainder.
 * Mirrors the web app's markBillPaid.
 */
export async function markBillPaid(userId, bill, periodStart, amount, billPayments = {}) {
  const existing = billPayments[`${bill.id}-${periodStart}`];
  const prevPaid = existing?.paid_amount || 0;
  const thisPayment =
    amount !== undefined && amount !== null && amount !== "" ? parseFloat(amount) : (bill.amount || 0) - prevPaid;
  const totalPaid = prevPaid + thisPayment;

  const record = {
    user_id: userId,
    bill_id: bill.id,
    period_start: periodStart,
    paid_date: localDateStr(),
    paid_amount: totalPaid,
    is_paid: totalPaid >= (bill.amount || 0),
  };
  const { error } = await supabase
    .from("bill_payments")
    .upsert(record, { onConflict: "user_id,bill_id,period_start" });
  return error;
}

/** Skip a bill for one period — it stops counting toward that period's totals. */
export async function skipBill(userId, billId, periodStart) {
  const { error } = await supabase
    .from("bill_skips")
    .insert({ user_id: userId, bill_id: billId, period_start: periodStart });
  // 23505 = unique violation, i.e. already skipped. Not a failure.
  if (error && error.code !== "23505") return error;
  return null;
}

export async function restoreBill(userId, billId, periodStart) {
  const { error } = await supabase
    .from("bill_skips")
    .delete()
    .eq("user_id", userId)
    .eq("bill_id", billId)
    .eq("period_start", periodStart);
  return error;
}

export async function undoBillPaid(userId, billId, periodStart) {
  const { error } = await supabase
    .from("bill_payments")
    .delete()
    .eq("user_id", userId)
    .eq("bill_id", billId)
    .eq("period_start", periodStart);
  return error;
}

export async function markIncomeReceived(userId, incomeId, periodStart) {
  const { error } = await supabase
    .from("income_early_payments")
    .upsert({ user_id: userId, income_id: incomeId, period_start: periodStart },
      { onConflict: "user_id,income_id,period_start" });
  return error;
}

export async function undoIncomeReceived(userId, incomeId, periodStart) {
  const { error } = await supabase
    .from("income_early_payments")
    .delete()
    .eq("user_id", userId)
    .eq("income_id", incomeId)
    .eq("period_start", periodStart);
  return error;
}

export async function recordTransfer(userId, periodStart, rowKey, amount) {
  const { error } = await supabase
    .from("period_transfers")
    .upsert({ user_id: userId, period_start: periodStart, row_key: rowKey, amount },
      { onConflict: "user_id,period_start,row_key" });
  return error;
}

export async function undoTransfer(userId, periodStart, rowKey) {
  const { error } = await supabase
    .from("period_transfers")
    .delete()
    .eq("user_id", userId)
    .eq("period_start", periodStart)
    .eq("row_key", rowKey);
  return error;
}
