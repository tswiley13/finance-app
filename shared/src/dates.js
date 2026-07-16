// Date + formatting helpers.
//
// Convention used throughout Stryde (see project notes):
//   "T00:00:00" for a period start, "T23:59:59" for a period end,
//   "T12:00:00" for display-only parsing (avoids DST/timezone drift).

/** Local YYYY-MM-DD string (not UTC — avoids the off-by-one from toISOString). */
export function localDateStr(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Money formatting: 1234.5 -> "1,234.50" (no leading $). */
export function fmt(n) {
  return (n || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** "2026-07-02" -> "Jul 2" */
export function fmtDate(s) {
  return new Date(s + "T12:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export const periodStartDate = (p) => new Date(p.start_date + "T00:00:00");
export const periodEndDate = (p) => new Date(p.end_date + "T23:59:59");

/** Start of today, local. */
export function startOfToday() {
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  return t;
}

/** How many times a given income frequency lands in a month. */
export function incMultiplier(freq) {
  if (freq === "biweekly") return 2;
  if (freq === "weekly") return 4;
  return 1;
}

/** How many times a given bill frequency lands in a month. */
export function billMultiplier(freq) {
  if (freq === "payday" || freq === "biweekly") return 2;
  return 1;
}

/** Ordinal suffix: 1 -> "st", 13 -> "th". */
export function ordinalSuffix(n) {
  if (n >= 11 && n <= 13) return "th";
  return ["st", "nd", "rd"][((n % 10) - 1)] || "th";
}
