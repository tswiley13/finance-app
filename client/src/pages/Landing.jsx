import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
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
  { dates: "Jun 18 — Jul 1",   inc: "Payroll (Jun 18) · Side Income (Jul 1)", end: 4218.75 },
  { dates: "Jul 2 — Jul 15",   inc: "Payroll (Jul 2)",                         end: 4876.20 },
  { dates: "Jul 16 — Jul 29",  inc: "Payroll (Jul 16)",                        end: 6340.00 },
  { dates: "Jul 30 — Aug 12",  inc: "Payroll (Jul 30) · Side Income (Aug 1)",  end: 9105.50 },
];

const D_ACCOUNTS = [
  { name: "Everyday Spending",  bank: "Chase", last4: "4821", bal: 1312.40, primary: false, accum: false },
  { name: "Mortgage Escrow",    bank: "Chase", last4: "3307", bal: 28.00,   primary: false, accum: true  },
  { name: "Emergency Fund",     bank: "Chase", last4: "7714", bal: 500.00,  primary: false, accum: false },
  { name: "Bills Account",      bank: "Chase", last4: "6052", bal: 512.00,  primary: false, accum: false },
  { name: "Main Checking",      bank: "Chase", last4: "1193", bal: D_AVAIL_AFTER, primary: true, accum: false },
];

const PHASES = [
  { dur: 4000, caption: "Your complete financial picture — accounts synced, every pay period mapped out ahead of you." },
  { dur: 3200, caption: "Paycheck arrives early? One tap. Income marked received, Available Now updates instantly." },
  { dur: 2400, caption: "Pay a bill, check it off. Locked to this period only — nothing bleeds into other periods." },
  { dur: 2400, caption: "Bills Remaining shrinks in real time. Watch Available This Month climb as you clear them." },
  { dur: 2400, caption: "Every future pay period projects forward automatically. See where you'll stand weeks from now." },
  { dur: 2400, caption: "Every dollar accounted for. Nothing slips through the cracks." },
  { dur: 4500, caption: "That's Stryde. Total control. Zero surprises. This is what financial confidence feels like." },
];

function fmt(n) {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ── Full dashboard mockup ──────────────────────────────────────────────────────
function DashboardPreview() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const t = setTimeout(
      () => setPhase(p => (p >= PHASES.length - 1 ? 0 : p + 1)),
      PHASES[phase].dur
    );
    return () => clearTimeout(t);
  }, [phase]);

  const incomeReceived = phase >= 1;
  const paidCount      = Math.max(0, phase - 1);
  const paidAmt        = D_BILLS.slice(0, paidCount).reduce((s, b) => s + b.amount, 0);
  const billsRemaining = D_BILLS_TOTAL - paidAmt;
  const allPaid        = paidCount >= D_BILLS.length;

  const availNow         = incomeReceived ? D_AVAIL_AFTER : D_AVAIL_BEFORE;
  const incomeThisMonth  = incomeReceived ? 0 : D_INCOME_AMT;
  const availThisMonth   = availNow + incomeThisMonth - billsRemaining;
  const periodEndBalance = availNow - billsRemaining; // start + 0 pending income - unpaid bills

  // Shared inline style helpers matching real CSS classes
  const panel  = (extra = {}) => ({ background: "#1A1826", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "12px", padding: "20px", ...extra });
  const D      = "1px solid rgba(255,255,255,0.06)";
  const DBORD  = "1px solid rgba(255,255,255,0.04)";

  const navLabel = { fontSize: "9px", color: "#5C6080", letterSpacing: "0.15em", textTransform: "uppercase", padding: "0 8px", margin: "18px 0 4px", fontWeight: "600" };
  const navItem  = (active) => ({ display: "flex", alignItems: "center", gap: "10px", padding: "8px 10px", borderRadius: "7px", fontSize: "13px", color: active ? "#6C63FF" : "#8B8FA8", fontWeight: active ? "500" : "400", background: active ? "rgba(108,99,255,0.15)" : "transparent", margin: "1px 0", cursor: "pointer" });

  return (
    <section style={{ padding: "80px 20px", background: "#08070F" }}>
      <div style={{ maxWidth: "1280px", margin: "0 auto" }}>

        {/* Heading */}
        <div style={{ textAlign: "center", marginBottom: "52px" }}>
          <div style={{ fontSize: "11px", fontWeight: "700", letterSpacing: "0.22em", textTransform: "uppercase", color: "#6C63FF", marginBottom: "14px" }}>See It In Action</div>
          <h2 style={{ fontSize: "44px", fontWeight: "800", letterSpacing: "-0.025em", margin: 0, lineHeight: 1.15 }}>
            Everything you need,<br /><span style={{ color: "#6C63FF" }}>in one view.</span>
          </h2>
        </div>

        {/* Browser chrome wrapper */}
        <div style={{ background: "#1A1729", border: "1px solid rgba(255,255,255,0.09)", borderRadius: "16px", overflow: "hidden", boxShadow: "0 40px 120px rgba(0,0,0,0.75)" }}>
          <div style={{ background: "#131122", padding: "11px 16px", display: "flex", alignItems: "center", gap: "8px", borderBottom: D }}>
            <div style={{ display: "flex", gap: "6px" }}>
              {["#FF5F57","#FEBC2E","#28C840"].map(c => <div key={c} style={{ width: "10px", height: "10px", borderRadius: "50%", background: c }} />)}
            </div>
            <div style={{ flex: 1, background: "rgba(255,255,255,0.05)", borderRadius: "6px", padding: "4px 12px", fontSize: "11px", color: "#4A4F5C", textAlign: "center" }}>
              app.stryde.money
            </div>
          </div>

          {/* ── App shell ── */}
          <div style={{ display: "flex", background: "#13111F" }}>

            {/* ── Sidebar (matches real: 260px, bg #13111F) ── */}
            <aside style={{ width: "230px", minWidth: "230px", background: "#13111F", borderRight: D, display: "flex", flexDirection: "column", flexShrink: 0 }}>

              {/* Logo — height 88px, padding 0 20px */}
              <div style={{ height: "88px", padding: "0 20px", display: "flex", flexDirection: "column", justifyContent: "center", borderBottom: D, flexShrink: 0 }}>
                <div style={{ fontSize: "22px", fontWeight: "800", letterSpacing: "0.06em", color: "#F0F6FC", textTransform: "uppercase" }}>Stryde</div>
                <div style={{ fontSize: "10px", color: "#6C63FF", letterSpacing: "0.18em", textTransform: "uppercase", marginTop: "3px", fontWeight: "500" }}>Stop hoping. Start knowing.</div>
              </div>

              {/* Nav */}
              <nav style={{ flex: 1, padding: "0 12px" }}>
                <div style={navLabel}>Main</div>
                {[
                  { label: "Dashboard",  active: true  },
                  { label: "Bills",      active: false },
                  { label: "Income",     active: false },
                  { label: "Accounts",   active: false },
                  { label: "Categories", active: false },
                ].map((item, i) => (
                  <div key={i} style={navItem(item.active)}>
                    <span style={{ fontSize: "13px", opacity: 0.8 }}>
                      {["▦","≡","◈","⬡","◎"][i]}
                    </span>
                    {item.label}
                  </div>
                ))}
                <div style={navLabel}>Planning</div>
                {[{ label: "Pay Periods" }, { label: "Debts" }].map((item, i) => (
                  <div key={i} style={navItem(false)}>
                    <span style={{ fontSize: "13px", opacity: 0.6 }}>{["📅","↗"][i]}</span>
                    {item.label}
                  </div>
                ))}
                <div style={navLabel}>Account</div>
                {[{ label: "Invite Member" }, { label: "Settings" }].map((item, i) => (
                  <div key={i} style={navItem(false)}>
                    <span style={{ fontSize: "13px", opacity: 0.6 }}>{["👤","⚙"][i]}</span>
                    {item.label}
                  </div>
                ))}
              </nav>

              {/* Footer — Sign Out */}
              <div style={{ padding: "12px", borderTop: D, flexShrink: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 10px", fontSize: "13px", color: "#8B8FA8", cursor: "pointer" }}>
                  <span style={{ fontSize: "13px" }}>→</span> Sign Out
                </div>
              </div>
            </aside>

            {/* ── Main ── */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>

              {/* Topbar — height 88px */}
              <div style={{ height: "88px", padding: "0 32px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                  <div style={{ width: "38px", height: "38px", borderRadius: "50%", background: "linear-gradient(135deg, #6C63FF, #948cf2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: "700", color: "#0D1117", flexShrink: 0 }}>T</div>
                  <div>
                    <div style={{ fontSize: "20px", fontWeight: "700", color: "#F0F6FC", letterSpacing: "-0.02em" }}>Good afternoon, Jordan</div>
                    <div style={{ fontSize: "12px", color: "#8B8FA8", marginTop: "1px" }}>Wednesday, June 17, 2026</div>
                  </div>
                </div>
                <div style={{ background: "rgba(108,99,255,0.08)", border: "1px solid rgba(108,99,255,0.2)", borderRadius: "10px", padding: "10px 16px", textAlign: "center" }}>
                  <div style={{ fontSize: "9px", color: "#8B8FA8", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: "600" }}>Current Pay Period</div>
                  <div style={{ fontSize: "13px", fontWeight: "600", color: "#F0F6FC", marginTop: "3px" }}>Jun 4 — Jun 17</div>
                </div>
              </div>

              {/* Content area — padding 28px 32px */}
              <div style={{ padding: "28px 32px 32px", overflow: "hidden" }}>

                {/* Monthly Projection heading */}
                <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: "24px", margin: "0 0 20px", fontWeight: "700", color: "#F0F6FC" }}>Monthly Projection</h2>

                {/* stat-row-4 */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "12px", marginBottom: "28px" }}>
                  {[
                    { label: "Available Now",        val: availNow,        neg: false },
                    { label: "Income This Month",    val: incomeThisMonth, neg: false },
                    { label: "Bills Remaining",      val: billsRemaining,  neg: true  },
                    { label: "Available This Month", val: availThisMonth,  neg: false },
                  ].map((t, i) => (
                    <div key={i} style={{ background: "#1A1826", border: D, borderRadius: "12px", padding: "20px 22px", position: "relative", overflow: "hidden" }}>
                      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "1px", background: "linear-gradient(90deg, rgba(0,212,170,0.8), transparent)" }} />
                      <div style={{ fontSize: "10px", color: "#8B8FA8", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: "600", marginBottom: "10px" }}>{t.label}</div>
                      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "26px", fontWeight: "500", color: t.neg ? "#F87171" : "#00D4AA", lineHeight: 1, transition: "color 0.5s ease" }}>
                        ${fmt(t.val)}
                      </div>
                    </div>
                  ))}
                </div>

                {/* dashboard-grid: 58% / 40% */}
                <div style={{ display: "grid", gridTemplateColumns: "58% 40%", gap: "12px", alignItems: "start" }}>

                  {/* ── Left: period cards ── */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>

                    {/* Current period — EXPANDED + ANIMATED */}
                    <div style={{ ...panel({ borderLeft: "3px solid #6C63FF", boxShadow: allPaid ? "0 0 30px rgba(74,222,128,0.07)" : "none", transition: "box-shadow 0.8s ease" }) }}>

                      {/* Card header */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                        <div>
                          <div style={{ fontSize: "14px", fontWeight: "600", color: "#F0F6FC", display: "flex", alignItems: "center", gap: "8px" }}>
                            Jun 4 — Jun 17
                            <span style={{ fontSize: "9px", background: "#6C63FF", color: "#fff", padding: "2px 8px", borderRadius: "4px", letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: "700" }}>Current</span>
                          </div>
                          <div style={{ fontSize: "11px", color: "#8B8FA8", marginTop: "3px" }}>Payroll (Jun 4)</div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontSize: "9px", color: "#8B8FA8", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: "600", marginBottom: "3px" }}>End Balance</div>
                            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "22px", fontWeight: "500", color: "#4ADE80", filter: allPaid ? "drop-shadow(0 0 10px rgba(74,222,128,0.6))" : "none", transition: "filter 0.8s ease" }}>
                              ${fmt(periodEndBalance)}
                            </div>
                          </div>
                          <span style={{ fontSize: "12px", color: "#6E7681" }}>▲</span>
                        </div>
                      </div>

                      {/* 3 sub-tiles: Start | Pending Income | Bills */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", marginBottom: "16px" }}>
                        {[
                          { label: "Start",          val: `$${fmt(D_AVAIL_BEFORE)}`,                                                  color: "#8B8FA8" },
                          { label: "Pending Income", val: incomeReceived ? "+$0.00" : `+$${fmt(D_INCOME_AMT)}`,                       color: "#4ADE80" },
                          { label: "Bills",          val: billsRemaining > 0 ? `$${fmt(billsRemaining)}` : "—",                       color: billsRemaining > 0 ? "#F87171" : "#8B8FA8" },
                        ].map((t, i) => (
                          <div key={i} style={{ background: "rgba(255,255,255,0.03)", borderRadius: "8px", padding: "10px 12px" }}>
                            <div style={{ fontSize: "9px", color: "#8B8FA8", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: "600", marginBottom: "4px" }}>{t.label}</div>
                            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "14px", color: t.color, transition: "color 0.5s ease" }}>{t.val}</div>
                          </div>
                        ))}
                      </div>

                      {/* Income section */}
                      <div style={{ marginTop: "12px", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "12px" }}>
                        <div style={{ fontSize: "9px", color: "#8B8FA8", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: "600", marginBottom: "10px" }}>Income</div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div>
                            <div style={{ fontSize: "13px", fontWeight: "600", color: incomeReceived ? "#4ADE80" : "#F0F6FC", transition: "color 0.5s ease" }}>
                              {incomeReceived ? "✓ Payroll" : "Payroll"}
                            </div>
                            <div style={{ fontSize: "10px", color: "#8B8FA8", marginTop: "2px" }}>
                              {incomeReceived ? "Jun 4 · Received early" : "Jun 4"}
                            </div>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "13px", color: "#4ADE80" }}>+$2,977.00</div>
                            {!incomeReceived ? (
                              <div style={{ background: "rgba(108,99,255,0.15)", border: "1px solid rgba(108,99,255,0.35)", color: "#6C63FF", borderRadius: "6px", padding: "4px 12px", fontSize: "11px", fontWeight: "700", letterSpacing: "0.04em" }}>
                                Got Paid
                              </div>
                            ) : (
                              <div style={{ fontSize: "11px", color: "#4A5568" }}>Undo</div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Bills section */}
                      <div style={{ marginTop: "12px", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "4px" }}>
                        {D_BILLS.map((b, i) => {
                          const paid = i < paidCount;
                          return (
                            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", opacity: paid ? 0.38 : 1, transition: "opacity 0.6s ease", borderBottom: i < D_BILLS.length - 1 ? DBORD : "none" }}>
                              <div>
                                <div style={{ fontSize: "13px", fontWeight: paid ? "400" : "500", color: paid ? "#8B8FA8" : "#F0F6FC", textDecoration: paid ? "line-through" : "none", transition: "all 0.5s ease" }}>
                                  {b.name}
                                </div>
                                <div style={{ fontSize: "10px", color: paid ? "#4A4F5C" : "#8B8FA8", marginTop: "1px" }}>{paid ? "Paid" : b.sub}</div>
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "13px", color: "#8B8FA8", textDecoration: paid ? "line-through" : "none", transition: "all 0.5s ease" }}>${fmt(b.amount)}</div>
                                {paid ? (
                                  <div style={{ fontSize: "11px", color: "#4A5568" }}>Undo</div>
                                ) : (
                                  <div style={{ display: "flex", gap: "4px" }}>
                                    <div style={{ background: "rgba(108,99,255,0.12)", border: "1px solid rgba(108,99,255,0.25)", color: "#6C63FF", borderRadius: "5px", padding: "3px 9px", fontSize: "10px", fontWeight: "600" }}>Paid</div>
                                    <div style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)", color: "#FBBF24", borderRadius: "5px", padding: "3px 8px", fontSize: "10px", fontWeight: "600" }}>Partial</div>
                                    <div style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", color: "#F87171", borderRadius: "5px", padding: "3px 7px", fontSize: "10px", fontWeight: "600" }}>✕</div>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Future period rows — collapsed */}
                    {D_FUTURE.map((row, i) => (
                      <div key={i} style={{ ...panel({ borderLeft: "3px solid transparent" }) }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <div>
                            <div style={{ fontSize: "14px", fontWeight: "600", color: "#F0F6FC" }}>{row.dates}</div>
                            <div style={{ fontSize: "11px", color: "#8B8FA8", marginTop: "3px" }}>{row.inc}</div>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            <div style={{ textAlign: "right" }}>
                              <div style={{ fontSize: "9px", color: "#8B8FA8", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: "600", marginBottom: "3px" }}>End Balance</div>
                              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "22px", fontWeight: "500", color: "#4ADE80" }}>${fmt(row.end)}</div>
                            </div>
                            <span style={{ fontSize: "12px", color: "#6E7681" }}>▼</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* ── Right: Accounts + WTMG ── */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>

                    {/* Accounts panel */}
                    <div style={panel()}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                        <div style={{ fontSize: "11px", color: "#8B8FA8", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: "600" }}>Accounts</div>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <div style={{ fontSize: "12px", color: "#6C63FF", fontWeight: "600" }}>Synced 10:54 AM</div>
                          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "11px", color: "#8B8FA8" }}>6 total</div>
                        </div>
                      </div>
                      {D_ACCOUNTS.map((acct, i) => (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "10px 0", borderBottom: i < D_ACCOUNTS.length - 1 ? DBORD : "none" }}>
                          <div>
                            <div style={{ fontSize: "13px", color: "#F0F6FC", fontWeight: "500", display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                              {acct.name}
                              {acct.primary && <span style={{ fontSize: "8px", background: "rgba(108,99,255,0.15)", border: "1px solid rgba(108,99,255,0.3)", color: "#6C63FF", borderRadius: "4px", padding: "1px 6px", fontWeight: "700", letterSpacing: "0.06em", textTransform: "uppercase" }}>Primary</span>}
                              {acct.accum && <span style={{ fontSize: "8px", background: "rgba(0,212,170,0.1)", border: "1px solid rgba(0,212,170,0.25)", color: "#00D4AA", borderRadius: "4px", padding: "1px 6px", fontWeight: "700", letterSpacing: "0.06em", textTransform: "uppercase" }}>Accumulating</span>}
                            </div>
                            <div style={{ fontSize: "11px", color: "#8B8FA8", marginTop: "2px" }}>{acct.bank} ···{acct.last4}</div>
                          </div>
                          <div style={{ textAlign: "right", flexShrink: 0 }}>
                            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "14px", color: "#F0F6FC", fontWeight: "500" }}>${fmt(acct.bal)}</div>
                            <div style={{ fontSize: "10px", color: "#6C63FF", marginTop: "2px" }}>via Plaid</div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* WHERE THE MONEY GOES */}
                    <div style={panel()}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                        <div style={{ fontSize: "11px", color: "#8B8FA8", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: "600" }}>Where the Money Goes</div>
                        <div style={{ fontSize: "11px", color: "#8B8FA8" }}>This pay period</div>
                      </div>
                      <div style={{ fontSize: "9px", color: "#8B8FA8", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: "600", marginBottom: "10px" }}>Bills</div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: DBORD }}>
                        <div style={{ fontSize: "13px", color: "#4ADE80" }}>✓ Transfer to Bills Account</div>
                        <div style={{ fontSize: "11px", color: "#4A5568" }}>Undo</div>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0" }}>
                        <div style={{ fontSize: "13px", color: "#F0F6FC" }}>City Gas & Electric</div>
                        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "13px", color: "#8B8FA8" }}>$45.00</div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Caption + dots */}
        <div style={{ textAlign: "center", marginTop: "40px" }}>
          <p style={{ fontSize: "17px", color: "#8B8FA8", margin: "0 0 22px", minHeight: "26px", lineHeight: 1.55, maxWidth: "660px", marginLeft: "auto", marginRight: "auto" }}>
            {PHASES[phase].caption}
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: "6px" }}>
            {PHASES.map((_, i) => (
              <div key={i} style={{ width: phase === i ? "24px" : "6px", height: "6px", borderRadius: "3px", background: phase === i ? "#6C63FF" : "rgba(255,255,255,0.1)", transition: "all 0.4s ease" }} />
            ))}
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
