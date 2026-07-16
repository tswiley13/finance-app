import { useState } from "react";
import {
  View, Text, ScrollView, Pressable, RefreshControl, Modal, Alert,
  KeyboardAvoidingView, Platform, StyleSheet,
} from "react-native";
import { SafeAreaView, SafeAreaProvider } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../src/supabase";
import { useStrydeData } from "../src/useStrydeData";
import { Panel, Label, Money, Loading, Empty, Pill, Divider } from "../src/ui";
import { Field, Input, MoneyInput, Select, Btn, FormError } from "../src/form";
import { ScreenHeader } from "../src/ScreenHeader";
import { c } from "../src/theme";

const OWNERS = [
  { label: "Joint", value: "joint" },
  { label: "Mine", value: "mine" },
  { label: "Partner's", value: "partner" },
];

const CATEGORIES = [
  { label: "Credit Card", value: "credit_card" },
  { label: "Auto Loan", value: "auto" },
  { label: "Student Loan", value: "student" },
  { label: "Medical", value: "medical" },
  { label: "Personal Loan", value: "personal" },
  { label: "Mortgage", value: "mortgage" },
  { label: "Other", value: "other" },
];

const blank = {
  name: "", balance: "", interest_rate: "", minimum_payment: "",
  owner: "joint", category: "credit_card", payoff_order: "",
};

export default function Debts() {
  const d = useStrydeData();
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blank);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  if (d.loading) return <Loading />;

  const open = d.debts.filter((x) => !x.is_paid_off);
  const totalBalance = open.reduce((sum, x) => sum + (x.balance || 0), 0);
  const totalMin = open.reduce((sum, x) => sum + (x.minimum_payment || 0), 0);

  function openNew() { setForm(blank); setError(""); setEditing({}); }
  function openEdit(x) {
    setForm({
      name: x.name || "",
      balance: x.balance == null ? "" : String(x.balance),
      // Stored as a decimal (0.199); shown as a percent (19.9).
      interest_rate: x.interest_rate == null ? "" : String((x.interest_rate * 100).toFixed(2)).replace(/\.00$/, ""),
      minimum_payment: x.minimum_payment == null ? "" : String(x.minimum_payment),
      owner: x.owner || "joint",
      category: x.category || "credit_card",
      payoff_order: x.payoff_order == null ? "" : String(x.payoff_order),
    });
    setError("");
    setEditing(x);
  }

  async function save() {
    if (!form.name || !form.balance || !form.minimum_payment) {
      return setError("Name, balance, and minimum payment are required.");
    }
    setError("");
    setSaving(true);

    const payload = {
      name: form.name,
      owner: form.owner,
      category: form.category,
      balance: parseFloat(form.balance),
      interest_rate: form.interest_rate ? parseFloat(form.interest_rate) / 100 : null,
      minimum_payment: parseFloat(form.minimum_payment),
      payoff_order: form.payoff_order ? parseInt(form.payoff_order) : null,
    };

    let dbError;
    if (editing?.id) {
      ({ error: dbError } = await supabase.from("debts").update(payload).eq("id", editing.id));
    } else {
      ({ error: dbError } = await supabase.from("debts").insert({
        ...payload, household_id: d.household.id, is_paid_off: false,
      }));
    }

    setSaving(false);
    if (dbError) return setError(dbError.message);
    setEditing(null);
    d.reload();
  }

  async function togglePaidOff(x) {
    await supabase.from("debts").update({ is_paid_off: !x.is_paid_off }).eq("id", x.id);
    d.reload();
  }

  function confirmDelete(x) {
    Alert.alert("Delete debt?", `"${x.name}" will be removed.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const { error: e } = await supabase.from("debts").delete().eq("id", x.id);
          if (e) Alert.alert("Couldn't delete", e.message);
          setEditing(null);
          d.reload();
        },
      },
    ]);
  }

  const paidOff = d.debts.filter((x) => x.is_paid_off);

  return (
    <SafeAreaView style={s.screen} edges={["top"]}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScreenHeader
        title="Debts"
        action={
          <Pressable onPress={openNew} hitSlop={10}>
            <Ionicons name="add" size={24} color={c.accent} />
          </Pressable>
        }
      />

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={false} onRefresh={d.reload} tintColor={c.accent} />}
      >
        {d.debts.length > 0 && (
          <View style={s.tileRow}>
            <Panel style={{ flex: 1 }}>
              <Label>Total Owed</Label>
              <Money value={totalBalance} color={c.danger} size={19} style={{ marginTop: 6 }} />
            </Panel>
            <Panel style={{ flex: 1 }}>
              <Label>Min / Month</Label>
              <Money value={totalMin} color={c.text} size={19} style={{ marginTop: 6 }} />
            </Panel>
          </View>
        )}

        {d.debts.length === 0 && <Empty text="No debts tracked — tap + to add one" />}

        {open.length > 0 && <Label style={{ marginTop: 20, marginBottom: 8 }}>Open</Label>}
        {open.map((x) => (
          <Pressable key={x.id} onPress={() => openEdit(x)}>
            <Panel style={{ marginBottom: 8 }}>
              <View style={s.row}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                    <Text style={s.name}>{x.name}</Text>
                    {x.payoff_order != null && <Pill text={`#${x.payoff_order}`} />}
                  </View>
                  <Text style={s.faintSm}>
                    {CATEGORIES.find((cat) => cat.value === x.category)?.label || x.category}
                    {x.interest_rate ? ` · ${(x.interest_rate * 100).toFixed(2)}% APR` : ""}
                  </Text>
                  <Text style={s.faintSm}>Min ${(x.minimum_payment || 0).toFixed(2)}/mo</Text>
                </View>
                <Money value={x.balance} color={c.danger} size={15} weight="600" />
                <Ionicons name="chevron-forward" size={15} color={c.textDim} style={{ marginLeft: 8 }} />
              </View>
              <Pressable onPress={() => togglePaidOff(x)} style={s.markBtn}>
                <Text style={s.markText}>Mark paid off</Text>
              </Pressable>
            </Panel>
          </Pressable>
        ))}

        {paidOff.length > 0 && <Label style={{ marginTop: 16, marginBottom: 8 }}>Paid Off 🎉</Label>}
        {paidOff.map((x) => (
          <Panel key={x.id} style={{ marginBottom: 8, opacity: 0.6 }}>
            <View style={s.row}>
              <View style={{ flex: 1 }}>
                <Text style={[s.name, { textDecorationLine: "line-through", color: c.textMuted }]}>{x.name}</Text>
                <Pressable onPress={() => togglePaidOff(x)} hitSlop={6}>
                  <Text style={[s.markText, { marginTop: 4 }]}>Reopen</Text>
                </Pressable>
              </View>
              <Money value={x.balance} color={c.textDim} size={13} />
            </View>
          </Panel>
        ))}
      </ScrollView>

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
              <Text style={s.modalTitle}>{editing?.id ? "Edit Debt" : "New Debt"}</Text>
              <Pressable onPress={save} disabled={saving} hitSlop={10}>
                <Text style={[s.save, saving && { opacity: 0.5 }]}>{saving ? "Saving…" : "Save"}</Text>
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
              <FormError>{error}</FormError>

              <Field label="Name" required>
                <Input value={form.name} onChangeText={(t) => setForm({ ...form, name: t })} placeholder="Visa" />
              </Field>

              <Field label="Balance" required>
                <MoneyInput value={form.balance} onChangeText={(t) => setForm({ ...form, balance: t })} />
              </Field>

              <Field label="Minimum Payment" required>
                <MoneyInput value={form.minimum_payment} onChangeText={(t) => setForm({ ...form, minimum_payment: t })} />
              </Field>

              <Field label="Interest Rate" hint="Annual percentage rate, e.g. 19.99">
                <Input
                  value={form.interest_rate}
                  onChangeText={(t) => setForm({ ...form, interest_rate: t.replace(/[^0-9.]/g, "") })}
                  placeholder="19.99"
                  keyboardType="decimal-pad"
                />
              </Field>

              <Field label="Category">
                <Select value={form.category} onChange={(v) => setForm({ ...form, category: v })} options={CATEGORIES} />
              </Field>

              <Field label="Owner">
                <Select value={form.owner} onChange={(v) => setForm({ ...form, owner: v })} options={OWNERS} />
              </Field>

              <Field label="Payoff Order" hint="Lower numbers get attacked first (snowball or avalanche — your call).">
                <Input
                  value={form.payoff_order}
                  onChangeText={(t) => setForm({ ...form, payoff_order: t.replace(/[^0-9]/g, "") })}
                  placeholder="1"
                  keyboardType="number-pad"
                />
              </Field>

              {editing?.id && (
                <View style={{ marginTop: 18 }}>
                  <Divider style={{ marginBottom: 18 }} />
                  <Btn title="Delete Debt" kind="danger" onPress={() => confirmDelete(editing)} />
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
  tileRow: { flexDirection: "row", gap: 8 },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  name: { color: c.text, fontSize: 14, fontWeight: "600" },
  faintSm: { color: c.textFaint, fontSize: 11, marginTop: 2 },
  markBtn: { marginTop: 10, alignSelf: "flex-start" },
  markText: { color: c.accent, fontSize: 11, fontWeight: "600" },
  modalHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: c.border,
  },
  modalTitle: { color: c.text, fontSize: 16, fontWeight: "700" },
  cancel: { color: c.textMuted, fontSize: 15 },
  save: { color: c.accent, fontSize: 15, fontWeight: "700" },
});
