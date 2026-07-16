// Stryde's palette — kept in sync with the web app.
export const c = {
  bg: "#13111F",
  panel: "#1A1826",
  panelAlt: "#161B22",
  border: "rgba(255,255,255,0.06)",
  borderSoft: "rgba(255,255,255,0.04)",
  borderHard: "#30363D",

  accent: "#6C63FF",
  accent2: "#948cf2",
  accentSoft: "rgba(108,99,255,0.15)",

  success: "#00D4AA",
  positive: "#4ADE80",
  warning: "#FBBF24",
  danger: "#F87171",

  text: "#F0F6FC",
  textMuted: "#8B8FA8",
  textFaint: "#6E7681",
  textDim: "#5C6080",
};

// DM Mono isn't bundled; the platform monospace keeps numbers column-aligned.
export const mono = { fontVariant: ["tabular-nums"] };

export const money = (n) =>
  `$${(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const signedMoney = (n) => (n < 0 ? `-${money(Math.abs(n))}` : money(n));
