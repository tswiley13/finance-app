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
        // Complete any pending household join from invite link signup
        const pending = session.user.user_metadata?.pending_household_id;
        const memberName = session.user.user_metadata?.name;
        if (pending) {
          const { data: existing } = await supabase
            .from("household_members")
            .select("id")
            .eq("household_id", pending)
            .eq("user_id", session.user.id)
            .maybeSingle();

          if (!existing) {
            await supabase.from("household_members").insert({
              household_id: pending,
              user_id: session.user.id,
              name: memberName || "Member",
              role: "member",
            });
          }

          await supabase.auth.updateUser({ data: { pending_household_id: null } });
        }

        // Check if user created a household
        const { data: created } = await supabase
          .from("households")
          .select("id")
          .eq("created_by", session.user.id)
          .maybeSingle();

        if (created) {
          if (!localStorage.getItem("activeNav")) localStorage.setItem("activeNav", "dashboard");
          setHasHousehold(true);
          setCheckingHousehold(false);
          return;
        }

        // Check if user is a member of any household (joined via invite)
        const { data: membership } = await supabase
          .from("household_members")
          .select("id")
          .eq("user_id", session.user.id)
          .maybeSingle();

        if (membership && !localStorage.getItem("activeNav")) localStorage.setItem("activeNav", "dashboard");
        setHasHousehold(!!membership);
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
      <div style={{ minHeight: "100vh", background: "#13111F", opacity: 0 }} />
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
