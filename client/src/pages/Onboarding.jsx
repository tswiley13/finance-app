import { useState, useEffect } from "react";
import { usePlaidLink } from "react-plaid-link";
import { supabase } from "../supabase";

function PlaidLinkOpener({ token, onSuccess, onExit }) {
  const { open, ready } = usePlaidLink({ token, onSuccess, onExit });
  useEffect(() => { if (ready) open(); }, [ready, open]);
  return null;
}

function PlaidConnectButton({ userId, onSuccess }) {
  const [linkToken, setLinkToken] = useState(null);
  const [fetching, setFetching] = useState(false);
  const [plaidError, setPlaidError] = useState(null);

  async function fetchLinkToken() {
    setFetching(true);
    setPlaidError(null);
    try {
      const { data, error } = await supabase.functions.invoke("plaid-create-link-token", {
        body: { user_id: userId },
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
    await supabase.functions.invoke("plaid-exchange-token", {
      body: { public_token, institution_name: metadata.institution?.name, accounts: metadata.accounts },
    });
    setLinkToken(null);
    setFetching(false);
    onSuccess();
  }

  function handleExit() { setLinkToken(null); setFetching(false); }

  return (
    <div>
      {linkToken && <PlaidLinkOpener token={linkToken} onSuccess={handleSuccess} onExit={handleExit} />}
      <button
        onClick={fetchLinkToken}
        disabled={fetching}
        style={{ background: fetching ? "rgba(108,99,255,0.1)" : "none", border: "1px solid rgba(108,99,255,0.5)", color: "#6C63FF", padding: "10px 20px", borderRadius: "8px", cursor: fetching ? "not-allowed" : "pointer", fontSize: "13px", fontWeight: "600", fontFamily: "'Inter', sans-serif", width: "100%" }}
      >
        {fetching ? "Connecting..." : "+ Connect Bank"}
      </button>
      {plaidError && <div style={{ fontSize: "12px", color: "#F87171", marginTop: "8px" }}>{plaidError}</div>}
    </div>
  );
}

function Onboarding({ onComplete }) {
  const [step, setStep] = useState(null);
  const [userId, setUserId] = useState(null);
  const [householdId, setHouseholdId] = useState(null);
  const [accountError, setAccountError] = useState(null);
  const [householdName, setHouseholdName] = useState("");
  const [yourName, setYourName] = useState("");
  const [memberList, setMemberList] = useState([]);
  const [memberName, setMemberName] = useState("");
  const [memberError, setMemberError] = useState(null);
  const [editingMember, setEditingMember] = useState(null);
  const [incomeList, setIncomeList] = useState([]);
  const [incomeError, setIncomeError] = useState(null);
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
  const [incomeActiveIndex, setIncomeActiveIndex] = useState(0);
  const [incomeCards, setIncomeCards] = useState([{
    saved: false, id: null, error: null, loading: false,
    incomeName: "", incomeOwner: "", incomeType: "salary",
    incomeFrequency: "biweekly", depositAccountId: "",
    nextPayDate: "", incomeEntryMode: "",
    fixedAmount: "", hourlyRate: "", hoursPerWeek: "", overtimeRate: "", taxRate: "",
  }]);
  const [carouselCards, setCarouselCards] = useState([{
    saved: false, id: null, error: null, loading: false,
    accountName: "", bankName: "", lastFour: "",
    accountType: "checking", currentBalance: "",
    isPrimary: false, isAccumulating: false,
    accumulationTarget: "", accDueDay: "", resetType: "manual", resetDay: "",
  }]);
  const [billList, setBillList] = useState([]);
  const [billName, setBillName] = useState("");
  const [billAmount, setBillAmount] = useState("");
  const [dueDay, setDueDay] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [billCategory, setBillCategory] = useState("");
  const [billOwner, setBillOwner] = useState("joint");
  const [billAccountId, setBillAccountId] = useState("");
  const [isVariable, setIsVariable] = useState(false);
  const [isBillAccumulating, setIsBillAccumulating] = useState(false);
  const [billTransferToAccountId, setBillTransferToAccountId] = useState("");
  const [billFrequency, setBillFrequency] = useState("");
  const [billDueDay2, setBillDueDay2] = useState("");
  const [editingBill, setEditingBill] = useState(null);
  const [billError, setBillError] = useState(null);
  const [debtList, setDebtList] = useState([]);
  const [debtName, setDebtName] = useState("");
  const [debtOwner, setDebtOwner] = useState("joint");
  const [debtCategory, setDebtCategory] = useState("Credit Card");
  const [debtBalance, setDebtBalance] = useState("");
  const [debtInterestRate, setDebtInterestRate] = useState("");
  const [debtMinPayment, setDebtMinPayment] = useState("");
  const [debtPayoffOrder, setDebtPayoffOrder] = useState("");
  const [editingDebt, setEditingDebt] = useState(null);
  const [debtError, setDebtError] = useState(null);
  const [payPeriodList, setPayPeriodList] = useState([]);
  const [depositAccountId, setDepositAccountId] = useState("");
  useEffect(() => {
    async function checkResume() {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user.id);

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

      const { data: existingDebts } = await supabase
        .from("debts")
        .select("*")
        .eq("household_id", household.id);
      setDebtList(existingDebts || []);
      setStep(6);
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

    // Auto-add creator to household_members so dashboard can find them
    await supabase.from("household_members").insert({
      household_id: created.id,
      user_id: user.id,
      name: yourName.trim() || user.user_metadata?.name || user.email,
      role: "owner",
    });

    // Seed default categories
    await supabase.from("categories").insert([
      { household_id: created.id, name: "Housing" },
      { household_id: created.id, name: "Utilities" },
      { household_id: created.id, name: "Insurance" },
      { household_id: created.id, name: "Subscriptions" },
      { household_id: created.id, name: "Transportation" },
      { household_id: created.id, name: "Food" },
      { household_id: created.id, name: "Health" },
      { household_id: created.id, name: "Debt" },
      { household_id: created.id, name: "Personal" },
      { household_id: created.id, name: "Other" },
    ]);

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

  function blankIncomeCard() {
    return {
      saved: false, id: null, error: null, loading: false,
      incomeName: "", incomeOwner: "", incomeType: "salary",
      incomeFrequency: "biweekly", depositAccountId: "",
      nextPayDate: "", incomeEntryMode: "",
      fixedAmount: "", hourlyRate: "", hoursPerWeek: "", overtimeRate: "", taxRate: "",
    };
  }

  function updateIncomeCard(index, fields) {
    setIncomeCards(prev => prev.map((c, i) => i === index ? { ...c, ...fields } : c));
  }

  async function saveIncomeCard(index) {
    const card = incomeCards[index];
    if (!card.incomeName.trim()) {
      updateIncomeCard(index, { error: "Please enter an income name." });
      return false;
    }
    if (!householdId) {
      updateIncomeCard(index, { error: "Could not find your household." });
      return false;
    }
    updateIncomeCard(index, { loading: true, error: null });

    const payload = {
      household_id: householdId,
      name: card.incomeName.trim(),
      owner: card.incomeOwner || null,
      type: card.incomeType,
      frequency: card.incomeFrequency,
      deposit_account_id: card.depositAccountId || null,
      next_pay_date: card.nextPayDate || null,
      fixed_amount: card.incomeType !== "hourly" ? (parseFloat(card.fixedAmount) || null) : null,
      hourly_rate: card.incomeType === "hourly" ? (parseFloat(card.hourlyRate) || null) : null,
      hours_per_week: card.incomeType === "hourly" ? (parseFloat(card.hoursPerWeek) || null) : null,
      overtime_rate: card.incomeType === "hourly" ? (parseFloat(card.overtimeRate) || null) : null,
      tax_rate: card.taxRate ? parseFloat(card.taxRate) : null,
      is_active: true,
    };

    if (card.id) {
      const { error } = await supabase.from("income").update(payload).eq("id", card.id);
      if (error) { updateIncomeCard(index, { loading: false, error: error.message }); return false; }
      setIncomeList(prev => prev.map(i => i.id === card.id ? { ...i, ...payload } : i));
      updateIncomeCard(index, { loading: false, saved: true });
    } else {
      const { data: saved, error } = await supabase.from("income").insert(payload).select().single();
      if (error) { updateIncomeCard(index, { loading: false, error: error.message }); return false; }
      setIncomeList(prev => [...prev, saved]);
      const newCardIndex = incomeCards.length;
      setIncomeCards(prev => [
        ...prev.map((c, i) => i === index ? { ...c, loading: false, saved: true, id: saved.id } : c),
        blankIncomeCard(),
      ]);
      setIncomeActiveIndex(newCardIndex);
    }
    return true;
  }

  async function deleteIncomeCard(index) {
    const card = incomeCards[index];
    if (card.id) {
      const { error } = await supabase.from("income").delete().eq("id", card.id);
      if (error) { updateIncomeCard(index, { error: error.message }); return; }
      setIncomeList(prev => prev.filter(i => i.id !== card.id));
    }
    setIncomeCards(prev => {
      const next = prev.filter((_, i) => i !== index);
      return next.length === 0 ? [blankIncomeCard()] : next;
    });
    setIncomeActiveIndex(prev => Math.min(prev, Math.max(0, incomeCards.length - 2)));
  }

  function resetIncomeForm() {
    setIncomeName("");
    setIncomeOwner("");
    setFixedAmount("");
    setHourlyRate("");
    setHoursPerWeek("");
    setOvertimeRate("");
    setTaxRate("");
    setNextPayDate("");
    setDepositAccountId("");
    setIncomeEntryMode("");
    setEditingIncome(null);
    setIncomeError(null);
  }

  async function addIncome() {
    if (!incomeName.trim()) {
      setIncomeError("Please enter an income name.");
      return;
    }
    if (!householdId) {
      setIncomeError("Could not find your household. Try going back to step 1.");
      return;
    }
    setIncomeError(null);

    const payload = {
      household_id: householdId,
      name: incomeName.trim(),
      owner: incomeOwner,
      type: incomeType,
      deposit_account_id: depositAccountId || null,
      frequency: incomeFrequency,
      fixed_amount: incomeType !== "hourly" ? (parseFloat(fixedAmount) || null) : null,
      hourly_rate: incomeType === "hourly" ? (parseFloat(hourlyRate) || null) : null,
      hours_per_week: incomeType === "hourly" ? (parseFloat(hoursPerWeek) || null) : null,
      overtime_rate: incomeType === "hourly" ? (parseFloat(overtimeRate) || null) : null,
      tax_rate: taxRate ? parseFloat(taxRate) : null,
      next_pay_date: nextPayDate || null,
      is_active: true,
    };

    const { data: saved, error } = await supabase.from("income").insert(payload).select().single();

    if (error) {
      setIncomeError(error.message);
      return;
    }

    setIncomeList([...incomeList, saved]);
    resetIncomeForm();
  }

  async function deleteIncome(inc) {
    const { error } = await supabase.from("income").delete().eq("id", inc.id);
    if (error) { setIncomeError(error.message); return; }
    setIncomeList(incomeList.filter((i) => i.id !== inc.id));
    if (editingIncome?.id === inc.id) resetIncomeForm();
  }

  async function updateIncome() {
    if (!incomeName.trim()) {
      setIncomeError("Please enter an income name.");
      return;
    }
    setIncomeError(null);

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
      setIncomeError(error.message);
      return;
    }

    setIncomeList(incomeList.map((i) =>
      i.id === editingIncome.id
        ? { ...i, name: incomeName, owner: incomeOwner, type: incomeType, frequency: incomeFrequency, fixed_amount: parseFloat(fixedAmount) || null, next_pay_date: nextPayDate, deposit_account_id: depositAccountId || null }
        : i,
    ));
    resetIncomeForm();
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
      accumulationTarget: "", accDueDay: "", resetType: "manual", resetDay: "",
    };
  }

  function updateCard(index, fields) {
    setCarouselCards(prev => prev.map((c, i) => i === index ? { ...c, ...fields } : c));
  }

  async function saveCard(index) {
    const card = carouselCards[index];
    if (!card.accountName) {
      updateCard(index, { error: "Account name is required." });
      return false;
    }
    if (card.lastFour && !/^\d{4}$/.test(card.lastFour)) {
      updateCard(index, { error: "Last 4 must be exactly 4 digits." });
      return false;
    }
    if (card.isAccumulating && (!card.accumulationTarget || !card.accDueDay)) {
      updateCard(index, { error: "Saving accounts require a savings target and due day of month." });
      return false;
    }

    updateCard(index, { loading: true, error: null });

    if (!householdId) {
      updateCard(index, { loading: false, error: "Could not find your household." });
      return false;
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
      due_day: card.isAccumulating && card.accDueDay ? parseInt(card.accDueDay) : null,
      reset_type: card.resetType,
      reset_day: card.resetDay ? parseInt(card.resetDay) : null,
    };

    if (card.id) {
      const { error } = await supabase.from("accounts").update(payload).eq("id", card.id);
      if (error) { updateCard(index, { loading: false, error: error.message }); return false; }
      setAccountList(prev => prev.map(a => a.id === card.id ? { ...a, ...payload } : a));
      updateCard(index, { loading: false, saved: true });
    } else {
      const { data: savedAccount, error } = await supabase
        .from("accounts").insert(payload).select().single();
      if (error) { updateCard(index, { loading: false, error: error.message }); return false; }
      const newCardIndex = carouselCards.length;
      setAccountList(prev => [...prev, savedAccount]);
      setCarouselCards(prev => [
        ...prev.map((c, i) => i === index ? { ...c, loading: false, saved: true, id: savedAccount.id } : c),
        blankCard(),
      ]);
      setActiveIndex(newCardIndex);
    }
    return true;
  }

  async function addBill() {
    setBillError(null);
    const isPayday = (billFrequency || "monthly") === "payday";
    if (!billName) { setBillError("Please enter a bill name."); return; }
    if (!billAmount) { setBillError("Please enter a bill amount."); return; }
    if (!isPayday && !dueDay) { setBillError("Please enter a due day."); return; }
    if (!billCategory) { setBillError("Please select a category."); return; }
    if (!billAccountId) { setBillError("Please select which account this bill comes from."); return; }

    const newBill = {
      household_id: householdId,
      name: billName,
      amount: parseFloat(billAmount),
      due_day: isPayday ? 0 : parseInt(dueDay),
      payment_method: paymentMethod,
      category: billCategory,
      owner: billOwner,
      account_id: billAccountId || null,
      transfer_to_account_id: isBillAccumulating ? (billTransferToAccountId || null) : null,
      is_variable: isVariable,
      frequency: billFrequency || "monthly",
      due_day_2: (billFrequency || "monthly") === "semi-monthly" && billDueDay2 ? parseInt(billDueDay2) : null,
      is_active: true,
      is_paid: false,
    };

    const { data: savedBill, error } = await supabase
      .from("bills")
      .insert(newBill)
      .select()
      .single();

    if (error) { setBillError(error.message); return false; }

    setBillList([...billList, savedBill]);
    setBillName("");
    setBillAmount("");
    setDueDay("");
    setPaymentMethod("");
    setBillCategory("");
    setBillOwner("joint");
    setBillAccountId("");
    setIsVariable(false);
    setIsBillAccumulating(false);
    setBillTransferToAccountId("");
    setBillFrequency("");
    setBillDueDay2("");
    return true;
  }

  async function updateBill() {
    setBillError(null);
    const isPaydayEdit = (billFrequency || "monthly") === "payday";
    if (!billName) { setBillError("Please enter a bill name."); return; }
    if (!billAmount) { setBillError("Please enter a bill amount."); return; }
    if (!isPaydayEdit && !dueDay) { setBillError("Please enter a due day."); return; }
    if (!billCategory) { setBillError("Please select a category."); return; }
    if (!billAccountId) { setBillError("Please select which account this bill comes from."); return; }

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
        transfer_to_account_id: isBillAccumulating ? (billTransferToAccountId || null) : null,
        is_variable: isVariable,
        frequency: billFrequency,
        due_day_2: billFrequency === "semi-monthly" && billDueDay2 ? parseInt(billDueDay2) : null,
      })
      .eq("id", editingBill.id);

    if (error) { setBillError(error.message); return; }

    setBillList(
      billList.map((b) =>
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
              is_variable: isVariable,
              frequency: billFrequency,
              due_day_2: billFrequency === "semi-monthly" && billDueDay2 ? parseInt(billDueDay2) : null,
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
    setIsVariable(false);
    setIsBillAccumulating(false);
    setBillTransferToAccountId("");
    setBillFrequency("");
    setBillDueDay2("");
  }

  function resetDebtForm() {
    setDebtName(""); setDebtOwner("joint"); setDebtCategory("Credit Card");
    setDebtBalance(""); setDebtInterestRate(""); setDebtMinPayment("");
    setDebtPayoffOrder(""); setEditingDebt(null); setDebtError(null);
  }

  async function addDebt() {
    setDebtError(null);
    if (!debtName) { setDebtError("Please enter a debt name."); return false; }
    if (!debtBalance) { setDebtError("Please enter the current balance."); return false; }
    if (!debtMinPayment) { setDebtError("Please enter the minimum payment."); return false; }

    const { data: saved, error } = await supabase.from("debts").insert({
      household_id: householdId,
      name: debtName,
      owner: debtOwner,
      category: debtCategory,
      balance: parseFloat(debtBalance),
      interest_rate: debtInterestRate ? parseFloat(debtInterestRate) / 100 : null,
      minimum_payment: parseFloat(debtMinPayment),
      payoff_order: debtPayoffOrder ? parseInt(debtPayoffOrder) : null,
      is_paid_off: false,
    }).select().single();

    if (error) { setDebtError(error.message); return false; }
    setDebtList([...debtList, saved]);
    resetDebtForm();
    return true;
  }

  async function updateDebt() {
    setDebtError(null);
    if (!debtName) { setDebtError("Please enter a debt name."); return; }
    if (!debtBalance) { setDebtError("Please enter the current balance."); return; }
    if (!debtMinPayment) { setDebtError("Please enter the minimum payment."); return; }

    const { error } = await supabase.from("debts").update({
      name: debtName,
      owner: debtOwner,
      category: debtCategory,
      balance: parseFloat(debtBalance),
      interest_rate: debtInterestRate ? parseFloat(debtInterestRate) / 100 : null,
      minimum_payment: parseFloat(debtMinPayment),
      payoff_order: debtPayoffOrder ? parseInt(debtPayoffOrder) : null,
    }).eq("id", editingDebt.id);

    if (error) { setDebtError(error.message); return; }
    setDebtList(debtList.map((d) => d.id === editingDebt.id ? {
      ...d, name: debtName, owner: debtOwner, category: debtCategory,
      balance: parseFloat(debtBalance),
      interest_rate: debtInterestRate ? parseFloat(debtInterestRate) / 100 : null,
      minimum_payment: parseFloat(debtMinPayment),
      payoff_order: debtPayoffOrder ? parseInt(debtPayoffOrder) : null,
    } : d));
    resetDebtForm();
  }

  function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  function calculatePayPeriods(incomeData) {
    const paychecks = (incomeData || incomeList).filter((i) => i.frequency !== "monthly");

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Generate occurrences forward and backward to cover today + ~4 months ahead
    const allDates = [];
    paychecks.forEach((income) => {
      const baseDate = new Date(income.next_pay_date);
      // Go back enough periods to cover today
      const daysUntilNext = Math.ceil((baseDate - today) / (1000 * 60 * 60 * 24));
      const periodsBack = Math.ceil(daysUntilNext / 14) + 1;
      const startOffset = -periodsBack;
      for (let i = startOffset; i < 8; i++) {
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
        <style>{`
          @media (max-width: 640px) {
            .onboarding-shell-card { padding: 24px 16px !important; border-radius: 12px !important; }
          }
        `}</style>
        <div style={{ marginBottom: "28px", textAlign: "center" }}>
          <div style={{ fontSize: "28px", fontWeight: "900", letterSpacing: "0.12em", color: "#F0F6FC", textTransform: "uppercase" }}>Stryde</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "28px", position: "relative", width: "100%", maxWidth: "540px", justifyContent: "center" }}>
          {[1,2,3,4,5,6].map(s => (
            <div key={s} style={{ width: "28px", height: "3px", borderRadius: "2px", background: s <= stepNum ? "#6C63FF" : "rgba(255,255,255,0.08)" }} />
          ))}
          {stepNum > 1 && (
            <button
              onClick={async () => {
                if (step === 6 && debtName) await addDebt();
                supabase.auth.signOut();
              }}
              style={{ position: "absolute", right: 0, background: "none", border: "none", color: "#6E7681", fontSize: "12px", cursor: "pointer", padding: "4px 0", fontFamily: "'Inter', sans-serif" }}
            >
              Finish Later
            </button>
          )}
        </div>
        <div className="onboarding-shell-card" style={{ width: "100%", maxWidth, background: "#1A1826", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.06)", padding: "40px" }}>
          <div style={{ marginBottom: "28px" }}>
            <div style={{ fontSize: "10px", color: "#6C63FF", letterSpacing: "0.15em", textTransform: "uppercase", fontWeight: "600", marginBottom: "8px" }}>Step {stepNum} of 6</div>
            <div style={{ fontSize: "22px", fontWeight: "700", color: "#F0F6FC", marginBottom: "6px" }}>{title}</div>
            {subtitle && <div style={{ fontSize: "14px", color: "#8B8FA8", lineHeight: "1.5" }}>{subtitle}</div>}
          </div>
          {content}
        </div>
      </div>
    );
  }

  if (step === 1) {
    return shell(1, "Let's get started", "Tell us a little about yourself and your household.", (
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <div>
          <label style={labelStyle}>Your Name</label>
          <input style={inputStyle} type="text" placeholder="e.g. Travis" value={yourName} onChange={(e) => setYourName(e.target.value)} autoFocus />
        </div>
        <div>
          <label style={labelStyle}>Household Name</label>
          <input style={inputStyle} type="text" placeholder="e.g. The Smith Family" value={householdName} onChange={(e) => setHouseholdName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && householdName && yourName && createHousehold()} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button style={ghostBtn} onClick={() => supabase.auth.signOut()}>Sign Out</button>
          <button style={primaryBtn} onClick={createHousehold} disabled={!householdName || !yourName}>Continue</button>
        </div>
      </div>
    ));
  }

  if (step === 2) {
    return shell(2, "Who manages finances with you?", "Add other adults who manage finances with you. This is for people who need access to the budget — not kids or other household members. Flying solo? Skip this step.", (
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
    const CARD_W = Math.min(320, window.innerWidth - 108);
    const GAP = 20;
    const CONTAINER_W = Math.min(520, window.innerWidth - 88);
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

    if (window.innerWidth <= 640) {
      const ac = carouselCards[activeIndex];
      return shell(3, "Set up your accounts", "Fill in your account details. Tap Add Account to save and add more.", (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {userId && (
            <div>
              <PlaidConnectButton userId={userId} onSuccess={() => {}} />
              <div style={{ display: "flex", alignItems: "center", gap: "10px", margin: "12px 0 4px" }}>
                <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.08)" }} />
                <span style={{ fontSize: "11px", color: "#6E7681" }}>or add manually</span>
                <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.08)" }} />
              </div>
            </div>
          )}
          {carouselCards.some(c => c.saved) && (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {carouselCards.map((card, idx) => !card.saved ? null : (
                <div key={idx} style={{ background: "rgba(0,212,170,0.05)", border: "1px solid rgba(0,212,170,0.25)", borderRadius: "10px", padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: "14px", fontWeight: "600", color: "#F0F6FC" }}>{card.accountName}</div>
                    <div style={{ fontSize: "12px", color: "#8B8FA8", marginTop: "2px" }}>{card.accountType}{card.bankName ? ` · ${card.bankName}` : ""}{card.currentBalance ? ` · $${parseFloat(card.currentBalance).toLocaleString()}` : ""}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "11px", color: "#00D4AA", fontWeight: "600" }}>✓</span>
                    <button style={{ ...ghostBtn, padding: "3px 10px", fontSize: "11px" }} onClick={() => { setActiveIndex(idx); updateCard(idx, { saved: false }); }}>Edit</button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {!ac.saved && (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {carouselCards.some(c => c.saved) && (
                <div style={{ fontSize: "11px", color: "#6C63FF", fontWeight: "700", letterSpacing: "0.1em", textTransform: "uppercase" }}>Add Another Account</div>
              )}
              <div>
                <label style={cardLabel}>Name</label>
                <input style={cardInput} type="text" placeholder="Joint Checking" value={ac.accountName} onChange={(e) => updateCard(activeIndex, { accountName: e.target.value })} autoFocus />
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <div style={{ flex: 2 }}>
                  <label style={cardLabel}>Bank</label>
                  <input style={cardInput} type="text" placeholder="USAA" value={ac.bankName} onChange={(e) => updateCard(activeIndex, { bankName: e.target.value })} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={cardLabel}>Last 4</label>
                  <input style={cardInput} type="text" placeholder="0000" maxLength={4} value={ac.lastFour} onChange={(e) => updateCard(activeIndex, { lastFour: e.target.value })} />
                </div>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <div style={{ flex: 1 }}>
                  <label style={cardLabel}>Type</label>
                  <select style={{ ...cardInput, cursor: "pointer" }} value={ac.accountType} onChange={(e) => updateCard(activeIndex, { accountType: e.target.value })}>
                    <option value="checking">Checking</option>
                    <option value="savings">Savings</option>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={cardLabel}>Balance</label>
                  <input style={cardInput} type="number" placeholder="0.00" value={ac.currentBalance} onChange={(e) => updateCard(activeIndex, { currentBalance: e.target.value })} />
                </div>
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                <input type="checkbox" checked={ac.isPrimary} onChange={(e) => updateCard(activeIndex, { isPrimary: e.target.checked })} />
                <span style={{ fontSize: "12px", color: "#8B8FA8" }}>Primary account</span>
              </label>
              <div style={{ fontSize: "11px", color: "#6E7681", marginTop: "-4px" }}>
                Any accounts marked Primary are combined to calculate your available funds.
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                <input type="checkbox" checked={ac.isAccumulating} onChange={(e) => updateCard(activeIndex, { isAccumulating: e.target.checked })} />
                <span style={{ fontSize: "12px", color: "#8B8FA8" }}>Accumulating (saving toward a goal)</span>
              </label>
              {ac.isAccumulating && (
                <>
                  <div>
                    <label style={cardLabel}>Savings Target</label>
                    <input style={cardInput} type="number" placeholder="0.00" value={ac.accumulationTarget} onChange={(e) => updateCard(activeIndex, { accumulationTarget: e.target.value })} />
                  </div>
                  <div>
                    <label style={cardLabel}>Due Day of Month</label>
                    <input style={cardInput} type="number" placeholder="e.g. 1" min="1" max="31" value={ac.accDueDay} onChange={(e) => updateCard(activeIndex, { accDueDay: e.target.value })} />
                  </div>
                </>
              )}
              {ac.error && (
                <div style={{ fontSize: "12px", color: "#F87171", background: "rgba(248,113,113,0.08)", padding: "8px 12px", borderRadius: "6px" }}>{ac.error}</div>
              )}
              <button style={{ ...addBtn, width: "100%", opacity: ac.loading ? 0.6 : 1 }} onClick={() => saveCard(activeIndex)} disabled={ac.loading}>
                {ac.loading ? "Saving..." : "+ Add Account"}
              </button>
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px" }}>
            <button style={ghostBtn} onClick={() => setStep(2)}>Back</button>
            <button style={primaryBtn} onClick={async () => {
              const card = carouselCards[activeIndex];
              if (!card.saved && card.accountName) { const ok = await saveCard(activeIndex); if (!ok) return; }
              setStep(4);
            }}>Continue</button>
          </div>
        </div>
      ));
    }

    return shell(3, "Set up your accounts", "Fill out a card for each account. Hit Add Account to keep going.", (
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

        {userId && (
          <div>
            <PlaidConnectButton userId={userId} onSuccess={() => {}} />
            <div style={{ display: "flex", alignItems: "center", gap: "10px", margin: "12px 0 0" }}>
              <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.08)" }} />
              <span style={{ fontSize: "11px", color: "#6E7681" }}>or add manually</span>
              <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.08)" }} />
            </div>
          </div>
        )}

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
                    <div style={{ fontSize: "11px", color: "#6E7681", marginTop: "-4px" }}>
                      Any accounts marked Primary are combined to calculate your available funds.
                    </div>
                    <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                      <input type="checkbox" checked={card.isAccumulating} onChange={(e) => updateCard(index, { isAccumulating: e.target.checked })} />
                      <span style={{ fontSize: "12px", color: "#8B8FA8" }}>Accumulating</span>
                    </label>
                    {card.isAccumulating && (
                      <>
                        <div>
                          <label style={cardLabel}>Savings Target</label>
                          <input style={cardInput} type="number" placeholder="0.00" value={card.accumulationTarget} onChange={(e) => updateCard(index, { accumulationTarget: e.target.value })} />
                        </div>
                        <div>
                          <label style={cardLabel}>Due Day of Month</label>
                          <input style={cardInput} type="number" placeholder="e.g. 1 for the 1st" min="1" max="31" value={card.accDueDay} onChange={(e) => updateCard(index, { accDueDay: e.target.value })} />
                        </div>
                      </>
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
          <button style={primaryBtn} onClick={async () => {
            const card = carouselCards[activeIndex];
            if (!card.saved && card.accountName) {
              const ok = await saveCard(activeIndex);
              if (!ok) return;
            }
            setStep(4);
          }}>Continue</button>
        </div>
      </div>
    ), "660px");
  }

  if (step === 4) {
    const n = incomeCards.length;
    const CARD_W = Math.min(320, window.innerWidth - 108);
    const GAP = 20;
    const CONTAINER_W = Math.min(520, window.innerWidth - 88);
    const slideX = CONTAINER_W / 2 - (incomeActiveIndex * (CARD_W + GAP) + CARD_W / 2);

    const cardInput = { ...inputStyle, fontSize: "13px", padding: "8px 12px" };
    const cardLabel = { ...labelStyle, fontSize: "10px", marginBottom: "4px" };
    const arrowStyle = {
      position: "absolute", top: "50%", transform: "translateY(-50%)", zIndex: 3,
      width: "34px", height: "34px", borderRadius: "50%",
      background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.14)",
      color: "#F0F6FC", cursor: "pointer", fontSize: "20px",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Inter', sans-serif",
    };

    if (window.innerWidth <= 640) {
      const ai = incomeCards[incomeActiveIndex];
      const depositAcct = accountList.find(a => a.id === ai.depositAccountId);
      return shell(4, "Add your income", "Fill in each income source. Tap Add Income to save and add more.", (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {incomeCards.some(c => c.saved) && (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {incomeCards.map((card, idx) => !card.saved ? null : (
                <div key={idx} style={{ background: "rgba(0,212,170,0.05)", border: "1px solid rgba(0,212,170,0.25)", borderRadius: "10px", padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: "14px", fontWeight: "600", color: "#F0F6FC" }}>{card.incomeName}</div>
                    <div style={{ fontSize: "12px", color: "#8B8FA8", marginTop: "2px" }}>
                      {card.incomeOwner || "Joint"} · {card.incomeFrequency}{card.fixedAmount ? ` · $${parseFloat(card.fixedAmount).toLocaleString()}` : ""}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "11px", color: "#00D4AA", fontWeight: "600" }}>✓</span>
                    <button style={{ ...ghostBtn, padding: "3px 10px", fontSize: "11px" }} onClick={() => { setIncomeActiveIndex(idx); updateIncomeCard(idx, { saved: false }); }}>Edit</button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {!ai.saved && (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {incomeCards.some(c => c.saved) && (
                <div style={{ fontSize: "11px", color: "#6C63FF", fontWeight: "700", letterSpacing: "0.1em", textTransform: "uppercase" }}>Add Another Income</div>
              )}
              <div>
                <label style={cardLabel}>Name</label>
                <input style={cardInput} type="text" placeholder="VA Disability" value={ai.incomeName} onChange={(e) => updateIncomeCard(incomeActiveIndex, { incomeName: e.target.value, error: null })} autoFocus />
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <div style={{ flex: 1 }}>
                  <label style={cardLabel}>Who is this for?</label>
                  <select style={{ ...cardInput, cursor: "pointer" }} value={ai.incomeOwner} onChange={(e) => updateIncomeCard(incomeActiveIndex, { incomeOwner: e.target.value })}>
                    <option value="">Select</option>
                    <option value="joint">Joint</option>
                    {memberList.map((m, i) => <option key={i} value={m.name}>{m.name}</option>)}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={cardLabel}>Type</label>
                  <select style={{ ...cardInput, cursor: "pointer" }} value={ai.incomeType} onChange={(e) => updateIncomeCard(incomeActiveIndex, { incomeType: e.target.value, incomeEntryMode: "" })}>
                    <option value="salary">Salary</option>
                    <option value="hourly">Hourly</option>
                    <option value="benefits">Benefits</option>
                    <option value="fixed">Fixed</option>
                    <option value="variable">Variable</option>
                  </select>
                </div>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <div style={{ flex: 1 }}>
                  <label style={cardLabel}>Frequency</label>
                  <select style={{ ...cardInput, cursor: "pointer" }} value={ai.incomeFrequency} onChange={(e) => updateIncomeCard(incomeActiveIndex, { incomeFrequency: e.target.value })}>
                    <option value="biweekly">Biweekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={cardLabel}>Deposits Into</label>
                  <select style={{ ...cardInput, cursor: "pointer" }} value={ai.depositAccountId} onChange={(e) => updateIncomeCard(incomeActiveIndex, { depositAccountId: e.target.value })}>
                    <option value="">Select</option>
                    {accountList.map((a, i) => <option key={i} value={a.id}>{a.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label style={cardLabel}>Last Deposit Date</label>
                <input style={cardInput} type="date" value={ai.nextPayDate} onChange={(e) => updateIncomeCard(incomeActiveIndex, { nextPayDate: e.target.value })} />
              </div>
              {ai.incomeType !== "variable" && ai.incomeType !== "hourly" && (
                <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.06)", padding: "12px" }}>
                  {ai.incomeEntryMode === "" ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <div style={{ fontSize: "11px", color: "#8B8FA8" }}>How would you like to enter your income?</div>
                      <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "12px", color: "#F0F6FC" }}>
                        <input type="radio" name="incomeModeM" onChange={() => updateIncomeCard(incomeActiveIndex, { incomeEntryMode: "net" })} />
                        After-tax (what hits my bank)
                      </label>
                      <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "12px", color: "#F0F6FC" }}>
                        <input type="radio" name="incomeModeM" onChange={() => updateIncomeCard(incomeActiveIndex, { incomeEntryMode: "gross" })} />
                        Gross (app calculates take-home)
                      </label>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: "11px", color: "#8B8FA8" }}>{ai.incomeEntryMode === "net" ? "After-tax" : "Gross pay"}</span>
                        <button style={{ ...ghostBtn, padding: "2px 8px", fontSize: "10px" }} onClick={() => updateIncomeCard(incomeActiveIndex, { incomeEntryMode: "" })}>Change</button>
                      </div>
                      <div>
                        <label style={cardLabel}>{ai.incomeEntryMode === "net" ? "Amount Deposited" : "Gross Amount"}</label>
                        <input style={cardInput} type="number" placeholder="0.00" value={ai.fixedAmount} onChange={(e) => updateIncomeCard(incomeActiveIndex, { fixedAmount: e.target.value })} />
                      </div>
                      {ai.incomeEntryMode === "gross" && (
                        <div>
                          <label style={cardLabel}>Tax Rate (%)</label>
                          <input style={cardInput} type="number" placeholder="e.g. 20" value={ai.taxRate} onChange={(e) => updateIncomeCard(incomeActiveIndex, { taxRate: e.target.value })} />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
              {ai.incomeType === "variable" && (
                <div>
                  <label style={cardLabel}>Estimated Amount</label>
                  <input style={cardInput} type="number" placeholder="0.00" value={ai.fixedAmount} onChange={(e) => updateIncomeCard(incomeActiveIndex, { fixedAmount: e.target.value })} />
                </div>
              )}
              {ai.incomeType === "hourly" && (
                <div style={{ display: "flex", gap: "8px" }}>
                  <div style={{ flex: 1 }}>
                    <label style={cardLabel}>Rate/hr</label>
                    <input style={cardInput} type="number" placeholder="0.00" value={ai.hourlyRate} onChange={(e) => updateIncomeCard(incomeActiveIndex, { hourlyRate: e.target.value })} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={cardLabel}>Hrs/Week</label>
                    <input style={cardInput} type="number" placeholder="40" value={ai.hoursPerWeek} onChange={(e) => updateIncomeCard(incomeActiveIndex, { hoursPerWeek: e.target.value })} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={cardLabel}>OT Rate</label>
                    <input style={cardInput} type="number" placeholder="0.00" value={ai.overtimeRate} onChange={(e) => updateIncomeCard(incomeActiveIndex, { overtimeRate: e.target.value })} />
                  </div>
                </div>
              )}
              {ai.error && (
                <div style={{ fontSize: "12px", color: "#F87171", background: "rgba(248,113,113,0.08)", padding: "8px 12px", borderRadius: "6px" }}>{ai.error}</div>
              )}
              <button style={{ ...addBtn, width: "100%", opacity: ai.loading ? 0.6 : 1 }} onClick={() => saveIncomeCard(incomeActiveIndex)} disabled={ai.loading}>
                {ai.loading ? "Saving..." : "+ Add Income"}
              </button>
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px" }}>
            <button style={ghostBtn} onClick={() => setStep(3)}>Back</button>
            <button style={primaryBtn} onClick={async () => {
              const card = incomeCards[incomeActiveIndex];
              if (!card.saved && card.incomeName) { const ok = await saveIncomeCard(incomeActiveIndex); if (!ok) return; }
              setStep(5);
            }}>Continue</button>
          </div>
        </div>
      ));
    }

    return shell(4, "Add your income", "Add each income source. You can always add more from the dashboard.", (
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

        <div style={{ position: "relative", width: `${CONTAINER_W}px`, margin: "0 auto" }}>
          <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "72px", background: "linear-gradient(to right, #1A1826 25%, transparent)", pointerEvents: "none", zIndex: 2 }} />
          <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: "72px", background: "linear-gradient(to left, #1A1826 25%, transparent)", pointerEvents: "none", zIndex: 2 }} />

          {incomeActiveIndex > 0 && (
            <button style={{ ...arrowStyle, left: "10px" }} onClick={() => setIncomeActiveIndex(i => i - 1)}>‹</button>
          )}
          {incomeActiveIndex < n - 1 && (
            <button style={{ ...arrowStyle, right: "10px" }} onClick={() => setIncomeActiveIndex(i => i + 1)}>›</button>
          )}

          <div style={{ overflow: "hidden" }}>
            <div style={{
              display: "flex", gap: `${GAP}px`,
              transform: `translateX(${slideX}px)`,
              transition: "transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
            }}>
              {incomeCards.map((card, index) => {
                const isActive = index === incomeActiveIndex;
                const depositAcct = accountList.find(a => a.id === card.depositAccountId);

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
                        <div style={{ display: "flex", gap: "6px" }}>
                          <button style={{ ...ghostBtn, padding: "3px 10px", fontSize: "11px" }} onClick={() => { setIncomeActiveIndex(index); updateIncomeCard(index, { saved: false }); }}>Edit</button>
                          <button style={{ ...ghostBtn, padding: "3px 10px", fontSize: "11px", color: "#F87171", borderColor: "rgba(248,113,113,0.2)" }} onClick={() => deleteIncomeCard(index)}>Delete</button>
                        </div>
                      </div>
                      <div style={{ fontSize: "18px", fontWeight: "600", color: "#F0F6FC" }}>{card.incomeName}</div>
                      <div style={{ fontSize: "13px", color: "#8B8FA8", textTransform: "capitalize" }}>
                        {card.incomeOwner || "Joint"} · {card.incomeFrequency} · {card.incomeType}
                      </div>
                      {card.fixedAmount && (
                        <div style={{ fontSize: "22px", color: "#00D4AA", fontWeight: "700" }}>
                          ${parseFloat(card.fixedAmount).toLocaleString()}
                        </div>
                      )}
                      {card.hourlyRate && (
                        <div style={{ fontSize: "22px", color: "#00D4AA", fontWeight: "700" }}>
                          ${card.hourlyRate}/hr
                        </div>
                      )}
                      {depositAcct && (
                        <div style={{ fontSize: "12px", color: "#6C63FF" }}>→ {depositAcct.name}</div>
                      )}
                      {card.nextPayDate && (
                        <div style={{ fontSize: "12px", color: "#8B8FA8" }}>Last: {new Date(card.nextPayDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</div>
                      )}
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
                      Income {index + 1}
                    </div>

                    <div>
                      <label style={cardLabel}>Name</label>
                      <input style={cardInput} type="text" placeholder="VA Disability" value={card.incomeName} onChange={(e) => updateIncomeCard(index, { incomeName: e.target.value, error: null })} autoFocus={isActive} />
                    </div>

                    <div style={{ display: "flex", gap: "8px" }}>
                      <div style={{ flex: 1 }}>
                        <label style={cardLabel}>Who is this for?</label>
                        <select style={{ ...cardInput, cursor: "pointer" }} value={card.incomeOwner} onChange={(e) => updateIncomeCard(index, { incomeOwner: e.target.value })}>
                          <option value="">Select</option>
                          <option value="joint">Joint</option>
                          {memberList.map((m, i) => <option key={i} value={m.name}>{m.name}</option>)}
                        </select>
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={cardLabel}>Type</label>
                        <select style={{ ...cardInput, cursor: "pointer" }} value={card.incomeType} onChange={(e) => updateIncomeCard(index, { incomeType: e.target.value, incomeEntryMode: "" })}>
                          <option value="salary">Salary</option>
                          <option value="hourly">Hourly</option>
                          <option value="benefits">Benefits</option>
                          <option value="fixed">Fixed</option>
                          <option value="variable">Variable</option>
                        </select>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: "8px" }}>
                      <div style={{ flex: 1 }}>
                        <label style={cardLabel}>Frequency</label>
                        <select style={{ ...cardInput, cursor: "pointer" }} value={card.incomeFrequency} onChange={(e) => updateIncomeCard(index, { incomeFrequency: e.target.value })}>
                          <option value="biweekly">Biweekly</option>
                          <option value="monthly">Monthly</option>
                          <option value="weekly">Weekly</option>
                        </select>
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={cardLabel}>Deposits Into</label>
                        <select style={{ ...cardInput, cursor: "pointer" }} value={card.depositAccountId} onChange={(e) => updateIncomeCard(index, { depositAccountId: e.target.value })}>
                          <option value="">Select</option>
                          {accountList.map((a, i) => <option key={i} value={a.id}>{a.name}</option>)}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label style={cardLabel}>Last Deposit Date</label>
                      <input style={cardInput} type="date" value={card.nextPayDate} onChange={(e) => updateIncomeCard(index, { nextPayDate: e.target.value })} />
                    </div>

                    {card.incomeType !== "variable" && card.incomeType !== "hourly" && (
                      <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.06)", padding: "12px" }}>
                        {card.incomeEntryMode === "" ? (
                          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            <div style={{ fontSize: "11px", color: "#8B8FA8" }}>How would you like to enter your income?</div>
                            <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "12px", color: "#F0F6FC" }}>
                              <input type="radio" name={`incomeMode-${index}`} onChange={() => updateIncomeCard(index, { incomeEntryMode: "net" })} />
                              After-tax (what hits my bank)
                            </label>
                            <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "12px", color: "#F0F6FC" }}>
                              <input type="radio" name={`incomeMode-${index}`} onChange={() => updateIncomeCard(index, { incomeEntryMode: "gross" })} />
                              Gross (app calculates take-home)
                            </label>
                          </div>
                        ) : (
                          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <span style={{ fontSize: "11px", color: "#8B8FA8" }}>{card.incomeEntryMode === "net" ? "After-tax" : "Gross pay"}</span>
                              <button style={{ ...ghostBtn, padding: "2px 8px", fontSize: "10px" }} onClick={() => updateIncomeCard(index, { incomeEntryMode: "" })}>Change</button>
                            </div>
                            <div>
                              <label style={cardLabel}>{card.incomeEntryMode === "net" ? "Amount Deposited" : "Gross Amount"}</label>
                              <input style={cardInput} type="number" placeholder="0.00" value={card.fixedAmount} onChange={(e) => updateIncomeCard(index, { fixedAmount: e.target.value })} />
                            </div>
                            {card.incomeEntryMode === "gross" && (
                              <div>
                                <label style={cardLabel}>Tax Rate (%)</label>
                                <input style={cardInput} type="number" placeholder="e.g. 20" value={card.taxRate} onChange={(e) => updateIncomeCard(index, { taxRate: e.target.value })} />
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {card.incomeType === "variable" && (
                      <div>
                        <label style={cardLabel}>Estimated Amount</label>
                        <input style={cardInput} type="number" placeholder="0.00" value={card.fixedAmount} onChange={(e) => updateIncomeCard(index, { fixedAmount: e.target.value })} />
                      </div>
                    )}

                    {card.incomeType === "hourly" && (
                      <div style={{ display: "flex", gap: "8px" }}>
                        <div style={{ flex: 1 }}>
                          <label style={cardLabel}>Rate/hr</label>
                          <input style={cardInput} type="number" placeholder="0.00" value={card.hourlyRate} onChange={(e) => updateIncomeCard(index, { hourlyRate: e.target.value })} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <label style={cardLabel}>Hrs/Week</label>
                          <input style={cardInput} type="number" placeholder="40" value={card.hoursPerWeek} onChange={(e) => updateIncomeCard(index, { hoursPerWeek: e.target.value })} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <label style={cardLabel}>OT Rate</label>
                          <input style={cardInput} type="number" placeholder="0.00" value={card.overtimeRate} onChange={(e) => updateIncomeCard(index, { overtimeRate: e.target.value })} />
                        </div>
                      </div>
                    )}

                    {card.error && (
                      <div style={{ fontSize: "12px", color: "#F87171", background: "rgba(248,113,113,0.08)", padding: "8px 12px", borderRadius: "6px" }}>
                        {card.error}
                      </div>
                    )}

                    <button
                      style={{ ...addBtn, width: "100%", marginTop: "auto", opacity: card.loading ? 0.6 : 1 }}
                      onClick={() => saveIncomeCard(index)}
                      disabled={card.loading}
                    >
                      {card.loading ? "Saving..." : "+ Add Income"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {n > 1 && (
          <div style={{ display: "flex", justifyContent: "center", gap: "6px" }}>
            {incomeCards.map((_, i) => (
              <div key={i} onClick={() => setIncomeActiveIndex(i)} style={{
                width: i === incomeActiveIndex ? "20px" : "6px", height: "6px",
                borderRadius: "3px", cursor: "pointer",
                background: i === incomeActiveIndex ? "#6C63FF" : "rgba(255,255,255,0.2)",
                transition: "width 0.3s ease, background 0.3s ease",
              }} />
            ))}
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <button style={ghostBtn} onClick={() => setStep(3)}>Back</button>
          <button style={primaryBtn} onClick={async () => {
            const card = incomeCards[incomeActiveIndex];
            if (!card.saved && card.incomeName) {
              const ok = await saveIncomeCard(incomeActiveIndex);
              if (!ok) return;
            }
            setStep(5);
          }}>Continue</button>
        </div>
      </div>
    ), "660px");
  }

  if (step === 5) {
    const isMobile = window.innerWidth <= 640;
    return shell(5, "Add your bills", "Add your recurring monthly bills. Stryde will use these to calculate your pay period budget.", (
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "12px" }}>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={labelStyle}>Bill Name</label>
            <input style={inputStyle} type="text" placeholder="e.g. Mortgage" value={billName} onChange={(e) => setBillName(e.target.value)} autoFocus />
          </div>
          <div>
            <label style={labelStyle}>Amount</label>
            <input style={inputStyle} type="number" placeholder="0.00" value={billAmount} onChange={(e) => setBillAmount(e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Frequency</label>
            <select style={selectStyle} value={billFrequency} onChange={(e) => { setBillFrequency(e.target.value); if (e.target.value !== "semi-monthly") setBillDueDay2(""); }}>
              <option value="" disabled>Frequency</option>
              <option value="monthly">Monthly</option>
              <option value="semi-monthly">Semi-monthly (2 due dates)</option>
              <option value="biweekly">Biweekly</option>
              <option value="payday">Every Pay Day</option>
              <option value="quarterly">Quarterly</option>
              <option value="annually">Annually</option>
            </select>
          </div>
          {(billFrequency || "monthly") !== "payday" && (
            <div>
              <label style={labelStyle}>{(billFrequency || "monthly") === "semi-monthly" ? "1st Due Day" : "Due Day of Month"}</label>
              <input style={inputStyle} type="number" placeholder="e.g. 1" min="1" max="31" value={dueDay} onChange={(e) => setDueDay(e.target.value)} />
            </div>
          )}
          {billFrequency === "semi-monthly" && (
            <div>
              <label style={labelStyle}>2nd Due Day</label>
              <input style={inputStyle} type="number" placeholder="e.g. 15" min="1" max="31" value={billDueDay2} onChange={(e) => setBillDueDay2(e.target.value)} />
            </div>
          )}
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
          {!isBillAccumulating && (
            <div>
              <label style={labelStyle}>Payment Method</label>
              <select style={selectStyle} value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
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
            </div>
          )}
          <div>
            <label style={labelStyle}>Owner</label>
            <select style={selectStyle} value={billOwner} onChange={(e) => setBillOwner(e.target.value)}>
              <option value="joint">Joint</option>
              {memberList.map((m, i) => <option key={i} value={m.name}>{m.name}</option>)}
            </select>
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={labelStyle}>{isBillAccumulating ? "Transfer from account" : "Paid from account"}</label>
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

        <label style={checkRowStyle}>
          <input type="checkbox" checked={isBillAccumulating} onChange={(e) => { setIsBillAccumulating(e.target.checked); if (!e.target.checked) setBillTransferToAccountId(""); }} />
          <span style={checkLabelStyle}>This is a transfer to another account</span>
        </label>
        {isBillAccumulating && (
          <div>
            <label style={labelStyle}>Transfer to which account?</label>
            <select style={selectStyle} value={billTransferToAccountId} onChange={(e) => setBillTransferToAccountId(e.target.value)}>
              <option value="">Select account</option>
              {accountList.map((a, i) => <option key={i} value={a.id}>{a.name}{a.is_accumulating ? " (saving)" : ""}</option>)}
            </select>
          </div>
        )}

        {billError && (
          <div style={{ fontSize: "13px", color: "#F87171", background: "rgba(248,113,113,0.08)", padding: "10px 14px", borderRadius: "8px", border: "1px solid rgba(248,113,113,0.2)" }}>
            {billError}
          </div>
        )}

        <button style={addBtn} onClick={editingBill ? updateBill : addBill}>{editingBill ? "Save Changes" : "+ Add Bill"}</button>

        {billList.length > 0 && (
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "12px" }}>
            {billList.map((bill, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <div>
                  <div style={{ fontSize: "14px", color: "#F0F6FC", fontWeight: "500" }}>{bill.name}</div>
                  <div style={{ fontSize: "11px", color: "#8B8FA8", marginTop: "2px" }}>${bill.amount} · {bill.frequency === "payday" ? "Every Pay Day" : bill.frequency === "biweekly" ? "Biweekly" : `Due the ${bill.due_day}${bill.due_day === 1 ? "st" : bill.due_day === 2 ? "nd" : bill.due_day === 3 ? "rd" : "th"}`} · {bill.category}</div>
                </div>
                <button style={ghostBtn} onClick={() => { setEditingBill(bill); setBillName(bill.name); setBillAmount(bill.amount); setDueDay(bill.due_day); setPaymentMethod(bill.payment_method); setBillCategory(bill.category); setBillOwner(bill.owner); setBillAccountId(bill.account_id || ""); setIsVariable(bill.is_variable); setIsBillAccumulating(!!bill.transfer_to_account_id); setBillTransferToAccountId(bill.transfer_to_account_id || ""); setBillFrequency(bill.frequency || "monthly"); setBillDueDay2(bill.due_day_2 || ""); }}>Edit</button>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px" }}>
          <button style={ghostBtn} onClick={() => setStep(4)}>Back</button>
          <button style={primaryBtn} onClick={async () => {
            if (billName) {
              const ok = await addBill();
              if (!ok) return;
            }
            setStep(6);
          }}>
            Continue
          </button>
        </div>
      </div>
    ));
  }

  if (step === 6) {
    const isMobile = window.innerWidth <= 640;
    const selectStyle = { ...inputStyle, cursor: "pointer" };
    return shell(6, "Add your debts", "Optional — add any debts you're paying off. You can always add more from the Debts page.", (
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "12px" }}>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={labelStyle}>Debt Name</label>
            <input style={inputStyle} type="text" placeholder="e.g. Chase Sapphire" value={debtName} onChange={(e) => setDebtName(e.target.value)} autoFocus />
          </div>
          <div>
            <label style={labelStyle}>Category</label>
            <select style={selectStyle} value={debtCategory} onChange={(e) => setDebtCategory(e.target.value)}>
              <option value="Credit Card">Credit Card</option>
              <option value="Student Loan">Student Loan</option>
              <option value="Car Loan">Car Loan</option>
              <option value="Medical">Medical</option>
              <option value="Personal Loan">Personal Loan</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Owner</label>
            <select style={selectStyle} value={debtOwner} onChange={(e) => setDebtOwner(e.target.value)}>
              <option value="joint">Joint</option>
              {memberList.map((m, i) => <option key={i} value={m.name}>{m.name}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Current Balance</label>
            <input style={inputStyle} type="number" placeholder="0.00" value={debtBalance} onChange={(e) => setDebtBalance(e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Minimum Payment</label>
            <input style={inputStyle} type="number" placeholder="0.00" value={debtMinPayment} onChange={(e) => setDebtMinPayment(e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Interest Rate (%)</label>
            <input style={inputStyle} type="number" placeholder="e.g. 19.99" value={debtInterestRate} onChange={(e) => setDebtInterestRate(e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Payoff Priority</label>
            <input style={inputStyle} type="number" placeholder="e.g. 1 (lowest first)" value={debtPayoffOrder} onChange={(e) => setDebtPayoffOrder(e.target.value)} />
          </div>
        </div>

        {debtError && (
          <div style={{ fontSize: "13px", color: "#F87171", background: "rgba(248,113,113,0.08)", padding: "10px 14px", borderRadius: "8px", border: "1px solid rgba(248,113,113,0.2)" }}>
            {debtError}
          </div>
        )}

        <button style={addBtn} onClick={editingDebt ? updateDebt : addDebt}>{editingDebt ? "Save Changes" : "+ Add Debt"}</button>

        {debtList.length > 0 && (
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "12px" }}>
            {debtList.map((debt, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <div>
                  <div style={{ fontSize: "14px", color: "#F0F6FC", fontWeight: "500" }}>{debt.name}</div>
                  <div style={{ fontSize: "11px", color: "#8B8FA8", marginTop: "2px" }}>${debt.balance?.toLocaleString()} · ${debt.minimum_payment}/mo · {debt.category}</div>
                </div>
                <button style={ghostBtn} onClick={() => {
                  setEditingDebt(debt);
                  setDebtName(debt.name);
                  setDebtOwner(debt.owner);
                  setDebtCategory(debt.category);
                  setDebtBalance(debt.balance);
                  setDebtInterestRate(debt.interest_rate ? (debt.interest_rate * 100).toString() : "");
                  setDebtMinPayment(debt.minimum_payment);
                  setDebtPayoffOrder(debt.payoff_order?.toString() || "");
                }}>Edit</button>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px" }}>
          <button style={ghostBtn} onClick={() => setStep(5)}>Back</button>
          <button style={{ ...primaryBtn, background: "#00D4AA", color: "#0F1218" }} onClick={async () => {
            if (debtName) {
              const ok = await addDebt();
              if (!ok) return;
            }
            const { data: freshIncome } = await supabase
              .from("income")
              .select("*")
              .eq("household_id", householdId);
            const periods = calculatePayPeriods(freshIncome || []);
            await savePayPeriods(periods);
            await saveDefaultCategories(householdId);
            await supabase.auth.updateUser({ data: { onboarding_complete: true } });
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
