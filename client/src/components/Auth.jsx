import { useState } from "react";
import { supabase } from "../supabase";

function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSignUp, setIsSignUp] = useState(false);
  const [signedUp, setSignedUp] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setError(error.message);
      } else {
        setSignedUp(true);
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) setError(error.message);
    }
    setLoading(false);
  }

  async function handleResend() {
    setResendLoading(true);
    setResendMessage(null);
    const { error } = await supabase.auth.resend({ type: "signup", email });
    setResendMessage(error ? "Couldn't resend. Try again in a moment." : "Sent! Check your inbox.");
    setResendLoading(false);
  }

  if (signedUp) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#13111F",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "'Inter', sans-serif",
        }}
      >
        <div
          style={{
            width: "420px",
            padding: "48px",
            background: "#161B22",
            borderRadius: "16px",
            border: "1px solid #30363D",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #6C63FF, #948cf2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 24px",
              fontSize: "24px",
            }}
          >
            ✉️
          </div>
          <div
            style={{
              fontSize: "20px",
              fontWeight: "700",
              color: "#F0F6FC",
              marginBottom: "12px",
            }}
          >
            Check your email
          </div>
          <div
            style={{ fontSize: "14px", color: "#6E7681", lineHeight: "1.6" }}
          >
            We sent a confirmation link to{" "}
            <span style={{ color: "#6C63FF" }}>{email}</span>. Click it to
            activate your account.
          </div>
          <div style={{ marginTop: "28px", paddingTop: "24px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            {resendMessage ? (
              <div style={{ fontSize: "13px", color: resendMessage.startsWith("Sent") ? "#00D4AA" : "#F87171" }}>
                {resendMessage}
              </div>
            ) : (
              <div style={{ fontSize: "13px", color: "#6E7681" }}>
                Didn't receive it?{" "}
                <span
                  onClick={resendLoading ? undefined : handleResend}
                  style={{ color: "#6C63FF", cursor: resendLoading ? "default" : "pointer", fontWeight: "600" }}
                >
                  {resendLoading ? "Sending..." : "Resend confirmation"}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#13111F",
        fontFamily: "'Inter', sans-serif",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Top bar */}
      <div className="auth-topbar">
        <div
          style={{
            fontSize: "20px",
            fontWeight: "800",
            letterSpacing: "0.08em",
            color: "#F0F6FC",
            textTransform: "uppercase",
          }}
        >
          Stryde
        </div>
      </div>

      {/* Main content */}
      <div className="auth-main">
        <div className="auth-split">
          {/* Left — tagline */}
          <div className="auth-left">
            <div
              style={{
                fontSize: "56px",
                fontWeight: "800",
                color: "#F0F6FC",
                lineHeight: "1.1",
                letterSpacing: "-0.03em",
                marginBottom: "24px",
              }}
            >
              Stop guessing.
              <br />
              <span style={{ color: "#6C63FF" }}>Start knowing.</span>
            </div>
            <div
              style={{
                fontSize: "18px",
                color: "#6E7681",
                lineHeight: "1.6",
                maxWidth: "420px",
                marginBottom: "40px",
              }}
            >
              Paycheck to paycheck planning built for military families and
              everyday households.
            </div>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "16px" }}
            >
              {[
                "Plan every dollar before it lands",
                "Share finances with your household",
                "Track bills, accounts, and debts in one place",
              ].map((item, i) => (
                <div
                  key={i}
                  style={{ display: "flex", alignItems: "center", gap: "12px" }}
                >
                  <div
                    style={{
                      width: "20px",
                      height: "20px",
                      borderRadius: "50%",
                      background: "rgba(0,212,170,0.15)",
                      border: "1px solid rgba(0,212,170,0.4)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <div
                      style={{
                        width: "6px",
                        height: "6px",
                        borderRadius: "50%",
                        background: "#6C63FF",
                      }}
                    />
                  </div>
                  <div style={{ fontSize: "15px", color: "#8B949E" }}>
                    {item}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — floating card */}
          <div className="auth-card">
            <div style={{ marginBottom: "32px" }}>
              <div
                style={{
                  fontSize: "22px",
                  fontWeight: "700",
                  color: "#F0F6FC",
                  marginBottom: "6px",
                }}
              >
                {isSignUp ? "Create your account" : "Welcome back"}
              </div>
              <div style={{ fontSize: "14px", color: "#6E7681" }}>
                {isSignUp
                  ? "Start managing your finances today"
                  : "Sign in to continue to Stryde"}
              </div>
            </div>

            <form
              onSubmit={handleSubmit}
              style={{ display: "flex", flexDirection: "column", gap: "16px" }}
            >
              <div>
                <label
                  style={{
                    fontSize: "11px",
                    fontWeight: "600",
                    color: "#6E7681",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    display: "block",
                    marginBottom: "8px",
                  }}
                >
                  Email
                </label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="auth-input"
                  style={{ fontSize: "14px" }}
                />
              </div>
              <div>
                <label
                  style={{
                    fontSize: "11px",
                    fontWeight: "600",
                    color: "#6E7681",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    display: "block",
                    marginBottom: "8px",
                  }}
                >
                  Password
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="auth-input"
                  style={{ fontSize: "14px" }}
                />
              </div>

              {error && (
                <div
                  style={{
                    fontSize: "13px",
                    color: "#F87171",
                    background: "rgba(248,113,113,0.08)",
                    padding: "10px 14px",
                    borderRadius: "8px",
                    border: "1px solid rgba(248,113,113,0.2)",
                  }}
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "13px",
                  background: "linear-gradient(135deg, #6C63FF, #948cf2)",
                  border: "none",
                  borderRadius: "8px",
                  color: "#13111F",
                  fontSize: "14px",
                  fontWeight: "700",
                  fontFamily: "'Inter', sans-serif",
                  cursor: "pointer",
                  marginTop: "8px",
                }}
              >
                {loading
                  ? "Loading..."
                  : isSignUp
                    ? "Create Account"
                    : "Sign In"}
              </button>
            </form>

            <div style={{ marginTop: "24px", textAlign: "center" }}>
              <span style={{ fontSize: "14px", color: "#6E7681" }}>
                {isSignUp
                  ? "Already have an account? "
                  : "Don't have an account? "}
              </span>
              <span
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError(null);
                }}
                style={{
                  fontSize: "14px",
                  color: "#6C63FF",
                  cursor: "pointer",
                  fontWeight: "600",
                }}
              >
                {isSignUp ? "Sign in" : "Sign up"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="auth-footer">
        <div style={{ fontSize: "12px", color: "#484F58" }}>
          © 2026 Stryde. All rights reserved.
        </div>
        <div style={{ fontSize: "12px", color: "#484F58" }}>
          Built for those who serve.
        </div>
      </div>
    </div>
  );
}

export default AuthPage;
