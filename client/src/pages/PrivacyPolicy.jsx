import { Link } from "react-router-dom";

// NOTE: Drafted to the Desert Iron shared privacy standard and matched to the
// current Stryde codebase. Pending attorney review (the GLBA / FTC Safeguards
// applicability question in particular).
const sections = [
  {
    title: "1. Who We Are",
    body: `Stryde ("Stryde," "the app") is operated by Desert Iron Technologies, LLC, an Arizona limited liability company ("Desert Iron," "we," "us," or "our"). Stryde is a brand of Desert Iron Technologies, LLC. This Privacy Policy explains what we collect, why, and the choices you have.\n\nContact: hello@desertirontech.com\nMailing address: 12352 N 144th Dr, Surprise, AZ 85379`,
  },
  {
    title: "2. Information We Collect",
    body: `We collect only what the app needs to work:\n\n• Account information — your email address and password when you sign up. If you use "Continue with Google" or "Continue with Apple," we receive your name and email address from that provider to create your account. Passwords are handled by our authentication provider; we never see your Google or Apple password.\n• Financial information you enter — income, bills, accounts, debts, categories, pay periods, budgets, and any "what-if" scenarios you create.\n• Household information — if you invite others to your household, we store the names and email addresses you provide for those members so they can be invited and share the household view.\n• Bank account information via Plaid — if you choose to connect a financial institution, Plaid provides us account balances, account and institution names, and related account details so the app can display live balances. Connecting a bank is optional.\n• Technical information — basic device and app information and, on mobile, data stored locally on your device for the app to function (for example, your saved session). We do not use advertising trackers.`,
  },
  {
    title: "3. How We Use Your Information",
    body: `• To provide, operate, and maintain the Stryde app\n• To create and secure your account\n• To display your financial information to you and the members of your household\n• To retrieve and sync account balances when you connect a bank through Plaid\n• To respond to your support requests\n• To comply with legal obligations and protect against fraud or misuse`,
  },
  {
    title: "4. Service Providers We Share Data With",
    body: `We share data only with the processors that run the service. We do not share your information with advertisers.\n\n• Supabase — database, authentication, and storage (supabase.com/privacy)\n• Plaid — bank account connectivity, only if you connect a bank (plaid.com/legal/#privacy-policy)\n• Vercel — web app hosting (vercel.com/legal/privacy-policy)\n• Google Fonts — serves fonts for the web app; Google may receive your IP address when fonts load (policies.google.com/privacy)\n• Google and Apple — only if you choose their sign-in to authenticate you\n• Expo — on the mobile app, supports app delivery and updates (expo.dev/privacy)\n\nWe may also disclose information if required by law or to protect our rights, users, or the public.`,
  },
  {
    title: "5. We Do Not Sell Your Personal Information",
    body: `We do not sell your personal information, and we do not share it for cross-context behavioral ("targeted") advertising, as those terms are defined under the California Consumer Privacy Act and similar state laws.`,
  },
  {
    title: "6. Sensitive Information",
    body: `Stryde handles financial account information, which is sensitive. We use it only to provide the app's features to you and your household and never for advertising. Your Plaid access tokens are stored server-side and are not readable by other users. Connecting a bank is always optional, and you can disconnect it at any time.`,
  },
  {
    title: "7. Data Retention",
    body: `We keep your information for as long as your account is active. When you delete your account, we delete your personal data and household data (where you are the only remaining member), and we remove any connected bank item at Plaid. Some records may be retained for a limited time where required by law or to resolve disputes. Backups are purged on a rolling basis.`,
  },
  {
    title: "8. How to Delete Your Data",
    body: `You can delete your account and associated data at any time:\n\n• In the app — open Settings and choose Delete Account.\n• By email — contact hello@desertirontech.com and we will process your request.\n\nDeleting your account removes your data as described in "Data Retention" above, including disconnecting any bank connection at Plaid.`,
  },
  {
    title: "9. Your Privacy Rights",
    body: `Depending on where you live (including California, Colorado, Connecticut, Virginia, Utah, and other U.S. states with privacy laws), you may have the right to:\n\n• Access the personal information we hold about you\n• Correct inaccurate personal information\n• Delete your personal information\n• Opt out of the sale of personal information or targeted advertising (note: we do not sell or use targeted advertising)\n• Appeal a decision we make about your request\n\nTo exercise any of these rights, email hello@desertirontech.com. We will not discriminate against you for exercising your rights. You may also designate an authorized agent to make a request on your behalf. If we deny your request, you may appeal by replying to our response; if you have concerns, you may contact your state attorney general.`,
  },
  {
    title: "10. Security",
    body: `Data is encrypted in transit (TLS) and at rest. Access to your data is restricted by database row-level security so that only you and the members of your household can view it. Plaid access tokens are stored on the server and are not exposed to client applications. No method of transmission or storage is 100% secure, but we work to protect your information.`,
  },
  {
    title: "11. Children",
    body: `Stryde is intended for adults and is not directed to children. You must be at least 18 years old to create an account. We do not knowingly collect personal information from anyone under 18. If you believe a minor has provided us information, contact hello@desertirontech.com and we will delete it.`,
  },
  {
    title: "12. Where Your Data Is Processed",
    body: `Stryde is operated in the United States, and your information is processed and stored in the United States. If you access the app from outside the United States, you understand your information will be processed here.`,
  },
  {
    title: "13. Changes to This Policy",
    body: `We may update this Privacy Policy from time to time. If we make material changes, we will update the "Last updated" date above and, where appropriate, provide additional notice in the app. Your continued use of Stryde after an update means you accept the revised policy.`,
  },
  {
    title: "14. Contact Us",
    body: `Desert Iron Technologies, LLC\nEmail: hello@desertirontech.com\nMailing address: 12352 N 144th Dr, Surprise, AZ 85379`,
  },
];

export default function PrivacyPolicy() {
  return (
    <div style={{ minHeight: "100vh", background: "#13111F", color: "#F0F6FC", fontFamily: "'Inter', sans-serif" }}>
      <div style={{ maxWidth: "760px", margin: "0 auto", padding: "60px 24px" }}>
        <Link to="/" style={{ fontSize: "13px", color: "#6C63FF", textDecoration: "none", display: "inline-block", marginBottom: "32px" }}>← Back</Link>
        <div style={{ fontSize: "11px", color: "#8B8FA8", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>Desert Iron Technologies, LLC</div>
        <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: "32px", fontWeight: "700", marginBottom: "8px" }}>Privacy Policy</h1>
        <p style={{ fontSize: "13px", color: "#8B8FA8", marginBottom: "48px" }}>Last updated: November 12, 2026</p>

        {sections.map((s, i) => (
          <div key={i} style={{ marginBottom: "32px" }}>
            <h2 style={{ fontSize: "16px", fontWeight: "600", color: "#F0F6FC", marginBottom: "10px" }}>{s.title}</h2>
            <p style={{ fontSize: "14px", color: "#8B8FA8", lineHeight: "1.7", whiteSpace: "pre-line" }}>{s.body}</p>
          </div>
        ))}

        <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "32px", marginTop: "16px", fontSize: "12px", color: "#484F58" }}>
          © 2026 Desert Iron Technologies, LLC. All rights reserved.
        </div>
      </div>
    </div>
  );
}
