import { View, Text, ScrollView, RefreshControl, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useStrydeData } from "../../src/useStrydeData";
import { Panel, Label, Money, Loading, Empty, Pill } from "../../src/ui";
import { c } from "../../src/theme";

export default function Accounts() {
  const d = useStrydeData();
  if (d.loading) return <Loading />;

  const total = d.accounts.reduce((sum, a) => sum + (a.current_balance || 0), 0);

  return (
    <SafeAreaView style={s.screen} edges={["top"]}>
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={false} onRefresh={d.reload} tintColor={c.accent} />}
      >
        <Text style={s.pageTitle}>Accounts</Text>
        <View style={s.summary}>
          <Text style={s.faint}>{d.accounts.length} total</Text>
          <Money value={total} color={c.success} size={14} weight="600" />
        </View>

        {d.accounts.length === 0 && <Empty text="No accounts yet — add them on the web app" />}

        {d.accounts.map((a) => (
          <Panel key={a.id} style={{ marginBottom: 8 }}>
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
            </View>

            {a.is_accumulating && a.accumulation_target > 0 && (
              <View style={s.barTrack}>
                <View
                  style={[
                    s.barFill,
                    { width: `${Math.min(100, ((a.current_balance || 0) / a.accumulation_target) * 100)}%` },
                  ]}
                />
              </View>
            )}
          </Panel>
        ))}

        <Text style={s.note}>
          Balances sync from your bank via Plaid on the web app.
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
  barTrack: { height: 4, backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 2, marginTop: 10, overflow: "hidden" },
  barFill: { height: 4, backgroundColor: c.success, borderRadius: 2 },
  note: { color: c.textDim, fontSize: 11, textAlign: "center", marginTop: 20, lineHeight: 16 },
});
