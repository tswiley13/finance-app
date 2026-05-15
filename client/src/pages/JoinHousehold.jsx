import { useState, useEffect } from "react";
import { supabase } from "../supabase";

function JoinHousehold() {
  const [inviteCode, setInviteCode] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    if (code) setInviteCode(code);
  }, []);

  async function handleJoin() {
    if (!name || !email || !password || !inviteCode) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);
    setError("");

    // Look up household by invite code
    const { data: household, error: householdError } = await supabase
      .from("households")
      .select("id")
      .eq("invite_code", inviteCode)
      .single();

    if (householdError || !household) {
      setError("Invalid invite code. Please check and try again.");
      setLoading(false);
      return;
    }

    // Create auth account
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    // Insert into household_members
    const { error: memberError } = await supabase
      .from("household_members")
      .insert({
        household_id: household.id,
        user_id: authData.user.id,
        name,
        role: "member",
      });

    if (memberError) {
      setError(memberError.message);
      setLoading(false);
      return;
    }

    // Redirect to dashboard
    window.location.href = "/";
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0F1218",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <div
        style={{
          background: "#161B26",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: "12px",
          padding: "40px",
          width: "100%",
          maxWidth: "400px",
        }}
      >
        <div style={{ marginBottom: "32px" }}>
          <div
            style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: "22px",
              fontWeight: "800",
              letterSpacing: "0.12em",
              color: "#E8E6E1",
              textTransform: "uppercase",
              marginBottom: "4px",
            }}
          >
            Slate
          </div>
          <div
            style={{
              fontSize: "10px",
              color: "#E8B84B",
              letterSpacing: "0.25em",
              textTransform: "uppercase",
            }}
          >
            Don't go dark.
          </div>
        </div>

        <div
          style={{
            fontSize: "18px",
            fontWeight: "600",
            color: "#E8E6E1",
            marginBottom: "8px",
          }}
        >
          Join Your Household
        </div>
        <div
          style={{ fontSize: "13px", color: "#8892A4", marginBottom: "24px" }}
        >
          Create your account to access your shared finances.
        </div>

        {error && (
          <div
            style={{
              fontSize: "13px",
              color: "#FC8181",
              marginBottom: "16px",
              background: "#2D2B45",
              padding: "10px 12px",
              borderRadius: "6px",
            }}
          >
            {error}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <input
            placeholder="Your name (e.g. Shawna)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{
              background: "#2D2B45",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "#E8E6E1",
              padding: "10px 12px",
              borderRadius: "6px",
              fontSize: "13px",
              fontFamily: "'DM Sans', sans-serif",
            }}
          />
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              background: "#2D2B45",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "#E8E6E1",
              padding: "10px 12px",
              borderRadius: "6px",
              fontSize: "13px",
              fontFamily: "'DM Sans', sans-serif",
            }}
          />
          <input
            type="password"
            placeholder="Create a password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              background: "#2D2B45",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "#E8E6E1",
              padding: "10px 12px",
              borderRadius: "6px",
              fontSize: "13px",
              fontFamily: "'DM Sans', sans-serif",
            }}
          />
          <input
            placeholder="Invite code"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            style={{
              background: "#2D2B45",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "#E8B84B",
              padding: "10px 12px",
              borderRadius: "6px",
              fontSize: "13px",
              fontFamily: "'DM Mono', monospace",
              letterSpacing: "0.1em",
            }}
          />
          <button
            onClick={handleJoin}
            disabled={loading}
            style={{
              background: "#E8B84B",
              border: "none",
              color: "#0F1218",
              padding: "12px",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "600",
              fontFamily: "'DM Sans', sans-serif",
              marginTop: "8px",
            }}
          >
            {loading ? "Joining..." : "Join Household"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default JoinHousehold;
