// New-user setup, mirroring the web Onboarding flow.
//
// Steps: household -> accounts -> income -> bills -> done (pay periods are
// generated from the income you entered). Accounts and bills are skippable;
// income isn't, because pay periods can't exist without it and the whole app is
// built around them.
import { useState } from "react";
import {
  View, Text, ScrollView, Pressable, Alert,
  KeyboardAvoidingView, Platform, ActivityIndicator, StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { buildPayPeriods } from "@stryde/shared";
import { supabase } from "../src/supabase";
import { useStrydeData } from "../src/useStrydeData";
import { Panel, Label, Money, Divider, Loading } from "../src/ui";
import { Field, Input, MoneyInput, Select, Toggle, Btn, FormError, DAYS } from "../src/form";
import { DateField } from "../src/DateField";
import { c } from "../src/theme";

const DEFAULT_CATEGORIES = [
  "Housing", "Utilities", "Insurance", "Subscriptions", "Transportation",
  "Food", "Health", "Debt", "Personal", "Other",
];

const STEPS = ["Household", "Accounts", "Income", "Bills"];

export default function Onboarding() {
  const d = useStrydeData();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Step 1
  const [householdName, setHouseholdName] = useState("");
  const [yourName, setYourName] = useState("");
  const [householdId, setHouseholdId] = useState(null);

  // Step 2 — accounts staged locally, written when the step is completed
  const [accounts, setAccounts] = useState([
    { key: "a1", name: "Checking", balance: "", is_primary: true, is_accumulating: false, accumulation_target: "", due_day: null },
  ]);

  // Step 3
  const [incomes, setIncomes] = useState([
    { key: "i1", name: "", amount: "", frequency: "biweekly", next_pay_date: "" },
  ]);

  // Step 4
  const [bills, setBills] = useState([]);

  if (d.loading) return <Loading />;

  // Already set up — don't let them redo it.
  if (d.household && !d.needsOnboarding) {
    return (
      <SafeAreaView style={s.screen}>
        <View style={s.center}>
          <Text style={s.h1}>You're all set</Text>
          <Text style={s.muted}>{d.household.name} is already set up.</Text>
          <View style={{ height: 16 }} />
          <Btn title="Go to Dashboard" onPress={() => router.replace("/")} />
        </View>
      </SafeAreaView>
    );
  }

  // ── Step 1: create the household ───────────────────────────────────────────
  async function createHousehold() {
    if (!householdName.trim()) return setError("Give your household a name.");
    setError("");
    setBusy(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("You're signed out. Sign in and try again.");

      // Same invite code shape as the web: 5 letters, dash, 4 digits.
      const inviteCode =
        householdName.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 5) +
        "-" + Math.floor(1000 + Math.random() * 9000);

      const { data: created, error: hErr } = await supabase
        .from("households")
        .insert({ name: householdName.trim(), created_by: user.id, invite_code: inviteCode })
        .select("id")
        .single();
      if (hErr) throw hErr;

      // Without this the dashboard can't find the household at all.
      const { error: mErr } = await supabase.from("household_members").insert({
        household_id: created.id,
        user_id: user.id,
        name: yourName.trim() || user.email,
        role: "owner",
      });
      if (mErr) throw mErr;

      await supabase.from("categories").insert(
        DEFAULT_CATEGORIES.map((name) => ({ household_id: created.id, name }))
      );

      setHouseholdId(created.id);
      setStep(2);
    } catch (e) {
      setError(e.message || String(e));
    } finally {
      setBusy(false);
    }
  }

  // ── Step 2: accounts ───────────────────────────────────────────────────────
  async function saveAccounts() {
    const named = accounts.filter((a) => a.name.trim());
    if (named.length === 0) return setStep(3); // skippable
    if (named.filter((a) => a.is_primary).length !== 1) {
      return setError("Pick exactly one primary account — it's the balance 'Available Now' shows.");
    }
    for (const a of named) {
      if (a.is_accumulating && (!a.accumulation_target || !a.due_day)) {
        return setError(`"${a.name}" is accumulating, so it needs a target and a due day.`);
      }
    }
    setError("");
    setBusy(true);
    try {
      const { error: e } = await supabase.from("accounts").insert(
        named.map((a) => ({
          household_id: householdId,
          name: a.name.trim(),
          current_balance: parseFloat(a.balance) || 0,
          is_primary: a.is_primary,
          is_accumulating: a.is_accumulating,
          accumulation_target: a.is_accumulating ? parseFloat(a.accumulation_target) || null : null,
          due_day: a.is_accumulating && a.due_day ? parseInt(a.due_day) : null,
          account_type: "checking",
          reset_type: "never",
          minimum_buffer: 0,
        }))
      );
      if (e) throw e;
      setStep(3);
    } catch (e) {
      setError(e.message || String(e));
    } finally {
      setBusy(false);
    }
  }

  // ── Step 3: income (required — pay periods come from it) ───────────────────
  async function saveIncome() {
    const named = incomes.filter((i) => i.name.trim() && i.amount);
    if (named.length === 0) {
      return setError("Add at least one paycheck — your pay periods are built from it.");
    }
    if (named.some((i) => !i.next_pay_date)) {
      return setError("Every paycheck needs its next pay date.");
    }
    setError("");
    setBusy(true);
    try {
      const { error: e } = await supabase.from("income").insert(
        named.map((i) => ({
          household_id: householdId,
          name: i.name.trim(),
          fixed_amount: parseFloat(i.amount),
          frequency: i.frequency,
          next_pay_date: i.next_pay_date,
          type: "salary",
          owner: "joint",
          is_active: true,
        }))
      );
      if (e) throw e;

      // Generate pay periods now — nothing in the app works without them.
      const rows = buildPayPeriods({
        income: named.map((i) => ({ frequency: i.frequency, next_pay_date: i.next_pay_date })),
      });
      if (rows.length > 0) {
        const { error: pErr } = await supabase
          .from("pay_periods")
          .insert(rows.map((r) => ({ ...r, household_id: householdId })));
        if (pErr) throw pErr;
      }
      setStep(4);
    } catch (e) {
      setError(e.message || String(e));
    } finally {
      setBusy(false);
    }
  }

  // ── Step 4: bills ──────────────────────────────────────────────────────────
  async function finish() {
    const named = bills.filter((b) => b.name.trim() && b.amount);
    setError("");
    setBusy(true);
    try {
      if (named.length > 0) {
        const { data: accts } = await supabase
          .from("accounts").select("id, is_primary").eq("household_id", householdId);
        const fallback = accts?.find((a) => a.is_primary)?.id || accts?.[0]?.id || null;

        const { error: e } = await supabase.from("bills").insert(
          named.map((b) => ({
            household_id: householdId,
            name: b.name.trim(),
            amount: parseFloat(b.amount),
            frequency: b.frequency,
            due_day: b.frequency === "payday" ? 0 : parseInt(b.due_day) || 1,
            account_id: fallback,
            owner: "joint",
            is_active: true,
            is_paid: false,
          }))
        );
        if (e) throw e;
      }
      await d.reload();
      router.replace("/");
    } catch (e) {
      setError(e.message || String(e));
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={s.screen} edges={["top"]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        {/* Progress */}
        <View style={s.progress}>
          {STEPS.map((label, i) => {
            const n = i + 1;
            const done = step > n;
            const active = step === n;
            return (
              <View key={label} style={{ flex: 1, alignItems: "center" }}>
                <View style={[s.dot, active && s.dotActive, done && s.dotDone]}>
                  {done ? (
                    <Ionicons name="checkmark" size={12} color="#13111F" />
                  ) : (
                    <Text style={[s.dotText, active && { color: "#13111F" }]}>{n}</Text>
                  )}
                </View>
                <Text style={[s.stepLabel, (active || done) && { color: c.text }]}>{label}</Text>
              </View>
            );
          })}
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
          <FormError>{error}</FormError>

          {step === 1 && (
            <>
              <Text style={s.h1}>Welcome to Stryde</Text>
              <Text style={s.muted}>Let's set up your household. Takes about two minutes.</Text>
              <View style={{ height: 20 }} />
              <Field label="Household Name" required hint="Whatever you'd call it — 'The Smiths', 'Home'.">
                <Input value={householdName} onChangeText={setHouseholdName} placeholder="The Smith Family" />
              </Field>
              <Field label="Your Name">
                <Input value={yourName} onChangeText={setYourName} placeholder="Alex" />
              </Field>
              <Btn title={busy ? "Creating…" : "Continue"} onPress={createHousehold} disabled={busy} />
            </>
          )}

          {step === 2 && (
            <>
              <Text style={s.h1}>Your accounts</Text>
              <Text style={s.muted}>
                Add the accounts you actually use. Mark the one you spend from as primary —
                that's the balance "Available Now" shows.
              </Text>
              <View style={{ height: 16 }} />

              {accounts.map((a, i) => (
                <Panel key={a.key} style={{ marginBottom: 10 }}>
                  <View style={s.rowBetween}>
                    <Label>Account {i + 1}</Label>
                    {accounts.length > 1 && (
                      <Pressable onPress={() => setAccounts((x) => x.filter((y) => y.key !== a.key))} hitSlop={8}>
                        <Ionicons name="close" size={16} color={c.danger} />
                      </Pressable>
                    )}
                  </View>
                  <View style={{ height: 10 }} />
                  <Field label="Name" required>
                    <Input
                      value={a.name}
                      onChangeText={(v) => setAccounts((x) => x.map((y) => (y.key === a.key ? { ...y, name: v } : y)))}
                      placeholder="Checking"
                    />
                  </Field>
                  <Field label="Current Balance">
                    <MoneyInput
                      value={a.balance}
                      onChangeText={(v) => setAccounts((x) => x.map((y) => (y.key === a.key ? { ...y, balance: v } : y)))}
                    />
                  </Field>
                  <Toggle
                    label="Primary account"
                    hint="The one you spend from. Exactly one."
                    value={a.is_primary}
                    onValueChange={(v) =>
                      // Only one primary; turning this on turns the others off.
                      setAccounts((x) => x.map((y) => ({ ...y, is_primary: y.key === a.key ? v : v ? false : y.is_primary })))
                    }
                  />
                  <Toggle
                    label="Saves up for a big bill"
                    hint="For things like escrow — set money aside gradually."
                    value={a.is_accumulating}
                    onValueChange={(v) =>
                      setAccounts((x) => x.map((y) => (y.key === a.key ? { ...y, is_accumulating: v, is_primary: v ? false : y.is_primary } : y)))
                    }
                  />
                  {a.is_accumulating && (
                    <>
                      <Field label="Target Amount" required>
                        <MoneyInput
                          value={a.accumulation_target}
                          onChangeText={(v) => setAccounts((x) => x.map((y) => (y.key === a.key ? { ...y, accumulation_target: v } : y)))}
                        />
                      </Field>
                      <Field label="Due Day" required>
                        <Select
                          value={a.due_day}
                          onChange={(v) => setAccounts((x) => x.map((y) => (y.key === a.key ? { ...y, due_day: v } : y)))}
                          options={DAYS}
                          placeholder="Pick a day"
                        />
                      </Field>
                    </>
                  )}
                </Panel>
              ))}

              <Pressable
                onPress={() => setAccounts((x) => [...x, { key: `a${Date.now()}`, name: "", balance: "", is_primary: false, is_accumulating: false, accumulation_target: "", due_day: null }])}
                style={s.addBtn}
              >
                <Text style={s.addBtnText}>+ Add Another Account</Text>
              </Pressable>

              <View style={{ height: 16 }} />
              <Btn title={busy ? "Saving…" : "Continue"} onPress={saveAccounts} disabled={busy} />
              <View style={{ height: 8 }} />
              <Btn title="Back" kind="ghost" onPress={() => setStep(1)} />
            </>
          )}

          {step === 3 && (
            <>
              <Text style={s.h1}>Your paychecks</Text>
              <Text style={s.muted}>
                This is the important one — Stryde builds your pay periods from it. Enter what
                you make per check and when the next one lands.
              </Text>
              <View style={{ height: 16 }} />

              {incomes.map((inc, i) => (
                <Panel key={inc.key} style={{ marginBottom: 10 }}>
                  <View style={s.rowBetween}>
                    <Label>Paycheck {i + 1}</Label>
                    {incomes.length > 1 && (
                      <Pressable onPress={() => setIncomes((x) => x.filter((y) => y.key !== inc.key))} hitSlop={8}>
                        <Ionicons name="close" size={16} color={c.danger} />
                      </Pressable>
                    )}
                  </View>
                  <View style={{ height: 10 }} />
                  <Field label="Name" required>
                    <Input
                      value={inc.name}
                      onChangeText={(v) => setIncomes((x) => x.map((y) => (y.key === inc.key ? { ...y, name: v } : y)))}
                      placeholder="Payroll"
                    />
                  </Field>
                  <Field label="Amount Per Check" required>
                    <MoneyInput
                      value={inc.amount}
                      onChangeText={(v) => setIncomes((x) => x.map((y) => (y.key === inc.key ? { ...y, amount: v } : y)))}
                    />
                  </Field>
                  <Field label="How Often" required>
                    <Select
                      value={inc.frequency}
                      onChange={(v) => setIncomes((x) => x.map((y) => (y.key === inc.key ? { ...y, frequency: v } : y)))}
                      options={[
                        { label: "Every 2 weeks", value: "biweekly" },
                        { label: "Weekly", value: "weekly" },
                        { label: "Monthly", value: "monthly" },
                      ]}
                    />
                  </Field>
                  <Field label="Next Pay Date" required hint="Your pay periods start from this date.">
                    <DateField
                      value={inc.next_pay_date}
                      onChange={(v) => setIncomes((x) => x.map((y) => (y.key === inc.key ? { ...y, next_pay_date: v } : y)))}
                    />
                  </Field>
                </Panel>
              ))}

              <Pressable
                onPress={() => setIncomes((x) => [...x, { key: `i${Date.now()}`, name: "", amount: "", frequency: "biweekly", next_pay_date: "" }])}
                style={s.addBtn}
              >
                <Text style={s.addBtnText}>+ Add Another Paycheck</Text>
              </Pressable>

              <View style={{ height: 16 }} />
              <Btn title={busy ? "Saving…" : "Continue"} onPress={saveIncome} disabled={busy} />
              <View style={{ height: 8 }} />
              <Btn title="Back" kind="ghost" onPress={() => setStep(2)} />
            </>
          )}

          {step === 4 && (
            <>
              <Text style={s.h1}>Your bills</Text>
              <Text style={s.muted}>
                Add a few to get started — you can always add the rest later from the Bills tab.
              </Text>
              <View style={{ height: 16 }} />

              {bills.map((b, i) => (
                <Panel key={b.key} style={{ marginBottom: 10 }}>
                  <View style={s.rowBetween}>
                    <Label>Bill {i + 1}</Label>
                    <Pressable onPress={() => setBills((x) => x.filter((y) => y.key !== b.key))} hitSlop={8}>
                      <Ionicons name="close" size={16} color={c.danger} />
                    </Pressable>
                  </View>
                  <View style={{ height: 10 }} />
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    <View style={{ flex: 2 }}>
                      <Field label="Name" required>
                        <Input
                          value={b.name}
                          onChangeText={(v) => setBills((x) => x.map((y) => (y.key === b.key ? { ...y, name: v } : y)))}
                          placeholder="Electric"
                        />
                      </Field>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Field label="Amount" required>
                        <MoneyInput
                          value={b.amount}
                          onChangeText={(v) => setBills((x) => x.map((y) => (y.key === b.key ? { ...y, amount: v } : y)))}
                        />
                      </Field>
                    </View>
                  </View>
                  <Field label="How Often">
                    <Select
                      value={b.frequency}
                      onChange={(v) => setBills((x) => x.map((y) => (y.key === b.key ? { ...y, frequency: v } : y)))}
                      options={[
                        { label: "Monthly", value: "monthly" },
                        { label: "Every Pay Day", value: "payday" },
                      ]}
                    />
                  </Field>
                  {b.frequency !== "payday" && (
                    <Field label="Due Day" required>
                      <Select
                        value={b.due_day}
                        onChange={(v) => setBills((x) => x.map((y) => (y.key === b.key ? { ...y, due_day: v } : y)))}
                        options={DAYS}
                        placeholder="Pick a day"
                      />
                    </Field>
                  )}
                </Panel>
              ))}

              <Pressable
                onPress={() => setBills((x) => [...x, { key: `b${Date.now()}`, name: "", amount: "", frequency: "monthly", due_day: null }])}
                style={s.addBtn}
              >
                <Text style={s.addBtnText}>+ Add a Bill</Text>
              </Pressable>

              <View style={{ height: 16 }} />
              <Btn
                title={busy ? "Finishing…" : bills.length > 0 ? "Finish Setup" : "Skip for now"}
                onPress={finish}
                disabled={busy}
              />
              <View style={{ height: 8 }} />
              <Btn title="Back" kind="ghost" onPress={() => setStep(3)} />
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: c.bg },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  h1: { color: c.text, fontSize: 24, fontWeight: "800", marginBottom: 6 },
  muted: { color: c.textMuted, fontSize: 14, lineHeight: 20 },
  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  progress: {
    flexDirection: "row", paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: c.border,
  },
  dot: {
    width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)", marginBottom: 5,
  },
  dotActive: { backgroundColor: c.accent },
  dotDone: { backgroundColor: c.success },
  dotText: { color: c.textFaint, fontSize: 11, fontWeight: "700" },
  stepLabel: { color: c.textDim, fontSize: 10, fontWeight: "600" },
  addBtn: {
    borderWidth: 1, borderColor: "rgba(108,99,255,0.35)", borderStyle: "dashed",
    borderRadius: 8, paddingVertical: 12, alignItems: "center",
  },
  addBtnText: { color: c.accent, fontSize: 13, fontWeight: "600" },
});
