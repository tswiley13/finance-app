import { useState } from "react";
import {
  View, Text, ScrollView, Pressable, RefreshControl, Modal, Alert,
  KeyboardAvoidingView, Platform, StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { fmtDate, incMultiplier } from "@stryde/shared";
import { supabase } from "../../src/supabase";
import { useStrydeData } from "../../src/useStrydeData";
import { Panel, Money, Loading, Empty, Divider } from "../../src/ui";
import { Field, Input, MoneyInput, Select, Btn, FormError } from "../../src/form";
import { DateField } from "../../src/DateField";
import { c } from "../../src/theme";

const FREQUENCIES = [
  { label: "Biweekly (every 2 weeks)", value: "biweekly" },
  { label: "Weekly", value: "weekly" },
  { label: "Monthly", value: "monthly" },
];

const TYPES = [
  { label: "Salary", value: "salary" },
  { label: "Hourly", value: "hourly" },
  { label: "Benefits", value: "benefits" },
  { label: "Side Income", value: "side" },
  { label: "Other", value: "other" },
];

const OWNERS = [
  { label: "Joint", value: "joint" },
  { label: "Mine", value: "mine" },
  { label: "Partner's", value: "partner" },
];

const blank = {
  name: "", fixed_amount: "", frequency: "biweekly", type: "salary",
  owner: "joint", next_pay_date: "", deposit_account_id: null,
};

export default function Income() {
  const d = useStrydeData();
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blank);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  if (d.loading) return <Loading />;

  const active = d.income.filter((i) => i.is_active !== false);
  const monthlyTotal = active.reduce(
    (sum, i) => sum + (i.fixed_amount || 0) * incMultiplier(i.frequency), 0
  );
  const acctName = (id) => d.accounts.find((a) => a.id === id)?.name;
  const accountOptions = [
    { label: "None", value: null },
    ...d.accounts.filter((a) => !a.is_accumulating).map((a) => ({ label: a.name, value: a.id })),
  ];

  function openNew() { setForm(blank); setError(""); setEditing({}); }
  function openEdit(i) {
    setForm({
      name: i.name || "",
      fixed_amount: i.fixed_amount == null ? "" : String(i.fixed_amount),
      frequency: i.frequency || "biweekly",
      type: i.type || "salary",
      owner: i.owner || "joint",
      next_pay_date: i.next_pay_date || "",
      deposit_account_id: i.deposit_account_id || null,
    });
    setError("");
    setEditing(i);
  }

  async function save() {
    if (!form.name || !form.fixed_amount) return setError("Name and amount are required.");
    if (!form.next_pay_date) return setError("Next pay date is required — pay periods are built from it.");
    setError("");
    setSaving(true);

    const payload = {
      name: form.name,
      owner: form.owner,
      type: form.type,
      frequency: form.frequency,
      fixed_amount: parseFloat(form.fixed_amount),
      next_pay_date: form.next_pay_date,
      deposit_account_id: form.deposit_account_id || null,
    };

    let dbError;
    if (editing?.id) {
      ({ error: dbError } = await supabase.from("income").update(payload).eq("id", editing.id));
    } else {
      ({ error: dbError } = await supabase.from("income").insert({
        ...payload, household_id: d.household.id, is_active: true,
      }));
    }

    setSaving(false);
    if (dbError) return setError(dbError.message);
    setEditing(null);
    d.reload();
  }

  function confirmDelete(i) {
    Alert.alert("Delete income?", `"${i.name}" will be removed. Your pay periods are built from income — removing this may change them.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const { error } = await supabase.from("income").delete().eq("id", i.id);
          if (error) Alert.alert("Couldn't delete", error.message);
          setEditing(null);
          d.reload();
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={s.screen} edges={["top"]}>
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={false} onRefresh={d.reload} tintColor={c.accent} />}
      >
        <View style={s.headerRow}>
          <Text style={s.pageTitle}>Income</Text>
          <Pressable onPress={openNew} style={s.addBtn}>
            <Ionicons name="add" size={16} color="#13111F" />
            <Text style={s.addBtnText}>Add</Text>
          </Pressable>
        </View>

        <View style={s.summary}>
          <Text style={s.faint}>{active.length} source{active.length === 1 ? "" : "s"} · per month</Text>
          <Money value={monthlyTotal} color={c.success} size={14} weight="600" />
        </View>

        {active.length === 0 && <Empty text="No income yet — tap Add to create one" />}

        {active.map((i) => (
          <Pressable key={i.id} onPress={() => openEdit(i)}>
            <Panel style={{ marginBottom: 8 }}>
              <View style={s.row}>
                <View style={{ flex: 1 }}>
                  <Text style={s.name}>{i.name}</Text>
                  <Text style={s.faintSm}>
                    {FREQUENCIES.find((f) => f.value === i.frequency)?.label || i.frequency}
                    {i.next_pay_date ? ` · next ${fmtDate(i.next_pay_date)}` : ""}
                  </Text>
                  {!!acctName(i.deposit_account_id) && (
                    <Text style={s.faintSm}>Deposits to {acctName(i.deposit_account_id)}</Text>
                  )}
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Money value={i.fixed_amount} color={c.success} size={15} weight="600" />
                  <Text style={s.faintSm}>per check</Text>
                </View>
                <Ionicons name="chevron-forward" size={15} color={c.textDim} style={{ marginLeft: 8 }} />
              </View>
            </Panel>
          </Pressable>
        ))}

        <Text style={s.note}>
          Your pay periods are generated from each source's frequency and next pay date.
        </Text>
      </ScrollView>

      <Modal visible={!!editing} animationType="slide" onRequestClose={() => setEditing(null)}>
        <SafeAreaView style={s.screen}>
          <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
            <View style={s.modalHeader}>
              <Pressable onPress={() => setEditing(null)} hitSlop={10}>
                <Text style={s.cancel}>Cancel</Text>
              </Pressable>
              <Text style={s.modalTitle}>{editing?.id ? "Edit Income" : "New Income"}</Text>
              <Pressable onPress={save} disabled={saving} hitSlop={10}>
                <Text style={[s.save, saving && { opacity: 0.5 }]}>{saving ? "Saving…" : "Save"}</Text>
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
              <FormError>{error}</FormError>

              <Field label="Name" required>
                <Input value={form.name} onChangeText={(t) => setForm({ ...form, name: t })} placeholder="Payroll" />
              </Field>

              <Field label="Amount Per Check" required>
                <MoneyInput value={form.fixed_amount} onChangeText={(t) => setForm({ ...form, fixed_amount: t })} />
              </Field>

              <Field label="Frequency" required>
                <Select value={form.frequency} onChange={(v) => setForm({ ...form, frequency: v })} options={FREQUENCIES} />
              </Field>

              <Field label="Next Pay Date" required hint="Pay periods are generated forward from this date.">
                <DateField value={form.next_pay_date} onChange={(v) => setForm({ ...form, next_pay_date: v })} />
              </Field>

              <Field label="Type">
                <Select value={form.type} onChange={(v) => setForm({ ...form, type: v })} options={TYPES} />
              </Field>

              <Field label="Owner">
                <Select value={form.owner} onChange={(v) => setForm({ ...form, owner: v })} options={OWNERS} />
              </Field>

              <Field label="Deposits To" hint="Which account this paycheck lands in.">
                <Select
                  value={form.deposit_account_id}
                  onChange={(v) => setForm({ ...form, deposit_account_id: v })}
                  options={accountOptions}
                  placeholder="None"
                />
              </Field>

              {editing?.id && (
                <View style={{ marginTop: 18 }}>
                  <Divider style={{ marginBottom: 18 }} />
                  <Btn title="Delete Income" kind="danger" onPress={() => confirmDelete(editing)} />
                </View>
              )}
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
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
  note: { color: c.textDim, fontSize: 11, textAlign: "center", marginTop: 18, lineHeight: 16 },
  modalHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: c.border,
  },
  modalTitle: { color: c.text, fontSize: 16, fontWeight: "700" },
  cancel: { color: c.textMuted, fontSize: 15 },
  save: { color: c.accent, fontSize: 15, fontWeight: "700" },
});
