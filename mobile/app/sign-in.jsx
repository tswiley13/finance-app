import { useState } from "react";
import {
  View, Text, TextInput, Pressable, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from "react-native";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { supabase } from "../src/supabase";
import { c } from "../src/theme";

WebBrowser.maybeCompleteAuthSession();

export default function SignIn() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauth, setOauth] = useState(null);
  const [error, setError] = useState(null);
  const [sentEmail, setSentEmail] = useState(false);

  async function submit() {
    setError(null);
    setLoading(true);
    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setError(error.message);
      else setSentEmail(true);
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
    }
    setLoading(false);
  }

  // Native OAuth: open the provider in a browser session, then hand the
  // returned tokens back to Supabase (there's no URL for it to auto-detect).
  async function signInWith(provider) {
    setError(null);
    setOauth(provider);
    try {
      const redirectTo = Linking.createURL("/");
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo, skipBrowserRedirect: true },
      });
      if (error) throw error;

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
      if (result.type !== "success") return; // user dismissed

      const { params, errorCode } = QueryParams(result.url);
      if (errorCode) throw new Error(errorCode);
      if (params.access_token) {
        const { error: sErr } = await supabase.auth.setSession({
          access_token: params.access_token,
          refresh_token: params.refresh_token,
        });
        if (sErr) throw sErr;
      } else if (params.code) {
        const { error: cErr } = await supabase.auth.exchangeCodeForSession(params.code);
        if (cErr) throw cErr;
      }
    } catch (e) {
      setError(e.message || String(e));
    } finally {
      setOauth(null);
    }
  }

  if (sentEmail) {
    return (
      <View style={[s.screen, { alignItems: "center", justifyContent: "center", padding: 24 }]}>
        <Text style={{ fontSize: 40, marginBottom: 16 }}>✉️</Text>
        <Text style={s.h1}>Check your email</Text>
        <Text style={[s.sub, { textAlign: "center", marginTop: 8 }]}>
          We sent a confirmation link to {email}. Tap it to activate your account.
        </Text>
        <Pressable onPress={() => { setSentEmail(false); setIsSignUp(false); }} style={{ marginTop: 24 }}>
          <Text style={s.link}>Back to sign in</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={s.screen} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        <Text style={s.logo}>STRYDE</Text>
        <Text style={s.tag}>Stop hoping. Start knowing.</Text>

        <View style={s.card}>
          <Text style={s.h1}>{isSignUp ? "Create your account" : "Welcome back"}</Text>
          <Text style={s.sub}>
            {isSignUp ? "Start managing your finances today" : "Sign in to continue"}
          </Text>

          <Text style={s.label}>Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor={c.textFaint}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            style={s.input}
          />

          <Text style={s.label}>Password</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor={c.textFaint}
            secureTextEntry
            style={s.input}
          />

          {error && (
            <View style={s.errorBox}>
              <Text style={{ color: c.danger, fontSize: 13 }}>{error}</Text>
            </View>
          )}

          <Pressable onPress={submit} disabled={loading} style={[s.primaryBtn, loading && { opacity: 0.7 }]}>
            {loading
              ? <ActivityIndicator color="#13111F" />
              : <Text style={s.primaryBtnText}>{isSignUp ? "Create Account" : "Sign In"}</Text>}
          </Pressable>

          <View style={s.dividerRow}>
            <View style={s.dividerLine} />
            <Text style={s.dividerText}>or</Text>
            <View style={s.dividerLine} />
          </View>

          <Pressable
            onPress={() => signInWith("apple")}
            disabled={oauth !== null}
            style={[s.oauthBtn, { backgroundColor: "#000", borderColor: "rgba(255,255,255,0.2)" }]}
          >
            <Text style={[s.oauthText, { color: "#fff" }]}>
              {oauth === "apple" ? "Opening…" : " Continue with Apple"}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => signInWith("google")}
            disabled={oauth !== null}
            style={[s.oauthBtn, { backgroundColor: "#fff", borderColor: "#fff" }]}
          >
            <Text style={[s.oauthText, { color: "#1F1F1F" }]}>
              {oauth === "google" ? "Opening…" : "Continue with Google"}
            </Text>
          </Pressable>

          <Pressable onPress={() => { setIsSignUp(!isSignUp); setError(null); }} style={{ marginTop: 20 }}>
            <Text style={s.switchText}>
              {isSignUp ? "Already have an account? " : "Don't have an account? "}
              <Text style={s.link}>{isSignUp ? "Sign in" : "Sign up"}</Text>
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/** Pull tokens out of an OAuth callback URL (they arrive in the hash or query). */
function QueryParams(url) {
  try {
    const u = new URL(url);
    const hash = u.hash.startsWith("#") ? u.hash.slice(1) : u.hash;
    const merged = new URLSearchParams(`${u.search.replace(/^\?/, "")}&${hash}`);
    const params = {};
    merged.forEach((v, k) => { params[k] = v; });
    return { params, errorCode: params.error_description || params.error || null };
  } catch {
    return { params: {}, errorCode: null };
  }
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: c.bg },
  scroll: { flexGrow: 1, justifyContent: "center", padding: 24 },
  logo: { fontSize: 30, fontWeight: "900", color: c.text, letterSpacing: 4, textAlign: "center" },
  tag: { fontSize: 10, color: c.accent, letterSpacing: 2.5, textAlign: "center", marginTop: 4, textTransform: "uppercase" },
  card: {
    marginTop: 32, backgroundColor: c.panelAlt, borderRadius: 16,
    borderWidth: 1, borderColor: c.borderHard, padding: 24,
  },
  h1: { fontSize: 21, fontWeight: "700", color: c.text },
  sub: { fontSize: 14, color: c.textFaint, marginTop: 4 },
  label: {
    fontSize: 11, fontWeight: "600", color: c.textFaint, letterSpacing: 1,
    textTransform: "uppercase", marginTop: 20, marginBottom: 8,
  },
  input: {
    backgroundColor: c.bg, borderWidth: 1, borderColor: "rgba(108,99,255,0.25)",
    borderRadius: 8, color: c.text, fontSize: 15, paddingHorizontal: 14, paddingVertical: 12,
  },
  errorBox: {
    marginTop: 16, backgroundColor: "rgba(248,113,113,0.08)", borderWidth: 1,
    borderColor: "rgba(248,113,113,0.2)", borderRadius: 8, padding: 10,
  },
  primaryBtn: {
    marginTop: 20, backgroundColor: c.accent, borderRadius: 8,
    paddingVertical: 14, alignItems: "center",
  },
  primaryBtnText: { color: "#13111F", fontSize: 15, fontWeight: "700" },
  dividerRow: { flexDirection: "row", alignItems: "center", gap: 12, marginVertical: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: "rgba(255,255,255,0.08)" },
  dividerText: { color: c.textFaint, fontSize: 12, textTransform: "uppercase", letterSpacing: 1 },
  oauthBtn: {
    borderWidth: 1, borderRadius: 8, paddingVertical: 13,
    alignItems: "center", justifyContent: "center", marginBottom: 12,
  },
  oauthText: { fontSize: 15, fontWeight: "600" },
  switchText: { color: c.textFaint, fontSize: 14, textAlign: "center" },
  link: { color: c.accent, fontWeight: "600" },
});
