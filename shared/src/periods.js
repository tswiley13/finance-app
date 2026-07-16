// Pay period generation.
//
// Periods are derived entirely from income: every non-monthly source's
// next_pay_date is walked backwards into a lookback window, then forward to the
// end of the year. Each paycheck date starts a period that runs until the day
// before the next one.

import { localDateStr } from "./dates.js";

/**
 * Build the pay period rows for a household. Pure — returns rows to insert,
 * it does not touch the database.
 *
 * @param income        income rows; monthly sources are ignored (they don't
 *                      define a pay *cycle*, they just land inside one)
 * @param today         defaults to now
 * @param lookbackDays  how much history to keep (default ~2 months)
 * @returns [{ name, start_day, end_day, start_date, end_date }]
 */
export function buildPayPeriods({ income = [], today = new Date(), lookbackDays = 60 } = {}) {
  const start = new Date(today);
  start.setHours(0, 0, 0, 0);

  const paychecks = income.filter((i) => i.frequency !== "monthly" && i.next_pay_date);
  if (paychecks.length === 0) return [];

  const endOfYear = new Date(start.getFullYear(), 11, 31, 23, 59, 59);
  const lookbackFloor = new Date(start.getTime() - lookbackDays * 86400000);

  const allDates = [];
  paychecks.forEach((inc) => {
    const interval = inc.frequency === "weekly" ? 7 : 14;
    // Parse at noon so day arithmetic can't be knocked across a boundary by DST.
    const cursor = new Date(inc.next_pay_date + "T12:00:00");

    // Walk back to the first paycheck inside the lookback window…
    while (cursor > lookbackFloor) cursor.setDate(cursor.getDate() - interval);
    cursor.setDate(cursor.getDate() + interval); // …then step forward into range.

    // …and sweep forward to the end of the year.
    while (cursor <= endOfYear) {
      allDates.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + interval);
    }
  });

  allDates.sort((a, b) => a - b);

  // Two sources can land on the same day (e.g. both paid Friday) — one period.
  const unique = allDates.filter(
    (d, i, self) => i === 0 || d.toDateString() !== self[i - 1].toDateString()
  );

  return unique.map((startDate, i) => {
    let endDate;
    if (i < unique.length - 1) {
      endDate = new Date(unique[i + 1]);
      endDate.setDate(endDate.getDate() - 1);
    } else {
      // Last one has no successor to bound it; assume a normal 14-day span.
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 13);
    }
    return {
      name: `Pay Period ${i + 1}`,
      start_day: startDate.getDate(),
      end_day: endDate.getDate(),
      // localDateStr, not toISOString — the latter converts to UTC and can
      // shift the date by a day depending on the viewer's timezone.
      start_date: localDateStr(startDate),
      end_date: localDateStr(endDate),
    };
  });
}
