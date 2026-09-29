import { useEffect, useState } from "react";
import { View, Text, ScrollView, Pressable, RefreshControl, StyleSheet, TextInput, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { groupBillsForOverview, ordinalSuffix, billMultiplier, incMultiplier } from "@stryde/shared";
import { useStrydeData } from "../../src/useStrydeData";
import { supabase } from "../../src/supabase";
import { Panel, Label, Money, StatTile, Empty, Divider, dataGate } from "../../src/ui";
import { MoneyInput, Select } from "../../src/form";
import { c } from "../../src/theme";

// Monthly Overview + What-If editor. Mirrors the web dashboard's What-If mode
// (client/src/pages/Dashboard.jsx) and the desktop MonthlyOverviewView so a
// scenario saved on any client loads on the others. Scenario JSON shape:
//   { bills: {id:{amount,enabled,removed,name}}, income: {…}, extraBills:[], extraIncome:[] }
export default function Monthly() {
  const d = useStrydeData();
  const [whatIf, setWhatIf] = useState(false);
  const [wiBills, setWiBills] = useState({});     // { [id]: {amount, enabled, removed, name} }
  const [wiIncome, setWiIncome] = useState({});   // { [id]: {amount, enabled, name} }
  const [extraBills, setExtraBills] = useState([]);   // [{id,name,amount,frequency,due_day,enabled}]
  const [extraIncome, setExtraIncome] = useState([]); // [{id,name,amount,frequency,enabled}]
  const [nextId, setNextId] = useState(1);
  const [scenarios, setScenarios] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [scenarioName, setScenarioName] = useState("");
  const [showAddIncome, setShowAddIncome] = useState(false);
  const [showAddBill, setShowAddBill] = useState(false);
  const [billDraft, setBillDraft] = useState({ name: "", amount: "", frequency: "monthly", due_day: "" });
  const [incomeDraft, setIncomeDraft] = useState({ name: "", amount: "", frequency: "monthly" });
  const [editBillName, setEditBillName] = useState(null);
  const [editIncName, setEditIncName] = useState(null);

  const householdId = d.household?.id;
  useEffect(() => {
    if (!householdId) return;
    supabase
      .from("what_if_scenarios")
      .select("*")
      .eq("household_id", householdId)
      .order("updated_at", { ascending: false })
      .then(({ data }) => setScenarios(data || []));
  }, [householdId]);

  const gate = dataGate(d);
  if (gate) return gate;

  // ── override helpers (identical semantics to web) ──────────────────────────
  const setBillOv = (id, f, v) => setWiBills((p) => ({ ...p, [id]: { ...p[id], [f]: v } }));
  const setIncOv = (id, f, v) => setWiIncome((p) => ({ ...p, [id]: { ...p[id], [f]: v } }));
  const billEnabled = (b) => wiBills[b.id]?.enabled ?? true;
  const billRemoved = (b) => !!wiBills[b.id]?.removed;
  const billNm = (b) => wiBills[b.id]?.name ?? b.name;
  const billRealMonthly = (b) => (b.amount || 0) * billMultiplier(b.frequency || "monthly");
  const billMonthly = (b) => {
    const ov = wiBills[b.id]?.amount;
    if (whatIf && ov !== undefined && String(ov).trim() !== "") return parseFloat(ov) || 0;
    return billRealMonthly(b);
  };
  const incEnabled = (i) => wiIncome[i.id]?.enabled ?? true;
  const incNm = (i) => wiIncome[i.id]?.name ?? i.name;
  const incRealMonthly = (i) => (i.fixed_amount || 0) * incMultiplier(i.frequency);
  const incMonthly = (i) => {
    const ov = wiIncome[i.id]?.amount;
    if (whatIf && ov !== undefined && String(ov).trim() !== "") return parseFloat(ov) || 0;
    return incRealMonthly(i);
  };

  const activeBills = d.bills.filter((b) => b.is_active !== false);
  const realBills = activeBills.reduce((s, b) => s + billRealMonthly(b), 0);
  const realIncome = d.income.reduce((s, i) => s + incRealMonthly(i), 0);

  const wiMonthlyBills = whatIf
    ? activeBills.reduce((s, b) => (billEnabled(b) && !billRemoved(b) ? s + billMonthly(b) : s), 0) +
      extraBills.filter((b) => b.enabled !== false).reduce((s, b) => s + (parseFloat(b.amount) || 0), 0)
    : realBills;
  const wiMonthlyIncome = whatIf
    ? d.income.reduce((s, i) => (incEnabled(i) ? s + incMonthly(i) : s), 0) +
      extraIncome.filter((i) => i.enabled !== false).reduce((s, i) => s + (parseFloat(i.amount) || 0), 0)
    : realIncome;
  const remaining = wiMonthlyIncome - wiMonthlyBills;
  const deltaRemaining = remaining - (realIncome - realBills);

  // Bills shown in the list (real minus removed, plus hypotheticals), grouped.
  const viewBills = [
    ...d.bills.filter((b) => !(whatIf && wiBills[b.id]?.removed)).map((b) => ({ ...b, _extra: false })),
    ...(whatIf ? extraBills.map((b) => ({ ...b, _extra: true })) : []),
  ];
  const groups = groupBillsForOverview(viewBills);
  const groupList = [
    ["Every Paycheck", groups.everyPaycheck],
    ["Due 1st – 15th", groups.firstHalf],
    ["Due 16th – 31st", groups.secondHalf],
    ["No Due Date", groups.noDueDay],
  ].filter(([, list]) => list.length > 0);

  const incomeRows = [
    ...d.income.map((i) => ({ ...i, _extra: false })),
    ...(whatIf ? extraIncome.map((i) => ({ ...i, _extra: true })) : []),
  ];

  // ── scenario persistence (same table + shape as web/desktop) ───────────────
  const currentData = () => ({ bills: wiBills, income: wiIncome, extraBills, extraIncome });
  function resetWhatIf() {
    setWiBills({}); setWiIncome({}); setExtraBills([]); setExtraIncome([]);
    setActiveId(null); setScenarioName(""); setShowAddIncome(false); setShowAddBill(false);
    setBillDraft({ name: "", amount: "", frequency: "monthly", due_day: "" });
    setIncomeDraft({ name: "", amount: "", frequency: "monthly" });
  }
  async function saveAsNew() {
    const name = scenarioName.trim();
    if (!name) return Alert.alert("Name your scenario", 'Type a name first (e.g. "Renting a house").');
    const { data, error } = await supabase
      .from("what_if_scenarios")
      .insert({ household_id: householdId, name, data: currentData(), updated_at: new Date().toISOString() })
      .select().single();
    if (error) return Alert.alert("Couldn't save", error.message);
    setScenarios((p) => [data, ...p]); setActiveId(data.id); setScenarioName("");
  }
  async function saveChanges() {
    const active = scenarios.find((s) => s.id === activeId);
    if (!active) return saveAsNew();
    const { data, error } = await supabase
      .from("what_if_scenarios")
      .update({ data: currentData(), updated_at: new Date().toISOString() })
      .eq("id", active.id).select().single();
    if (error) return Alert.alert("Couldn't save", error.message);
    setScenarios((p) => p.map((s) => (s.id === active.id ? data : s)));
  }
  function loadScenario(id) {
    const sc = scenarios.find((x) => x.id === id);
    if (!sc) return;
    const dd = sc.data || {};
    setWiBills(dd.bills || {}); setWiIncome(dd.income || {});
    setExtraBills(dd.extraBills || []); setExtraIncome(dd.extraIncome || []);
    setNextId(Date.now()); setActiveId(id); setScenarioName(""); setWhatIf(true);
  }
  function duplicateScenario() {
    const sc = scenarios.find((x) => x.id === activeId);
    const name = (sc ? sc.name : scenarioName.trim() || "Scenario") + " (copy)";
    supabase
      .from("what_if_scenarios")
      .insert({ household_id: householdId, name, data: currentData(), updated_at: new Date().toISOString() })
      .select().single()
      .then(({ data, error }) => {
        if (error) return Alert.alert("Couldn't duplicate", error.message);
        setScenarios((p) => [data, ...p]); setActiveId(data.id);
      });
  }
  function deleteScenario() {
    if (!activeId) return;
    const sc = scenarios.find((x) => x.id === activeId);
    Alert.alert("Delete scenario", `Delete "${sc?.name}"? This can't be undone.`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
        await supabase.from("what_if_scenarios").delete().eq("id", activeId);
        setScenarios((p) => p.filter((s) => s.id !== activeId));
        resetWhatIf();
      } },
    ]);
  }
  function addDraftBill() {
    if (!billDraft.name.trim() || !billDraft.amount) return;
    setExtraBills((p) => [...p, {
      id: `xb${nextId}`, name: billDraft.name.trim(), amount: billDraft.amount,
      frequency: billDraft.frequency, due_day: parseInt(billDraft.due_day) || 0, enabled: true,
    }]);
    setNextId((n) => n + 1);
    setBillDraft({ name: "", amount: "", frequency: "monthly", due_day: "" });
    setShowAddBill(false);
  }
  function addDraftIncome() {
    if (!incomeDraft.name.trim() || !incomeDraft.amount) return;
    setExtraIncome((p) => [...p, {
      id: `xi${nextId}`, name: incomeDraft.name.trim(), amount: incomeDraft.amount,
      frequency: incomeDraft.frequency, enabled: true,
    }]);
    setNextId((n) => n + 1);
    setIncomeDraft({ name: "", amount: "", frequency: "monthly" });
    setShowAddIncome(false);
  }

  // ── row renderers ──────────────────────────────────────────────────────────
  const billRow = (b) => {
    const isExtra = b._extra;
    const enabled = isExtra ? b.enabled !== false : billEnabled(b);
    const off = whatIf && !enabled;
    const monthly = isExtra ? (parseFloat(b.amount) || 0) : billMonthly(b);
    const inputVal = isExtra ? String(b.amount ?? "") : (wiBills[b.id]?.amount ?? String(+billRealMonthly(b).toFixed(2)));
    const freq = b.frequency || "monthly";
    return (
      <View key={b.id} style={[s.billRow, { opacity: off ? 0.4 : 1 }]}>
        {whatIf && (
          <Pressable
            onPress={() => {
              if (isExtra) setExtraBills((x) => x.map((y) => (y.id === b.id ? { ...y, enabled: !(y.enabled !== false) } : y)));
              else setBillOv(b.id, "enabled", !enabled);
            }}
            style={[s.check, !off && { backgroundColor: "rgba(108,99,255,0.2)", borderColor: c.accent }]}
          >
            {!off && <Text style={{ color: c.accent, fontSize: 9 }}>✓</Text>}
          </Pressable>
        )}
        <View style={{ flex: 1 }}>
          {whatIf && editBillName === b.id ? (
            <TextInput
              value={isExtra ? b.name : billNm(b)}
              autoFocus
              onChangeText={(v) => { if (isExtra) setExtraBills((x) => x.map((y) => (y.id === b.id ? { ...y, name: v } : y))); else setBillOv(b.id, "name", v); }}
              onBlur={() => setEditBillName(null)}
              style={s.nameEdit}
            />
          ) : (
            <Pressable disabled={!whatIf} onPress={() => setEditBillName(b.id)}>
              <Text style={[s.billName, off && { textDecorationLine: "line-through", color: c.textMuted }]}>
                {isExtra ? b.name : billNm(b)}
              </Text>
            </Pressable>
          )}
          <Text style={s.faintSm}>
            {freq === "payday" ? "Every Pay Day" : b.due_day ? `Due the ${b.due_day}${ordinalSuffix(b.due_day)}` : ""}
          </Text>
        </View>
        {whatIf ? (
          <View style={{ width: 110 }}>
            <MoneyInput
              value={inputVal}
              onChangeText={(v) => { if (isExtra) setExtraBills((x) => x.map((y) => (y.id === b.id ? { ...y, amount: v } : y))); else setBillOv(b.id, "amount", v); }}
            />
          </View>
        ) : (
          <Money value={monthly} color={c.danger} size={13} />
        )}
        {whatIf && (
          <Pressable
            onPress={() => { if (isExtra) setExtraBills((x) => x.filter((y) => y.id !== b.id)); else setBillOv(b.id, "removed", true); }}
            hitSlop={8} style={{ paddingLeft: 2 }}
          >
            <Ionicons name="close" size={16} color={c.danger} />
          </Pressable>
        )}
      </View>
    );
  };

  const incomeRow = (i) => {
    const isExtra = i._extra;
    const enabled = isExtra ? i.enabled !== false : incEnabled(i);
    const off = whatIf && !enabled;
    const monthly = isExtra ? (parseFloat(i.amount) || 0) : incMonthly(i);
    const inputVal = isExtra ? String(i.amount ?? "") : (wiIncome[i.id]?.amount ?? String(+incRealMonthly(i).toFixed(2)));
    return (
      <View key={i.id} style={[s.billRow, { opacity: off ? 0.4 : 1 }]}>
        {whatIf && (
          <Pressable
            onPress={() => {
              if (isExtra) setExtraIncome((x) => x.map((y) => (y.id === i.id ? { ...y, enabled: !(y.enabled !== false) } : y)));
              else setIncOv(i.id, "enabled", !enabled);
            }}
            style={[s.check, !off && { backgroundColor: "rgba(108,99,255,0.2)", borderColor: c.accent }]}
          >
            {!off && <Text style={{ color: c.accent, fontSize: 9 }}>✓</Text>}
          </Pressable>
        )}
        <View style={{ flex: 1 }}>
          {whatIf && editIncName === i.id ? (
            <TextInput
              value={isExtra ? i.name : incNm(i)}
              autoFocus
              onChangeText={(v) => { if (isExtra) setExtraIncome((x) => x.map((y) => (y.id === i.id ? { ...y, name: v } : y))); else setIncOv(i.id, "name", v); }}
              onBlur={() => setEditIncName(null)}
              style={s.nameEdit}
            />
          ) : (
            <Pressable disabled={!whatIf} onPress={() => setEditIncName(i.id)}>
              <Text style={[s.billName, off && { color: c.textMuted }]}>{isExtra ? i.name : incNm(i)}</Text>
            </Pressable>
          )}
          <Text style={s.faintSm}>{(i.frequency || "monthly")}</Text>
        </View>
        {whatIf ? (
          <View style={{ width: 110 }}>
            <MoneyInput
              value={inputVal}
              onChangeText={(v) => { if (isExtra) setExtraIncome((x) => x.map((y) => (y.id === i.id ? { ...y, amount: v } : y))); else setIncOv(i.id, "amount", v); }}
            />
          </View>
        ) : (
          <Money value={monthly} color={c.success} size={13} />
        )}
        {whatIf && (
          <Pressable
            onPress={() => { if (isExtra) setExtraIncome((x) => x.filter((y) => y.id !== i.id)); else setIncOv(i.id, "enabled", !enabled); }}
            hitSlop={8} style={{ paddingLeft: 2 }}
          >
            <Ionicons name={isExtra ? "close" : (enabled ? "eye-outline" : "eye-off-outline")} size={16} color={c.danger} />
          </Pressable>
        )}
      </View>
    );
  };

  const activeScenario = scenarios.find((sc) => sc.id === activeId);

  return (
    <SafeAreaView style={s.screen} edges={["top"]}>
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={false} onRefresh={d.reload} tintColor={c.accent} />}
      >
        <View style={s.headerRow}>
          <Text style={s.pageTitle}>Monthly Overview</Text>
          <Pressable
            onPress={() => { if (whatIf) resetWhatIf(); setWhatIf(!whatIf); }}
            style={[s.whatIfBtn, whatIf && { backgroundColor: c.warning }]}
          >
            <Text style={[s.whatIfText, whatIf && { color: "#13111F" }]}>{whatIf ? "✕  Exit" : "⚡ What-If Tool"}</Text>
          </Pressable>
        </View>

        {whatIf && (
          <Panel style={s.whatIfBanner}>
            <Text style={{ color: c.warning, fontSize: 13, fontWeight: "600" }}>What-If Tool</Text>
            <Text style={{ color: c.textMuted, fontSize: 11, marginTop: 2 }}>
              Edit amounts, toggle lines, add hypotheticals. Nothing touches your real data until you save it as a scenario.
            </Text>
          </Panel>
        )}

        {/* Saved scenarios */}
        {whatIf && (
          <Panel style={{ marginBottom: 12 }}>
            <Label style={{ marginBottom: 8 }}>Saved Scenarios</Label>
            {scenarios.length > 0 && (
              <Select
                value={activeId || ""}
                onChange={(v) => (v ? loadScenario(v) : resetWhatIf())}
                placeholder="Load a saved scenario…"
                options={[{ label: "— New (unsaved) —", value: "" }, ...scenarios.map((sc) => ({ label: sc.name, value: sc.id }))]}
              />
            )}
            <View style={{ flexDirection: "row", gap: 8, marginTop: scenarios.length > 0 ? 10 : 0 }}>
              <TextInput
                value={scenarioName}
                onChangeText={setScenarioName}
                placeholder={activeScenario ? "New scenario name…" : "Name this scenario…"}
                placeholderTextColor={c.textDim}
                style={[s.nameEdit, { flex: 1 }]}
              />
              <Pressable onPress={saveAsNew} disabled={!scenarioName.trim()} style={[s.smBtn, s.smBtnPrimary, !scenarioName.trim() && { opacity: 0.5 }]}>
                <Text style={s.smBtnPrimaryText}>Save</Text>
              </Pressable>
            </View>
            {activeScenario && (
              <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
                <Pressable onPress={saveChanges} style={[s.smBtn, s.smBtnGhost, { flex: 1 }]}>
                  <Text style={s.smBtnGhostText}>Save changes</Text>
                </Pressable>
                <Pressable onPress={duplicateScenario} style={[s.smBtn, s.smBtnGhost, { flex: 1 }]}>
                  <Text style={s.smBtnGhostText}>Duplicate</Text>
                </Pressable>
                <Pressable onPress={deleteScenario} style={[s.smBtn, s.smBtnDanger]}>
                  <Text style={{ color: c.danger, fontSize: 12, fontWeight: "700" }}>Delete</Text>
                </Pressable>
              </View>
            )}
          </Panel>
        )}

        <View style={s.tileRow}>
          <StatTile label="Monthly Income" value={wiMonthlyIncome} />
          <StatTile label="Monthly Bills" value={wiMonthlyBills} negative />
        </View>
        <View style={[s.tileRow, { marginTop: 8 }]}>
          <StatTile label="Monthly Remaining" value={remaining} negative={remaining < 0} />
          <StatTile label="Annual Remaining" value={remaining * 12} negative={remaining < 0} />
        </View>

        {whatIf && deltaRemaining !== 0 && (
          <Panel style={[s.whatIfBanner, { marginTop: 12 }]}>
            <Text style={{ color: deltaRemaining > 0 ? c.success : c.danger, fontSize: 13, fontWeight: "700" }}>
              {deltaRemaining > 0 ? `+$${deltaRemaining.toFixed(2)}/mo vs real` : `-$${Math.abs(deltaRemaining).toFixed(2)}/mo vs real`}
            </Text>
            <Text style={{ color: c.textMuted, fontSize: 11, marginTop: 2 }}>
              {deltaRemaining > 0
                ? `That's $${(deltaRemaining * 12).toFixed(2)} more left over a year.`
                : `That's $${Math.abs(deltaRemaining * 12).toFixed(2)} less over a year.`}
            </Text>
          </Panel>
        )}

        <Label style={{ marginTop: 22, marginBottom: 10 }}>Bills Breakdown</Label>
        {groupList.length === 0 && <Empty text="No bills yet" />}
        {groupList.map(([title, list]) => {
          const subtotal = list.reduce((sum, b) => {
            const en = b._extra ? b.enabled !== false : billEnabled(b);
            return en ? sum + (b._extra ? (parseFloat(b.amount) || 0) : billMonthly(b)) : sum;
          }, 0);
          return (
            <Panel key={title} style={{ marginBottom: 10 }}>
              <Label style={{ color: whatIf ? c.warning : c.accent, marginBottom: 10 }}>{title}</Label>
              {list.map(billRow)}
              <Divider style={{ marginTop: 6 }} />
              <View style={[s.billRow, { paddingTop: 10 }]}>
                <Text style={{ color: c.textMuted, fontSize: 12, fontWeight: "600", flex: 1 }}>Subtotal</Text>
                <Money value={subtotal} color={whatIf ? c.warning : c.text} size={13} weight="600" />
              </View>
            </Panel>
          );
        })}

        {/* Add a hypothetical bill */}
        {whatIf && (showAddBill ? (
          <Panel style={{ marginBottom: 10, borderColor: "rgba(251,191,36,0.25)" }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <Label style={{ color: c.warning }}>Add a bill</Label>
              <Pressable onPress={() => setShowAddBill(false)} hitSlop={8}><Ionicons name="close" size={16} color={c.textMuted} /></Pressable>
            </View>
            <TextInput value={billDraft.name} onChangeText={(v) => setBillDraft((x) => ({ ...x, name: v }))} placeholder="Bill name" placeholderTextColor={c.textDim} style={[s.nameEdit, { marginBottom: 8 }]} />
            <View style={{ flexDirection: "row", gap: 8, marginBottom: 8 }}>
              <View style={{ flex: 1 }}><MoneyInput value={billDraft.amount} onChangeText={(v) => setBillDraft((x) => ({ ...x, amount: v }))} placeholder="Monthly amount" /></View>
              <View style={{ flex: 1 }}>
                <Select value={billDraft.frequency} onChange={(v) => setBillDraft((x) => ({ ...x, frequency: v }))}
                  options={[{ label: "Monthly", value: "monthly" }, { label: "Every Pay Day", value: "payday" }]} />
              </View>
            </View>
            <Pressable onPress={addDraftBill} disabled={!billDraft.name.trim() || !billDraft.amount}
              style={[s.smBtn, s.smBtnPrimary, { alignItems: "center" }, (!billDraft.name.trim() || !billDraft.amount) && { opacity: 0.5 }]}>
              <Text style={s.smBtnPrimaryText}>Add bill</Text>
            </Pressable>
          </Panel>
        ) : (
          <Pressable onPress={() => setShowAddBill(true)} style={[s.addExtraBtn, { marginBottom: 10 }]}>
            <Text style={s.addExtraText}>+ Add hypothetical bill</Text>
          </Pressable>
        ))}

        {/* Income */}
        <Label style={{ marginTop: 12, marginBottom: 10 }}>Income</Label>
        <Panel>
          {incomeRows.length === 0 && <Empty text="No income yet" />}
          {incomeRows.map(incomeRow)}
          <Divider style={{ marginTop: 6 }} />
          <View style={[s.billRow, { paddingTop: 10 }]}>
            <Text style={{ color: c.textMuted, fontSize: 12, fontWeight: "600", flex: 1 }}>Total</Text>
            <Money value={wiMonthlyIncome} color={c.success} size={13} weight="600" />
          </View>

          {whatIf && (showAddIncome ? (
            <View style={{ marginTop: 12, borderTopWidth: 1, borderTopColor: c.border, paddingTop: 12 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <Label style={{ color: c.warning }}>Add income</Label>
                <Pressable onPress={() => setShowAddIncome(false)} hitSlop={8}><Ionicons name="close" size={16} color={c.textMuted} /></Pressable>
              </View>
              <TextInput value={incomeDraft.name} onChangeText={(v) => setIncomeDraft((x) => ({ ...x, name: v }))} placeholder="Income name" placeholderTextColor={c.textDim} style={[s.nameEdit, { marginBottom: 8 }]} />
              <View style={{ marginBottom: 8 }}><MoneyInput value={incomeDraft.amount} onChangeText={(v) => setIncomeDraft((x) => ({ ...x, amount: v }))} placeholder="Monthly amount" /></View>
              <Pressable onPress={addDraftIncome} disabled={!incomeDraft.name.trim() || !incomeDraft.amount}
                style={[s.smBtn, s.smBtnPrimary, { alignItems: "center" }, (!incomeDraft.name.trim() || !incomeDraft.amount) && { opacity: 0.5 }]}>
                <Text style={s.smBtnPrimaryText}>Add income</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable onPress={() => setShowAddIncome(true)} style={[s.addExtraBtn, { marginTop: 12 }]}>
              <Text style={s.addExtraText}>+ Add income</Text>
            </Pressable>
          ))}
        </Panel>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: c.bg },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
  pageTitle: { color: c.text, fontSize: 22, fontWeight: "700" },
  tileRow: { flexDirection: "row", gap: 8 },
  whatIfBtn: {
    borderWidth: 1, borderColor: "rgba(251,191,36,0.4)", backgroundColor: "rgba(251,191,36,0.1)",
    borderRadius: 7, paddingHorizontal: 14, paddingVertical: 7,
  },
  whatIfText: { color: c.warning, fontSize: 12, fontWeight: "600" },
  whatIfBanner: { backgroundColor: "rgba(251,191,36,0.07)", borderColor: "rgba(251,191,36,0.25)", marginBottom: 12 },
  billRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 7 },
  billName: { color: c.text, fontSize: 13, fontWeight: "500" },
  faintSm: { color: c.textFaint, fontSize: 10, marginTop: 1 },
  nameEdit: {
    borderWidth: 1, borderColor: "rgba(108,99,255,0.4)", backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 8, color: c.text, fontSize: 14, paddingHorizontal: 10, paddingVertical: 8,
  },
  addExtraBtn: {
    borderWidth: 1, borderColor: "rgba(251,191,36,0.35)", borderStyle: "dashed",
    borderRadius: 8, paddingVertical: 10, alignItems: "center",
  },
  addExtraText: { color: c.warning, fontSize: 12, fontWeight: "600" },
  check: { width: 16, height: 16, borderRadius: 4, borderWidth: 1, borderColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" },
  smBtn: { borderRadius: 8, paddingHorizontal: 14, paddingVertical: 9, justifyContent: "center" },
  smBtnPrimary: { backgroundColor: c.warning },
  smBtnPrimaryText: { color: "#13111F", fontSize: 12, fontWeight: "700", textAlign: "center" },
  smBtnGhost: { borderWidth: 1, borderColor: c.border, backgroundColor: "transparent", alignItems: "center" },
  smBtnGhostText: { color: c.textMuted, fontSize: 12, fontWeight: "600" },
  smBtnDanger: { borderWidth: 1, borderColor: "rgba(248,113,113,0.4)", backgroundColor: "rgba(248,113,113,0.08)" },
});
