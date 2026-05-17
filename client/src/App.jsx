import { useState, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "./supabase";
import AuthPage from "./components/Auth";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import JoinHousehold from "./pages/JoinHousehold";
import Landing from "./pages/Landing";

function App() {
  const [session, setSession] = useState(undefined);
  const [hasHousehold, setHasHousehold] = useState(false);
  const [checkingHousehold, setCheckingHousehold] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const inviteCode = searchParams.get("code");

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

    setCheckingHousehold(true);
    {
      async function checkHousehold() {
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
    }
  }, [session]);

  if (session === undefined || checkingHousehold) {
    return <div style={{ minHeight: "100vh", background: "#13111F", opacity: 0 }} />;
  }

  // Logged-in users always go to the app
  if (session) {
    if (inviteCode) return <JoinHousehold />;
    if (hasHousehold) return <Dashboard />;
    return <Onboarding onComplete={() => { localStorage.setItem("activeNav", "dashboard"); setHasHousehold(true); }} />;
  }

  // Logged-out routing
  if (inviteCode) return <JoinHousehold />;

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/signin" element={<AuthPage defaultSignUp={false} />} />
      <Route path="/signup" element={<AuthPage defaultSignUp={true} />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
