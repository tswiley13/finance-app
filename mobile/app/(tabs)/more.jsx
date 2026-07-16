import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useStrydeData } from "../../src/useStrydeData";
import { Panel, Label, Divider } from "../../src/ui";
import { c } from "../../src/theme";

export default function More() {
  const router = useRouter();
  const d = useStrydeData();

  const groups = [
    {
      label: "Manage",
      items: [
        { icon: "card-outline", title: "Accounts", sub: `${d.accounts.length} account${d.accounts.length === 1 ? "" : "s"}`, to: "/accounts" },
        { icon: "pricetag-outline", title: "Categories", sub: `${d.categories.length} categor${d.categories.length === 1 ? "y" : "ies"}`, to: "/categories" },
      ],
    },
    {
      label: "Planning",
      items: [
        { icon: "calendar-outline", title: "Pay Periods", sub: `${d.payPeriods.length} generated`, to: "/payperiods" },
        { icon: "trending-down-outline", title: "Debts", sub: `${d.debts.length} tracked`, to: "/debts" },
      ],
    },
    {
      label: "Household",
      items: [
        { icon: "people-outline", title: "Members", sub: `${d.members.length} member${d.members.length === 1 ? "" : "s"}`, to: "/settings" },
        { icon: "settings-outline", title: "Settings", sub: d.userEmail, to: "/settings" },
      ],
    },
  ];

  return (
    <SafeAreaView style={s.screen} edges={["top"]}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        <Text style={s.pageTitle}>More</Text>

        {groups.map((g) => (
          <View key={g.label} style={{ marginTop: 20 }}>
            <Label style={{ marginBottom: 8 }}>{g.label}</Label>
            <Panel style={{ paddingVertical: 4 }}>
              {g.items.map((it, i) => (
                <View key={it.title}>
                  <Pressable onPress={() => router.push(it.to)} style={s.row}>
                    <Ionicons name={it.icon} size={18} color={c.accent} style={{ width: 26 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={s.title}>{it.title}</Text>
                      {!!it.sub && <Text style={s.sub} numberOfLines={1}>{it.sub}</Text>}
                    </View>
                    <Ionicons name="chevron-forward" size={15} color={c.textDim} />
                  </Pressable>
                  {i < g.items.length - 1 && <Divider style={{ marginLeft: 26 }} />}
                </View>
              ))}
            </Panel>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: c.bg },
  pageTitle: { color: c.text, fontSize: 22, fontWeight: "700" },
  row: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 13 },
  title: { color: c.text, fontSize: 15, fontWeight: "500" },
  sub: { color: c.textFaint, fontSize: 11, marginTop: 2 },
});
