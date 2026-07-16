import { useState } from "react";
import { View, Text, ScrollView, Pressable, Alert, Linking, Share, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { supabase } from "../src/supabase";
import { useStrydeData } from "../src/useStrydeData";
import { Panel, Label, Loading, Divider, Pill } from "../src/ui";
import { ScreenHeader } from "../src/ScreenHeader";
import { c } from "../src/theme";

const WEB_URL = "https://stryde.money";

export default function Settings() {
  const d = useStrydeData();
  const [deleting, setDeleting] = useState(false);

  if (d.loading) return <Loading />;

  async function signOut() {
    await supabase.auth.signOut();
  }

  // Apple Guideline 5.1.1(v): an account created in-app must be deletable in-app.
  // Two-step confirm because this is irreversible.
  function confirmDelete() {
    Alert.alert(
      "Delete account?",
      "This permanently deletes your Stryde account and all your financial data — bills, income, accounts, and pay periods. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () =>
            Alert.alert(
              "Are you absolutely sure?",
              "Your data will be erased immediately and cannot be recovered.",
              [
                { text: "Cancel", style: "cancel" },
                { text: "Delete forever", style: "destructive", onPress: deleteAccount },
              ]
            ),
        },
      ]
    );
  }

  async function deleteAccount() {
    setDeleting(true);
    try {
      // Runs server-side: removes household data then the auth user itself,
      // which a client can't do with the anon key.
      const { error } = await supabase.functions.invoke("delete-account");
      if (error) throw error;
      await supabase.auth.signOut();
    } catch (e) {
      Alert.alert(
        "Couldn't delete account",
        `${e.message || e}\n\nIf this keeps happening, contact support@stryde.money.`
      );
    } finally {
      setDeleting(false);
    }
  }

  const inviteLink = d.household?.invite_code
    ? `${WEB_URL}/join?code=${d.household.invite_code}`
    : null;

  async function copy(text, what) {
    await Clipboard.setStringAsync(text);
    Alert.alert("Copied", `${what} copied to your clipboard.`);
  }

  return (
    <SafeAreaView style={s.screen} edges={["top"]}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScreenHeader title="Settings" />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        <Panel>
          <Label>Account</Label>
          <Text style={s.value}>{d.userEmail}</Text>
          {!!d.household?.name && (
            <>
              <Divider style={{ marginVertical: 12 }} />
              <Label>Household</Label>
              <Text style={s.value}>{d.household.name}</Text>
            </>
          )}
        </Panel>

        {/* Members + invite */}
        <Panel style={{ marginTop: 10 }}>
          <Label style={{ marginBottom: 10 }}>
            Members ({d.members.length})
          </Label>
          {d.members.map((m, i) => (
            <View key={m.id || i}>
              <View style={s.memberRow}>
                <View style={s.avatar}>
                  <Text style={s.avatarText}>
                    {(m.name || m.email || "?").charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: c.text, fontSize: 14 }}>
                    {m.name || m.email || "Member"}
                  </Text>
                  {!!m.email && m.name && <Text style={s.faint}>{m.email}</Text>}
                </View>
                {m.role === "owner" && <Pill text="OWNER" />}
              </View>
              {i < d.members.length - 1 && <Divider />}
            </View>
          ))}

          {inviteLink && (
            <>
              <Divider style={{ marginVertical: 12 }} />
              <Label>Invite Code</Label>
              <Pressable
                onPress={() => copy(d.household.invite_code, "Invite code")}
                style={s.codeBox}
              >
                <Text style={s.code}>{d.household.invite_code}</Text>
                <Ionicons name="copy-outline" size={16} color={c.accent} />
              </Pressable>

              <View style={{ flexDirection: "row", gap: 8, marginTop: 10 }}>
                <Pressable
                  onPress={() => copy(inviteLink, "Invite link")}
                  style={[s.inviteBtn, { flex: 1 }]}
                >
                  <Text style={s.inviteBtnText}>Copy Link</Text>
                </Pressable>
                <Pressable
                  onPress={() =>
                    Share.share({
                      message: `Join our household on Stryde: ${inviteLink}`,
                    })
                  }
                  style={[s.inviteBtn, { flex: 1, backgroundColor: c.accent, borderColor: c.accent }]}
                >
                  <Text style={[s.inviteBtnText, { color: "#13111F" }]}>Share</Text>
                </Pressable>
              </View>
              <Text style={s.hint}>
                Anyone with this link can join your household and see your finances.
              </Text>
            </>
          )}
        </Panel>

        <Panel style={{ marginTop: 10 }}>
          <Row label="Privacy Policy" onPress={() => Linking.openURL(`${WEB_URL}/privacy`)} />
          <Divider style={{ marginVertical: 4 }} />
          <Row label="Terms of Service" onPress={() => Linking.openURL(`${WEB_URL}/terms`)} />
          <Divider style={{ marginVertical: 4 }} />
          <Row label="Manage on the web" onPress={() => Linking.openURL(WEB_URL)} />
        </Panel>

        <Pressable onPress={signOut} style={s.signOut}>
          <Text style={s.signOutText}>Sign Out</Text>
        </Pressable>

        <Panel style={s.danger}>
          <Label style={{ color: c.danger }}>Danger Zone</Label>
          <Text style={[s.faint, { marginTop: 6, lineHeight: 17 }]}>
            Deleting your account permanently erases all your financial data. This cannot be undone.
          </Text>
          <Pressable onPress={confirmDelete} disabled={deleting} style={[s.deleteBtn, deleting && { opacity: 0.6 }]}>
            <Text style={s.deleteText}>{deleting ? "Deleting…" : "Delete Account"}</Text>
          </Pressable>
        </Panel>

        <Text style={s.copyright}>© 2026 Stryde Financial LLC</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ label, onPress }) {
  return (
    <Pressable onPress={onPress} style={s.row}>
      <Text style={{ color: c.text, fontSize: 14 }}>{label}</Text>
      <Text style={{ color: c.textFaint, fontSize: 16 }}>›</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: c.bg },
  pageTitle: { color: c.text, fontSize: 22, fontWeight: "700" },
  value: { color: c.text, fontSize: 14, marginTop: 5 },
  faint: { color: c.textMuted, fontSize: 12, marginTop: 2 },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 10 },
  signOut: {
    marginTop: 10, borderWidth: 1, borderColor: c.border, borderRadius: 12,
    paddingVertical: 14, alignItems: "center",
  },
  signOutText: { color: c.textMuted, fontSize: 14, fontWeight: "600" },
  danger: { marginTop: 24, borderColor: "rgba(248,113,113,0.25)" },
  deleteBtn: {
    marginTop: 14, borderWidth: 1, borderColor: "rgba(248,113,113,0.4)",
    backgroundColor: "rgba(248,113,113,0.08)", borderRadius: 8,
    paddingVertical: 12, alignItems: "center",
  },
  deleteText: { color: c.danger, fontSize: 14, fontWeight: "600" },
  copyright: { color: c.textDim, fontSize: 11, textAlign: "center", marginTop: 24 },
  memberRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 9 },
  avatar: {
    width: 30, height: 30, borderRadius: 15, backgroundColor: c.accent,
    alignItems: "center", justifyContent: "center",
  },
  avatarText: { color: "#13111F", fontSize: 12, fontWeight: "700" },
  codeBox: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: "rgba(108,99,255,0.08)", borderWidth: 1,
    borderColor: "rgba(108,99,255,0.25)", borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 10, marginTop: 6,
  },
  code: { color: c.accent, fontSize: 15, fontWeight: "700", letterSpacing: 1.5 },
  inviteBtn: {
    borderWidth: 1, borderColor: c.border, borderRadius: 8,
    paddingVertical: 10, alignItems: "center",
  },
  inviteBtnText: { color: c.textMuted, fontSize: 13, fontWeight: "600" },
  hint: { color: c.textDim, fontSize: 11, marginTop: 8, lineHeight: 15 },
});
