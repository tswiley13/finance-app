import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "../supabase";
import { QRCodeSVG as QRCode } from "qrcode.react";
import {
  LayoutDashboard,
  Receipt,
  Wallet,
  CreditCard,
  Tag,
  Calendar,
  TrendingDown,
  Settings,
  LogOut,
  UserPlus,
  Landmark,
  Menu,
  X,
} from "lucide-react";

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #13111F; color: #F0F6FC; font-family: 'Inter', sans-serif; -webkit-font-smoothing: antialiased; }

  .app-shell { display: flex; min-height: 100vh; }

  .sidebar {
    width: 260px; flex-shrink: 0; background: #13111F;
    display: flex; flex-direction: column;
    position: fixed; top: 0; left: 0; bottom: 0;
  }

  .sidebar-logo { height: 88px; padding: 0 20px; display: flex; flex-direction: column; justify-content: center; border-bottom: 1px solid rgba(255,255,255,0.06); flex-shrink: 0; }
  .logo-text { font-size: 22px; font-weight: 800; letter-spacing: 0.06em; color: #F0F6FC; text-transform: uppercase; }
  .logo-tag { font-size: 11px; color: #6C63FF; letter-spacing: 0.2em; text-transform: uppercase; margin-top: 3px; font-weight: 500; }

  .nav { padding: 8px 12px; flex: 1; display: flex; flex-direction: column; gap: 1px; overflow-y: auto; }
  .nav-label { font-size: 9px; color: #5C6080; letter-spacing: 0.15em; text-transform: uppercase; padding: 0 8px; margin: 20px 0 4px; font-weight: 600; }
  .nav-item { display: flex; align-items: center; gap: 10px; padding: 8px 10px; border-radius: 7px; cursor: pointer; font-size: 13px; color: #8B8FA8; font-weight: 400; transition: all 0.1s ease; border: none; background: none; width: 100%; text-align: left; font-family: 'Inter', sans-serif; }
  .nav-item:hover { background: rgba(108,99,255,0.1); color: #F0F6FC; }
  .nav-item.active { background: rgba(108,99,255,0.15); color: #6C63FF; font-weight: 500; }
  .nav-dot { width: 5px; height: 5px; border-radius: 50%; background: #6C63FF; flex-shrink: 0; }
  .nav-dot-muted { width: 5px; height: 5px; border-radius: 50%; background: rgba(255,255,255,0.15); flex-shrink: 0; }

  .sidebar-footer { padding: 12px; border-top: 1px solid rgba(255,255,255,0.06); }
  .signout-btn { display: flex; align-items: center; gap: 10px; padding: 8px 10px; border-radius: 7px; cursor: pointer; font-size: 13px; color: #8B8FA8; border: none; background: none; width: 100%; text-align: left; font-family: 'Inter', sans-serif; transition: all 0.1s ease; }
  .signout-btn:hover { background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.6); }

  .main { margin-left: 260px; flex: 1; min-width: 0; padding: 0; }

  .topbar { display: flex; justify-content: space-between; align-items: center; height: 88px; padding: 0 32px; border-bottom: 1px solid rgba(255,255,255,0.05); margin-bottom: 0; }
  .welcome-name { font-size: 20px; font-weight: 700; color: #F0F6FC; letter-spacing: -0.02em; }
  .welcome-date { font-size: 12px; color: #8B8FA8; margin-top: 3px; }

  .period-badge { background: rgba(108,99,255,0.08); border: 1px solid rgba(108,99,255,0.2); border-radius: 10px; padding: 10px 16px; text-align: center; }
  .period-label { font-size: 13px; font-weight: 600; color: #F0F6FC; margin-bottom: 4px; }
  .period-name { font-size: 13px; font-weight: 600; color: #F0F6FC; margin-top: 3px; }
  .period-dates { font-size: 13px; color: #00D4AA; margin-top: 6px; font-family: 'DM Mono', monospace; }

  .content-area { padding: 28px 32px 60px; width: 100%; }

  .stat-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 28px; }
  .stat-card { background: #1A1826; border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; padding: 20px 22px; position: relative; overflow: hidden; }
  .stat-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px; background: linear-gradient(90deg, rgba(0,212,170,0.8), transparent); }
  .stat-label { font-size: 10px; color: #8B8FA8; letter-spacing: 0.1em; text-transform: uppercase; font-weight: 600; margin-bottom: 10px; }
  .stat-amount { font-family: 'DM Mono', monospace; font-size: 26px; font-weight: 500; color: #00D4AA; line-height: 1; }
  .stat-amount.neutral { color: #4ADE80; }
  .stat-amount.negative { color: #F87171; }

  .dashboard-grid { display: grid; grid-template-columns: calc((100% - 24px) / 3 * 2 + 12px) calc((100% - 24px) / 3); gap: 12px; align-items: start; width: 100%; }
  .dashboard-left { display: flex; flex-direction: column; gap: 12px; }
  .dashboard-right { display: flex; flex-direction: column; gap: 12px; }

  .panel { background: #1A1826; border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; padding: 20px; transition: border-color 0.2s ease, box-shadow 0.2s ease; }
  .panel:hover { border-color: rgba(108,99,255,0.3); box-shadow: 0 0 0 1px rgba(108,99,255,0.1), 0 4px 20px rgba(108,99,255,0.05); }
  .panel-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
  .panel-title { font-size: 11px; color: #8B8FA8; letter-spacing: 0.1em; text-transform: uppercase; font-weight: 600; }
  .panel-count { font-size: 11px; color: #8B8FA8; font-family: 'DM Mono', monospace; }

  .row-item { display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.04); }
  .row-item:last-child { border-bottom: none; }
  .row-name { font-size: 13.5px; color: #F0F6FC; font-weight: 500; }
  .row-sub { font-size: 11px; color: #8B8FA8; margin-top: 3px; }
  .row-amount { font-family: 'DM Mono', monospace; font-size: 14px; color: #00D4AA; font-weight: 500; }
  .empty-state { font-size: 13px; color: #5C6080; font-style: italic; padding: 16px 0; }

  .accumulating-bar { height: 2px; background: rgba(255,255,255,0.06); border-radius: 2px; margin-top: 8px; overflow: hidden; }
  .accumulating-fill { height: 100%; background: linear-gradient(90deg, #00D4AA, #6C63FF); border-radius: 2px; }

  .tag { display: inline-block; font-size: 9px; letter-spacing: 0.08em; text-transform: uppercase; padding: 2px 7px; border-radius: 4px; background: rgba(108,99,255,0.15); color: #6C63FF; margin-left: 8px; vertical-align: middle; font-weight: 600; }

  .content-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }

  .hamburger-btn {
    display: none;
    align-items: center; justify-content: center;
    background: none; border: none; cursor: pointer;
    color: #F0F6FC; padding: 6px; border-radius: 6px;
    transition: background 0.15s ease;
  }
  .hamburger-btn:hover { background: rgba(255,255,255,0.08); }

  .topbar-greeting { display: flex; flex-direction: column; gap: 1px; }
  .topbar-period { }

  .mobile-nav-overlay {
    display: none;
    position: fixed; inset: 0; background: rgba(0,0,0,0.55); z-index: 199;
  }
  .mobile-nav-drawer {
    display: none;
    flex-direction: column;
    position: fixed; top: 0; left: 0; bottom: 0; width: 280px;
    background: #13111F; z-index: 200;
    border-right: 1px solid rgba(255,255,255,0.08);
    overflow-y: auto;
  }
  .mobile-nav-drawer-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 20px 16px; border-bottom: 1px solid rgba(255,255,255,0.06);
  }
  .mobile-nav-drawer-logo {
    font-size: 20px; font-weight: 800; letter-spacing: 0.06em;
    color: #F0F6FC; text-transform: uppercase;
  }
  .mobile-nav-close {
    background: none; border: none; cursor: pointer;
    color: #8B8FA8; padding: 4px; border-radius: 6px;
  }
  .mobile-nav-drawer-nav { padding: 8px 12px; flex: 1; display: flex; flex-direction: column; gap: 1px; }
  .mobile-nav-drawer-footer { padding: 12px; border-top: 1px solid rgba(255,255,255,0.06); }
`;

function Dashboard() {
  const [household, setHousehold] = useState(null);
  const [payPeriods, setPayPeriods] = useState([]);
  const [income, setIncome] = useState([]);
  const [bills, setBills] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeNav, setActiveNav] = useState(
    searchParams.get("tab") || localStorage.getItem("activeNav") || "dashboard",
  );
  const [scrollToInvite, setScrollToInvite] = useState(false);
  const [editingBill, setEditingBill] = useState(null);
  const [billName, setBillName] = useState("");
  const [billAmount, setBillAmount] = useState("");
  const [dueDay, setDueDay] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("auto");
  const [billCategory, setBillCategory] = useState("");
  const [billOwner, setBillOwner] = useState("joint");
  const [billAccountId, setBillAccountId] = useState("");
  const [transferToAccountId, setTransferToAccountId] = useState("");
  const [isBillAccumulating, setIsBillAccumulating] = useState(false);
  const [isVariable, setIsVariable] = useState(false);
  const [showBillForm, setShowBillForm] = useState(false);
  const [editingIncome, setEditingIncome] = useState(null);
  const [showIncomeForm, setShowIncomeForm] = useState(false);
  const [incomeName, setIncomeName] = useState("");
  const [incomeOwner, setIncomeOwner] = useState("joint");
  const [incomeType, setIncomeType] = useState("salary");
  const [incomeFrequency, setIncomeFrequency] = useState("biweekly");
  const [fixedAmount, setFixedAmount] = useState("");
  const [nextPayDate, setNextPayDate] = useState("");
  const [depositAccountId, setDepositAccountId] = useState("");
  const [editingAccount, setEditingAccount] = useState(null);
  const [showAccountForm, setShowAccountForm] = useState(false);
  const [accountName, setAccountName] = useState("");
  const [bankName, setBankName] = useState("");
  const [lastFour, setLastFour] = useState("");
  const [accountType, setAccountType] = useState("checking");
  const [currentBalance, setCurrentBalance] = useState("");
  const [isPrimary, setIsPrimary] = useState(false);
  const [isAccumulating, setIsAccumulating] = useState(false);
  const [accumulationTarget, setAccumulationTarget] = useState("");
  const [accDueDay, setAccDueDay] = useState("");
  const [accumulationCurrent, setAccumulationCurrent] = useState("");
  const [resetType, setResetType] = useState("manual");
  const [resetDay, setResetDay] = useState("");
  const [quickEditAccountId, setQuickEditAccountId] = useState(null);
  const [quickEditBalance, setQuickEditBalance] = useState("");
  const [quickEditBillId, setQuickEditBillId] = useState(null);
  const [quickEditBillAmount, setQuickEditBillAmount] = useState("");
  const [transferringId, setTransferringId] = useState(null);
  const [transferAmount, setTransferAmount] = useState("");
  const [transfers, setTransfers] = useState({});
  const [setAsideDone, setSetAsideDone] = useState({});
  const [quickEditIncomeId, setQuickEditIncomeId] = useState(null);
  const [quickEditIncomeAmount, setQuickEditIncomeAmount] = useState("");
  const [confirmDeleteBillId, setConfirmDeleteBillId] = useState(null);
  const [confirmDeleteIncomeId, setConfirmDeleteIncomeId] = useState(null);
  const [confirmDeleteAccountId, setConfirmDeleteAccountId] = useState(null);
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState("");
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [members, setMembers] = useState([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [confirmRegenerate, setConfirmRegenerate] = useState(false);
  const [debts, setDebts] = useState([]);
  const [showDebtForm, setShowDebtForm] = useState(false);
  const [editingDebt, setEditingDebt] = useState(null);
  const [debtName, setDebtName] = useState("");
  const [debtOwner, setDebtOwner] = useState("joint");
  const [debtCategory, setDebtCategory] = useState("Credit Card");
  const [debtBalance, setDebtBalance] = useState("");
  const [debtInterestRate, setDebtInterestRate] = useState("");
  const [debtMinPayment, setDebtMinPayment] = useState("");
  const [debtPayoffOrder, setDebtPayoffOrder] = useState("");
  const [confirmDeleteDebtId, setConfirmDeleteDebtId] = useState(null);
  const [confirmPayoffDebtId, setConfirmPayoffDebtId] = useState(null);
  const [editingHouseholdName, setEditingHouseholdName] = useState(false);
  const [newHouseholdName, setNewHouseholdName] = useState("");
  const [newMemberName, setNewMemberName] = useState("");
  const [showAddMember, setShowAddMember] = useState(false);
  const [confirmDeleteMemberId, setConfirmDeleteMemberId] = useState(null);
  const [userEmail, setUserEmail] = useState("");
  const [expandedPeriods, setExpandedPeriods] = useState(new Set([0]));
  const [minimumBuffer, setMinimumBuffer] = useState("");

  function navigate(page) {
    localStorage.setItem("activeNav", page);
    setActiveNav(page);
    setSearchParams({ tab: page }, { replace: false });
  }

  // Sync activeNav when browser back/forward changes URL
  useEffect(() => {
    const tab = searchParams.get("tab") || "dashboard";
    setActiveNav(tab);
  }, [searchParams]);

  useEffect(() => {
    if (scrollToInvite && activeNav === "settings") {
      setTimeout(() => {
        document.getElementById("invite-section")?.scrollIntoView({ behavior: "smooth", block: "center" });
        setScrollToInvite(false);
      }, 100);
    }
  }, [scrollToInvite, activeNav]);

  useEffect(() => {
    async function loadData() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        setUserEmail(user.email || "");
        const { data: memberRow, error: memberError } = await supabase
          .from("household_members")
          .select("household_id")
          .eq("user_id", user.id)
          .limit(1)
          .maybeSingle();

        if (!memberRow) {
          setLoading(false);
          return;
        }

        const { data: householdData } = await supabase
          .from("households")
          .select("id, name, invite_code")
          .eq("id", memberRow.household_id)

          .single();

        if (!householdData) {
          setLoading(false);
          return;
        }

        setHousehold(householdData);

        const [
          periodsRes,
          incomeRes,
          billsRes,
          accountsRes,
          categoriesRes,
          membersRes,
          debtsRes,
        ] = await Promise.all([
          supabase
            .from("pay_periods")
            .select("*")
            .eq("household_id", householdData.id)
            .order("start_date"),
          supabase
            .from("income")
            .select("*")
            .eq("household_id", householdData.id),
          supabase
            .from("bills")
            .select("*")
            .eq("household_id", householdData.id),
          supabase
            .from("accounts")
            .select("*")
            .eq("household_id", householdData.id),
          supabase
            .from("categories")
            .select("*")
            .eq("household_id", householdData.id)
            .order("name"),
          supabase
            .from("household_members")
            .select("*")
            .eq("household_id", householdData.id),
          supabase
            .from("debts")
            .select("*")
            .eq("household_id", householdData.id)
            .order("payoff_order"),
        ]);

        setPayPeriods(periodsRes.data || []);
        setDebts(debtsRes.data || []);
        setIncome(incomeRes.data || []);
        setBills(billsRes.data || []);
        setAccounts(accountsRes.data || []);
        setCategories(categoriesRes.data || []);
        setMembers(membersRes.data || []);
        setLoading(false);
      } catch (err) {
        console.log("Load error:", err.message);
        setLoading(false);
      }
    }
    loadData();
  }, []);

  function getCurrentPayPeriod() {
    const today = new Date();
    const todayStr = today.toLocaleDateString("en-CA");
    return payPeriods.find((p) => {
      return todayStr >= p.start_date && todayStr <= p.end_date;
    });
  }

  function getSuffix(d) {
    if ([1, 21, 31].includes(d)) return "st";
    if ([2, 22].includes(d)) return "nd";
    if ([3, 23].includes(d)) return "rd";
    return "th";
  }

  function fmt(n) {
    return (n || 0).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  function fmtDate(s) {
    return new Date(s + "T12:00:00").toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  }

  function isBillDue(bill) {
    if (!bill.is_paid) return true;

    const today = new Date();
    const paidDate = new Date(bill.paid_date);

    const paidMonth = paidDate.getMonth();
    const paidYear = paidDate.getFullYear();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    // If paid in a previous month, show as due again
    if (paidYear < currentYear) return true;
    if (paidYear === currentYear && paidMonth < currentMonth) return true;

    // Paid this month — hide it
    return false;
  }

  async function addBill() {
    if (
      !billName ||
      !billAmount ||
      !dueDay ||
      !billCategory ||
      !billAccountId
    ) {
      alert("Please fill in all required bill fields.");
      return;
    }

    const householdData = household;

    const { data: savedBill, error } = await supabase
      .from("bills")
      .insert({
        household_id: householdData.id,
        name: billName,
        amount: parseFloat(billAmount),
        due_day: parseInt(dueDay),
        payment_method: paymentMethod,
        category: billCategory,
        owner: billOwner,
        account_id: billAccountId || null,
        transfer_to_account_id: isBillAccumulating ? (transferToAccountId || null) : null,
        is_variable: isVariable,
        is_active: true,
        is_paid: false,
      })
      .select()
      .single();

    if (error) {
      console.log("Error:", error.message);
      return;
    }

    setBills([...bills, savedBill]);
    setBillName("");
    setBillAmount("");
    setDueDay("");
    setPaymentMethod("auto");
    setBillCategory("");
    setBillOwner("joint");
    setBillAccountId("");
    setTransferToAccountId("");
    setIsBillAccumulating(false);
    setIsVariable(false);
    setShowBillForm(false);
  }

  async function updateBill() {
    if (
      !billName ||
      !billAmount ||
      !dueDay ||
      !billCategory ||
      !billAccountId
    ) {
      alert("Please fill in all required bill fields.");
      return;
    }

    const { error } = await supabase
      .from("bills")
      .update({
        name: billName,
        amount: parseFloat(billAmount),
        due_day: parseInt(dueDay),
        payment_method: paymentMethod,
        category: billCategory,
        owner: billOwner,
        account_id: billAccountId || null,
        transfer_to_account_id: isBillAccumulating ? (transferToAccountId || null) : null,
        is_variable: isVariable,
      })
      .eq("id", editingBill.id);

    if (error) {
      console.log("Error:", error.message);
      return;
    }

    setBills(
      bills.map((b) =>
        b.id === editingBill.id
          ? {
              ...b,
              name: billName,
              amount: parseFloat(billAmount),
              due_day: parseInt(dueDay),
              payment_method: paymentMethod,
              category: billCategory,
              owner: billOwner,
              account_id: billAccountId,
              transfer_to_account_id: isBillAccumulating ? (transferToAccountId || null) : null,
              is_variable: isVariable,
            }
          : b,
      ),
    );

    setEditingBill(null);
    setBillName("");
    setBillAmount("");
    setDueDay("");
    setPaymentMethod("auto");
    setBillCategory("");
    setBillOwner("joint");
    setBillAccountId("");
    setTransferToAccountId("");
    setIsBillAccumulating(false);
    setIsVariable(false);
  }

  async function deleteBill(billId) {
    const { error } = await supabase.from("bills").delete().eq("id", billId);
    if (error) {
      console.log("Error:", error.message);
      return;
    }
    setBills(bills.filter((b) => b.id !== billId));
  }

  async function markBillPaid(bill) {
    const today = new Date().toISOString().split("T")[0];

    const { error } = await supabase
      .from("bills")
      .update({
        is_paid: true,
        paid_date: today,
        paid_amount: bill.amount,
      })
      .eq("id", bill.id);

    if (error) {
      console.log("Error:", error.message);
      return;
    }

    setBills(
      bills.map((b) =>
        b.id === bill.id
          ? { ...b, is_paid: true, paid_date: today, paid_amount: bill.amount }
          : b,
      ),
    );
  }

  async function markBillUnpaid(bill) {
    const { error } = await supabase
      .from("bills")
      .update({
        is_paid: false,
        paid_date: null,
        paid_amount: null,
      })
      .eq("id", bill.id);

    if (error) {
      console.log("Error:", error.message);
      return;
    }

    setBills(
      bills.map((b) =>
        b.id === bill.id
          ? { ...b, is_paid: false, paid_date: null, paid_amount: null }
          : b,
      ),
    );
  }

  function getRemainingIncomeThisMonth() {
    const today = new Date();
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    let total = 0;

    income.forEach((inc) => {
      if (!inc.next_pay_date || !inc.fixed_amount) return;

      const baseDate = new Date(inc.next_pay_date);
      const interval =
        inc.frequency === "weekly" ? 7 : inc.frequency === "biweekly" ? 14 : 0;

      if (interval === 0) {
        // Monthly — check if next_pay_date is after today and before end of month
        if (baseDate > today && baseDate <= endOfMonth) {
          total += inc.fixed_amount;
        }
      } else {
        // Biweekly or weekly — project forward
        let payDate = new Date(baseDate);
        while (payDate <= endOfMonth) {
          if (payDate > today) {
            total += inc.fixed_amount;
          }
          payDate.setDate(payDate.getDate() + interval);
        }
      }
    });

    return total;
  }

  function getPayPeriodBreakdown() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcomingPeriods = [...payPeriods]
      .filter((p) => {
        const end = new Date(p.end_date + "T12:00:00");
        return end >= today;
      })
      .sort((a, b) => new Date(a.start_date) - new Date(b.start_date))
      .slice(0, 4);

    // Pre-compute per-period contributions from accumulating accounts with a due_day
    const allContributions = [];
    const coveredAccountIds = new Set();

    // Account-driven: accumulating accounts with due_day + accumulation_target
    accounts.forEach((acct) => {
      if (!acct.is_accumulating || !acct.due_day || !acct.accumulation_target) return;
      const target = acct.accumulation_target;
      const saved = Math.min(acct.current_balance || 0, target);
      const stillNeeded = Math.max(0, target - saved);
      if (stillNeeded === 0) return;
      let dueDate = new Date(today.getFullYear(), today.getMonth(), acct.due_day);
      if (dueDate <= today) dueDate = new Date(today.getFullYear(), today.getMonth() + 1, acct.due_day);
      let periodsCount = 0;
      for (const p of upcomingPeriods) {
        periodsCount++;
        if (dueDate <= new Date(p.end_date + "T23:59:59")) break;
      }
      const totalPeriods = Math.max(1, periodsCount);
      coveredAccountIds.add(acct.id);
      allContributions.push({ name: acct.name, amount: stillNeeded / totalPeriods, dueDate, saved, target, accountId: acct.id });
    });

    // Bill-driven: bills that transfer to an accumulating account (e.g. Rent → Mortgage savings)
    // Use the bill's due_day and the destination account's current balance
    bills.forEach((bill) => {
      if (!bill.transfer_to_account_id) return;
      const dest = accounts.find((a) => a.id === bill.transfer_to_account_id);
      if (!dest?.is_accumulating) return;
      if (coveredAccountIds.has(dest.id)) return; // already handled by account-driven
      const target = bill.amount;
      const saved = Math.min(dest.current_balance || 0, target);
      const stillNeeded = Math.max(0, target - saved);
      if (stillNeeded === 0) return;
      let dueDate = new Date(today.getFullYear(), today.getMonth(), bill.due_day);
      if (dueDate <= today) dueDate = new Date(today.getFullYear(), today.getMonth() + 1, bill.due_day);
      let periodsCount = 0;
      for (const p of upcomingPeriods) {
        periodsCount++;
        if (dueDate <= new Date(p.end_date + "T23:59:59")) break;
      }
      const totalPeriods = Math.max(1, periodsCount);
      coveredAccountIds.add(dest.id);
      allContributions.push({ name: dest.name, amount: stillNeeded / totalPeriods, dueDate, saved, target, accountId: dest.id });
    });

    return upcomingPeriods.map((period) => {
      const periodStart = new Date(period.start_date + "T00:00:00");
      const periodEnd = new Date(period.end_date + "T23:59:59");

      let periodIncome = 0;
      const periodIncomeItems = [];

      income.forEach((inc) => {
        if (!inc.next_pay_date || !inc.fixed_amount) return;

        const baseDate = new Date(inc.next_pay_date + "T12:00:00");
        const interval =
          inc.frequency === "weekly"
            ? 7
            : inc.frequency === "biweekly"
              ? 14
              : 0;

        if (interval === 0) {
          // Monthly — check if this income's pay day falls in the period
          // for either the period's start month or end month
          const payDay = baseDate.getDate();
          const candidateDates = [
            new Date(periodStart.getFullYear(), periodStart.getMonth(), payDay, 12, 0, 0),
            new Date(periodEnd.getFullYear(), periodEnd.getMonth(), payDay, 12, 0, 0),
          ];
          candidateDates.forEach((d) => {
            if (d >= periodStart && d <= periodEnd) {
              periodIncome += inc.fixed_amount;
              periodIncomeItems.push({ ...inc, actualPayDate: d.toISOString().split("T")[0] });
            }
          });
        } else {
          // Walk backwards from next_pay_date to find the earliest
          // occurrence at or before periodEnd, then sweep forward
          let payDate = new Date(baseDate);
          while (payDate > periodEnd) {
            payDate.setDate(payDate.getDate() - interval);
          }
          while (payDate <= periodEnd) {
            if (payDate >= periodStart) {
              periodIncome += inc.fixed_amount;
              periodIncomeItems.push({
                ...inc,
                actualPayDate: payDate.toISOString().split("T")[0],
              });
            }
            payDate = new Date(payDate);
            payDate.setDate(payDate.getDate() + interval);
          }
        }
      });

      const periodBills = bills.filter((bill) => {
        if (!isBillDue(bill)) return false;

        // Build the actual due date for this bill in the period's month
        const dueDateThisMonth = new Date(
          periodStart.getFullYear(),
          periodStart.getMonth(),
          bill.due_day,
          23,
          59,
          59,
        );
        const dueDateNextMonth = new Date(
          periodStart.getFullYear(),
          periodStart.getMonth() + 1,
          bill.due_day,
          23,
          59,
          59,
        );

        // Check if due date falls within the period
        return (
          (dueDateThisMonth >= periodStart && dueDateThisMonth <= periodEnd) ||
          (dueDateNextMonth >= periodStart && dueDateNextMonth <= periodEnd)
        );
      });

      const periodBillsTotal = periodBills.reduce(
        (sum, b) => sum + (b.amount || 0),
        0,
      );

      const isCurrentPeriod = periodStart <= today && periodEnd >= today;

      // Left Over = income - ALL bills whose due date falls in this period,
      // regardless of paid status. Marking a bill paid never changes Left Over.
      const leftOverBillsTotal = bills
        .filter((bill) => {
          const dueDateThisMonth = new Date(periodStart.getFullYear(), periodStart.getMonth(), bill.due_day, 23, 59, 59);
          const dueDateNextMonth = new Date(periodStart.getFullYear(), periodStart.getMonth() + 1, bill.due_day, 23, 59, 59);
          return (
            (dueDateThisMonth >= periodStart && dueDateThisMonth <= periodEnd) ||
            (dueDateNextMonth >= periodStart && dueDateNextMonth <= periodEnd)
          );
        })
        .reduce((sum, b) => sum + (b.amount || 0), 0);

      // Show Set Aside in all periods where saving is still relevant (due date hasn't passed at period start)
      const contributions = allContributions.filter((c) => periodStart < c.dueDate);

      return {
        period,
        isCurrentPeriod,
        income: periodIncome,
        incomeItems: periodIncomeItems,
        bills: periodBills,
        billsTotal: periodBillsTotal,
        leftOver: periodIncome - leftOverBillsTotal,
        contributions,
      };
    });
  }

  async function addIncome() {
    if (!incomeName || !fixedAmount || !nextPayDate) {
      alert("Please fill in all required income fields.");
      return;
    }

    const householdData = household;

    const { data: savedIncome, error } = await supabase
      .from("income")
      .insert({
        household_id: householdData.id,
        name: incomeName,
        owner: incomeOwner,
        type: incomeType,
        frequency: incomeFrequency,
        fixed_amount: parseFloat(fixedAmount),
        next_pay_date: nextPayDate,
        deposit_account_id: depositAccountId || null,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.log("Error:", error.message);
      return;
    }

    setIncome([...income, savedIncome]);
    setIncomeName("");
    setIncomeOwner("joint");
    setIncomeType("salary");
    setIncomeFrequency("biweekly");
    setFixedAmount("");
    setNextPayDate("");
    setDepositAccountId("");
    setShowIncomeForm(false);
  }

  async function updateIncome() {
    if (!incomeName || !fixedAmount) {
      alert("Please fill in all required income fields.");
      return;
    }

    const { error } = await supabase
      .from("income")
      .update({
        name: incomeName,
        owner: incomeOwner,
        type: incomeType,
        frequency: incomeFrequency,
        fixed_amount: parseFloat(fixedAmount),
        next_pay_date: nextPayDate,
        deposit_account_id: depositAccountId || null,
      })
      .eq("id", editingIncome.id);

    if (error) {
      console.log("Error:", error.message);
      return;
    }

    setIncome(
      income.map((i) =>
        i.id === editingIncome.id
          ? {
              ...i,
              name: incomeName,
              owner: incomeOwner,
              type: incomeType,
              frequency: incomeFrequency,
              fixed_amount: parseFloat(fixedAmount),
              next_pay_date: nextPayDate,
              deposit_account_id: depositAccountId || null,
            }
          : i,
      ),
    );

    setEditingIncome(null);
    setIncomeName("");
    setIncomeOwner("joint");
    setIncomeType("salary");
    setIncomeFrequency("biweekly");
    setFixedAmount("");
    setNextPayDate("");
    setDepositAccountId("");
  }

  async function deleteIncome(incomeId) {
    const { error } = await supabase.from("income").delete().eq("id", incomeId);
    if (error) {
      console.log("Error:", error.message);
      return;
    }
    setIncome(income.filter((i) => i.id !== incomeId));
  }

  async function updateAccount() {
    if (!accountName || !bankName || !lastFour) {
      alert("Please fill in all required account fields.");
      return;
    }
    if (isAccumulating && (!accumulationTarget || !accDueDay)) {
      alert("Saving accounts require a savings target and due day of month.");
      return;
    }

    const { error } = await supabase
      .from("accounts")
      .update({
        name: accountName,
        bank_name: bankName,
        last_four: lastFour,
        account_type: accountType,
        current_balance: parseFloat(currentBalance) || 0,
        is_primary: isPrimary,
        is_accumulating: isAccumulating,
        accumulation_target: accumulationTarget ? parseFloat(accumulationTarget) : null,
        accumulation_current: accumulationCurrent ? parseFloat(accumulationCurrent) : 0,
        due_day: isAccumulating && accDueDay ? parseInt(accDueDay) : null,
        reset_type: resetType,
        reset_day: resetDay ? parseInt(resetDay) : null,
        minimum_buffer: minimumBuffer ? parseFloat(minimumBuffer) : 0,
      })
      .eq("id", editingAccount.id);

    if (error) {
      console.log("Error:", error.message);
      return;
    }

    setAccounts(
      accounts.map((a) =>
        a.id === editingAccount.id
          ? {
              ...a,
              name: accountName,
              bank_name: bankName,
              last_four: lastFour,
              account_type: accountType,
              current_balance: parseFloat(currentBalance) || 0,
              is_primary: isPrimary,
              is_accumulating: isAccumulating,
              accumulation_target: parseFloat(accumulationTarget) || null,
              accumulation_current: parseFloat(accumulationCurrent) || 0,
              due_day: isAccumulating && accDueDay ? parseInt(accDueDay) : null,
              reset_type: resetType,
              reset_day: parseInt(resetDay) || null,
            }
          : a,
      ),
    );

    setEditingAccount(null);
    setAccountName("");
    setBankName("");
    setLastFour("");
    setAccountType("checking");
    setCurrentBalance("");
    setIsPrimary(false);
    setIsAccumulating(false);
    setAccumulationTarget("");
    setAccumulationCurrent("");
    setAccDueDay("");
    setResetType("manual");
    setResetDay("");
    setMinimumBuffer(acct.minimum_buffer || "");
  }

  async function deleteAccount(accountId) {
    const { error } = await supabase
      .from("accounts")
      .delete()
      .eq("id", accountId);
    if (error) {
      console.log("Error:", error.message);
      return;
    }
    setAccounts(accounts.filter((a) => a.id !== accountId));
  }

  async function confirmTransfer(accountId, amount) {
    const parsed = parseFloat(amount);
    if (!parsed || parsed <= 0) return;

    const account = accounts.find((a) => a.id === accountId);
    if (!account) return;

    const newBalance = (account.current_balance || 0) + parsed;

    const { error } = await supabase
      .from("accounts")
      .update({ current_balance: newBalance })
      .eq("id", accountId);

    if (error) { console.log("Error:", error.message); return; }

    setAccounts(accounts.map((a) =>
      a.id === accountId ? { ...a, current_balance: newBalance } : a
    ));

    setTransfers((prev) => ({
      ...prev,
      [accountId]: (prev[accountId] || 0) + parsed,
    }));

    setTransferringId(null);
    setTransferAmount("");
  }

  async function updateAccountBalance(accountId, newBalance) {
    const { error } = await supabase
      .from("accounts")
      .update({ current_balance: parseFloat(newBalance) || 0 })
      .eq("id", accountId);

    if (error) {
      console.log("Error:", error.message);
      return;
    }

    setAccounts(
      accounts.map((a) =>
        a.id === accountId
          ? { ...a, current_balance: parseFloat(newBalance) || 0 }
          : a,
      ),
    );

    setQuickEditAccountId(null);
    setQuickEditBalance("");
  }

  async function updateBillAmount(billId, newAmount) {
    const { error } = await supabase
      .from("bills")
      .update({ amount: parseFloat(newAmount) || 0 })
      .eq("id", billId);

    if (error) {
      console.log("Error:", error.message);
      return;
    }

    setBills(
      bills.map((b) =>
        b.id === billId ? { ...b, amount: parseFloat(newAmount) || 0 } : b,
      ),
    );

    setQuickEditBillId(null);
    setQuickEditBillAmount("");
  }

  async function updateIncomeAmount(incomeId, newAmount) {
    const { error } = await supabase
      .from("income")
      .update({ fixed_amount: parseFloat(newAmount) || 0 })
      .eq("id", incomeId);

    if (error) {
      console.log("Error:", error.message);
      return;
    }

    setIncome(
      income.map((i) =>
        i.id === incomeId
          ? { ...i, fixed_amount: parseFloat(newAmount) || 0 }
          : i,
      ),
    );

    setQuickEditIncomeId(null);
    setQuickEditIncomeAmount("");
  }

  async function addCategory() {
    if (!newCategory) return;
    const householdData = household;
    const { data: savedCategory, error } = await supabase
      .from("categories")
      .insert({ household_id: householdData.id, name: newCategory })
      .select()
      .single();
    if (error) {
      console.log("Error:", error.message);
      return;
    }
    setCategories([...categories, savedCategory]);
    setNewCategory("");
  }

  async function deleteCategory(categoryId) {
    const { error } = await supabase
      .from("categories")
      .delete()
      .eq("id", categoryId);
    if (error) {
      console.log("Error:", error.message);
      return;
    }
    setCategories(categories.filter((c) => c.id !== categoryId));
  }

  async function addDebt() {
    if (!debtName || !debtBalance || !debtMinPayment) {
      alert("Please fill in all required debt fields.");
      return;
    }

    const householdData = household;

    const { data: savedDebt, error } = await supabase
      .from("debts")
      .insert({
        household_id: householdData.id,
        name: debtName,
        owner: debtOwner,
        category: debtCategory,
        balance: parseFloat(debtBalance),
        interest_rate: debtInterestRate
          ? parseFloat(debtInterestRate) / 100
          : null,
        minimum_payment: parseFloat(debtMinPayment),
        payoff_order: debtPayoffOrder ? parseInt(debtPayoffOrder) : null,
        is_paid_off: false,
      })
      .select()
      .single();

    if (error) {
      console.log("Error:", error.message);
      return;
    }

    setDebts([...debts, savedDebt]);
    setDebtName("");
    setDebtOwner("joint");
    setDebtCategory("Credit Card");
    setDebtBalance("");
    setDebtInterestRate("");
    setDebtMinPayment("");
    setDebtPayoffOrder("");
    setShowDebtForm(false);
  }

  async function updateDebt() {
    if (!debtName || !debtBalance || !debtMinPayment) {
      alert("Please fill in all required debt fields.");
      return;
    }

    const { error } = await supabase
      .from("debts")
      .update({
        name: debtName,
        owner: debtOwner,
        category: debtCategory,
        balance: parseFloat(debtBalance),
        interest_rate: debtInterestRate
          ? parseFloat(debtInterestRate) / 100
          : null,
        minimum_payment: parseFloat(debtMinPayment),
        payoff_order: debtPayoffOrder ? parseInt(debtPayoffOrder) : null,
      })
      .eq("id", editingDebt.id);

    if (error) {
      console.log("Error:", error.message);
      return;
    }

    setDebts(
      debts.map((d) =>
        d.id === editingDebt.id
          ? {
              ...d,
              name: debtName,
              owner: debtOwner,
              category: debtCategory,
              balance: parseFloat(debtBalance),
              interest_rate: debtInterestRate
                ? parseFloat(debtInterestRate) / 100
                : null,
              minimum_payment: parseFloat(debtMinPayment),
              payoff_order: debtPayoffOrder ? parseInt(debtPayoffOrder) : null,
            }
          : d,
      ),
    );

    setEditingDebt(null);
    setDebtName("");
    setDebtOwner("joint");
    setDebtCategory("Credit Card");
    setDebtBalance("");
    setDebtInterestRate("");
    setDebtMinPayment("");
    setDebtPayoffOrder("");
  }

  async function deleteDebt(debtId) {
    const { error } = await supabase.from("debts").delete().eq("id", debtId);
    if (error) {
      console.log("Error:", error.message);
      return;
    }
    setDebts(debts.filter((d) => d.id !== debtId));
  }

  async function markDebtPaidOff(debt) {
    const today = new Date().toISOString().split("T")[0];

    const { error } = await supabase
      .from("debts")
      .update({
        is_paid_off: true,
        paid_off_date: today,
        payment_freed_up: debt.minimum_payment,
      })
      .eq("id", debt.id);

    if (error) {
      console.log("Error:", error.message);
      return;
    }

    setDebts(
      debts.map((d) =>
        d.id === debt.id
          ? {
              ...d,
              is_paid_off: true,
              paid_off_date: today,
              payment_freed_up: debt.minimum_payment,
            }
          : d,
      ),
    );

    setConfirmPayoffDebtId(null);
  }

  async function autoSortDebts(strategy) {
    const activeDebts = debts.filter((d) => !d.is_paid_off);

    const sorted = [...activeDebts].sort((a, b) => {
      if (strategy === "snowball") {
        return (a.balance || 0) - (b.balance || 0);
      } else {
        return (b.interest_rate || 0) - (a.interest_rate || 0);
      }
    });

    for (let i = 0; i < sorted.length; i++) {
      await supabase
        .from("debts")
        .update({ payoff_order: i + 1 })
        .eq("id", sorted[i].id);
    }

    const updated = debts.map((d) => {
      const index = sorted.findIndex((s) => s.id === d.id);
      return index !== -1 ? { ...d, payoff_order: index + 1 } : d;
    });

    setDebts(updated);
  }

  async function updateHouseholdName() {
    if (!newHouseholdName) return;

    const { error } = await supabase
      .from("households")
      .update({ name: newHouseholdName })
      .eq("id", household.id);

    if (error) {
      console.log("Error:", error.message);
      return;
    }

    setHousehold({ ...household, name: newHouseholdName });
    setEditingHouseholdName(false);
    setNewHouseholdName("");
  }

  async function addMember() {
    if (!newMemberName) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: savedMember, error } = await supabase
      .from("household_members")
      .insert({
        household_id: household.id,
        user_id: user.id,
        name: newMemberName,
        role: "member",
      })
      .select()
      .single();

    if (error) {
      console.log("Error:", error.message);
      return;
    }

    setMembers([...members, savedMember]);
    setNewMemberName("");
    setShowAddMember(false);
  }

  async function deleteMember(memberId) {
    const { error } = await supabase
      .from("household_members")
      .delete()
      .eq("id", memberId);

    if (error) {
      console.log("Error:", error.message);
      return;
    }

    setMembers(members.filter((m) => m.id !== memberId));
    setConfirmDeleteMemberId(null);
  }

  async function regeneratePayPeriods() {
    setRegenerating(true);

    const householdData = household;

    // Delete all existing pay periods
    await supabase
      .from("pay_periods")
      .delete()
      .eq("household_id", householdData.id);

    // Rebuild from current income next_pay_date values
    const paychecks = income.filter(
      (i) => i.frequency !== "monthly" && i.next_pay_date,
    );

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const allDates = [];
    paychecks.forEach((inc) => {
      const baseDate = new Date(inc.next_pay_date + "T12:00:00");
      const interval = inc.frequency === "weekly" ? 7 : 14;
      const daysUntilNext = Math.ceil((baseDate - today) / (1000 * 60 * 60 * 24));
      const periodsBack = Math.ceil(daysUntilNext / interval) + 1;
      const startOffset = -periodsBack;
      for (let i = startOffset; i < 8; i++) {
        const date = new Date(baseDate);
        date.setDate(baseDate.getDate() + i * interval);
        allDates.push(date);
      }
    });

    allDates.sort((a, b) => a - b);

    const uniqueDates = allDates.filter(
      (date, index, self) =>
        index === 0 || date.toDateString() !== self[index - 1].toDateString(),
    );

    const periods = [];
    for (let i = 0; i < uniqueDates.length; i++) {
      const startDate = new Date(uniqueDates[i]);
      let endDate;
      if (i < uniqueDates.length - 1) {
        endDate = new Date(uniqueDates[i + 1]);
        endDate.setDate(endDate.getDate() - 1);
      } else {
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 13);
      }

      periods.push({
        name: `Pay Period ${i + 1}`,
        start_day: startDate.getDate(),
        end_day: endDate.getDate(),
        start_date: startDate.toISOString().split("T")[0],
        end_date: endDate.toISOString().split("T")[0],
      });
    }

    for (const period of periods) {
      await supabase.from("pay_periods").insert({
        household_id: householdData.id,
        name: period.name,
        start_day: period.start_day,
        end_day: period.end_day,
        start_date: period.start_date,
        end_date: period.end_date,
      });
    }

    // Refresh local state
    const { data: newPeriods } = await supabase
      .from("pay_periods")
      .select("*")
      .eq("household_id", householdData.id)
      .order("start_date");

    setPayPeriods(newPeriods || []);
    setRegenerating(false);
    setConfirmRegenerate(false);
  }

  const totalIncome = income.reduce((sum, i) => {
    const amount = i.fixed_amount || 0;
    if (i.frequency === "biweekly") return sum + amount * 2;
    if (i.frequency === "weekly") return sum + amount * 4;
    return sum + amount; // monthly
  }, 0);
  const totalBills = bills.reduce((sum, b) => sum + (b.amount || 0), 0);
  const remaining = totalIncome - totalBills;

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#0F1218",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "sans-serif",
          color: "#8B8FA8",
          fontSize: "12px",
          letterSpacing: "0.3em",
          textTransform: "uppercase",
        }}
      >
        <style>{css}</style>
        Loading Stryde...
      </div>
    );
  }

  const currentPeriod = getCurrentPayPeriod();

  function renderContent() {
    if (activeNav === "debts") {
      const activeDebts = debts
        .filter((d) => !d.is_paid_off)
        .sort((a, b) => (a.payoff_order || 99) - (b.payoff_order || 99));
      const paidOffDebts = debts.filter((d) => d.is_paid_off);
      const totalBalance = activeDebts.reduce(
        (sum, d) => sum + (d.balance || 0),
        0,
      );
      const totalMinPayment = activeDebts.reduce(
        (sum, d) => sum + (d.minimum_payment || 0),
        0,
      );

      return (
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "24px",
            }}
          >
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: "24px" }}>
              Debts
            </h2>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={() => autoSortDebts("snowball")}
                style={{
                  background: "none",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "#8892A4",
                  padding: "8px 16px",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                Snowball
              </button>
              <button
                onClick={() => autoSortDebts("avalanche")}
                style={{
                  background: "none",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "#8892A4",
                  padding: "8px 16px",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                Avalanche
              </button>
              <button
                onClick={() => {
                  setShowDebtForm(true);
                  setEditingDebt(null);
                  setDebtName("");
                  setDebtOwner("joint");
                  setDebtCategory("Credit Card");
                  setDebtBalance("");
                  setDebtInterestRate("");
                  setDebtMinPayment("");
                  setDebtPayoffOrder("");
                }}
                style={{
                  background: "#6C63FF",
                  border: "none",
                  color: "#0F1218",
                  padding: "8px 16px",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: "600",
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                + Add Debt
              </button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="stat-row" style={{ marginBottom: "16px" }}>
            <div className="stat-card">
              <div className="stat-label">Total Debt</div>
              <div className="stat-amount negative">${fmt(totalBalance)}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Min Monthly Payment</div>
              <div className="stat-amount neutral">${fmt(totalMinPayment)}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Debts Remaining</div>
              <div className="stat-amount neutral">{activeDebts.length}</div>
            </div>
          </div>

          {/* Add / Edit Form */}

          {/* Active Debts */}
          <div className="panel" style={{ marginBottom: "16px" }}>
            <div className="panel-header">
              <div className="panel-title">Active Debts</div>
              <div className="panel-count">{activeDebts.length} total</div>
            </div>
            {activeDebts.length === 0 ? (
              <div className="empty-state">No active debts — great work!</div>
            ) : (
              activeDebts.map((debt, i) => (
                <div key={i}>
                  <div className="row-item">
                    <div>
                      <div className="row-name">
                        {debt.payoff_order && (
                          <span
                            style={{
                              fontSize: "10px",
                              background: "#6C63FF",
                              color: "#F0F6FC",
                              padding: "1px 6px",
                              borderRadius: "4px",
                              marginRight: "8px",
                              fontWeight: "700",
                            }}
                          >
                            #{debt.payoff_order}
                          </span>
                        )}
                        {debt.name}
                      </div>
                      <div className="row-sub">
                        {debt.category} · {debt.owner}
                        {debt.interest_rate &&
                          ` · ${(debt.interest_rate * 100).toFixed(2)}% APR`}
                      </div>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <div style={{ textAlign: "right" }}>
                        <div
                          className="row-amount"
                          style={{ color: "#F87171" }}
                        >
                          ${fmt(debt.balance)}
                        </div>
                        <div style={{ fontSize: "10px", color: "#8B8FA8" }}>
                          min ${fmt(debt.minimum_payment)}/mo
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          if (editingDebt?.id === debt.id) {
                            setEditingDebt(null);
                          } else {
                            setEditingDebt(debt);
                            setShowDebtForm(false);
                            setDebtName(debt.name);
                            setDebtOwner(debt.owner);
                            setDebtCategory(debt.category);
                            setDebtBalance(debt.balance);
                            setDebtInterestRate(
                              debt.interest_rate
                                ? (debt.interest_rate * 100).toFixed(2)
                                : "",
                            );
                            setDebtMinPayment(debt.minimum_payment);
                            setDebtPayoffOrder(debt.payoff_order || "");
                          }
                        }}
                        style={{
                          background: "none",
                          border: "1px solid rgba(255,255,255,0.1)",
                          color: "#8B8FA8",
                          padding: "4px 10px",
                          borderRadius: "6px",
                          cursor: "pointer",
                          fontSize: "11px",
                          fontFamily: "'Inter', sans-serif",
                        }}
                      >
                        {editingDebt?.id === debt.id ? "Cancel" : "Edit"}
                      </button>
                      {confirmPayoffDebtId === debt.id ? (
                        <>
                          <button
                            onClick={() => markDebtPaidOff(debt)}
                            style={{
                              background: "none",
                              border: "1px solid #4ADE80",
                              color: "#4ADE80",
                              padding: "4px 10px",
                              borderRadius: "6px",
                              cursor: "pointer",
                              fontSize: "11px",
                              fontFamily: "'Inter', sans-serif",
                            }}
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => setConfirmPayoffDebtId(null)}
                            style={{
                              background: "none",
                              border: "1px solid rgba(255,255,255,0.1)",
                              color: "#8B8FA8",
                              padding: "4px 10px",
                              borderRadius: "6px",
                              cursor: "pointer",
                              fontSize: "11px",
                              fontFamily: "'Inter', sans-serif",
                            }}
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => setConfirmPayoffDebtId(debt.id)}
                            style={{
                              background: "none",
                              border: "1px solid #4ADE80",
                              color: "#4ADE80",
                              padding: "4px 10px",
                              borderRadius: "6px",
                              cursor: "pointer",
                              fontSize: "11px",
                              fontFamily: "'Inter', sans-serif",
                            }}
                          >
                            Paid Off
                          </button>
                          {confirmDeleteDebtId === debt.id ? (
                            <>
                              <button
                                onClick={() => {
                                  deleteDebt(debt.id);
                                  setConfirmDeleteDebtId(null);
                                }}
                                style={{
                                  background: "none",
                                  border: "1px solid #F87171",
                                  color: "#F87171",
                                  padding: "4px 10px",
                                  borderRadius: "6px",
                                  cursor: "pointer",
                                  fontSize: "11px",
                                  fontFamily: "'Inter', sans-serif",
                                }}
                              >
                                Confirm
                              </button>
                              <button
                                onClick={() => setConfirmDeleteDebtId(null)}
                                style={{
                                  background: "none",
                                  border: "1px solid rgba(255,255,255,0.1)",
                                  color: "#8B8FA8",
                                  padding: "4px 10px",
                                  borderRadius: "6px",
                                  cursor: "pointer",
                                  fontSize: "11px",
                                  fontFamily: "'Inter', sans-serif",
                                }}
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => setConfirmDeleteDebtId(debt.id)}
                              style={{
                                background: "none",
                                border: "1px solid rgba(255,255,255,0.1)",
                                color: "#F87171",
                                padding: "4px 10px",
                                borderRadius: "6px",
                                cursor: "pointer",
                                fontSize: "11px",
                                fontFamily: "'Inter', sans-serif",
                              }}
                            >
                              Delete
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {editingDebt?.id === debt.id && (
                    <div
                      style={{
                        background: "#13111F",
                        border: "1px solid rgba(108,99,255,0.3)",
                        borderRadius: "8px",
                        padding: "16px",
                        margin: "8px 0 4px",
                      }}
                    >
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: "12px",
                        }}
                      >
                        <input
                          placeholder="Debt name"
                          value={debtName}
                          onChange={(e) => setDebtName(e.target.value)}
                          style={{
                            background: "#2D2B45",
                            border: "1px solid rgba(255,255,255,0.1)",
                            color: "#F0F6FC",
                            padding: "8px 12px",
                            borderRadius: "6px",
                            fontSize: "13px",
                            fontFamily: "'Inter', sans-serif",
                          }}
                        />
                        <select
                          value={debtCategory}
                          onChange={(e) => setDebtCategory(e.target.value)}
                          style={{
                            background: "#2D2B45",
                            border: "1px solid rgba(255,255,255,0.1)",
                            color: "#F0F6FC",
                            padding: "8px 12px",
                            borderRadius: "6px",
                            fontSize: "13px",
                            fontFamily: "'Inter', sans-serif",
                          }}
                        >
                          <option value="Credit Card">Credit Card</option>
                          <option value="Auto Loan">Auto Loan</option>
                          <option value="Student Loan">Student Loan</option>
                          <option value="Personal Loan">Personal Loan</option>
                          <option value="Medical">Medical</option>
                          <option value="Mortgage">Mortgage</option>
                          <option value="Other">Other</option>
                        </select>
                        <select
                          value={debtOwner}
                          onChange={(e) => setDebtOwner(e.target.value)}
                          style={{
                            background: "#2D2B45",
                            border: "1px solid rgba(255,255,255,0.1)",
                            color: "#F0F6FC",
                            padding: "8px 12px",
                            borderRadius: "6px",
                            fontSize: "13px",
                            fontFamily: "'Inter', sans-serif",
                          }}
                        >
                          <option value="joint">Joint</option>
                          {members.map((m, i) => (
                            <option key={i} value={m.name}>
                              {m.name}
                            </option>
                          ))}
                        </select>
                        <input
                          type="number"
                          placeholder="Current balance"
                          value={debtBalance}
                          onChange={(e) => setDebtBalance(e.target.value)}
                          style={{
                            background: "#2D2B45",
                            border: "1px solid rgba(255,255,255,0.1)",
                            color: "#F0F6FC",
                            padding: "8px 12px",
                            borderRadius: "6px",
                            fontSize: "13px",
                            fontFamily: "'Inter', sans-serif",
                          }}
                        />
                        <input
                          type="number"
                          placeholder="Minimum payment"
                          value={debtMinPayment}
                          onChange={(e) => setDebtMinPayment(e.target.value)}
                          style={{
                            background: "#2D2B45",
                            border: "1px solid rgba(255,255,255,0.1)",
                            color: "#F0F6FC",
                            padding: "8px 12px",
                            borderRadius: "6px",
                            fontSize: "13px",
                            fontFamily: "'Inter', sans-serif",
                          }}
                        />
                        <input
                          type="number"
                          placeholder="Interest rate (e.g. 24.99)"
                          value={debtInterestRate}
                          onChange={(e) => setDebtInterestRate(e.target.value)}
                          style={{
                            background: "#2D2B45",
                            border: "1px solid rgba(255,255,255,0.1)",
                            color: "#F0F6FC",
                            padding: "8px 12px",
                            borderRadius: "6px",
                            fontSize: "13px",
                            fontFamily: "'Inter', sans-serif",
                          }}
                        />
                      </div>
                      <div
                        style={{
                          display: "flex",
                          gap: "8px",
                          marginTop: "12px",
                        }}
                      >
                        <button
                          onClick={updateDebt}
                          style={{
                            background: "#6C63FF",
                            border: "none",
                            color: "#F0F6FC",
                            padding: "8px 16px",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontSize: "13px",
                            fontWeight: "600",
                            fontFamily: "'Inter', sans-serif",
                          }}
                        >
                          Save Changes
                        </button>
                        <button
                          onClick={() => setEditingDebt(null)}
                          style={{
                            background: "none",
                            border: "1px solid rgba(255,255,255,0.1)",
                            color: "#8B8FA8",
                            padding: "8px 16px",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontSize: "13px",
                            fontFamily: "'Inter', sans-serif",
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Paid Off Debts */}
          {paidOffDebts.length > 0 && (
            <div className="panel">
              <div className="panel-header">
                <div className="panel-title">Paid Off</div>
                <div className="panel-count">{paidOffDebts.length} total</div>
              </div>
              {paidOffDebts.map((debt, i) => (
                <div className="row-item" key={i}>
                  <div>
                    <div
                      className="row-name"
                      style={{
                        color: "#8B8FA8",
                        textDecoration: "line-through",
                      }}
                    >
                      {debt.name}
                    </div>
                    <div className="row-sub">
                      {debt.category} · Paid off {fmtDate(debt.paid_off_date)}
                      {debt.payment_freed_up &&
                        ` · $${fmt(debt.payment_freed_up)}/mo freed up`}
                    </div>
                  </div>
                  <button
                    onClick={() => setConfirmDeleteDebtId(debt.id)}
                    style={{
                      background: "none",
                      border: "1px solid rgba(255,255,255,0.1)",
                      color: "#FC8181",
                      padding: "4px 10px",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontSize: "11px",
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                  >
                    {confirmDeleteDebtId === debt.id ? (
                      <span
                        onClick={() => {
                          deleteDebt(debt.id);
                          setConfirmDeleteDebtId(null);
                        }}
                      >
                        Confirm
                      </span>
                    ) : (
                      "Delete"
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    if (activeNav === "payperiods") {
      return (
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "24px",
            }}
          >
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: "24px" }}>
              Pay Periods
            </h2>
            {confirmRegenerate ? (
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={regeneratePayPeriods}
                  disabled={regenerating}
                  style={{
                    background: "none",
                    border: "1px solid #FC8181",
                    color: "#FC8181",
                    padding: "8px 16px",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontSize: "13px",
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  {regenerating ? "Regenerating..." : "Confirm Regenerate"}
                </button>
                <button
                  onClick={() => setConfirmRegenerate(false)}
                  style={{
                    background: "none",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "#8892A4",
                    padding: "8px 16px",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontSize: "13px",
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmRegenerate(true)}
                style={{
                  background: "#6C63FF",
                  border: "none",
                  color: "#0F1218",
                  padding: "8px 16px",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: "600",
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                Regenerate Pay Periods
              </button>
            )}
          </div>

          <div
            className="panel"
            style={{
              marginBottom: "16px",
              background: "#2D2B45",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <div
              style={{ fontSize: "12px", color: "#8892A4", lineHeight: "1.6" }}
            >
              Pay periods are calculated automatically from your income deposit
              dates. If your pay schedule changes, update your income's next
              deposit date on the{" "}
              <span
                style={{ color: "#6C63FF", cursor: "pointer" }}
                onClick={() => navigate("income")}
              >
                Income page
              </span>
              , then come back here and regenerate.
            </div>
          </div>

          <div className="panel">
            <div className="panel-header">
              <div className="panel-title">All Pay Periods</div>
              <div className="panel-count">{payPeriods.length} total</div>
            </div>
            {payPeriods.length === 0 ? (
              <div className="empty-state">
                No pay periods found — try regenerating
              </div>
            ) : (
              [...payPeriods]
                .sort((a, b) => new Date(a.start_date) - new Date(b.start_date))
                .map((period, i) => {
                  const today = new Date().toLocaleDateString("en-CA");
                  const isCurrent =
                    today >= period.start_date && today <= period.end_date;
                  const isPast = today > period.end_date;
                  return (
                    <div className="row-item" key={i}>
                      <div>
                        <div
                          className="row-name"
                          style={{ color: isPast ? "#8B8FA8" : "#CBD5E0" }}
                        >
                          {fmtDate(period.start_date)} —{" "}
                          {fmtDate(period.end_date)}
                          {isCurrent && (
                            <span
                              style={{
                                marginLeft: "10px",
                                fontSize: "9px",
                                background: "#6C63FF",
                                color: "#0F1218",
                                padding: "2px 8px",
                                borderRadius: "4px",
                                letterSpacing: "0.1em",
                                textTransform: "uppercase",
                                fontWeight: "700",
                              }}
                            >
                              Current
                            </span>
                          )}
                        </div>
                        <div className="row-sub">{period.name}</div>
                      </div>
                      <div
                        style={{
                          fontSize: "11px",
                          color: isPast
                            ? "#8B8FA8"
                            : isCurrent
                              ? "#6C63FF"
                              : "#8892A4",
                          fontFamily: "'DM Mono', monospace",
                        }}
                      >
                        {isPast ? "Past" : isCurrent ? "Active" : "Upcoming"}
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </div>
      );
    }

    if (activeNav === "settings") {
      return (
        <div>
          <div style={{ marginBottom: "24px" }}>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: "24px" }}>
              Settings
            </h2>
          </div>

          {/* Household */}
          <div className="panel" style={{ marginBottom: "16px" }}>
            <div
              style={{
                fontSize: "11px",
                color: "#6C63FF",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                fontWeight: "500",
                marginBottom: "16px",
              }}
            >
              Household
            </div>
            <div className="row-item">
              <div className="row-name">Household Name</div>
              {editingHouseholdName ? (
                <div
                  style={{ display: "flex", gap: "8px", alignItems: "center" }}
                >
                  <input
                    value={newHouseholdName}
                    onChange={(e) => setNewHouseholdName(e.target.value)}
                    autoFocus
                                  onFocus={(e) => e.target.select()}
                    style={{
                      background: "#2D2B45",
                      border: "1px solid #6C63FF",
                      color: "#E8E6E1",
                      padding: "4px 8px",
                      borderRadius: "6px",
                      fontSize: "13px",
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                  />
                  <button
                    onClick={updateHouseholdName}
                    style={{
                      background: "#6C63FF",
                      border: "none",
                      color: "#0F1218",
                      padding: "4px 12px",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontSize: "12px",
                      fontWeight: "600",
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setEditingHouseholdName(false);
                      setNewHouseholdName("");
                    }}
                    style={{
                      background: "none",
                      border: "1px solid rgba(255,255,255,0.1)",
                      color: "#8892A4",
                      padding: "4px 12px",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontSize: "12px",
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div
                  style={{ display: "flex", alignItems: "center", gap: "12px" }}
                >
                  <span style={{ color: "#8892A4", fontSize: "13px" }}>
                    {household?.name}
                  </span>
                  <button
                    onClick={() => {
                      setEditingHouseholdName(true);
                      setNewHouseholdName(household?.name || "");
                    }}
                    style={{
                      background: "none",
                      border: "1px solid rgba(255,255,255,0.1)",
                      color: "#8892A4",
                      padding: "4px 10px",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontSize: "11px",
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                  >
                    Edit
                  </button>
                </div>
              )}
            </div>

            <div className="row-item" id="invite-section">
              <div>
                <div className="row-name">Invite Code</div>
                <div className="row-sub">
                  Share this with your household member to join
                </div>
              </div>
              <div
                style={{ display: "flex", alignItems: "center", gap: "12px" }}
              >
                <span
                  style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: "14px",
                    color: "#6C63FF",
                    letterSpacing: "0.1em",
                  }}
                >
                  {household?.invite_code}
                </span>
                <button
                  onClick={() =>
                    navigator.clipboard.writeText(household?.invite_code)
                  }
                  style={{
                    background: "none",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "#8892A4",
                    padding: "4px 10px",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "11px",
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  Copy
                </button>
              </div>
            </div>
            <div className="row-item">
              <div className="row-name">QR Code</div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "10px" }}>
                <div style={{ background: "#ffffff", padding: "8px", borderRadius: "8px" }}>
                  <QRCode
                    value={`${import.meta.env.VITE_APP_URL || window.location.origin}/join?code=${household?.invite_code}`}
                    size={180}
                  />
                </div>
                <button
                  onClick={() => navigator.clipboard.writeText(`${import.meta.env.VITE_APP_URL || window.location.origin}/join?code=${household?.invite_code}`)}
                  style={{ fontSize: "12px", fontWeight: "600", color: "#6C63FF", background: "rgba(108,99,255,0.1)", border: "1px solid rgba(108,99,255,0.25)", borderRadius: "6px", padding: "6px 14px", cursor: "pointer", fontFamily: "'Inter', sans-serif" }}
                >
                  Copy Invite Link
                </button>
              </div>
            </div>
          </div>

          {/* Members */}
          <div className="panel" style={{ marginBottom: "16px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px",
              }}
            >
              <div
                style={{
                  fontSize: "11px",
                  color: "#6C63FF",
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  fontWeight: "500",
                }}
              >
                Members
              </div>
              <button
                onClick={() => setShowAddMember(!showAddMember)}
                style={{
                  background: "none",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "#8892A4",
                  padding: "4px 10px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "11px",
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                + Add
              </button>
            </div>
            {showAddMember && (
              <div
                style={{ display: "flex", gap: "8px", marginBottom: "16px" }}
              >
                <input
                  placeholder="Member name"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  autoFocus
                                  onFocus={(e) => e.target.select()}
                  style={{
                    flex: 1,
                    background: "#2D2B45",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "#E8E6E1",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    fontSize: "13px",
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                />
                <button
                  onClick={addMember}
                  style={{
                    background: "#6C63FF",
                    border: "none",
                    color: "#0F1218",
                    padding: "8px 16px",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "13px",
                    fontWeight: "600",
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setShowAddMember(false);
                    setNewMemberName("");
                  }}
                  style={{
                    background: "none",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "#8892A4",
                    padding: "8px 16px",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "13px",
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  Cancel
                </button>
              </div>
            )}
            {members.length === 0 ? (
              <div className="empty-state">No members yet</div>
            ) : (
              members.map((m, i) => (
                <div className="row-item" key={i}>
                  <div>
                    <div className="row-name">{m.name}</div>
                    <div className="row-sub">{m.role}</div>
                  </div>
                  {confirmDeleteMemberId === m.id ? (
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        onClick={() => deleteMember(m.id)}
                        style={{
                          background: "none",
                          border: "1px solid #FC8181",
                          color: "#FC8181",
                          padding: "4px 10px",
                          borderRadius: "6px",
                          cursor: "pointer",
                          fontSize: "11px",
                          fontFamily: "'DM Sans', sans-serif",
                        }}
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setConfirmDeleteMemberId(null)}
                        style={{
                          background: "none",
                          border: "1px solid rgba(255,255,255,0.1)",
                          color: "#8892A4",
                          padding: "4px 10px",
                          borderRadius: "6px",
                          cursor: "pointer",
                          fontSize: "11px",
                          fontFamily: "'DM Sans', sans-serif",
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDeleteMemberId(m.id)}
                      style={{
                        background: "none",
                        border: "1px solid rgba(255,255,255,0.1)",
                        color: "#FC8181",
                        padding: "4px 10px",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontSize: "11px",
                        fontFamily: "'DM Sans', sans-serif",
                      }}
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Account */}
          <div className="panel" style={{ marginBottom: "16px" }}>
            <div
              style={{
                fontSize: "11px",
                color: "#6C63FF",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                fontWeight: "500",
                marginBottom: "16px",
              }}
            >
              Account
            </div>
            <div className="row-item">
              <div className="row-name">Email</div>
              <div style={{ fontSize: "13px", color: "#8892A4" }}>
                {userEmail}
              </div>
            </div>
            <div className="row-item">
              <div className="row-name">Sign Out</div>
              <button
                onClick={() => supabase.auth.signOut()}
                style={{
                  background: "none",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "#8892A4",
                  padding: "4px 10px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "11px",
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                Sign Out
              </button>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="panel" style={{ border: "1px solid #4A1C1C" }}>
            <div
              style={{
                fontSize: "11px",
                color: "#FC8181",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                fontWeight: "500",
                marginBottom: "16px",
              }}
            >
              Danger Zone
            </div>
            <div className="row-item">
              <div>
                <div className="row-name" style={{ color: "#FC8181" }}>
                  Delete Household
                </div>
                <div className="row-sub">
                  Permanently deletes all your data. This cannot be undone.
                </div>
              </div>
              <button
                onClick={() => alert("This feature is coming soon.")}
                style={{
                  background: "none",
                  border: "1px solid #FC8181",
                  color: "#FC8181",
                  padding: "4px 10px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "11px",
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (activeNav === "categories") {
      return (
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "24px",
            }}
          >
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: "24px" }}>
              Categories
            </h2>
            <button
              onClick={() => setShowCategoryForm(!showCategoryForm)}
              style={{
                background: "#6C63FF",
                border: "none",
                color: "#0F1218",
                padding: "8px 16px",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: "600",
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              + Add Category
            </button>
          </div>

          {showCategoryForm && (
            <div className="panel" style={{ marginBottom: "16px" }}>
              <div className="panel-header">
                <div className="panel-title">New Category</div>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <input
                  placeholder="Category name"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  style={{
                    flex: 1,
                    background: "#2D2B45",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "#E8E6E1",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    fontSize: "13px",
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                />
                <button
                  onClick={addCategory}
                  style={{
                    background: "#6C63FF",
                    border: "none",
                    color: "#0F1218",
                    padding: "8px 16px",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "13px",
                    fontWeight: "600",
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setShowCategoryForm(false);
                    setNewCategory("");
                  }}
                  style={{
                    background: "none",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "#8892A4",
                    padding: "8px 16px",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "13px",
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="panel">
            <div className="panel-header">
              <div className="panel-title">Your Categories</div>
              <div className="panel-count">{categories.length} total</div>
            </div>
            {categories.length === 0 ? (
              <div className="empty-state">
                No categories yet — add one above
              </div>
            ) : (
              categories.map((cat, i) => (
                <div className="row-item" key={i}>
                  <div className="row-name">{cat.name}</div>
                  <button
                    onClick={() => deleteCategory(cat.id)}
                    style={{
                      background: "none",
                      border: "1px solid rgba(255,255,255,0.1)",
                      color: "#FC8181",
                      padding: "4px 10px",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontSize: "11px",
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                  >
                    Delete
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      );
    }

    if (activeNav === "accounts") {
      return (
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "24px",
            }}
          >
            <h2
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: "24px",
                fontWeight: "700",
                color: "#F2F0EB",
              }}
            >
              Accounts
            </h2>
            <button
              onClick={() => {
                setEditingAccount(null);
                setAccountName("");
                setBankName("");
                setLastFour("");
                setAccountType("checking");
                setCurrentBalance("");
                setIsPrimary(false);
                setIsAccumulating(false);
                setAccumulationTarget("");
                setAccumulationCurrent("");
                setAccDueDay("");
                setResetType("manual");
                setResetDay("");
                setShowAccountForm(true);
              }}
              style={{
                background: "#6C63FF",
                border: "none",
                color: "#0C0E14",
                padding: "8px 16px",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: "600",
                fontFamily: "'Inter', sans-serif",
              }}
            >
              + Add Account
            </button>
          </div>

          {showAccountForm && (
            <div className="panel" style={{ marginBottom: "16px" }}>
              <div className="panel-header">
                <div className="panel-title">New Account</div>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "12px",
                }}
              >
                <input
                  placeholder="Account name"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "#F2F0EB",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    fontSize: "13px",
                    fontFamily: "'Inter', sans-serif",
                  }}
                />
                <input
                  placeholder="Bank name"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "#F2F0EB",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    fontSize: "13px",
                    fontFamily: "'Inter', sans-serif",
                  }}
                />
                <input
                  placeholder="Last 4 digits"
                  value={lastFour}
                  onChange={(e) => setLastFour(e.target.value)}
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "#F2F0EB",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    fontSize: "13px",
                    fontFamily: "'Inter', sans-serif",
                  }}
                />
                <select
                  value={accountType}
                  onChange={(e) => setAccountType(e.target.value)}
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "#F2F0EB",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    fontSize: "13px",
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  <option value="checking">Checking</option>
                  <option value="savings">Savings</option>
                </select>
                <input
                  type="number"
                  placeholder="Current balance"
                  value={currentBalance}
                  onChange={(e) => setCurrentBalance(e.target.value)}
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "#F2F0EB",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    fontSize: "13px",
                    fontFamily: "'Inter', sans-serif",
                  }}
                />
                <div
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <label
                    style={{
                      color: "rgba(255,255,255,0.6)",
                      fontSize: "13px",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isPrimary}
                      onChange={(e) => setIsPrimary(e.target.checked)}
                    />
                    Primary
                  </label>
                  {isPrimary && (
                    <div style={{ fontSize: "11px", color: "#8B8FA8", marginTop: "2px", gridColumn: "1 / -1" }}>
                      Multiple primary accounts are combined for Available Funds.
                    </div>
                  )}
                  <label
                    style={{
                      color: "rgba(255,255,255,0.6)",
                      fontSize: "13px",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isAccumulating}
                      onChange={(e) => setIsAccumulating(e.target.checked)}
                    />
                    Accumulating
                  </label>
                </div>
                {isAccumulating && (
                  <>
                    <input
                      type="number"
                      placeholder="Savings target (e.g. 2500)"
                      value={accumulationTarget}
                      onChange={(e) => setAccumulationTarget(e.target.value)}
                      style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#F2F0EB", padding: "8px 12px", borderRadius: "6px", fontSize: "13px", fontFamily: "'Inter', sans-serif" }}
                    />
                    <input
                      type="number"
                      placeholder="Due day of month (e.g. 1 for the 1st)"
                      value={accDueDay}
                      onChange={(e) => setAccDueDay(e.target.value)}
                      min="1" max="31"
                      style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#F2F0EB", padding: "8px 12px", borderRadius: "6px", fontSize: "13px", fontFamily: "'Inter', sans-serif" }}
                    />
                  </>
                )}
              </div>
              <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
                <button
                  onClick={async () => {
                    if (!accountName || !bankName || !lastFour) {
                      alert("Please fill in all required fields.");
                      return;
                    }
                    if (isAccumulating && (!accumulationTarget || !accDueDay)) {
                      alert("Saving accounts require a savings target and due day of month.");
                      return;
                    }
                    const { data: savedAccount, error } = await supabase
                      .from("accounts")
                      .insert({
                        household_id: household.id,
                        name: accountName,
                        bank_name: bankName,
                        last_four: lastFour,
                        account_type: accountType,
                        current_balance: parseFloat(currentBalance) || 0,
                        is_primary: isPrimary,
                        is_accumulating: isAccumulating,
                        accumulation_target: accumulationTarget ? parseFloat(accumulationTarget) : null,
                        accumulation_current: 0,
                        due_day: isAccumulating && accDueDay ? parseInt(accDueDay) : null,
                        reset_type: resetType,
                        reset_day: resetDay ? parseInt(resetDay) : null,
                      })
                      .select()
                      .single();
                    if (error) {
                      console.log("Error:", error.message);
                      return;
                    }
                    setAccounts([...accounts, savedAccount]);
                    setAccountName("");
                    setBankName("");
                    setLastFour("");
                    setAccountType("checking");
                    setCurrentBalance("");
                    setIsPrimary(false);
                    setIsAccumulating(false);
                    setAccumulationTarget("");
                    setAccumulationCurrent("");
                    setAccDueDay("");
                    setShowAccountForm(false);
                  }}
                  style={{
                    background: "#6C63FF",
                    border: "none",
                    color: "#0C0E14",
                    padding: "8px 16px",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "13px",
                    fontWeight: "600",
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  Save Account
                </button>
                <button
                  onClick={() => setShowAccountForm(false)}
                  style={{
                    background: "none",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "rgba(255,255,255,0.5)",
                    padding: "8px 16px",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "13px",
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="panel">
            <div className="panel-header">
              <div className="panel-title">Your Accounts</div>
              <div className="panel-count">{accounts.length} total</div>
            </div>
            {accounts.length === 0 ? (
              <div className="empty-state">No accounts added yet</div>
            ) : (
              accounts.map((acct, i) => (
                <div key={i}>
                  <div className="row-item">
                    <div>
                      <div className="row-name">
                        {acct.name}
                        {acct.is_primary && (
                          <span className="tag">Primary</span>
                        )}
                        {acct.is_accumulating && (
                          <span className="tag">Accumulating</span>
                        )}
                      </div>
                      <div className="row-sub">
                        {acct.bank_name} ···{acct.last_four} ·{" "}
                        {acct.account_type}
                      </div>
                      {acct.is_accumulating && acct.accumulation_target > 0 && (
                        <>
                          <div className="accumulating-bar">
                            <div
                              className="accumulating-fill"
                              style={{
                                width: `${Math.min(100, ((acct.accumulation_current || 0) / acct.accumulation_target) * 100)}%`,
                              }}
                            />
                          </div>
                          <div
                            style={{
                              fontSize: "10px",
                              color: "#8B8FA8",
                              marginTop: "4px",
                            }}
                          >
                            ${fmt(acct.accumulation_current || 0)} of $
                            {fmt(acct.accumulation_target)}
                          </div>
                        </>
                      )}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      {quickEditAccountId === acct.id ? (
                        <input
                          type="number"
                          value={quickEditBalance}
                          onChange={(e) => setQuickEditBalance(e.target.value)}
                          onBlur={() =>
                            updateAccountBalance(acct.id, quickEditBalance)
                          }
                          autoFocus
                                  onFocus={(e) => e.target.select()}
                          style={{
                            background: "#2D2B45",
                            border: "1px solid #6C63FF",
                            color: "#F0F6FC",
                            padding: "4px 8px",
                            borderRadius: "6px",
                            fontSize: "14px",
                            fontFamily: "'DM Mono', monospace",
                            width: "100px",
                            textAlign: "right",
                          }}
                        />
                      ) : (
                        <div
                          className="row-amount"
                          onClick={() => {
                            setQuickEditAccountId(acct.id);
                            setQuickEditBalance(acct.current_balance ?? "");
                          }}
                          style={{ cursor: "pointer" }}
                          title="Click to edit"
                        >
                          ${fmt(acct.current_balance)}
                        </div>
                      )}
                      <button
                        onClick={() => {
                          if (editingAccount?.id === acct.id) {
                            setEditingAccount(null);
                          } else {
                            setEditingAccount(acct);
                            setAccountName(acct.name);
                            setBankName(acct.bank_name);
                            setLastFour(acct.last_four);
                            setAccountType(acct.account_type);
                            setCurrentBalance(acct.current_balance ?? "");
                            setIsPrimary(acct.is_primary);
                            setIsAccumulating(acct.is_accumulating);
                            setAccumulationTarget(acct.accumulation_target || "");
                            setAccumulationCurrent(acct.accumulation_current || "");
                            setAccDueDay(acct.due_day || "");
                            setResetType(acct.reset_type || "manual");
                            setResetDay(acct.reset_day || "");
                            setMinimumBuffer(acct.minimum_buffer || "");
                          }
                        }}
                        style={{
                          background: "none",
                          border: "1px solid rgba(255,255,255,0.1)",
                          color: "#8B8FA8",
                          padding: "4px 10px",
                          borderRadius: "6px",
                          cursor: "pointer",
                          fontSize: "11px",
                          fontFamily: "'Inter', sans-serif",
                        }}
                      >
                        {editingAccount?.id === acct.id ? "Cancel" : "Edit"}
                      </button>
                      {confirmDeleteAccountId === acct.id ? (
                        <>
                          <button
                            onClick={() => {
                              deleteAccount(acct.id);
                              setConfirmDeleteAccountId(null);
                            }}
                            style={{
                              background: "none",
                              border: "1px solid #F87171",
                              color: "#F87171",
                              padding: "4px 10px",
                              borderRadius: "6px",
                              cursor: "pointer",
                              fontSize: "11px",
                              fontFamily: "'Inter', sans-serif",
                            }}
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => setConfirmDeleteAccountId(null)}
                            style={{
                              background: "none",
                              border: "1px solid rgba(255,255,255,0.1)",
                              color: "#8B8FA8",
                              padding: "4px 10px",
                              borderRadius: "6px",
                              cursor: "pointer",
                              fontSize: "11px",
                              fontFamily: "'Inter', sans-serif",
                            }}
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => setConfirmDeleteAccountId(acct.id)}
                          style={{
                            background: "none",
                            border: "1px solid rgba(255,255,255,0.1)",
                            color: "#F87171",
                            padding: "4px 10px",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontSize: "11px",
                            fontFamily: "'Inter', sans-serif",
                          }}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>

                  {editingAccount?.id === acct.id && (
                    <div
                      style={{
                        background: "#13111F",
                        border: "1px solid rgba(108,99,255,0.3)",
                        borderRadius: "8px",
                        padding: "16px",
                        margin: "8px 0 4px",
                      }}
                    >
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: "12px",
                        }}
                      >
                        <input
                          placeholder="Account name"
                          value={accountName}
                          onChange={(e) => setAccountName(e.target.value)}
                          style={{
                            background: "#2D2B45",
                            border: "1px solid rgba(255,255,255,0.1)",
                            color: "#F0F6FC",
                            padding: "8px 12px",
                            borderRadius: "6px",
                            fontSize: "13px",
                            fontFamily: "'Inter', sans-serif",
                          }}
                        />
                        <input
                          placeholder="Bank name"
                          value={bankName}
                          onChange={(e) => setBankName(e.target.value)}
                          style={{
                            background: "#2D2B45",
                            border: "1px solid rgba(255,255,255,0.1)",
                            color: "#F0F6FC",
                            padding: "8px 12px",
                            borderRadius: "6px",
                            fontSize: "13px",
                            fontFamily: "'Inter', sans-serif",
                          }}
                        />
                        <input
                          placeholder="Last 4 digits"
                          value={lastFour}
                          onChange={(e) => setLastFour(e.target.value)}
                          style={{
                            background: "#2D2B45",
                            border: "1px solid rgba(255,255,255,0.1)",
                            color: "#F0F6FC",
                            padding: "8px 12px",
                            borderRadius: "6px",
                            fontSize: "13px",
                            fontFamily: "'Inter', sans-serif",
                          }}
                        />
                        <select
                          value={accountType}
                          onChange={(e) => setAccountType(e.target.value)}
                          style={{
                            background: "#2D2B45",
                            border: "1px solid rgba(255,255,255,0.1)",
                            color: "#F0F6FC",
                            padding: "8px 12px",
                            borderRadius: "6px",
                            fontSize: "13px",
                            fontFamily: "'Inter', sans-serif",
                          }}
                        >
                          <option value="checking">Checking</option>
                          <option value="savings">Savings</option>
                        </select>
                        <input
                          type="number"
                          placeholder="Current balance"
                          value={currentBalance}
                          onChange={(e) => setCurrentBalance(e.target.value)}
                          style={{
                            background: "#2D2B45",
                            border: "1px solid rgba(255,255,255,0.1)",
                            color: "#F0F6FC",
                            padding: "8px 12px",
                            borderRadius: "6px",
                            fontSize: "13px",
                            fontFamily: "'Inter', sans-serif",
                          }}
                        />
                        <input
                          type="number"
                          placeholder="Minimum buffer (e.g. 100)"
                          value={minimumBuffer}
                          onChange={(e) => setMinimumBuffer(e.target.value)}
                          style={{
                            background: "#2D2B45",
                            border: "1px solid rgba(255,255,255,0.1)",
                            color: "#F0F6FC",
                            padding: "8px 12px",
                            borderRadius: "6px",
                            fontSize: "13px",
                            fontFamily: "'Inter', sans-serif",
                          }}
                        />
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "16px",
                            gridColumn: "1 / -1",
                          }}
                        >
                          <label
                            style={{
                              color: "#8B8FA8",
                              fontSize: "13px",
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isPrimary}
                              onChange={(e) => setIsPrimary(e.target.checked)}
                            />
                            Primary
                          </label>
                          {isPrimary && (
                            <div style={{ fontSize: "11px", color: "#8B8FA8", marginTop: "2px", gridColumn: "1 / -1" }}>
                              Multiple primary accounts are combined for Available Funds.
                            </div>
                          )}
                          <label
                            style={{
                              color: "#8B8FA8",
                              fontSize: "13px",
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isAccumulating}
                              onChange={(e) =>
                                setIsAccumulating(e.target.checked)
                              }
                            />
                            Accumulating
                          </label>
                        </div>
                        {isAccumulating && (
                          <>
                            <input
                              type="number"
                              placeholder="Savings target (e.g. 2500)"
                              value={accumulationTarget}
                              onChange={(e) => setAccumulationTarget(e.target.value)}
                              style={{ background: "#2D2B45", border: "1px solid rgba(255,255,255,0.1)", color: "#F0F6FC", padding: "8px 12px", borderRadius: "6px", fontSize: "13px", fontFamily: "'Inter', sans-serif" }}
                            />
                            <input
                              type="number"
                              placeholder="Due day of month (e.g. 1 for the 1st)"
                              value={accDueDay}
                              onChange={(e) => setAccDueDay(e.target.value)}
                              min="1" max="31"
                              style={{ background: "#2D2B45", border: "1px solid rgba(255,255,255,0.1)", color: "#F0F6FC", padding: "8px 12px", borderRadius: "6px", fontSize: "13px", fontFamily: "'Inter', sans-serif" }}
                            />
                            <input
                              type="number"
                              placeholder="Amount accumulated so far"
                              value={accumulationCurrent}
                              onChange={(e) =>
                                setAccumulationCurrent(e.target.value)
                              }
                              style={{
                                background: "#2D2B45",
                                border: "1px solid rgba(255,255,255,0.1)",
                                color: "#F0F6FC",
                                padding: "8px 12px",
                                borderRadius: "6px",
                                fontSize: "13px",
                                fontFamily: "'Inter', sans-serif",
                              }}
                            />
                          </>
                        )}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          gap: "8px",
                          marginTop: "12px",
                        }}
                      >
                        <button
                          onClick={updateAccount}
                          style={{
                            background: "#6C63FF",
                            border: "none",
                            color: "#F0F6FC",
                            padding: "8px 16px",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontSize: "13px",
                            fontWeight: "600",
                            fontFamily: "'Inter', sans-serif",
                          }}
                        >
                          Save Changes
                        </button>
                        <button
                          onClick={() => setEditingAccount(null)}
                          style={{
                            background: "none",
                            border: "1px solid rgba(255,255,255,0.1)",
                            color: "#8B8FA8",
                            padding: "8px 16px",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontSize: "13px",
                            fontFamily: "'Inter', sans-serif",
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      );
    }

    if (activeNav === "income") {
      return (
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "24px",
            }}
          >
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: "24px" }}>
              Income
            </h2>
            <button
              onClick={() => {
                setShowIncomeForm(true);
                setEditingIncome(null);
                setIncomeName("");
                setIncomeOwner("joint");
                setIncomeType("salary");
                setIncomeFrequency("biweekly");
                setFixedAmount("");
                setNextPayDate("");
                setDepositAccountId("");
              }}
              style={{
                background: "#6C63FF",
                border: "none",
                color: "#0F1218",
                padding: "8px 16px",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: "600",
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              + Add Income
            </button>
          </div>

          {showIncomeForm && (
            <div className="panel" style={{ marginBottom: "16px" }}>
              <div className="panel-header">
                <div className="panel-title">New Income</div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <input
                  placeholder="Income name"
                  value={incomeName}
                  onChange={(e) => setIncomeName(e.target.value)}
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#F2F0EB", padding: "8px 12px", borderRadius: "6px", fontSize: "13px", fontFamily: "'Inter', sans-serif" }}
                />
                <input
                  type="number"
                  placeholder="Amount"
                  value={fixedAmount}
                  onChange={(e) => setFixedAmount(e.target.value)}
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#F2F0EB", padding: "8px 12px", borderRadius: "6px", fontSize: "13px", fontFamily: "'Inter', sans-serif" }}
                />
                <select
                  value={incomeOwner}
                  onChange={(e) => setIncomeOwner(e.target.value)}
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#F2F0EB", padding: "8px 12px", borderRadius: "6px", fontSize: "13px", fontFamily: "'Inter', sans-serif" }}
                >
                  <option value="joint">Joint</option>
                  <option value="mine">Mine</option>
                  <option value="partner">Partner</option>
                </select>
                <select
                  value={incomeType}
                  onChange={(e) => setIncomeType(e.target.value)}
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#F2F0EB", padding: "8px 12px", borderRadius: "6px", fontSize: "13px", fontFamily: "'Inter', sans-serif" }}
                >
                  <option value="salary">Salary</option>
                  <option value="benefits">Benefits</option>
                  <option value="fixed">Fixed</option>
                  <option value="variable">Variable</option>
                </select>
                <select
                  value={incomeFrequency}
                  onChange={(e) => setIncomeFrequency(e.target.value)}
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#F2F0EB", padding: "8px 12px", borderRadius: "6px", fontSize: "13px", fontFamily: "'Inter', sans-serif" }}
                >
                  <option value="biweekly">Biweekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="weekly">Weekly</option>
                </select>
                <select
                  value={depositAccountId}
                  onChange={(e) => setDepositAccountId(e.target.value)}
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#F2F0EB", padding: "8px 12px", borderRadius: "6px", fontSize: "13px", fontFamily: "'Inter', sans-serif" }}
                >
                  <option value="">Which account does this deposit into?</option>
                  {accounts.map((acct, i) => (
                    <option key={i} value={acct.id}>{acct.name}</option>
                  ))}
                </select>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={{ color: "rgba(255,255,255,0.6)", fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: "6px" }}>
                    Next Deposit Date
                  </label>
                  <input
                    type="date"
                    value={nextPayDate}
                    onChange={(e) => setNextPayDate(e.target.value)}
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#F2F0EB", padding: "8px 12px", borderRadius: "6px", fontSize: "13px", fontFamily: "'Inter', sans-serif", width: "100%" }}
                  />
                </div>
              </div>
              <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
                <button
                  onClick={addIncome}
                  style={{ background: "#6C63FF", border: "none", color: "#F0F6FC", padding: "8px 16px", borderRadius: "6px", cursor: "pointer", fontSize: "13px", fontWeight: "600", fontFamily: "'Inter', sans-serif" }}
                >
                  Add Income
                </button>
                <button
                  onClick={() => setShowIncomeForm(false)}
                  style={{ background: "none", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)", padding: "8px 16px", borderRadius: "6px", cursor: "pointer", fontSize: "13px", fontFamily: "'Inter', sans-serif" }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="panel">
            <div className="panel-header">
              <div className="panel-title">Income Sources</div>
              <div className="panel-count">{income.length} total</div>
            </div>
            {income.length === 0 ? (
              <div className="empty-state">No income sources added yet</div>
            ) : (
              [...income]
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((inc, i) => (
                  <div key={i}>
                    <div className="row-item">
                      <div>
                        <div className="row-name">{inc.name}</div>
                        <div className="row-sub">
                          {inc.owner} · {inc.frequency} · {inc.type}
                        </div>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        {quickEditIncomeId === inc.id ? (
                          <input
                            type="number"
                            value={quickEditIncomeAmount}
                            onChange={(e) =>
                              setQuickEditIncomeAmount(e.target.value)
                            }
                            onBlur={() =>
                              updateIncomeAmount(inc.id, quickEditIncomeAmount)
                            }
                            autoFocus
                                  onFocus={(e) => e.target.select()}
                            style={{
                              background: "#2D2B45",
                              border: "1px solid #6C63FF",
                              color: "#F0F6FC",
                              padding: "4px 8px",
                              borderRadius: "6px",
                              fontSize: "14px",
                              fontFamily: "'DM Mono', monospace",
                              width: "100px",
                              textAlign: "right",
                            }}
                          />
                        ) : (
                          <div
                            className="row-amount"
                            onClick={() => {
                              setQuickEditIncomeId(inc.id);
                              setQuickEditIncomeAmount(inc.fixed_amount || "");
                            }}
                            style={{ cursor: "pointer" }}
                            title="Click to edit"
                          >
                            ${fmt(inc.fixed_amount)}
                          </div>
                        )}
                        <button
                          onClick={() => {
                            if (editingIncome?.id === inc.id) {
                              setEditingIncome(null);
                            } else {
                              setEditingIncome(inc);
                              setShowIncomeForm(false);
                              setIncomeName(inc.name);
                              setIncomeOwner(inc.owner || "joint");
                              setIncomeType(inc.type);
                              setIncomeFrequency(inc.frequency);
                              setFixedAmount(inc.fixed_amount || "");
                              setNextPayDate(inc.next_pay_date || "");
                              setDepositAccountId(inc.deposit_account_id || "");
                            }
                          }}
                          style={{
                            background: "none",
                            border: "1px solid rgba(255,255,255,0.1)",
                            color: "#8B8FA8",
                            padding: "4px 10px",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontSize: "11px",
                            fontFamily: "'Inter', sans-serif",
                          }}
                        >
                          {editingIncome?.id === inc.id ? "Cancel" : "Edit"}
                        </button>
                        {confirmDeleteIncomeId === inc.id ? (
                          <>
                            <button
                              onClick={() => {
                                deleteIncome(inc.id);
                                setConfirmDeleteIncomeId(null);
                              }}
                              style={{
                                background: "none",
                                border: "1px solid #F87171",
                                color: "#F87171",
                                padding: "4px 10px",
                                borderRadius: "6px",
                                cursor: "pointer",
                                fontSize: "11px",
                                fontFamily: "'Inter', sans-serif",
                              }}
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setConfirmDeleteIncomeId(null)}
                              style={{
                                background: "none",
                                border: "1px solid rgba(255,255,255,0.1)",
                                color: "#8B8FA8",
                                padding: "4px 10px",
                                borderRadius: "6px",
                                cursor: "pointer",
                                fontSize: "11px",
                                fontFamily: "'Inter', sans-serif",
                              }}
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => setConfirmDeleteIncomeId(inc.id)}
                            style={{
                              background: "none",
                              border: "1px solid rgba(255,255,255,0.1)",
                              color: "#F87171",
                              padding: "4px 10px",
                              borderRadius: "6px",
                              cursor: "pointer",
                              fontSize: "11px",
                              fontFamily: "'Inter', sans-serif",
                            }}
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>

                    {editingIncome?.id === inc.id && (
                      <div
                        style={{
                          background: "#13111F",
                          border: "1px solid rgba(108,99,255,0.3)",
                          borderRadius: "8px",
                          padding: "16px",
                          margin: "8px 0 4px",
                        }}
                      >
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: "12px",
                          }}
                        >
                          <input
                            placeholder="Income name"
                            value={incomeName}
                            onChange={(e) => setIncomeName(e.target.value)}
                            style={{
                              background: "#2D2B45",
                              border: "1px solid rgba(255,255,255,0.1)",
                              color: "#F0F6FC",
                              padding: "8px 12px",
                              borderRadius: "6px",
                              fontSize: "13px",
                              fontFamily: "'Inter', sans-serif",
                            }}
                          />
                          <input
                            type="number"
                            placeholder="Amount"
                            value={fixedAmount}
                            onChange={(e) => setFixedAmount(e.target.value)}
                            style={{
                              background: "#2D2B45",
                              border: "1px solid rgba(255,255,255,0.1)",
                              color: "#F0F6FC",
                              padding: "8px 12px",
                              borderRadius: "6px",
                              fontSize: "13px",
                              fontFamily: "'Inter', sans-serif",
                            }}
                          />
                          <select
                            value={incomeOwner}
                            onChange={(e) => setIncomeOwner(e.target.value)}
                            style={{
                              background: "#2D2B45",
                              border: "1px solid rgba(255,255,255,0.1)",
                              color: "#F0F6FC",
                              padding: "8px 12px",
                              borderRadius: "6px",
                              fontSize: "13px",
                              fontFamily: "'Inter', sans-serif",
                            }}
                          >
                            <option value="joint">Joint</option>
                            {members.map((m, i) => (
                              <option key={i} value={m.name}>
                                {m.name}
                              </option>
                            ))}
                          </select>
                          <select
                            value={incomeType}
                            onChange={(e) => setIncomeType(e.target.value)}
                            style={{
                              background: "#2D2B45",
                              border: "1px solid rgba(255,255,255,0.1)",
                              color: "#F0F6FC",
                              padding: "8px 12px",
                              borderRadius: "6px",
                              fontSize: "13px",
                              fontFamily: "'Inter', sans-serif",
                            }}
                          >
                            <option value="salary">Salary</option>
                            <option value="hourly">Hourly</option>
                            <option value="benefits">Benefits</option>
                            <option value="fixed">Fixed</option>
                            <option value="variable">Variable</option>
                          </select>
                          <select
                            value={incomeFrequency}
                            onChange={(e) => setIncomeFrequency(e.target.value)}
                            style={{
                              background: "#2D2B45",
                              border: "1px solid rgba(255,255,255,0.1)",
                              color: "#F0F6FC",
                              padding: "8px 12px",
                              borderRadius: "6px",
                              fontSize: "13px",
                              fontFamily: "'Inter', sans-serif",
                            }}
                          >
                            <option value="biweekly">Biweekly</option>
                            <option value="monthly">Monthly</option>
                            <option value="weekly">Weekly</option>
                          </select>
                          <select
                            value={depositAccountId}
                            onChange={(e) =>
                              setDepositAccountId(e.target.value)
                            }
                            style={{
                              background: "#2D2B45",
                              border: "1px solid rgba(255,255,255,0.1)",
                              color: "#F0F6FC",
                              padding: "8px 12px",
                              borderRadius: "6px",
                              fontSize: "13px",
                              fontFamily: "'Inter', sans-serif",
                            }}
                          >
                            <option value="">
                              Which account does this deposit into?
                            </option>
                            {accounts.map((acct, i) => (
                              <option key={i} value={acct.id}>
                                {acct.name}
                              </option>
                            ))}
                          </select>
                          <div style={{ gridColumn: "1 / -1" }}>
                            <label
                              style={{
                                color: "#8B8FA8",
                                fontSize: "11px",
                                letterSpacing: "0.1em",
                                textTransform: "uppercase",
                                display: "block",
                                marginBottom: "6px",
                              }}
                            >
                              Next Deposit Date
                            </label>
                            <input
                              type="date"
                              value={nextPayDate}
                              onChange={(e) => setNextPayDate(e.target.value)}
                              style={{
                                background: "#2D2B45",
                                border: "1px solid rgba(255,255,255,0.1)",
                                color: "#F0F6FC",
                                padding: "8px 12px",
                                borderRadius: "6px",
                                fontSize: "13px",
                                fontFamily: "'Inter', sans-serif",
                                width: "100%",
                              }}
                            />
                          </div>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            gap: "8px",
                            marginTop: "12px",
                          }}
                        >
                          <button
                            onClick={updateIncome}
                            style={{
                              background: "#6C63FF",
                              border: "none",
                              color: "#F0F6FC",
                              padding: "8px 16px",
                              borderRadius: "6px",
                              cursor: "pointer",
                              fontSize: "13px",
                              fontWeight: "600",
                              fontFamily: "'Inter', sans-serif",
                            }}
                          >
                            Save Changes
                          </button>
                          <button
                            onClick={() => setEditingIncome(null)}
                            style={{
                              background: "none",
                              border: "1px solid rgba(255,255,255,0.1)",
                              color: "#8B8FA8",
                              padding: "8px 16px",
                              borderRadius: "6px",
                              cursor: "pointer",
                              fontSize: "13px",
                              fontFamily: "'Inter', sans-serif",
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
            )}
          </div>
        </div>
      );
    }

    if (activeNav === "bills") {
      return (
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "24px",
            }}
          >
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: "24px" }}>
              Bills
            </h2>
            <button
              onClick={() => {
                setShowBillForm(true);
                setEditingBill(null);
                setBillName("");
                setBillAmount("");
                setDueDay("");
                setPaymentMethod("auto");
                setBillCategory("");
                setBillOwner("joint");
                setBillAccountId("");
                setIsVariable(false);
              }}
              style={{
                background: "#6C63FF",
                border: "none",
                color: "#0F1218",
                padding: "8px 16px",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: "600",
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              + Add Bill
            </button>
          </div>

          {showBillForm && (
            <div className="panel" style={{ marginBottom: "16px" }}>
              <div className="panel-header">
                <div className="panel-title">New Bill</div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <input
                  placeholder="Bill name"
                  value={billName}
                  onChange={(e) => setBillName(e.target.value)}
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#F2F0EB", padding: "8px 12px", borderRadius: "6px", fontSize: "13px", fontFamily: "'Inter', sans-serif" }}
                />
                <input
                  type="number"
                  placeholder="Amount"
                  value={billAmount}
                  onChange={(e) => setBillAmount(e.target.value)}
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#F2F0EB", padding: "8px 12px", borderRadius: "6px", fontSize: "13px", fontFamily: "'Inter', sans-serif" }}
                />
                <input
                  type="number"
                  placeholder="Due day of month"
                  value={dueDay}
                  onChange={(e) => setDueDay(e.target.value)}
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#F2F0EB", padding: "8px 12px", borderRadius: "6px", fontSize: "13px", fontFamily: "'Inter', sans-serif" }}
                />
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#F2F0EB", padding: "8px 12px", borderRadius: "6px", fontSize: "13px", fontFamily: "'Inter', sans-serif" }}
                >
                  <option value="auto">Auto</option>
                  <option value="transfer">Transfer</option>
                  <option value="zelle">Zelle</option>
                  <option value="check">Check</option>
                  <option value="manual">Manual</option>
                </select>
                <select
                  value={billCategory}
                  onChange={(e) => setBillCategory(e.target.value)}
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#F2F0EB", padding: "8px 12px", borderRadius: "6px", fontSize: "13px", fontFamily: "'Inter', sans-serif" }}
                >
                  <option value="">Select category</option>
                  {categories.map((cat, i) => (
                    <option key={i} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
                <select
                  value={billAccountId}
                  onChange={(e) => setBillAccountId(e.target.value)}
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#F2F0EB", padding: "8px 12px", borderRadius: "6px", fontSize: "13px", fontFamily: "'Inter', sans-serif" }}
                >
                  <option value="">{isBillAccumulating ? "Transfer from which account?" : "Which account pays this?"}</option>
                  {accounts.map((acct, i) => (
                    <option key={i} value={acct.id}>{acct.name}</option>
                  ))}
                </select>
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", marginTop: "4px" }}>
                <input
                  type="checkbox"
                  checked={isBillAccumulating}
                  onChange={(e) => { setIsBillAccumulating(e.target.checked); if (!e.target.checked) setTransferToAccountId(""); }}
                />
                <span style={{ fontSize: "13px", color: "#8B8FA8" }}>This is a transfer to another account</span>
              </label>
              {isBillAccumulating && (
                <select
                  value={transferToAccountId}
                  onChange={(e) => setTransferToAccountId(e.target.value)}
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#F2F0EB", padding: "8px 12px", borderRadius: "6px", fontSize: "13px", fontFamily: "'Inter', sans-serif" }}
                >
                  <option value="">Transfer to which account?</option>
                  {accounts.map((acct, i) => (
                    <option key={i} value={acct.id}>{acct.name}{acct.is_accumulating ? " (saving)" : ""}</option>
                  ))}
                </select>
              )}
              <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
                <button
                  onClick={addBill}
                  style={{ background: "#6C63FF", border: "none", color: "#F0F6FC", padding: "8px 16px", borderRadius: "6px", cursor: "pointer", fontSize: "13px", fontWeight: "600", fontFamily: "'Inter', sans-serif" }}
                >
                  Add Bill
                </button>
                <button
                  onClick={() => setShowBillForm(false)}
                  style={{ background: "none", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)", padding: "8px 16px", borderRadius: "6px", cursor: "pointer", fontSize: "13px", fontFamily: "'Inter', sans-serif" }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="panel">
            <div className="panel-header">
              <div className="panel-title">All Bills</div>
              <div className="panel-count">{bills.length} total</div>
            </div>
            {bills.length === 0 ? (
              <div className="empty-state">No bills added yet</div>
            ) : (
              [...bills]
                .sort((a, b) => a.due_day - b.due_day)
                .map((bill, i) => (
                  <div key={i}>
                    <div className="row-item">
                      <div>
                        <div
                          className="row-name"
                          style={{
                            color: !isBillDue(bill) ? "#8B8FA8" : "#F0F6FC",
                            textDecoration: !isBillDue(bill)
                              ? "line-through"
                              : "none",
                          }}
                        >
                          {bill.name}
                        </div>
                        <div className="row-sub">
                          Due the {bill.due_day}
                          {getSuffix(bill.due_day)} · {bill.category} ·{" "}
                          {bill.payment_method}
                          {!isBillDue(bill) && " · PAID"}
                        </div>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        {quickEditBillId === bill.id ? (
                          <input
                            type="number"
                            value={quickEditBillAmount}
                            onChange={(e) =>
                              setQuickEditBillAmount(e.target.value)
                            }
                            onBlur={() =>
                              updateBillAmount(bill.id, quickEditBillAmount)
                            }
                            autoFocus
                                  onFocus={(e) => e.target.select()}
                            style={{
                              background: "#2D2B45",
                              border: "1px solid #6C63FF",
                              color: "#F0F6FC",
                              padding: "4px 8px",
                              borderRadius: "6px",
                              fontSize: "14px",
                              fontFamily: "'DM Mono', monospace",
                              width: "100px",
                              textAlign: "right",
                            }}
                          />
                        ) : (
                          <div
                            className="row-amount"
                            onClick={() => {
                              setQuickEditBillId(bill.id);
                              setQuickEditBillAmount(bill.amount ?? "");
                            }}
                            style={{ cursor: "pointer" }}
                            title="Click to edit"
                          >
                            ${fmt(bill.amount)}
                          </div>
                        )}
                        {!isBillDue(bill) ? (
                          <button
                            onClick={() => markBillUnpaid(bill)}
                            style={{
                              background: "none",
                              border: "1px solid rgba(248,113,113,0.4)",
                              color: "#F87171",
                              padding: "4px 10px",
                              borderRadius: "6px",
                              cursor: "pointer",
                              fontSize: "11px",
                              fontFamily: "'Inter', sans-serif",
                            }}
                          >
                            Unpaid
                          </button>
                        ) : (
                          <button
                            onClick={() => markBillPaid(bill)}
                            style={{
                              background: "none",
                              border: "1px solid rgba(74,222,128,0.4)",
                              color: "#4ADE80",
                              padding: "4px 10px",
                              borderRadius: "6px",
                              cursor: "pointer",
                              fontSize: "11px",
                              fontFamily: "'Inter', sans-serif",
                            }}
                          >
                            Paid
                          </button>
                        )}
                        <button
                          onClick={() => {
                            if (editingBill?.id === bill.id) {
                              setEditingBill(null);
                            } else {
                              setEditingBill(bill);
                              setShowBillForm(false);
                              setBillName(bill.name);
                              setBillAmount(bill.amount);
                              setDueDay(bill.due_day);
                              setPaymentMethod(bill.payment_method);
                              setBillCategory(bill.category);
                              setBillOwner(bill.owner);
                              setBillAccountId(bill.account_id || "");
                              setTransferToAccountId(bill.transfer_to_account_id || "");
                              setIsBillAccumulating(!!bill.transfer_to_account_id);
                              setIsVariable(bill.is_variable);
                            }
                          }}
                          style={{
                            background: "none",
                            border: "1px solid rgba(255,255,255,0.15)",
                            color: "#8B8FA8",
                            padding: "4px 10px",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontSize: "11px",
                            fontFamily: "'Inter', sans-serif",
                          }}
                        >
                          {editingBill?.id === bill.id ? "Cancel" : "Edit"}
                        </button>
                      </div>
                    </div>

                    {editingBill?.id === bill.id && (
                      <div
                        style={{
                          background: "#13111F",
                          border: "1px solid rgba(108,99,255,0.3)",
                          borderRadius: "8px",
                          padding: "16px",
                          margin: "8px 0 4px",
                        }}
                      >
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: "12px",
                          }}
                        >
                          <input
                            placeholder="Bill name"
                            value={billName}
                            onChange={(e) => setBillName(e.target.value)}
                            style={{
                              background: "#2D2B45",
                              border: "1px solid rgba(255,255,255,0.1)",
                              color: "#F0F6FC",
                              padding: "8px 12px",
                              borderRadius: "6px",
                              fontSize: "13px",
                              fontFamily: "'Inter', sans-serif",
                            }}
                          />
                          <input
                            type="number"
                            placeholder="Amount"
                            value={billAmount}
                            onChange={(e) => setBillAmount(e.target.value)}
                            style={{
                              background: "#2D2B45",
                              border: "1px solid rgba(255,255,255,0.1)",
                              color: "#F0F6FC",
                              padding: "8px 12px",
                              borderRadius: "6px",
                              fontSize: "13px",
                              fontFamily: "'Inter', sans-serif",
                            }}
                          />
                          <input
                            type="number"
                            placeholder="Due day of month"
                            value={dueDay}
                            onChange={(e) => setDueDay(e.target.value)}
                            style={{
                              background: "#2D2B45",
                              border: "1px solid rgba(255,255,255,0.1)",
                              color: "#F0F6FC",
                              padding: "8px 12px",
                              borderRadius: "6px",
                              fontSize: "13px",
                              fontFamily: "'Inter', sans-serif",
                            }}
                          />
                          <select
                            value={paymentMethod}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            style={{
                              background: "#2D2B45",
                              border: "1px solid rgba(255,255,255,0.1)",
                              color: "#F0F6FC",
                              padding: "8px 12px",
                              borderRadius: "6px",
                              fontSize: "13px",
                              fontFamily: "'Inter', sans-serif",
                            }}
                          >
                            <option value="auto">Auto</option>
                            <option value="transfer">Transfer</option>
                            <option value="zelle">Zelle</option>
                            <option value="check">Check</option>
                            <option value="manual">Manual</option>
                          </select>
                          <select
                            value={billCategory}
                            onChange={(e) => setBillCategory(e.target.value)}
                            style={{
                              background: "#2D2B45",
                              border: "1px solid rgba(255,255,255,0.1)",
                              color: "#F0F6FC",
                              padding: "8px 12px",
                              borderRadius: "6px",
                              fontSize: "13px",
                              fontFamily: "'Inter', sans-serif",
                            }}
                          >
                            <option value="">Select category</option>
                            {categories.map((cat, i) => (
                              <option key={i} value={cat.name}>
                                {cat.name}
                              </option>
                            ))}
                          </select>
                          <select
                            value={billAccountId}
                            onChange={(e) => setBillAccountId(e.target.value)}
                            style={{
                              background: "#2D2B45",
                              border: "1px solid rgba(255,255,255,0.1)",
                              color: "#F0F6FC",
                              padding: "8px 12px",
                              borderRadius: "6px",
                              fontSize: "13px",
                              fontFamily: "'Inter', sans-serif",
                            }}
                          >
                            <option value="">{isBillAccumulating ? "Transfer from which account?" : "Which account pays this?"}</option>
                            {accounts.map((acct, i) => (
                              <option key={i} value={acct.id}>
                                {acct.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", marginTop: "4px" }}>
                          <input
                            type="checkbox"
                            checked={isBillAccumulating}
                            onChange={(e) => { setIsBillAccumulating(e.target.checked); if (!e.target.checked) setTransferToAccountId(""); }}
                          />
                          <span style={{ fontSize: "13px", color: "#8B8FA8" }}>This is a transfer to another account</span>
                        </label>
                        {isBillAccumulating && (
                          <select
                            value={transferToAccountId}
                            onChange={(e) => setTransferToAccountId(e.target.value)}
                            style={{
                              background: "#2D2B45",
                              border: "1px solid rgba(255,255,255,0.1)",
                              color: "#F0F6FC",
                              padding: "8px 12px",
                              borderRadius: "6px",
                              fontSize: "13px",
                              fontFamily: "'Inter', sans-serif",
                              marginTop: "4px",
                            }}
                          >
                            <option value="">Transfer to which account?</option>
                            {accounts.map((acct, i) => (
                              <option key={i} value={acct.id}>
                                {acct.name}{acct.is_accumulating ? " (saving)" : ""}
                              </option>
                            ))}
                          </select>
                        )}
                        <div
                          style={{
                            display: "flex",
                            gap: "8px",
                            marginTop: "12px",
                          }}
                        >
                          <button
                            onClick={updateBill}
                            style={{
                              background: "#6C63FF",
                              border: "none",
                              color: "#F0F6FC",
                              padding: "8px 16px",
                              borderRadius: "6px",
                              cursor: "pointer",
                              fontSize: "13px",
                              fontWeight: "600",
                              fontFamily: "'Inter', sans-serif",
                            }}
                          >
                            Save Changes
                          </button>
                          <button
                            onClick={() => setEditingBill(null)}
                            style={{
                              background: "none",
                              border: "1px solid rgba(255,255,255,0.1)",
                              color: "#8B8FA8",
                              padding: "8px 16px",
                              borderRadius: "6px",
                              cursor: "pointer",
                              fontSize: "13px",
                              fontFamily: "'Inter', sans-serif",
                            }}
                          >
                            Cancel
                          </button>
                          {confirmDeleteBillId === bill.id ? (
                            <>
                              <button
                                onClick={() => { deleteBill(bill.id); setConfirmDeleteBillId(null); setEditingBill(null); }}
                                style={{ background: "none", border: "1px solid #F87171", color: "#F87171", padding: "8px 16px", borderRadius: "6px", cursor: "pointer", fontSize: "13px", fontFamily: "'Inter', sans-serif", marginLeft: "auto" }}
                              >
                                Confirm Delete
                              </button>
                              <button
                                onClick={() => setConfirmDeleteBillId(null)}
                                style={{ background: "none", border: "1px solid rgba(255,255,255,0.1)", color: "#8B8FA8", padding: "8px 16px", borderRadius: "6px", cursor: "pointer", fontSize: "13px", fontFamily: "'Inter', sans-serif" }}
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => setConfirmDeleteBillId(bill.id)}
                              style={{ background: "none", border: "1px solid rgba(248,113,113,0.3)", color: "#F87171", padding: "8px 16px", borderRadius: "6px", cursor: "pointer", fontSize: "13px", fontFamily: "'Inter', sans-serif", marginLeft: "auto" }}
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))
            )}
          </div>
        </div>
      );
    }

    return renderDashboard();
  }

  function renderDashboard() {
    return (
      <div className="content-area">
          <div className="stat-row">
            {(() => {
              const primaryBalance = accounts.filter((a) => a.is_primary && !a.is_accumulating).reduce((sum, a) => sum + (a.current_balance || 0), 0);
              const now = new Date();
              const currentMonth = now.getMonth();
              const currentYear = now.getFullYear();
              const remainingBills = bills
                .filter((b) => {
                  if (!isBillDue(b)) return false;
                  const dueDate = new Date(currentYear, currentMonth, b.due_day);
                  return dueDate.getMonth() === currentMonth && dueDate.getFullYear() === currentYear;
                })
                .reduce((sum, b) => {
                  const amount = b.amount || 0;
                  const acct = accounts.find((a) =>
                    (a.id === b.account_id || a.id === b.transfer_to_account_id) && a.is_accumulating
                  );
                  const saved = acct ? Math.min(acct.current_balance || 0, amount) : 0;
                  return sum + Math.max(0, amount - saved);
                }, 0);
              const leftAfterBills = primaryBalance - remainingBills;
              return (
                <>
                  <div className="stat-card">
                    <div className="stat-label">Available Funds</div>
                    <div className="stat-amount">${fmt(primaryBalance)}</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-label">Remaining Bills</div>
                    <div className="stat-amount">${fmt(remainingBills)}</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-label">Left After Bills</div>
                    <div className={`stat-amount ${leftAfterBills < 0 ? "negative" : "neutral"}`}>
                      {leftAfterBills < 0 ? "-" : ""}${fmt(Math.abs(leftAfterBills))}
                    </div>
                  </div>
                </>
              );
            })()}
          </div>

          <div className="dashboard-grid">
            <div className="dashboard-left">
              {getPayPeriodBreakdown().map((item, i) => (
                <div
                  key={i}
                  className="panel"
                  style={{ cursor: "pointer" }}
                  onClick={() => {
                    setExpandedPeriods((prev) => {
                      const next = new Set(prev);
                      if (next.has(i)) {
                        next.delete(i);
                      } else {
                        next.add(i);
                      }
                      return next;
                    });
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: "14px",
                          fontWeight: "600",
                          color: "#F0F6FC",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        {fmtDate(item.period.start_date)} —{" "}
                        {fmtDate(item.period.end_date)}
                        {item.isCurrentPeriod && (
                          <span
                            style={{
                              fontSize: "9px",
                              background: "#00D4AA",
                              color: "#0F1218",
                              padding: "2px 8px",
                              borderRadius: "4px",
                              letterSpacing: "0.08em",
                              textTransform: "uppercase",
                              fontWeight: "700",
                            }}
                          >
                            Current
                          </span>
                        )}
                      </div>
                      {item.incomeItems.length > 0 && (
                        <div
                          style={{
                            fontSize: "11px",
                            color: "#8B8FA8",
                            marginTop: "4px",
                          }}
                        >
                          {item.incomeItems.map((inc, j) => (
                            <span key={j}>
                              {inc.name} deposits
                              {j < item.incomeItems.length - 1 ? " · " : ""}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "16px",
                      }}
                    >
                      <div style={{ textAlign: "right" }}>
                        <div
                          style={{
                            fontSize: "9px",
                            color: "#8B8FA8",
                            letterSpacing: "0.12em",
                            textTransform: "uppercase",
                            marginBottom: "4px",
                            fontWeight: "600",
                          }}
                        >
                          Left Over
                        </div>
                        <div
                          style={{
                            fontFamily: "'DM Mono', monospace",
                            fontSize: "22px",
                            fontWeight: "500",
                            color: item.leftOver < 0 ? "#F87171" : "#4ADE80",
                          }}
                        >
                          {item.leftOver < 0 ? "-" : ""}$
                          {fmt(Math.abs(item.leftOver))}
                        </div>
                      </div>
                      <div style={{ color: "#8B8FA8", fontSize: "12px" }}>
                        {expandedPeriods.has(i) ? "▲" : "▼"}
                      </div>
                    </div>
                  </div>

                  {expandedPeriods.has(i) && (
                    <div
                      style={{ marginTop: "16px" }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: "8px",
                          marginBottom: item.bills.length > 0 ? "12px" : "0",
                        }}
                      >
                        <div
                          style={{
                            background: "rgba(255,255,255,0.03)",
                            borderRadius: "8px",
                            padding: "10px 12px",
                          }}
                        >
                          <div
                            style={{
                              fontSize: "9px",
                              color: "#8B8FA8",
                              letterSpacing: "0.12em",
                              textTransform: "uppercase",
                              marginBottom: "4px",
                              fontWeight: "600",
                            }}
                          >
                            Income
                          </div>
                          <div
                            style={{
                              fontFamily: "'DM Mono', monospace",
                              fontSize: "16px",
                              color: "#4ADE80",
                            }}
                          >
                            ${fmt(item.income)}
                          </div>
                        </div>
                        <div
                          style={{
                            background: "rgba(255,255,255,0.03)",
                            borderRadius: "8px",
                            padding: "10px 12px",
                          }}
                        >
                          <div
                            style={{
                              fontSize: "9px",
                              color: "#8B8FA8",
                              letterSpacing: "0.12em",
                              textTransform: "uppercase",
                              marginBottom: "4px",
                              fontWeight: "600",
                            }}
                          >
                            Bills Due
                          </div>
                          <div
                            style={{
                              fontFamily: "'DM Mono', monospace",
                              fontSize: "16px",
                              color:
                                item.billsTotal > 0 ? "#F87171" : "#8B8FA8",
                            }}
                          >
                            ${fmt(item.billsTotal)}
                          </div>
                        </div>
                      </div>

                      {item.contributions?.length > 0 && (
                        <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "12px", marginBottom: item.bills.length > 0 ? "12px" : "0" }}>
                          <div style={{ fontSize: "9px", color: "#6C63FF", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: "600", marginBottom: "8px" }}>Set Aside</div>
                          {item.contributions.map((c, j) => {
                            const saKey = `sa-${item.period.start_date}-${c.accountId}`;
                            const done = !!setAsideDone[saKey];
                            return (
                              <div key={j} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 0", borderBottom: j < item.contributions.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                                <div>
                                  <div style={{ fontSize: "13px", color: done ? "#4ADE80" : "#F0F6FC", fontWeight: "500" }}>{done ? "✓ " : "→ "}{c.name}</div>
                                  <div style={{ fontSize: "11px", color: "#8B8FA8", marginTop: "2px" }}>${Math.round(c.saved).toLocaleString()} of ${Math.round(c.target).toLocaleString()} saved</div>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                  {!done && <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "13px", color: "#6C63FF" }}>${c.amount % 1 === 0 ? c.amount.toLocaleString() : c.amount.toFixed(2)}</span>}
                                  {done ? (
                                    <span style={{ fontSize: "11px", color: "#4ADE80", fontWeight: "600" }}>Transferred</span>
                                  ) : (
                                    <button
                                      onClick={async (e) => {
                                        e.stopPropagation();
                                        const acct = accounts.find((a) => a.id === c.accountId);
                                        if (acct) {
                                          const newBalance = (acct.current_balance || 0) + c.amount;
                                          await supabase.from("accounts").update({ current_balance: newBalance }).eq("id", c.accountId);
                                          setAccounts((prev) => prev.map((a) => a.id === c.accountId ? { ...a, current_balance: newBalance } : a));
                                        }
                                        setSetAsideDone((prev) => ({ ...prev, [saKey]: true }));
                                      }}
                                      style={{ background: "rgba(108,99,255,0.15)", border: "1px solid rgba(108,99,255,0.4)", color: "#6C63FF", padding: "4px 10px", borderRadius: "6px", cursor: "pointer", fontSize: "11px", fontFamily: "'Inter', sans-serif", fontWeight: "500" }}
                                    >
                                      Transfer
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {item.bills.length > 0 && (
                        <div
                          style={{
                            borderTop: "1px solid rgba(255,255,255,0.05)",
                            paddingTop: "12px",
                          }}
                        >
                          {item.bills.map((bill, j) => (
                            <div
                              key={j}
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                padding: "7px 0",
                                borderBottom:
                                  j < item.bills.length - 1
                                    ? "1px solid rgba(255,255,255,0.04)"
                                    : "none",
                              }}
                            >
                              <div>
                                <div
                                  style={{
                                    fontSize: "13px",
                                    color: "#F0F6FC",
                                    fontWeight: "500",
                                  }}
                                >
                                  {bill.name}
                                </div>
                                <div
                                  style={{
                                    fontSize: "11px",
                                    color: "#8B8FA8",
                                    marginTop: "2px",
                                  }}
                                >
                                  Due the {bill.due_day}
                                  {getSuffix(bill.due_day)}
                                </div>
                              </div>
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "10px",
                                }}
                              >
                                <span
                                  style={{
                                    fontFamily: "'DM Mono', monospace",
                                    fontSize: "13px",
                                    color: "#8B8FA8",
                                  }}
                                >
                                  ${fmt(bill.amount)}
                                </span>
                                <button
                                  onClick={() => markBillPaid(bill)}
                                  style={{
                                    background: "rgba(74,222,128,0.1)",
                                    border: "1px solid rgba(74,222,128,0.3)",
                                    color: "#4ADE80",
                                    padding: "3px 10px",
                                    borderRadius: "5px",
                                    cursor: "pointer",
                                    fontSize: "11px",
                                    fontFamily: "'Inter', sans-serif",
                                    fontWeight: "500",
                                  }}
                                >
                                  Paid
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="dashboard-right">
              <div className="panel">
                <div className="panel-header">
                  <div className="panel-title">Accounts</div>
                  <div className="panel-count">{accounts.length} total</div>
                </div>
                {accounts.length === 0 ? (
                  <div className="empty-state">No accounts added yet</div>
                ) : (
                  accounts.map((acct, i) => (
                    <div className="row-item" key={i}>
                      <div>
                        <div className="row-name">
                          {acct.name}
                          {acct.is_primary && (
                            <span className="tag">Primary</span>
                          )}
                          {acct.is_accumulating && (
                            <span className="tag">Saving</span>
                          )}
                        </div>
                        <div className="row-sub">
                          {acct.bank_name} ···{acct.last_four}
                        </div>
                        {acct.is_accumulating &&
                          acct.accumulation_target > 0 && (
                            <div className="accumulating-bar">
                              <div
                                className="accumulating-fill"
                                style={{
                                  width: `${Math.min(100, ((acct.accumulation_current || 0) / acct.accumulation_target) * 100)}%`,
                                }}
                              />
                            </div>
                          )}
                      </div>
                      {quickEditAccountId === acct.id ? (
                        <input
                          type="number"
                          value={quickEditBalance}
                          onChange={(e) => setQuickEditBalance(e.target.value)}
                          onBlur={() =>
                            updateAccountBalance(acct.id, quickEditBalance)
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") updateAccountBalance(acct.id, quickEditBalance);
                            if (e.key === "Escape") { setQuickEditAccountId(null); setQuickEditBalance(""); }
                          }}
                          autoFocus
                                  onFocus={(e) => e.target.select()}
                          style={{
                            background: "#2D2B45",
                            border: "1px solid #6C63FF",
                            color: "#F0F6FC",
                            padding: "4px 8px",
                            borderRadius: "6px",
                            fontSize: "14px",
                            fontFamily: "'DM Mono', monospace",
                            width: "90px",
                            textAlign: "right",
                          }}
                        />
                      ) : (
                        <div
                          className="row-amount"
                          onClick={() => {
                            setQuickEditAccountId(acct.id);
                            setQuickEditBalance(acct.current_balance ?? "");
                          }}
                          style={{ cursor: "pointer" }}
                          title="Click to edit"
                        >
                          ${fmt(acct.current_balance)}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
              <div className="panel">
                <div className="panel-header">
                  <div className="panel-title">Where the Money Goes</div>
                  <div className="panel-count">This pay period</div>
                </div>
                {(() => {
                  const currentBreakdown = getPayPeriodBreakdown().find(
                    (item) => item.isCurrentPeriod,
                  );

                  // Split bills into regular bills and explicit account transfers
                  const periodBills = currentBreakdown?.bills || [];

                  // Regular bills: current period only, not transfer bills, not assigned to accumulating accounts
                  const regularBills = periodBills.filter((b) => {
                    if (b.transfer_to_account_id) return false;
                    const acct = accounts.find((a) => a.id === b.account_id);
                    return !acct?.is_accumulating;
                  });

                  // Non-accumulating transfer bills: show full amount for current period
                  const periodTransferBills = periodBills.filter((b) => {
                    if (!b.transfer_to_account_id) return false;
                    const dest = accounts.find((a) => a.id === b.transfer_to_account_id);
                    return !dest?.is_accumulating;
                  });

                  // Accumulating accounts with a due_day drive their own contribution rows
                  const accumulatingAccounts = accounts.filter(
                    (a) => a.is_accumulating && a.due_day && a.accumulation_target
                  );

                  // Group regular bills by source account
                  const grouped = {};
                  regularBills.forEach((bill) => {
                    const acct = accounts.find((a) => a.id === bill.account_id);
                    const key = acct ? acct.id : "unassigned";
                    if (!grouped[key]) {
                      grouped[key] = {
                        acctName: acct ? acct.name : "Unassigned",
                        total: 0,
                        bills: [],
                        balance: acct?.current_balance || 0,
                        buffer: acct?.minimum_buffer || 0,
                      };
                    }
                    grouped[key].total += bill.amount || 0;
                    grouped[key].bills.push(bill);
                  });

                  const renderTransferRow = (rowKey, label, suggestedAmount, subtitle) => {
                    const transferred = transfers[rowKey] || 0;
                    const remaining = Math.max(0, suggestedAmount - transferred);
                    const done = transferred >= suggestedAmount;

                    return (
                      <div key={rowKey} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", padding: "10px 0" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div>
                            <div className="row-name" style={{ color: done ? "#4ADE80" : "#F0F6FC" }}>
                              {done ? "✓ " : ""}{label}
                            </div>
                            {subtitle && <div className="row-sub">{subtitle}</div>}
                            {transferred > 0 && !done && (
                              <div style={{ fontSize: "10px", color: "#6C63FF", marginTop: "2px" }}>
                                ${fmt(transferred)} transferred · ${fmt(remaining)} remaining
                              </div>
                            )}
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            {!done && (
                              <div style={{ textAlign: "right" }}>
                                <div className="row-amount" style={{ color: remaining < suggestedAmount ? "#6C63FF" : "#F0F6FC" }}>
                                  ${fmt(remaining)}
                                </div>
                                <div style={{ fontSize: "10px", color: "#8B8FA8" }}>this paycheck</div>
                              </div>
                            )}
                            {!done && transferringId === rowKey ? (
                              <>
                                <input
                                  type="number"
                                  value={transferAmount}
                                  onChange={(e) => setTransferAmount(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") confirmTransfer(rowKey, transferAmount);
                                    if (e.key === "Escape") { setTransferringId(null); setTransferAmount(""); }
                                  }}
                                  autoFocus
                                  onFocus={(e) => e.target.select()}
                                  style={{ background: "#2D2B45", border: "1px solid #6C63FF", color: "#F0F6FC", padding: "4px 8px", borderRadius: "6px", fontSize: "13px", fontFamily: "'DM Mono', monospace", width: "90px", textAlign: "right" }}
                                />
                                <button
                                  onClick={() => confirmTransfer(rowKey, transferAmount)}
                                  style={{ background: "#6C63FF", border: "none", color: "#0F1218", padding: "4px 10px", borderRadius: "6px", cursor: "pointer", fontSize: "11px", fontFamily: "'Inter', sans-serif", fontWeight: "600" }}
                                >
                                  Confirm
                                </button>
                                <button
                                  onClick={() => { setTransferringId(null); setTransferAmount(""); }}
                                  style={{ background: "none", border: "1px solid rgba(255,255,255,0.1)", color: "#8B8FA8", padding: "4px 10px", borderRadius: "6px", cursor: "pointer", fontSize: "11px", fontFamily: "'Inter', sans-serif" }}
                                >
                                  Cancel
                                </button>
                              </>
                            ) : !done ? (
                              <button
                                onClick={() => { setTransferringId(rowKey); setTransferAmount(remaining.toFixed(2)); }}
                                style={{ background: "rgba(0,212,170,0.1)", border: "1px solid rgba(0,212,170,0.4)", color: "#00D4AA", padding: "4px 10px", borderRadius: "6px", cursor: "pointer", fontSize: "11px", fontFamily: "'Inter', sans-serif", fontWeight: "500" }}
                              >
                                Transfer
                              </button>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    );
                  };

                  const billRows = Object.entries(grouped).flatMap(([key, data]) => {
                    const transferNeeded = Math.max(0, data.total + data.buffer);
                    if (transferNeeded === 0) return [];
                    const subtitle = data.buffer > 0 ? `Includes $${fmt(data.buffer)} buffer` : null;
                    return [renderTransferRow(key, `Transfer to ${data.acctName}`, transferNeeded, subtitle)];
                  });

                  const today = new Date();
                  const currentPeriodIndex = payPeriods.findIndex((p) => {
                    const start = new Date(p.start_date + "T00:00:00");
                    const end = new Date(p.end_date + "T23:59:59");
                    return today >= start && today <= end;
                  });

                  const periodsUntilDue = (bill) => {
                    let dueDate = new Date(today.getFullYear(), today.getMonth(), bill.due_day);
                    if (dueDate < today) dueDate = new Date(today.getFullYear(), today.getMonth() + 1, bill.due_day);
                    if (currentPeriodIndex === -1) return 1;
                    let count = 0;
                    for (let i = currentPeriodIndex; i < payPeriods.length; i++) {
                      count++;
                      if (dueDate <= new Date(payPeriods[i].end_date + "T23:59:59")) break;
                    }
                    return Math.max(1, count);
                  };

                  // Non-accumulating transfer bills: show full amount for current period
                  const periodTransferRows = periodTransferBills.map((bill) => {
                    const destAcct = accounts.find((a) => a.id === bill.transfer_to_account_id);
                    const destName = destAcct ? destAcct.name : "Unknown";
                    return renderTransferRow(`transfer-${bill.id}`, destName, bill.amount, null);
                  });

                  // Account-driven: accumulating accounts with due_day + accumulation_target
                  const coveredAcctIds = new Set(accumulatingAccounts.map((a) => a.id));
                  const accumulatingRows = accumulatingAccounts.flatMap((acct) => {
                    const target = acct.accumulation_target;
                    const saved = Math.min(acct.current_balance || 0, target);
                    const stillNeeded = Math.max(0, target - saved);
                    if (stillNeeded === 0) return [];
                    const periods = periodsUntilDue({ due_day: acct.due_day });
                    const amountThisPeriod = stillNeeded / periods;
                    const subtitle = `$${fmt(saved)} of $${fmt(target)} saved`;
                    return [renderTransferRow(`acct-${acct.id}`, acct.name, amountThisPeriod, subtitle)];
                  });

                  // Bill-driven: bills that transfer to an accumulating account (e.g. Rent → Mortgage savings)
                  const billDrivenRows = bills
                    .filter((b) => {
                      if (!b.transfer_to_account_id) return false;
                      const dest = accounts.find((a) => a.id === b.transfer_to_account_id);
                      if (!dest?.is_accumulating) return false;
                      return !coveredAcctIds.has(dest.id);
                    })
                    .flatMap((bill) => {
                      const dest = accounts.find((a) => a.id === bill.transfer_to_account_id);
                      const target = bill.amount;
                      const saved = Math.min(dest.current_balance || 0, target);
                      const stillNeeded = Math.max(0, target - saved);
                      if (stillNeeded === 0) return [];
                      const periods = periodsUntilDue(bill);
                      const amountThisPeriod = stillNeeded / periods;
                      const subtitle = `$${fmt(saved)} of $${fmt(target)} saved`;
                      return [renderTransferRow(`bill-acct-${bill.id}`, dest.name, amountThisPeriod, subtitle)];
                    });

                  const allTransferRows = [...periodTransferRows, ...accumulatingRows, ...billDrivenRows];

                  if (billRows.length === 0 && allTransferRows.length === 0) {
                    return <div className="empty-state">No allocations this period</div>;
                  }

                  return (
                    <>
                      {billRows.length > 0 && (
                        <>
                          <div style={{ fontSize: "10px", color: "#8B8FA8", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "8px" }}>Bills</div>
                          {billRows}
                        </>
                      )}
                      {allTransferRows.length > 0 && (
                        <>
                          <div style={{ fontSize: "10px", color: "#8B8FA8", letterSpacing: "0.08em", textTransform: "uppercase", margin: billRows.length > 0 ? "16px 0 8px" : "0 0 8px" }}>Transfers</div>
                          {allTransferRows}
                        </>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
    );
  }

  return (
    <div className="app-shell">
      <style>{css}</style>

      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-text">Stryde</div>
          <div className="logo-tag">Stop hoping. Start knowing.</div>
        </div>
        <nav className="nav">
          <div className="nav-label">Main</div>
          {[
            {
              key: "dashboard",
              label: "Dashboard",
              icon: <LayoutDashboard size={16} />,
            },
            { key: "bills", label: "Bills", icon: <Receipt size={16} /> },
            { key: "income", label: "Income", icon: <Wallet size={16} /> },
            {
              key: "accounts",
              label: "Accounts",
              icon: <CreditCard size={16} />,
            },
            { key: "categories", label: "Categories", icon: <Tag size={16} /> },
          ].map((item) => (
            <button
              key={item.key}
              className={`nav-item ${activeNav === item.key ? "active" : ""}`}
              onClick={() => navigate(item.key)}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
          <div className="nav-label">Planning</div>
          {[
            {
              key: "payperiods",
              label: "Pay Periods",
              icon: <Calendar size={16} />,
            },
            { key: "debts", label: "Debts", icon: <TrendingDown size={16} /> },
          ].map((item) => (
            <button
              key={item.key}
              className={`nav-item ${activeNav === item.key ? "active" : ""}`}
              onClick={() => navigate(item.key)}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
          <div className="nav-label">Account</div>
          <button
            className="nav-item"
            onClick={() => { navigate("settings"); setScrollToInvite(true); }}
          >
            <UserPlus size={16} />
            Invite Member
          </button>
          <button
            className={`nav-item ${activeNav === "settings" ? "active" : ""}`}
            onClick={() => navigate("settings")}
          >
            <Settings size={16} />
            Settings
          </button>
        </nav>
        <div className="sidebar-footer">
          <button
            className="signout-btn"
            onClick={() => supabase.auth.signOut()}
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </aside>

      <div className="main">
        {/* Shared topbar — appears on every page */}
        <div className="topbar">
          <button className="hamburger-btn" onClick={() => setMobileMenuOpen(true)}>
            <Menu size={22} />
          </button>

          {/* Desktop: avatar + greeting */}
          {(() => {
            const on = members.find((m) => m.role === "owner")?.name;
            const fn = (on && !on.includes("@") ? on : null) || household?.name;
            const h = new Date().getHours();
            const gr = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
            return (
              <div className="desktop-only" style={{ alignItems: "center", gap: "14px" }}>
                <div style={{ width: "38px", height: "38px", borderRadius: "50%", background: "linear-gradient(135deg, #6C63FF, #948cf2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: "700", color: "#0D1117", flexShrink: 0 }}>
                  {fn?.charAt(0).toUpperCase() || "?"}
                </div>
                <div>
                  <div className="welcome-name">{gr}, {fn}</div>
                  <div className="welcome-date">{new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</div>
                </div>
              </div>
            );
          })()}

          {/* Mobile: centered app name */}
          <div className="mobile-only" style={{ flex: 1, justifyContent: "center" }}>
            <div style={{ fontSize: "18px", fontWeight: "900", letterSpacing: "0.1em", color: "#F0F6FC", textTransform: "uppercase" }}>Stryde</div>
          </div>

          {/* Mobile: avatar on right */}
          {(() => {
            const on = members.find((m) => m.role === "owner")?.name;
            const fn = (on && !on.includes("@") ? on : null) || household?.name;
            return (
              <div className="mobile-only" style={{ width: "32px", height: "32px", borderRadius: "50%", background: "linear-gradient(135deg, #6C63FF, #948cf2)", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: "700", color: "#0D1117", flexShrink: 0 }}>
                {fn?.charAt(0).toUpperCase() || "?"}
              </div>
            );
          })()}

          {/* Desktop: period badge */}
          <div className="period-badge topbar-period">
            <div className="period-label">Current Pay Period</div>
            {currentPeriod ? (
              <div className="period-dates">{fmtDate(currentPeriod.start_date)} — {fmtDate(currentPeriod.end_date)}</div>
            ) : (
              <div className="period-label" style={{ color: "#8B8FA8" }}>No active period</div>
            )}
          </div>
        </div>

        {/* Page content */}
        {activeNav === "dashboard" ? renderContent() : <div className="content-area">{renderContent()}</div>}
      </div>

      {/* Mobile nav drawer */}
      {mobileMenuOpen && (
        <div className="mobile-nav-overlay" onClick={() => setMobileMenuOpen(false)} />
      )}
      <div className="mobile-nav-drawer" style={{ transform: mobileMenuOpen ? "translateX(0)" : "translateX(-100%)", transition: "transform 0.25s ease" }}>
        <div className="mobile-nav-drawer-header">
          <div className="mobile-nav-drawer-logo">Stryde</div>
          <button className="mobile-nav-close" onClick={() => setMobileMenuOpen(false)}>
            <X size={20} />
          </button>
        </div>
        <nav className="mobile-nav-drawer-nav">
          <div className="nav-label">Main</div>
          {[
            { key: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={16} /> },
            { key: "bills", label: "Bills", icon: <Receipt size={16} /> },
            { key: "income", label: "Income", icon: <Wallet size={16} /> },
            { key: "accounts", label: "Accounts", icon: <CreditCard size={16} /> },
            { key: "categories", label: "Categories", icon: <Tag size={16} /> },
          ].map((item) => (
            <button key={item.key} className={`nav-item ${activeNav === item.key ? "active" : ""}`} onClick={() => { navigate(item.key); setMobileMenuOpen(false); }}>
              {item.icon}{item.label}
            </button>
          ))}
          <div className="nav-label">Planning</div>
          {[
            { key: "payperiods", label: "Pay Periods", icon: <Calendar size={16} /> },
            { key: "debts", label: "Debts", icon: <TrendingDown size={16} /> },
          ].map((item) => (
            <button key={item.key} className={`nav-item ${activeNav === item.key ? "active" : ""}`} onClick={() => { navigate(item.key); setMobileMenuOpen(false); }}>
              {item.icon}{item.label}
            </button>
          ))}
          <div className="nav-label">Account</div>
          {[
            { key: "invite", label: "Invite Member", icon: <UserPlus size={16} /> },
            { key: "settings", label: "Settings", icon: <Settings size={16} /> },
          ].map((item) => (
            <button key={item.key} className={`nav-item ${activeNav === item.key ? "active" : ""}`} onClick={() => { navigate(item.key); setMobileMenuOpen(false); }}>
              {item.icon}{item.label}
            </button>
          ))}
        </nav>
        <div className="mobile-nav-drawer-footer">
          <button className="signout-btn" onClick={() => supabase.auth.signOut()}>
            <LogOut size={16} />Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
