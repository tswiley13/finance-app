import { useState, useEffect } from "react";
import { supabase } from "../supabase";

function Onboarding({ onComplete }) {
  const [step, setStep] = useState(null);
  const [householdId, setHouseholdId] = useState(null);
  const [accountError, setAccountError] = useState(null);
  const [householdName, setHouseholdName] = useState("");
  const [memberList, setMemberList] = useState([]);
  const [memberName, setMemberName] = useState("");
  const [memberError, setMemberError] = useState(null);
  const [editingMember, setEditingMember] = useState(null);
  const [incomeList, setIncomeList] = useState([]);
  const [incomeName, setIncomeName] = useState("");
  const [incomeOwner, setIncomeOwner] = useState("");
  const [incomeEntryMode, setIncomeEntryMode] = useState("");
  const [incomeType, setIncomeType] = useState("salary");
  const [incomeFrequency, setIncomeFrequency] = useState("biweekly");
  const [fixedAmount, setFixedAmount] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [hoursPerWeek, setHoursPerWeek] = useState("");
  const [overtimeRate, setOvertimeRate] = useState("");
  const [taxRate, setTaxRate] = useState("");
  const [editingIncome, setEditingIncome] = useState(null);
  const [nextPayDate, setNextPayDate] = useState("");
  const [accountList, setAccountList] = useState([]);
  const [accountName, setAccountName] = useState("");
  const [bankName, setBankName] = useState("");
  const [lastFour, setLastFour] = useState("");
  const [accountType, setAccountType] = useState("checking");
  const [currentBalance, setCurrentBalance] = useState("");
  const [isPrimary, setIsPrimary] = useState(false);
  const [isAccumulating, setIsAccumulating] = useState(false);
  const [accumulationTarget, setAccumulationTarget] = useState("");
  const [resetType, setResetType] = useState("manual");
  const [resetDay, setResetDay] = useState("");
  const [editingAccount, setEditingAccount] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [carouselCards, setCarouselCards] = useState([{
    saved: false, id: null, error: null, loading: false,
    accountName: "", bankName: "", lastFour: "",
    accountType: "checking", currentBalance: "",
    isPrimary: false, isAccumulating: false,
    accumulationTarget: "", resetType: "manual", resetDay: "",
  }]);
  const [billList, setBillList] = useState([]);
  const [billName, setBillName] = useState("");
  const [billAmount, setBillAmount] = useState("");
  const [dueDay, setDueDay] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("auto");
  const [billCategory, setBillCategory] = useState("");
  const [billOwner, setBillOwner] = useState("joint");
  const [billAccountId, setBillAccountId] = useState("");
  const [isVariable, setIsVariable] = useState(false);
  const [editingBill, setEditingBill] = useState(null);
  const [payPeriodList, setPayPeriodList] = useState([]);
  const [depositAccountId, setDepositAccountId] = useState("");
  useEffect(() => {
    async function checkResume() {
      const { data: { user } } = await supabase.auth.getUser();

      const { data: household } = await supabase
        .from("households")
        .select("id, name")
        .eq("created_by", user.id)
        .maybeSingle();

      if (!household) {
        setStep(1);
        return;
      }

      setHouseholdId(household.id);
      setHouseholdName(household.name);

      const { data: members } = await supabase
        .from("household_members")
        .select("id")
        .eq("household_id", household.id);

      if (!members || members.length === 0) {
        setStep(2);
        return;
      }

      const { data: accounts } = await supabase
        .from("accounts")
        .select("id")
        .eq("household_id", household.id);

      if (!accounts || accounts.length === 0) {
        setStep(3);
        return;
      }

      const { data: incomeRows } = await supabase
        .from("income")
        .select("id")
        .eq("household_id", household.id);

      if (!incomeRows || incomeRows.length === 0) {
        setStep(4);
        return;
      }

      const { data: billRows } = await supabase
        .from("bills")
        .select("id")
        .eq("household_id", household.id);

      if (!billRows || billRows.length === 0) {
        setStep(5);
        return;
      }

      onComplete();
    }

    checkResume();
  }, []);

  async function createHousehold() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const inviteCode =
      householdName
        .toUpperCase()
        .replace(/[^A-Z]/g, "")
        .slice(0, 5) +
      "-" +
      Math.floor(1000 + Math.random() * 9000);

    const { data: created, error } = await supabase.from("households").insert({
      name: householdName,
      created_by: user.id,
      invite_code: inviteCode,
    }).select("id").single();

    if (error) {
      console.log("Error:", error.message);
      return;
    }

    setHouseholdId(created.id);
    setStep(2);
  }

  async function addMember() {
    if (!memberName.trim()) {
      setMemberError("Please enter a name.");
      return;
    }
    if (!householdId) {
      setMemberError("Could not find your household. Try going back to step 1.");
      return;
    }
    setMemberError(null);

    const { data: { user } } = await supabase.auth.getUser();

    const { data: saved, error } = await supabase
      .from("household_members")
      .insert({
        household_id: householdId,
        user_id: user.id,
        name: memberName.trim(),
        role: memberList.length === 0 ? "owner" : "member",
      })
      .select()
      .single();

    if (error) {
      setMemberError(error.message);
      return;
    }

    setMemberList([...memberList, saved]);
    setMemberName("");
  }

  async function updateMember() {
    if (!memberName.trim()) {
      setMemberError("Please enter a name.");
      return;
    }
    setMemberError(null);

    const { error } = await supabase
      .from("household_members")
      .update({ name: memberName.trim() })
      .eq("id", editingMember.id);

    if (error) {
      setMemberError(error.message);
      return;
    }

    setMemberList(memberList.map((m) =>
      m.id === editingMember.id ? { ...m, name: memberName.trim() } : m,
    ));
    setEditingMember(null);
    setMemberName("");
  }

  async function deleteMember(member) {
    const { error } = await supabase
      .from("household_members")
      .delete()
      .eq("id", member.id);

    if (error) {
      setMemberError(error.message);
      return;
    }

    setMemberList(memberList.filter((m) => m.id !== member.id));
    if (editingMember?.id === member.id) {
      setEditingMember(null);
      setMemberName("");
    }
  }

  async function addIncome() {
    const newIncome = {
      household_id: householdId,
      name: incomeName,
      owner: incomeOwner,
      type: incomeType,
      deposit_account_id: depositAccountId || null,
      frequency: incomeFrequency,
      fixed_amount: incomeType !== "hourly" ? parseFloat(fixedAmount) : null,
      hourly_rate: incomeType === "hourly" ? parseFloat(hourlyRate) : null,
      hours_per_week: incomeType === "hourly" ? parseFloat(hoursPerWeek) : null,
      overtime_rate: incomeType === "hourly" ? parseFloat(overtimeRate) : null,
      tax_rate: taxRate ? parseFloat(taxRate) : null,
      next_pay_date: nextPayDate,
      is_active: true,
    };

    const { error } = await supabase.from("income").insert(newIncome);

    if (error) {
      console.log("Error:", error.message);
      return;
    }

    setIncomeList([...incomeList, newIncome]);
    setIncomeName("");
    setIncomeOwner("");
    setFixedAmount("");
    setHourlyRate("");
    setHoursPerWeek("");
    setOvertimeRate("");
    setTaxRate("");
    setNextPayDate("");
    setDepositAccountId("");
  }

  async function updateIncome() {
    if (!incomeName) {
      alert("Please enter an income name.");
      return;
    }

    const { error } = await supabase
      .from("income")
      .update({
        name: incomeName,
        owner: incomeOwner,
        type: incomeType,
        frequency: incomeFrequency,
        fixed_amount: incomeType !== "hourly" ? parseFloat(fixedAmount) : null,
        hourly_rate: incomeType === "hourly" ? parseFloat(hourlyRate) : null,
        hours_per_week:
          incomeType === "hourly" ? parseFloat(hoursPerWeek) : null,
        overtime_rate:
          incomeType === "hourly" ? parseFloat(overtimeRate) : null,
        tax_rate: taxRate ? parseFloat(taxRate) : null,
        next_pay_date: nextPayDate,
        deposit_account_id: depositAccountId || null,
      })
      .eq("id", editingIncome.id);

    if (error) {
      console.log("Error:", error.message);
      return;
    }

    setIncomeList(
      incomeList.map((i) =>
        i.id === editingIncome.id
          ? {
              ...i,
              name: incomeName,
              owner: incomeOwner,
              type: incomeType,
              frequency: incomeFrequency,
              fixed_amount: parseFloat(fixedAmount) || null,
              next_pay_date: nextPayDate,
              deposit_account_id: depositAccountId || null,
            }
          : i,
      ),
    );

    setEditingIncome(null);
    setIncomeName("");
    setIncomeOwner("");
    setFixedAmount("");
    setHourlyRate("");
    setHoursPerWeek("");
    setOvertimeRate("");
    setTaxRate("");
    setNextPayDate("");
    setDepositAccountId("");
  }

  async function addAccount() {
    setAccountError(null);
    if (!accountName) {
      setAccountError("Please enter an account name.");
      return;
    }
    if (lastFour && !/^\d{4}$/.test(lastFour)) {
      setAccountError("Last 4 digits must be exactly 4 numbers.");
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: household } = await supabase
      .from("households")
      .select("id")
      .eq("created_by", user.id)
      .single();

    const newAccount = {
      household_id: household.id,
      name: accountName,
      bank_name: bankName,
      last_four: lastFour,
      account_type: accountType,
      current_balance: currentBalance ? parseFloat(currentBalance) : 0,
      is_primary: isPrimary,
      is_accumulating: isAccumulating,
      accumulation_target: accumulationTarget
        ? parseFloat(accumulationTarget)
        : null,
      reset_type: resetType,
      reset_day: resetDay ? parseInt(resetDay) : null,
    };

    if (!household) {
      setAccountError("Could not find your household. Try going back to step 1.");
      return;
    }

    const { data: savedAccount, error } = await supabase
      .from("accounts")
      .insert(newAccount)
      .select()
      .single();

    if (error) {
      setAccountError(error.message);
      return;
    }

    setAccountList([...accountList, savedAccount]);
    setAccountName("");
    setBankName("");
    setLastFour("");
    setAccountType("checking");
    setCurrentBalance("");
    setIsPrimary(false);
    setIsAccumulating(false);
    setAccumulationTarget("");
    setResetType("manual");
    setResetDay("");
  }

  async function updateAccount() {
    setAccountError(null);
    if (!accountName) {
      setAccountError("Please enter an account name.");
      return;
    }
    if (lastFour && !/^\d{4}$/.test(lastFour)) {
      setAccountError("Last 4 digits must be exactly 4 numbers.");
      return;
    }

    const { error } = await supabase
      .from("accounts")
      .update({
        name: accountName,
        bank_name: bankName,
        last_four: lastFour,
        account_type: accountType,
        current_balance: currentBalance ? parseFloat(currentBalance) : 0,
        is_primary: isPrimary,
        is_accumulating: isAccumulating,
        accumulation_target: accumulationTarget
          ? parseFloat(accumulationTarget)
          : null,
        reset_type: resetType,
        reset_day: resetDay ? parseInt(resetDay) : null,
      })
      .eq("id", editingAccount.id);

    if (error) {
      console.log("Error:", error.message);
      return;
    }

    setAccountList(
      accountList.map((a) =>
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
    setResetType("manual");
    setResetDay("");
  }

  function blankCard() {
    return {
      saved: false, id: null, error: null, loading: false,
      accountName: "", bankName: "", lastFour: "",
      accountType: "checking", currentBalance: "",
      isPrimary: false, isAccumulating: false,
      accumulationTarget: "", resetType: "manual", resetDay: "",
    };
  }

  function updateCard(index, fields) {
    setCarouselCards(prev => prev.map((c, i) => i === index ? { ...c, ...fields } : c));
  }

  async function saveCard(index) {
    const card = carouselCards[index];
    if (!card.accountName) {
      updateCard(index, { error: "Account name is required." });
      return;
    }
    if (card.lastFour && !/^\d{4}$/.test(card.lastFour)) {
      updateCard(index, { error: "Last 4 must be exactly 4 digits." });
      return;
    }

    updateCard(index, { loading: true, error: null });

    if (!householdId) {
      updateCard(index, { loading: false, error: "Could not find your household." });
      return;
    }

    const payload = {
      household_id: householdId,
      name: card.accountName,
      bank_name: card.bankName || null,
      last_four: card.lastFour || null,
      account_type: card.accountType,
      current_balance: card.currentBalance ? parseFloat(card.currentBalance) : 0,
      is_primary: card.isPrimary,
      is_accumulating: card.isAccumulating,
      accumulation_target: card.accumulationTarget ? parseFloat(card.accumulationTarget) : null,
      reset_type: card.resetType,
      reset_day: card.resetDay ? parseInt(card.resetDay) : null,
    };

    if (card.id) {
      const { error } = await supabase.from("accounts").update(payload).eq("id", card.id);
      if (error) { updateCard(index, { loading: false, error: error.message }); return; }
      setAccountList(prev => prev.map(a => a.id === card.id ? { ...a, ...payload } : a));
      updateCard(index, { loading: false, saved: true });
    } else {
      const { data: savedAccount, error } = await supabase
        .from("accounts").insert(payload).select().single();
      if (error) { updateCard(index, { loading: false, error: error.message }); return; }
      const newCardIndex = carouselCards.length;
      setAccountList(prev => [...prev, savedAccount]);
      setCarouselCards(prev => [
        ...prev.map((c, i) => i === index ? { ...c, loading: false, saved: true, id: savedAccount.id } : c),
        blankCard(),
      ]);
      setActiveIndex(newCardIndex);
    }
  }

  async function addBill() {
    if (!billName) {
      alert("Please enter a bill name.");
      return;
    }
    if (!billAmount) {
      alert("Please enter a bill amount.");
      return;
    }
    if (!dueDay) {
      alert("Please enter a due day.");
      return;
    }
    if (!billCategory) {
      alert("Please select a category.");
      return;
    }

    if (!billAccountId) {
      alert("Please select which account this bill comes from.");
      return;
    }

    const newBill = {
      household_id: householdId,
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
    };

    const { data: savedBill, error } = await supabase
      .from("bills")
      .insert(newBill)
      .select()
      .single();

    if (error) {
      console.log("Error:", error.message);
      return;
    }

    setBillList([...billList, savedBill]);
    setBillName("");
    setBillAmount("");
    setDueDay("");
    setPaymentMethod("auto");
    setBillCategory("");
    setBillOwner("joint");
    setBillAccountId("");
    setIsVariable(false);
  }

  async function updateBill() {
    if (!billName) {
      alert("Please enter a bill name.");
      return;
    }
    if (!billAmount) {
      alert("Please enter a bill amount.");
      return;
    }
    if (!dueDay) {
      alert("Please enter a due day.");
      return;
    }
    if (!billCategory) {
      alert("Please select a category.");
      return;
    }
    if (!billAccountId) {
      alert("Please select which account this bill comes from.");
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

    setBillList(
      billList.map((b) =>
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

  function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  function calculatePayPeriods() {
    const paychecks = incomeList.filter((i) => i.frequency !== "monthly");

    // Generate 8 occurrences of each biweekly paycheck (covers ~4 months)
    const allDates = [];
    paychecks.forEach((income) => {
      const baseDate = new Date(income.next_pay_date);
      for (let i = 0; i < 8; i++) {
        const date = new Date(baseDate);
        date.setDate(baseDate.getDate() + i * 14);
        allDates.push(date);
      }
    });

    // Sort all dates chronologically
    allDates.sort((a, b) => a - b);

    // Remove duplicates (same day)
    const uniqueDates = allDates.filter(
      (date, index, self) =>
        index === 0 || date.toDateString() !== self[index - 1].toDateString(),
    );

    // Create pay periods between each date
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

    setPayPeriodList(periods);
    return periods;
  }

  async function savePayPeriods(periods) {
    for (const period of periods) {
      await supabase.from("pay_periods").insert({
        household_id: householdId,
        name: period.name,
        start_day: period.start_day,
        end_day: period.end_day,
        start_date: period.start_date,
        end_date: period.end_date,
      });
    }
  }

  async function saveDefaultCategories(hid) {
    const defaults = [
      "Housing",
      "Utilities",
      "Insurance",
      "Subscriptions",
      "Loans",
      "Transportation",
      "Food & Gas",
      "Savings",
      "Other",
    ];

    for (const name of defaults) {
      await supabase.from("categories").insert({
        household_id: hid,
        name: name,
      });
    }
  }

  function calculateTransfers() {
    const transfers = [];

    payPeriodList.forEach((period) => {
      const periodStart = new Date(period.start_date);
      const periodEnd = new Date(period.end_date);

      // Find bills due during this pay period
      const periodBills = billList.filter((bill) => {
        const dueDate = new Date(periodStart);
        dueDate.setDate(bill.due_day);
        return dueDate >= periodStart && dueDate <= periodEnd;
      });

      // Group bills by account
      const accountTotals = {};
      periodBills.forEach((bill) => {
        if (bill.account_id) {
          if (!accountTotals[bill.account_id]) {
            accountTotals[bill.account_id] = 0;
          }
          accountTotals[bill.account_id] += bill.amount;
        }
      });

      transfers.push({
        period,
        accountTotals,
      });
    });

    return transfers;
  }

  if (step === null) {
    return <div style={{ minHeight: "100vh", background: "#13111F" }} />;
  }

  const inputStyle = {
    width: "100%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
    color: "#F0F6FC", padding: "10px 14px", borderRadius: "8px", fontSize: "14px",
    fontFamily: "'Inter', sans-serif", outline: "none", boxSizing: "border-box",
  };
  const labelStyle = {
    fontSize: "11px", fontWeight: "600", color: "#8B8FA8", letterSpacing: "0.08em",
    textTransform: "uppercase", display: "block", marginBottom: "6px",
  };
  const primaryBtn = {
    background: "#6C63FF", border: "none", color: "#F0F6FC", padding: "11px 24px",
    borderRadius: "8px", cursor: "pointer", fontSize: "14px", fontWeight: "600",
    fontFamily: "'Inter', sans-serif",
  };
  const addBtn = {
    background: "#00D4AA", border: "none", color: "#0F1218", padding: "10px 20px",
    borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: "600",
    fontFamily: "'Inter', sans-serif",
  };
  const ghostBtn = {
    background: "none", border: "1px solid rgba(255,255,255,0.1)", color: "#8B8FA8",
    padding: "6px 14px", borderRadius: "6px", cursor: "pointer", fontSize: "12px",
    fontFamily: "'Inter', sans-serif",
  };

  function shell(stepNum, title, subtitle, content, maxWidth = "540px") {
    return (
      <div style={{ minHeight: "100vh", background: "#13111F", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "'Inter', sans-serif", padding: "40px 20px" }}>
        <div style={{ marginBottom: "28px", textAlign: "center" }}>
          <div style={{ fontSize: "9px", color: "#6C63FF", letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: "600", marginBottom: "2px" }}>Bravo Six</div>
          <div style={{ fontSize: "20px", fontWeight: "800", letterSpacing: "0.06em", color: "#F0F6FC", textTransform: "uppercase" }}>Slate</div>
        </div>
        <div style={{ display: "flex", gap: "6px", marginBottom: "28px" }}>
          {[1,2,3,4,5].map(s => (
            <div key={s} style={{ width: "32px", height: "3px", borderRadius: "2px", background: s <= stepNum ? "#6C63FF" : "rgba(255,255,255,0.08)" }} />
          ))}
        </div>
        <div style={{ width: "100%", maxWidth, background: "#1A1826", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.06)", padding: "40px" }}>
          <div style={{ marginBottom: "28px" }}>
            <div style={{ fontSize: "10px", color: "#6C63FF", letterSpacing: "0.15em", textTransform: "uppercase", fontWeight: "600", marginBottom: "8px" }}>Step {stepNum} of 5</div>
            <div style={{ fontSize: "22px", fontWeight: "700", color: "#F0F6FC", marginBottom: "6px" }}>{title}</div>
            {subtitle && <div style={{ fontSize: "14px", color: "#8B8FA8", lineHeight: "1.5" }}>{subtitle}</div>}
          </div>
          {content}
        </div>
      </div>
    );
  }

  if (step === 1) {
    return shell(1, "Name your household", "This is how you and your household will be identified in Slate.", (
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <div>
          <label style={labelStyle}>Household Name</label>
          <input style={inputStyle} type="text" placeholder="e.g. The Smith Family" value={householdName} onChange={(e) => setHouseholdName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && householdName && createHousehold()} autoFocus />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button style={ghostBtn} onClick={() => supabase.auth.signOut()}>Sign Out</button>
          <button style={primaryBtn} onClick={createHousehold} disabled={!householdName}>Continue</button>
        </div>
      </div>
    ));
  }

  if (step === 2) {
    return shell(2, "Who's in your household?", "Add everyone who shares finances with you. Flying solo? You can skip this step.", (
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div style={{ display: "flex", gap: "8px" }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>{editingMember ? `Editing — ${editingMember.name}` : "Name"}</label>
            <input
              style={inputStyle}
              type="text"
              placeholder="Alex"
              value={memberName}
              onChange={(e) => { setMemberName(e.target.value); setMemberError(null); }}
              onKeyDown={(e) => e.key === "Enter" && (editingMember ? updateMember() : addMember())}
              autoFocus
            />
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: "8px" }}>
            <button style={addBtn} onClick={editingMember ? updateMember : addMember}>
              {editingMember ? "Save" : "+ Add"}
            </button>
            {editingMember && (
              <button style={ghostBtn} onClick={() => { setEditingMember(null); setMemberName(""); setMemberError(null); }}>
                Cancel
              </button>
            )}
          </div>
        </div>

        {memberError && (
          <div style={{ fontSize: "13px", color: "#F87171", background: "rgba(248,113,113,0.08)", padding: "10px 14px", borderRadius: "8px", border: "1px solid rgba(248,113,113,0.2)" }}>
            {memberError}
          </div>
        )}

        {memberList.length > 0 && (
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "12px", display: "flex", flexDirection: "column", gap: "2px" }}>
            {memberList.map((member, i) => (
              <div key={member.id || i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <div>
                  <div style={{ fontSize: "14px", color: "#F0F6FC", fontWeight: "500" }}>{member.name}</div>
                  <div style={{ fontSize: "11px", color: "#8B8FA8", marginTop: "2px", textTransform: "capitalize" }}>{member.role}</div>
                </div>
                <div style={{ display: "flex", gap: "6px" }}>
                  <button style={ghostBtn} onClick={() => { setEditingMember(member); setMemberName(member.name); setMemberError(null); }}>Edit</button>
                  <button
                    style={{ ...ghostBtn, color: "#F87171", borderColor: "rgba(248,113,113,0.2)" }}
                    onClick={() => deleteMember(member)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px" }}>
          <button style={ghostBtn} onClick={() => setStep(1)}>Back</button>
          <button style={primaryBtn} onClick={() => setStep(3)}>Continue</button>
        </div>
      </div>
    ));
  }

  const selectStyle = { ...inputStyle, cursor: "pointer" };
  const checkRowStyle = { display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", padding: "10px 14px", background: "rgba(255,255,255,0.03)", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.06)" };
  const checkLabelStyle = { fontSize: "13px", color: "#F0F6FC", cursor: "pointer" };

  if (step === 3) {
    const n = carouselCards.length;
    const CARD_W = 320;
    const GAP = 20;
    const CONTAINER_W = 520;
    const slideX = CONTAINER_W / 2 - (activeIndex * (CARD_W + GAP) + CARD_W / 2);

    const cardInput = { ...inputStyle, fontSize: "13px", padding: "8px 12px" };
    const cardLabel = { ...labelStyle, fontSize: "10px", marginBottom: "4px" };
    const arrowStyle = {
      position: "absolute", top: "50%", transform: "translateY(-50%)", zIndex: 3,
      width: "34px", height: "34px", borderRadius: "50%",
      background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.14)",
      color: "#F0F6FC", cursor: "pointer", fontSize: "20px", lineHeight: 1,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Inter', sans-serif",
    };

    return shell(3, "Set up your accounts", "Fill out a card for each account. Hit Add Account to keep going.", (
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

        {/* Slider */}
        <div style={{ position: "relative", width: `${CONTAINER_W}px`, margin: "0 auto" }}>
          {/* Fade overlays */}
          <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "72px", background: "linear-gradient(to right, #1A1826 25%, transparent)", pointerEvents: "none", zIndex: 2 }} />
          <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: "72px", background: "linear-gradient(to left, #1A1826 25%, transparent)", pointerEvents: "none", zIndex: 2 }} />

          {/* Arrows */}
          {activeIndex > 0 && (
            <button style={{ ...arrowStyle, left: "10px" }} onClick={() => setActiveIndex(i => i - 1)}>‹</button>
          )}
          {activeIndex < n - 1 && (
            <button style={{ ...arrowStyle, right: "10px" }} onClick={() => setActiveIndex(i => i + 1)}>›</button>
          )}

          {/* Track */}
          <div style={{ overflow: "hidden" }}>
            <div style={{
              display: "flex", gap: `${GAP}px`,
              transform: `translateX(${slideX}px)`,
              transition: "transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
            }}>
              {carouselCards.map((card, index) => {
                const isActive = index === activeIndex;

                if (card.saved) {
                  return (
                    <div key={index} style={{
                      width: `${CARD_W}px`, flexShrink: 0,
                      background: "rgba(0,212,170,0.05)",
                      border: `1px solid ${isActive ? "rgba(0,212,170,0.4)" : "rgba(0,212,170,0.15)"}`,
                      borderRadius: "12px", padding: "20px",
                      display: "flex", flexDirection: "column", gap: "10px",
                      opacity: isActive ? 1 : 0.5,
                      transition: "opacity 0.3s ease",
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <div style={{ width: "22px", height: "22px", borderRadius: "50%", background: "#00D4AA", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <span style={{ fontSize: "11px", color: "#0F1218", fontWeight: "700" }}>✓</span>
                          </div>
                          <span style={{ fontSize: "11px", color: "#00D4AA", fontWeight: "600", letterSpacing: "0.06em", textTransform: "uppercase" }}>Saved</span>
                        </div>
                        <button style={{ ...ghostBtn, padding: "3px 10px", fontSize: "11px" }} onClick={() => { setActiveIndex(index); updateCard(index, { saved: false }); }}>Edit</button>
                      </div>
                      <div style={{ fontSize: "18px", fontWeight: "600", color: "#F0F6FC" }}>{card.accountName}</div>
                      {card.bankName && <div style={{ fontSize: "13px", color: "#8B8FA8" }}>{card.bankName}{card.lastFour ? ` · ${card.lastFour}` : ""}</div>}
                      <div style={{ fontSize: "13px", color: "#8B8FA8", textTransform: "capitalize" }}>{card.accountType}</div>
                      {card.currentBalance !== "" && (
                        <div style={{ fontSize: "20px", color: "#00D4AA", fontWeight: "700", marginTop: "4px" }}>
                          ${parseFloat(card.currentBalance || 0).toLocaleString()}
                        </div>
                      )}
                      {card.isPrimary && <div style={{ fontSize: "10px", color: "#6C63FF", fontWeight: "700", letterSpacing: "0.08em", textTransform: "uppercase" }}>Primary</div>}
                    </div>
                  );
                }

                return (
                  <div key={index} style={{
                    width: `${CARD_W}px`, flexShrink: 0,
                    background: "rgba(255,255,255,0.03)",
                    border: `1px solid ${isActive ? "rgba(108,99,255,0.4)" : "rgba(108,99,255,0.15)"}`,
                    borderRadius: "12px", padding: "20px",
                    display: "flex", flexDirection: "column", gap: "12px",
                    opacity: isActive ? 1 : 0.4,
                    transition: "opacity 0.3s ease",
                  }}>
                    <div style={{ fontSize: "11px", color: "#6C63FF", fontWeight: "700", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                      Account {index + 1}
                    </div>
                    <div>
                      <label style={cardLabel}>Name</label>
                      <input style={cardInput} type="text" placeholder="Joint Checking" value={card.accountName} onChange={(e) => updateCard(index, { accountName: e.target.value })} autoFocus={isActive} />
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <div style={{ flex: 2 }}>
                        <label style={cardLabel}>Bank</label>
                        <input style={cardInput} type="text" placeholder="USAA" value={card.bankName} onChange={(e) => updateCard(index, { bankName: e.target.value })} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={cardLabel}>Last 4</label>
                        <input style={cardInput} type="text" placeholder="0000" maxLength={4} value={card.lastFour} onChange={(e) => updateCard(index, { lastFour: e.target.value })} />
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <div style={{ flex: 1 }}>
                        <label style={cardLabel}>Type</label>
                        <select style={{ ...cardInput, cursor: "pointer" }} value={card.accountType} onChange={(e) => updateCard(index, { accountType: e.target.value })}>
                          <option value="checking">Checking</option>
                          <option value="savings">Savings</option>
                        </select>
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={cardLabel}>Balance</label>
                        <input style={cardInput} type="number" placeholder="0.00" value={card.currentBalance} onChange={(e) => updateCard(index, { currentBalance: e.target.value })} />
                      </div>
                    </div>
                    <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                      <input type="checkbox" checked={card.isPrimary} onChange={(e) => updateCard(index, { isPrimary: e.target.checked })} />
                      <span style={{ fontSize: "12px", color: "#8B8FA8" }}>Primary account</span>
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                      <input type="checkbox" checked={card.isAccumulating} onChange={(e) => updateCard(index, { isAccumulating: e.target.checked })} />
                      <span style={{ fontSize: "12px", color: "#8B8FA8" }}>Accumulating</span>
                    </label>
                    {card.isAccumulating && (
                      <div>
                        <label style={cardLabel}>Target Amount</label>
                        <input style={cardInput} type="number" placeholder="0.00" value={card.accumulationTarget} onChange={(e) => updateCard(index, { accumulationTarget: e.target.value })} />
                      </div>
                    )}
                    {card.error && (
                      <div style={{ fontSize: "12px", color: "#F87171", background: "rgba(248,113,113,0.08)", padding: "8px 12px", borderRadius: "6px" }}>
                        {card.error}
                      </div>
                    )}
                    <button
                      style={{ ...addBtn, width: "100%", marginTop: "auto", opacity: card.loading ? 0.6 : 1 }}
                      onClick={() => saveCard(index)}
                      disabled={card.loading}
                    >
                      {card.loading ? "Saving..." : "+ Add Account"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Dot indicators */}
        {n > 1 && (
          <div style={{ display: "flex", justifyContent: "center", gap: "6px" }}>
            {carouselCards.map((_, i) => (
              <div
                key={i}
                onClick={() => setActiveIndex(i)}
                style={{
                  width: i === activeIndex ? "20px" : "6px", height: "6px",
                  borderRadius: "3px", cursor: "pointer",
                  background: i === activeIndex ? "#6C63FF" : "rgba(255,255,255,0.2)",
                  transition: "width 0.3s ease, background 0.3s ease",
                }}
              />
            ))}
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <button style={ghostBtn} onClick={() => setStep(2)}>Back</button>
          <button style={primaryBtn} onClick={() => setStep(4)} disabled={accountList.length === 0}>Continue</button>
        </div>
      </div>
    ), "660px");
  }

  if (step === 4) {
    return shell(4, "Add your income", "Add each income source. You can always add more from the dashboard.", (
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={labelStyle}>Income Name</label>
            <input style={inputStyle} type="text" placeholder="e.g. VA Disability" value={incomeName} onChange={(e) => setIncomeName(e.target.value)} autoFocus />
          </div>
          <div>
            <label style={labelStyle}>Who is this for?</label>
            <select style={selectStyle} value={incomeOwner} onChange={(e) => setIncomeOwner(e.target.value)}>
              <option value="">Select</option>
              <option value="joint">Joint</option>
              {memberList.map((m, i) => <option key={i} value={m.name}>{m.name}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Type</label>
            <select style={selectStyle} value={incomeType} onChange={(e) => setIncomeType(e.target.value)}>
              <option value="salary">Salary</option>
              <option value="hourly">Hourly</option>
              <option value="benefits">Benefits</option>
              <option value="fixed">Fixed</option>
              <option value="variable">Variable/Commission</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Frequency</label>
            <select style={selectStyle} value={incomeFrequency} onChange={(e) => setIncomeFrequency(e.target.value)}>
              <option value="biweekly">Biweekly</option>
              <option value="monthly">Monthly</option>
              <option value="weekly">Weekly</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Deposits Into</label>
            <select style={selectStyle} value={depositAccountId} onChange={(e) => setDepositAccountId(e.target.value)}>
              <option value="">Select account</option>
              {accountList.map((a, i) => <option key={i} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Next Deposit Date</label>
            <input style={inputStyle} type="date" value={nextPayDate} onChange={(e) => setNextPayDate(e.target.value)} />
          </div>
        </div>

        {incomeType !== "variable" && (
          <div style={{ padding: "16px", background: "rgba(255,255,255,0.03)", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.06)" }}>
            {incomeEntryMode === "" ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <div style={{ fontSize: "12px", color: "#8B8FA8", marginBottom: "4px" }}>How would you like to enter your income?</div>
                <label style={{ ...checkRowStyle, background: "none", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <input type="radio" name="incomeMode" onChange={() => setIncomeEntryMode("net")} />
                  <span style={checkLabelStyle}>After-tax — enter what hits my bank</span>
                </label>
                <label style={{ ...checkRowStyle, background: "none", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <input type="radio" name="incomeMode" onChange={() => setIncomeEntryMode("gross")} />
                  <span style={checkLabelStyle}>Gross — app will calculate take-home</span>
                </label>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "12px", color: "#8B8FA8" }}>{incomeEntryMode === "net" ? "After-tax" : "Gross pay"}</span>
                  <button style={{ ...ghostBtn, padding: "3px 10px", fontSize: "11px" }} onClick={() => setIncomeEntryMode("")}>Change</button>
                </div>
                {incomeEntryMode === "net" && (
                  <div>
                    <label style={labelStyle}>Amount Deposited</label>
                    <input style={inputStyle} type="number" placeholder="0.00" value={fixedAmount} onChange={(e) => setFixedAmount(e.target.value)} />
                  </div>
                )}
                {incomeEntryMode === "gross" && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <div>
                      <label style={labelStyle}>Gross Amount</label>
                      <input style={inputStyle} type="number" placeholder="0.00" value={fixedAmount} onChange={(e) => setFixedAmount(e.target.value)} />
                    </div>
                    <div>
                      <label style={labelStyle}>Tax Rate (%)</label>
                      <input style={inputStyle} type="number" placeholder="e.g. 20" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {incomeType === "variable" && (
          <div>
            <label style={labelStyle}>Estimated Amount</label>
            <input style={inputStyle} type="number" placeholder="0.00" value={fixedAmount} onChange={(e) => setFixedAmount(e.target.value)} />
          </div>
        )}

        {incomeType === "hourly" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
            <div><label style={labelStyle}>Hourly Rate</label><input style={inputStyle} type="number" placeholder="0.00" value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value)} /></div>
            <div><label style={labelStyle}>Hours/Week</label><input style={inputStyle} type="number" placeholder="40" value={hoursPerWeek} onChange={(e) => setHoursPerWeek(e.target.value)} /></div>
            <div><label style={labelStyle}>OT Rate</label><input style={inputStyle} type="number" placeholder="0.00" value={overtimeRate} onChange={(e) => setOvertimeRate(e.target.value)} /></div>
          </div>
        )}

        <button style={addBtn} onClick={editingIncome ? updateIncome : addIncome}>{editingIncome ? "Save Changes" : "+ Add Income"}</button>

        {incomeList.length > 0 && (
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "12px" }}>
            {incomeList.map((inc, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <div>
                  <div style={{ fontSize: "14px", color: "#F0F6FC", fontWeight: "500" }}>{inc.name}</div>
                  <div style={{ fontSize: "11px", color: "#8B8FA8", marginTop: "2px" }}>{inc.owner} · {inc.frequency} · ${inc.fixed_amount || inc.hourly_rate + "/hr"}</div>
                </div>
                <button style={ghostBtn} onClick={() => { setEditingIncome(inc); setIncomeName(inc.name); setIncomeOwner(inc.owner || ""); setIncomeType(inc.type); setIncomeFrequency(inc.frequency); setFixedAmount(inc.fixed_amount || ""); setHourlyRate(inc.hourly_rate || ""); setHoursPerWeek(inc.hours_per_week || ""); setOvertimeRate(inc.overtime_rate || ""); setTaxRate(inc.tax_rate || ""); setNextPayDate(inc.next_pay_date || ""); setDepositAccountId(inc.deposit_account_id || ""); setIncomeEntryMode("net"); }}>Edit</button>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px" }}>
          <button style={ghostBtn} onClick={() => setStep(3)}>Back</button>
          <button style={primaryBtn} onClick={async () => { if (incomeName && fixedAmount) await addIncome(); setStep(5); }} disabled={incomeList.length === 0 && !incomeName}>Continue</button>
        </div>
      </div>
    ));
  }

  if (step === 5) {
    return shell(5, "Add your bills", "Add your recurring monthly bills. Slate will use these to calculate your pay period budget.", (
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={labelStyle}>Bill Name</label>
            <input style={inputStyle} type="text" placeholder="e.g. Mortgage" value={billName} onChange={(e) => setBillName(e.target.value)} autoFocus />
          </div>
          <div>
            <label style={labelStyle}>Amount</label>
            <input style={inputStyle} type="number" placeholder="0.00" value={billAmount} onChange={(e) => setBillAmount(e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Due Day of Month</label>
            <input style={inputStyle} type="number" placeholder="e.g. 1" min="1" max="31" value={dueDay} onChange={(e) => setDueDay(e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Category</label>
            <select style={selectStyle} value={billCategory} onChange={(e) => setBillCategory(e.target.value)}>
              <option value="">Select category</option>
              <option value="Housing">Housing</option>
              <option value="Utilities">Utilities</option>
              <option value="Insurance">Insurance</option>
              <option value="Subscriptions">Subscriptions</option>
              <option value="Loans">Loans</option>
              <option value="Transportation">Transportation</option>
              <option value="Food & Gas">Food & Gas</option>
              <option value="Savings">Savings</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Payment Method</label>
            <select style={selectStyle} value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
              <option value="auto">Auto</option>
              <option value="transfer">Transfer</option>
              <option value="zelle">Zelle</option>
              <option value="check">Check</option>
              <option value="manual">Manual</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Owner</label>
            <select style={selectStyle} value={billOwner} onChange={(e) => setBillOwner(e.target.value)}>
              <option value="joint">Joint</option>
              {memberList.map((m, i) => <option key={i} value={m.name}>{m.name}</option>)}
            </select>
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={labelStyle}>Paid From Account</label>
            <select style={selectStyle} value={billAccountId} onChange={(e) => setBillAccountId(e.target.value)}>
              <option value="">Select account</option>
              {accountList.map((a, i) => <option key={i} value={a.id}>{a.name}</option>)}
            </select>
          </div>
        </div>

        <label style={checkRowStyle}>
          <input type="checkbox" checked={isVariable} onChange={(e) => setIsVariable(e.target.checked)} />
          <span style={checkLabelStyle}>This bill varies month to month</span>
        </label>

        <button style={addBtn} onClick={editingBill ? updateBill : addBill}>{editingBill ? "Save Changes" : "+ Add Bill"}</button>

        {billList.length > 0 && (
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "12px" }}>
            {billList.map((bill, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <div>
                  <div style={{ fontSize: "14px", color: "#F0F6FC", fontWeight: "500" }}>{bill.name}</div>
                  <div style={{ fontSize: "11px", color: "#8B8FA8", marginTop: "2px" }}>${bill.amount} · Due the {bill.due_day}{bill.due_day === 1 ? "st" : bill.due_day === 2 ? "nd" : bill.due_day === 3 ? "rd" : "th"} · {bill.category}</div>
                </div>
                <button style={ghostBtn} onClick={() => { setEditingBill(bill); setBillName(bill.name); setBillAmount(bill.amount); setDueDay(bill.due_day); setPaymentMethod(bill.payment_method); setBillCategory(bill.category); setBillOwner(bill.owner); setBillAccountId(bill.account_id || ""); setIsVariable(bill.is_variable); }}>Edit</button>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px" }}>
          <button style={ghostBtn} onClick={() => setStep(4)}>Back</button>
          <button style={{ ...primaryBtn, background: "#00D4AA", color: "#0F1218" }} onClick={async () => {
            if (billName && billAmount && dueDay) await addBill();
            const periods = calculatePayPeriods();
            await savePayPeriods(periods);
            await saveDefaultCategories(householdId);
            onComplete();
          }}>
            Finish Setup
          </button>
        </div>
      </div>
    ));
  }

  return null;
}

export default Onboarding;
