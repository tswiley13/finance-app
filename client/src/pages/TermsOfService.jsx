import { Link } from "react-router-dom";

const sections = [
  {
    title: "1. Acceptance",
    body: `By using Stryde Financial, you agree to these Terms of Service. If you do not agree, do not use the app.`,
  },
  {
    title: "2. Description of Service",
    body: `Stryde Financial is a personal household finance tracking tool. It allows users to manually track income, bills, accounts, debts, and pay periods, and optionally connect bank accounts via Plaid to view live balances.`,
  },
  {
    title: "3. Not Financial Advice",
    body: `Stryde Financial is a budgeting tool only. Nothing in the app constitutes financial, legal, investment, or tax advice. Always consult a qualified professional for financial decisions.`,
  },
  {
    title: "4. Your Account",
    body: `You are responsible for maintaining the confidentiality of your account credentials. You are responsible for all activity that occurs under your account.`,
  },
  {
    title: "5. Acceptable Use",
    body: `You agree not to use Stryde Financial to:\n• Violate any applicable law or regulation\n• Attempt to gain unauthorized access to other users' data\n• Reverse engineer or interfere with the app`,
  },
  {
    title: "6. Bank Connectivity",
    body: `When you connect a bank account via Plaid, you authorize Stryde Financial to retrieve balance and transaction data from that institution. You may disconnect at any time through the app settings.`,
  },
  {
    title: "7. Disclaimer of Warranties",
    body: `Stryde Financial is provided "as is" without warranties of any kind. We do not guarantee the accuracy of data retrieved from third-party financial institutions.`,
  },
  {
    title: "8. Limitation of Liability",
    body: `To the fullest extent permitted by law, Stryde Financial LLC shall not be liable for any indirect, incidental, or consequential damages arising from your use of the app.`,
  },
  {
    title: "9. Governing Law",
    body: `These Terms are governed by the laws of the State of Arizona, without regard to conflict of law principles.`,
  },
  {
    title: "10. Changes",
    body: `We reserve the right to modify these Terms at any time. Continued use of the app constitutes acceptance of the revised Terms.`,
  },
  {
    title: "11. Contact",
    body: `traviswiley13@gmail.com`,
  },
];

export default function TermsOfService() {
  return (
    <div style={{ minHeight: "100vh", background: "#13111F", color: "#F0F6FC", fontFamily: "'Inter', sans-serif" }}>
      <div style={{ maxWidth: "760px", margin: "0 auto", padding: "60px 24px" }}>
        <Link to="/" style={{ fontSize: "13px", color: "#6C63FF", textDecoration: "none", display: "inline-block", marginBottom: "32px" }}>← Back</Link>
        <div style={{ fontSize: "11px", color: "#8B8FA8", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>Stryde Financial LLC</div>
        <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: "32px", fontWeight: "700", marginBottom: "8px" }}>Terms of Service</h1>
        <p style={{ fontSize: "13px", color: "#8B8FA8", marginBottom: "48px" }}>Last updated: May 18, 2026</p>

        {sections.map((s, i) => (
          <div key={i} style={{ marginBottom: "32px" }}>
            <h2 style={{ fontSize: "16px", fontWeight: "600", color: "#F0F6FC", marginBottom: "10px" }}>{s.title}</h2>
            <p style={{ fontSize: "14px", color: "#8B8FA8", lineHeight: "1.7", whiteSpace: "pre-line" }}>{s.body}</p>
          </div>
        ))}

        <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "32px", marginTop: "16px", fontSize: "12px", color: "#484F58" }}>
          © 2026 Stryde Financial LLC. All rights reserved.
        </div>
      </div>
    </div>
  );
}
