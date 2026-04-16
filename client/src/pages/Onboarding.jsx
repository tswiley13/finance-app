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
              placeholder="Estimated amount per period"
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

        <button onClick={() => setStep(4)}>Continue</button>
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
