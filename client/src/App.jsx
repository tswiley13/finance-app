import { useState, useEffect } from "react";
import { supabase } from "./supabase";
import AuthPage from "./components/Auth";
import Onboarding from "./pages/Onboarding";

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasHousehold, setHasHousehold] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
  }, []);

  useEffect(() => {
    if (!session) {
      setLoading(false);
      return;
    }

    async function checkHousehold() {
      const { data } = await supabase
        .from("households")
        .select("id")
        .eq("created_by", session.user.id)
        .maybeSingle();

      if (data) {
        setHasHousehold(true);
      }

      setLoading(false);
    }

    checkHousehold();
  }, [session]);

  if (!session) {
    return <AuthPage />;
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  if (hasHousehold) {
    return (
      <div>
        <p>Dashboard coming soon</p>
        <button onClick={() => supabase.auth.signOut()}>Sign Out</button>
      </div>
    );
  }

  return <Onboarding onComplete={() => setHasHousehold(true)} />;
}

export default App;
