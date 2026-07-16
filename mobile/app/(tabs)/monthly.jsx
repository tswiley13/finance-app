import { useState } from "react";
import { View, Text, ScrollView, Pressable, RefreshControl, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { groupBillsForOverview, ordinalSuffix, billMultiplier, incMultiplier } from "@stryde/shared";
import { useStrydeData } from "../../src/useStrydeData";
import { Panel, Label, Money, StatTile, Loading, Empty, Divider } from "../../src/ui";
import { c, mono } from "../../src/theme";

export default function Monthly() {
  const d = useStrydeData();
  const [whatIf, setWhatIf] = useState(false);
  const [disabled, setDisabled] = useState({}); // billId -> true when toggled off

  if (d.loading) return <Loading />;

  const groups = groupBillsForOverview(d.bills);
  const enabled = (b) => !whatIf || !disabled[b.id];

  const monthlyIncome = d.income.reduce(
    (sum, i) => sum + (i.fixed_amount || 0) * incMultiplier(i.frequency), 0
  );
  const billMonthly = (b) => (b.amount || 0) * billMultiplier(b.frequency);
  const activeBills = d.bills.filter((b) => b.is_active !== false);
  const realBills = activeBills.reduce((sum, b) => sum + billMonthly(b), 0);
  const wiBills = activeBills.reduce((sum, b) => (enabled(b) ? sum + billMonthly(b) : sum), 0);
  const remaining = monthlyIncome - wiBills;
  const delta = realBills - wiBills;

  const groupList = [
    ["Every Paycheck", groups.everyPaycheck],
    ["Due 1st – 15th", groups.firstHalf],
    ["Due 16th – 31st", groups.secondHalf],
    ["No Due Date", groups.noDueDay],
  ].filter(([, list]) => list.length > 0);

  return (
    <SafeAreaView style={s.screen} edges={["top"]}>
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={false} onRefresh={d.reload} tintColor={c.accent} />}
      >
        <View style={s.headerRow}>
          <Text style={s.pageTitle}>Monthly Overview</Text>
          <Pressable
            onPress={() => { setWhatIf(!whatIf); setDisabled({}); }}
            style={[s.whatIfBtn, whatIf && { backgroundColor: c.warning }]}
          >
            <Text style={[s.whatIfText, whatIf && { color: "#13111F" }]}>
              {whatIf ? "✕  Exit" : "⚡ What-If"}
            </Text>
          </Pressable>
        </View>

        {whatIf && (
          <Panel style={s.whatIfBanner}>
            <Text style={{ color: c.warning, fontSize: 13, fontWeight: "600" }}>
              What-If Mode — nothing is saved
            </Text>
            <Text style={{ color: c.textMuted, fontSize: 11, marginTop: 2 }}>
              Toggle bills off to see the impact. Your real data is untouched.
            </Text>
          </Panel>
        )}

        <View style={s.tileRow}>
          <StatTile label="Monthly Income" value={monthlyIncome} />
          <StatTile label="Monthly Bills" value={wiBills} negative />
        </View>
        <View style={[s.tileRow, { marginTop: 8 }]}>
          <StatTile label="Monthly Remaining" value={remaining} negative={remaining < 0} />
          <StatTile label="Annual Remaining" value={remaining * 12} negative={remaining < 0} />
        </View>

        {whatIf && delta !== 0 && (
          <Panel style={[s.whatIfBanner, { marginTop: 12 }]}>
            <Text style={{ color: c.warning, fontSize: 13, fontWeight: "700" }}>
              Saves ${delta.toFixed(2)}/mo
            </Text>
            <Text style={{ color: c.textMuted, fontSize: 11, marginTop: 2 }}>
              That's ${(delta * 12).toFixed(2)} back over a year. Nothing is saved until you make it real.
            </Text>
          </Panel>
        )}

        <Label style={{ marginTop: 22, marginBottom: 10 }}>Bills Breakdown</Label>
        {groupList.length === 0 && <Empty text="No bills yet" />}
        {groupList.map(([title, list]) => {
          const subtotal = list.reduce((sum, b) => (enabled(b) ? sum + billMonthly(b) : sum), 0);
          return (
            <Panel key={title} style={{ marginBottom: 10 }}>
              <Label style={{ color: whatIf ? c.warning : c.accent, marginBottom: 10 }}>{title}</Label>
              {list.map((b) => {
                const off = whatIf && disabled[b.id];
                const freq = b.frequency || "monthly";
                return (
                  <Pressable
                    key={b.id}
                    disabled={!whatIf}
                    onPress={() => setDisabled((x) => ({ ...x, [b.id]: !x[b.id] }))}
                    style={[s.billRow, { opacity: off ? 0.4 : 1 }]}
                  >
                    {whatIf && (
                      <View style={[s.check, !off && { backgroundColor: "rgba(108,99,255,0.2)", borderColor: c.accent }]}>
                        {!off && <Text style={{ color: c.accent, fontSize: 9 }}>✓</Text>}
                      </View>
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={[s.billName, off && { textDecorationLine: "line-through", color: c.textMuted }]}>
                        {b.name}
                      </Text>
                      <Text style={s.faintSm}>
                        {freq === "payday"
                          ? "Every Pay Day"
                          : b.due_day
                            ? `Due the ${b.due_day}${ordinalSuffix(b.due_day)}`
                            : ""}
                      </Text>
                    </View>
                    <View style={{ alignItems: "flex-end" }}>
                      <Money value={billMonthly(b)} color={off ? c.textDim : c.danger} size={13} />
                      {billMultiplier(freq) > 1 && (
                        <Text style={s.faintSm}>${(b.amount || 0).toFixed(2)} × 2</Text>
                      )}
                    </View>
                  </Pressable>
                );
              })}
              <Divider style={{ marginTop: 6 }} />
              <View style={[s.billRow, { paddingTop: 10 }]}>
                <Text style={{ color: c.textMuted, fontSize: 12, fontWeight: "600", flex: 1 }}>Subtotal</Text>
                <Money value={subtotal} color={whatIf ? c.warning : c.text} size={13} weight="600" />
              </View>
            </Panel>
          );
        })}

        {/* Income */}
        <Label style={{ marginTop: 12, marginBottom: 10 }}>Income</Label>
        <Panel>
          {d.income.length === 0 && <Empty text="No income yet" />}
          {d.income.map((i) => (
            <View key={i.id} style={s.billRow}>
              <View style={{ flex: 1 }}>
                <Text style={s.billName}>{i.name}</Text>
                <Text style={s.faintSm}>
                  {(i.frequency || "monthly")} · ${(i.fixed_amount || 0).toFixed(2)}/check
                </Text>
              </View>
              <Money value={(i.fixed_amount || 0) * incMultiplier(i.frequency)} color={c.success} size={13} />
            </View>
          ))}
          <Divider style={{ marginTop: 6 }} />
          <View style={[s.billRow, { paddingTop: 10 }]}>
            <Text style={{ color: c.textMuted, fontSize: 12, fontWeight: "600", flex: 1 }}>Total</Text>
            <Money value={monthlyIncome} color={c.success} size={13} weight="600" />
          </View>
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
  whatIfBanner: {
    backgroundColor: "rgba(251,191,36,0.07)", borderColor: "rgba(251,191,36,0.25)", marginBottom: 12,
  },
  billRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 7 },
  billName: { color: c.text, fontSize: 13, fontWeight: "500" },
  faintSm: { color: c.textFaint, fontSize: 10, marginTop: 1 },
  check: {
    width: 16, height: 16, borderRadius: 4, borderWidth: 1, borderColor: "rgba(255,255,255,0.15)",
    alignItems: "center", justifyContent: "center",
  },
});
