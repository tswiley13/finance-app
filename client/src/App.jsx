import { useState, useEffect } from "react";
import { supabase } from "./supabase";
import AuthPage from "./components/Auth";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";

function App() {
  const [session, setSession] = useState(undefined);
  const [hasHousehold, setHasHousehold] = useState(false);
  const [checkingHousehold, setCheckingHousehold] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
  }, []);

  useEffect(() => {
    if (session === undefined) return;
    if (!session) return;

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
  }, [session]);

  // Don't render anything until we know the session status
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
