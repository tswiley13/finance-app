import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import "./Landing.css";

// ── Demo data ────────────────────────────────────────────────────────────────
const PREV_BILLS = [
  { name: "Gas",       amount: 300,   paid: true  },
  { name: "Groceries", amount: 500,   paid: true  },
  { name: "Lawyer",    amount: 200,   paid: false },
  { name: "Internet",  amount: 105,   paid: false },
];

const NEXT_BILLS = [
  { name: "Mortgage",      amount: 1150,   due: "Due the 1st"  },
  { name: "Car Insurance", amount: 490,    due: "Due the 1st"  },
  { name: "APS Electric",  amount: 245,    due: "Due the 1st"  },
  { name: "Cox Internet",  amount: 105,    due: "Due the 26th" },
  { name: "HOA",           amount: 143.69, due: "Due the 1st"  },
];

const NEXT_BILLS_TOTAL    = NEXT_BILLS.reduce((s, b) => s + b.amount, 0); // 2133.69
const PREV_BILLS_UNPAID   = PREV_BILLS.filter(b => !b.paid).reduce((s, b) => s + b.amount, 0); // 305
const AVAILABLE_NOW       = 4847.22;
const NEXT_PERIOD_INCOME  = 4537.21;
const NEXT_PERIOD_START   = 1562.79;
const NEXT_PERIOD_END     = NEXT_PERIOD_START + NEXT_PERIOD_INCOME - NEXT_BILLS_TOTAL; // 3966.31

const PHASE_CAPTIONS = [
  "Stryde maps every bill to your pay period the moment it starts.",
  "Paycheck hits your account — mark it received in one tap.",
  "Start checking off bills as you pay them.",
  "Your remaining balance updates with every payment.",
  "More bills cleared, more confidence in your plan.",
  "All bills accounted for — nothing slips through the cracks.",
  "Know your exact end-of-period balance before it arrives.",
];
const PHASE_DURATIONS = [2200, 2000, 1700, 1700, 1700, 1700, 2800];

function fmt(n) {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ── Full dashboard preview ────────────────────────────────────────────────────
function DashboardPreview() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const t = setTimeout(
      () => setPhase(p => (p >= PHASE_CAPTIONS.length - 1 ? 0 : p + 1)),
      PHASE_DURATIONS[phase] ?? 2000
    );
    return () => clearTimeout(t);
  }, [phase]);

  const incomeReceived  = phase >= 1;
  const paidCount       = Math.max(0, phase - 1);
  const nextPaidAmt     = NEXT_BILLS.slice(0, paidCount).reduce((s, b) => s + b.amount, 0);
  const nextRemaining   = NEXT_BILLS_TOTAL - nextPaidAmt;
  const allPaid         = paidCount >= NEXT_BILLS.length;

  const totalBillsRemaining = nextRemaining + PREV_BILLS_UNPAID;
  const incomeThisMonth     = incomeReceived ? 0 : NEXT_PERIOD_INCOME;
  const availableThisMonth  = AVAILABLE_NOW + incomeThisMonth - totalBillsRemaining;

  const SUMMARY = [
    { label: "Available Now",        value: `$${fmt(AVAILABLE_NOW)}`,       color: "#4ADE80" },
    { label: "Income This Month",    value: incomeReceived ? "Received ✓" : `+$${fmt(incomeThisMonth)}`, color: incomeReceived ? "#4A5568" : "#4ADE80" },
    { label: "Bills Remaining",      value: `$${fmt(totalBillsRemaining)}`,  color: "#F0F6FC" },
    { label: "Available This Month", value: `$${fmt(availableThisMonth)}`,   color: "#4ADE80" },
  ];

  const B = { border: "1px solid rgba(255,255,255,0.05)" };

  return (
    <section style={{ padding: "80px 24px", background: "#080711" }}>
      <div style={{ maxWidth: "1160px", margin: "0 auto" }}>

        {/* Heading */}
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <div style={{ fontSize: "11px", fontWeight: "700", letterSpacing: "0.2em", textTransform: "uppercase", color: "#6C63FF", marginBottom: "16px" }}>See It In Action</div>
          <h2 style={{ fontSize: "42px", fontWeight: "800", letterSpacing: "-0.02em", margin: 0 }}>Everything you need, in one view</h2>
        </div>

        {/* Browser chrome */}
        <div style={{ background: "#1C1A2E", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px", overflow: "hidden", boxShadow: "0 40px 100px rgba(0,0,0,0.7)" }}>
          <div style={{ background: "#161422", padding: "11px 16px", display: "flex", alignItems: "center", gap: "8px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ display: "flex", gap: "6px" }}>
              {["#FF5F57","#FEBC2E","#28C840"].map(c => <div key={c} style={{ width: "10px", height: "10px", borderRadius: "50%", background: c }} />)}
            </div>
            <div style={{ flex: 1, background: "rgba(255,255,255,0.05)", borderRadius: "6px", padding: "4px 12px", fontSize: "11px", color: "#4A4F5C", textAlign: "center" }}>app.stryde.money</div>
          </div>

          {/* App shell */}
          <div style={{ background: "#13111F" }}>

            {/* App nav */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", borderBottom: "1px solid rgba(255,255,255,0.06)", height: "50px" }}>
              <div style={{ fontSize: "15px", fontWeight: "900", letterSpacing: "0.12em", textTransform: "uppercase", color: "#6C63FF" }}>STRYDE</div>
              <div style={{ display: "flex", gap: "2px" }}>
                {["Dashboard","Bills","Accounts","Debts"].map((tab, i) => (
                  <div key={tab} style={{ padding: "5px 12px", borderRadius: "7px", fontSize: "12px", fontWeight: i === 0 ? "700" : "500", color: i === 0 ? "#F0F6FC" : "#8B8FA8", background: i === 0 ? "rgba(255,255,255,0.07)" : "transparent" }}>{tab}</div>
                ))}
              </div>
              <div style={{ width: "30px", height: "30px", borderRadius: "50%", background: "linear-gradient(135deg, #6C63FF, #948cf2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: "700" }}>T</div>
            </div>

            <div style={{ padding: "18px 24px 24px" }}>

              {/* Summary tiles */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "10px", marginBottom: "18px" }}>
                {SUMMARY.map((s, i) => (
                  <div key={i} style={{ background: "#161B22", ...B, borderRadius: "12px", padding: "14px 16px" }}>
                    <div style={{ fontSize: "8px", color: "#8B8FA8", fontWeight: "700", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: "7px" }}>{s.label}</div>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "17px", fontWeight: "700", color: s.color, transition: "color 0.5s ease" }}>{s.value}</div>
                  </div>
                ))}
              </div>

              {/* Period cards */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1.45fr", gap: "14px", alignItems: "start" }}>

                {/* ── Current period — mostly static ─────────────────────── */}
                <div style={{ background: "#161B22", ...B, borderRadius: "13px", overflow: "hidden" }}>
                  {/* header */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "14px 16px 12px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <div>
                      <div style={{ fontSize: "12px", fontWeight: "700" }}>Jun 4 — Jun 17</div>
                      <div style={{ fontSize: "9px", color: "#6C63FF", fontWeight: "600", marginTop: "2px" }}>● Current Period</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: "7px", color: "#8B8FA8", letterSpacing: "0.1em", textTransform: "uppercase" }}>End Balance</div>
                      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "17px", fontWeight: "700", color: "#4ADE80" }}>$1,562.79</div>
                    </div>
                  </div>
                  {/* stats */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    {[["START","$4,847.22"],["INCOME","+$0"],["BILLS","$305.00"]].map(([l,v],i) => (
                      <div key={i} style={{ padding: "9px 12px", borderRight: i < 2 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                        <div style={{ fontSize: "7px", color: "#8B8FA8", fontWeight: "700", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "4px" }}>{l}</div>
                        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "11px", fontWeight: "600", color: "#F0F6FC" }}>{v}</div>
                      </div>
                    ))}
                  </div>
                  {/* income */}
                  <div style={{ padding: "10px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <div style={{ fontSize: "7px", color: "#8B8FA8", fontWeight: "700", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "7px" }}>INCOME</div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ fontSize: "11px", color: "#4ADE80", fontWeight: "600", display: "flex", alignItems: "center", gap: "4px" }}>✓ Airgas <span style={{ color: "#8B8FA8", fontWeight: "400", fontSize: "10px" }}>Received</span></div>
                      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "11px", color: "#4ADE80" }}>+$2,977.00</div>
                    </div>
                  </div>
                  {/* bills */}
                  <div style={{ padding: "10px 16px" }}>
                    <div style={{ fontSize: "7px", color: "#8B8FA8", fontWeight: "700", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "7px" }}>BILLS</div>
                    {PREV_BILLS.map((b, i) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 0", opacity: b.paid ? 0.4 : 1, borderBottom: i < PREV_BILLS.length-1 ? "1px solid rgba(255,255,255,0.03)" : "none" }}>
                        <div style={{ fontSize: "11px", color: b.paid ? "#8B8FA8" : "#F0F6FC", textDecoration: b.paid ? "line-through" : "none" }}>{b.name}</div>
                        <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", color: "#8B8FA8", textDecoration: b.paid ? "line-through" : "none" }}>${fmt(b.amount)}</div>
                          <div style={{ width: "24px", height: "20px", borderRadius: "4px", background: b.paid ? "rgba(74,222,128,0.1)" : "rgba(108,99,255,0.08)", border: `1px solid ${b.paid ? "rgba(74,222,128,0.3)" : "rgba(108,99,255,0.2)"}`, display: "flex", alignItems: "center", justifyContent: "center", color: b.paid ? "#4ADE80" : "#6C63FF", fontSize: b.paid ? "9px" : "7px", fontWeight: "600" }}>
                            {b.paid ? "✓" : "Paid"}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ── Next period — animated ──────────────────────────────── */}
                <div style={{ background: "#161B22", ...B, borderRadius: "13px", overflow: "hidden" }}>
                  {/* header */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "14px 16px 12px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <div>
                      <div style={{ fontSize: "12px", fontWeight: "700" }}>Jun 18 — Jul 1</div>
                      <div style={{ fontSize: "9px", color: "#8B8FA8", marginTop: "2px" }}>
                        {incomeReceived ? "✓ Airgas received · VA Disability (Jul 1)" : "Airgas (Jun 18) · VA Disability (Jul 1)"}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: "7px", color: "#8B8FA8", letterSpacing: "0.1em", textTransform: "uppercase" }}>End Balance</div>
                      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "17px", fontWeight: "700", color: allPaid ? "#4ADE80" : "#F0F6FC", transition: "color 0.6s ease", filter: allPaid ? "drop-shadow(0 0 10px rgba(74,222,128,0.45))" : "none" }}>
                        ${fmt(NEXT_PERIOD_END)}
                      </div>
                    </div>
                  </div>
                  {/* stats */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    {[
                      ["START",  `$${fmt(NEXT_PERIOD_START)}`,  "#F0F6FC"],
                      ["INCOME", `+$${fmt(NEXT_PERIOD_INCOME)}`, incomeReceived ? "#4ADE80" : "#8B8FA8"],
                      ["BILLS",  `$${fmt(nextRemaining)}`,       "#F0F6FC"],
                    ].map(([l,v,c],i) => (
                      <div key={i} style={{ padding: "9px 12px", borderRight: i < 2 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                        <div style={{ fontSize: "7px", color: "#8B8FA8", fontWeight: "700", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "4px" }}>{l}</div>
                        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "11px", fontWeight: "600", color: c, transition: "color 0.5s ease" }}>{v}</div>
                      </div>
                    ))}
                  </div>
                  {/* income */}
                  <div style={{ padding: "10px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <div style={{ fontSize: "7px", color: "#8B8FA8", fontWeight: "700", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "7px" }}>INCOME</div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ fontSize: "11px", fontWeight: "600", color: incomeReceived ? "#4ADE80" : "#F0F6FC", transition: "color 0.5s ease", display: "flex", alignItems: "center", gap: "4px" }}>
                        {incomeReceived ? "✓ " : ""}VA Disability
                        <span style={{ fontSize: "10px", color: "#8B8FA8", fontWeight: "400" }}>{incomeReceived ? "Received" : "Jul 1"}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "11px", color: "#4ADE80" }}>+${fmt(NEXT_PERIOD_INCOME)}</div>
                        {!incomeReceived && (
                          <div style={{ background: "rgba(108,99,255,0.15)", border: "1px solid rgba(108,99,255,0.3)", color: "#6C63FF", borderRadius: "5px", padding: "3px 8px", fontSize: "9px", fontWeight: "600" }}>Got Paid</div>
                        )}
                      </div>
                    </div>
                  </div>
                  {/* bills */}
                  <div style={{ padding: "10px 16px" }}>
                    <div style={{ fontSize: "7px", color: "#8B8FA8", fontWeight: "700", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "7px" }}>BILLS</div>
                    {NEXT_BILLS.map((b, i) => {
                      const paid = i < paidCount;
                      return (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 0", opacity: paid ? 0.38 : 1, transition: "opacity 0.5s ease", borderBottom: i < NEXT_BILLS.length-1 ? "1px solid rgba(255,255,255,0.03)" : "none" }}>
                          <div>
                            <div style={{ fontSize: "11px", color: paid ? "#8B8FA8" : "#F0F6FC", textDecoration: paid ? "line-through" : "none", transition: "all 0.5s ease" }}>{b.name}</div>
                            <div style={{ fontSize: "9px", color: "#4A4F5C" }}>{b.due}</div>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", color: "#8B8FA8", textDecoration: paid ? "line-through" : "none", transition: "all 0.5s ease" }}>${fmt(b.amount)}</div>
                            <div style={{ width: "28px", height: "22px", borderRadius: "5px", background: paid ? "rgba(74,222,128,0.1)" : "rgba(108,99,255,0.08)", border: `1px solid ${paid ? "rgba(74,222,128,0.3)" : "rgba(108,99,255,0.2)"}`, display: "flex", alignItems: "center", justifyContent: "center", color: paid ? "#4ADE80" : "#6C63FF", fontSize: paid ? "10px" : "8px", fontWeight: "600", transition: "all 0.5s ease" }}>
                              {paid ? "✓" : "Paid"}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>

        {/* Caption + dots */}
        <div style={{ textAlign: "center", marginTop: "36px" }}>
          <p style={{ fontSize: "16px", color: "#8B8FA8", margin: "0 0 20px", minHeight: "24px" }}>
            {PHASE_CAPTIONS[phase]}
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: "6px" }}>
            {PHASE_CAPTIONS.map((_, i) => (
              <div key={i} style={{ width: phase === i ? "22px" : "6px", height: "6px", borderRadius: "3px", background: phase === i ? "#6C63FF" : "rgba(255,255,255,0.12)", transition: "all 0.4s ease" }} />
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}

function Landing() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  function goToSignUp() { navigate("/signup"); }
  function goToSignIn() { navigate("/signin"); }

  return (
    <div style={{ minHeight: "100vh", background: "#13111F", fontFamily: "'Inter', sans-serif", color: "#F0F6FC" }}>

      {/* Nav */}
      <nav className="landing-nav">
        <div style={{ fontSize: "22px", fontWeight: "900", letterSpacing: "0.12em", textTransform: "uppercase" }}>Stryde</div>

        {/* Desktop links */}
        <div className="landing-nav-links">
          <a href="#features" style={{ fontSize: "14px", color: "#8B8FA8", textDecoration: "none" }}>Features</a>
          <a href="#pricing" style={{ fontSize: "14px", color: "#8B8FA8", textDecoration: "none" }}>Pricing</a>
          <button onClick={goToSignIn} style={{ fontSize: "14px", color: "#8B8FA8", background: "none", border: "none", cursor: "pointer", fontFamily: "'Inter', sans-serif" }}>Sign In</button>
          <button onClick={goToSignUp} style={{ fontSize: "14px", fontWeight: "700", color: "#13111F", background: "linear-gradient(135deg, #6C63FF, #948cf2)", border: "none", borderRadius: "8px", padding: "10px 20px", cursor: "pointer", fontFamily: "'Inter', sans-serif" }}>Get Started Free</button>
        </div>

        {/* Mobile hamburger */}
        <button
          className="landing-hamburger"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Menu"
        >
          {menuOpen ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#F0F6FC" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          ) : (
            <><span /><span /><span /></>
          )}
        </button>
        {/* Mobile dropdown menu */}
        {menuOpen && (
          <div className="landing-mobile-menu">
            <a href="#features" onClick={() => setMenuOpen(false)}>Features</a>
            <a href="#pricing" onClick={() => setMenuOpen(false)}>Pricing</a>
            <a onClick={() => { setMenuOpen(false); goToSignIn(); }}>Sign In</a>
            <button className="landing-mobile-menu-cta" onClick={() => { setMenuOpen(false); goToSignUp(); }}>Get Started Free</button>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="landing-hero">
        <div style={{ display: "inline-block", fontSize: "11px", fontWeight: "700", letterSpacing: "0.2em", textTransform: "uppercase", color: "#6C63FF", background: "rgba(108,99,255,0.1)", border: "1px solid rgba(108,99,255,0.2)", borderRadius: "20px", padding: "6px 16px", marginBottom: "32px" }}>
          Now in Beta
        </div>
        <h1>
          Stop hoping.<br />
          <span style={{ color: "#6C63FF" }}>Start knowing.</span>
        </h1>
        <p>
          Real financial planning for every household. Know exactly where every dollar is going — before the bills hit.
        </p>
        <div className="landing-hero-cta">
          <button
            onClick={goToSignUp}
            style={{ fontSize: "16px", fontWeight: "700", color: "#13111F", background: "linear-gradient(135deg, #6C63FF, #948cf2)", border: "none", borderRadius: "10px", padding: "16px 36px", cursor: "pointer", fontFamily: "'Inter', sans-serif" }}
          >
            Start Free Trial
          </button>
          <a href="#features" style={{ fontSize: "15px", color: "#6E7681", textDecoration: "none", fontWeight: "500" }}>
            See how it works →
          </a>
        </div>
        <p style={{ fontSize: "12px", color: "#4A4F5C", marginTop: "20px" }}>No credit card required · 14-day free trial</p>
        <p className="landing-mobile-signin">
          Already have an account?{" "}
          <span onClick={goToSignIn} style={{ color: "#6C63FF", cursor: "pointer", fontWeight: "600" }}>Sign In</span>
        </p>
      </section>

      {/* App preview */}
      <section className="landing-preview">
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          {/* Browser chrome */}
          <div style={{ background: "#1C1A2E", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px", overflow: "hidden", boxShadow: "0 40px 80px rgba(0,0,0,0.6)" }}>
            <div style={{ background: "#161422", padding: "12px 16px", display: "flex", alignItems: "center", gap: "8px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ display: "flex", gap: "6px" }}>
                <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#FF5F57" }} />
                <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#FEBC2E" }} />
                <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#28C840" }} />
              </div>
              <div style={{ flex: 1, background: "rgba(255,255,255,0.05)", borderRadius: "6px", padding: "4px 12px", fontSize: "11px", color: "#4A4F5C", textAlign: "center" }}>
                stryde.money
              </div>
            </div>
            <img
              src="/dashboard-preview.png"
              alt="Stryde dashboard showing pay periods, bills, and where the money goes"
              style={{ width: "100%", display: "block" }}
            />
          </div>
        </div>
      </section>

      {/* Animated demo */}
      <DashboardPreview />

      {/* Features */}
      <section id="features" className="landing-section" style={{ background: "rgba(255,255,255,0.01)", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "64px" }}>
            <div style={{ fontSize: "11px", fontWeight: "700", letterSpacing: "0.2em", textTransform: "uppercase", color: "#6C63FF", marginBottom: "16px" }}>Features</div>
            <h2 style={{ fontSize: "42px", fontWeight: "800", letterSpacing: "-0.02em", marginBottom: "16px" }}>Built to keep you ahead</h2>
            <p style={{ fontSize: "17px", color: "#8B8FA8", maxWidth: "480px", margin: "0 auto" }}>Not another app that shows you what you already spent. Stryde plans what's coming.</p>
          </div>
          <div className="landing-features-grid">
            {[
              {
                icon: "📅",
                title: "Pay Period Planning",
                desc: "Map every bill, income source, and account to your exact pay schedule. See what's left before each paycheck arrives.",
                live: true,
              },
              {
                icon: "🏠",
                title: "Household Sharing",
                desc: "Invite your partner or family members to share one household view. Everyone stays on the same page.",
                live: true,
              },
              {
                icon: "🏦",
                title: "Real-Time Bank Balances",
                desc: "Connect your accounts via Plaid and see live balances without logging into your bank.",
                live: true,
              },
              {
                icon: "🤖",
                title: "AI Financial Advisor",
                desc: "Get personalized budgeting advice and answers to your money questions — powered by AI, built into your dashboard.",
                live: false,
                badge: "Coming Soon",
              },
            ].map((f, i) => (
              <div key={i} style={{ background: "#161B22", border: "1px solid #30363D", borderRadius: "16px", padding: "32px", position: "relative" }}>
                {f.badge && (
                  <div style={{ position: "absolute", top: "20px", right: "20px", fontSize: "9px", fontWeight: "700", letterSpacing: "0.1em", textTransform: "uppercase", color: "#6C63FF", background: "rgba(108,99,255,0.1)", border: "1px solid rgba(108,99,255,0.2)", borderRadius: "20px", padding: "4px 10px" }}>
                    {f.badge}
                  </div>
                )}
                <div style={{ fontSize: "32px", marginBottom: "16px" }}>{f.icon}</div>
                <div style={{ fontSize: "18px", fontWeight: "700", marginBottom: "10px" }}>{f.title}</div>
                <div style={{ fontSize: "14px", color: "#8B8FA8", lineHeight: "1.6" }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="landing-section" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "64px" }}>
            <div style={{ fontSize: "11px", fontWeight: "700", letterSpacing: "0.2em", textTransform: "uppercase", color: "#6C63FF", marginBottom: "16px" }}>How It Works</div>
            <h2 style={{ fontSize: "42px", fontWeight: "800", letterSpacing: "-0.02em" }}>Up and running in minutes</h2>
          </div>
          <div className="landing-steps-grid">
            {[
              { step: "01", title: "Set up your household", desc: "Add your accounts, income sources, and pay schedule. Takes about 5 minutes." },
              { step: "02", title: "Add your bills", desc: "Enter your recurring bills and due dates. Stryde maps them to your pay periods automatically." },
              { step: "03", title: "Know exactly where you stand", desc: "See your available funds, remaining bills, and what's left — every single pay period." },
            ].map((s, i) => (
              <div key={i} style={{ textAlign: "center" }}>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "48px", fontWeight: "700", color: "rgba(108,99,255,0.2)", marginBottom: "16px" }}>{s.step}</div>
                <div style={{ fontSize: "18px", fontWeight: "700", marginBottom: "10px" }}>{s.title}</div>
                <div style={{ fontSize: "14px", color: "#8B8FA8", lineHeight: "1.6" }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="landing-section" style={{ background: "rgba(255,255,255,0.01)", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "64px" }}>
            <div style={{ fontSize: "11px", fontWeight: "700", letterSpacing: "0.2em", textTransform: "uppercase", color: "#6C63FF", marginBottom: "16px" }}>Pricing</div>
            <h2 style={{ fontSize: "42px", fontWeight: "800", letterSpacing: "-0.02em", marginBottom: "16px" }}>Simple, transparent pricing</h2>
            <p style={{ fontSize: "17px", color: "#8B8FA8" }}>Start free. No credit card required.</p>
          </div>
          <div className="landing-pricing-grid">

            {/* Free trial */}
            <div style={{ background: "#161B22", border: "1px solid #30363D", borderRadius: "16px", padding: "36px" }}>
              <div style={{ fontSize: "14px", fontWeight: "600", color: "#8B8FA8", marginBottom: "8px" }}>Free Trial</div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "42px", fontWeight: "700", color: "#F0F6FC", marginBottom: "4px" }}>$0</div>
              <div style={{ fontSize: "13px", color: "#4A4F5C", marginBottom: "28px" }}>14 days, no card needed</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "32px" }}>
                {["Full access to all features", "Up to 2 household members", "Unlimited pay periods"].map((f, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "14px", color: "#8B8FA8" }}>
                    <div style={{ width: "16px", height: "16px", borderRadius: "50%", background: "rgba(0,212,170,0.15)", border: "1px solid rgba(0,212,170,0.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#00D4AA" }} />
                    </div>
                    {f}
                  </div>
                ))}
              </div>
              <button onClick={goToSignUp} style={{ width: "100%", padding: "13px", background: "none", border: "1px solid #30363D", borderRadius: "8px", color: "#F0F6FC", fontSize: "14px", fontWeight: "600", fontFamily: "'Inter', sans-serif", cursor: "pointer" }}>
                Start Free Trial
              </button>
            </div>

            {/* Monthly */}
            <div style={{ background: "#161B22", border: "1px solid #6C63FF", borderRadius: "16px", padding: "36px", position: "relative" }}>
              <div style={{ position: "absolute", top: "-12px", left: "50%", transform: "translateX(-50%)", fontSize: "10px", fontWeight: "700", letterSpacing: "0.1em", textTransform: "uppercase", color: "#13111F", background: "linear-gradient(135deg, #6C63FF, #948cf2)", borderRadius: "20px", padding: "4px 14px" }}>
                Most Popular
              </div>
              <div style={{ fontSize: "14px", fontWeight: "600", color: "#8B8FA8", marginBottom: "8px" }}>Monthly</div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "42px", fontWeight: "700", color: "#F0F6FC", marginBottom: "4px" }}>$9.99<span style={{ fontSize: "18px", color: "#8B8FA8" }}>/mo</span></div>
              <div style={{ fontSize: "13px", color: "#4A4F5C", marginBottom: "28px" }}>Billed monthly, cancel anytime</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "32px" }}>
                {["Everything in free trial", "Unlimited household members", "Real-time bank balances (Plaid)", "AI financial advisor", "Priority support"].map((f, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "14px", color: "#8B8FA8" }}>
                    <div style={{ width: "16px", height: "16px", borderRadius: "50%", background: "rgba(108,99,255,0.15)", border: "1px solid rgba(108,99,255,0.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#6C63FF" }} />
                    </div>
                    {f}
                  </div>
                ))}
              </div>
              <button onClick={goToSignUp} style={{ width: "100%", padding: "13px", background: "linear-gradient(135deg, #6C63FF, #948cf2)", border: "none", borderRadius: "8px", color: "#13111F", fontSize: "14px", fontWeight: "700", fontFamily: "'Inter', sans-serif", cursor: "pointer" }}>
                Get Started
              </button>
            </div>

            {/* Military */}
            <div style={{ background: "#161B22", border: "1px solid #30363D", borderRadius: "16px", padding: "36px" }}>
              <div style={{ fontSize: "14px", fontWeight: "600", color: "#8B8FA8", marginBottom: "8px" }}>Military & First Responders</div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "42px", fontWeight: "700", color: "#F0F6FC", marginBottom: "4px" }}>$7.99<span style={{ fontSize: "18px", color: "#8B8FA8" }}>/mo</span></div>
              <div style={{ fontSize: "13px", color: "#4A4F5C", marginBottom: "28px" }}>Verified via ID.me or Login.gov</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "32px" }}>
                {["Everything in Monthly plan", "20% lifetime discount", "Military, police, fire & EMS eligible", "Verification required"].map((f, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "14px", color: "#8B8FA8" }}>
                    <div style={{ width: "16px", height: "16px", borderRadius: "50%", background: "rgba(0,212,170,0.15)", border: "1px solid rgba(0,212,170,0.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#00D4AA" }} />
                    </div>
                    {f}
                  </div>
                ))}
              </div>
              <button onClick={goToSignUp} style={{ width: "100%", padding: "13px", background: "none", border: "1px solid #30363D", borderRadius: "8px", color: "#F0F6FC", fontSize: "14px", fontWeight: "600", fontFamily: "'Inter', sans-serif", cursor: "pointer" }}>
                Verify & Get Discount
              </button>
            </div>

          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="landing-cta-section" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
        <h2>
          Ready to stop hoping?
        </h2>
        <p style={{ fontSize: "18px", color: "#8B8FA8", marginBottom: "40px" }}>
          Join households already planning ahead with Stryde.
        </p>
        <button
          onClick={goToSignUp}
          style={{ fontSize: "16px", fontWeight: "700", color: "#13111F", background: "linear-gradient(135deg, #6C63FF, #948cf2)", border: "none", borderRadius: "10px", padding: "16px 40px", cursor: "pointer", fontFamily: "'Inter', sans-serif" }}
        >
          Start Free Trial
        </button>
        <p style={{ fontSize: "12px", color: "#4A4F5C", marginTop: "16px" }}>No credit card required · 14-day free trial · Cancel anytime</p>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div style={{ fontSize: "18px", fontWeight: "900", letterSpacing: "0.12em", textTransform: "uppercase" }}>Stryde</div>
        <div style={{ fontSize: "12px", color: "#4A4F5C" }}>© 2026 Stryde Financial LLC. All rights reserved.</div>
        <div style={{ display: "flex", gap: "16px" }}>
          <a href="/privacy" style={{ fontSize: "12px", color: "#4A4F5C", textDecoration: "none" }}>Privacy Policy</a>
          <a href="/terms" style={{ fontSize: "12px", color: "#4A4F5C", textDecoration: "none" }}>Terms of Service</a>
        </div>
      </footer>

    </div>
  );
}

export default Landing;
