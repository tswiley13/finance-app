import { useState, useEffect } from "react";
import { supabase } from "./supabase";
import AuthPage from "./components/Auth";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import JoinHousehold from "./pages/JoinHousehold";

function App() {
  const [session, setSession] = useState(undefined);
  const [hasHousehold, setHasHousehold] = useState(false);
  const [checkingHousehold, setCheckingHousehold] = useState(false);

  const params = new URLSearchParams(window.location.search);
  const inviteCode = params.get("code");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session === undefined) return;
    if (!session) return;

    setTimeout(() => {
      setCheckingHousehold(true);
      async function checkHousehold() {
        const { data } = await supabase
          .from("household_members")
          .select("household_id")
          .eq("user_id", session.user.id)
          .limit(1)
          .maybeSingle();

        setHasHousehold(!!data);
        setCheckingHousehold(false);
      }

      checkHousehold();
    }, 0);
  }, [session]);

  if (inviteCode) {
    return <JoinHousehold />;
  }

  if (session === undefined || checkingHousehold) {
    return (
      <div style={{ minHeight: "100vh", background: "#0F1218", opacity: 0 }} />
    );
  }

  if (!session) {
    return <AuthPage />;
  }

  if (hasHousehold) {
    return <Dashboard />;
  }

  return <Onboarding onComplete={() => setHasHousehold(true)} />;
}

export default App;
