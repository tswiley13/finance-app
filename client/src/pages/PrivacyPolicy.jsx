import { Link } from "react-router-dom";

const sections = [
  {
    title: "1. Who We Are",
    body: `Stryde Financial is operated by Stryde Financial LLC ("we," "us," or "our"). We can be reached at traviswiley13@gmail.com.`,
  },
  {
    title: "2. What We Collect",
    body: `• Account information: email address and password (managed by Supabase Auth)\n• Household and financial data you enter: income, bills, accounts, debts, and pay periods\n• Bank account data retrieved via Plaid when you choose to connect a financial institution`,
  },
  {
    title: "3. How We Use Your Data",
    body: `• To provide and operate the Stryde Financial app\n• To display your financial information within your household\n• To sync live account balances via Plaid`,
  },
  {
    title: "4. How We Store Your Data",
    body: `All data is stored in Supabase, a secure cloud database provider. Data is encrypted in transit (TLS 1.2+) and at rest. Access is restricted by row-level security so only members of your household can view your data.`,
  },
  {
    title: "5. Third-Party Services",
    body: `• Supabase — database and authentication (supabase.com/privacy)\n• Plaid — bank account connectivity (plaid.com/legal/privacy-policy)\n• Vercel — app hosting (vercel.com/legal/privacy-policy)\n\nWe do not sell your data to any third party.`,
  },
  {
    title: "6. Data Retention",
    body: `Your data is retained as long as your account is active. You may request deletion of your account and all associated data at any time by emailing traviswiley13@gmail.com.`,
  },
  {
    title: "7. Your Rights",
    body: `You have the right to access, correct, or delete your personal data at any time. To make a request, contact us at traviswiley13@gmail.com.`,
  },
  {
    title: "8. Children",
    body: `Stryde Financial is not intended for users under 18 years of age.`,
  },
  {
    title: "9. Changes",
    body: `We may update this policy from time to time. Continued use of the app after changes constitutes acceptance of the updated policy.`,
  },
  {
    title: "10. Contact",
    body: `traviswiley13@gmail.com`,
  },
];

export default function PrivacyPolicy() {
  return (
    <div style={{ minHeight: "100vh", background: "#13111F", color: "#F0F6FC", fontFamily: "'Inter', sans-serif" }}>
      <div style={{ maxWidth: "760px", margin: "0 auto", padding: "60px 24px" }}>
        <Link to="/" style={{ fontSize: "13px", color: "#6C63FF", textDecoration: "none", display: "inline-block", marginBottom: "32px" }}>← Back</Link>
        <div style={{ fontSize: "11px", color: "#8B8FA8", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>Stryde Financial LLC</div>
        <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: "32px", fontWeight: "700", marginBottom: "8px" }}>Privacy Policy</h1>
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
