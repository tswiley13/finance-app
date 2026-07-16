import { View, Text, ScrollView, RefreshControl, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import { fmtDate, localDateStr } from "@stryde/shared";
import { useStrydeData } from "../src/useStrydeData";
import { Panel, Label, Money, Loading, Empty, Pill } from "../src/ui";
import { ScreenHeader } from "../src/ScreenHeader";
import { c } from "../src/theme";

export default function PayPeriods() {
  const d = useStrydeData();
  if (d.loading) return <Loading />;

  const today = localDateStr();
  const sorted = [...d.payPeriods].sort(
    (a, b) => new Date(a.start_date) - new Date(b.start_date)
  );

  const status = (p) => {
    if (p.end_date < today) return { text: "Past", color: c.textDim, bg: "rgba(255,255,255,0.04)" };
    if (p.start_date <= today && p.end_date >= today) {
      return { text: "Active", color: "#fff", bg: c.accent };
    }
    return { text: "Upcoming", color: c.textMuted, bg: "rgba(255,255,255,0.04)" };
  };

  // Enriched rows only exist for current + future periods.
  const rowFor = (p) => d.rows.find((r) => r.period.id === p.id);

  return (
    <SafeAreaView style={s.screen} edges={["top"]}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScreenHeader title="Pay Periods" />

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={false} onRefresh={d.reload} tintColor={c.accent} />}
      >
        {sorted.length === 0 && (
          <Empty text="No pay periods yet — they're generated from your income" />
        )}

        {sorted.map((p) => {
          const st = status(p);
          const row = rowFor(p);
          const days =
            Math.round(
              (new Date(p.end_date) - new Date(p.start_date)) / 86400000
            ) + 1;
          return (
            <Panel
              key={p.id}
              style={[
                { marginBottom: 8 },
                st.text === "Active" && { borderLeftWidth: 3, borderLeftColor: c.accent },
                st.text === "Past" && { opacity: 0.55 },
              ]}
            >
              <View style={s.row}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <Text style={s.name}>
                      {fmtDate(p.start_date)} — {fmtDate(p.end_date)}
                    </Text>
                    <Pill text={st.text.toUpperCase()} color={st.color} bg={st.bg} />
                  </View>
                  <Text style={s.faintSm}>{days} days</Text>
                </View>
                {row && (
                  <View style={{ alignItems: "flex-end" }}>
                    <Label style={{ fontSize: 9, marginBottom: 2 }}>End Balance</Label>
                    <Money
                      value={row.endBalance}
                      color={row.endBalance < 0 ? c.danger : c.positive}
                      size={15}
                    />
                  </View>
                )}
              </View>

              {row && (
                <View style={s.stats}>
                  <Stat label="Income" value={row.pendingIncome} color={c.positive} />
                  <Stat label="Bills" value={row.billsDeducted} color={c.danger} />
                  <Stat label="Start" value={row.startBalance} color={c.textMuted} />
                </View>
              )}
            </Panel>
          );
        })}

        <Text style={s.note}>
          Pay periods are generated automatically from each income source's frequency and
          next pay date. Edit those on the Income tab to change them.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ label, value, color }) {
  return (
    <View style={s.stat}>
      <Label style={{ fontSize: 9, marginBottom: 3 }}>{label}</Label>
      <Money value={value} color={color} size={12} />
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: c.bg },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  name: { color: c.text, fontSize: 14, fontWeight: "600" },
  faintSm: { color: c.textFaint, fontSize: 11, marginTop: 2 },
  stats: { flexDirection: "row", gap: 6, marginTop: 12 },
  stat: { flex: 1, backgroundColor: "rgba(255,255,255,0.03)", borderRadius: 8, padding: 8 },
  note: { color: c.textDim, fontSize: 11, textAlign: "center", marginTop: 18, lineHeight: 16 },
});
