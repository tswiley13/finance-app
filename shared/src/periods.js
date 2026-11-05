// Pay period generation.
//
// Periods are derived entirely from income: every non-monthly source's
// next_pay_date is walked backwards into a lookback window, then forward as a
// rolling window of the next `futurePeriods` paychecks. Each paycheck date
// starts a period that runs until the day before the next one.

import { localDateStr } from "./dates.js";

/**
 * Build the pay period rows for a household. Pure — returns rows to insert,
 * it does not touch the database.
 *
 * Forward coverage is a ROLLING WINDOW: it keeps the current period plus the
 * next `futurePeriods - 1` ahead of today, crossing the year boundary. (It used
 * to stop at Dec 31, which quietly shrank the projection to 1 period by late
 * December.) Past periods inside the lookback window are kept for context.
 *
 * @param income        income rows; monthly sources are ignored (they don't
 *                      define a pay *cycle*, they just land inside one)
 * @param today         defaults to now
 * @param lookbackDays  how much history to keep (default ~2 months)
 * @param futurePeriods how many current-or-future periods to project (default 6)
 * @returns [{ name, start_day, end_day, start_date, end_date }]
 */
export function buildPayPeriods({ income = [], today = new Date(), lookbackDays = 60, futurePeriods = 6 } = {}) {
  const start = new Date(today);
  start.setHours(0, 0, 0, 0);

  const paychecks = income.filter((i) => i.frequency !== "monthly" && i.next_pay_date);
  if (paychecks.length === 0) return [];

  const lookbackFloor = new Date(start.getTime() - lookbackDays * 86400000);
  // Generate comfortably past the window we need, then trim. Even all-weekly
  // sources can't add more than one boundary per 7 days, so a (futurePeriods+2)
  // × 14-day horizon always yields at least `futurePeriods` future periods.
  const horizon = new Date(start.getTime() + (futurePeriods + 2) * 14 * 86400000);

  const allDates = [];
  paychecks.forEach((inc) => {
    const interval = inc.frequency === "weekly" ? 7 : 14;
    // Parse at noon so day arithmetic can't be knocked across a boundary by DST.
    const cursor = new Date(inc.next_pay_date + "T12:00:00");

    // Walk back to the first paycheck inside the lookback window…
    while (cursor > lookbackFloor) cursor.setDate(cursor.getDate() - interval);
    cursor.setDate(cursor.getDate() + interval); // …then step forward into range.

    // …and sweep forward past the rolling horizon.
    while (cursor <= horizon) {
      allDates.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + interval);
    }
  });

  allDates.sort((a, b) => a - b);

  // Two sources can land on the same day (e.g. both paid Friday) — one period.
  const unique = allDates.filter(
    (d, i, self) => i === 0 || d.toDateString() !== self[i - 1].toDateString()
  );

  // Bound each period by the next start (the horizon guarantees the last kept
  // future period still has a real successor, so none falls back to +13 days).
  const rows = unique.map((startDate, i) => {
    let endDate;
    if (i < unique.length - 1) {
      endDate = new Date(unique[i + 1]);
      endDate.setDate(endDate.getDate() - 1);
    } else {
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 13);
    }
    return { startDate, endDate };
  });

  // Keep the lookback past periods, plus exactly `futurePeriods` current/future
  // ones (end_date on or after today) — the rolling window.
  let futureCount = 0;
  const kept = rows.filter(({ endDate }) => {
    if (endDate >= start) {
      futureCount += 1;
      return futureCount <= futurePeriods;
    }
    return true;
  });

  return kept.map(({ startDate, endDate }, i) => ({
    name: `Pay Period ${i + 1}`,
    start_day: startDate.getDate(),
    end_day: endDate.getDate(),
    // localDateStr, not toISOString — the latter converts to UTC and can
    // shift the date by a day depending on the viewer's timezone.
    start_date: localDateStr(startDate),
    end_date: localDateStr(endDate),
  }));
}
