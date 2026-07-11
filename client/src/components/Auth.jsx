import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../supabase";

function AuthPage({ defaultSignUp = false }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSignUp, setIsSignUp] = useState(defaultSignUp);
  const [signedUp, setSignedUp] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (isSignUp) {
      if (!agreedToTerms) {
        setError("You must agree to the Terms of Service and Privacy Policy to create an account.");
        setLoading(false);
        return;
      }
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setError(error.message);
      }
      // On success, onAuthStateChange in App.jsx handles routing
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

  async function handleOAuth(provider) {
    setError(null);
    setOauthLoading(provider);
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: window.location.origin },
    });
    // On success the browser redirects away; only reached if it fails to start.
    if (error) {
      setError(error.message);
      setOauthLoading(null);
    }
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
            We sent a confirmation link to your inbox. Click it to activate your account.
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
            fontSize: "28px",
            fontWeight: "900",
            letterSpacing: "0.12em",
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
              Stop hoping.
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
              Real financial planning for every household.
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
                  <div style={{ fontSize: "15px", color: "#8B8FA8" }}>
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

              {isSignUp && (
                <label style={{ display: "flex", alignItems: "flex-start", gap: "10px", cursor: "pointer", marginTop: "8px" }}>
                  <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    style={{ marginTop: "2px", flexShrink: 0 }}
                  />
                  <span style={{ fontSize: "12px", color: "#8B8FA8", lineHeight: "1.5" }}>
                    I agree to the{" "}
                    <Link to="/terms" target="_blank" style={{ color: "#6C63FF", textDecoration: "none" }}>Terms of Service</Link>
                    {" "}and{" "}
                    <Link to="/privacy" target="_blank" style={{ color: "#6C63FF", textDecoration: "none" }}>Privacy Policy</Link>
                  </span>
                </label>
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

            {/* Divider */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px", margin: "24px 0" }}>
              <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.08)" }} />
              <span style={{ fontSize: "12px", color: "#6E7681", textTransform: "uppercase", letterSpacing: "0.08em" }}>or</span>
              <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.08)" }} />
            </div>

            {/* OAuth buttons */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <button
                type="button"
                onClick={() => handleOAuth("google")}
                disabled={oauthLoading !== null}
                style={{
                  width: "100%",
                  padding: "12px",
                  background: "#FFFFFF",
                  border: "none",
                  borderRadius: "8px",
                  color: "#1F1F1F",
                  fontSize: "14px",
                  fontWeight: "600",
                  fontFamily: "'Inter', sans-serif",
                  cursor: oauthLoading ? "default" : "pointer",
                  opacity: oauthLoading && oauthLoading !== "google" ? 0.6 : 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "10px",
                }}
              >
                <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                </svg>
                {oauthLoading === "google" ? "Redirecting…" : "Continue with Google"}
              </button>

              <button
                type="button"
                onClick={() => handleOAuth("apple")}
                disabled={oauthLoading !== null}
                style={{
                  width: "100%",
                  padding: "12px",
                  background: "#000000",
                  border: "1px solid rgba(255,255,255,0.18)",
                  borderRadius: "8px",
                  color: "#FFFFFF",
                  fontSize: "14px",
                  fontWeight: "600",
                  fontFamily: "'Inter', sans-serif",
                  cursor: oauthLoading ? "default" : "pointer",
                  opacity: oauthLoading && oauthLoading !== "apple" ? 0.6 : 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "10px",
                }}
              >
                <svg width="16" height="18" viewBox="0 0 384 512" fill="#FFFFFF" aria-hidden="true">
                  <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/>
                </svg>
                {oauthLoading === "apple" ? "Redirecting…" : "Continue with Apple"}
              </button>
            </div>

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
          © 2026 Stryde Financial LLC. All rights reserved.
        </div>
        <div style={{ display: "flex", gap: "16px" }}>
          <Link to="/privacy" style={{ fontSize: "12px", color: "#484F58", textDecoration: "none" }}>Privacy Policy</Link>
          <Link to="/terms" style={{ fontSize: "12px", color: "#484F58", textDecoration: "none" }}>Terms of Service</Link>
        </div>
      </div>
    </div>
  );
}

export default AuthPage;
