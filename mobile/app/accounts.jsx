import { useState } from "react";
import {
  View, Text, ScrollView, Pressable, RefreshControl, Modal, Alert,
  KeyboardAvoidingView, Platform, StyleSheet,
} from "react-native";
import { SafeAreaView, SafeAreaProvider } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../src/supabase";
import { useStrydeData } from "../src/useStrydeData";
import { Panel, Money, Loading, Empty, Pill, Divider } from "../src/ui";
import { Field, Input, MoneyInput, Select, Toggle, Btn, FormError, DAYS } from "../src/form";
import { c } from "../src/theme";

const TYPES = [
  { label: "Checking", value: "checking" },
  { label: "Savings", value: "savings" },
  { label: "Credit Card", value: "credit" },
  { label: "Cash", value: "cash" },
  { label: "Other", value: "other" },
];

const RESET_TYPES = [
  { label: "Never", value: "never" },
  { label: "Monthly", value: "monthly" },
  { label: "Each pay period", value: "period" },
];

const blank = {
  name: "", bank_name: "", last_four: "", account_type: "checking",
  current_balance: "", is_primary: false, is_accumulating: false,
  accumulation_target: "", due_day: null, reset_type: "never",
  reset_day: null, minimum_buffer: "",
};

export default function Accounts() {
  const d = useStrydeData();
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blank);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  if (d.loading) return <Loading />;

  const total = d.accounts.reduce((sum, a) => sum + (a.current_balance || 0), 0);

  function openNew() { setForm(blank); setError(""); setEditing({}); }
  function openEdit(a) {
    setForm({
      name: a.name || "",
      bank_name: a.bank_name || "",
      last_four: a.last_four || "",
      account_type: a.account_type || "checking",
      current_balance: a.current_balance == null ? "" : String(a.current_balance),
      is_primary: !!a.is_primary,
      is_accumulating: !!a.is_accumulating,
      accumulation_target: a.accumulation_target == null ? "" : String(a.accumulation_target),
      due_day: a.due_day || null,
      reset_type: a.reset_type || "never",
      reset_day: a.reset_day || null,
      minimum_buffer: a.minimum_buffer == null ? "" : String(a.minimum_buffer),
    });
    setError("");
    setEditing(a);
  }

  async function save() {
    if (!form.name) return setError("Name is required.");
    if (form.is_accumulating && !form.accumulation_target) {
      return setError("An accumulating account needs a target amount.");
    }
    if (form.is_accumulating && !form.due_day) {
      return setError("An accumulating account needs the day its bill is due.");
    }
    setError("");
    setSaving(true);

    const payload = {
      name: form.name,
      bank_name: form.bank_name || null,
      last_four: form.last_four || null,
      account_type: form.account_type,
      current_balance: parseFloat(form.current_balance) || 0,
      is_primary: form.is_primary,
      is_accumulating: form.is_accumulating,
      accumulation_target: form.is_accumulating && form.accumulation_target
        ? parseFloat(form.accumulation_target) : null,
      due_day: form.is_accumulating && form.due_day ? parseInt(form.due_day) : null,
      reset_type: form.reset_type,
      reset_day: form.reset_day ? parseInt(form.reset_day) : null,
      minimum_buffer: form.minimum_buffer ? parseFloat(form.minimum_buffer) : 0,
    };

    let dbError;
    if (editing?.id) {
      ({ error: dbError } = await supabase.from("accounts").update(payload).eq("id", editing.id));
    } else {
      ({ error: dbError } = await supabase.from("accounts").insert({
        ...payload, household_id: d.household.id,
      }));
    }

    setSaving(false);
    if (dbError) return setError(dbError.message);
    setEditing(null);
    d.reload();
  }

  function confirmDelete(a) {
    const linked = d.bills.filter((b) => b.account_id === a.id).length;
    Alert.alert(
      "Delete account?",
      linked > 0
        ? `"${a.name}" is used by ${linked} bill${linked === 1 ? "" : "s"}. Those bills will lose their source account.`
        : `"${a.name}" will be removed.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const { error } = await supabase.from("accounts").delete().eq("id", a.id);
            if (error) Alert.alert("Couldn't delete", error.message);
            setEditing(null);
            d.reload();
          },
        },
      ]
    );
  }

  return (
    <SafeAreaView style={s.screen} edges={["top"]}>
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={false} onRefresh={d.reload} tintColor={c.accent} />}
      >
        <View style={s.headerRow}>
          <Text style={s.pageTitle}>Accounts</Text>
          <Pressable onPress={openNew} style={s.addBtn}>
            <Ionicons name="add" size={16} color="#13111F" />
            <Text style={s.addBtnText}>Add</Text>
          </Pressable>
        </View>

        <View style={s.summary}>
          <Text style={s.faint}>{d.accounts.length} total</Text>
          <Money value={total} color={c.success} size={14} weight="600" />
        </View>

        {d.accounts.length === 0 && <Empty text="No accounts yet — tap Add to create one" />}

        {d.accounts.map((a) => (
          <Pressable key={a.id} onPress={() => openEdit(a)}>
            <Panel style={{ marginBottom: 8 }}>
              <View style={s.row}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                    <Text style={s.name}>{a.name}</Text>
                    {a.is_primary && <Pill text="PRIMARY" />}
                    {a.is_accumulating && <Pill text="ACCUMULATING" color={c.success} bg="rgba(0,212,170,0.1)" />}
                  </View>
                  {!!a.bank_name && (
                    <Text style={s.faintSm}>
                      {a.bank_name}{a.last_four ? ` ···${a.last_four}` : ""}
                    </Text>
                  )}
                  {a.is_accumulating && a.accumulation_target > 0 && (
                    <Text style={s.faintSm}>
                      ${(a.current_balance || 0).toFixed(2)} of ${a.accumulation_target.toFixed(2)} saved
                    </Text>
                  )}
                </View>
                <Money value={a.current_balance} color={c.text} size={15} weight="600" />
                <Ionicons name="chevron-forward" size={15} color={c.textDim} style={{ marginLeft: 8 }} />
              </View>

              {a.is_accumulating && a.accumulation_target > 0 && (
                <View style={s.barTrack}>
                  <View style={[s.barFill, {
                    width: `${Math.min(100, ((a.current_balance || 0) / a.accumulation_target) * 100)}%`,
                  }]} />
                </View>
              )}
            </Panel>
          </Pressable>
        ))}

        <Text style={s.note}>
          Balances sync from your bank via Plaid on the web app. Editing here sets them manually.
        </Text>
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
              <Text style={s.modalTitle}>{editing?.id ? "Edit Account" : "New Account"}</Text>
              <Pressable onPress={save} disabled={saving} hitSlop={10}>
                <Text style={[s.save, saving && { opacity: 0.5 }]}>{saving ? "Saving…" : "Save"}</Text>
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
              <FormError>{error}</FormError>

              <Field label="Name" required>
                <Input value={form.name} onChangeText={(t) => setForm({ ...form, name: t })} placeholder="Spending" />
              </Field>

              <Field label="Current Balance">
                <MoneyInput value={form.current_balance} onChangeText={(t) => setForm({ ...form, current_balance: t })} />
              </Field>

              <View style={{ flexDirection: "row", gap: 10 }}>
                <View style={{ flex: 2 }}>
                  <Field label="Bank">
                    <Input value={form.bank_name} onChangeText={(t) => setForm({ ...form, bank_name: t })} placeholder="Chase" />
                  </Field>
                </View>
                <View style={{ flex: 1 }}>
                  <Field label="Last 4">
                    <Input
                      value={form.last_four}
                      onChangeText={(t) => setForm({ ...form, last_four: t.replace(/[^0-9]/g, "").slice(0, 4) })}
                      placeholder="1234"
                      keyboardType="number-pad"
                    />
                  </Field>
                </View>
              </View>

              <Field label="Type">
                <Select value={form.account_type} onChange={(v) => setForm({ ...form, account_type: v })} options={TYPES} />
              </Field>

              <Toggle
                label="Primary account"
                hint="Your main spending account. 'Available Now' is this balance."
                value={form.is_primary}
                onValueChange={(v) => setForm({ ...form, is_primary: v })}
              />

              <Toggle
                label="Accumulating account"
                hint="Saves up gradually for a big periodic bill (e.g. escrow) instead of paying it all at once."
                value={form.is_accumulating}
                onValueChange={(v) => setForm({ ...form, is_accumulating: v, is_primary: v ? false : form.is_primary })}
              />

              {form.is_accumulating && (
                <>
                  <Field label="Target Amount" required hint="The full amount you're saving toward.">
                    <MoneyInput
                      value={form.accumulation_target}
                      onChangeText={(t) => setForm({ ...form, accumulation_target: t })}
                    />
                  </Field>
                  <Field label="Due Day" required hint="The day of the month the bill is due.">
                    <Select
                      value={form.due_day}
                      onChange={(v) => setForm({ ...form, due_day: v })}
                      options={DAYS}
                      placeholder="Pick a day"
                    />
                  </Field>
                </>
              )}

              <Field label="Minimum Buffer" hint="Keep this much extra in the account when funding it.">
                <MoneyInput value={form.minimum_buffer} onChangeText={(t) => setForm({ ...form, minimum_buffer: t })} />
              </Field>

              <Field label="Resets">
                <Select value={form.reset_type} onChange={(v) => setForm({ ...form, reset_type: v })} options={RESET_TYPES} />
              </Field>

              {form.reset_type === "monthly" && (
                <Field label="Reset Day">
                  <Select
                    value={form.reset_day}
                    onChange={(v) => setForm({ ...form, reset_day: v })}
                    options={DAYS}
                    placeholder="Pick a day"
                  />
                </Field>
              )}

              {editing?.id && (
                <View style={{ marginTop: 18 }}>
                  <Divider style={{ marginBottom: 18 }} />
                  <Btn title="Delete Account" kind="danger" onPress={() => confirmDelete(editing)} />
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
  barTrack: { height: 4, backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 2, marginTop: 10, overflow: "hidden" },
  barFill: { height: 4, backgroundColor: c.success, borderRadius: 2 },
  note: { color: c.textDim, fontSize: 11, textAlign: "center", marginTop: 18, lineHeight: 16 },
  modalHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: c.border,
  },
  modalTitle: { color: c.text, fontSize: 16, fontWeight: "700" },
  cancel: { color: c.textMuted, fontSize: 15 },
  save: { color: c.accent, fontSize: 15, fontWeight: "700" },
});
