import { useState, useEffect, useRef } from "react";
import { Routes, Route, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "./supabase";
import AuthPage from "./components/Auth";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import JoinHousehold from "./pages/JoinHousehold";
import Landing from "./pages/Landing";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";

function App() {
  const [session, setSession] = useState(undefined);
  const [hasHousehold, setHasHousehold] = useState(false);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [checkingHousehold, setCheckingHousehold] = useState(false);
  // The user whose household we've already resolved. Supabase refreshes the
  // session (and fires onAuthStateChange) every time the tab regains focus;
  // without this guard that re-ran the household check and unmounted the whole
  // Dashboard, which looked like a full page reload on every tab switch.
  const checkedUserIdRef = useRef(null);
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
      if (_event === "SIGNED_OUT") navigate("/");
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session === undefined) return;
    if (!session) { checkedUserIdRef.current = null; return; }
    // Same user as last resolved → this is just a token refresh (e.g. tab
    // regained focus). Keep the session fresh but don't re-check or unmount.
    if (checkedUserIdRef.current === session.user.id) return;
    checkedUserIdRef.current = session.user.id;

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

        const isComplete = !!session.user.user_metadata?.onboarding_complete;

        if (created) {
          setHasHousehold(true);
          setOnboardingComplete(isComplete);
          setCheckingHousehold(false);
          return;
        }

        const { data: membership } = await supabase
          .from("household_members")
          .select("id")
          .eq("user_id", session.user.id)
          .maybeSingle();

        setHasHousehold(!!membership);
        setOnboardingComplete(isComplete);
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
    if (hasHousehold && onboardingComplete) return <Dashboard />;
    return <Onboarding onComplete={() => { setHasHousehold(true); setOnboardingComplete(true); }} />;
  }

  // Logged-out routing
  if (inviteCode) return <JoinHousehold />;

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/signin" element={<AuthPage defaultSignUp={false} />} />
      <Route path="/signup" element={<AuthPage defaultSignUp={true} />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/terms" element={<TermsOfService />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
