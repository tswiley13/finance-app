import { useState, useEffect } from "react";
import { supabase } from "./supabase";
import AuthPage from "./components/Auth";
import Onboarding from "./pages/Onboarding";

function App() {
  const [session, setSession] = useState(null);
  const [onboardingComplete, setOnboardingComplete] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
  }, []);

  if (!session) {
    return <AuthPage />;
  }

  if (onboardingComplete) {
    return <div>Dashboard coming soon</div>;
  }

  return <Onboarding onComplete={() => setOnboardingComplete(true)} />;
}

export default App;
