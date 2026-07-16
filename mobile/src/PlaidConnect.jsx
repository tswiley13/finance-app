// Bank connection via Plaid, using the same edge functions as the web app:
//   plaid-create-link-token -> plaid-exchange-token -> plaid-sync-balances
//
// Requires a dev/production build — Plaid's SDK is native, so this screen
// cannot run in Expo Go. `isPlaidAvailable` lets the UI say so plainly instead
// of crashing on a missing native module.
import { useState } from "react";
import { View, Text, Pressable, Alert, ActivityIndicator, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "./supabase";
import { c } from "./theme";

let plaid = null;
try {
  // Throws in Expo Go, where the native module isn't linked.
  plaid = require("react-native-plaid-link-sdk");
} catch {
  plaid = null;
}

export const isPlaidAvailable = !!plaid?.create;

export function PlaidConnect({ userId, onDone, updateMode = false, label }) {
  const [busy, setBusy] = useState(false);

  async function connect() {
    if (!isPlaidAvailable) {
      Alert.alert(
        "Needs a full build",
        "Plaid uses native code, so connecting a bank doesn't work in Expo Go. Run a dev build (npm run ios:build) or use the web app."
      );
      return;
    }

    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("plaid-create-link-token", {
        body: { user_id: userId, update_mode: updateMode },
      });
      if (error) throw error;
      const token = data?.link_token;
      if (!token) throw new Error(data?.error_message || data?.error || "No link token returned");

      plaid.create({ token });

      plaid.open({
        onSuccess: async (success) => {
          try {
            // Update mode reactivates the existing token — nothing to exchange.
            if (!updateMode) {
              const { error: exErr } = await supabase.functions.invoke("plaid-exchange-token", {
                body: {
                  public_token: success.publicToken,
                  institution_name: success.metadata?.institution?.name,
                  accounts: success.metadata?.accounts,
                },
              });
              if (exErr) throw exErr;
            }
            await supabase.functions.invoke("plaid-sync-balances", { body: { user_id: userId } });
            onDone?.();
          } catch (e) {
            Alert.alert("Couldn't finish connecting", e.message || String(e));
          } finally {
            setBusy(false);
          }
        },
        onExit: (exit) => {
          setBusy(false);
          const msg = exit?.error?.displayMessage || exit?.error?.errorMessage;
          if (msg) Alert.alert("Bank connection stopped", msg);
        },
      });
    } catch (e) {
      setBusy(false);
      Alert.alert("Couldn't start Plaid", e.message || String(e));
    }
  }

  return (
    <Pressable onPress={connect} disabled={busy} style={[s.btn, busy && { opacity: 0.6 }]}>
      {busy ? (
        <ActivityIndicator color={c.accent} size="small" />
      ) : (
        <>
          <Ionicons name="link-outline" size={16} color={c.accent} />
          <Text style={s.btnText}>{label || (updateMode ? "Reconnect Bank" : "Connect a Bank")}</Text>
        </>
      )}
    </Pressable>
  );
}

/** Pull fresh balances for already-connected banks. */
export function PlaidSyncButton({ userId, onDone }) {
  const [busy, setBusy] = useState(false);

  async function sync() {
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("plaid-sync-balances", {
        body: { user_id: userId },
      });
      if (error) throw error;
      if (data?.loginRequired) {
        Alert.alert("Bank needs reconnecting", "Your bank is asking you to sign in again. Tap Reconnect Bank.");
      }
      onDone?.();
    } catch (e) {
      Alert.alert("Couldn't sync", e.message || String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Pressable onPress={sync} disabled={busy} hitSlop={8} style={s.syncBtn}>
      {busy ? (
        <ActivityIndicator color={c.accent} size="small" />
      ) : (
        <Text style={s.syncText}>Sync</Text>
      )}
    </Pressable>
  );
}

const s = StyleSheet.create({
  btn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    borderWidth: 1, borderColor: "rgba(108,99,255,0.35)",
    backgroundColor: "rgba(108,99,255,0.1)", borderRadius: 8, paddingVertical: 12,
  },
  btnText: { color: c.accent, fontSize: 14, fontWeight: "600" },
  syncBtn: { paddingHorizontal: 4 },
  syncText: { color: c.accent, fontSize: 12, fontWeight: "600" },
});
