import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { usePlaidLink } from "react-plaid-link";
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
  TrendingUp,
  BarChart2,
  Settings,
  LogOut,
  UserPlus,
  Landmark,
  Menu,
  X,
  RefreshCw,
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

  .dashboard-grid { display: grid; grid-template-columns: 58% 40%; gap: 12px; align-items: start; width: 100%; }
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

  .stat-row-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 28px; }
  .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

  @media (max-width: 1024px) {
    .stat-row-4 { grid-template-columns: repeat(2, 1fr) !important; gap: 8px !important; }
    .stat-amount { font-size: 20px !important; }
  }

  .desktop-only { display: flex; }
  .mobile-only { display: none; }

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

const SUPABASE_FUNCTIONS_URL = "https://zxrmeucubrcbuhqxtjco.supabase.co/functions/v1";

function PlaidLinkOpener({ token, onSuccess, onExit }) {
  const { open, ready } = usePlaidLink({ token, onSuccess, onExit });
  useEffect(() => {
    if (ready) open();
  }, [ready, open]);
  return null;
}

function PlaidConnectButton({ userId, onSuccess, updateMode = false }) {
  const [linkToken, setLinkToken] = useState(null);
  const [fetching, setFetching] = useState(false);
  const [plaidError, setPlaidError] = useState(null);

  async function fetchLinkToken() {
    setFetching(true);
    setPlaidError(null);
    try {
      const { data, error } = await supabase.functions.invoke("plaid-create-link-token", {
        body: { user_id: userId, update_mode: updateMode },
      });
      if (error) throw error;
      if (data?.link_token) {
        setLinkToken(data.link_token);
      } else {
        setPlaidError(data?.error_message || data?.error || JSON.stringify(data));
        setFetching(false);
      }
    } catch (err) {
      setPlaidError(err.message);
      setFetching(false);
    }
  }

  async function handleSuccess(public_token, metadata) {
    if (!updateMode) {
      // Full connect — exchange for a new access token
      await supabase.functions.invoke("plaid-exchange-token", {
        body: {
          public_token,
          institution_name: metadata.institution?.name,
          accounts: metadata.accounts,
        },
      });
    }
    // Update mode — existing token is now reactivated, just sync
    setLinkToken(null);
    setFetching(false);
    onSuccess();
  }

  function handleExit() {
    setLinkToken(null);
    setFetching(false);
  }

  return (
    <div>
      {linkToken && (
        <PlaidLinkOpener token={linkToken} onSuccess={handleSuccess} onExit={handleExit} />
      )}
      <button
        onClick={fetchLinkToken}
        disabled={fetching}
        style={{
          background: fetching ? "#2D2B45" : "none",
          border: `1px solid ${updateMode ? "rgba(251,191,36,0.5)" : "rgba(108,99,255,0.5)"}`,
          color: updateMode ? "#FBBF24" : "#6C63FF",
          padding: "8px 16px",
          borderRadius: "8px",
          cursor: fetching ? "not-allowed" : "pointer",
          fontSize: "13px",
          fontWeight: "600",
          fontFamily: "'Inter', sans-serif",
        }}
      >
        {fetching ? "Connecting..." : updateMode ? "Reconnect Bank" : "+ Connect Bank"}
      </button>
      {plaidError && (
        <div style={{ fontSize: "12px", color: "#F87171", marginTop: "8px", maxWidth: "260px", wordBreak: "break-word" }}>
          {plaidError}
        </div>
      )}
    </div>
  );
}

function localDateStr(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

const DEFAULT_CATEGORIES = [
  { name: "Housing" },
  { name: "Utilities" },
  { name: "Insurance" },
  { name: "Subscriptions" },
  { name: "Loans" },
  { name: "Transportation" },
  { name: "Food & Gas" },
  { name: "Savings" },
  { name: "Other" },
];

function Dashboard() {
  const [household, setHousehold] = useState(null);
  const [payPeriods, setPayPeriods] = useState([]);
  const [income, setIncome] = useState([]);
  const [bills, setBills] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeNav, setActiveNav] = useState("dashboard");
  const [isMobile, setIsMobile] = useState(typeof window !== "undefined" && window.innerWidth <= 640);
  const [scrollToInvite, setScrollToInvite] = useState(false);
  const [editingBill, setEditingBill] = useState(null);
  const [billName, setBillName] = useState("");
  const [billAmount, setBillAmount] = useState("");
  const [dueDay, setDueDay] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [billCategory, setBillCategory] = useState("");
  const [billFormError, setBillFormError] = useState("");
  const [billOwner, setBillOwner] = useState("joint");
  const [billAccountId, setBillAccountId] = useState("");
  const [transferToAccountId, setTransferToAccountId] = useState("");
  const [isBillAccumulating, setIsBillAccumulating] = useState(false);
  const [isVariable, setIsVariable] = useState(false);
  const [billFrequency, setBillFrequency] = useState("");
  const [billDueDay2, setBillDueDay2] = useState("");
  const [billDueMonth, setBillDueMonth] = useState("");
  const [quickEditBillAmountId, setQuickEditBillAmountId] = useState(null);
  const [quickEditBillAmountVal, setQuickEditBillAmountVal] = useState("");
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
  const [pendingPaidBill, setPendingPaidBill] = useState(null);
  const [pendingPaidAmount, setPendingPaidAmount] = useState("");
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
  const [nextTransfers, setNextTransfers] = useState({});
  const [whatIfMode, setWhatIfMode] = useState(false);
  const [whatIfBills, setWhatIfBills] = useState({});      // { [id]: { amount, enabled } }
  const [whatIfIncome, setWhatIfIncome] = useState({});    // { [id]: { amount, enabled } }
  const [whatIfExtraBills, setWhatIfExtraBills] = useState([]);   // [{id,name,amount,frequency,due_day}]
  const [whatIfExtraIncome, setWhatIfExtraIncome] = useState([]); // [{id,name,amount,frequency}]
  const [whatIfNextId, setWhatIfNextId] = useState(1);
  const [editingHouseholdName, setEditingHouseholdName] = useState(false);
  const [newHouseholdName, setNewHouseholdName] = useState("");
  const [newMemberName, setNewMemberName] = useState("");
  const [showAddMember, setShowAddMember] = useState(false);
  const [confirmDeleteMemberId, setConfirmDeleteMemberId] = useState(null);
  const [userEmail, setUserEmail] = useState("");
  const [userId, setUserId] = useState("");
  const [plaidConnected, setPlaidConnected] = useState(false);
  const [plaidSyncing, setPlaidSyncing] = useState(false);
  const [plaidReconnectNeeded, setPlaidReconnectNeeded] = useState(false);
  const [earlyPayments, setEarlyPayments] = useState(new Set());
  const [billPayments, setBillPayments] = useState({});
  const [plaidLastSynced, setPlaidLastSynced] = useState(() => {
    try {
      const saved = localStorage.getItem("plaidLastSynced");
      return saved ? new Date(saved) : null;
    } catch { return null; }
  });
  const [expandedPeriods, setExpandedPeriods] = useState(new Set([0]));
  const [skippedBillPeriods, setSkippedBillPeriods] = useState(new Set());
  const [minimumBuffer, setMinimumBuffer] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  function navigate(page) {
    setActiveNav(page);
    setSearchParams({ tab: page }, { replace: false });
  }

  // Sync activeNav when browser back/forward changes URL
  useEffect(() => {
    const tab = searchParams.get("tab") || "dashboard";
    setActiveNav(tab);
  }, [searchParams]);

  // Track viewport so layouts with fixed-width columns can adapt on phones
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 640);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Auto sign-out after 15 minutes of inactivity
  useEffect(() => {
    const TIMEOUT_MS = 15 * 60 * 1000;
    let timer;

    const reset = () => {
      clearTimeout(timer);
      timer = setTimeout(() => supabase.auth.signOut(), TIMEOUT_MS);
    };

    const events = ["mousemove", "mousedown", "keydown", "touchstart", "scroll"];
    events.forEach(e => window.addEventListener(e, reset, { passive: true }));
    reset();

    return () => {
      clearTimeout(timer);
      events.forEach(e => window.removeEventListener(e, reset));
    };
  }, []);

  useEffect(() => {
    if (scrollToInvite && activeNav === "settings") {
      setTimeout(() => {
        document.getElementById("invite-section")?.scrollIntoView({ behavior: "smooth", block: "center" });
        setScrollToInvite(false);
      }, 100);
    }
  }, [scrollToInvite, activeNav]);

  async function syncPlaidBalances(householdId) {
    setPlaidSyncing(true);
    try {
      console.log("[Plaid] Invoking sync for household:", householdId);
      const { data, error: fnError } = await supabase.functions.invoke("plaid-sync-balances", {
        body: { household_id: householdId },
      });
      console.log("[Plaid] Edge function response:", data, "error:", fnError);
      if (fnError) {
        console.error("[Plaid] Edge function error:", fnError);
      }
      // Check if bank login has expired (only show warning if token was deleted and nothing synced)
      if (data?.loginRequired) {
        setPlaidReconnectNeeded(true);
        setPlaidConnected(false);
      } else if (data?.synced > 0) {
        setPlaidReconnectNeeded(false);
        setPlaidConnected(true);
      }
      const { data: refreshed, error: dbError } = await supabase.from("accounts").select("*").eq("household_id", householdId);
      console.log("[Plaid] Refreshed accounts from DB:", refreshed, "db error:", dbError);
      if (refreshed) setAccounts(refreshed);
      const syncedAt = new Date();
      localStorage.setItem("plaidLastSynced", syncedAt.toISOString());
      setPlaidLastSynced(syncedAt);
    } catch (err) {
      console.error("[Plaid] Sync threw:", err);
    }
    setPlaidSyncing(false);
  }

  useEffect(() => {
    async function loadData() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        setUserEmail(user.email || "");
        setUserId(user.id);
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

        const { data: plaidItems } = await supabase
          .from("plaid_items")
          .select("id")
          .eq("user_id", user.id)
          .limit(1);
        const connected = !!(plaidItems && plaidItems.length > 0);
        setPlaidConnected(connected);

        const { data: skipRows } = await supabase
          .from("bill_skips")
          .select("bill_id, period_start")
          .eq("user_id", user.id);
        if (skipRows) {
          setSkippedBillPeriods(new Set(skipRows.map(r => `${r.bill_id}-${r.period_start}`)));
        }

        const { data: earlyRows } = await supabase
          .from("income_early_payments")
          .select("income_id, period_start")
          .eq("user_id", user.id);
        if (earlyRows) {
          setEarlyPayments(new Set(earlyRows.map(r => `${r.income_id}-${r.period_start}`)));
        }

        const { data: bpRows } = await supabase
          .from("bill_payments")
          .select("bill_id, period_start, paid_date, paid_amount, is_paid")
          .eq("user_id", user.id);
        if (bpRows) {
          const bpMap = {};
          bpRows.forEach(r => { bpMap[`${r.bill_id}-${r.period_start}`] = r; });
          setBillPayments(bpMap);
        }

        const today2 = localDateStr();
        const { data: transferRows } = await supabase
          .from("period_transfers")
          .select("row_key, amount, period_start")
          .eq("user_id", user.id);
        if (transferRows && transferRows.length > 0) {
          const periodsData2 = periodsRes.data || [];
          const sortedPeriods = [...periodsData2].sort((a, b) => new Date(a.start_date) - new Date(b.start_date));
          const curPeriod = sortedPeriods.find(p => p.start_date <= today2 && p.end_date >= today2);
          const curIdx = sortedPeriods.indexOf(curPeriod);
          const nextPeriod = curIdx >= 0 ? sortedPeriods[curIdx + 1] : null;
          if (curPeriod) {
            setTransfers(transferRows
              .filter(r => r.period_start === curPeriod.start_date)
              .reduce((acc, r) => ({ ...acc, [r.row_key]: r.amount }), {}));
          }
          if (nextPeriod) {
            setNextTransfers(transferRows
              .filter(r => r.period_start === nextPeriod.start_date)
              .reduce((acc, r) => ({ ...acc, [r.row_key]: r.amount }), {}));
          }
        }

        setLoading(false);

        // Auto-regenerate pay periods if none extend into the current year
        const currentYear = new Date().getFullYear();
        const periodsData = periodsRes.data || [];
        const lastPeriod = [...periodsData].sort((a, b) => new Date(b.end_date) - new Date(a.end_date))[0];
        if (!lastPeriod || new Date(lastPeriod.end_date + "T12:00:00").getFullYear() < currentYear) {
          // Trigger silent regeneration — will run after state is set
          setTimeout(() => regeneratePayPeriods(), 500);
        }

        if (connected) {
          const today = localDateStr();
          const lastSyncDate = localStorage.getItem("plaidLastSyncDate");
          if (lastSyncDate !== today) {
            localStorage.setItem("plaidLastSyncDate", today);
            syncPlaidBalances(householdData.id);
          }
        }
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
    today.setHours(0, 0, 0, 0);
    const paidDate = new Date(bill.paid_date);
    paidDate.setHours(0, 0, 0, 0);

    // Biweekly: due again 14 days after last payment
    if ((bill.frequency || "monthly") === "biweekly") {
      const nextDue = new Date(paidDate);
      nextDue.setDate(nextDue.getDate() + 14);
      return today >= nextDue;
    }

    // Pay Day: due again when a new pay period has started since payment
    if ((bill.frequency || "monthly") === "payday") {
      const todayStr = today.toISOString().split("T")[0];
      const currentPeriod = payPeriods.find(p => todayStr >= p.start_date && todayStr <= p.end_date);
      if (currentPeriod) {
        const periodStart = new Date(currentPeriod.start_date + "T00:00:00");
        return paidDate < periodStart;
      }
      const nextDue = new Date(paidDate);
      nextDue.setDate(nextDue.getDate() + 14);
      return today >= nextDue;
    }

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

  // Per-period payment helpers — keyed on billId + period start_date string
  function getBillPaymentRecord(billId, periodStart) {
    return billPayments[`${billId}-${periodStart}`] || null;
  }
  function isBillPaidInPeriod(billId, periodStart) {
    const p = getBillPaymentRecord(billId, periodStart);
    return p ? (p.is_paid || (p.paid_amount || 0) > 0) : false;
  }
  function getBillPaidAmount(billId, periodStart) {
    const p = getBillPaymentRecord(billId, periodStart);
    return p ? (p.paid_amount || 0) : 0;
  }

  function isBillDueInPeriod(bill) {
    // Bills always recur — scheduling is handled by dueInPeriod below
    return true;
  }

  async function addBill() {
    if (isSaving) return;
    const isPayday = (billFrequency || "monthly") === "payday";
    if (!billName || !billAmount || (!isPayday && !dueDay) || !billAccountId) {
      setBillFormError("Please fill in all required fields.");
      return;
    }
    if ((billFrequency || "monthly") === "semi-monthly" && !billDueDay2) {
      setBillFormError("Semi-monthly bills require a second due day.");
      return;
    }
    setBillFormError("");

    setIsSaving(true);
    const householdData = household;

    const { data: savedBill, error } = await supabase
      .from("bills")
      .insert({
        household_id: householdData.id,
        name: billName,
        amount: parseFloat(billAmount),
        due_day: isPayday ? 0 : parseInt(dueDay),
        payment_method: paymentMethod,
        category: billCategory,
        owner: billOwner,
        account_id: billAccountId || null,
        transfer_to_account_id: isBillAccumulating ? (transferToAccountId || null) : null,
        is_variable: isVariable,
        frequency: billFrequency || "monthly",
        due_day_2: (billFrequency || "monthly") === "semi-monthly" && billDueDay2 ? parseInt(billDueDay2) : null,
        due_month: (billFrequency === "quarterly" || billFrequency === "annually") && billDueMonth ? parseInt(billDueMonth) : null,
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
    setPaymentMethod("");
    setBillCategory("");
    setBillOwner("joint");
    setBillAccountId("");
    setTransferToAccountId("");
    setIsBillAccumulating(false);
    setIsVariable(false);
    setBillFrequency("monthly");
    setBillDueDay2("");
    setBillDueMonth("");
    setShowBillForm(false);
    setIsSaving(false);
  }

  async function updateBill() {
    if (isSaving) return;
    const isPaydayEdit = (billFrequency || "monthly") === "payday";
    if (!billName || !billAmount || (!isPaydayEdit && !dueDay) || !billAccountId) {
      setBillFormError("Please fill in all required fields.");
      return;
    }
    if ((billFrequency || "monthly") === "semi-monthly" && !billDueDay2) {
      setBillFormError("Semi-monthly bills require a second due day.");
      return;
    }
    setBillFormError("");

    setIsSaving(true);
    const { error } = await supabase
      .from("bills")
      .update({
        name: billName,
        amount: parseFloat(billAmount),
        due_day: isPaydayEdit ? 0 : parseInt(dueDay),
        payment_method: paymentMethod,
        category: billCategory,
        owner: billOwner,
        account_id: billAccountId || null,
        transfer_to_account_id: isBillAccumulating ? (transferToAccountId || null) : null,
        is_variable: isVariable,
        frequency: billFrequency || "monthly",
        due_day_2: (billFrequency || "monthly") === "semi-monthly" && billDueDay2 ? parseInt(billDueDay2) : null,
        due_month: (billFrequency === "quarterly" || billFrequency === "annually") && billDueMonth ? parseInt(billDueMonth) : null,
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
              due_day: isPaydayEdit ? 0 : parseInt(dueDay),
              payment_method: paymentMethod,
              category: billCategory,
              owner: billOwner,
              account_id: billAccountId,
              transfer_to_account_id: isBillAccumulating ? (transferToAccountId || null) : null,
              is_variable: isVariable,
              frequency: billFrequency,
              due_day_2: billFrequency === "semi-monthly" && billDueDay2 ? parseInt(billDueDay2) : null,
              due_month: (billFrequency === "quarterly" || billFrequency === "annually") && billDueMonth ? parseInt(billDueMonth) : null,
            }
          : b,
      ),
    );

    setEditingBill(null);
    setBillName("");
    setBillAmount("");
    setDueDay("");
    setPaymentMethod("");
    setBillCategory("");
    setBillOwner("joint");
    setBillAccountId("");
    setTransferToAccountId("");
    setIsBillAccumulating(false);
    setIsVariable(false);
    setBillFrequency("monthly");
    setBillDueDay2("");
    setIsSaving(false);
  }

  async function deleteBill(billId) {
    const { error } = await supabase.from("bills").delete().eq("id", billId);
    if (error) {
      console.log("Error:", error.message);
      return;
    }
    setBills(bills.filter((b) => b.id !== billId));
  }

  async function markBillPaid(bill, actualAmount, periodStart) {
    if (!periodStart) {
      const todayStr = localDateStr();
      const cp = payPeriods.find(p => p.start_date <= todayStr && p.end_date >= todayStr);
      periodStart = cp?.start_date || todayStr;
    }
    const paidAmt = actualAmount !== undefined && actualAmount !== "" ? parseFloat(actualAmount) : bill.amount;
    const key = `${bill.id}-${periodStart}`;
    const existing = billPayments[key];
    const prevPaid = existing?.paid_amount || 0;
    const totalPaid = prevPaid + paidAmt;
    const isFullyPaid = totalPaid >= bill.amount;
    const today = localDateStr();

    const record = {
      user_id: userId,
      bill_id: bill.id,
      period_start: periodStart,
      paid_date: today,
      paid_amount: totalPaid,
      is_paid: isFullyPaid,
    };

    const { error } = await supabase.from("bill_payments").upsert(record, { onConflict: "user_id,bill_id,period_start" });
    if (error) { alert("Could not mark bill paid: " + error.message); return; }
    setBillPayments(prev => ({ ...prev, [key]: record }));
  }

  async function markBillUnpaid(bill, periodStart) {
    if (!periodStart) {
      const todayStr = localDateStr();
      const cp = payPeriods.find(p => p.start_date <= todayStr && p.end_date >= todayStr);
      periodStart = cp?.start_date || todayStr;
    }
    const key = `${bill.id}-${periodStart}`;
    const { error } = await supabase.from("bill_payments")
      .delete()
      .eq("user_id", userId)
      .eq("bill_id", bill.id)
      .eq("period_start", periodStart);
    if (error) { console.log("Error:", error.message); return; }
    setBillPayments(prev => { const next = { ...prev }; delete next[key]; return next; });
  }

  async function skipBill(billId, periodKey) {
    const key = `${billId}-${periodKey}`;
    const { error } = await supabase.from("bill_skips").insert({
      user_id: userId,
      bill_id: billId,
      period_start: periodKey,
    });
    if (error && error.code !== "23505") return; // 23505 = unique violation (already skipped)
    setSkippedBillPeriods(prev => new Set([...prev, key]));
  }

  async function restoreBill(billId, periodKey) {
    const key = `${billId}-${periodKey}`;
    const { error } = await supabase.from("bill_skips")
      .delete()
      .eq("user_id", userId)
      .eq("bill_id", billId)
      .eq("period_start", periodKey);
    if (error) return;
    setSkippedBillPeriods(prev => { const n = new Set(prev); n.delete(key); return n; });
  }

  async function saveBillAmount(billId, newAmount) {
    const parsed = parseFloat(newAmount);
    if (!parsed || parsed <= 0) { setQuickEditBillAmountId(null); return; }
    await supabase.from("bills").update({ amount: parsed }).eq("id", billId);
    setBills(prev => prev.map(b => b.id === billId ? { ...b, amount: parsed } : b));
    setQuickEditBillAmountId(null);
  }

  async function markIncomeReceived(incomeId, periodStart) {
    const key = `${incomeId}-${periodStart}`;
    const today = localDateStr();
    const { error } = await supabase.from("income_early_payments").insert({
      user_id: userId,
      income_id: incomeId,
      period_start: periodStart,
      received_date: today,
    });
    if (error && error.code !== "23505") return;
    setEarlyPayments(prev => new Set([...prev, key]));
  }

  async function unmarkIncomeReceived(incomeId, periodStart) {
    const key = `${incomeId}-${periodStart}`;
    const { error } = await supabase.from("income_early_payments")
      .delete()
      .eq("user_id", userId)
      .eq("income_id", incomeId)
      .eq("period_start", periodStart);
    if (error) return;
    setEarlyPayments(prev => { const n = new Set(prev); n.delete(key); return n; });
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
      .slice(0, 10);

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
        if (!isBillDueInPeriod(bill)) return false;

        const freq = bill.frequency || "monthly";

        // Biweekly / Pay Day: appears in every pay period
        if (freq === "biweekly" || freq === "payday") return true;

        // Quarterly: due every 3 months starting from due_month
        if (freq === "quarterly") {
          if (!bill.due_month || !bill.due_day) return false;
          const startMonth = bill.due_month - 1; // 0-indexed
          const dueDates = [0, 3, 6, 9].map(offset => {
            const m = (startMonth + offset) % 12;
            const y = periodStart.getFullYear() + (startMonth + offset >= 12 ? 1 : 0);
            return new Date(y, m, bill.due_day, 23, 59, 59);
          });
          return dueDates.some(d => d >= periodStart && d <= periodEnd);
        }
        // Annually: due once per year in due_month on due_day
        if (freq === "annually") {
          if (!bill.due_month || !bill.due_day) return false;
          const thisYear = new Date(periodStart.getFullYear(), bill.due_month - 1, bill.due_day, 23, 59, 59);
          const nextYear = new Date(periodStart.getFullYear() + 1, bill.due_month - 1, bill.due_day, 23, 59, 59);
          return (thisYear >= periodStart && thisYear <= periodEnd) || (nextYear >= periodStart && nextYear <= periodEnd);
        }

        // Helper: check if a given due_day falls within this pay period
        const dueInPeriod = (day) => {
          if (!day) return false;
          const dueDateThisMonth = new Date(periodStart.getFullYear(), periodStart.getMonth(), day, 23, 59, 59);
          const dueDateNextMonth = new Date(periodStart.getFullYear(), periodStart.getMonth() + 1, day, 23, 59, 59);
          return (
            (dueDateThisMonth >= periodStart && dueDateThisMonth <= periodEnd) ||
            (dueDateNextMonth >= periodStart && dueDateNextMonth <= periodEnd)
          );
        };

        // Semi-monthly: show in whichever period contains due_day OR due_day_2
        if (freq === "semi-monthly") return dueInPeriod(bill.due_day) || dueInPeriod(bill.due_day_2);

        // Monthly (default)
        return dueInPeriod(bill.due_day);
      });

      const billActualDate = (bill) => {
        const freq = bill.frequency || "monthly";
        if (freq === "payday" || freq === "biweekly") return periodStart;
        if (!bill.due_day) return periodEnd;
        const thisMonth = new Date(periodStart.getFullYear(), periodStart.getMonth(), bill.due_day);
        const nextMonth = new Date(periodStart.getFullYear(), periodStart.getMonth() + 1, bill.due_day);
        if (thisMonth >= periodStart && thisMonth <= periodEnd) return thisMonth;
        if (nextMonth >= periodStart && nextMonth <= periodEnd) return nextMonth;
        return nextMonth;
      };
      periodBills.sort((a, b) => {
        const dateA = billActualDate(a);
        const dateB = billActualDate(b);
        if (dateA - dateB !== 0) return dateA - dateB;
        return (a.name || "").localeCompare(b.name || "");
      });

      const periodBillsTotal = periodBills.reduce((sum, b) => {
        const paidAmt = getBillPaidAmount(b.id, period.start_date);
        return sum + ((b.amount || 0) - paidAmt);
      }, 0);

      const isCurrentPeriod = periodStart <= today && periodEnd >= today;


      // Show Set Aside in all periods where saving is still relevant (due date hasn't passed at period start)
      const contributions = allContributions.filter((c) => periodStart < c.dueDate);

      return {
        period,
        isCurrentPeriod,
        income: periodIncome,
        incomeItems: periodIncomeItems,
        bills: periodBills,
        billsTotal: periodBillsTotal,
        leftOver: periodIncome - periodBillsTotal,
        contributions,
      };
    });
  }

  async function addIncome() {
    if (isSaving) return;
    if (!incomeName || !fixedAmount || !nextPayDate) {
      alert("Please fill in all required income fields.");
      return;
    }

    setIsSaving(true);
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
    setIsSaving(false);
  }

  async function updateIncome() {
    if (isSaving) return;
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
    setIsSaving(false);
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
    if (isSaving) return;
    if (!accountName || !bankName || !lastFour) {
      alert("Please fill in all required account fields.");
      return;
    }
    if (isAccumulating && (!accumulationTarget || !accDueDay)) {
      alert("Saving accounts require a savings target and due day of month.");
      return;
    }
    setIsSaving(true);

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
              minimum_buffer: minimumBuffer ? parseFloat(minimumBuffer) : 0,
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
    setMinimumBuffer("");
    setIsSaving(false);
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

  async function confirmTransfer(rowKey, amount, targetAccountId = null) {
    const parsed = parseFloat(amount);
    if (!parsed || parsed <= 0) return;

    const today = localDateStr();
    const currentPeriod = payPeriods.find(p => p.start_date <= today && p.end_date >= today);
    const periodKey = currentPeriod?.start_date || today;

    const newAmount = (transfers[rowKey] || 0) + parsed;

    await supabase.from("period_transfers").upsert({
      user_id: userId,
      period_start: periodKey,
      row_key: rowKey,
      amount: newAmount,
    }, { onConflict: "user_id,period_start,row_key" });

    setTransfers(prev => ({ ...prev, [rowKey]: newAmount }));
    setTransferringId(null);
    setTransferAmount("");
  }

  async function confirmNextTransfer(rowKey, amount, nextPeriodKey) {
    const parsed = parseFloat(amount);
    if (!parsed || parsed <= 0 || !nextPeriodKey) return;

    const newAmount = (nextTransfers[rowKey] || 0) + parsed;

    await supabase.from("period_transfers").upsert({
      user_id: userId,
      period_start: nextPeriodKey,
      row_key: rowKey,
      amount: newAmount,
    }, { onConflict: "user_id,period_start,row_key" });

    setNextTransfers(prev => ({ ...prev, [rowKey]: newAmount }));
    setTransferringId(null);
    setTransferAmount("");
  }

  async function undoNextTransfer(rowKey, nextPeriodKey) {
    if (!nextPeriodKey) return;
    await supabase.from("period_transfers")
      .delete()
      .eq("user_id", userId)
      .eq("period_start", nextPeriodKey)
      .eq("row_key", rowKey);
    setNextTransfers(prev => {
      const next = { ...prev };
      delete next[rowKey];
      return next;
    });
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
    if (isSaving) return;
    if (!debtName || !debtBalance || !debtMinPayment) {
      alert("Please fill in all required debt fields.");
      return;
    }

    setIsSaving(true);
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
    setIsSaving(false);
  }

  async function updateDebt() {
    if (isSaving) return;
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
    setIsSaving(false);
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
    const today = localDateStr();

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
    const endOfYear = new Date(today.getFullYear(), 11, 31, 23, 59, 59);
    const lookbackDays = 60; // include ~2 months of past periods

    paychecks.forEach((inc) => {
      const baseDate = new Date(inc.next_pay_date + "T12:00:00");
      const interval = inc.frequency === "weekly" ? 7 : 14;

      // Walk backwards from baseDate to find earliest date within lookback window
      const current = new Date(baseDate);
      while (current > today) {
        current.setDate(current.getDate() - interval);
      }
      while (current > new Date(today.getTime() - lookbackDays * 86400000)) {
        current.setDate(current.getDate() - interval);
      }
      current.setDate(current.getDate() + interval); // step forward once to be in range

      // Walk forward from there through end of year
      const cursor = new Date(current);
      while (cursor <= endOfYear) {
        allDates.push(new Date(cursor));
        cursor.setDate(cursor.getDate() + interval);
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
    if (activeNav === "dashboard") {
      const primaryBalance = accounts
        .filter((a) => a.is_primary && !a.is_accumulating)
        .reduce((sum, a) => sum + (a.current_balance || 0), 0);

      const breakdown = getPayPeriodBreakdown();
      const today = new Date();

      // Carry-over: unpaid bills from the previous pay period
      const sortedAllPeriods = [...payPeriods].sort((a, b) => new Date(a.start_date) - new Date(b.start_date));
      const todayStr = localDateStr();
      const currentPeriodIdx = sortedAllPeriods.findIndex(p => p.start_date <= todayStr && p.end_date >= todayStr);
      const prevPeriod = currentPeriodIdx > 0 ? sortedAllPeriods[currentPeriodIdx - 1] : null;
      let carryOverBills = [];
      if (prevPeriod) {
        const prevStart = new Date(prevPeriod.start_date + "T00:00:00");
        const prevEnd = new Date(prevPeriod.end_date + "T23:59:59");
        const prevKey = prevPeriod.start_date;
        const dueInPrev = (day) => {
          if (!day) return false;
          const d1 = new Date(prevStart.getFullYear(), prevStart.getMonth(), day, 23, 59, 59);
          const d2 = new Date(prevStart.getFullYear(), prevStart.getMonth() + 1, day, 23, 59, 59);
          return (d1 >= prevStart && d1 <= prevEnd) || (d2 >= prevStart && d2 <= prevEnd);
        };
        carryOverBills = bills.filter(bill => {
          const freq = bill.frequency || "monthly";
          let due = false;
          if (freq === "biweekly" || freq === "payday") due = true;
          else if (freq === "quarterly") {
            if (bill.due_month && bill.due_day) {
              const startMonth = bill.due_month - 1;
              due = [0, 3, 6, 9].some(offset => {
                const m = (startMonth + offset) % 12;
                const y = prevStart.getFullYear() + (startMonth + offset >= 12 ? 1 : 0);
                const d = new Date(y, m, bill.due_day, 23, 59, 59);
                return d >= prevStart && d <= prevEnd;
              });
            }
          } else if (freq === "annually") {
            if (bill.due_month && bill.due_day) {
              const thisYear = new Date(prevStart.getFullYear(), bill.due_month - 1, bill.due_day, 23, 59, 59);
              const nextYear = new Date(prevStart.getFullYear() + 1, bill.due_month - 1, bill.due_day, 23, 59, 59);
              due = (thisYear >= prevStart && thisYear <= prevEnd) || (nextYear >= prevStart && nextYear <= prevEnd);
            }
          } else if (freq === "semi-monthly") due = dueInPrev(bill.due_day) || dueInPrev(bill.due_day_2);
          else due = dueInPrev(bill.due_day);
          if (!due) return false;
          if (skippedBillPeriods.has(`${bill.id}-${prevKey}`)) return false;
          // Consider paid if there is a bill_payments record for the previous period
          if (isBillPaidInPeriod(bill.id, prevKey)) return false;
          return true;
        });
      }

      let runningBalance = primaryBalance;
      const rows = breakdown.map((item) => {
        const isCurrent = item.isCurrentPeriod;
        const startBalance = runningBalance;

        // Current period: primary balance already reflects any transfers made.
        // Only add income not yet deposited; don't subtract bills already handled.
        // Future periods: full income + all bills chain normally.
        const pendingIncome = isCurrent
          ? item.incomeItems
              .filter((inc) => {
                if (earlyPayments.has(`${inc.id}-${item.period.start_date}`)) return false;
                return inc.actualPayDate && new Date(inc.actualPayDate + "T12:00:00") > today;
              })
              .reduce((sum, inc) => sum + (inc.fixed_amount || 0), 0)
          : item.incomeItems
              // For future periods, exclude income already received early so it isn't
              // double-counted (it's already in the current balance).
              .filter(inc => !earlyPayments.has(`${inc.id}-${item.period.start_date}`))
              .reduce((sum, inc) => sum + (inc.fixed_amount || 0), 0);

        const pStart = new Date(item.period.start_date + "T00:00:00");
        const pEnd = new Date(item.period.end_date + "T23:59:59");
        const periodKey = item.period.start_date;

        // Bills tile: remaining unpaid amounts, excluding skipped
        const skippedUnpaidTotal = item.bills
          .filter(b => skippedBillPeriods.has(`${b.id}-${periodKey}`))
          .reduce((sum, b) => {
            const paidAmt = getBillPaidAmount(b.id, periodKey);
            return sum + ((b.amount || 0) - paidAmt);
          }, 0);
        const billsDeducted = item.billsTotal - skippedUnpaidTotal;

        // End balance: only subtract bills that will be paid directly from the primary account.
        // Bills assigned to non-primary, non-accumulating accounts (e.g. Wiley Bills) are
        // funded by a WTMG transfer FROM primary — so the transfer itself is what reduces
        // the primary balance, not the individual bills.
        //
        // Current period: additionally check if the WTMG transfer is confirmed. If not yet
        // confirmed, include those bills so the projection stays conservative until the
        // transfer is recorded.
        //
        // This prevents double-subtracting when the user pre-funds their bills account
        // before the new period starts (the primary balance is already lower from the transfer).

        // Pre-compute unpaid bill totals per account for the current-period transfer check.
        const unpaidTotalByAcct = {};
        if (isCurrent) {
          item.bills.forEach(b => {
            if (skippedBillPeriods.has(`${b.id}-${periodKey}`)) return;
            if (isBillPaidInPeriod(b.id, periodKey)) return;
            if (!b.account_id) return;
            unpaidTotalByAcct[b.account_id] = (unpaidTotalByAcct[b.account_id] || 0) + (b.amount || 0);
          });
        }

        const billsForEndBalance = item.bills
          .filter(b => {
            if (skippedBillPeriods.has(`${b.id}-${periodKey}`)) return false;
            if (isBillPaidInPeriod(b.id, periodKey)) return false;
            if (b.account_id) {
              const acct = accounts.find(a => a.id === b.account_id);
              // Accumulating accounts (e.g. escrow) are funded gradually via separate
              // contribution logic, not by subtracting the full bill each period.
              if (acct?.is_accumulating) return false;
              const isPrimary = acct?.is_primary && !acct?.is_accumulating;
              if (!isPrimary) {
                // Bills assigned to a non-primary "bills" account are funded by a WTMG
                // transfer FROM primary. For the CURRENT period, the live primary balance
                // already reflects that transfer once it's recorded — so exclude these
                // bills only after the transfer is confirmed to avoid double-counting.
                //
                // For FUTURE periods, no transfer is modeled and the running balance is
                // the whole money pool, so the bill IS the outflow — always subtract it.
                if (isCurrent) {
                  const transferred = transfers[b.account_id] || 0;
                  const totalForAcct = unpaidTotalByAcct[b.account_id] || 0;
                  if (transferred >= totalForAcct) return false;
                }
              }
            }
            return true;
          })
          .reduce((sum, b) => sum + (b.amount || 0), 0);

        const endBalance = startBalance + pendingIncome - billsForEndBalance;
        runningBalance = endBalance;

        return { ...item, startBalance, pendingIncome, billsDeducted, billsForEndBalance, endBalance, isCurrent };
      });

      // Monthly summary — based on current calendar month only
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();

      // Income deposits falling in current calendar month, after today (not yet in balance)
      const monthIncome = breakdown
        .flatMap((item) => item.incomeItems.map(inc => ({ ...inc, _ps: item.period.start_date })))
        .filter((inc) => {
          if (!inc.actualPayDate) return false;
          const d = new Date(inc.actualPayDate + "T12:00:00");
          if (!(d.getMonth() === currentMonth && d.getFullYear() === currentYear && d > today)) return false;
          // Exclude income already marked received via "Got Paid"
          if (earlyPayments.has(`${inc.id}-${inc._ps}`)) return false;
          return true;
        })
        .reduce((sum, inc) => sum + (inc.fixed_amount || 0), 0);

      // Bills Remaining: unpaid bills for the current period plus any upcoming period
      // that ENDS within the current calendar month, mirroring the per-period BILLS
      // totals shown on the cards. (Counting periods that merely *start* this month would
      // pull a spill-over period like Jul 30–Aug 12 — really next month's bills — in.)
      const monthEndDate = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);
      const monthBills = rows
        .filter(item => {
          if (item.isCurrent) return true;
          const pStart = new Date(item.period.start_date + "T00:00:00");
          const pEnd = new Date(item.period.end_date + "T23:59:59");
          return pStart > today && pEnd <= monthEndDate;
        })
        .reduce((sum, item) => sum + (item.billsDeducted || 0), 0);

      // Bills already funded via a confirmed WTMG transfer are paid from the bills
      // account, not primary — and primaryBalance already dropped when that money
      // moved. Subtracting them again in "Available This Month" would double-count
      // them and make the tile jump when one is marked paid. Add the funded amount
      // back so it stays stable. (0 for single-account users — no transfers.)
      const currentRowItem = rows.find(item => item.isCurrent);
      let fundedThisPeriod = 0;
      if (currentRowItem) {
        const pKey = currentRowItem.period.start_date;
        const remainingOf = (b) => (b.amount || 0) - getBillPaidAmount(b.id, pKey);
        const unpaidByAcct = {};
        currentRowItem.bills.forEach(b => {
          if (skippedBillPeriods.has(`${b.id}-${pKey}`)) return;
          if (isBillPaidInPeriod(b.id, pKey)) return;
          if (!b.account_id) return;
          unpaidByAcct[b.account_id] = (unpaidByAcct[b.account_id] || 0) + remainingOf(b);
        });
        currentRowItem.bills.forEach(b => {
          if (skippedBillPeriods.has(`${b.id}-${pKey}`)) return;
          if (isBillPaidInPeriod(b.id, pKey)) return;
          const acct = accounts.find(a => a.id === b.account_id);
          if (!acct || acct.is_primary || acct.is_accumulating) return;
          const transferred = transfers[b.account_id] || 0;
          if (transferred >= (unpaidByAcct[b.account_id] || 0)) fundedThisPeriod += remainingOf(b);
        });
      }

      // Available This Month: what's left after this month's *unfunded* bills.
      const availableThisMonth = primaryBalance + monthIncome - monthBills + fundedThisPeriod;

      return (
        <div className="content-area">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: "24px", margin: 0 }}>Monthly Projection</h2>
            <button
              className="mobile-only"
              onClick={() => window.location.reload()}
              title="Reload"
              style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "34px", height: "34px", borderRadius: "8px", background: "none", border: "1px solid rgba(255,255,255,0.08)", color: "#8B8FA8", cursor: "pointer", flexShrink: 0 }}
            >
              <RefreshCw size={15} />
            </button>
          </div>

          {/* Monthly summary */}
          <div className="stat-row-4">
            <div className="stat-card">
              <div className="stat-label">Available Now</div>
              <div className="stat-amount">${fmt(primaryBalance)}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Income This Month</div>
              <div className="stat-amount">${fmt(monthIncome)}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Bills Remaining</div>
              <div className="stat-amount negative">${fmt(monthBills)}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Available This Month</div>
              <div className={`stat-amount ${availableThisMonth < 0 ? "negative" : "neutral"}`}>${fmt(availableThisMonth)}</div>
            </div>
          </div>

          <div className="dashboard-grid">
            <div className="dashboard-left">
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {rows.map((item, i) => {
                  const isExpanded = expandedPeriods.has(i);
                  return (
                  <div key={i} className="panel" style={{ borderLeft: item.isCurrent ? "3px solid #6C63FF" : "3px solid transparent" }}>
                    {/* Card header */}
                    <div
                      onClick={() => setExpandedPeriods(prev => { const n = new Set(prev); n.has(i) ? n.delete(i) : n.add(i); return n; })}
                      style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", cursor: "pointer", marginBottom: isExpanded ? "16px" : "0" }}
                    >
                      <div>
                        <div style={{ fontSize: "14px", fontWeight: "600", color: "#F0F6FC", display: "flex", alignItems: "center", gap: "8px" }}>
                          {fmtDate(item.period.start_date)} — {fmtDate(item.period.end_date)}
                          {item.isCurrent && (
                            <span style={{ fontSize: "9px", background: "#6C63FF", color: "#fff", padding: "2px 8px", borderRadius: "4px", letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: "700" }}>Current</span>
                          )}
                        </div>
                        {item.incomeItems.length > 0 && (
                          <div style={{ fontSize: "11px", color: "#8B8FA8", marginTop: "3px" }}>
                            {item.incomeItems.map((inc, j) => (
                              <span key={j}>
                                {inc.name}{inc.actualPayDate ? ` (${fmtDate(inc.actualPayDate)})` : ""}
                                {j < item.incomeItems.length - 1 ? " · " : ""}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: "9px", color: "#8B8FA8", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: "600", marginBottom: "3px" }}>End Balance</div>
                          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "22px", fontWeight: "500", color: item.endBalance < 0 ? "#F87171" : "#4ADE80" }}>
                            {item.endBalance < 0 ? "-" : ""}${fmt(Math.abs(item.endBalance))}
                          </div>
                        </div>
                        <span style={{ fontSize: "12px", color: "#6E7681" }}>{isExpanded ? "▲" : "▼"}</span>
                      </div>
                    </div>

                    {isExpanded && (
                    <>
                    {/* 3 tiles: Start | Income | Bills */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
                      <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: "8px", padding: "10px 12px" }}>
                        <div style={{ fontSize: "9px", color: "#8B8FA8", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: "600", marginBottom: "4px" }}>Start</div>
                        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "14px", color: "#8B8FA8" }}>${fmt(item.startBalance)}</div>
                      </div>
                      <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: "8px", padding: "10px 12px" }}>
                        <div style={{ fontSize: "9px", color: "#8B8FA8", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: "600", marginBottom: "4px" }}>
                          {item.isCurrent ? "Pending Income" : "Income"}
                        </div>
                        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "14px", color: "#4ADE80" }}>+${fmt(item.pendingIncome)}</div>
                      </div>
                      <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: "8px", padding: "10px 12px" }}>
                        <div style={{ fontSize: "9px", color: "#8B8FA8", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: "600", marginBottom: "4px" }}>
                          Bills
                        </div>
                        {(() => {
                          const carryTotal = item.isCurrent ? carryOverBills.reduce((s, b) => s + (b.amount || 0), 0) : 0;
                          const total = item.billsDeducted + carryTotal;
                          return (
                            <>
                              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "14px", color: total > 0 ? "#F87171" : "#8B8FA8" }}>
                                {total > 0 ? `$${fmt(total)}` : "—"}
                              </div>
                              {carryTotal > 0 && (
                                <div style={{ fontSize: "9px", color: "#FBBF24", marginTop: "3px" }}>
                                  incl. ${fmt(carryTotal)} carried
                                </div>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Income list */}
                    {item.incomeItems.length > 0 && (
                      <div style={{ marginTop: "12px", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "12px" }}>
                        <div style={{ fontSize: "9px", color: "#8B8FA8", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: "600", marginBottom: "8px" }}>Income</div>
                        {item.incomeItems.map((inc, j) => {
                          const periodKey = item.period.start_date;
                          const epKey = `${inc.id}-${periodKey}`;
                          const isEarlyReceived = earlyPayments.has(epKey);
                          const isFuture = inc.actualPayDate && new Date(inc.actualPayDate + "T12:00:00") > new Date();
                          const isLast = j === item.incomeItems.length - 1;
                          return (
                            <div key={inc.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: isLast ? "none" : "1px solid rgba(255,255,255,0.04)" }}>
                              <div>
                                <div style={{ fontSize: "13px", color: isEarlyReceived ? "#4ADE80" : "#F0F6FC", fontWeight: "500" }}>
                                  {isEarlyReceived ? "✓ " : ""}{inc.name}
                                </div>
                                <div style={{ fontSize: "11px", color: "#8B8FA8", marginTop: "2px" }}>
                                  {inc.actualPayDate ? fmtDate(inc.actualPayDate) : ""}
                                  {isEarlyReceived ? " · Received early" : ""}
                                </div>
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "13px", color: isEarlyReceived ? "#4ADE80" : "#8B8FA8" }}>+${fmt(inc.fixed_amount || 0)}</span>
                                {isEarlyReceived ? (
                                  <button onClick={() => unmarkIncomeReceived(inc.id, periodKey)} style={{ background: "none", border: "none", color: "#8B8FA8", cursor: "pointer", fontSize: "10px", fontFamily: "'Inter', sans-serif", padding: 0, textDecoration: "underline" }}>Undo</button>
                                ) : isFuture ? (
                                  <button onClick={() => markIncomeReceived(inc.id, periodKey)} style={{ background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.3)", color: "#4ADE80", padding: "3px 10px", borderRadius: "5px", cursor: "pointer", fontSize: "11px", fontFamily: "'Inter', sans-serif", fontWeight: "500" }}>Got Paid</button>
                                ) : null}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Carry-over bills from previous period */}
                    {item.isCurrent && carryOverBills.length > 0 && (
                      <div style={{ marginTop: "12px", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "12px" }}>
                        <div style={{ fontSize: "9px", color: "#FBBF24", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: "600", marginBottom: "8px" }}>
                          ⚠ Carried Over
                        </div>
                        {carryOverBills.map((bill, j) => (
                          <div key={bill.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: j < carryOverBills.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                            <div>
                              <div style={{ fontSize: "13px", color: "#FBBF24", fontWeight: "500" }}>{bill.name}</div>
                              <div style={{ fontSize: "11px", color: "#8B8FA8", marginTop: "2px" }}>Not cleared from last period</div>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "13px", color: "#FBBF24" }}>${fmt(bill.amount)}</span>
                              <button
                                onClick={() => markBillPaid(bill, bill.amount, prevPeriod.start_date)}
                                style={{ background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.3)", color: "#4ADE80", padding: "3px 10px", borderRadius: "5px", cursor: "pointer", fontSize: "11px", fontFamily: "'Inter', sans-serif", fontWeight: "500" }}
                              >
                                Paid
                              </button>
                              <button
                                onClick={() => skipBill(bill.id, prevPeriod.start_date)}
                                style={{ background: "rgba(248,113,113,0.06)", border: "1px solid rgba(248,113,113,0.25)", color: "#F87171", padding: "3px 7px", borderRadius: "5px", cursor: "pointer", fontSize: "11px", fontFamily: "'Inter', sans-serif", lineHeight: 1 }}
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Bill list */}
                    {item.bills.length > 0 && (() => {
                      const pStart = new Date(item.period.start_date + "T00:00:00");
                      const pEnd = new Date(item.period.end_date + "T23:59:59");
                      const periodKey = item.period.start_date;

                      const skippedBills = item.bills.filter(b => skippedBillPeriods.has(`${b.id}-${periodKey}`));
                      const activeBills = item.bills.filter(b => !skippedBillPeriods.has(`${b.id}-${periodKey}`));
                      // A bill only belongs in the struck-through "Paid" section when it's
                      // FULLY paid. A partial payment still owes its remainder (which counts
                      // in the BILLS total), so it stays in the unpaid list where it renders
                      // as "Partial · $X paid · $Y remaining" — otherwise its leftover is
                      // invisible but still inflates BILLS.
                      const isFullyPaid = (b) => {
                        const rec = getBillPaymentRecord(b.id, periodKey);
                        return !!rec && (rec.is_paid || (rec.paid_amount || 0) >= (b.amount || 0));
                      };
                      const unpaidBills = activeBills.filter(b => !isFullyPaid(b));
                      const paidBills = activeBills.filter(b => isFullyPaid(b));

                      if (activeBills.length === 0 && skippedBills.length === 0) return null;
                      return (
                      <div style={{ marginTop: "12px", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "12px" }}>
                        {unpaidBills.map((bill, j) => {
                          const paidThisPeriod = isBillPaidInPeriod(bill.id, periodKey);
                          const effectivePaidAmount = getBillPaidAmount(bill.id, periodKey);
                          const remaining = (bill.amount || 0) - effectivePaidAmount;
                          const isPartial = effectivePaidAmount > 0;
                          const isLast = j === unpaidBills.length - 1 && paidBills.length === 0 && skippedBills.length === 0;
                          return (
                          <div key={bill.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: isLast ? "none" : "1px solid rgba(255,255,255,0.04)" }}>
                            <div>
                              <div style={{ fontSize: "13px", color: "#F0F6FC", fontWeight: "500" }}>
                                {bill.name}
                                {isPartial && <span style={{ fontSize: "9px", background: "rgba(251,191,36,0.15)", color: "#FBBF24", border: "1px solid rgba(251,191,36,0.3)", borderRadius: "4px", padding: "1px 6px", marginLeft: "7px", fontWeight: "600", letterSpacing: "0.06em", textTransform: "uppercase" }}>Partial</span>}
                              </div>
                              <div style={{ fontSize: "11px", color: "#8B8FA8", marginTop: "2px" }}>
                                {isPartial ? `$${fmt(effectivePaidAmount)} paid · $${fmt(remaining)} remaining` : (bill.frequency || "monthly") === "payday" ? "Every Pay Day" : (bill.frequency || "monthly") === "biweekly" ? "Biweekly" : `Due the ${bill.due_day}${getSuffix(bill.due_day)}`}
                              </div>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              {quickEditBillAmountId === bill.id ? (
                                <input
                                  type="number"
                                  value={quickEditBillAmountVal}
                                  onChange={(e) => setQuickEditBillAmountVal(e.target.value)}
                                  onBlur={() => saveBillAmount(bill.id, quickEditBillAmountVal)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") saveBillAmount(bill.id, quickEditBillAmountVal);
                                    if (e.key === "Escape") setQuickEditBillAmountId(null);
                                  }}
                                  autoFocus
                                  onFocus={(e) => e.target.select()}
                                  style={{ background: "#2D2B45", border: "1px solid #6C63FF", color: "#F0F6FC", padding: "3px 6px", borderRadius: "5px", fontSize: "13px", fontFamily: "'DM Mono', monospace", width: "80px", textAlign: "right" }}
                                />
                              ) : (
                                <span
                                  onClick={() => { setQuickEditBillAmountId(bill.id); setQuickEditBillAmountVal(bill.amount); }}
                                  title="Click to edit amount"
                                  style={{ fontFamily: "'DM Mono', monospace", fontSize: "13px", color: isPartial ? "#FBBF24" : "#8B8FA8", cursor: "pointer" }}
                                >
                                  ${fmt(isPartial ? remaining : bill.amount)}
                                </span>
                              )}
                              {pendingPaidBill?._key === `${bill.id}-${periodKey}` ? (
                                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                  <input type="text" inputMode="decimal" value={pendingPaidAmount} onChange={(e) => setPendingPaidAmount(e.target.value)} autoFocus placeholder="Amt paid" style={{ width: "90px", background: "#13111F", border: "1px solid rgba(108,99,255,0.4)", borderRadius: "5px", color: "#F0F6FC", padding: "3px 6px", fontSize: "11px", fontFamily: "'DM Mono', monospace", outline: "none" }} />
                                  <button onClick={() => { markBillPaid(pendingPaidBill, pendingPaidAmount, periodKey); setPendingPaidBill(null); }} style={{ background: "rgba(74,222,128,0.15)", border: "1px solid rgba(74,222,128,0.4)", color: "#4ADE80", padding: "3px 8px", borderRadius: "5px", cursor: "pointer", fontSize: "11px", fontFamily: "'Inter', sans-serif", fontWeight: "600" }}>✓</button>
                                  <button onClick={() => setPendingPaidBill(null)} style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)", color: "#F87171", padding: "3px 8px", borderRadius: "5px", cursor: "pointer", fontSize: "11px", fontFamily: "'Inter', sans-serif" }}>✕</button>
                                </div>
                              ) : (
                                <div style={{ display: "flex", gap: "4px" }}>
                                  <button onClick={() => markBillPaid(bill, bill.amount, periodKey)} style={{ background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.3)", color: "#4ADE80", padding: "3px 10px", borderRadius: "5px", cursor: "pointer", fontSize: "11px", fontFamily: "'Inter', sans-serif", fontWeight: "500" }}>Paid</button>
                                  <button onClick={() => { setPendingPaidBill({ ...bill, _key: `${bill.id}-${periodKey}` }); setPendingPaidAmount(""); }} style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.3)", color: "#FBBF24", padding: "3px 10px", borderRadius: "5px", cursor: "pointer", fontSize: "11px", fontFamily: "'Inter', sans-serif" }}>{isPartial ? "More" : "Partial"}</button>
                                  <button onClick={() => skipBill(bill.id, periodKey)} style={{ background: "rgba(248,113,113,0.06)", border: "1px solid rgba(248,113,113,0.25)", color: "#F87171", padding: "3px 7px", borderRadius: "5px", cursor: "pointer", fontSize: "11px", fontFamily: "'Inter', sans-serif", lineHeight: 1 }}>✕</button>
                                </div>
                              )}
                            </div>
                          </div>
                          );
                        })}
                        {paidBills.map((bill, j) => (
                          <div key={bill.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: j < paidBills.length - 1 || skippedBills.length > 0 ? "1px solid rgba(255,255,255,0.03)" : "none", opacity: 0.45 }}>
                            <div>
                              <div style={{ fontSize: "13px", color: "#8B8FA8", fontWeight: "500", textDecoration: "line-through" }}>{bill.name}</div>
                              <div style={{ fontSize: "11px", color: "#5C6080", marginTop: "2px" }}>Paid</div>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "13px", color: "#5C6080", textDecoration: "line-through" }}>${fmt(bill.amount)}</span>
                              <button onClick={() => markBillUnpaid(bill, periodKey)} style={{ background: "none", border: "1px solid rgba(248,113,113,0.3)", color: "#F87171", padding: "2px 8px", borderRadius: "5px", cursor: "pointer", fontSize: "10px", fontFamily: "'Inter', sans-serif" }}>Undo</button>
                            </div>
                          </div>
                        ))}
                        {skippedBills.map((bill, j) => (
                          <div key={bill.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: j < skippedBills.length - 1 ? "1px solid rgba(255,255,255,0.03)" : "none", opacity: 0.4 }}>
                            <div>
                              <div style={{ fontSize: "13px", color: "#8B8FA8", fontWeight: "500" }}>{bill.name}</div>
                              <div style={{ fontSize: "11px", color: "#5C6080", marginTop: "2px" }}>Skipped</div>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "13px", color: "#5C6080" }}>${fmt(bill.amount)}</span>
                              <button onClick={() => restoreBill(bill.id, periodKey)} style={{ background: "none", border: "1px solid rgba(108,99,255,0.35)", color: "#6C63FF", padding: "2px 8px", borderRadius: "5px", cursor: "pointer", fontSize: "10px", fontFamily: "'Inter', sans-serif" }}>Restore</button>
                            </div>
                          </div>
                        ))}
                      </div>
                      );
                    })()}
                    </>
                    )}
                  </div>
                  );
                })}
              </div>
            </div>
            {renderSidePanel()}
          </div>
        </div>
      );
    }

    if (activeNav === "monthly") {
      // ── Helpers ──────────────────────────────────────────────────────────────
      const billMultiplier = (freq) => (freq === "payday" || freq === "biweekly") ? 2 : 1;
      const incMultiplier  = (freq) => freq === "biweekly" ? 2 : freq === "weekly" ? 4 : 1;

      // ── Real (baseline) totals ───────────────────────────────────────────────
      const realMonthlyIncome = income.reduce((s, i) => s + (i.fixed_amount || 0) * incMultiplier(i.frequency), 0);
      const realMonthlyBills  = bills.reduce((s, b) => s + (b.amount || 0) * billMultiplier(b.frequency || "monthly"), 0);

      // ── What-if effective values ─────────────────────────────────────────────
      const wiAmt = (b) => {
        const ov = whatIfBills[b.id];
        return ov ? parseFloat(ov.amount) || 0 : (b.amount || 0);
      };
      const wiEnabled = (b) => whatIfBills[b.id]?.enabled ?? true;
      const wiIncAmt  = (i) => {
        const ov = whatIfIncome[i.id];
        return ov ? parseFloat(ov.amount) || 0 : (i.fixed_amount || 0);
      };
      const wiIncEnabled = (i) => whatIfIncome[i.id]?.enabled ?? true;

      const wiMonthlyIncome = whatIfMode
        ? income.reduce((s, i) => wiIncEnabled(i) ? s + wiIncAmt(i) * incMultiplier(i.frequency) : s, 0)
          + whatIfExtraIncome.filter(i => i.enabled !== false).reduce((s, i) => s + (parseFloat(i.amount) || 0) * incMultiplier(i.frequency || "biweekly"), 0)
        : realMonthlyIncome;

      const wiMonthlyBills = whatIfMode
        ? bills.reduce((s, b) => wiEnabled(b) ? s + wiAmt(b) * billMultiplier(b.frequency || "monthly") : s, 0)
          + whatIfExtraBills.filter(b => b.enabled !== false).reduce((s, b) => s + (parseFloat(b.amount) || 0) * billMultiplier(b.frequency || "monthly"), 0)
        : realMonthlyBills;

      const wiRemaining = wiMonthlyIncome - wiMonthlyBills;
      const wiAnnual    = wiRemaining * 12;

      const realRemaining = realMonthlyIncome - realMonthlyBills;
      const deltaRemaining = wiRemaining - realRemaining;

      // ── Bill groups (uses what-if amounts when active) ───────────────────────
      const allBillsForView = [
        ...bills.map(b => ({ ...b, _extra: false })),
        ...(whatIfMode ? whatIfExtraBills.map(b => ({ ...b, _extra: true })) : []),
      ];
      const everyPaycheck = allBillsForView.filter(b => (b.frequency || "monthly") === "payday");
      const firstHalf     = allBillsForView.filter(b => (b.frequency || "monthly") === "monthly" && b.due_day >= 1  && b.due_day <= 15);
      const secondHalf    = allBillsForView.filter(b => (b.frequency || "monthly") === "monthly" && b.due_day >= 16 && b.due_day <= 31);
      const noDueDay      = allBillsForView.filter(b => (b.frequency || "monthly") === "monthly" && !b.due_day);

      // ── UI helpers ───────────────────────────────────────────────────────────
      const panelBorder = "1px solid rgba(255,255,255,0.06)";
      const rowBorder   = "1px solid rgba(255,255,255,0.04)";

      const statTile = (label, value, negative, delta = null) => (
        <div style={{ background: "#1A1826", border: whatIfMode ? "1px solid rgba(251,191,36,0.25)" : panelBorder, borderRadius: "12px", padding: isMobile ? "16px 14px" : "20px 22px", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "1px", background: whatIfMode ? "linear-gradient(90deg, rgba(251,191,36,0.8), transparent)" : "linear-gradient(90deg, rgba(0,212,170,0.8), transparent)" }} />
          <div style={{ fontSize: "10px", color: "#8B8FA8", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: "600", marginBottom: "10px" }}>{label}</div>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: isMobile ? "19px" : "26px", fontWeight: "500", color: negative ? "#F87171" : "#00D4AA", lineHeight: 1.1, whiteSpace: "nowrap" }}>
            {value < 0 ? "-" : ""}${fmt(Math.abs(value))}
          </div>
          {whatIfMode && delta !== null && delta !== 0 && (
            <div style={{ fontSize: "11px", color: delta > 0 ? "#4ADE80" : "#F87171", marginTop: "6px", fontFamily: "'DM Mono', monospace" }}>
              {delta > 0 ? "▲" : "▼"} ${fmt(Math.abs(delta))}/mo vs real
            </div>
          )}
        </div>
      );

      const setBillOverride = (id, field, val) =>
        setWhatIfBills(prev => ({ ...prev, [id]: { ...(prev[id] || {}), [field]: val } }));
      const setIncOverride = (id, field, val) =>
        setWhatIfIncome(prev => ({ ...prev, [id]: { ...(prev[id] || {}), [field]: val } }));

      const billRow = (b, multiplier) => {
        const isExtra   = b._extra;
        const enabled   = isExtra ? b.enabled !== false : wiEnabled(b);
        const amount    = isExtra ? (parseFloat(b.amount) || 0) : wiAmt(b);
        const monthly   = enabled ? amount * multiplier : 0;
        const realAmt   = b._extra ? 0 : (b.amount || 0);
        const changed   = whatIfMode && !isExtra && (parseFloat(whatIfBills[b.id]?.amount) !== undefined && parseFloat(whatIfBills[b.id]?.amount) !== realAmt);

        return (
          <div key={b.id} style={{ display: "grid", gridTemplateColumns: isMobile ? (whatIfMode ? "20px 1fr 72px 76px" : "1fr 72px 80px") : (whatIfMode ? "24px 1fr 110px 110px 110px" : "1fr 100px 110px 110px"), gap: "8px", padding: "10px 0", borderBottom: rowBorder, alignItems: "center", opacity: (!whatIfMode || enabled) ? 1 : 0.35, transition: "opacity 0.2s" }}>
            {whatIfMode && (
              <button onClick={() => {
                if (isExtra) {
                  setWhatIfExtraBills(prev => prev.map(x => x.id === b.id ? { ...x, enabled: !x.enabled } : x));
                } else {
                  setBillOverride(b.id, "enabled", !enabled);
                }
              }} style={{ width: "20px", height: "20px", borderRadius: "4px", border: `1px solid ${enabled ? "#6C63FF" : "rgba(255,255,255,0.15)"}`, background: enabled ? "rgba(108,99,255,0.2)" : "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0, flexShrink: 0 }}>
                {enabled && <span style={{ fontSize: "10px", color: "#6C63FF" }}>✓</span>}
              </button>
            )}
            <div>
              <div style={{ fontSize: "13px", color: enabled ? "#F0F6FC" : "#8B8FA8", fontWeight: "500", textDecoration: (!whatIfMode || enabled) ? "none" : "line-through" }}>
                {b.name}
                {isExtra && <span style={{ fontSize: "9px", background: "rgba(251,191,36,0.15)", border: "1px solid rgba(251,191,36,0.3)", color: "#FBBF24", borderRadius: "4px", padding: "1px 6px", marginLeft: "6px", fontWeight: "700", letterSpacing: "0.06em", textTransform: "uppercase" }}>hypothetical</span>}
              </div>
              {(b.frequency || "monthly") === "payday"
                ? <div style={{ fontSize: "11px", color: "#8B8FA8", marginTop: "1px" }}>Every Pay Day</div>
                : b.due_day > 0 && <div style={{ fontSize: "11px", color: "#8B8FA8", marginTop: "1px" }}>Due the {b.due_day}{["st","nd","rd"][((b.due_day % 10) - 1)] || "th"}</div>
              }
            </div>
            {/* Per check — editable in what-if mode */}
            <div style={{ textAlign: "right" }}>
              {whatIfMode && !isExtra ? (
                <input
                  type="number"
                  value={whatIfBills[b.id]?.amount ?? (b.amount || 0)}
                  onChange={e => setBillOverride(b.id, "amount", e.target.value)}
                  style={{ width: "90px", background: changed ? "rgba(251,191,36,0.08)" : "rgba(255,255,255,0.04)", border: changed ? "1px solid rgba(251,191,36,0.4)" : "1px solid rgba(255,255,255,0.1)", borderRadius: "6px", color: "#F0F6FC", fontFamily: "'DM Mono', monospace", fontSize: "12px", padding: "4px 8px", textAlign: "right" }}
                />
              ) : (
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "13px", color: "#8B8FA8" }}>${fmt(amount)}</span>
              )}
            </div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "13px", color: enabled ? "#F87171" : "#4A4F5C", textAlign: "right" }}>{enabled ? `$${fmt(monthly)}` : "—"}</div>
            {!isMobile && <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "13px", color: "#8B8FA8", textAlign: "right" }}>{enabled ? `$${fmt(monthly * 12)}` : "—"}</div>}
          </div>
        );
      };

      const groupPanel = (title, group, multiplier) => {
        const visibleGroup = group.filter(b => !whatIfMode || b._extra || wiEnabled(b));
        const groupMonthly = group.reduce((s, b) => {
          const en = b._extra ? b.enabled !== false : wiEnabled(b);
          if (!en) return s;
          return s + (b._extra ? parseFloat(b.amount) || 0 : wiAmt(b)) * multiplier;
        }, 0);
        if (group.length === 0 && (!whatIfMode || !whatIfExtraBills.some(b => group.includes(b)))) return null;
        if (group.length === 0) return null;
        const cols = isMobile
          ? (whatIfMode ? "20px 1fr 72px 76px" : "1fr 72px 80px")
          : (whatIfMode ? "24px 1fr 110px 110px 110px" : "1fr 100px 110px 110px");
        return (
          <div style={{ background: "#1A1826", border: panelBorder, borderRadius: "12px", padding: "20px", marginBottom: "12px" }}>
            <div style={{ display: "grid", gridTemplateColumns: cols, gap: "8px", marginBottom: "8px" }}>
              {whatIfMode && <div />}
              <div style={{ fontSize: "11px", color: "#8B8FA8", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: "600" }}>{title}</div>
              <div style={{ fontSize: "10px", color: "#8B8FA8", textAlign: "right", letterSpacing: "0.08em", textTransform: "uppercase" }}>Per Check</div>
              <div style={{ fontSize: "10px", color: "#8B8FA8", textAlign: "right", letterSpacing: "0.08em", textTransform: "uppercase" }}>Monthly</div>
              {!isMobile && <div style={{ fontSize: "10px", color: "#8B8FA8", textAlign: "right", letterSpacing: "0.08em", textTransform: "uppercase" }}>Annual</div>}
            </div>
            {group.map(b => billRow(b, multiplier))}
            <div style={{ display: "grid", gridTemplateColumns: cols, gap: "8px", paddingTop: "12px", marginTop: "4px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
              {whatIfMode && <div />}
              <div style={{ fontSize: "12px", color: "#8B8FA8", fontWeight: "600" }}>Subtotal</div>
              <div />
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "13px", color: "#F87171", textAlign: "right", fontWeight: "600" }}>${fmt(groupMonthly)}</div>
              {!isMobile && <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "13px", color: "#8B8FA8", textAlign: "right" }}>${fmt(groupMonthly * 12)}</div>}
            </div>
          </div>
        );
      };

      const addExtraBill = () => {
        const id = `extra-bill-${whatIfNextId}`;
        setWhatIfNextId(n => n + 1);
        setWhatIfExtraBills(prev => [...prev, { id, name: "", amount: "", frequency: "monthly", due_day: "", enabled: true }]);
      };
      const addExtraIncome = () => {
        const id = `extra-inc-${whatIfNextId}`;
        setWhatIfNextId(n => n + 1);
        setWhatIfExtraIncome(prev => [...prev, { id, name: "", amount: "", frequency: "biweekly", enabled: true }]);
      };

      const inputStyle = { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "6px", color: "#F0F6FC", fontFamily: "'Inter', sans-serif", fontSize: "12px", padding: "5px 8px" };

      return (
        <div className="content-area">
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
            <h1 className="page-title" style={{ margin: 0 }}>Monthly Overview</h1>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              {whatIfMode && (
                <button onClick={() => { setWhatIfBills({}); setWhatIfIncome({}); setWhatIfExtraBills([]); setWhatIfExtraIncome([]); }} style={{ fontSize: "12px", color: "#8B8FA8", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "7px", padding: "7px 14px", cursor: "pointer", fontFamily: "'Inter', sans-serif" }}>
                  Reset
                </button>
              )}
              <button onClick={() => { setWhatIfMode(m => !m); if (whatIfMode) { setWhatIfBills({}); setWhatIfIncome({}); setWhatIfExtraBills([]); setWhatIfExtraIncome([]); } }} style={{ fontSize: "12px", fontWeight: "600", color: whatIfMode ? "#13111F" : "#FBBF24", background: whatIfMode ? "#FBBF24" : "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.4)", borderRadius: "7px", padding: "7px 16px", cursor: "pointer", fontFamily: "'Inter', sans-serif" }}>
                {whatIfMode ? "✕  Exit What-If" : "⚡ What-If Mode"}
              </button>
            </div>
          </div>

          {/* What-if banner */}
          {whatIfMode && (
            <div style={{ background: "rgba(251,191,36,0.07)", border: "1px solid rgba(251,191,36,0.25)", borderRadius: "10px", padding: "10px 16px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "16px" }}>⚡</span>
              <div>
                <div style={{ fontSize: "13px", fontWeight: "600", color: "#FBBF24" }}>What-If Mode — nothing is saved</div>
                <div style={{ fontSize: "11px", color: "#8B8FA8", marginTop: "1px" }}>Toggle bills on/off, edit amounts, add hypotheticals. Your real data is untouched.</div>
              </div>
            </div>
          )}

          {/* Stat tiles */}
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(4,1fr)", gap: isMobile ? "8px" : "12px", marginBottom: "28px" }}>
            {statTile("Monthly Income",    wiMonthlyIncome, false, whatIfMode ? wiMonthlyIncome - realMonthlyIncome : null)}
            {statTile("Monthly Bills",     wiMonthlyBills,  true,  whatIfMode ? -(wiMonthlyBills - realMonthlyBills) : null)}
            {statTile("Monthly Remaining", wiRemaining,     wiRemaining < 0, whatIfMode ? deltaRemaining : null)}
            {statTile("Annual Remaining",  wiAnnual,        wiAnnual < 0,    whatIfMode ? deltaRemaining * 12 : null)}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "58% 40%", gap: "12px", alignItems: "start" }}>

            {/* Left: bills */}
            <div>
              <div style={{ fontSize: "11px", color: "#8B8FA8", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: "600", marginBottom: "12px" }}>Bills Breakdown</div>
              {groupPanel("Every Paycheck", everyPaycheck, 2)}
              {groupPanel("Due 1st – 15th", firstHalf, 1)}
              {groupPanel("Due 16th – 31st", secondHalf, 1)}
              {groupPanel("No Due Date", noDueDay, 1)}

              {/* Add hypothetical bill */}
              {whatIfMode && (
                <div style={{ marginBottom: "12px" }}>
                  {whatIfExtraBills.filter(b => !everyPaycheck.includes(b) && !firstHalf.includes(b) && !secondHalf.includes(b) && !noDueDay.includes(b)).map(b => (
                    <div key={b.id} style={{ background: "rgba(251,191,36,0.05)", border: "1px solid rgba(251,191,36,0.2)", borderRadius: "10px", padding: "12px 16px", marginBottom: "8px", display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                      <input placeholder="Bill name" value={b.name} onChange={e => setWhatIfExtraBills(prev => prev.map(x => x.id === b.id ? { ...x, name: e.target.value } : x))} style={{ ...inputStyle, flex: "1 1 120px" }} />
                      <input placeholder="Amount" type="number" value={b.amount} onChange={e => setWhatIfExtraBills(prev => prev.map(x => x.id === b.id ? { ...x, amount: e.target.value } : x))} style={{ ...inputStyle, width: "90px" }} />
                      <select value={b.frequency || "monthly"} onChange={e => setWhatIfExtraBills(prev => prev.map(x => x.id === b.id ? { ...x, frequency: e.target.value } : x))} style={{ ...inputStyle }}>
                        <option value="monthly">Monthly</option>
                        <option value="payday">Every Payday</option>
                      </select>
                      <input placeholder="Due day" type="number" min="1" max="31" value={b.due_day} onChange={e => setWhatIfExtraBills(prev => prev.map(x => x.id === b.id ? { ...x, due_day: parseInt(e.target.value) || "" } : x))} style={{ ...inputStyle, width: "70px" }} />
                      <button onClick={() => setWhatIfExtraBills(prev => prev.filter(x => x.id !== b.id))} style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.25)", color: "#F87171", borderRadius: "6px", padding: "5px 10px", cursor: "pointer", fontSize: "12px", fontFamily: "'Inter', sans-serif" }}>Remove</button>
                    </div>
                  ))}
                  <button onClick={addExtraBill} style={{ fontSize: "12px", color: "#FBBF24", background: "rgba(251,191,36,0.08)", border: "1px dashed rgba(251,191,36,0.35)", borderRadius: "8px", padding: "8px 16px", cursor: "pointer", fontFamily: "'Inter', sans-serif", width: "100%" }}>
                    + Add Hypothetical Bill
                  </button>
                </div>
              )}

              {/* Grand total */}
              <div style={{ background: "#1A1826", border: whatIfMode ? "1px solid rgba(251,191,36,0.25)" : panelBorder, borderRadius: "12px", padding: "16px 20px" }}>
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? (whatIfMode ? "20px 1fr 72px 76px" : "1fr 72px 80px") : (whatIfMode ? "24px 1fr 110px 110px 110px" : "1fr 100px 110px 110px"), gap: "8px", alignItems: "center" }}>
                  {whatIfMode && <div />}
                  <div style={{ fontSize: "13px", color: "#F0F6FC", fontWeight: "700" }}>Total Bills</div>
                  {!isMobile && <div />}
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "15px", color: "#F87171", textAlign: "right", fontWeight: "600" }}>${fmt(wiMonthlyBills)}</div>
                  {!isMobile && <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "15px", color: "#8B8FA8", textAlign: "right" }}>${fmt(wiMonthlyBills * 12)}</div>}
                </div>
                {whatIfMode && wiMonthlyBills !== realMonthlyBills && (
                  <div style={{ marginTop: "8px", paddingTop: "8px", borderTop: rowBorder, display: "flex", justifyContent: "flex-end", gap: "8px", alignItems: "center" }}>
                    <span style={{ fontSize: "11px", color: "#8B8FA8" }}>vs real ${fmt(realMonthlyBills)}/mo</span>
                    <span style={{ fontSize: "12px", color: wiMonthlyBills < realMonthlyBills ? "#4ADE80" : "#F87171", fontFamily: "'DM Mono', monospace", fontWeight: "600" }}>
                      {wiMonthlyBills < realMonthlyBills ? "▼" : "▲"} ${fmt(Math.abs(wiMonthlyBills - realMonthlyBills))}/mo
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Right: income + summary */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>

              {/* Income panel */}
              <div style={{ background: "#1A1826", border: panelBorder, borderRadius: "12px", padding: "20px" }}>
                <div style={{ display: "grid", gridTemplateColumns: whatIfMode ? "24px 1fr 90px 90px" : "1fr 90px 90px", gap: "8px", marginBottom: "8px" }}>
                  {whatIfMode && <div />}
                  <div style={{ fontSize: "11px", color: "#8B8FA8", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: "600" }}>Income</div>
                  <div style={{ fontSize: "10px", color: "#8B8FA8", textAlign: "right", letterSpacing: "0.08em", textTransform: "uppercase" }}>Monthly</div>
                  <div style={{ fontSize: "10px", color: "#8B8FA8", textAlign: "right", letterSpacing: "0.08em", textTransform: "uppercase" }}>Annual</div>
                </div>
                {[
                  ...income.map(i => ({ ...i, _extra: false })),
                  ...(whatIfMode ? whatIfExtraIncome.map(i => ({ ...i, _extra: true })) : []),
                ].map(i => {
                  const isExtra  = i._extra;
                  const enabled  = isExtra ? i.enabled !== false : wiIncEnabled(i);
                  const amt      = isExtra ? (parseFloat(i.amount) || 0) : wiIncAmt(i);
                  const freq     = i.frequency || (isExtra ? "biweekly" : "monthly");
                  const monthly  = enabled ? amt * incMultiplier(freq) : 0;
                  const realAmt  = i._extra ? 0 : (i.fixed_amount || 0);
                  const changed  = whatIfMode && !isExtra && parseFloat(whatIfIncome[i.id]?.amount) !== undefined && parseFloat(whatIfIncome[i.id]?.amount) !== realAmt;
                  return (
                    <div key={i.id} style={{ display: "grid", gridTemplateColumns: whatIfMode ? "24px 1fr 90px 90px" : "1fr 90px 90px", gap: "8px", padding: "10px 0", borderBottom: rowBorder, alignItems: "center", opacity: (!whatIfMode || enabled) ? 1 : 0.35, transition: "opacity 0.2s" }}>
                      {whatIfMode && (
                        <button onClick={() => {
                          if (isExtra) setWhatIfExtraIncome(prev => prev.map(x => x.id === i.id ? { ...x, enabled: !x.enabled } : x));
                          else setIncOverride(i.id, "enabled", !enabled);
                        }} style={{ width: "20px", height: "20px", borderRadius: "4px", border: `1px solid ${enabled ? "#6C63FF" : "rgba(255,255,255,0.15)"}`, background: enabled ? "rgba(108,99,255,0.2)" : "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0, flexShrink: 0 }}>
                          {enabled && <span style={{ fontSize: "10px", color: "#6C63FF" }}>✓</span>}
                        </button>
                      )}
                      <div>
                        {isExtra ? (
                          <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
                            <input placeholder="Name" value={i.name} onChange={e => setWhatIfExtraIncome(prev => prev.map(x => x.id === i.id ? { ...x, name: e.target.value } : x))} style={{ ...inputStyle, width: "100px" }} />
                            <input placeholder="Amount" type="number" value={i.amount} onChange={e => setWhatIfExtraIncome(prev => prev.map(x => x.id === i.id ? { ...x, amount: e.target.value } : x))} style={{ ...inputStyle, width: "80px" }} />
                            <select value={i.frequency || "biweekly"} onChange={e => setWhatIfExtraIncome(prev => prev.map(x => x.id === i.id ? { ...x, frequency: e.target.value } : x))} style={{ ...inputStyle }}>
                              <option value="biweekly">Biweekly</option>
                              <option value="monthly">Monthly</option>
                              <option value="weekly">Weekly</option>
                            </select>
                            <button onClick={() => setWhatIfExtraIncome(prev => prev.filter(x => x.id !== i.id))} style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.25)", color: "#F87171", borderRadius: "6px", padding: "4px 8px", cursor: "pointer", fontSize: "11px", fontFamily: "'Inter', sans-serif" }}>✕</button>
                          </div>
                        ) : (
                          <>
                            <div style={{ fontSize: "13px", color: enabled ? "#F0F6FC" : "#8B8FA8", fontWeight: "500" }}>{i.name}</div>
                            <div style={{ fontSize: "11px", color: "#8B8FA8", marginTop: "1px", textTransform: "capitalize" }}>{freq} · ${fmt(isExtra ? parseFloat(i.amount)||0 : i.fixed_amount||0)}/check</div>
                          </>
                        )}
                      </div>
                      {/* Amount — editable in what-if for real income */}
                      <div style={{ textAlign: "right" }}>
                        {whatIfMode && !isExtra ? (
                          <input type="number" value={whatIfIncome[i.id]?.amount ?? (i.fixed_amount || 0)} onChange={e => setIncOverride(i.id, "amount", e.target.value)} style={{ width: "80px", background: changed ? "rgba(251,191,36,0.08)" : "rgba(255,255,255,0.04)", border: changed ? "1px solid rgba(251,191,36,0.4)" : "1px solid rgba(255,255,255,0.1)", borderRadius: "6px", color: "#F0F6FC", fontFamily: "'DM Mono', monospace", fontSize: "12px", padding: "4px 8px", textAlign: "right" }} />
                        ) : (
                          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "13px", color: enabled ? "#00D4AA" : "#4A4F5C" }}>${fmt(monthly)}</span>
                        )}
                      </div>
                      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "13px", color: enabled ? "#8B8FA8" : "#4A4F5C", textAlign: "right" }}>{enabled ? `$${fmt(monthly * 12)}` : "—"}</div>
                    </div>
                  );
                })}
                {whatIfMode && (
                  <button onClick={addExtraIncome} style={{ fontSize: "12px", color: "#FBBF24", background: "rgba(251,191,36,0.08)", border: "1px dashed rgba(251,191,36,0.35)", borderRadius: "8px", padding: "7px 14px", cursor: "pointer", fontFamily: "'Inter', sans-serif", width: "100%", marginTop: "10px" }}>
                    + Add Hypothetical Income
                  </button>
                )}
                <div style={{ display: "grid", gridTemplateColumns: whatIfMode ? "24px 1fr 90px 90px" : "1fr 90px 90px", gap: "8px", paddingTop: "12px", borderTop: "1px solid rgba(255,255,255,0.08)", marginTop: "4px" }}>
                  {whatIfMode && <div />}
                  <div style={{ fontSize: "12px", color: "#8B8FA8", fontWeight: "600" }}>Total</div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "13px", color: "#00D4AA", textAlign: "right", fontWeight: "600" }}>${fmt(wiMonthlyIncome)}</div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "13px", color: "#8B8FA8", textAlign: "right" }}>${fmt(wiMonthlyIncome * 12)}</div>
                </div>
              </div>

              {/* Net summary panel */}
              <div style={{ background: "#1A1826", border: whatIfMode ? "1px solid rgba(251,191,36,0.25)" : panelBorder, borderRadius: "12px", padding: "20px" }}>
                <div style={{ fontSize: "11px", color: "#8B8FA8", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: "600", marginBottom: "16px" }}>Net Summary</div>
                {[
                  { label: "Monthly Income",   val: wiMonthlyIncome,  color: "#00D4AA" },
                  { label: "Monthly Bills",    val: -wiMonthlyBills,  color: "#F87171" },
                  { label: "Monthly Remaining",val: wiRemaining,      color: wiRemaining >= 0 ? "#4ADE80" : "#F87171" },
                ].map((row, idx) => (
                  <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: idx < 2 ? rowBorder : "none" }}>
                    <div style={{ fontSize: "13px", color: "#8B8FA8" }}>{row.label}</div>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "14px", color: row.color, fontWeight: "500" }}>
                      {row.val < 0 ? "-" : ""}${fmt(Math.abs(row.val))}
                    </div>
                  </div>
                ))}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0 0" }}>
                  <div style={{ fontSize: "13px", color: "#8B8FA8" }}>Annual Remaining</div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "18px", color: wiAnnual >= 0 ? "#4ADE80" : "#F87171", fontWeight: "600" }}>
                    {wiAnnual < 0 ? "-" : ""}${fmt(Math.abs(wiAnnual))}
                  </div>
                </div>
                {whatIfMode && deltaRemaining !== 0 && (
                  <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: rowBorder, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontSize: "12px", color: "#8B8FA8" }}>Annual impact vs real</div>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "14px", color: deltaRemaining > 0 ? "#4ADE80" : "#F87171", fontWeight: "600" }}>
                      {deltaRemaining > 0 ? "+" : "-"}${fmt(Math.abs(deltaRemaining * 12))}/yr
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }

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

          {/* Add Debt Form */}
          {showDebtForm && (
            <div className="panel" style={{ marginBottom: "16px" }}>
              <div className="panel-header">
                <div className="panel-title">New Debt</div>
              </div>
              <div className="form-grid">
                <input placeholder="Debt name" value={debtName} onChange={(e) => setDebtName(e.target.value)} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#F2F0EB", padding: "8px 12px", borderRadius: "6px", fontSize: "13px", fontFamily: "'Inter', sans-serif" }} />
                <select value={debtCategory} onChange={(e) => setDebtCategory(e.target.value)} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#F2F0EB", padding: "8px 12px", borderRadius: "6px", fontSize: "13px", fontFamily: "'Inter', sans-serif" }}>
                  <option value="Credit Card">Credit Card</option>
                  <option value="Auto Loan">Auto Loan</option>
                  <option value="Student Loan">Student Loan</option>
                  <option value="Personal Loan">Personal Loan</option>
                  <option value="Medical">Medical</option>
                  <option value="Mortgage">Mortgage</option>
                  <option value="Other">Other</option>
                </select>
                <select value={debtOwner} onChange={(e) => setDebtOwner(e.target.value)} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#F2F0EB", padding: "8px 12px", borderRadius: "6px", fontSize: "13px", fontFamily: "'Inter', sans-serif" }}>
                  <option value="joint">Joint</option>
                  {members.map((m, i) => <option key={i} value={m.name}>{m.name}</option>)}
                </select>
                <input type="number" placeholder="Current balance" value={debtBalance} onChange={(e) => setDebtBalance(e.target.value)} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#F2F0EB", padding: "8px 12px", borderRadius: "6px", fontSize: "13px", fontFamily: "'Inter', sans-serif" }} />
                <input type="number" placeholder="Minimum payment" value={debtMinPayment} onChange={(e) => setDebtMinPayment(e.target.value)} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#F2F0EB", padding: "8px 12px", borderRadius: "6px", fontSize: "13px", fontFamily: "'Inter', sans-serif" }} />
                <input type="number" placeholder="Interest rate (e.g. 24.99)" value={debtInterestRate} onChange={(e) => setDebtInterestRate(e.target.value)} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#F2F0EB", padding: "8px 12px", borderRadius: "6px", fontSize: "13px", fontFamily: "'Inter', sans-serif" }} />
              </div>
              <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
                <button onClick={addDebt} disabled={isSaving} style={{ background: isSaving ? "#4a4470" : "#6C63FF", border: "none", color: "#F0F6FC", padding: "8px 16px", borderRadius: "6px", cursor: isSaving ? "not-allowed" : "pointer", fontSize: "13px", fontWeight: "600", fontFamily: "'Inter', sans-serif" }}>{isSaving ? "Saving..." : "Add Debt"}</button>
                <button onClick={() => setShowDebtForm(false)} style={{ background: "none", border: "1px solid rgba(255,255,255,0.1)", color: "#8B8FA8", padding: "8px 16px", borderRadius: "6px", cursor: "pointer", fontSize: "13px", fontFamily: "'Inter', sans-serif" }}>Cancel</button>
              </div>
            </div>
          )}

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
                      <div className="form-grid">
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
                          disabled={isSaving}
                          style={{
                            background: isSaving ? "#4a4470" : "#6C63FF",
                            border: "none",
                            color: "#F0F6FC",
                            padding: "8px 16px",
                            borderRadius: "6px",
                            cursor: isSaving ? "not-allowed" : "pointer",
                            fontSize: "13px",
                            fontWeight: "600",
                            fontFamily: "'Inter', sans-serif",
                          }}
                        >
                          {isSaving ? "Saving..." : "Save Changes"}
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
              <div className="form-grid">
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
                {plaidConnected ? (
                  <div style={{ fontSize: "12px", color: "#6C63FF", padding: "8px 0", fontFamily: "'Inter', sans-serif" }}>
                    Balance will be set automatically by Plaid on next sync.
                  </div>
                ) : (
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
                )}
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
                  <div style={{ fontSize: "11px", color: "#8B8FA8", marginTop: "2px", gridColumn: "1 / -1" }}>
                    Any accounts marked Primary are combined to calculate your available funds.
                  </div>
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
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                {plaidConnected && (
                  <button
                    onClick={() => syncPlaidBalances(household?.id)}
                    disabled={plaidSyncing}
                    style={{ background: "none", border: "none", color: plaidSyncing ? "#5C6080" : "#6C63FF", cursor: plaidSyncing ? "default" : "pointer", fontSize: "12px", fontWeight: "600", fontFamily: "'Inter', sans-serif", padding: 0 }}
                  >
                    {plaidSyncing ? "Syncing..." : plaidLastSynced ? `Synced ${plaidLastSynced.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "Sync Balances"}
                  </button>
                )}
                <div className="panel-count">{accounts.length} total</div>
              </div>
            </div>
            {accounts.length === 0 ? (
              <div className="empty-state">No accounts added yet</div>
            ) : (
              [...accounts].sort((a, b) => a.name.localeCompare(b.name)).map((acct, i) => (
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
                      {!plaidConnected && quickEditAccountId === acct.id ? (
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
                        <div style={{ textAlign: "right" }}>
                          <div
                            className="row-amount"
                            onClick={() => {
                              if (plaidConnected) return;
                              setQuickEditAccountId(acct.id);
                              setQuickEditBalance(acct.current_balance ?? "");
                            }}
                            style={{ cursor: plaidConnected ? "default" : "pointer" }}
                            title={plaidConnected ? "" : "Click to edit"}
                          >
                            ${fmt(acct.current_balance)}
                          </div>
                          {plaidConnected && (
                            <div style={{ fontSize: "10px", color: "#6C63FF", marginTop: "2px" }}>via Plaid</div>
                          )}
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
                      <div className="form-grid">
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
                        {plaidConnected && (
                          <div style={{ fontSize: "12px", color: "#6C63FF", padding: "8px 0", fontFamily: "'Inter', sans-serif" }}>
                            Balance is managed by Plaid — sync to update.
                          </div>
                        )}
                        {!plaidConnected && <input
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
                        />}
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
                          <div style={{ fontSize: "11px", color: "#8B8FA8", marginTop: "2px", gridColumn: "1 / -1" }}>
                            Any accounts marked Primary are combined to calculate your available funds.
                          </div>
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
                          disabled={isSaving}
                          style={{
                            background: isSaving ? "#4a4470" : "#6C63FF",
                            border: "none",
                            color: "#F0F6FC",
                            padding: "8px 16px",
                            borderRadius: "6px",
                            cursor: isSaving ? "not-allowed" : "pointer",
                            fontSize: "13px",
                            fontWeight: "600",
                            fontFamily: "'Inter', sans-serif",
                          }}
                        >
                          {isSaving ? "Saving..." : "Save Changes"}
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

          {plaidReconnectNeeded && (
            <div style={{ marginTop: "12px", padding: "10px 12px", background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.3)", borderRadius: "8px" }}>
              <div style={{ fontSize: "12px", color: "#FBBF24", marginBottom: "8px", fontFamily: "'Inter', sans-serif" }}>
                ⚠️ Your bank connection has expired. Please reconnect to resume syncing.
              </div>
              <PlaidConnectButton userId={userId} updateMode={true} onSuccess={() => { setPlaidReconnectNeeded(false); setPlaidConnected(true); if (household?.id) syncPlaidBalances(household.id); }} />
            </div>
          )}
          {!plaidConnected && !plaidReconnectNeeded && (
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "12px" }}>
              <PlaidConnectButton userId={userId} onSuccess={() => { if (household?.id) syncPlaidBalances(household.id); }} />
            </div>
          )}
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
              <div className="form-grid">
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
                  disabled={isSaving}
                  style={{ background: isSaving ? "#4a4470" : "#6C63FF", border: "none", color: "#F0F6FC", padding: "8px 16px", borderRadius: "6px", cursor: isSaving ? "not-allowed" : "pointer", fontSize: "13px", fontWeight: "600", fontFamily: "'Inter', sans-serif" }}
                >
                  {isSaving ? "Saving..." : "Add Income"}
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

          {(() => {
            const monthlyIncomeTotal = income
              .filter(i => i.is_active !== false && i.fixed_amount)
              .reduce((sum, i) => {
                const amt = i.fixed_amount || 0;
                if (i.frequency === "weekly") return sum + amt * (52 / 12);
                if (i.frequency === "biweekly") return sum + amt * (26 / 12);
                return sum + amt;
              }, 0);
            return (
              <div style={{ marginBottom: "16px" }}>
                <div className="panel" style={{ margin: 0 }}>
                  <div style={{ fontSize: "11px", color: "#8B8FA8", fontFamily: "'Inter', sans-serif", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Total Monthly Income</div>
                  <div style={{ fontSize: "22px", fontFamily: "'DM Mono', monospace", color: "#4ADE80", fontWeight: "600" }}>${fmt(monthlyIncomeTotal)}</div>
                  <div style={{ fontSize: "11px", color: "#8B8FA8", fontFamily: "'Inter', sans-serif", marginTop: "4px" }}>est. per month across all sources</div>
                </div>
              </div>
            );
          })()}

          <div className="panel">
            <div className="panel-header">
              <div className="panel-title">Income Sources</div>
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
                            onChange={(e) => setQuickEditIncomeAmount(e.target.value)}
                            onBlur={() => updateIncomeAmount(inc.id, quickEditIncomeAmount)}
                            onKeyDown={(e) => { if (e.key === "Enter") updateIncomeAmount(inc.id, quickEditIncomeAmount); if (e.key === "Escape") setQuickEditIncomeId(null); }}
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
                        <div className="form-grid">
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
                            disabled={isSaving}
                            style={{
                              background: isSaving ? "#4a4470" : "#6C63FF",
                              border: "none",
                              color: "#F0F6FC",
                              padding: "8px 16px",
                              borderRadius: "6px",
                              cursor: isSaving ? "not-allowed" : "pointer",
                              fontSize: "13px",
                              fontWeight: "600",
                              fontFamily: "'Inter', sans-serif",
                            }}
                          >
                            {isSaving ? "Saving..." : "Save Changes"}
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
                setPaymentMethod("");
                setBillCategory("");
                setBillOwner("joint");
                setBillAccountId("");
                setIsVariable(false);
                setBillFrequency("");
                setBillDueDay2("");
                setIsBillAccumulating(false);
                setTransferToAccountId("");
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
              <div className="form-grid">
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
                <select
                  value={billFrequency}
                  onChange={(e) => { setBillFrequency(e.target.value); if (e.target.value !== "semi-monthly") setBillDueDay2(""); }}
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#F2F0EB", padding: "8px 12px", borderRadius: "6px", fontSize: "13px", fontFamily: "'Inter', sans-serif" }}
                >
                  <option value="" disabled>Frequency</option>
                  <option value="monthly">Monthly</option>
                  <option value="semi-monthly">Semi-monthly (2 due dates)</option>
                  <option value="biweekly">Biweekly</option>
                  <option value="payday">Every Pay Day</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="annually">Annually</option>
                </select>
                {(billFrequency || "monthly") !== "payday" && (
                  <input
                    type="number"
                    placeholder={(billFrequency || "monthly") === "semi-monthly" ? "1st due day" : "Due day of month"}
                    value={dueDay}
                    onChange={(e) => setDueDay(e.target.value)}
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#F2F0EB", padding: "8px 12px", borderRadius: "6px", fontSize: "13px", fontFamily: "'Inter', sans-serif" }}
                  />
                )}
                {billFrequency === "semi-monthly" && (
                  <input
                    type="number"
                    placeholder="2nd due day"
                    value={billDueDay2}
                    onChange={(e) => setBillDueDay2(e.target.value)}
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#F2F0EB", padding: "8px 12px", borderRadius: "6px", fontSize: "13px", fontFamily: "'Inter', sans-serif" }}
                  />
                )}
                {(billFrequency === "quarterly" || billFrequency === "annually") && (
                  <select
                    value={billDueMonth}
                    onChange={(e) => setBillDueMonth(e.target.value)}
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#F2F0EB", padding: "8px 12px", borderRadius: "6px", fontSize: "13px", fontFamily: "'Inter', sans-serif" }}
                  >
                    <option value="" disabled>{billFrequency === "quarterly" ? "First due month" : "Due month"}</option>
                    {["January","February","March","April","May","June","July","August","September","October","November","December"].map((m, i) => (
                      <option key={i} value={i + 1}>{m}</option>
                    ))}
                  </select>
                )}
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#F2F0EB", padding: "8px 12px", borderRadius: "6px", fontSize: "13px", fontFamily: "'Inter', sans-serif" }}
                >
                  <option value="" disabled>Payment method</option>
                  <option value="auto">Auto</option>
                  <option value="transfer">Transfer</option>
                  <option value="zelle">Zelle</option>
                  <option value="cashapp">Cash App</option>
                  <option value="applepay">Apple Pay</option>
                  <option value="venmo">Venmo</option>
                  <option value="check">Check</option>
                  <option value="manual">Manual</option>
                </select>
                <select
                  value={billCategory}
                  onChange={(e) => setBillCategory(e.target.value)}
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#F2F0EB", padding: "8px 12px", borderRadius: "6px", fontSize: "13px", fontFamily: "'Inter', sans-serif" }}
                >
                  <option value="">Select category</option>
                  {(categories.length > 0 ? categories : DEFAULT_CATEGORIES).map((cat, i) => (
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
              {billFormError && (
                <div style={{ fontSize: "13px", color: "#F87171", background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: "6px", padding: "8px 12px", marginTop: "8px" }}>
                  {billFormError}
                </div>
              )}
              <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
                <button
                  onClick={addBill}
                  disabled={isSaving}
                  style={{ background: isSaving ? "#4a4470" : "#6C63FF", border: "none", color: "#F0F6FC", padding: "8px 16px", borderRadius: "6px", cursor: isSaving ? "not-allowed" : "pointer", fontSize: "13px", fontWeight: "600", fontFamily: "'Inter', sans-serif" }}
                >
                  {isSaving ? "Saving..." : "Add Bill"}
                </button>
                <button
                  onClick={() => { setShowBillForm(false); setBillFormError(""); }}
                  style={{ background: "none", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)", padding: "8px 16px", borderRadius: "6px", cursor: "pointer", fontSize: "13px", fontFamily: "'Inter', sans-serif" }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {(() => {
            const monthlyBillsTotal = bills
              .filter(b => b.is_active !== false)
              .reduce((sum, b) => {
                const f = b.frequency || "monthly";
                if (f === "monthly") return sum + (b.amount || 0);
                if (f === "semi-monthly") return sum + (b.amount || 0) * 2;
                if (f === "biweekly" || f === "payday") return sum + (b.amount || 0) * 2;
                return sum;
              }, 0);
            return (
              <div style={{ display: "flex", gap: "12px", marginBottom: "16px", flexWrap: "wrap" }}>
                <div className="panel" style={{ flex: "1", minWidth: "160px", margin: 0 }}>
                  <div style={{ fontSize: "11px", color: "#8B8FA8", fontFamily: "'Inter', sans-serif", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Monthly Bills</div>
                  <div style={{ fontSize: "22px", fontFamily: "'DM Mono', monospace", color: "#F0F6FC", fontWeight: "600" }}>${fmt(monthlyBillsTotal)}</div>
                  <div style={{ fontSize: "11px", color: "#8B8FA8", fontFamily: "'Inter', sans-serif", marginTop: "4px" }}>est. total per month</div>
                </div>
                <div className="panel" style={{ flex: "1", minWidth: "160px", margin: 0 }}>
                  <div style={{ fontSize: "11px", color: "#8B8FA8", fontFamily: "'Inter', sans-serif", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Bills Remaining</div>
                  <div style={{ fontSize: "22px", fontFamily: "'DM Mono', monospace", color: "#F87171", fontWeight: "600" }}>
                    ${fmt(bills.filter(b => b.is_active !== false && isBillDue(b)).reduce((sum, b) => sum + (b.amount || 0), 0))}
                  </div>
                  <div style={{ fontSize: "11px", color: "#8B8FA8", fontFamily: "'Inter', sans-serif", marginTop: "4px" }}>still owed this month</div>
                </div>
              </div>
            );
          })()}

          <div className="panel">
            <div className="panel-header">
              <div className="panel-title">All Bills</div>
              <div className="panel-count">{bills.length} total</div>
            </div>
            {bills.length === 0 ? (
              <div className="empty-state">No bills added yet</div>
            ) : (
              [...bills]
                .sort((a, b) => {
                  const aPaid = !isBillDue(a) ? 1 : 0;
                  const bPaid = !isBillDue(b) ? 1 : 0;
                  if (aPaid !== bPaid) return aPaid - bPaid;
                  return a.name.localeCompare(b.name);
                })
                .map((bill, i) => (
                  <div key={i}>
                    <div className="row-item">
                      <div>
                        <div
                          className="row-name"
                          style={{
                            color: !isBillDue(bill) ? "#8B8FA8" : "#F0F6FC",
                            textDecoration: !isBillDue(bill) ? "line-through" : "none",
                          }}
                        >
                          {bill.name}
                        </div>
                        <div className="row-sub">
                          {(() => {
                            const remaining = (bill.amount || 0) - (bill.paid_amount || 0);
                            const hasPartial = isBillDue(bill) && (bill.paid_amount || 0) > 0 && remaining > 0;
                            if (hasPartial) return `$${fmt(bill.paid_amount)} paid · $${fmt(remaining)} remaining`;
                            const freq = bill.frequency || "monthly";
                            const dueStr = freq === "payday" ? "Every Pay Day"
                              : freq === "biweekly" ? "Biweekly"
                              : freq === "quarterly" ? "Quarterly"
                              : freq === "annually" ? "Annually"
                              : freq === "semi-monthly" && bill.due_day_2
                                ? `Due the ${bill.due_day}${getSuffix(bill.due_day)} & ${bill.due_day_2}${getSuffix(bill.due_day_2)}`
                                : `Due the ${bill.due_day}${getSuffix(bill.due_day)}`;
                            return `${dueStr} · ${bill.category} · ${bill.payment_method}${!isBillDue(bill) ? " · PAID" : ""}`;
                          })()}
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                        {/* Amount */}
                        <div style={{ minWidth: "70px", textAlign: "right", flexShrink: 0 }}>
                          {quickEditBillId === bill.id ? (
                            <input
                              type="number"
                              value={quickEditBillAmount}
                              onChange={(e) => setQuickEditBillAmount(e.target.value)}
                              onBlur={() => updateBillAmount(bill.id, quickEditBillAmount)}
                              onKeyDown={(e) => { if (e.key === "Enter") updateBillAmount(bill.id, quickEditBillAmount); if (e.key === "Escape") setQuickEditBillId(null); }}
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
                              onClick={() => { setQuickEditBillId(bill.id); setQuickEditBillAmount(bill.amount ?? ""); }}
                              style={{ cursor: "pointer" }}
                              title="Click to edit"
                            >
                              ${fmt(bill.amount)}
                            </div>
                          )}
                        </div>

                        {/* Edit + Delete column */}
                        <div style={{ display: "flex", gap: "4px", justifyContent: "flex-end", flexShrink: 0 }}>
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
                                setBillFrequency(bill.frequency || "monthly");
                                setBillDueDay2(bill.due_day_2 || "");
                                setBillDueMonth(bill.due_month || "");
                              }
                            }}
                            style={{ background: "none", border: "1px solid rgba(255,255,255,0.15)", color: "#8B8FA8", padding: "4px 10px", borderRadius: "6px", cursor: "pointer", fontSize: "11px", fontFamily: "'Inter', sans-serif", whiteSpace: "nowrap" }}
                          >
                            {editingBill?.id === bill.id ? "Cancel" : "Edit"}
                          </button>
                          {confirmDeleteBillId === bill.id ? (
                            <>
                              <button
                                onClick={() => { deleteBill(bill.id); setConfirmDeleteBillId(null); setEditingBill(null); }}
                                style={{ background: "none", border: "1px solid #F87171", color: "#F87171", padding: "4px 10px", borderRadius: "6px", cursor: "pointer", fontSize: "11px", fontFamily: "'Inter', sans-serif", whiteSpace: "nowrap" }}
                              >
                                Confirm
                              </button>
                              <button
                                onClick={() => setConfirmDeleteBillId(null)}
                                style={{ background: "none", border: "1px solid rgba(255,255,255,0.1)", color: "#8B8FA8", padding: "4px 10px", borderRadius: "6px", cursor: "pointer", fontSize: "11px", fontFamily: "'Inter', sans-serif", whiteSpace: "nowrap" }}
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => setConfirmDeleteBillId(bill.id)}
                              style={{ background: "none", border: "1px solid rgba(255,255,255,0.1)", color: "#F87171", padding: "4px 10px", borderRadius: "6px", cursor: "pointer", fontSize: "11px", fontFamily: "'Inter', sans-serif", whiteSpace: "nowrap" }}
                            >
                              Delete
                            </button>
                          )}
                        </div>
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
                        <div className="form-grid">
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
                          <select
                            value={billFrequency}
                            onChange={(e) => { setBillFrequency(e.target.value); if (e.target.value !== "semi-monthly") setBillDueDay2(""); }}
                            style={{ background: "#2D2B45", border: "1px solid rgba(255,255,255,0.1)", color: "#F0F6FC", padding: "8px 12px", borderRadius: "6px", fontSize: "13px", fontFamily: "'Inter', sans-serif" }}
                          >
                            <option value="" disabled>Frequency</option>
                            <option value="monthly">Monthly</option>
                            <option value="semi-monthly">Semi-monthly (2 due dates)</option>
                            <option value="biweekly">Biweekly</option>
                            <option value="payday">Every Pay Day</option>
                            <option value="quarterly">Quarterly</option>
                            <option value="annually">Annually</option>
                          </select>
                          {(billFrequency || "monthly") !== "payday" && (
                            <input
                              type="number"
                              placeholder={(billFrequency || "monthly") === "semi-monthly" ? "1st due day" : "Due day of month"}
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
                          )}
                          {billFrequency === "semi-monthly" && (
                            <input
                              type="number"
                              placeholder="2nd due day"
                              value={billDueDay2}
                              onChange={(e) => setBillDueDay2(e.target.value)}
                              style={{ background: "#2D2B45", border: "1px solid rgba(255,255,255,0.1)", color: "#F0F6FC", padding: "8px 12px", borderRadius: "6px", fontSize: "13px", fontFamily: "'Inter', sans-serif" }}
                            />
                          )}
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
                            <option value="" disabled>Payment method</option>
                            <option value="auto">Auto</option>
                            <option value="transfer">Transfer</option>
                            <option value="zelle">Zelle</option>
                            <option value="cashapp">Cash App</option>
                            <option value="applepay">Apple Pay</option>
                            <option value="venmo">Venmo</option>
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
                            {(categories.length > 0 ? categories : DEFAULT_CATEGORIES).map((cat, i) => (
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
                            disabled={isSaving}
                            style={{
                              background: isSaving ? "#4a4470" : "#6C63FF",
                              border: "none",
                              color: "#F0F6FC",
                              padding: "8px 16px",
                              borderRadius: "6px",
                              cursor: isSaving ? "not-allowed" : "pointer",
                              fontSize: "13px",
                              fontWeight: "600",
                              fontFamily: "'Inter', sans-serif",
                            }}
                          >
                            {isSaving ? "Saving..." : "Save Changes"}
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

    return null;
  }

  function renderSidePanel() {
    return (
      <div className="dashboard-right">
              <div className="panel">
                <div className="panel-header">
                  <div className="panel-title">Accounts</div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    {plaidConnected && (
                      <button
                        onClick={() => syncPlaidBalances(household?.id)}
                        disabled={plaidSyncing}
                        style={{ background: "none", border: "none", color: plaidSyncing ? "#5C6080" : "#6C63FF", cursor: plaidSyncing ? "default" : "pointer", fontSize: "12px", fontWeight: "600", fontFamily: "'Inter', sans-serif", padding: 0 }}
                      >
                        {plaidSyncing ? "Syncing..." : plaidLastSynced ? `Synced ${plaidLastSynced.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "Sync"}
                      </button>
                    )}
                    <div className="panel-count">{accounts.length} total</div>
                  </div>
                </div>
                {accounts.length === 0 ? (
                  <div className="empty-state">No accounts added yet</div>
                ) : (
                  [...accounts].sort((a, b) => a.name.localeCompare(b.name)).map((acct, i) => (
                    <div className="row-item" key={i}>
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

                      {!plaidConnected && quickEditAccountId === acct.id ? (
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
                        <div style={{ textAlign: "right" }}>
                          <div
                            className="row-amount"
                            onClick={() => {
                              if (plaidConnected) return;
                              setQuickEditAccountId(acct.id);
                              setQuickEditBalance(acct.current_balance ?? "");
                            }}
                            style={{ cursor: plaidConnected ? "default" : "pointer" }}
                            title={plaidConnected ? "" : "Click to edit"}
                          >
                            ${fmt(acct.current_balance)}
                          </div>
                          {plaidConnected && (
                            <div style={{ fontSize: "10px", color: "#6C63FF", marginTop: "2px" }}>via Plaid</div>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
                {plaidReconnectNeeded && (
                  <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                    <div style={{ fontSize: "12px", color: "#FBBF24", marginBottom: "8px", fontFamily: "'Inter', sans-serif" }}>
                      ⚠️ Your bank connection has expired. Please reconnect to resume syncing.
                    </div>
                    <PlaidConnectButton userId={userId} updateMode={true} onSuccess={() => { setPlaidReconnectNeeded(false); setPlaidConnected(true); if (household?.id) syncPlaidBalances(household.id); }} />
                  </div>
                )}
                {!plaidConnected && !plaidReconnectNeeded && (
                  <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                    <PlaidConnectButton userId={userId} onSuccess={() => { setPlaidConnected(true); if (household?.id) syncPlaidBalances(household.id); }} />
                  </div>
                )}
              </div>
              <div className="panel">
                <div className="panel-header">
                  <div className="panel-title">Where the Money Goes</div>
                  <div className="panel-count">{(() => {
                    const bd = getPayPeriodBreakdown().find(i => i.isCurrentPeriod);
                    const nxt = bd?.incomeItems
                      .map(inc => inc.actualPayDate ? new Date(inc.actualPayDate + "T00:00:00") : null)
                      .filter(d => d && d > new Date())
                      .sort((a, b) => a - b)[0];
                    return nxt ? `Until ${fmtDate(nxt.toISOString().split("T")[0])}` : "This pay period";
                  })()}</div>
                </div>
                {(() => {
                  const currentBreakdown = getPayPeriodBreakdown().find(
                    (item) => item.isCurrentPeriod,
                  );

                  // Split bills into regular bills and explicit account transfers
                  const allPeriodBills = currentBreakdown?.bills || [];
                  const wtmgPStart = currentBreakdown ? new Date(currentBreakdown.period.start_date + "T00:00:00") : null;
                  const wtmgPEnd = currentBreakdown ? new Date(currentBreakdown.period.end_date + "T23:59:59") : null;
                  const wtmgPeriodKey = currentBreakdown?.period.start_date;

                  // Find the next income date in this period that hasn't arrived yet.
                  // Bills due before that date are what the current paycheck needs to cover.
                  // If no future income, show all remaining bills (last paycheck of the period).
                  const wtmgToday = new Date();
                  const nextIncomeDate = currentBreakdown?.incomeItems
                    .filter(inc => !earlyPayments.has(`${inc.id}-${wtmgPeriodKey}`))
                    .map(inc => inc.actualPayDate ? new Date(inc.actualPayDate + "T00:00:00") : null)
                    .filter(d => d && d > wtmgToday)
                    .sort((a, b) => a - b)[0] || null;

                  // Exclude bills already paid this period or skipped this period.
                  // Also exclude bills whose due date falls on or after the next income date.
                  const periodBills = allPeriodBills.filter((b) => {
                    if (skippedBillPeriods.has(`${b.id}-${wtmgPeriodKey}`)) return false;
                    if (wtmgPeriodKey && isBillPaidInPeriod(b.id, wtmgPeriodKey)) return false;
                    if (nextIncomeDate) {
                      const freq = b.frequency || "monthly";
                      if (freq === "payday" || freq === "biweekly") return true; // payday bills always go with current check
                      const dueDate = new Date(wtmgPStart.getFullYear(), wtmgPStart.getMonth(), b.due_day);
                      if (dueDate < wtmgPStart) dueDate.setMonth(dueDate.getMonth() + 1);
                      if (dueDate >= nextIncomeDate) return false;
                    }
                    return true;
                  });

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

                  const renderTransferRow = (rowKey, label, suggestedAmount, subtitle, targetAccountId = null) => {
                    const transferred = transfers[rowKey] || 0;
                    const remaining = Math.max(0, suggestedAmount - transferred);
                    const done = transferred >= suggestedAmount;

                    const undoTransfer = async () => {
                      const today = localDateStr();
                      const currentPeriod = payPeriods.find(p => p.start_date <= today && p.end_date >= today);
                      const periodKey = currentPeriod?.start_date || today;
                      await supabase.from("period_transfers")
                        .delete()
                        .eq("user_id", userId)
                        .eq("period_start", periodKey)
                        .eq("row_key", rowKey);
                      setTransfers(prev => {
                        const next = { ...prev };
                        delete next[rowKey];
                        return next;
                      });
                    };

                    return (
                      <div key={rowKey} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", padding: "10px 0" }}>
                        {/* Main row */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div>
                            <div className="row-name" style={{ color: done ? "#4ADE80" : "#F0F6FC" }}>
                              {done ? "✓ " : ""}{label}
                            </div>
                            {subtitle && <div className="row-sub">{subtitle}</div>}
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            {!done && (
                              <div style={{ textAlign: "right" }}>
                                <div className="row-amount" style={{ color: transferred > 0 ? "#6C63FF" : "#F0F6FC" }}>
                                  ${fmt(remaining)}
                                </div>
                                <div style={{ fontSize: "10px", color: "#8B8FA8" }}>remaining</div>
                              </div>
                            )}
                            {!done && transferringId === rowKey ? (
                              <>
                                <input
                                  type="number"
                                  value={transferAmount}
                                  onChange={(e) => setTransferAmount(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") confirmTransfer(rowKey, transferAmount, targetAccountId);
                                    if (e.key === "Escape") { setTransferringId(null); setTransferAmount(""); }
                                  }}
                                  autoFocus
                                  onFocus={(e) => e.target.select()}
                                  style={{ background: "#2D2B45", border: "1px solid #6C63FF", color: "#F0F6FC", padding: "4px 8px", borderRadius: "6px", fontSize: "13px", fontFamily: "'DM Mono', monospace", width: "90px", textAlign: "right" }}
                                />
                                <button
                                  onClick={() => confirmTransfer(rowKey, transferAmount, targetAccountId)}
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
                              <div style={{ display: "flex", gap: "6px" }}>
                                <button
                                  onClick={() => confirmTransfer(rowKey, remaining, targetAccountId)}
                                  style={{ background: "rgba(0,212,170,0.1)", border: "1px solid rgba(0,212,170,0.4)", color: "#00D4AA", padding: "4px 10px", borderRadius: "6px", cursor: "pointer", fontSize: "11px", fontFamily: "'Inter', sans-serif", fontWeight: "500" }}
                                >
                                  Transfer
                                </button>
                                <button
                                  onClick={() => { setTransferringId(rowKey); setTransferAmount(""); }}
                                  style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.3)", color: "#FBBF24", padding: "4px 10px", borderRadius: "6px", cursor: "pointer", fontSize: "11px", fontFamily: "'Inter', sans-serif", fontWeight: "500" }}
                                >
                                  Partial
                                </button>
                              </div>
                            ) : done ? (
                              <button
                                onClick={undoTransfer}
                                style={{ background: "none", border: "1px solid rgba(255,255,255,0.1)", color: "#8B8FA8", padding: "4px 10px", borderRadius: "6px", cursor: "pointer", fontSize: "11px", fontFamily: "'Inter', sans-serif" }}
                              >
                                Undo
                              </button>
                            ) : null}
                          </div>
                        </div>
                        {/* Partial transfer info row */}
                        {transferred > 0 && !done && (
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "6px" }}>
                            <div style={{ fontSize: "10px", color: "#6C63FF" }}>
                              ${fmt(transferred)} transferred so far
                            </div>
                            <button
                              onClick={undoTransfer}
                              style={{ background: "none", border: "none", color: "#8B8FA8", cursor: "pointer", fontSize: "10px", fontFamily: "'Inter', sans-serif", padding: 0, textDecoration: "underline" }}
                            >
                              Undo
                            </button>
                          </div>
                        )}
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
                    return renderTransferRow(`transfer-${bill.id}`, bill.name, bill.amount, `Transfer to ${destName}`, bill.transfer_to_account_id);
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

                {/* Next period transfers — lets users record pre-funded transfers early */}
                {(() => {
                  const allBreakdown = getPayPeriodBreakdown();
                  const curIdx = allBreakdown.findIndex(i => i.isCurrentPeriod);
                  const nextBreakdown = curIdx >= 0 ? allBreakdown[curIdx + 1] : null;
                  if (!nextBreakdown) return null;

                  const nextPeriodKey = nextBreakdown.period.start_date;

                  // One number: the total to set aside for the upcoming period's bills. This
                  // mirrors what the End Balance subtracts (start + income - bills) so the two
                  // agree — every bill except those funded gradually through an accumulating
                  // account, and skipping anything already paid or skipped for that period.
                  const billsToTransfer = (nextBreakdown.bills || []).reduce((sum, bill) => {
                    if (skippedBillPeriods.has(`${bill.id}-${nextPeriodKey}`)) return sum;
                    if (isBillPaidInPeriod(bill.id, nextPeriodKey)) return sum;
                    if (bill.transfer_to_account_id) {
                      const dest = accounts.find(a => a.id === bill.transfer_to_account_id);
                      if (dest?.is_accumulating) return sum;
                      return sum + (bill.amount || 0);
                    }
                    const acct = accounts.find(a => a.id === bill.account_id);
                    if (acct?.is_accumulating) return sum;
                    return sum + (bill.amount || 0);
                  }, 0);
                  if (billsToTransfer <= 0) return null;

                  const rowKey = "next-bills-total";
                  const transferred = nextTransfers[rowKey] || 0;
                  const remaining = Math.max(0, billsToTransfer - transferred);
                  const done = transferred >= billsToTransfer;

                  return (
                    <div style={{ marginTop: "20px", paddingTop: "16px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                        <div style={{ fontSize: "10px", color: "#8B8FA8", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                          Next Period — {nextBreakdown.period.start_date.replace(/-/g, "/").slice(5)} to {nextBreakdown.period.end_date.replace(/-/g, "/").slice(5)}
                        </div>
                        <div style={{ fontSize: "10px", color: "#6C63FF", fontWeight: "600" }}>Pre-fund</div>
                      </div>
                      <div style={{ padding: "8px 0" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div className="row-name" style={{ color: done ? "#4ADE80" : "#F0F6FC" }}>
                            {done ? "✓ " : ""}Bills to transfer
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            {!done && transferringId === `next-${rowKey}` ? (
                              <>
                                <input
                                  type="number"
                                  value={transferAmount}
                                  onChange={e => setTransferAmount(e.target.value)}
                                  onKeyDown={e => {
                                    if (e.key === "Enter") confirmNextTransfer(rowKey, transferAmount, nextPeriodKey);
                                    if (e.key === "Escape") { setTransferringId(null); setTransferAmount(""); }
                                  }}
                                  placeholder={fmt(remaining)}
                                  autoFocus
                                  style={{ width: "80px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(108,99,255,0.4)", borderRadius: "6px", color: "#F0F6FC", fontFamily: "'DM Mono', monospace", fontSize: "12px", padding: "4px 8px", textAlign: "right" }}
                                />
                                <button onClick={() => confirmNextTransfer(rowKey, transferAmount, nextPeriodKey)} style={{ background: "rgba(108,99,255,0.15)", border: "1px solid rgba(108,99,255,0.3)", color: "#6C63FF", borderRadius: "6px", padding: "4px 10px", fontSize: "11px", fontWeight: "700", cursor: "pointer", fontFamily: "'Inter', sans-serif" }}>✓</button>
                                <button onClick={() => confirmNextTransfer(rowKey, remaining, nextPeriodKey)} style={{ background: "rgba(108,99,255,0.08)", border: "1px solid rgba(108,99,255,0.2)", color: "#6C63FF", borderRadius: "6px", padding: "4px 10px", fontSize: "11px", cursor: "pointer", fontFamily: "'Inter', sans-serif" }}>Full ${fmt(remaining)}</button>
                              </>
                            ) : done ? (
                              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "12px", color: "#4ADE80" }}>${fmt(billsToTransfer)}</span>
                                <button onClick={() => undoNextTransfer(rowKey, nextPeriodKey)} style={{ background: "none", border: "none", color: "#8B8FA8", cursor: "pointer", fontSize: "10px", fontFamily: "'Inter', sans-serif", textDecoration: "underline" }}>Undo</button>
                              </div>
                            ) : (
                              <button onClick={() => { setTransferringId(`next-${rowKey}`); setTransferAmount(""); }} style={{ background: "rgba(108,99,255,0.12)", border: "1px solid rgba(108,99,255,0.25)", color: "#6C63FF", borderRadius: "6px", padding: "4px 12px", fontSize: "11px", fontWeight: "600", cursor: "pointer", fontFamily: "'Inter', sans-serif" }}>
                                Transfer ${fmt(remaining)}
                              </button>
                            )}
                          </div>
                        </div>
                        {transferred > 0 && !done && (
                          <div style={{ fontSize: "10px", color: "#8B8FA8", marginTop: "4px" }}>${fmt(transferred)} of ${fmt(billsToTransfer)} transferred so far</div>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
    );
  }

  function renderDashboard() {
    return (
      <div className="content-area">
          <div style={{ fontSize: "11px", fontWeight: "700", color: "#6E7681", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "10px" }}>
            This Month
          </div>
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

          <div style={{ fontSize: "11px", fontWeight: "700", color: "#6E7681", letterSpacing: "0.1em", textTransform: "uppercase", margin: "24px 0 10px" }}>
            Pay Periods
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
                          {item.isCurrentPeriod ? "Available Funds" : "Left Over"}
                        </div>
                        <div
                          style={{
                            fontFamily: "'DM Mono', monospace",
                            fontSize: "22px",
                            fontWeight: "500",
                            color: item.isCurrentPeriod
                              ? "#6C63FF"
                              : item.leftOver < 0 ? "#F87171" : "#4ADE80",
                          }}
                        >
                          {item.isCurrentPeriod
                            ? "$" + fmt(accounts.filter((a) => a.is_primary && !a.is_accumulating).reduce((sum, a) => sum + (a.current_balance || 0), 0))
                            : (item.leftOver < 0 ? "-" : "") + "$" + fmt(Math.abs(item.leftOver))}
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
                          gridTemplateColumns: "1fr 1fr 1fr",
                          gap: "8px",
                          marginBottom: item.bills.length > 0 || item.contributions?.length > 0 ? "12px" : "0",
                        }}
                      >
                        <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: "8px", padding: "10px 12px" }}>
                          <div style={{ fontSize: "9px", color: "#8B8FA8", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "4px", fontWeight: "600" }}>
                            Income
                          </div>
                          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "16px", color: "#4ADE80" }}>
                            ${fmt(item.income)}
                          </div>
                        </div>
                        <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: "8px", padding: "10px 12px" }}>
                          <div style={{ fontSize: "9px", color: "#8B8FA8", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "4px", fontWeight: "600" }}>
                            Bills
                          </div>
                          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "16px", color: item.billsTotal > 0 ? "#F87171" : "#8B8FA8" }}>
                            ${fmt(item.billsTotal)}
                          </div>
                        </div>
                        <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: "8px", padding: "10px 12px" }}>
                          <div style={{ fontSize: "9px", color: "#8B8FA8", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "4px", fontWeight: "600" }}>
                            Left Over
                          </div>
                          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "16px", color: item.leftOver < 0 ? "#F87171" : "#4ADE80" }}>
                            {item.leftOver < 0 ? "-" : ""}${fmt(Math.abs(item.leftOver))}
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
                                        if (!plaidConnected) {
                                          const acct = accounts.find((a) => a.id === c.accountId);
                                          if (acct) {
                                            const newBalance = (acct.current_balance || 0) + c.amount;
                                            await supabase.from("accounts").update({ current_balance: newBalance }).eq("id", c.accountId);
                                            setAccounts((prev) => prev.map((a) => a.id === c.accountId ? { ...a, current_balance: newBalance } : a));
                                          }
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
                                <div style={{ fontSize: "13px", color: "#F0F6FC", fontWeight: "500" }}>
                                  {bill.name}
                                  {getBillPaidAmount(bill.id, item.period.start_date) > 0 && !isBillPaidInPeriod(bill.id, item.period.start_date) && <span style={{ fontSize: "9px", background: "rgba(251,191,36,0.15)", color: "#FBBF24", border: "1px solid rgba(251,191,36,0.3)", borderRadius: "4px", padding: "1px 6px", marginLeft: "7px", fontWeight: "600", letterSpacing: "0.06em", textTransform: "uppercase" }}>Partial</span>}
                                </div>
                                <div style={{ fontSize: "11px", color: "#8B8FA8", marginTop: "2px" }}>
                                  {getBillPaidAmount(bill.id, item.period.start_date) > 0 && !isBillPaidInPeriod(bill.id, item.period.start_date)
                                    ? `$${fmt(getBillPaidAmount(bill.id, item.period.start_date))} paid · $${fmt((bill.amount || 0) - getBillPaidAmount(bill.id, item.period.start_date))} remaining`
                                    : (bill.frequency || "monthly") === "payday" ? "Every Pay Day" : (bill.frequency || "monthly") === "biweekly" ? "Biweekly" : `Due the ${bill.due_day}${getSuffix(bill.due_day)}`}
                                </div>
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "13px", color: getBillPaidAmount(bill.id, item.period.start_date) > 0 && !isBillPaidInPeriod(bill.id, item.period.start_date) ? "#FBBF24" : "#8B8FA8" }}>
                                  ${fmt(getBillPaidAmount(bill.id, item.period.start_date) > 0 && !isBillPaidInPeriod(bill.id, item.period.start_date) ? (bill.amount - getBillPaidAmount(bill.id, item.period.start_date)) : bill.amount)}
                                </span>
                                {pendingPaidBill?._key === `${bill.id}-${item.period.start_date}` ? (
                                  <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                    <input type="text" inputMode="decimal" value={pendingPaidAmount} onChange={(e) => setPendingPaidAmount(e.target.value)} autoFocus placeholder="Amt paid" style={{ width: "90px", background: "#13111F", border: "1px solid rgba(108,99,255,0.4)", borderRadius: "5px", color: "#F0F6FC", padding: "3px 6px", fontSize: "11px", fontFamily: "'DM Mono', monospace", outline: "none" }} />
                                    <button onClick={() => { markBillPaid(pendingPaidBill, pendingPaidAmount, item.period.start_date); setPendingPaidBill(null); }} style={{ background: "rgba(74,222,128,0.15)", border: "1px solid rgba(74,222,128,0.4)", color: "#4ADE80", padding: "3px 8px", borderRadius: "5px", cursor: "pointer", fontSize: "11px", fontFamily: "'Inter', sans-serif", fontWeight: "600" }}>✓</button>
                                    <button onClick={() => setPendingPaidBill(null)} style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)", color: "#F87171", padding: "3px 8px", borderRadius: "5px", cursor: "pointer", fontSize: "11px", fontFamily: "'Inter', sans-serif" }}>✕</button>
                                  </div>
                                ) : (
                                  <div style={{ display: "flex", gap: "4px" }}>
                                    <button onClick={() => markBillPaid(bill, bill.amount, item.period.start_date)} style={{ background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.3)", color: "#4ADE80", padding: "3px 10px", borderRadius: "5px", cursor: "pointer", fontSize: "11px", fontFamily: "'Inter', sans-serif", fontWeight: "500" }}>Paid</button>
                                    <button onClick={() => { setPendingPaidBill({ ...bill, _key: `${bill.id}-${item.period.start_date}` }); setPendingPaidAmount(""); }} style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.3)", color: "#FBBF24", padding: "3px 10px", borderRadius: "5px", cursor: "pointer", fontSize: "11px", fontFamily: "'Inter', sans-serif" }}>{getBillPaidAmount(bill.id, item.period.start_date) > 0 && !isBillPaidInPeriod(bill.id, item.period.start_date) ? "More" : "Partial"}</button>
                                  </div>
                                )}
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

            {renderSidePanel()}
          </div>
        </div>
    );
  }

  return (
    <div className="app-shell">
      <style>{css}</style>

      <aside className="sidebar">
        <div
          className="sidebar-logo"
          role="button"
          tabIndex={0}
          onClick={() => navigate("dashboard")}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); navigate("dashboard"); } }}
          style={{ cursor: "pointer" }}
        >
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
            { key: "monthly", label: "Monthly Overview", icon: <BarChart2 size={16} /> },
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
            <div
              role="button"
              tabIndex={0}
              onClick={() => navigate("dashboard")}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); navigate("dashboard"); } }}
              style={{ fontSize: "18px", fontWeight: "900", letterSpacing: "0.1em", color: "#F0F6FC", textTransform: "uppercase", cursor: "pointer" }}
            >
              Stryde
            </div>
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

          {/* Desktop: period badge + refresh */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div className="period-badge topbar-period">
              <div className="period-label">Current Pay Period</div>
              {currentPeriod ? (
                <div className="period-dates">{fmtDate(currentPeriod.start_date)} — {fmtDate(currentPeriod.end_date)}</div>
              ) : (
                <div className="period-label" style={{ color: "#8B8FA8" }}>No active period</div>
              )}
            </div>
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
          <div
            className="mobile-nav-drawer-logo"
            role="button"
            tabIndex={0}
            onClick={() => { navigate("dashboard"); setMobileMenuOpen(false); }}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); navigate("dashboard"); setMobileMenuOpen(false); } }}
            style={{ cursor: "pointer" }}
          >
            Stryde
          </div>
          <button className="mobile-nav-close" onClick={() => setMobileMenuOpen(false)}>
            <X size={20} />
          </button>
        </div>
        <nav className="mobile-nav-drawer-nav">
          <div className="nav-label">Main</div>
          {[
            { key: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={16} /> },
            { key: "monthly", label: "Monthly Overview", icon: <BarChart2 size={16} /> },
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
          ].map((item) => (
            <button key={item.key} className={`nav-item ${activeNav === item.key ? "active" : ""}`} onClick={() => { navigate(item.key); setMobileMenuOpen(false); }}>
              {item.icon}{item.label}
            </button>
          ))}
          <button className="nav-item" onClick={() => { setScrollToInvite(true); navigate("settings"); setMobileMenuOpen(false); }}>
            <UserPlus size={16} />Invite Member
          </button>
          <button className={`nav-item ${activeNav === "settings" ? "active" : ""}`} onClick={() => { navigate("settings"); setMobileMenuOpen(false); }}>
            <Settings size={16} />Settings
          </button>
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
