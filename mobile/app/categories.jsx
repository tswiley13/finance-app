import { useState } from "react";
import {
  View, Text, ScrollView, Pressable, Alert, RefreshControl,
  KeyboardAvoidingView, Platform, StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../src/supabase";
import { useStrydeData } from "../src/useStrydeData";
import { Panel, Empty, Divider, dataGate } from "../src/ui";
import { Input, FormError } from "../src/form";
import { c } from "../src/theme";
import { ScreenHeader } from "../src/ScreenHeader";

export default function Categories() {
  const d = useStrydeData();
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const gate = dataGate(d);
  if (gate) return gate;

  async function add() {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (d.categories.some((c2) => c2.name.toLowerCase() === trimmed.toLowerCase())) {
      return setError("That category already exists.");
    }
    setError("");
    setSaving(true);
    const { error: dbError } = await supabase
      .from("categories")
      .insert({ household_id: d.household.id, name: trimmed });
    setSaving(false);
    if (dbError) return setError(dbError.message);
    setName("");
    d.reload();
  }

  function confirmDelete(cat) {
    const used = d.bills.filter((b) => b.category === cat.name).length;
    Alert.alert(
      "Delete category?",
      used > 0
        ? `"${cat.name}" is used by ${used} bill${used === 1 ? "" : "s"}. They'll keep the label but it won't be selectable.`
        : `"${cat.name}" will be removed.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const { error: e } = await supabase.from("categories").delete().eq("id", cat.id);
            if (e) Alert.alert("Couldn't delete", e.message);
            d.reload();
          },
        },
      ]
    );
  }

  return (
    <SafeAreaView style={s.screen} edges={["top"]}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScreenHeader title="Categories" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          keyboardShouldPersistTaps="handled"
          refreshControl={<RefreshControl refreshing={false} onRefresh={d.reload} tintColor={c.accent} />}
        >
          <FormError>{error}</FormError>

          <View style={s.addRow}>
            <View style={{ flex: 1 }}>
              <Input value={name} onChangeText={setName} placeholder="New category" />
            </View>
            <Pressable onPress={add} disabled={saving || !name.trim()} style={[s.addBtn, (!name.trim() || saving) && { opacity: 0.5 }]}>
              <Ionicons name="add" size={20} color="#13111F" />
            </Pressable>
          </View>

          {d.categories.length === 0 && <Empty text="No categories yet" />}

          {d.categories.length > 0 && (
            <Panel style={{ marginTop: 14, paddingVertical: 4 }}>
              {d.categories.map((cat, i) => {
                const used = d.bills.filter((b) => b.category === cat.name).length;
                return (
                  <View key={cat.id}>
                    <View style={s.row}>
                      <View style={{ flex: 1 }}>
                        <Text style={s.name}>{cat.name}</Text>
                        <Text style={s.sub}>{used} bill{used === 1 ? "" : "s"}</Text>
                      </View>
                      <Pressable onPress={() => confirmDelete(cat)} hitSlop={8}>
                        <Ionicons name="trash-outline" size={17} color={c.danger} />
                      </Pressable>
                    </View>
                    {i < d.categories.length - 1 && <Divider />}
                  </View>
                );
              })}
            </Panel>
          )}

          <Text style={s.note}>Categories help you group bills. They're optional.</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: c.bg },
  addRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  addBtn: {
    backgroundColor: c.accent, borderRadius: 8, width: 44, height: 44,
    alignItems: "center", justifyContent: "center",
  },
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 12 },
  name: { color: c.text, fontSize: 14, fontWeight: "500" },
  sub: { color: c.textFaint, fontSize: 11, marginTop: 2 },
  note: { color: c.textDim, fontSize: 11, textAlign: "center", marginTop: 18 },
});
