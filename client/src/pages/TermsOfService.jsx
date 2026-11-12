import { Link } from "react-router-dom";

// NOTE: Drafted to the Desert Iron shared terms standard. Pending attorney
// review (arbitration enforceability in particular).
const sections = [
  {
    title: "1. Agreement to These Terms",
    body: `These Terms of Service ("Terms") are a binding agreement between you and Desert Iron Technologies, LLC, an Arizona limited liability company ("Desert Iron," "we," "us," or "our"), which operates the Stryde app ("Stryde"). By creating an account or using Stryde, you agree to these Terms and to our Privacy Policy. If you do not agree, do not use Stryde.`,
  },
  {
    title: "2. Eligibility",
    body: `You must be at least 18 years old and able to form a binding contract to use Stryde. By using Stryde, you represent that you meet these requirements.`,
  },
  {
    title: "3. The Service",
    body: `Stryde is a personal and household finance planning tool. It lets you track income, bills, accounts, debts, categories, and pay periods, and optionally connect bank accounts through Plaid to view balances. We may add, change, or remove features over time.`,
  },
  {
    title: "4. Your Account",
    body: `You are responsible for keeping your login credentials confidential and for all activity under your account. If you invite others to your household, you are responsible for the information you share with them. Notify us promptly at hello@desertirontech.com if you suspect unauthorized use of your account.`,
  },
  {
    title: "5. Acceptable Use",
    body: `You agree not to:\n• Violate any applicable law or regulation\n• Access or attempt to access data belonging to other users or households\n• Reverse engineer, disrupt, overload, or interfere with the app or its infrastructure\n• Use the app to transmit malware or to engage in fraudulent activity\n• Use automated means to access the app except as we expressly permit`,
  },
  {
    title: "6. Bank Connections (Plaid)",
    body: `Connecting a bank is optional. When you connect an institution through Plaid, you authorize Stryde and Plaid to access and retrieve account information (such as balances and account details) from that institution on your behalf. Your use of Plaid is also subject to Plaid's end-user policies. You may disconnect a bank at any time in the app, and we remove the associated connection at Plaid when you delete your account.`,
  },
  {
    title: "7. Fees and Paid Features",
    body: `Stryde is currently free to use. If we introduce paid plans or features in the future, we will disclose the price and the applicable terms (including any renewal and refund terms) before you are charged, and any purchase will require your separate agreement.`,
  },
  {
    title: "8. Not Financial Advice",
    body: `Stryde is a budgeting and planning tool only. Nothing in the app is financial, investment, tax, accounting, or legal advice. Projections, "available" amounts, and "what-if" scenarios are estimates based on the information you enter and on data from third parties, and they may be inaccurate or incomplete. You are solely responsible for your financial decisions. Always consult a qualified professional before making financial decisions.`,
  },
  {
    title: "9. Intellectual Property",
    body: `Stryde, including its software, design, text, graphics, and logos, is owned by Desert Iron Technologies, LLC and is protected by intellectual property laws. We grant you a limited, personal, non-exclusive, non-transferable, revocable license to use Stryde for your own personal and household use, subject to these Terms. You may not copy, modify, distribute, sell, or create derivative works from any part of Stryde except as expressly permitted.`,
  },
  {
    title: "10. Your Content",
    body: `You retain ownership of the financial and household information you enter ("Your Content"). You grant Desert Iron a limited license to host, store, process, and display Your Content solely to operate and provide the app to you and your household. You are responsible for the accuracy of Your Content and for having the right to share any information you enter about other people in your household.`,
  },
  {
    title: "11. Disclaimer of Warranties",
    body: `Stryde is provided "as is" and "as available," without warranties of any kind, whether express, implied, or statutory, including any implied warranties of merchantability, fitness for a particular purpose, and non-infringement. We do not warrant that the app will be uninterrupted, error-free, or secure, or that data retrieved from third-party financial institutions will be accurate or current.`,
  },
  {
    title: "12. Limitation of Liability",
    body: `To the fullest extent permitted by law, Desert Iron Technologies, LLC and its members, officers, and agents will not be liable for any indirect, incidental, special, consequential, exemplary, or punitive damages, or for any loss of profits, data, goodwill, or financial loss, arising out of or related to your use of Stryde. Our total liability for all claims relating to the app will not exceed the greater of (a) the amount you paid us for the app in the twelve (12) months before the claim, or (b) one hundred U.S. dollars ($100). Some jurisdictions do not allow certain limitations, so some of these may not apply to you.`,
  },
  {
    title: "13. Indemnification",
    body: `You agree to indemnify and hold harmless Desert Iron Technologies, LLC and its members, officers, and agents from any claims, damages, liabilities, and expenses (including reasonable attorneys' fees) arising out of your use of Stryde, Your Content, your violation of these Terms, or your violation of any law or the rights of a third party.`,
  },
  {
    title: "14. Termination",
    body: `You may stop using Stryde and delete your account at any time in Settings. We may suspend or terminate your access if you violate these Terms or if we discontinue the app. Provisions that by their nature should survive termination (including intellectual property, disclaimers, limitation of liability, indemnification, and dispute resolution) will survive.`,
  },
  {
    title: "15. Governing Law and Venue",
    body: `These Terms are governed by the laws of the State of Arizona, without regard to its conflict-of-law rules. Subject to the arbitration section below, you and Desert Iron agree that any dispute that is not arbitrated will be brought exclusively in the state or federal courts located in Maricopa County, Arizona, and you consent to personal jurisdiction there.`,
  },
  {
    title: "16. Binding Arbitration and Class Action Waiver",
    body: `PLEASE READ THIS SECTION CAREFULLY — IT AFFECTS YOUR LEGAL RIGHTS.\n\nYou and Desert Iron agree to resolve any dispute arising out of or relating to these Terms or Stryde through binding individual arbitration, rather than in court, administered by the American Arbitration Association (AAA) under its Consumer Arbitration Rules. The arbitration will be held in Arizona or, at your election, by phone or video or based on written submissions.\n\nClass and jury waiver: Disputes will be arbitrated only on an individual basis. You and Desert Iron waive the right to a jury trial and the right to participate in a class, collective, or representative action.\n\nSmall-claims exception: Either party may bring an individual claim in small-claims court if it qualifies.\n\n30-day opt-out: You may opt out of this arbitration agreement within 30 days of first accepting these Terms by emailing hello@desertirontech.com with your name and a statement that you opt out of arbitration. Opting out will not affect any other part of these Terms.`,
  },
  {
    title: "17. Changes to These Terms",
    body: `We may modify these Terms from time to time. If we make material changes, we will update the "Last updated" date above and, where appropriate, provide additional notice in the app. Your continued use of Stryde after an update means you accept the revised Terms.`,
  },
  {
    title: "18. Apple App Store",
    body: `If you download Stryde from the Apple App Store, you acknowledge: these Terms are between you and Desert Iron, not Apple; Apple is not responsible for the app or its content; Apple has no obligation to provide maintenance or support for the app; in the event of any failure of the app to conform to any applicable warranty, you may notify Apple and Apple will refund any purchase price (if any), and to the maximum extent permitted by law Apple has no other warranty obligation; Apple is not responsible for addressing any claims relating to the app; and Apple and its subsidiaries are third-party beneficiaries of these Terms and may enforce them against you.`,
  },
  {
    title: "19. General",
    body: `These Terms, together with the Privacy Policy, are the entire agreement between you and Desert Iron regarding Stryde. If any provision is found unenforceable, the remaining provisions will stay in effect. Our failure to enforce a provision is not a waiver. You may not assign these Terms without our consent; we may assign them in connection with a merger, acquisition, or sale of assets.`,
  },
  {
    title: "20. Contact",
    body: `Desert Iron Technologies, LLC\nEmail: hello@desertirontech.com\nMailing address: 12352 N 144th Dr, Surprise, AZ 85379`,
  },
];

export default function TermsOfService() {
  return (
    <div style={{ minHeight: "100vh", background: "#13111F", color: "#F0F6FC", fontFamily: "'Inter', sans-serif" }}>
      <div style={{ maxWidth: "760px", margin: "0 auto", padding: "60px 24px" }}>
        <Link to="/" style={{ fontSize: "13px", color: "#6C63FF", textDecoration: "none", display: "inline-block", marginBottom: "32px" }}>← Back</Link>
        <div style={{ fontSize: "11px", color: "#8B8FA8", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>Desert Iron Technologies, LLC</div>
        <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: "32px", fontWeight: "700", marginBottom: "8px" }}>Terms of Service</h1>
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
