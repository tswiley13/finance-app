import { useState } from "react";
import {
  View, Text, ScrollView, Pressable, RefreshControl, Modal, Alert,
  KeyboardAvoidingView, Platform, StyleSheet,
} from "react-native";
import { SafeAreaView, SafeAreaProvider } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { ordinalSuffix } from "@stryde/shared";
import { supabase } from "../../src/supabase";
import { useStrydeData } from "../../src/useStrydeData";
import { Panel, Label, Money, Loading, Empty, Pill, Divider } from "../../src/ui";
import { Field, Input, MoneyInput, Select, Toggle, Btn, FormError, MONTHS, DAYS } from "../../src/form";
import { c } from "../../src/theme";

const FREQUENCIES = [
  { label: "Monthly", value: "monthly" },
  { label: "Every Pay Day", value: "payday" },
  { label: "Biweekly", value: "biweekly" },
  { label: "Semi-monthly", value: "semi-monthly" },
  { label: "Quarterly", value: "quarterly" },
  { label: "Annually", value: "annually" },
];

const OWNERS = [
  { label: "Joint", value: "joint" },
  { label: "Mine", value: "mine" },
  { label: "Partner's", value: "partner" },
];

const blank = {
  name: "", amount: "", frequency: "monthly", due_day: null, due_day_2: null,
  due_month: null, account_id: null, category: "", owner: "joint",
  payment_method: "", transfer_to_account_id: null, is_variable: false,
};

export function freqLabel(b) {
  const f = b.frequency || "monthly";
  if (f === "payday") return "Every Pay Day";
  if (f === "biweekly") return "Biweekly";
  if (f === "quarterly") {
    const m = MONTHS.find((x) => x.value === b.due_month)?.label;
    return `Quarterly${m ? ` from ${m}` : ""}${b.due_day ? ` · ${b.due_day}${ordinalSuffix(b.due_day)}` : ""}`;
  }
  if (f === "annually") {
    const m = MONTHS.find((x) => x.value === b.due_month)?.label;
    return `Annually${m ? ` · ${m} ${b.due_day}` : ""}`;
  }
  if (f === "semi-monthly") {
    return `Due the ${b.due_day}${ordinalSuffix(b.due_day)} & ${b.due_day_2}${ordinalSuffix(b.due_day_2)}`;
  }
  return b.due_day ? `Due the ${b.due_day}${ordinalSuffix(b.due_day)}` : "Monthly";
}

export default function Bills() {
  const d = useStrydeData();
  const [editing, setEditing] = useState(null); // bill object, or {} for new
  const [form, setForm] = useState(blank);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  if (d.loading) return <Loading />;

  const active = d.bills.filter((b) => b.is_active !== false);
  const total = active.reduce((sum, b) => sum + (b.amount || 0), 0);
  const acctName = (id) => d.accounts.find((a) => a.id === id)?.name;

  const accountOptions = d.accounts
    .filter((a) => !a.is_accumulating)
    .map((a) => ({ label: a.name, value: a.id }));
  const accumulatingOptions = d.accounts
    .filter((a) => a.is_accumulating)
    .map((a) => ({ label: a.name, value: a.id }));
  const categoryOptions = [
    { label: "None", value: "" },
    ...d.categories.map((cat) => ({ label: cat.name, value: cat.name })),
  ];

  function openNew() {
    setForm(blank);
    setError("");
    setEditing({});
  }

  function openEdit(b) {
    setForm({
      name: b.name || "",
      amount: b.amount == null ? "" : String(b.amount),
      frequency: b.frequency || "monthly",
      due_day: b.due_day || null,
      due_day_2: b.due_day_2 || null,
      due_month: b.due_month || null,
      account_id: b.account_id || null,
      category: b.category || "",
      owner: b.owner || "joint",
      payment_method: b.payment_method || "",
      transfer_to_account_id: b.transfer_to_account_id || null,
      is_variable: !!b.is_variable,
    });
    setError("");
    setEditing(b);
  }

  // Mirrors the web app's validation exactly.
  function validate() {
    const isPayday = form.frequency === "payday";
    if (!form.name || !form.amount || (!isPayday && !form.due_day) || !form.account_id) {
      return "Please fill in all required fields.";
    }
    if (form.frequency === "semi-monthly" && !form.due_day_2) {
      return "Semi-monthly bills require a second due day.";
    }
    if ((form.frequency === "quarterly" || form.frequency === "annually") && !form.due_month) {
      return "Pick which month this bill is due.";
    }
    return "";
  }

  async function save() {
    const err = validate();
    if (err) return setError(err);
    setError("");
    setSaving(true);

    const isPayday = form.frequency === "payday";
    const payload = {
      name: form.name,
      amount: parseFloat(form.amount),
      due_day: isPayday ? 0 : parseInt(form.due_day),
      payment_method: form.payment_method || null,
      category: form.category || null,
      owner: form.owner,
      account_id: form.account_id || null,
      transfer_to_account_id: form.transfer_to_account_id || null,
      is_variable: form.is_variable,
      frequency: form.frequency,
      due_day_2: form.frequency === "semi-monthly" && form.due_day_2 ? parseInt(form.due_day_2) : null,
      due_month:
        (form.frequency === "quarterly" || form.frequency === "annually") && form.due_month
          ? parseInt(form.due_month)
          : null,
    };

    let dbError;
    if (editing?.id) {
      ({ error: dbError } = await supabase.from("bills").update(payload).eq("id", editing.id));
    } else {
      ({ error: dbError } = await supabase.from("bills").insert({
        ...payload,
        household_id: d.household.id,
        is_active: true,
        is_paid: false,
      }));
    }

    setSaving(false);
    if (dbError) return setError(dbError.message);
    setEditing(null);
    d.reload();
  }

  function confirmDelete(b) {
    Alert.alert("Delete bill?", `"${b.name}" will be removed. Payment history for it is also cleared.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const { error } = await supabase.from("bills").delete().eq("id", b.id);
          if (error) Alert.alert("Couldn't delete", error.message);
          setEditing(null);
          d.reload();
        },
      },
    ]);
  }

  const isPayday = form.frequency === "payday";
  const needsMonth = form.frequency === "quarterly" || form.frequency === "annually";

  return (
    <SafeAreaView style={s.screen} edges={["top"]}>
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={false} onRefresh={d.reload} tintColor={c.accent} />}
      >
        <View style={s.headerRow}>
          <Text style={s.pageTitle}>Bills</Text>
          <Pressable onPress={openNew} style={s.addBtn}>
            <Ionicons name="add" size={16} color="#13111F" />
            <Text style={s.addBtnText}>Add</Text>
          </Pressable>
        </View>

        <View style={s.summary}>
          <Text style={s.faint}>{active.length} active</Text>
          <Money value={total} color={c.danger} size={14} weight="600" />
        </View>

        {active.length === 0 && <Empty text="No bills yet — tap Add to create one" />}

        {active.map((b) => (
          <Pressable key={b.id} onPress={() => openEdit(b)}>
            <Panel style={{ marginBottom: 8 }}>
              <View style={s.row}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                    <Text style={s.name}>{b.name}</Text>
                    {b.is_variable && <Pill text="VARIABLE" color={c.warning} bg="rgba(251,191,36,0.1)" />}
                    {b.transfer_to_account_id && <Pill text="TRANSFER" color={c.success} bg="rgba(0,212,170,0.1)" />}
                  </View>
                  <Text style={s.faintSm}>{freqLabel(b)}</Text>
                  {!!acctName(b.account_id) && <Text style={s.faintSm}>From {acctName(b.account_id)}</Text>}
                </View>
                <Money value={b.amount} color={c.text} size={15} weight="600" />
                <Ionicons name="chevron-forward" size={15} color={c.textDim} style={{ marginLeft: 8 }} />
              </View>
            </Panel>
          </Pressable>
        ))}
      </ScrollView>

      {/* Add / Edit */}
      <Modal visible={!!editing} animationType="slide" onRequestClose={() => setEditing(null)}>
        {/* A Modal renders in its own native view hierarchy, so the root
            SafeAreaProvider's insets don't reach it — without this the header
            hides under the notch and Cancel/Save become untappable. */}
        <SafeAreaProvider>
        <SafeAreaView style={s.screen} edges={["top", "bottom"]}>
          <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
            <View style={s.modalHeader}>
              <Pressable onPress={() => setEditing(null)} hitSlop={10}>
                <Text style={s.cancel}>Cancel</Text>
              </Pressable>
              <Text style={s.modalTitle}>{editing?.id ? "Edit Bill" : "New Bill"}</Text>
              <Pressable onPress={save} disabled={saving} hitSlop={10}>
                <Text style={[s.save, saving && { opacity: 0.5 }]}>{saving ? "Saving…" : "Save"}</Text>
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
              <FormError>{error}</FormError>

              <Field label="Name" required>
                <Input value={form.name} onChangeText={(t) => setForm({ ...form, name: t })} placeholder="Electric bill" />
              </Field>

              <Field label="Amount" required>
                <MoneyInput value={form.amount} onChangeText={(t) => setForm({ ...form, amount: t })} />
              </Field>

              <Field label="Frequency" required>
                <Select
                  value={form.frequency}
                  onChange={(v) => setForm({ ...form, frequency: v, due_day_2: null, due_month: null })}
                  options={FREQUENCIES}
                />
              </Field>

              {!isPayday && (
                <Field
                  label={form.frequency === "semi-monthly" ? "First Due Day" : "Due Day"}
                  required
                  hint={form.frequency === "monthly" ? "Bills due on the 29th–31st shift in shorter months." : undefined}
                >
                  <Select
                    value={form.due_day}
                    onChange={(v) => setForm({ ...form, due_day: v })}
                    options={DAYS}
                    placeholder="Pick a day"
                  />
                </Field>
              )}

              {form.frequency === "semi-monthly" && (
                <Field label="Second Due Day" required>
                  <Select
                    value={form.due_day_2}
                    onChange={(v) => setForm({ ...form, due_day_2: v })}
                    options={DAYS}
                    placeholder="Pick a day"
                  />
                </Field>
              )}

              {needsMonth && (
                <Field
                  label={form.frequency === "quarterly" ? "Starting Month" : "Month"}
                  required
                  hint={form.frequency === "quarterly" ? "Repeats every 3 months from here." : undefined}
                >
                  <Select
                    value={form.due_month}
                    onChange={(v) => setForm({ ...form, due_month: v })}
                    options={MONTHS}
                    placeholder="Pick a month"
                  />
                </Field>
              )}

              <Field label="Paid From" required hint="Which account this bill comes out of.">
                <Select
                  value={form.account_id}
                  onChange={(v) => setForm({ ...form, account_id: v })}
                  options={accountOptions}
                  placeholder="Pick an account"
                />
              </Field>

              {categoryOptions.length > 1 && (
                <Field label="Category">
                  <Select
                    value={form.category}
                    onChange={(v) => setForm({ ...form, category: v })}
                    options={categoryOptions}
                    placeholder="None"
                  />
                </Field>
              )}

              <Field label="Owner">
                <Select value={form.owner} onChange={(v) => setForm({ ...form, owner: v })} options={OWNERS} />
              </Field>

              <Toggle
                label="Variable amount"
                hint="The amount changes month to month (e.g. utilities)."
                value={form.is_variable}
                onValueChange={(v) => setForm({ ...form, is_variable: v })}
              />

              {accumulatingOptions.length > 0 && (
                <Field
                  label="Save Up In"
                  hint="For big periodic bills — set money aside gradually in an accumulating account."
                >
                  <Select
                    value={form.transfer_to_account_id}
                    onChange={(v) => setForm({ ...form, transfer_to_account_id: v })}
                    options={[{ label: "None", value: null }, ...accumulatingOptions]}
                    placeholder="None"
                  />
                </Field>
              )}

              {editing?.id && (
                <View style={{ marginTop: 18 }}>
                  <Divider style={{ marginBottom: 18 }} />
                  <Btn title="Delete Bill" kind="danger" onPress={() => confirmDelete(editing)} />
                </View>
              )}
            </ScrollView>
          </KeyboardAvoidingView>
          </SafeAreaView>
        </SafeAreaProvider>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: c.bg },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  pageTitle: { color: c.text, fontSize: 22, fontWeight: "700" },
  addBtn: {
    flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: c.accent,
    borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7,
  },
  addBtnText: { color: "#13111F", fontSize: 13, fontWeight: "700" },
  summary: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 8, marginBottom: 14 },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  name: { color: c.text, fontSize: 14, fontWeight: "600" },
  faint: { color: c.textMuted, fontSize: 12 },
  faintSm: { color: c.textFaint, fontSize: 11, marginTop: 2 },
  modalHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: c.border,
  },
  modalTitle: { color: c.text, fontSize: 16, fontWeight: "700" },
  cancel: { color: c.textMuted, fontSize: 15 },
  save: { color: c.accent, fontSize: 15, fontWeight: "700" },
});
