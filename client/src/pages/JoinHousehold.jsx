import { useState, useEffect } from "react";
import { supabase } from "../supabase";

function JoinHousehold() {
  const [inviteCode, setInviteCode] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [joined, setJoined] = useState(false);

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

    const { data: household, error: householdError } = await supabase
      .from("households")
      .select("id")
      .eq("invite_code", inviteCode)
      .single();

    if (householdError || !household) {
      setError("Invalid invite code. Please check with your household admin.");
      setLoading(false);
      return;
    }

    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          pending_household_id: household.id,
        },
      },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    setJoined(true);
    setLoading(false);
  }

  const inputStyle = {
    width: "100%",
    padding: "12px 14px",
    background: "#13111F",
    border: "1px solid rgba(108,99,255,0.25)",
    borderRadius: "8px",
    color: "#F0F6FC",
    fontSize: "14px",
    fontFamily: "'Inter', sans-serif",
    outline: "none",
    boxSizing: "border-box",
  };

  const labelStyle = {
    fontSize: "11px",
    fontWeight: "600",
    color: "#6E7681",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    display: "block",
    marginBottom: "8px",
  };

  if (joined) {
    return (
      <div style={{ minHeight: "100vh", background: "#13111F", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter', sans-serif" }}>
        <div style={{ width: "420px", padding: "48px", background: "#161B22", borderRadius: "16px", border: "1px solid #30363D", textAlign: "center" }}>
          <div style={{ width: "56px", height: "56px", borderRadius: "50%", background: "linear-gradient(135deg, #6C63FF, #948cf2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", fontSize: "24px" }}>
            ✉️
          </div>
          <div style={{ fontSize: "20px", fontWeight: "700", color: "#F0F6FC", marginBottom: "12px" }}>
            Check your email
          </div>
          <div style={{ fontSize: "14px", color: "#6E7681", lineHeight: "1.6" }}>
            We sent a confirmation link to{" "}
            <span style={{ color: "#6C63FF" }}>{email}</span>. Click it to activate your account and access the household.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#13111F", fontFamily: "'Inter', sans-serif", display: "flex", flexDirection: "column" }}>
      {/* Top bar */}
      <div style={{ padding: "28px 48px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: "11px", fontWeight: "700", letterSpacing: "0.2em", color: "#6C63FF", textTransform: "uppercase", marginBottom: "2px" }}>
            Bravo Six
          </div>
          <div style={{ fontSize: "20px", fontWeight: "800", letterSpacing: "0.08em", color: "#F0F6FC", textTransform: "uppercase" }}>
            Slate
          </div>
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 48px 60px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "80px", maxWidth: "1200px", width: "100%" }}>

          {/* Left — context */}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "56px", fontWeight: "800", color: "#F0F6FC", lineHeight: "1.1", letterSpacing: "-0.03em", marginBottom: "24px" }}>
              You're
              <br />
              <span style={{ color: "#6C63FF" }}>invited.</span>
            </div>
            <div style={{ fontSize: "18px", color: "#6E7681", lineHeight: "1.6", maxWidth: "420px", marginBottom: "40px" }}>
              Someone added you to their Slate household. Create your account to view shared finances, bills, and pay periods.
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {[
                "See the full household budget",
                "Track bills and pay periods together",
                "Your data stays private to your household",
              ].map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: "rgba(0,212,170,0.15)", border: "1px solid rgba(0,212,170,0.4)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#6C63FF" }} />
                  </div>
                  <div style={{ fontSize: "15px", color: "#8B949E" }}>{item}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — form card */}
          <div style={{ width: "400px", flexShrink: 0, background: "#161B22", borderRadius: "20px", border: "1px solid #30363D", padding: "40px", boxShadow: "0 24px 64px rgba(0,0,0,0.4)" }}>
            <div style={{ marginBottom: "32px" }}>
              <div style={{ fontSize: "22px", fontWeight: "700", color: "#F0F6FC", marginBottom: "6px" }}>
                Create your account
              </div>
              <div style={{ fontSize: "14px", color: "#6E7681" }}>
                Join your household on Slate
              </div>
            </div>

            {/* Invite code badge */}
            {inviteCode && (
              <div style={{ background: "rgba(108,99,255,0.08)", border: "1px solid rgba(108,99,255,0.25)", borderRadius: "8px", padding: "10px 14px", marginBottom: "24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "11px", color: "#6E7681", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: "600" }}>Invite Code</span>
                <span style={{ fontSize: "13px", color: "#6C63FF", fontFamily: "'DM Mono', monospace", fontWeight: "700", letterSpacing: "0.12em" }}>{inviteCode}</span>
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={labelStyle}>Your Name</label>
                <input
                  className="auth-input"
                  type="text"
                  placeholder="e.g. Shawna"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{ fontSize: "14px" }}
                  autoFocus
                />
              </div>
              <div>
                <label style={labelStyle}>Email</label>
                <input
                  className="auth-input"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ fontSize: "14px" }}
                />
              </div>
              <div>
                <label style={labelStyle}>Password</label>
                <input
                  className="auth-input"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                  style={{ fontSize: "14px" }}
                />
              </div>

              {!inviteCode && (
                <div>
                  <label style={labelStyle}>Invite Code</label>
                  <input
                    className="auth-input"
                    type="text"
                    placeholder="XXXXX-0000"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    style={{ fontSize: "14px", fontFamily: "'DM Mono', monospace", letterSpacing: "0.1em" }}
                  />
                </div>
              )}

              {error && (
                <div style={{ fontSize: "13px", color: "#F87171", background: "rgba(248,113,113,0.08)", padding: "10px 14px", borderRadius: "8px", border: "1px solid rgba(248,113,113,0.2)" }}>
                  {error}
                </div>
              )}

              <button
                onClick={handleJoin}
                disabled={loading}
                style={{ width: "100%", padding: "13px", background: "linear-gradient(135deg, #6C63FF, #948cf2)", border: "none", borderRadius: "8px", color: "#13111F", fontSize: "14px", fontWeight: "700", fontFamily: "'Inter', sans-serif", cursor: "pointer", marginTop: "8px" }}
              >
                {loading ? "Joining..." : "Join Household"}
              </button>
            </div>

            <div style={{ marginTop: "24px", textAlign: "center", fontSize: "13px", color: "#6E7681" }}>
              Already have an account?{" "}
              <span
                onClick={() => window.location.href = "/"}
                style={{ color: "#6C63FF", cursor: "pointer", fontWeight: "600" }}
              >
                Sign in
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding: "20px 48px", borderTop: "1px solid #21262D", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: "12px", color: "#484F58" }}>© 2026 Bravo Six. All rights reserved.</div>
        <div style={{ fontSize: "12px", color: "#484F58" }}>Built for those who serve.</div>
      </div>
    </div>
  );
}

export default JoinHousehold;
