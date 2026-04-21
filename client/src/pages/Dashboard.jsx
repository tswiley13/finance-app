import { useState, useEffect } from "react";
import { supabase } from "../supabase";

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&family=DM+Mono:wght@400;500&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #0F1218; color: #E8E6E1; font-family: 'DM Sans', sans-serif; }

  .app-shell { display: flex; min-height: 100vh; }

  .sidebar { width: 220px; flex-shrink: 0; background: #161B26; border-right: 1px solid #2D3748; display: flex; flex-direction: column; padding: 28px 0; position: fixed; top: 0; left: 0; bottom: 0; }

  .sidebar-logo { padding: 0 24px 32px; border-bottom: 1px solid #2D3748; }
  .logo-text { font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 800; letter-spacing: 0.12em; color: #E8E6E1; text-transform: uppercase; }
  .logo-tag { font-size: 10px; color: #E8B84B; letter-spacing: 0.25em; text-transform: uppercase; margin-top: 3px; font-weight: 300; }

  .nav { padding: 24px 12px; flex: 1; display: flex; flex-direction: column; gap: 2px; }
  .nav-label { font-size: 10px; color: #4A5568; letter-spacing: 0.2em; text-transform: uppercase; padding: 0 12px; margin: 12px 0 6px; font-weight: 500; }
  .nav-item { display: flex; align-items: center; gap: 10px; padding: 9px 12px; border-radius: 8px; cursor: pointer; font-size: 13px; color: #8892A4; font-weight: 400; transition: all 0.15s ease; border: none; background: none; width: 100%; text-align: left; font-family: 'DM Sans', sans-serif; }
  .nav-item:hover { background: #1E2736; color: #CBD5E0; }
  .nav-item.active { background: #1E2736; color: #E8E6E1; font-weight: 500; }
  .nav-dot { width: 6px; height: 6px; border-radius: 50%; background: #E8B84B; flex-shrink: 0; }
  .nav-dot-muted { width: 6px; height: 6px; border-radius: 50%; background: #4A5568; flex-shrink: 0; }

  .sidebar-footer { padding: 20px 12px 0; border-top: 1px solid #2D3748; }
  .signout-btn { display: flex; align-items: center; gap: 10px; padding: 9px 12px; border-radius: 8px; cursor: pointer; font-size: 13px; color: #8892A4; border: none; background: none; width: 100%; text-align: left; font-family: 'DM Sans', sans-serif; transition: all 0.15s ease; }
  .signout-btn:hover { background: #1E2736; color: #CBD5E0; }

  .main { margin-left: 220px; flex: 1; padding: 40px 40px 60px; max-width: calc(100% - 220px); }

  .topbar { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; }
  .welcome-name { font-family: 'Syne', sans-serif; font-size: 32px; font-weight: 700; color: #E8E6E1; line-height: 1; }
  .welcome-date { font-size: 12px; color: #8892A4; margin-top: 6px; letter-spacing: 0.05em; }

  .period-badge { background: #1E2736; border: 1px solid #2D3748; border-radius: 8px; padding: 10px 16px; text-align: right; }
  .period-label { font-size: 10px; color: #8892A4; letter-spacing: 0.15em; text-transform: uppercase; }
  .period-name { font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 700; color: #E8E6E1; margin-top: 4px; }
  .period-dates { font-size: 11px; color: #E8B84B; margin-top: 2px; font-family: 'DM Mono', monospace; }

  .stat-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 20px; }
  .stat-card { background: #161B26; border: 1px solid #2D3748; border-radius: 12px; padding: 20px 24px; position: relative; overflow: hidden; }
  .stat-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; background: linear-gradient(90deg, #E8B84B, transparent); opacity: 0.6; }
  .stat-label { font-size: 10px; color: #8892A4; letter-spacing: 0.18em; text-transform: uppercase; margin-bottom: 10px; }
  .stat-amount { font-family: 'DM Mono', monospace; font-size: 26px; font-weight: 500; color: #E8B84B; line-height: 1; }
  .stat-amount.neutral { color: #E8E6E1; }
  .stat-amount.negative { color: #FC8181; }

  .content-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .panel { background: #161B26; border: 1px solid #2D3748; border-radius: 12px; padding: 24px; }
  .panel-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
  .panel-title { font-size: 11px; color: #8892A4; letter-spacing: 0.18em; text-transform: uppercase; font-weight: 500; }
  .panel-count { font-size: 11px; color: #4A5568; font-family: 'DM Mono', monospace; }

  .row-item { display: flex; justify-content: space-between; align-items: center; padding: 11px 0; border-bottom: 1px solid #1E2736; }
  .row-item:last-child { border-bottom: none; }
  .row-name { font-size: 13px; color: #CBD5E0; font-weight: 500; }
  .row-sub { font-size: 11px; color: #4A5568; margin-top: 2px; letter-spacing: 0.05em; }
  .row-amount { font-family: 'DM Mono', monospace; font-size: 14px; color: #E8B84B; font-weight: 500; }
  .empty-state { font-size: 13px; color: #4A5568; font-style: italic; padding: 8px 0; }

  .accumulating-bar { height: 3px; background: #1E2736; border-radius: 2px; margin-top: 8px; overflow: hidden; }
  .accumulating-fill { height: 100%; background: linear-gradient(90deg, #E8B84B, #F5D07A); border-radius: 2px; }

  .tag { display: inline-block; font-size: 9px; letter-spacing: 0.12em; text-transform: uppercase; padding: 2px 7px; border-radius: 4px; background: #1E2736; color: #4A5568; margin-left: 8px; vertical-align: middle; }
`;

function Dashboard() {
  const [household, setHousehold] = useState(null);
  const [payPeriods, setPayPeriods] = useState([]);
  const [income, setIncome] = useState([]);
  const [bills, setBills] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeNav, setActiveNav] = useState("dashboard");
  const [editingBill, setEditingBill] = useState(null);
  const [billName, setBillName] = useState("");
  const [billAmount, setBillAmount] = useState("");
  const [dueDay, setDueDay] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("auto");
  const [billCategory, setBillCategory] = useState("");
  const [billOwner, setBillOwner] = useState("joint");
  const [billAccountId, setBillAccountId] = useState("");
  const [isVariable, setIsVariable] = useState(false);
  const [showBillForm, setShowBillForm] = useState(false);
  const [confirmingPaidBill, setConfirmingPaidBill] = useState(null);
  const [editingIncome, setEditingIncome] = useState(null);
  const [showIncomeForm, setShowIncomeForm] = useState(false);
  const [incomeName, setIncomeName] = useState("");
  const [incomeOwner, setIncomeOwner] = useState("joint");
  const [incomeType, setIncomeType] = useState("salary");
  const [incomeFrequency, setIncomeFrequency] = useState("biweekly");
  const [fixedAmount, setFixedAmount] = useState("");
  const [nextPayDate, setNextPayDate] = useState("");
  const [depositAccountId, setDepositAccountId] = useState("");

  useEffect(() => {
    async function loadData() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const { data: householdData } = await supabase
        .from("households")
        .select("id, name")
        .eq("created_by", user.id)
        .single();
      if (!householdData) return;
      setHousehold(householdData);
      const [periodsRes, incomeRes, billsRes, accountsRes] = await Promise.all([
        supabase
          .from("pay_periods")
          .select("*")
          .eq("household_id", householdData.id)
          .order("start_date"),
        supabase
          .from("income")
          .select("*")
          .eq("household_id", householdData.id),
        supabase.from("bills").select("*").eq("household_id", householdData.id),
        supabase
          .from("accounts")
          .select("*")
          .eq("household_id", householdData.id),
      ]);
      setPayPeriods(periodsRes.data || []);
      setIncome(incomeRes.data || []);
      setBills(billsRes.data || []);
      setAccounts(accountsRes.data || []);
      setLoading(false);
    }
    loadData();
  }, []);

  function getCurrentPayPeriod() {
    const today = new Date();
    return payPeriods.find((p) => {
      const s = new Date(p.start_date),
        e = new Date(p.end_date);
      return today >= s && today <= e;
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
    return new Date(s).toLocaleDateString("en-US", {
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

    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { data: householdData } = await supabase
      .from("households")
      .select("id")
      .eq("created_by", user.id)
      .single();

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

  async function addIncome() {
    if (!incomeName || !fixedAmount || !nextPayDate) {
      alert("Please fill in all required income fields.");
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { data: householdData } = await supabase
      .from("households")
      .select("id")
      .eq("created_by", user.id)
      .single();

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
          color: "#4A5568",
          fontSize: "12px",
          letterSpacing: "0.3em",
          textTransform: "uppercase",
        }}
      >
        <style>{css}</style>
        Loading Slate...
      </div>
    );
  }

  const currentPeriod = getCurrentPayPeriod();

  function renderContent() {
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
                background: "#E8B84B",
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

          {(showIncomeForm || editingIncome) && (
            <div className="panel" style={{ marginBottom: "16px" }}>
              <div className="panel-header">
                <div className="panel-title">
                  {editingIncome ? "Edit Income" : "New Income"}
                </div>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "12px",
                }}
              >
                <input
                  placeholder="Income name (e.g. VA Disability)"
                  value={incomeName}
                  onChange={(e) => setIncomeName(e.target.value)}
                  style={{
                    background: "#1E2736",
                    border: "1px solid #2D3748",
                    color: "#E8E6E1",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    fontSize: "13px",
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                />
                <input
                  type="number"
                  placeholder="Amount"
                  value={fixedAmount}
                  onChange={(e) => setFixedAmount(e.target.value)}
                  style={{
                    background: "#1E2736",
                    border: "1px solid #2D3748",
                    color: "#E8E6E1",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    fontSize: "13px",
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                />
                <select
                  value={incomeOwner}
                  onChange={(e) => setIncomeOwner(e.target.value)}
                  style={{
                    background: "#1E2736",
                    border: "1px solid #2D3748",
                    color: "#E8E6E1",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    fontSize: "13px",
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  <option value="joint">Joint</option>
                  <option value="Travis">Travis</option>
                  <option value="Shawna">Shawna</option>
                </select>
                <select
                  value={incomeType}
                  onChange={(e) => setIncomeType(e.target.value)}
                  style={{
                    background: "#1E2736",
                    border: "1px solid #2D3748",
                    color: "#E8E6E1",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    fontSize: "13px",
                    fontFamily: "'DM Sans', sans-serif",
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
                    background: "#1E2736",
                    border: "1px solid #2D3748",
                    color: "#E8E6E1",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    fontSize: "13px",
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  <option value="biweekly">Biweekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="weekly">Weekly</option>
                </select>
                <select
                  value={depositAccountId}
                  onChange={(e) => setDepositAccountId(e.target.value)}
                  style={{
                    background: "#1E2736",
                    border: "1px solid #2D3748",
                    color: "#E8E6E1",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    fontSize: "13px",
                    fontFamily: "'DM Sans', sans-serif",
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
                      color: "#8892A4",
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
                      background: "#1E2736",
                      border: "1px solid #2D3748",
                      color: "#E8E6E1",
                      padding: "8px 12px",
                      borderRadius: "6px",
                      fontSize: "13px",
                      fontFamily: "'DM Sans', sans-serif",
                      width: "100%",
                    }}
                  />
                </div>
              </div>
              <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
                <button
                  onClick={editingIncome ? updateIncome : addIncome}
                  style={{
                    background: "#E8B84B",
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
                  {editingIncome ? "Save Changes" : "Add Income"}
                </button>
                <button
                  onClick={() => {
                    setShowIncomeForm(false);
                    setEditingIncome(null);
                  }}
                  style={{
                    background: "none",
                    border: "1px solid #2D3748",
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
              <div className="panel-title">Income Sources</div>
              <div className="panel-count">{income.length} total</div>
            </div>
            {income.length === 0 ? (
              <div className="empty-state">No income sources added yet</div>
            ) : (
              [...income]
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((inc, i) => (
                  <div className="row-item" key={i}>
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
                      <div className="row-amount">${fmt(inc.fixed_amount)}</div>
                      <button
                        onClick={() => {
                          setEditingIncome(inc);
                          setShowIncomeForm(false);
                          setIncomeName(inc.name);
                          setIncomeOwner(inc.owner || "joint");
                          setIncomeType(inc.type);
                          setIncomeFrequency(inc.frequency);
                          setFixedAmount(inc.fixed_amount || "");
                          setNextPayDate(inc.next_pay_date || "");
                          setDepositAccountId(inc.deposit_account_id || "");
                        }}
                        style={{
                          background: "none",
                          border: "1px solid #2D3748",
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
                      <button
                        onClick={() => deleteIncome(inc.id)}
                        style={{
                          background: "none",
                          border: "1px solid #2D3748",
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
                background: "#E8B84B",
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

          {(showBillForm || editingBill) && (
            <div className="panel" style={{ marginBottom: "16px" }}>
              <div className="panel-header">
                <div className="panel-title">
                  {editingBill ? "Edit Bill" : "New Bill"}
                </div>
              </div>
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
                    background: "#1E2736",
                    border: "1px solid #2D3748",
                    color: "#E8E6E1",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    fontSize: "13px",
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                />
                <input
                  type="number"
                  placeholder="Amount"
                  value={billAmount}
                  onChange={(e) => setBillAmount(e.target.value)}
                  style={{
                    background: "#1E2736",
                    border: "1px solid #2D3748",
                    color: "#E8E6E1",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    fontSize: "13px",
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                />
                <input
                  type="number"
                  placeholder="Due day of month (e.g. 1)"
                  value={dueDay}
                  onChange={(e) => setDueDay(e.target.value)}
                  style={{
                    background: "#1E2736",
                    border: "1px solid #2D3748",
                    color: "#E8E6E1",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    fontSize: "13px",
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                />
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  style={{
                    background: "#1E2736",
                    border: "1px solid #2D3748",
                    color: "#E8E6E1",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    fontSize: "13px",
                    fontFamily: "'DM Sans', sans-serif",
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
                    background: "#1E2736",
                    border: "1px solid #2D3748",
                    color: "#E8E6E1",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    fontSize: "13px",
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  <option value="">Select category</option>
                  <option value="housing">Housing</option>
                  <option value="utilities">Utilities</option>
                  <option value="insurance">Insurance</option>
                  <option value="subscriptions">Subscriptions</option>
                  <option value="loans">Loans</option>
                  <option value="transportation">Transportation</option>
                  <option value="food">Food & Gas</option>
                  <option value="savings">Savings</option>
                  <option value="other">Other</option>
                </select>
                <select
                  value={billAccountId}
                  onChange={(e) => setBillAccountId(e.target.value)}
                  style={{
                    background: "#1E2736",
                    border: "1px solid #2D3748",
                    color: "#E8E6E1",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    fontSize: "13px",
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  <option value="">Which account pays this?</option>
                  {accounts.map((acct, i) => (
                    <option key={i} value={acct.id}>
                      {acct.name}
                    </option>
                  ))}
                </select>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    color: "#8892A4",
                    fontSize: "13px",
                    gridColumn: "1 / -1",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isVariable}
                    onChange={(e) => setIsVariable(e.target.checked)}
                  />
                  This bill varies month to month
                </label>
              </div>
              <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
                <button
                  onClick={editingBill ? updateBill : addBill}
                  style={{
                    background: "#E8B84B",
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
                  {editingBill ? "Save Changes" : "Add Bill"}
                </button>
                <button
                  onClick={() => {
                    setShowBillForm(false);
                    setEditingBill(null);
                  }}
                  style={{
                    background: "none",
                    border: "1px solid #2D3748",
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
              <div className="panel-title">All Bills</div>
              <div className="panel-count">{bills.length} total</div>
            </div>
            {bills.length === 0 ? (
              <div className="empty-state">No bills added yet</div>
            ) : (
              [...bills]
                .sort((a, b) => a.due_day - b.due_day)
                .map((bill, i) => (
                  <div className="row-item" key={i}>
                    <div>
                      <div
                        className="row-name"
                        style={{
                          color: !isBillDue(bill) ? "#4A5568" : "#CBD5E0",
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
                      <div className="row-amount">${fmt(bill.amount)}</div>
                      {!isBillDue(bill) ? (
                        <button
                          onClick={() => markBillUnpaid(bill)}
                          style={{
                            background: "none",
                            border: "1px solid #2D3748",
                            color: "#FC8181",
                            padding: "4px 10px",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontSize: "11px",
                            fontFamily: "'DM Sans', sans-serif",
                          }}
                        >
                          Unpaid
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => {
                              setEditingBill(bill);
                              setShowBillForm(false);
                              setBillName(bill.name);
                              setBillAmount(bill.amount);
                              setDueDay(bill.due_day);
                              setPaymentMethod(bill.payment_method);
                              setBillCategory(bill.category);
                              setBillOwner(bill.owner);
                              setBillAccountId(bill.account_id || "");
                              setIsVariable(bill.is_variable);
                            }}
                            style={{
                              background: "none",
                              border: "1px solid #2D3748",
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
                          <button
                            onClick={() => deleteBill(bill.id)}
                            style={{
                              background: "none",
                              border: "1px solid #2D3748",
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
                        </>
                      )}
                    </div>
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
    const currentPeriod = getCurrentPayPeriod();
    return (
      <>
        <div className="topbar">
          <div>
            <div className="welcome-name">{household?.name}</div>
            <div className="welcome-date">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </div>
          </div>
          <div className="period-badge">
            <div className="period-label">Current Pay Period</div>
            {currentPeriod ? (
              <>
                <div className="period-name">{currentPeriod.name}</div>
                <div className="period-dates">
                  {fmtDate(currentPeriod.start_date)} —{" "}
                  {fmtDate(currentPeriod.end_date)}
                </div>
              </>
            ) : (
              <div
                className="period-name"
                style={{ color: "#8892A4", fontSize: "13px", fontWeight: 400 }}
              >
                No active period
              </div>
            )}
          </div>
        </div>

        <div className="stat-row">
          <div className="stat-card">
            <div className="stat-label">Income Remaining This Month</div>
            <div className="stat-amount">
              ${fmt(getRemainingIncomeThisMonth())}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Bills Remaining This Month</div>
            <div className="stat-amount">
              $
              {fmt(
                bills
                  .filter(isBillDue)
                  .reduce((sum, b) => sum + (b.amount || 0), 0),
              )}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Projected Balance</div>
            {(() => {
              const projectedRemaining =
                getRemainingIncomeThisMonth() -
                bills
                  .filter(isBillDue)
                  .reduce((sum, b) => sum + (b.amount || 0), 0);
              return (
                <div
                  className={`stat-amount ${projectedRemaining < 0 ? "negative" : "neutral"}`}
                >
                  {projectedRemaining < 0 ? "-" : ""}$
                  {fmt(Math.abs(projectedRemaining))}
                </div>
              );
            })()}
          </div>
        </div>

        <div className="content-grid">
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
                      {acct.is_primary && <span className="tag">Primary</span>}
                      {acct.is_accumulating && (
                        <span className="tag">Accumulating</span>
                      )}
                    </div>
                    <div className="row-sub">
                      {acct.bank_name} ···{acct.last_four} · {acct.account_type}
                    </div>
                    {acct.is_accumulating && acct.accumulation_target > 0 && (
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
                  <div className="row-amount">${fmt(acct.current_balance)}</div>
                </div>
              ))
            )}
          </div>

          <div className="panel">
            <div className="panel-header">
              <div className="panel-title">Bills Remaining</div>
              <div className="panel-count">
                {bills.filter(isBillDue).length} remaining
              </div>
            </div>
            {bills.filter(isBillDue).length === 0 ? (
              <div className="empty-state">All bills paid this month 🎉</div>
            ) : (
              [...bills]
                .filter(isBillDue)
                .sort((a, b) => a.due_day - b.due_day)
                .map((bill, i) => (
                  <div className="row-item" key={i}>
                    <div>
                      <div className="row-name">{bill.name}</div>
                      <div className="row-sub">
                        Due the {bill.due_day}
                        {getSuffix(bill.due_day)} · {bill.category}
                      </div>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <div className="row-amount">${fmt(bill.amount)}</div>
                      <button
                        onClick={() => markBillPaid(bill)}
                        style={{
                          background: "none",
                          border: "1px solid #2D3748",
                          color: "#68D391",
                          padding: "4px 10px",
                          borderRadius: "6px",
                          cursor: "pointer",
                          fontSize: "11px",
                          fontFamily: "'DM Sans', sans-serif",
                        }}
                      >
                        Paid
                      </button>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="app-shell">
      <style>{css}</style>

      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-text">Slate</div>
          <div className="logo-tag">Don't go dark.</div>
        </div>
        <nav className="nav">
          <div className="nav-label">Main</div>
          {["dashboard", "bills", "income", "accounts"].map((item) => (
            <button
              key={item}
              className={`nav-item ${activeNav === item ? "active" : ""}`}
              onClick={() => setActiveNav(item)}
            >
              <span
                className={activeNav === item ? "nav-dot" : "nav-dot-muted"}
              />
              {item.charAt(0).toUpperCase() + item.slice(1)}
            </button>
          ))}
          <div className="nav-label">Planning</div>
          {["payperiods", "debts"].map((item) => (
            <button
              key={item}
              className={`nav-item ${activeNav === item ? "active" : ""}`}
              onClick={() => setActiveNav(item)}
            >
              <span
                className={activeNav === item ? "nav-dot" : "nav-dot-muted"}
              />
              {item === "payperiods" ? "Pay Periods" : "Debts"}
            </button>
          ))}
          <div className="nav-label">Account</div>
          <button
            className={`nav-item ${activeNav === "settings" ? "active" : ""}`}
            onClick={() => setActiveNav("settings")}
          >
            <span
              className={activeNav === "settings" ? "nav-dot" : "nav-dot-muted"}
            />
            Settings
          </button>
        </nav>
        <div className="sidebar-footer">
          <button
            className="signout-btn"
            onClick={() => supabase.auth.signOut()}
          >
            <span className="nav-dot-muted" /> Sign Out
          </button>
        </div>
      </aside>

      <main className="main">{renderContent()}</main>
    </div>
  );
}

export default Dashboard;
