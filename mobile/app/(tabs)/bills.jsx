import { View, Text, ScrollView, RefreshControl, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ordinalSuffix } from "@stryde/shared";
import { useStrydeData } from "../../src/useStrydeData";
import { Panel, Label, Money, Loading, Empty, Pill } from "../../src/ui";
import { c } from "../../src/theme";

const freqLabel = (b) => {
  const f = b.frequency || "monthly";
  if (f === "payday") return "Every Pay Day";
  if (f === "biweekly") return "Biweekly";
  if (f === "quarterly") return "Quarterly";
  if (f === "annually") return "Annually";
  if (f === "semi-monthly") {
    return `Due the ${b.due_day}${ordinalSuffix(b.due_day)} & ${b.due_day_2}${ordinalSuffix(b.due_day_2)}`;
  }
  return b.due_day ? `Due the ${b.due_day}${ordinalSuffix(b.due_day)}` : "Monthly";
};

export default function Bills() {
  const d = useStrydeData();
  if (d.loading) return <Loading />;

  const active = d.bills.filter((b) => b.is_active !== false);
  const total = active.reduce((sum, b) => sum + (b.amount || 0), 0);
  const acctName = (id) => d.accounts.find((a) => a.id === id)?.name;

  return (
    <SafeAreaView style={s.screen} edges={["top"]}>
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={false} onRefresh={d.reload} tintColor={c.accent} />}
      >
        <Text style={s.pageTitle}>Bills</Text>
        <View style={s.summary}>
          <Text style={s.faint}>{active.length} active</Text>
          <Money value={total} color={c.danger} size={14} weight="600" />
        </View>

        {active.length === 0 && <Empty text="No bills yet — add them on the web app" />}

        {active.map((b) => (
          <Panel key={b.id} style={{ marginBottom: 8 }}>
            <View style={s.row}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                  <Text style={s.name}>{b.name}</Text>
                  {b.transfer_to_account_id && <Pill text="TRANSFER" color={c.success} bg="rgba(0,212,170,0.1)" />}
                </View>
                <Text style={s.faintSm}>{freqLabel(b)}</Text>
                {!!acctName(b.account_id) && (
                  <Text style={s.faintSm}>Paid from {acctName(b.account_id)}</Text>
                )}
              </View>
              <Money value={b.amount} color={c.text} size={15} weight="600" />
            </View>
          </Panel>
        ))}

        <Text style={s.note}>
          Adding and editing bills is on the web app at stryde.money for now.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: c.bg },
  pageTitle: { color: c.text, fontSize: 22, fontWeight: "700" },
  summary: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 6, marginBottom: 14 },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  name: { color: c.text, fontSize: 14, fontWeight: "600" },
  faint: { color: c.textMuted, fontSize: 12 },
  faintSm: { color: c.textFaint, fontSize: 11, marginTop: 2 },
  note: { color: c.textDim, fontSize: 11, textAlign: "center", marginTop: 20, lineHeight: 16 },
});
