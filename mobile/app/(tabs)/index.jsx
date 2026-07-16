import { useState } from "react";
import { View, Text, ScrollView, Pressable, RefreshControl, Alert, TextInput, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import {
  fmtDate, getBillsToTransfer, getPeriodTransferGroups, getCarryOverBills,
  isBillPaidInPeriod, getBillPaidAmount, ordinalSuffix, canMarkIncomeReceived,
} from "@stryde/shared";
import {
  useStrydeData, markBillPaid, undoBillPaid, skipBill, restoreBill,
  markIncomeReceived, undoIncomeReceived,
  recordTransfer, undoTransfer,
} from "../../src/useStrydeData";
import { Panel, Label, Money, StatTile, Pill, Empty, Divider, dataGate } from "../../src/ui";
import { c, mono } from "../../src/theme";

export default function Dashboard() {
  const d = useStrydeData();
  const [expanded, setExpanded] = useState({ 0: true });
  const [showUpcoming, setShowUpcoming] = useState(false);
  const [busy, setBusy] = useState(false);

  const gate = dataGate(d);
  if (gate) return gate;

  const p = d.projection;
  const currentIdx = d.rows.findIndex((r) => r.isCurrent);
  const currentRow = currentIdx >= 0 ? d.rows[currentIdx] : null;
  const current = currentRow; // used by the transfers tile
  const nextRow = currentIdx >= 0 ? d.rows[currentIdx + 1] : null;
  // Everything that isn't the current period folds into one tile.
  const upcoming = d.rows.filter((_, i) => i !== currentIdx);
  const lastUpcoming = upcoming[upcoming.length - 1] || null;
  // Bills the previous period never settled — they don't stop being owed.
  const carryOver = getCarryOverBills(d.ctx);

  // Every mutation helper resolves to a Supabase error (or undefined). Surface
  // it — silently swallowing a failed write on a finance app means the user
  // believes a bill is paid when nothing was recorded.
  async function run(fn) {
    if (busy) return;
    setBusy(true);
    try {
      const error = await fn();
      if (error) {
        Alert.alert("Couldn't save", error.message || String(error));
      } else {
        await d.reload();
      }
    } catch (e) {
      Alert.alert("Couldn't save", e?.message || String(e));
    } finally {
      setBusy(false);
    }
  }

  const greeting = () => {
    const h = new Date().getHours();
    return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
  };
  const firstName =
    d.members.find((m) => m.role === "owner")?.name?.split(" ")[0] ||
    d.household?.name ||
    "there";

  return (
    <SafeAreaView style={s.screen} edges={["top"]}>
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={false} onRefresh={d.reload} tintColor={c.accent} />}
      >
        {/* Header */}
        <View style={s.header}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{(firstName[0] || "?").toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.greeting}>{greeting()}, {firstName}</Text>
            <Text style={s.date}>
              {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </Text>
          </View>
        </View>

        <Text style={s.pageTitle}>Monthly Projection</Text>

        {/* The four tiles — always: available = now + income - bills */}
        <View style={s.tileRow}>
          <StatTile label="Available Now" value={p.availableNow} />
          <StatTile label="Income This Month" value={p.incomeThisMonth} />
        </View>
        <View style={[s.tileRow, { marginTop: 8 }]}>
          <StatTile label="Bills Remaining" value={p.billsRemaining} negative />
          <StatTile label="Available This Month" value={p.availableThisMonth} negative={p.availableThisMonth < 0} />
        </View>

        {/* Outstanding transfers for the CURRENT period — the one thing that's
            actually actionable right now, so it sits up top. Disappears once
            everything's been moved. */}
        {current && <CurrentTransfers row={current} d={d} run={run} />}

        {/* Pay periods. The current one stays open; the rest fold away — a
            phone-height wall of eight cards buries everything below it. */}
        <Label style={{ marginTop: 24, marginBottom: 10 }}>Pay Periods</Label>
        {d.rows.length === 0 && <Empty text="No pay periods yet" />}

        {carryOver.length > 0 && (
          <Panel style={{ marginBottom: 10, borderColor: "rgba(248,113,113,0.3)" }}>
            <Label style={{ color: c.danger }}>Carried Over</Label>
            <Text style={[s.faintSm, { marginBottom: 6 }]}>
              Unpaid from last period — still owed.
            </Text>
            {carryOver.map((b) => (
              <BillRow
                key={`co-${b.id}`}
                bill={b}
                periodKey={b._carryOverFrom}
                d={d}
                run={run}
                carryOver
              />
            ))}
          </Panel>
        )}

        {currentRow && (
          <PeriodCard
            row={currentRow}
            open={!!expanded[currentIdx]}
            onToggle={() => setExpanded((e) => ({ ...e, [currentIdx]: !e[currentIdx] }))}
            d={d}
            run={run}
          />
        )}

        {upcoming.length > 0 && (
          <Panel style={{ marginBottom: 10, padding: 0, overflow: "hidden" }}>
            <Pressable onPress={() => setShowUpcoming((v) => !v)} style={s.upcomingHeader}>
              {/* Spacer balances the chevron so the text centers on the tile,
                  not on the space left over beside it. */}
              <View style={s.chevronSlot} />
              <View style={{ flex: 1 }}>
                <Text style={[s.upcomingTitle, { textAlign: "center" }]}>Upcoming Pay Periods</Text>
                <Text style={[s.faintSm, { textAlign: "center" }]}>
                  {upcoming.length} period{upcoming.length === 1 ? "" : "s"}
                  {lastUpcoming ? ` · through ${fmtDate(lastUpcoming.period.end_date)}` : ""}
                </Text>
              </View>
              <View style={[s.chevronSlot, { alignItems: "flex-end" }]}>
                <Ionicons
                  name={showUpcoming ? "chevron-up" : "chevron-down"}
                  size={16}
                  color={c.textFaint}
                />
              </View>
            </Pressable>

            {showUpcoming && (
              <View style={s.upcomingBody}>
                {upcoming.map((row, i) => {
                  const idx = d.rows.indexOf(row);
                  return (
                    <PeriodCard
                      key={row.period.id || `u${i}`}
                      row={row}
                      open={!!expanded[idx]}
                      onToggle={() => setExpanded((e) => ({ ...e, [idx]: !e[idx] }))}
                      d={d}
                      run={run}
                    />
                  );
                })}
              </View>
            )}
          </Panel>
        )}

        {/* Next period's pre-fund lives down here on purpose: it's planning
            ahead, not something you need to act on the moment you open the app. */}
        {nextRow && <PreFund row={nextRow} d={d} run={run} />}
      </ScrollView>
    </SafeAreaView>
  );
}

function CurrentTransfers({ row, d, run }) {
  const groups = getPeriodTransferGroups(row, d.ctx);
  const outstanding = groups.filter((g) => !g.done);
  // Nothing left to move — don't take up space.
  if (outstanding.length === 0) return null;

  const periodStart = row.period.start_date;
  const totalLeft = outstanding.reduce((sum, g) => sum + g.remaining, 0);

  return (
    <Panel style={{ marginTop: 16, borderColor: "rgba(108,99,255,0.3)" }}>
      <View style={s.rowBetween}>
        <Label style={{ color: c.accent }}>Where the Money Goes</Label>
        <Text style={s.faint}>This pay period</Text>
      </View>
      <Text style={[s.faint, { marginTop: 4 }]}>
        {outstanding.length === 1
          ? "You still need to move money to cover this period's bills."
          : `${outstanding.length} transfers still needed for this period.`}
      </Text>
      <Divider style={{ marginVertical: 12 }} />

      {outstanding.map((g) => (
        <View key={g.accountId} style={[s.rowBetween, { paddingVertical: 6 }]}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: c.text, fontSize: 14, fontWeight: "500" }}>
              Transfer to {g.name}
            </Text>
            {g.transferred > 0 && (
              <Text style={s.faintSm}>${g.transferred.toFixed(2)} moved so far</Text>
            )}
            {g.buffer > 0 && (
              <Text style={s.faintSm}>Includes ${g.buffer.toFixed(2)} buffer</Text>
            )}
          </View>
          <Pressable
            onPress={() => run(() => recordTransfer(d.userId, periodStart, g.accountId, g.needed))}
            style={s.transferBtn}
          >
            <Text style={s.transferBtnText}>Transfer ${g.remaining.toFixed(2)}</Text>
          </Pressable>
        </View>
      ))}

      {outstanding.length > 1 && (
        <>
          <Divider style={{ marginVertical: 10 }} />
          <View style={s.rowBetween}>
            <Text style={{ color: c.textMuted, fontSize: 12, fontWeight: "600" }}>Total to move</Text>
            <Money value={totalLeft} color={c.accent} size={14} weight="700" />
          </View>
        </>
      )}
    </Panel>
  );
}

function PreFund({ row, d, run }) {
  const total = getBillsToTransfer(row, d.ctx);
  if (total <= 0) return null;
  const key = "next-bills-total";
  const transferred = d.nextTransfers[key] || 0;
  const done = transferred >= total;
  const periodStart = row.period.start_date;

  return (
    <Panel style={{ marginTop: 16, marginBottom: 8 }}>
      <View style={s.rowBetween}>
        <Label>Where the Money Goes</Label>
        <Text style={s.faint}>Next period</Text>
      </View>
      <Text style={[s.faint, { marginTop: 4 }]}>
        {fmtDate(row.period.start_date)} — {fmtDate(row.period.end_date)}
      </Text>
      <Divider style={{ marginVertical: 12 }} />
      <View style={s.rowBetween}>
        <Text style={{ color: done ? c.positive : c.text, fontSize: 14, fontWeight: "500" }}>
          {done ? "✓ " : ""}Bills to transfer
        </Text>
        {done ? (
          <Pressable onPress={() => run(() => undoTransfer(d.userId, periodStart, key))}>
            <Text style={s.undo}>Undo</Text>
          </Pressable>
        ) : (
          <Pressable
            onPress={() => run(() => recordTransfer(d.userId, periodStart, key, total))}
            style={s.transferBtn}
          >
            <Text style={s.transferBtnText}>Transfer ${total.toFixed(2)}</Text>
          </Pressable>
        )}
      </View>
    </Panel>
  );
}

function PeriodCard({ row, open, onToggle, d, run }) {
  const periodKey = row.period.start_date;

  return (
    <Panel style={{ marginBottom: 10, borderLeftWidth: 3, borderLeftColor: row.isCurrent ? c.accent : "transparent" }}>
      <Pressable onPress={onToggle} style={s.rowBetween}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Text style={s.periodTitle}>
              {fmtDate(row.period.start_date)} — {fmtDate(row.period.end_date)}
            </Text>
            {row.isCurrent && <Pill text="CURRENT" color="#fff" bg={c.accent} />}
          </View>
          {row.incomeItems.length > 0 && (
            <Text style={[s.faint, { marginTop: 3 }]} numberOfLines={1}>
              {row.incomeItems.map((i) => `${i.name} (${fmtDate(i.actualPayDate)})`).join(" · ")}
            </Text>
          )}
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Label style={{ marginBottom: 2 }}>End Balance</Label>
          <Money value={row.endBalance} color={row.endBalance < 0 ? c.danger : c.positive} size={18} />
        </View>
        <Ionicons name={open ? "chevron-up" : "chevron-down"} size={16} color={c.textFaint} style={{ marginLeft: 8 }} />
      </Pressable>

      {open && (
        <View style={{ marginTop: 14 }}>
          {/* Start / Income / Bills */}
          <View style={{ flexDirection: "row", gap: 6 }}>
            <SubTile label="Start" value={row.startBalance} color={c.textMuted} />
            <SubTile label={row.isCurrent ? "Pending" : "Income"} value={row.pendingIncome} color={c.positive} prefix="+" />
            <SubTile label="Bills" value={-row.billsDeducted} color={row.billsDeducted > 0 ? c.danger : c.textMuted} />
          </View>

          {/* Income */}
          {row.incomeItems.length > 0 && (
            <>
              <Divider style={{ marginTop: 14 }} />
              <Label style={{ marginTop: 12, marginBottom: 8 }}>Income</Label>
              {row.incomeItems.map((inc, i) => {
                const received = d.earlyPayments.has(`${inc.id}-${periodKey}`);
                // "Got Paid" only makes sense for a deposit that hasn't landed
                // yet. Once the pay date arrives the money is already in the
                // balance, so there's nothing to mark — offering the button
                // would write a record that changes no number.
                const canMark = canMarkIncomeReceived(inc, periodKey, d.ctx);
                return (
                  <View key={`${inc.id}-${i}`} style={[s.rowBetween, { paddingVertical: 7 }]}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: received ? c.positive : c.text, fontSize: 13, fontWeight: "600" }}>
                        {received ? "✓ " : ""}{inc.name}
                      </Text>
                      <Text style={s.faintSm}>
                        {fmtDate(inc.actualPayDate)}{received ? " · Received early" : ""}
                      </Text>
                    </View>
                    <Money value={inc.fixed_amount} color={received ? c.positive : c.textMuted} size={13} />
                    {received ? (
                      <Pressable onPress={() => run(() => undoIncomeReceived(d.userId, inc.id, periodKey))} style={{ marginLeft: 10 }}>
                        <Text style={s.undo}>Undo</Text>
                      </Pressable>
                    ) : canMark ? (
                      <Pressable onPress={() => run(() => markIncomeReceived(d.userId, inc.id, periodKey))} style={[s.gotPaidBtn, { marginLeft: 10 }]}>
                        <Text style={s.gotPaidText}>Got Paid</Text>
                      </Pressable>
                    ) : null}
                  </View>
                );
              })}
            </>
          )}

          {/* Bills */}
          {row.bills.length > 0 && (
            <>
              <Divider style={{ marginTop: 10 }} />
              <Label style={{ marginTop: 12, marginBottom: 4 }}>Bills</Label>
              {row.bills.map((b) => (
                <BillRow key={b.id} bill={b} periodKey={periodKey} d={d} run={run} />
              ))}
            </>
          )}
        </View>
      )}
    </Panel>
  );
}

/**
 * One bill in a period card. Handles the three states the web app has:
 * unpaid (Paid / Partial / Skip), partially paid, and fully paid.
 */
function BillRow({ bill, periodKey, d, run, carryOver }) {
  const [enteringPartial, setEnteringPartial] = useState(false);
  const [partialAmt, setPartialAmt] = useState("");

  const skipped = d.skippedBillPeriods.has(`${bill.id}-${periodKey}`);
  const paidAmt = getBillPaidAmount(d.billPayments, bill.id, periodKey);
  const paid = isBillPaidInPeriod(d.billPayments, bill.id, periodKey);
  const amount = bill.amount || 0;
  const isPartial = paidAmt > 0 && paidAmt < amount;
  const isFull = paid && !isPartial;
  const remaining = amount - paidAmt;
  const freq = bill.frequency || "monthly";

  const sub = skipped
    ? "Skipped this period"
    : isPartial
      ? `$${paidAmt.toFixed(2)} paid · $${remaining.toFixed(2)} left`
      : isFull
        ? "Paid this period"
        : carryOver
          ? "Unpaid from last period"
          : freq === "payday"
            ? "Every Pay Day"
            : freq === "biweekly"
              ? "Biweekly"
              : bill.due_day
                ? `Due the ${bill.due_day}${ordinalSuffix(bill.due_day)}`
                : "";

  function submitPartial() {
    const v = parseFloat(partialAmt);
    if (!v || v <= 0) return;
    setEnteringPartial(false);
    setPartialAmt("");
    run(() => markBillPaid(d.userId, bill, periodKey, v, d.billPayments));
  }

  return (
    <View style={[s.billRow, { opacity: isFull || skipped ? 0.4 : 1 }]}>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          <Text
            style={{
              color: isFull || skipped ? c.textMuted : c.text,
              fontSize: 13,
              fontWeight: "500",
              textDecorationLine: isFull || skipped ? "line-through" : "none",
            }}
          >
            {isFull ? "✓ " : ""}{bill.name}
          </Text>
          {isPartial && <Pill text="PARTIAL" color={c.warning} bg="rgba(251,191,36,0.15)" />}
          {carryOver && !isFull && <Pill text="CARRY-OVER" color={c.danger} bg="rgba(248,113,113,0.12)" />}
        </View>
        {!!sub && <Text style={s.faintSm}>{sub}</Text>}
      </View>

      {enteringPartial ? (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <TextInput
            value={partialAmt}
            onChangeText={(t) => setPartialAmt(t.replace(/[^0-9.]/g, ""))}
            placeholder={remaining.toFixed(2)}
            placeholderTextColor={c.textDim}
            keyboardType="decimal-pad"
            autoFocus
            onSubmitEditing={submitPartial}
            style={s.partialInput}
          />
          <Pressable onPress={submitPartial} style={s.miniOk} hitSlop={6}>
            <Text style={{ color: c.positive, fontSize: 13, fontWeight: "700" }}>✓</Text>
          </Pressable>
          <Pressable onPress={() => { setEnteringPartial(false); setPartialAmt(""); }} hitSlop={6}>
            <Text style={{ color: c.danger, fontSize: 13 }}>✕</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <Money value={isPartial ? remaining : amount} color={isPartial ? c.warning : c.textMuted} size={13} />
          {skipped ? (
            <Pressable onPress={() => run(() => restoreBill(d.userId, bill.id, periodKey))} style={{ marginLeft: 10 }}>
              <Text style={s.undo}>Restore</Text>
            </Pressable>
          ) : isFull ? (
            <Pressable onPress={() => run(() => undoBillPaid(d.userId, bill.id, periodKey))} style={{ marginLeft: 10 }}>
              <Text style={s.undo}>Undo</Text>
            </Pressable>
          ) : (
            <View style={{ flexDirection: "row", gap: 4, marginLeft: 8 }}>
              <Pressable
                onPress={() => run(() => markBillPaid(d.userId, bill, periodKey, undefined, d.billPayments))}
                style={s.paidBtn}
              >
                <Text style={s.paidBtnText}>Paid</Text>
              </Pressable>
              <Pressable onPress={() => setEnteringPartial(true)} style={s.partialBtn}>
                <Text style={s.partialBtnText}>Partial</Text>
              </Pressable>
              {!isPartial && (
                <Pressable onPress={() => run(() => skipBill(d.userId, bill.id, periodKey))} style={s.skipBtn}>
                  <Text style={s.skipBtnText}>✕</Text>
                </Pressable>
              )}
            </View>
          )}
        </>
      )}
    </View>
  );
}

function SubTile({ label, value, color, prefix = "" }) {
  return (
    <View style={s.subTile}>
      <Label style={{ fontSize: 9, marginBottom: 3 }}>{label}</Label>
      <Text style={[mono, { color, fontSize: 13 }]}>
        {prefix}${Math.abs(value || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: c.bg },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  h1: { color: c.text, fontSize: 20, fontWeight: "700", marginBottom: 8, textAlign: "center" },
  muted: { color: c.textMuted, fontSize: 14, textAlign: "center", lineHeight: 20 },
  header: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 20 },
  avatar: {
    width: 38, height: 38, borderRadius: 19, backgroundColor: c.accent,
    alignItems: "center", justifyContent: "center",
  },
  avatarText: { color: "#0D1117", fontWeight: "700", fontSize: 14 },
  greeting: { color: c.text, fontSize: 17, fontWeight: "700" },
  date: { color: c.textMuted, fontSize: 12, marginTop: 1 },
  pageTitle: { color: c.text, fontSize: 22, fontWeight: "700", marginBottom: 12 },
  tileRow: { flexDirection: "row", gap: 8 },
  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  periodTitle: { color: c.text, fontSize: 14, fontWeight: "600" },
  faint: { color: c.textMuted, fontSize: 11 },
  faintSm: { color: c.textFaint, fontSize: 10, marginTop: 1 },
  subTile: { flex: 1, backgroundColor: "rgba(255,255,255,0.03)", borderRadius: 8, padding: 9 },
  undo: { color: c.textFaint, fontSize: 11, textDecorationLine: "underline" },
  paidBtn: {
    backgroundColor: "rgba(108,99,255,0.12)", borderWidth: 1, borderColor: "rgba(108,99,255,0.25)",
    borderRadius: 5, paddingHorizontal: 10, paddingVertical: 4,
  },
  paidBtnText: { color: c.accent, fontSize: 11, fontWeight: "600" },
  gotPaidBtn: {
    backgroundColor: "rgba(0,212,170,0.1)", borderWidth: 1, borderColor: "rgba(0,212,170,0.4)",
    borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4,
  },
  gotPaidText: { color: c.success, fontSize: 11, fontWeight: "600" },
  transferBtn: {
    backgroundColor: "rgba(108,99,255,0.12)", borderWidth: 1, borderColor: "rgba(108,99,255,0.25)",
    borderRadius: 6, paddingHorizontal: 12, paddingVertical: 6,
  },
  transferBtnText: { color: c.accent, fontSize: 12, fontWeight: "600" },
  upcomingHeader: { flexDirection: "row", alignItems: "center", padding: 16 },
  upcomingTitle: { color: c.text, fontSize: 14, fontWeight: "600" },
  chevronSlot: { width: 20, justifyContent: "center" },
  billRow: { flexDirection: "row", alignItems: "center", paddingVertical: 7 },
  partialInput: {
    width: 74, backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1, borderColor: "rgba(108,99,255,0.4)", borderRadius: 6,
    color: c.text, fontSize: 12, paddingHorizontal: 8, paddingVertical: 4, textAlign: "right",
  },
  miniOk: { paddingHorizontal: 4 },
  partialBtn: {
    backgroundColor: "rgba(251,191,36,0.08)", borderWidth: 1,
    borderColor: "rgba(251,191,36,0.3)", borderRadius: 5,
    paddingHorizontal: 8, paddingVertical: 4,
  },
  partialBtnText: { color: c.warning, fontSize: 11, fontWeight: "600" },
  skipBtn: {
    backgroundColor: "rgba(248,113,113,0.08)", borderWidth: 1,
    borderColor: "rgba(248,113,113,0.25)", borderRadius: 5,
    paddingHorizontal: 7, paddingVertical: 4,
  },
  skipBtnText: { color: c.danger, fontSize: 11, fontWeight: "600" },
  // Cards nest inside the tile, so drop the outer padding and let them sit flush.
  upcomingBody: {
    paddingHorizontal: 8,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: c.borderSoft,
    paddingTop: 8,
  },
});
