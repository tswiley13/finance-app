import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import "./Landing.css";

// ── Demo data (fictional — no real user info) ─────────────────────────────────
const D_INCOME_AMT   = 3100.00;
const D_AVAIL_BEFORE = 1924.50;                    // before income deposited
const D_AVAIL_AFTER  = D_AVAIL_BEFORE + D_INCOME_AMT; // 5024.50

const D_BILLS = [
  { name: "City Gas & Electric", sub: "Due the 15th",  amount: 112  },
  { name: "Car Insurance",       sub: "Due the 16th",  amount: 189  },
  { name: "Phone",               sub: "Due the 18th",  amount: 85   },
  { name: "Netflix",             sub: "Due the 22nd",  amount: 22   },
  { name: "Gym Membership",      sub: "Due the 1st",   amount: 49   },
];
const D_BILLS_TOTAL = D_BILLS.reduce((s, b) => s + b.amount, 0); // 457

const D_FUTURE = [
  { dates: "Jun 18 — Jul 1",  inc: "Payroll (Jun 18) · Side Income (Jul 1)", end: 4218.75 },
  { dates: "Jul 2 — Jul 15",  inc: "Payroll (Jul 2)",                         end: 4876.20 },
  { dates: "Jul 16 — Jul 29", inc: "Payroll (Jul 16)",                        end: 6340.00 },
];

const D_ACCOUNTS = [
  { name: "Everyday Spending",  bank: "Chase", last4: "4821", bal: 1312.40, primary: false, accum: false },
  { name: "Mortgage Escrow",    bank: "Chase", last4: "3307", bal: 28.00,   primary: false, accum: true  },
  { name: "Emergency Fund",     bank: "Chase", last4: "7714", bal: 500.00,  primary: false, accum: false },
  { name: "Bills Account",      bank: "Chase", last4: "6052", bal: 512.00,  primary: false, accum: false },
  { name: "Main Checking",      bank: "Chase", last4: "1193", bal: D_AVAIL_AFTER, primary: true, accum: false },
];

const D_MONTHLY_INCOME = 6200;
const D_MONTHLY_GROUPS = [
  {
    label: "Every Paycheck",
    bills: [
      { name: "Groceries",       amount: 700, note: "$350 × 2 paychecks" },
      { name: "Gas & Transport", amount: 160, note: "$80 × 2 paychecks"  },
    ],
  },
  {
    label: "Due 1st – 15th",
    bills: [
      { name: "Gym Membership",      amount: 49,  note: "Due the 1st"  },
      { name: "City Gas & Electric", amount: 112, note: "Due the 15th" },
    ],
  },
  {
    label: "Due 16th – 31st",
    bills: [
      { name: "Car Insurance", amount: 189, note: "Due the 16th", isWhatIfTarget: true },
      { name: "Phone",         amount: 85,  note: "Due the 18th" },
      { name: "Netflix",       amount: 22,  note: "Due the 22nd" },
    ],
  },
];
const D_MONTHLY_BILLS_TOTAL = D_MONTHLY_GROUPS.flatMap(g => g.bills).reduce((s, b) => s + b.amount, 0);
const D_WHATIF_SAVINGS = 189;

const PHASES = [
  { dur: 6000, title: "Your full financial picture",         caption: "Accounts synced, every pay period mapped out — income, bills, and end balance all in one view." },
  { dur: 5500, title: "Got paid early? Mark it in one tap.", caption: "Available Now updates instantly the moment you confirm. No manual math." },
  { dur: 4500, title: "Pay a bill, check it off.",           caption: "Each bill is locked to its pay period. Nothing bleeds into other periods." },
  { dur: 4500, title: "Bills shrink as you pay them.",       caption: "End Balance updates in real time. You always know exactly what's left." },
  { dur: 5500, title: "See your full monthly picture.",      caption: "Monthly Overview shows total income, every bill, and what you keep — all at a glance." },
  { dur: 5000, title: "Bills grouped by when they're due.",  caption: "Every Paycheck, Due 1st–15th, Due 16th–31st. Organized the way you actually think about money." },
  { dur: 5500, title: "What if you cut a bill?",             caption: "Toggle any bill off in What-If mode. See the monthly and annual impact instantly — no commitment." },
  { dur: 6000, title: "That's Stryde.",                      caption: "Total control. Zero surprises. This is what financial confidence feels like." },
];

function fmt(n) {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ── Full dashboard mockup ─────────────────────────────────────────────────────
function DashboardPreview() {
  const [phase, setPhase] = useState(0);
  const wrapRef  = useRef(null);
  const innerRef = useRef(null);
  const [scale, setScale] = useState(1);
  const [innerH, setInnerH] = useState(0);
  const DESIGN_W = 1240;

  useEffect(() => {
    function update() {
      if (!wrapRef.current || !innerRef.current) return;
      setScale(Math.min(1, wrapRef.current.offsetWidth / DESIGN_W));
      setInnerH(innerRef.current.offsetHeight);
    }
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => {
    const t = setTimeout(
      () => setPhase(p => (p >= PHASES.length - 1 ? 0 : p + 1)),
      PHASES[phase].dur
    );
    return () => clearTimeout(t);
  }, [phase]);

  // ── Derived state ─────────────────────────────────────────────────────────
  const view           = phase <= 3 ? "dashboard" : "monthly";
  const isWhatIf       = phase >= 6;
  const incomeReceived = phase >= 1;
  const paidCount      = Math.min(2, Math.max(0, phase - 1));
  const paidAmt        = D_BILLS.slice(0, paidCount).reduce((s, b) => s + b.amount, 0);
  const billsRemaining = D_BILLS_TOTAL - paidAmt;
  const availNow       = incomeReceived ? D_AVAIL_AFTER : D_AVAIL_BEFORE;
  const periodEndBal   = availNow - billsRemaining;

  const monthlyBillsTotal = isWhatIf ? D_MONTHLY_BILLS_TOTAL - D_WHATIF_SAVINGS : D_MONTHLY_BILLS_TOTAL;
  const monthlyRemaining  = D_MONTHLY_INCOME - monthlyBillsTotal;
  const annualProjection  = monthlyRemaining * 12;

  // ── Style helpers ─────────────────────────────────────────────────────────
  const BD   = "1px solid rgba(255,255,255,0.06)";
  const BDS  = "1px solid rgba(255,255,255,0.04)";
  const panel = (extra = {}) => ({ background: "#1A1826", border: BD, borderRadius: "12px", padding: "20px", ...extra });
  const navLabel = { fontSize: "9px", color: "#5C6080", letterSpacing: "0.15em", textTransform: "uppercase", padding: "0 8px", margin: "18px 0 4px", fontWeight: "600" };
  const navItem  = (active) => ({ display: "flex", alignItems: "center", gap: "10px", padding: "8px 10px", borderRadius: "7px", fontSize: "13px", color: active ? "#6C63FF" : "#8B8FA8", fontWeight: active ? "600" : "400", background: active ? "rgba(108,99,255,0.15)" : "transparent", margin: "1px 0" });

  const NAV_MAIN = [
    { label: "Dashboard",        icon: "▦", active: view === "dashboard" },
    { label: "Monthly Overview", icon: "≋", active: view === "monthly"   },
    { label: "Bills",            icon: "≡", active: false },
    { label: "Income",           icon: "◈", active: false },
    { label: "Accounts",         icon: "⬡", active: false },
  ];

  return (
    <section style={{ padding: "80px 20px", background: "#08070F" }}>
      <style>{`
        @keyframes rowGlow      { 0%{background:rgba(108,99,255,0.28)} 100%{background:rgba(108,99,255,0.08)} }
        @keyframes rowGlowGreen { 0%{background:rgba(74,222,128,0.22)} 100%{background:rgba(74,222,128,0.06)} }
        @keyframes rowGlowAmber { 0%{background:rgba(251,191,36,0.25)} 100%{background:rgba(251,191,36,0.07)} }
        @keyframes tileFlash    { 0%{background:rgba(108,99,255,0.35);border-color:rgba(108,99,255,0.6)}  100%{background:#1A1826;border-color:rgba(255,255,255,0.06)} }
        @keyframes tileGreen    { 0%{background:rgba(74,222,128,0.25);border-color:rgba(74,222,128,0.5)}  100%{background:#1A1826;border-color:rgba(255,255,255,0.06)} }
        @keyframes tileAmber    { 0%{background:rgba(251,191,36,0.3);border-color:rgba(251,191,36,0.6)}   100%{background:#1A1826;border-color:rgba(255,255,255,0.06)} }
        @keyframes captionFade  { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes slideIn      { from{opacity:0;transform:translateX(14px)} to{opacity:1;transform:translateX(0)} }
      `}</style>

      <div style={{ maxWidth: "1280px", margin: "0 auto" }}>

        {/* Section heading */}
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <div style={{ fontSize: "11px", fontWeight: "700", letterSpacing: "0.22em", textTransform: "uppercase", color: "#6C63FF", marginBottom: "14px" }}>See It In Action</div>
          <h2 style={{ fontSize: "44px", fontWeight: "800", letterSpacing: "-0.025em", margin: 0, lineHeight: 1.15 }}>
            Everything you need,<br /><span style={{ color: "#6C63FF" }}>in one view.</span>
          </h2>
        </div>

        {/* Phase title + caption */}
        <div key={phase} style={{ animation: "captionFade 0.45s ease", textAlign: "center", marginBottom: "32px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginBottom: "12px" }}>
            {PHASES.map((_, i) => (
              <div key={i} onClick={() => setPhase(i)} style={{ width: phase === i ? "28px" : "7px", height: "7px", borderRadius: "4px", background: phase === i ? "#6C63FF" : "rgba(255,255,255,0.12)", transition: "all 0.35s ease", cursor: "pointer" }} />
            ))}
          </div>
          <div style={{ fontSize: "22px", fontWeight: "800", color: "#F0F6FC", letterSpacing: "-0.02em", marginBottom: "8px" }}>
            {PHASES[phase].title}
          </div>
          <div style={{ fontSize: "15px", color: "#8B8FA8", lineHeight: 1.6, maxWidth: "560px", margin: "0 auto" }}>
            {PHASES[phase].caption}
          </div>
        </div>

        {/* Browser chrome — scales to fit viewport */}
        <div ref={wrapRef} style={{ overflow: "hidden", borderRadius: "16px", boxShadow: "0 40px 120px rgba(0,0,0,0.75)", height: innerH ? innerH * scale : "auto" }}>
        <div ref={innerRef} style={{ width: `${DESIGN_W}px`, transform: `scale(${scale})`, transformOrigin: "top left" }}>
        <div style={{ background: "#1A1729", border: "1px solid rgba(255,255,255,0.09)", borderRadius: "16px", overflow: "hidden" }}>

          {/* macOS chrome bar */}
          <div style={{ background: "#131122", padding: "11px 16px", display: "flex", alignItems: "center", gap: "8px", borderBottom: BD }}>
            <div style={{ display: "flex", gap: "6px" }}>
              {["#FF5F57","#FEBC2E","#28C840"].map(c => <div key={c} style={{ width: "10px", height: "10px", borderRadius: "50%", background: c }} />)}
            </div>
            <div style={{ flex: 1, background: "rgba(255,255,255,0.05)", borderRadius: "6px", padding: "4px 12px", fontSize: "11px", color: "#4A4F5C", textAlign: "center" }}>
              app.stryde.money
            </div>
          </div>

          {/* App shell */}
          <div style={{ display: "flex", background: "#13111F" }}>

            {/* ── Sidebar ── */}
            <aside style={{ width: "220px", minWidth: "220px", background: "#13111F", borderRight: BD, display: "flex", flexDirection: "column", flexShrink: 0 }}>
              <div style={{ height: "80px", padding: "0 20px", display: "flex", flexDirection: "column", justifyContent: "center", borderBottom: BD }}>
                <div style={{ fontSize: "20px", fontWeight: "800", letterSpacing: "0.06em", color: "#F0F6FC", textTransform: "uppercase" }}>Stryde</div>
                <div style={{ fontSize: "9px", color: "#6C63FF", letterSpacing: "0.18em", textTransform: "uppercase", marginTop: "3px", fontWeight: "500" }}>Stop hoping. Start knowing.</div>
              </div>
              <nav style={{ flex: 1, padding: "0 12px" }}>
                <div style={navLabel}>Main</div>
                {NAV_MAIN.map((item, i) => (
                  <div key={i} style={navItem(item.active)}>
                    <span style={{ fontSize: "12px", opacity: item.active ? 1 : 0.7 }}>{item.icon}</span>
                    {item.label}
                  </div>
                ))}
                <div style={navLabel}>Planning</div>
                {[{ label: "Pay Periods", icon: "📅" }, { label: "Debts", icon: "↗" }].map((item, i) => (
                  <div key={i} style={navItem(false)}>
                    <span style={{ fontSize: "12px", opacity: 0.6 }}>{item.icon}</span>
                    {item.label}
                  </div>
                ))}
              </nav>
              <div style={{ padding: "12px", borderTop: BD }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 10px", fontSize: "13px", color: "#8B8FA8" }}>
                  <span>→</span> Sign Out
                </div>
              </div>
            </aside>

            {/* ── Main content ── */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>

              {/* Topbar */}
              <div style={{ height: "80px", padding: "0 28px", borderBottom: BD, display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "linear-gradient(135deg, #6C63FF, #948cf2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: "700", color: "#0D1117", flexShrink: 0 }}>J</div>
                  <div>
                    <div style={{ fontSize: "18px", fontWeight: "700", color: "#F0F6FC", letterSpacing: "-0.02em" }}>Good afternoon, Jordan</div>
                    <div style={{ fontSize: "11px", color: "#8B8FA8", marginTop: "1px" }}>Wednesday, June 17, 2026</div>
                  </div>
                </div>
                <div style={{ background: "rgba(108,99,255,0.08)", border: "1px solid rgba(108,99,255,0.2)", borderRadius: "10px", padding: "9px 14px", textAlign: "center" }}>
                  <div style={{ fontSize: "9px", color: "#8B8FA8", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: "600" }}>Current Pay Period</div>
                  <div style={{ fontSize: "12px", fontWeight: "600", color: "#F0F6FC", marginTop: "2px" }}>Jun 4 — Jun 17</div>
                </div>
              </div>

              {/* ── View: Dashboard (phases 0–3) ── */}
              {view === "dashboard" && (
                <div style={{ padding: "24px 28px 28px", overflow: "hidden" }}>
                  <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: "22px", margin: "0 0 18px", fontWeight: "700", color: "#F0F6FC" }}>Monthly Projection</h2>

                  {/* 4 stat tiles */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "10px", marginBottom: "20px" }}>
                    {[
                      { label: "Available Now",        val: availNow,                              anim: phase === 1 ? "tileGreen 1.5s ease-out forwards" : "none", color: "#00D4AA" },
                      { label: "Income This Month",    val: incomeReceived ? 0 : D_INCOME_AMT,    anim: phase === 1 ? "tileGreen 1.5s ease-out forwards" : "none", color: "#00D4AA" },
                      { label: "Bills Remaining",      val: billsRemaining,                        anim: phase >= 2 ? "tileFlash 1.5s ease-out forwards" : "none", color: "#F87171" },
                      { label: "Available This Month", val: availNow - billsRemaining,             anim: phase >= 2 ? "tileFlash 1.5s ease-out forwards" : "none", color: "#00D4AA" },
                    ].map((t, i) => (
                      <div key={`dt-${i}-${phase}`} style={{ background: "#1A1826", border: BD, borderRadius: "12px", padding: "18px 20px", position: "relative", overflow: "hidden", animation: t.anim }}>
                        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "1px", background: "linear-gradient(90deg, rgba(0,212,170,0.8), transparent)" }} />
                        <div style={{ fontSize: "9px", color: "#8B8FA8", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: "600", marginBottom: "8px" }}>{t.label}</div>
                        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "24px", fontWeight: "500", color: t.color, lineHeight: 1 }}>${fmt(t.val)}</div>
                      </div>
                    ))}
                  </div>

                  {/* 2-col grid */}
                  <div style={{ display: "grid", gridTemplateColumns: "58% 40%", gap: "12px", alignItems: "start" }}>

                    {/* Left: period cards */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>

                      {/* Current period card */}
                      <div style={{ ...panel({ borderLeft: "3px solid #6C63FF" }) }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px" }}>
                          <div>
                            <div style={{ fontSize: "13px", fontWeight: "600", color: "#F0F6FC", display: "flex", alignItems: "center", gap: "8px" }}>
                              Jun 4 — Jun 17
                              <span style={{ fontSize: "9px", background: "#6C63FF", color: "#fff", padding: "2px 7px", borderRadius: "4px", letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: "700" }}>Current</span>
                            </div>
                            <div style={{ fontSize: "11px", color: "#8B8FA8", marginTop: "2px" }}>Payroll (Jun 4)</div>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontSize: "9px", color: "#8B8FA8", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: "600", marginBottom: "2px" }}>End Balance</div>
                            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "20px", fontWeight: "500", color: "#4ADE80" }}>${fmt(periodEndBal)}</div>
                          </div>
                        </div>

                        {/* Sub-tiles */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "6px", marginBottom: "14px" }}>
                          {[
                            { label: "Start",          val: `$${fmt(D_AVAIL_BEFORE)}`,                              color: "#8B8FA8" },
                            { label: "Pending Income", val: incomeReceived ? "+$0.00" : `+$${fmt(D_INCOME_AMT)}`,   color: "#4ADE80" },
                            { label: "Bills",          val: billsRemaining > 0 ? `-$${fmt(billsRemaining)}` : "—",  color: billsRemaining > 0 ? "#F87171" : "#8B8FA8" },
                          ].map((t, i) => (
                            <div key={i} style={{ background: "rgba(255,255,255,0.03)", borderRadius: "8px", padding: "9px 11px" }}>
                              <div style={{ fontSize: "9px", color: "#8B8FA8", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: "600", marginBottom: "3px" }}>{t.label}</div>
                              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "13px", color: t.color }}>{t.val}</div>
                            </div>
                          ))}
                        </div>

                        {/* Income section */}
                        <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "10px", marginBottom: "10px" }}>
                          <div style={{ fontSize: "9px", color: "#8B8FA8", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: "600", marginBottom: "8px" }}>Income</div>
                          <div key={`inc-${phase}`} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderRadius: "8px", padding: "5px 7px", margin: "-5px -7px", background: phase === 1 ? "rgba(74,222,128,0.1)" : "transparent", outline: phase === 1 ? "2px solid rgba(74,222,128,0.5)" : "none", animation: phase === 1 ? "rowGlowGreen 1.5s ease-out forwards" : "none" }}>
                            <div>
                              <div style={{ fontSize: "13px", fontWeight: "600", color: incomeReceived ? "#4ADE80" : "#F0F6FC", transition: "color 0.5s ease" }}>
                                {incomeReceived ? "✓ Payroll" : "Payroll"}
                              </div>
                              <div style={{ fontSize: "10px", color: "#8B8FA8", marginTop: "1px" }}>{incomeReceived ? "Jun 4 · Received early" : "Jun 4"}</div>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "12px", color: "#4ADE80" }}>+$3,100.00</div>
                              {!incomeReceived
                                ? <div style={{ background: "rgba(108,99,255,0.15)", border: "1px solid rgba(108,99,255,0.35)", color: "#6C63FF", borderRadius: "6px", padding: "3px 10px", fontSize: "10px", fontWeight: "700" }}>Got Paid</div>
                                : <div style={{ fontSize: "10px", color: "#4A5568" }}>Undo</div>
                              }
                            </div>
                          </div>
                        </div>

                        {/* Bills section */}
                        <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "6px" }}>
                          <div style={{ fontSize: "9px", color: "#8B8FA8", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: "600", marginBottom: "4px" }}>Bills</div>
                          {D_BILLS.map((b, i) => {
                            const paid = i < paidCount;
                            const justPaid = i === paidCount - 1 && phase >= 2;
                            return (
                              <div key={`bill-${i}-${phase}`} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 7px", margin: "0 -7px", opacity: paid ? 0.35 : 1, transition: "opacity 0.6s ease", borderBottom: i < D_BILLS.length - 1 ? BDS : "none", borderRadius: "6px", background: justPaid ? "rgba(108,99,255,0.1)" : "transparent", outline: justPaid ? "2px solid rgba(108,99,255,0.55)" : "none", animation: justPaid ? "rowGlow 1.5s ease-out forwards" : "none" }}>
                                <div>
                                  <div style={{ fontSize: "12px", fontWeight: paid ? "400" : "500", color: paid ? "#6B7280" : "#F0F6FC", textDecoration: paid ? "line-through" : "none", transition: "all 0.5s ease" }}>
                                    {paid ? "✓ " : ""}{b.name}
                                  </div>
                                  <div style={{ fontSize: "10px", color: paid ? "#4A4F5C" : "#8B8FA8", marginTop: "1px" }}>{paid ? "Paid this period" : b.sub}</div>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "12px", color: paid ? "#4A4F5C" : "#8B8FA8", textDecoration: paid ? "line-through" : "none" }}>${fmt(b.amount)}</div>
                                  {!paid && (
                                    <div style={{ display: "flex", gap: "3px" }}>
                                      <div style={{ background: "rgba(108,99,255,0.12)", border: "1px solid rgba(108,99,255,0.25)", color: "#6C63FF", borderRadius: "5px", padding: "2px 7px", fontSize: "9px", fontWeight: "600" }}>Paid</div>
                                      <div style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)", color: "#FBBF24", borderRadius: "5px", padding: "2px 7px", fontSize: "9px", fontWeight: "600" }}>Partial</div>
                                      <div style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", color: "#F87171", borderRadius: "5px", padding: "2px 6px", fontSize: "9px", fontWeight: "600" }}>Skip</div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Future period cards */}
                      {D_FUTURE.map((row, i) => (
                        <div key={i} style={{ ...panel({ borderLeft: "3px solid transparent" }) }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div>
                              <div style={{ fontSize: "13px", fontWeight: "600", color: "#F0F6FC" }}>{row.dates}</div>
                              <div style={{ fontSize: "10px", color: "#8B8FA8", marginTop: "2px" }}>{row.inc}</div>
                            </div>
                            <div style={{ textAlign: "right" }}>
                              <div style={{ fontSize: "9px", color: "#8B8FA8", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: "600", marginBottom: "2px" }}>End Balance</div>
                              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "20px", fontWeight: "500", color: "#4ADE80" }}>${fmt(row.end)}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Right: Accounts panel */}
                    <div style={panel()}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                        <div style={{ fontSize: "10px", color: "#8B8FA8", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: "600" }}>Accounts</div>
                        <div style={{ fontSize: "11px", color: "#6C63FF", fontWeight: "600" }}>Synced 10:54 AM</div>
                      </div>
                      {D_ACCOUNTS.map((acct, i) => (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "9px 0", borderBottom: i < D_ACCOUNTS.length - 1 ? BDS : "none" }}>
                          <div>
                            <div style={{ fontSize: "12px", color: "#F0F6FC", fontWeight: "500", display: "flex", alignItems: "center", gap: "5px", flexWrap: "wrap" }}>
                              {acct.name}
                              {acct.primary && <span style={{ fontSize: "8px", background: "rgba(108,99,255,0.15)", border: "1px solid rgba(108,99,255,0.3)", color: "#6C63FF", borderRadius: "4px", padding: "1px 5px", fontWeight: "700", textTransform: "uppercase" }}>Primary</span>}
                              {acct.accum  && <span style={{ fontSize: "8px", background: "rgba(0,212,170,0.1)",   border: "1px solid rgba(0,212,170,0.25)",  color: "#00D4AA", borderRadius: "4px", padding: "1px 5px", fontWeight: "700", textTransform: "uppercase" }}>Accumulating</span>}
                            </div>
                            <div style={{ fontSize: "10px", color: "#8B8FA8", marginTop: "2px" }}>{acct.bank} ···{acct.last4}</div>
                          </div>
                          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "13px", color: "#F0F6FC", fontWeight: "500" }}>${fmt(acct.bal)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ── View: Monthly Overview (phases 4–7) ── */}
              {view === "monthly" && (
                <div key="monthly" style={{ padding: "24px 28px 28px", overflow: "hidden", animation: "slideIn 0.5s ease" }}>

                  {/* Page title + What-If badge */}
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
                    <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: "22px", margin: 0, fontWeight: "700", color: "#F0F6FC" }}>Monthly Overview</h2>
                    {isWhatIf && (
                      <span style={{ fontSize: "9px", fontWeight: "700", letterSpacing: "0.1em", textTransform: "uppercase", color: "#FBBF24", background: "rgba(251,191,36,0.12)", border: "1px solid rgba(251,191,36,0.3)", borderRadius: "20px", padding: "3px 10px" }}>
                        WHAT-IF MODE
                      </span>
                    )}
                  </div>

                  {/* 3 stat tiles */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "10px", marginBottom: "16px" }}>
                    {[
                      { label: "Monthly Income",    val: D_MONTHLY_INCOME,  color: "#00D4AA", anim: phase === 4 ? "tileGreen 1.5s ease-out forwards" : "none",  sub: null },
                      { label: "Monthly Bills",     val: monthlyBillsTotal, color: "#F87171", anim: phase === 4 ? "tileFlash 1.5s ease-out forwards" : isWhatIf ? "tileAmber 1.5s ease-out forwards" : "none", sub: isWhatIf ? "↓ $189 — Car Insurance off" : null },
                      { label: "Monthly Remaining", val: monthlyRemaining,  color: "#00D4AA", anim: phase === 4 ? "tileGreen 1.5s ease-out forwards" : isWhatIf ? "tileGreen 1.5s ease-out forwards" : "none",  sub: isWhatIf ? "↑ $189 freed up" : null },
                    ].map((t, i) => (
                      <div key={`mt-${i}-${phase}`} style={{ background: "#1A1826", border: BD, borderRadius: "12px", padding: "18px 20px", position: "relative", overflow: "hidden", animation: t.anim }}>
                        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "1px", background: "linear-gradient(90deg, rgba(0,212,170,0.8), transparent)" }} />
                        <div style={{ fontSize: "9px", color: "#8B8FA8", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: "600", marginBottom: "8px" }}>{t.label}</div>
                        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "26px", fontWeight: "500", color: t.color, lineHeight: 1, transition: "color 0.5s" }}>${fmt(t.val)}</div>
                        {t.sub && <div style={{ fontSize: "9px", color: i === 1 ? "#FBBF24" : "#4ADE80", marginTop: "5px" }}>{t.sub}</div>}
                      </div>
                    ))}
                  </div>

                  {/* Annual projection strip */}
                  <div style={{ ...panel({ padding: "13px 18px", marginBottom: "14px", display: "flex", justifyContent: "space-between", alignItems: "center" }) }}>
                    <div style={{ fontSize: "12px", color: "#8B8FA8" }}>
                      At this rate, you save{" "}
                      <span style={{ fontFamily: "'DM Mono', monospace", color: "#00D4AA", fontWeight: "600" }}>${fmt(annualProjection)}</span>
                      {" "}this year
                    </div>
                    {isWhatIf && (
                      <div style={{ background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.25)", borderRadius: "8px", padding: "5px 12px", fontSize: "11px", color: "#FBBF24", fontWeight: "600" }}>
                        +${fmt(D_WHATIF_SAVINGS * 12)}/yr with this change
                      </div>
                    )}
                  </div>

                  {/* Bills breakdown — 3 group columns */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "12px" }}>
                    {D_MONTHLY_GROUPS.map((group, gi) => {
                      const groupTotal = group.bills.reduce((s, b) => (isWhatIf && b.isWhatIfTarget ? s : s + b.amount), 0);
                      const highlight  = phase === 5 && gi === 2;
                      return (
                        <div key={gi} style={{ ...panel({ padding: "16px", outline: highlight ? "2px solid rgba(108,99,255,0.55)" : "none", animation: highlight ? "rowGlow 1.5s ease-out forwards" : "none" }) }}>
                          <div style={{ fontSize: "9px", color: isWhatIf ? "#FBBF24" : "#6C63FF", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: "700", marginBottom: "12px" }}>
                            {group.label}
                          </div>
                          {group.bills.map((bill, bi) => {
                            const isOff = isWhatIf && bill.isWhatIfTarget;
                            return (
                              <div key={bi} style={{ marginBottom: "10px", opacity: isOff ? 0.35 : 1, transition: "opacity 0.5s ease" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "7px", marginBottom: "2px" }}>
                                  {isWhatIf && (
                                    <div style={{ width: "13px", height: "13px", borderRadius: "3px", border: isOff ? "1px solid rgba(248,113,113,0.5)" : "1px solid rgba(108,99,255,0.4)", background: isOff ? "transparent" : "rgba(108,99,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                      {!isOff && <span style={{ fontSize: "8px", color: "#6C63FF" }}>✓</span>}
                                    </div>
                                  )}
                                  <div style={{ fontSize: "12px", color: isOff ? "#6B7280" : "#F0F6FC", fontWeight: "500", textDecoration: isOff ? "line-through" : "none", flex: 1 }}>{bill.name}</div>
                                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "11px", color: isOff ? "#4A4F5C" : "#8B8FA8", textDecoration: isOff ? "line-through" : "none" }}>${fmt(bill.amount)}</div>
                                </div>
                                <div style={{ fontSize: "9px", color: "#5C6080", marginLeft: isWhatIf ? "20px" : "0" }}>{bill.note}</div>
                              </div>
                            );
                          })}
                          <div style={{ borderTop: BDS, marginTop: "6px", paddingTop: "8px", display: "flex", justifyContent: "space-between" }}>
                            <div style={{ fontSize: "10px", color: "#8B8FA8", fontWeight: "600" }}>Subtotal</div>
                            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "12px", color: isWhatIf ? "#FBBF24" : "#F0F6FC", fontWeight: "600" }}>${fmt(groupTotal)}/mo</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* What-If delta callout */}
                  {isWhatIf && (
                    <div style={{ marginTop: "14px", background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.25)", borderRadius: "10px", padding: "12px 16px", display: "flex", alignItems: "center", gap: "12px", animation: "rowGlowAmber 1.5s ease-out forwards" }}>
                      <div style={{ fontSize: "20px" }}>💡</div>
                      <div>
                        <div style={{ fontSize: "12px", color: "#FBBF24", fontWeight: "700" }}>Removing Car Insurance saves +$189/mo</div>
                        <div style={{ fontSize: "11px", color: "#8B8FA8", marginTop: "2px" }}>
                          That's{" "}
                          <span style={{ fontFamily: "'DM Mono', monospace", color: "#FBBF24", fontWeight: "600" }}>${fmt(D_WHATIF_SAVINGS * 12)}</span>
                          {" "}back in your pocket this year. Nothing is saved until you make it real.
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>
        </div>
        </div>
        </div>

      </div>
    </section>
  );
}


// ── Landing page ───────────────────────────────────────────────────────────────
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
        <div className="landing-nav-links">
          <a href="#features" style={{ fontSize: "14px", color: "#8B8FA8", textDecoration: "none" }}>Features</a>
          <a href="#pricing" style={{ fontSize: "14px", color: "#8B8FA8", textDecoration: "none" }}>Pricing</a>
          <button onClick={goToSignIn} style={{ fontSize: "14px", color: "#8B8FA8", background: "none", border: "none", cursor: "pointer", fontFamily: "'Inter', sans-serif" }}>Sign In</button>
          <button onClick={goToSignUp} style={{ fontSize: "14px", fontWeight: "700", color: "#13111F", background: "linear-gradient(135deg, #6C63FF, #948cf2)", border: "none", borderRadius: "8px", padding: "10px 20px", cursor: "pointer", fontFamily: "'Inter', sans-serif" }}>Get Started Free</button>
        </div>
        <button className="landing-hamburger" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
          {menuOpen ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#F0F6FC" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          ) : (
            <><span /><span /><span /></>
          )}
        </button>
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
        <h1>Stop hoping.<br /><span style={{ color: "#6C63FF" }}>Start knowing.</span></h1>
        <p>Real financial planning for every household. Know exactly where every dollar is going — before the bills hit.</p>
        <div className="landing-hero-cta">
          <button onClick={goToSignUp} style={{ fontSize: "16px", fontWeight: "700", color: "#13111F", background: "linear-gradient(135deg, #6C63FF, #948cf2)", border: "none", borderRadius: "10px", padding: "16px 36px", cursor: "pointer", fontFamily: "'Inter', sans-serif" }}>
            Start Free Trial
          </button>
          <a href="#demo" style={{ fontSize: "15px", color: "#6E7681", textDecoration: "none", fontWeight: "500" }}>See how it works →</a>
        </div>
        <p style={{ fontSize: "12px", color: "#4A4F5C", marginTop: "20px" }}>No credit card required · 14-day free trial</p>
        <p className="landing-mobile-signin">
          Already have an account?{" "}
          <span onClick={goToSignIn} style={{ color: "#6C63FF", cursor: "pointer", fontWeight: "600" }}>Sign In</span>
        </p>
      </section>

      {/* Dashboard demo */}
      <div id="demo"><DashboardPreview /></div>

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
              { icon: "📅", title: "Pay Period Planning",     desc: "Map every bill, income source, and account to your exact pay schedule. See what's left before each paycheck arrives." },
              { icon: "🏠", title: "Household Sharing",       desc: "Invite your partner or family members to share one household view. Everyone stays on the same page." },
              { icon: "🏦", title: "Real-Time Bank Balances", desc: "Connect your accounts via Plaid and see live balances without logging into your bank." },
              { icon: "🤖", title: "AI Financial Advisor",    desc: "Get personalized budgeting advice and answers to your money questions — powered by AI, built into your dashboard.", badge: "Coming Soon" },
            ].map((f, i) => (
              <div key={i} style={{ background: "#161B22", border: "1px solid #30363D", borderRadius: "16px", padding: "32px", position: "relative" }}>
                {f.badge && <div style={{ position: "absolute", top: "20px", right: "20px", fontSize: "9px", fontWeight: "700", letterSpacing: "0.1em", textTransform: "uppercase", color: "#6C63FF", background: "rgba(108,99,255,0.1)", border: "1px solid rgba(108,99,255,0.2)", borderRadius: "20px", padding: "4px 10px" }}>{f.badge}</div>}
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
              { step: "01", title: "Set up your household",        desc: "Add your accounts, income sources, and pay schedule. Takes about 5 minutes." },
              { step: "02", title: "Add your bills",               desc: "Enter your recurring bills and due dates. Stryde maps them to your pay periods automatically." },
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
            <div style={{ background: "#161B22", border: "1px solid #30363D", borderRadius: "16px", padding: "36px" }}>
              <div style={{ fontSize: "14px", fontWeight: "600", color: "#8B8FA8", marginBottom: "8px" }}>Free Trial</div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "42px", fontWeight: "700", color: "#F0F6FC", marginBottom: "4px" }}>$0</div>
              <div style={{ fontSize: "13px", color: "#4A4F5C", marginBottom: "28px" }}>14 days, no card needed</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "32px" }}>
                {["Full access to all features", "Up to 2 household members", "Unlimited pay periods"].map((f, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "14px", color: "#8B8FA8" }}>
                    <div style={{ width: "16px", height: "16px", borderRadius: "50%", background: "rgba(0,212,170,0.15)", border: "1px solid rgba(0,212,170,0.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><div style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#00D4AA" }} /></div>
                    {f}
                  </div>
                ))}
              </div>
              <button onClick={goToSignUp} style={{ width: "100%", padding: "13px", background: "none", border: "1px solid #30363D", borderRadius: "8px", color: "#F0F6FC", fontSize: "14px", fontWeight: "600", fontFamily: "'Inter', sans-serif", cursor: "pointer" }}>Start Free Trial</button>
            </div>
            <div style={{ background: "#161B22", border: "1px solid #6C63FF", borderRadius: "16px", padding: "36px", position: "relative" }}>
              <div style={{ position: "absolute", top: "-12px", left: "50%", transform: "translateX(-50%)", fontSize: "10px", fontWeight: "700", letterSpacing: "0.1em", textTransform: "uppercase", color: "#13111F", background: "linear-gradient(135deg, #6C63FF, #948cf2)", borderRadius: "20px", padding: "4px 14px" }}>Most Popular</div>
              <div style={{ fontSize: "14px", fontWeight: "600", color: "#8B8FA8", marginBottom: "8px" }}>Monthly</div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "42px", fontWeight: "700", color: "#F0F6FC", marginBottom: "4px" }}>$9.99<span style={{ fontSize: "18px", color: "#8B8FA8" }}>/mo</span></div>
              <div style={{ fontSize: "13px", color: "#4A4F5C", marginBottom: "28px" }}>Billed monthly, cancel anytime</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "32px" }}>
                {["Everything in free trial", "Unlimited household members", "Real-time bank balances (Plaid)", "AI financial advisor", "Priority support"].map((f, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "14px", color: "#8B8FA8" }}>
                    <div style={{ width: "16px", height: "16px", borderRadius: "50%", background: "rgba(108,99,255,0.15)", border: "1px solid rgba(108,99,255,0.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><div style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#6C63FF" }} /></div>
                    {f}
                  </div>
                ))}
              </div>
              <button onClick={goToSignUp} style={{ width: "100%", padding: "13px", background: "linear-gradient(135deg, #6C63FF, #948cf2)", border: "none", borderRadius: "8px", color: "#13111F", fontSize: "14px", fontWeight: "700", fontFamily: "'Inter', sans-serif", cursor: "pointer" }}>Get Started</button>
            </div>
            <div style={{ background: "#161B22", border: "1px solid #30363D", borderRadius: "16px", padding: "36px" }}>
              <div style={{ fontSize: "14px", fontWeight: "600", color: "#8B8FA8", marginBottom: "8px" }}>Military & First Responders</div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "42px", fontWeight: "700", color: "#F0F6FC", marginBottom: "4px" }}>$7.99<span style={{ fontSize: "18px", color: "#8B8FA8" }}>/mo</span></div>
              <div style={{ fontSize: "13px", color: "#4A4F5C", marginBottom: "28px" }}>Verified via ID.me or Login.gov</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "32px" }}>
                {["Everything in Monthly plan", "20% lifetime discount", "Military, police, fire & EMS eligible", "Verification required"].map((f, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "14px", color: "#8B8FA8" }}>
                    <div style={{ width: "16px", height: "16px", borderRadius: "50%", background: "rgba(0,212,170,0.15)", border: "1px solid rgba(0,212,170,0.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><div style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#00D4AA" }} /></div>
                    {f}
                  </div>
                ))}
              </div>
              <button onClick={goToSignUp} style={{ width: "100%", padding: "13px", background: "none", border: "1px solid #30363D", borderRadius: "8px", color: "#F0F6FC", fontSize: "14px", fontWeight: "600", fontFamily: "'Inter', sans-serif", cursor: "pointer" }}>Verify & Get Discount</button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="landing-cta-section" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
        <h2>Ready to stop hoping?</h2>
        <p style={{ fontSize: "18px", color: "#8B8FA8", marginBottom: "40px" }}>Join households already planning ahead with Stryde.</p>
        <button onClick={goToSignUp} style={{ fontSize: "16px", fontWeight: "700", color: "#13111F", background: "linear-gradient(135deg, #6C63FF, #948cf2)", border: "none", borderRadius: "10px", padding: "16px 40px", cursor: "pointer", fontFamily: "'Inter', sans-serif" }}>
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
