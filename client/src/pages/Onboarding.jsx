import { useState } from "react";
import { supabase } from "../supabase";

function Onboarding() {
  const [step, setStep] = useState(1);
  const [householdName, setHouseholdName] = useState("");
  const [memberList, setMemberList] = useState([]);
  const [memberName, setMemberName] = useState("");
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
  const [billList, setBillList] = useState([]);
  const [billName, setBillName] = useState("");
  const [billAmount, setBillAmount] = useState("");
  const [dueDay, setDueDay] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("auto");
  const [billCategory, setBillCategory] = useState("");
  const [billOwner, setBillOwner] = useState("joint");
  const [billAccountId, setBillAccountId] = useState("");
  const [isVariable, setIsVariable] = useState(false);
  // console.log("current step:", step);

  async function createHousehold() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase.from("households").insert({
      name: householdName,
      created_by: user.id,
    });

    if (error) {
      console.log("Error:", error.message);
      return;
    }

    setStep(2);
  }

  async function addMember() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: household } = await supabase
      .from("households")
      .select("id")
      .eq("created_by", user.id)
      .single();

    const newMember = {
      household_id: household.id,
      user_id: user.id,
      name: memberName,
      role: memberList.length === 0 ? "owner" : "member",
    };

    const { error } = await supabase
      .from("household_members")
      .insert(newMember);

    if (error) {
      console.log("Error:", error.message);
      return;
    }

    setMemberList([...memberList, newMember]);
    setMemberName("");
  }

  async function addIncome() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: household } = await supabase
      .from("households")
      .select("id")
      .eq("created_by", user.id)
      .single();

    const newIncome = {
      household_id: household.id,
      name: incomeName,
      owner: incomeOwner,
      type: incomeType,
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
  }

  async function addAccount() {
    if (!accountName) {
      alert("Please enter an account name.");
      return;
    }

    if (lastFour && lastFour.length !== 4) {
      alert("Last 4 digits must be exactly 4 numbers.");
      return;
    }

    if (lastFour && !/^\d{4}$/.test(lastFour)) {
      alert("Last 4 digits must be numbers only.");
      return;
    }

    if (!bankName) {
      alert("Please enter your bank name.");
      return;
    }

    if (!lastFour) {
      alert("Please enter the last 4 digits of your account.");
      return;
    }

    if (lastFour.length !== 4 || !/^\d{4}$/.test(lastFour)) {
      alert("Last 4 digits must be exactly 4 numbers.");
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

    const { data: savedAccount, error } = await supabase
      .from("accounts")
      .insert(newAccount)
      .select()
      .single();

    if (error) {
      console.log("Error:", error.message);
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

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: household } = await supabase
      .from("households")
      .select("id")
      .eq("created_by", user.id)
      .single();

    const newBill = {
      household_id: household.id,
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

    const { error } = await supabase.from("bills").insert(newBill);

    if (error) {
      console.log("Error:", error.message);
      return;
    }

    setBillList([...billList, newBill]);
    setBillName("");
    setBillAmount("");
    setDueDay("");
    setPaymentMethod("auto");
    setBillCategory("");
    setBillOwner("joint");
    setBillAccountId("");
    setIsVariable(false);
  }

  if (step === 1) {
    return (
      <div>
        <h1>What would you like to name your household?</h1>
        <input
          type="text"
          placeholder="e.g. The Smith Family"
          value={householdName}
          onChange={(e) => setHouseholdName(e.target.value)}
        />
        <button onClick={createHousehold}>Continue</button>
        <button onClick={() => supabase.auth.signOut()}>Sign Out</button>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div>
        <h1>Who lives in your household?</h1>
        <input
          type="text"
          placeholder="Member name"
          value={memberName}
          onChange={(e) => setMemberName(e.target.value)}
        />
        <button onClick={addMember}>Add Member</button>

        <div>
          {memberList.map((member, index) => (
            <div key={index}>
              <p>
                {member.name} - {member.role}
              </p>
            </div>
          ))}
        </div>
        <button onClick={() => setStep(3)}>Continue</button>
        <button onClick={() => setStep(1)}>Back</button>
      </div>
    );
  }

  if (step === 3) {
    return (
      <div>
        <h1>Add your income sources</h1>

        <div>
          <input
            type="text"
            placeholder="Income name (e.g. VA Disability)"
            value={incomeName}
            onChange={(e) => setIncomeName(e.target.value)}
          />
          <select
            value={incomeOwner}
            onChange={(e) => setIncomeOwner(e.target.value)}
          >
            <option value="">Who is this income for?</option>
            <option value="joint">Joint</option>
            {memberList.map((member, index) => (
              <option key={index} value={member.name}>
                {member.name}
              </option>
            ))}
          </select>
          <select
            value={incomeType}
            onChange={(e) => setIncomeType(e.target.value)}
          >
            <option value="salary">Salary</option>
            <option value="hourly">Hourly</option>
            <option value="benefits">Benefits</option>
            <option value="fixed">Fixed</option>
            <option value="variable">Variable/Commission</option>
          </select>
          <select
            value={incomeFrequency}
            onChange={(e) => setIncomeFrequency(e.target.value)}
          >
            <option value="biweekly">Biweekly</option>
            <option value="monthly">Monthly</option>
            <option value="weekly">Weekly</option>
          </select>

          {incomeType !== "variable" && (
            <>
              <p>How would you like to enter your income?</p>

              {incomeEntryMode === "" && (
                <>
                  <label>
                    <input
                      type="radio"
                      name="incomeMode"
                      value="net"
                      checked={incomeEntryMode === "net"}
                      onChange={() => setIncomeEntryMode("net")}
                    />
                    After-tax — enter what hits my bank
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="incomeMode"
                      value="gross"
                      checked={incomeEntryMode === "gross"}
                      onChange={() => setIncomeEntryMode("gross")}
                    />
                    Gross pay — app will calculate take-home
                  </label>
                </>
              )}

              {incomeEntryMode === "net" && (
                <p>
                  After-tax — Enter what hits my bank{" "}
                  <button onClick={() => setIncomeEntryMode("")}>Change</button>
                </p>
              )}

              {incomeEntryMode === "gross" && (
                <p>
                  Gross pay — app will calculate take-home{" "}
                  <button onClick={() => setIncomeEntryMode("")}>Change</button>
                </p>
              )}

              {incomeEntryMode === "net" && (
                <input
                  type="number"
                  placeholder="Amount deposited"
                  value={fixedAmount}
                  onChange={(e) => setFixedAmount(e.target.value)}
                />
              )}

              {incomeEntryMode === "gross" && (
                <>
                  <input
                    type="number"
                    placeholder="Gross amount"
                    value={fixedAmount}
                    onChange={(e) => setFixedAmount(e.target.value)}
                  />
                  <input
                    type="number"
                    placeholder="Tax rate (e.g. 20 for 20%)"
                    value={taxRate}
                    onChange={(e) => setTaxRate(e.target.value)}
                  />
                </>
              )}
            </>
          )}

          {incomeType === "hourly" && (
            <>
              <input
                type="number"
                placeholder="Hourly rate"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(e.target.value)}
              />
              <input
                type="number"
                placeholder="Hours per week"
                value={hoursPerWeek}
                onChange={(e) => setHoursPerWeek(e.target.value)}
              />
              <input
                type="number"
                placeholder="Overtime rate"
                value={overtimeRate}
                onChange={(e) => setOvertimeRate(e.target.value)}
              />
            </>
          )}

          {incomeType === "variable" && (
            <input
              type="number"
              placeholder="Estimated amount"
              value={fixedAmount}
              onChange={(e) => setFixedAmount(e.target.value)}
            />
          )}

          <input
            type="date"
            value={nextPayDate}
            onChange={(e) => setNextPayDate(e.target.value)}
          />
        </div>

        <button onClick={addIncome}>Add Income Source</button>

        <div>
          {incomeList.map((income, index) => (
            <div key={index}>
              <p>
                {income.name} — {income.owner} — $
                {income.fixed_amount || income.hourly_rate + "/hr"}
              </p>
            </div>
          ))}
        </div>

        <button
          onClick={async () => {
            if (incomeName && fixedAmount) {
              await addIncome();
            }
            setStep(4);
          }}
        >
          Continue
        </button>
        <button onClick={() => setStep(2)}>Back</button>
      </div>
    );
  }

  if (step === 4) {
    return (
      <div>
        <h1>Set up your accounts</h1>

        <div>
          <input
            type="text"
            placeholder="Account name (e.g. Mortgage Account)"
            value={accountName}
            onChange={(e) => setAccountName(e.target.value)}
          />
          <input
            type="text"
            placeholder="Bank name (e.g. USAA)"
            value={bankName}
            onChange={(e) => setBankName(e.target.value)}
          />
          <input
            type="text"
            placeholder="Last 4 digits"
            value={lastFour}
            onChange={(e) => setLastFour(e.target.value)}
          />
          <select
            value={accountType}
            onChange={(e) => setAccountType(e.target.value)}
          >
            <option value="checking">Checking</option>
            <option value="savings">Savings</option>
          </select>
          <input
            type="number"
            placeholder="Current balance"
            value={currentBalance}
            onChange={(e) => setCurrentBalance(e.target.value)}
          />
          <label>
            <input
              type="checkbox"
              checked={isPrimary}
              onChange={(e) => setIsPrimary(e.target.checked)}
            />
            This is my primary account
          </label>
          <label>
            <input
              type="checkbox"
              checked={isAccumulating}
              onChange={(e) => setIsAccumulating(e.target.checked)}
            />
            This account accumulates toward a recurring payment
          </label>

          {isAccumulating && (
            <>
              <input
                type="number"
                placeholder="Target amount (e.g. 4291.60 for mortgage)"
                value={accumulationTarget}
                onChange={(e) => setAccumulationTarget(e.target.value)}
              />
              <select
                value={resetType}
                onChange={(e) => setResetType(e.target.value)}
              >
                <option value="manual">Manual reset</option>
                <option value="auto">Auto reset</option>
              </select>
              {resetType === "auto" && (
                <input
                  type="number"
                  placeholder="Reset on day of month (e.g. 1)"
                  value={resetDay}
                  onChange={(e) => setResetDay(e.target.value)}
                />
              )}
            </>
          )}
        </div>

        <button onClick={addAccount}>Add Account</button>

        <div>
          {accountList.map((account, index) => (
            <div key={index}>
              <p>
                {account.name} — {account.account_type}
                {account.is_primary ? " — Primary" : ""}
                {account.is_accumulating ? " — Accumulating" : ""}
              </p>
            </div>
          ))}
        </div>

        <button
          onClick={async () => {
            if (accountName && bankName && lastFour) {
              await addAccount();
            }
            setStep(5);
          }}
        >
          Continue
        </button>
        <button onClick={() => setStep(3)}>Back</button>
      </div>
    );
  }

  if (step === 5) {
    return (
      <div>
        <h1>Add your bills</h1>

        <div>
          <input
            type="text"
            placeholder="Bill name (e.g. Mortgage)"
            value={billName}
            onChange={(e) => setBillName(e.target.value)}
          />
          <input
            type="number"
            placeholder="Amount"
            value={billAmount}
            onChange={(e) => setBillAmount(e.target.value)}
          />
          <input
            type="number"
            placeholder="Due day of month (e.g. 1)"
            value={dueDay}
            onChange={(e) => setDueDay(e.target.value)}
          />
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
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
          >
            <option value="">Select a category</option>
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
            value={billOwner}
            onChange={(e) => setBillOwner(e.target.value)}
          >
            <option value="joint">Joint</option>
            {memberList.map((member, index) => (
              <option key={index} value={member.name}>
                {member.name}
              </option>
            ))}
          </select>
          <select
            value={billAccountId}
            onChange={(e) => setBillAccountId(e.target.value)}
          >
            <option value="">Select account (optional)</option>
            {accountList.map((account, index) => (
              <option key={index} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>
          <label>
            <input
              type="checkbox"
              checked={isVariable}
              onChange={(e) => setIsVariable(e.target.checked)}
            />
            This bill varies month to month
          </label>
        </div>

        <button onClick={addBill}>Add Bill</button>

        <div>
          {billList.map((bill, index) => (
            <div key={index}>
              <p>
                {bill.name} — ${bill.amount} — Due day {bill.due_day} —{" "}
                {bill.category}
              </p>
            </div>
          ))}
        </div>

        <button
          onClick={async () => {
            if (billName && billAmount && dueDay) {
              await addBill();
            }
            setStep(6);
          }}
        >
          Continue
        </button>
        <button onClick={() => setStep(4)}>Back</button>
      </div>
    );
  }

  return (
    <div>
      <h1>Welcome to Slate</h1>
    </div>
  );
}

export default Onboarding;
