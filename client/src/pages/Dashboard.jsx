import { useState, useEffect } from "react";
import { supabase } from "../supabase";

function Dashboard() {
  const [household, setHousehold] = useState(null);
  const [payPeriods, setPayPeriods] = useState([]);
  const [income, setIncome] = useState([]);
  const [bills, setBills] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());

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
    return payPeriods.find((period) => {
      const start = new Date(period.start_date);
      const end = new Date(period.end_date);
      return today >= start && today <= end;
    });
  }

  if (loading) {
    return <div>Loading your dashboard...</div>;
  }

  return (
    <div>
      <h1>Welcome, {household?.name}</h1>
      <p>
        Today is{" "}
        {new Date().toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      </p>

      {(() => {
        const currentPeriod = getCurrentPayPeriod();
        return currentPeriod ? (
          <div>
            <h2>Current Pay Period</h2>
            <p>
              {currentPeriod.name} —{" "}
              {new Date(currentPeriod.start_date).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}{" "}
              to{" "}
              {new Date(currentPeriod.end_date).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </p>
          </div>
        ) : (
          <p>No current pay period found</p>
        );
      })()}

      <h2>Your Accounts</h2>
      {accounts.map((account, index) => (
        <div key={index}>
          <p>
            {account.name} — ${account.current_balance?.toFixed(2)}
          </p>
        </div>
      ))}

      <h2>Bills Due This Month</h2>
      {bills.map((bill, index) => (
        <div key={index}>
          <p>
            {bill.name} — ${bill.amount} — Due the {bill.due_day}
            {bill.due_day === 1
              ? "st"
              : bill.due_day === 2
                ? "nd"
                : bill.due_day === 3
                  ? "rd"
                  : "th"}
          </p>
        </div>
      ))}
    </div>
  );
}

export default Dashboard;
