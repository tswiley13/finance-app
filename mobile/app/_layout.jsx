import { useEffect, useState } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View } from "react-native";
import { supabase } from "../src/supabase";
import { StrydeDataProvider } from "../src/useStrydeData";
import { Loading } from "../src/ui";
import { c } from "../src/theme";

export default function RootLayout() {
  const [session, setSession] = useState(null);
  const [ready, setReady] = useState(false);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  // Route guard: bounce out to sign-in when signed out, into the app when signed in.
  useEffect(() => {
    if (!ready) return;
    const inAuth = segments[0] === "sign-in";
    if (!session && !inAuth) router.replace("/sign-in");
    if (session && inAuth) router.replace("/");
  }, [ready, session, segments, router]);

  if (!ready) {
    return (
      <View style={{ flex: 1, backgroundColor: c.bg }}>
        <Loading text="Loading Stryde…" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      {/* One fetch for the whole app — every screen reads from this. */}
      <StrydeDataProvider>
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.bg } }}>
          <Stack.Screen name="sign-in" />
          <Stack.Screen name="(tabs)" />
          {/* Pushed from the More tab */}
          <Stack.Screen name="accounts" />
          <Stack.Screen name="categories" />
          <Stack.Screen name="debts" />
          <Stack.Screen name="payperiods" />
          <Stack.Screen name="settings" />
        </Stack>
      </StrydeDataProvider>
    </>
  );
}
