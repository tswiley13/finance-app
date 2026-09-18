import Foundation

// Faithful port of the web Dashboard's INLINE pay-period projection
// (client/src/pages/Dashboard.jsx). Reproduces the rendered numbers, including
// the granular spill-over rule for Bills Remaining and the transfer-aware
// end-balance corrections. See the spec in the repo history.

struct ProjectionTiles {
    var availableNow: Double = 0
    var incomeThisMonth: Double = 0
    var billsRemaining: Double = 0
    var availableThisMonth: Double = 0
}

struct PeriodRow: Identifiable {
    var id: String
    var name: String
    var start: String
    var end: String
    var startBalance: Double
    var pendingIncome: Double
    var billsDeducted: Double
    var endBalance: Double
    var isCurrent: Bool
    var bills: [Bill]
    var incomeItems: [(income: Income, payDate: String)]
}

struct Projection {
    let accounts: [Account]
    let income: [Income]
    let bills: [Bill]
    let payPeriods: [PayPeriod]
    let billPayments: [String: BillPayment]
    let billSkips: Set<String>
    let earlyPayments: Set<String>
    let transfers: [String: Double]

    private let cal: Calendar = {
        var c = Calendar(identifier: .gregorian); c.timeZone = .current; return c
    }()
    private var accountsById: [String: Account] { Dictionary(accounts.map { ($0.id, $0) }) { a, _ in a } }

    // MARK: date helpers

    private func parse(_ s: String, _ h: Int, _ m: Int, _ sec: Int) -> Date {
        let p = s.prefix(10).split(separator: "-").compactMap { Int($0) }
        guard p.count == 3 else { return Date() }
        return ymd(p[0], p[1] - 1, p[2], h, m, sec)
    }
    // month0 is 0-based (JS-style); Foundation normalizes overflow.
    private func ymd(_ year: Int, _ month0: Int, _ day: Int, _ h: Int, _ m: Int, _ s: Int) -> Date {
        var c = DateComponents()
        c.year = year; c.month = month0 + 1; c.day = day
        c.hour = h; c.minute = m; c.second = s
        return cal.date(from: c) ?? Date()
    }
    private func comps(_ d: Date) -> (y: Int, m0: Int, day: Int) {
        let c = cal.dateComponents([.year, .month, .day], from: d)
        return (c.year ?? 0, (c.month ?? 1) - 1, c.day ?? 1)
    }
    private var today: Date { parse(localDateStr(), 0, 0, 0) }

    // MARK: payment helpers

    private func paidAmount(_ billId: String, _ ps: String) -> Double {
        billPayments["\(billId)-\(ps)"]?.paidAmount ?? 0
    }
    private func isPaidInPeriod(_ billId: String, _ ps: String) -> Bool {
        let r = billPayments["\(billId)-\(ps)"]
        return (r?.isPaid ?? false) || (r?.paidAmount ?? 0) > 0
    }
    private func isFullyPaid(_ bill: Bill, _ ps: String) -> Bool {
        let r = billPayments["\(bill.id)-\(ps)"]
        return (r?.isPaid ?? false) || (r?.paidAmount ?? 0) >= bill.amount
    }
    private func billPeriodCost(_ bill: Bill, _ ps: String) -> Double {
        isFullyPaid(bill, ps) ? paidAmount(bill.id, ps) : bill.amount
    }
    private func isSkipped(_ billId: String, _ ps: String) -> Bool {
        billSkips.contains("\(billId)-\(ps)")
    }

    // MARK: scheduling

    private func dueInMonth(_ day: Int?, _ pStart: Date, _ pEnd: Date) -> Bool {
        guard let day, day > 0 else { return false }
        let ps = comps(pStart)
        for cand in [ymd(ps.y, ps.m0, day, 23, 59, 59), ymd(ps.y, ps.m0 + 1, day, 23, 59, 59)] {
            if cand >= pStart && cand <= pEnd { return true }
        }
        return false
    }

    func isBillDueInPeriod(_ bill: Bill, _ pStart: Date, _ pEnd: Date) -> Bool {
        switch bill.frequency ?? "monthly" {
        case "one-time":
            guard let dd = bill.dueDate else { return false }
            let d = parse(dd, 12, 0, 0); return d >= pStart && d <= pEnd
        case "payday", "biweekly":
            return true
        case "quarterly":
            guard let dm = bill.dueMonth, let day = bill.dueDay else { return false }
            let startMonth = dm - 1, ps = comps(pStart)
            for off in [0, 3, 6, 9] {
                let m = (startMonth + off) % 12
                let y = ps.y + ((startMonth + off) >= 12 ? 1 : 0)
                let d = ymd(y, m, day, 23, 59, 59)
                if d >= pStart && d <= pEnd { return true }
            }
            return false
        case "annually":
            guard let dm = bill.dueMonth, let day = bill.dueDay else { return false }
            let ps = comps(pStart)
            for y in [ps.y, ps.y + 1] {
                let d = ymd(y, dm - 1, day, 23, 59, 59)
                if d >= pStart && d <= pEnd { return true }
            }
            return false
        case "semi-monthly":
            return dueInMonth(bill.dueDay, pStart, pEnd) || dueInMonth(bill.dueDay2, pStart, pEnd)
        default:
            return dueInMonth(bill.dueDay, pStart, pEnd)
        }
    }

    // Effective date for sorting a bill within a period.
    private func billActualDate(_ bill: Bill, _ pStart: Date, _ pEnd: Date) -> Date {
        let f = bill.frequency ?? "monthly"
        if f == "one-time", let dd = bill.dueDate { return parse(dd, 12, 0, 0) }
        if f == "payday" || f == "biweekly" { return pStart }
        guard let day = bill.dueDay, day > 0 else { return pEnd }
        let ps = comps(pStart)
        for cand in [ymd(ps.y, ps.m0, day, 12, 0, 0), ymd(ps.y, ps.m0 + 1, day, 12, 0, 0)] {
            if cand >= pStart && cand <= pEnd { return cand }
        }
        return ymd(ps.y, ps.m0 + 1, day, 12, 0, 0)
    }

    // The date a bill lands in a period (for the spill-over rule), or nil.
    private func billDueDate(_ bill: Bill, _ pStart: Date, _ pEnd: Date) -> Date? {
        let f = bill.frequency ?? "monthly"
        if f == "payday" || f == "biweekly" { return pStart }
        if f == "one-time" {
            guard let dd = bill.dueDate else { return nil }
            let d = parse(dd, 12, 0, 0); return (d >= pStart && d <= pEnd) ? d : nil
        }
        let days = (f == "semi-monthly") ? [bill.dueDay, bill.dueDay2] : [bill.dueDay]
        let ps = comps(pStart)
        for dayOpt in days {
            guard let day = dayOpt, day > 0 else { continue }
            for mo in [0, 1] {
                let d = ymd(ps.y, ps.m0 + mo, day, 12, 0, 0)
                if d >= pStart && d <= pEnd { return d }
            }
        }
        return nil
    }

    // Pay dates an income source lands on within a period.
    private func incomePayDates(_ inc: Income, _ pStart: Date, _ pEnd: Date) -> [String] {
        guard let npd = inc.nextPayDate, inc.fixedAmount != nil else { return [] }
        let base = parse(npd, 12, 0, 0)
        let interval = inc.frequency == "weekly" ? 7 : (inc.frequency == "biweekly" ? 14 : 0)
        var out: [String] = []
        if interval == 0 {
            let payDay = comps(base).day
            let ps = comps(pStart), pe = comps(pEnd)
            for cand in [ymd(ps.y, ps.m0, payDay, 12, 0, 0), ymd(pe.y, pe.m0, payDay, 12, 0, 0)] {
                if cand >= pStart && cand <= pEnd { out.append(localDateStr(cand)) }
            }
        } else {
            var d = base
            while d > pEnd { d = cal.date(byAdding: .day, value: -interval, to: d)! }
            while d < pStart { d = cal.date(byAdding: .day, value: interval, to: d)! }
            while d <= pEnd {
                if d >= pStart { out.append(localDateStr(d)) }
                d = cal.date(byAdding: .day, value: interval, to: d)!
            }
        }
        // De-dupe identical dates, preserve order.
        var seen = Set<String>()
        return out.filter { seen.insert($0).inserted }
    }

    // MARK: main computation

    func compute() -> (tiles: ProjectionTiles, rows: [PeriodRow]) {
        let t = today
        let acctById = accountsById

        let availableNow = accounts
            .filter { $0.isPrimary == true && $0.isAccumulating != true }
            .reduce(0) { $0 + ($1.currentBalance ?? 0) }

        // Upcoming periods (not fully past), sorted, max 10.
        let periods = payPeriods
            .filter { parse($0.endDate, 12, 0, 0) >= t }
            .sorted { $0.startDate < $1.startDate }
            .prefix(10)

        var rows: [PeriodRow] = []
        var running = availableNow

        for p in periods {
            let pStart = parse(p.startDate, 0, 0, 0)
            let pEnd = parse(p.endDate, 23, 59, 59)
            let pk = p.startDate
            let isCurrent = pStart <= t && pEnd >= t

            let periodBills = bills
                .filter { isBillDueInPeriod($0, pStart, pEnd) }
                .sorted {
                    let a = billActualDate($0, pStart, pEnd), b = billActualDate($1, pStart, pEnd)
                    return a == b ? $0.name.localizedCompare($1.name) == .orderedAscending : a < b
                }

            // billsTotal (net of paid), then billsDeducted (minus skipped-unpaid).
            let billsTotal = periodBills.reduce(0.0) { sum, b in
                isFullyPaid(b, pk) ? sum : sum + max(0, b.amount - paidAmount(b.id, pk))
            }
            let skippedUnpaid = periodBills.reduce(0.0) { sum, b in
                isSkipped(b.id, pk) ? sum + (b.amount - paidAmount(b.id, pk)) : sum
            }
            let billsDeducted = billsTotal - skippedUnpaid

            // Income items landing in the period.
            var items: [(income: Income, payDate: String)] = []
            for inc in income {
                for pd in incomePayDates(inc, pStart, pEnd) { items.append((inc, pd)) }
            }

            // Pending income for the running balance.
            let pendingIncome = items.reduce(0.0) { sum, it in
                if earlyPayments.contains("\(it.income.id)-\(pk)") { return sum }
                if isCurrent && parse(it.payDate, 12, 0, 0) <= t { return sum }
                return sum + (it.income.fixedAmount ?? 0)
            }

            // Per-account unpaid template totals (current period), for transfer checks.
            var unpaidByAcct: [String: Double] = [:]
            if isCurrent {
                for b in periodBills where !isSkipped(b.id, pk) && !isPaidInPeriod(b.id, pk) {
                    if let aid = b.accountId { unpaidByAcct[aid, default: 0] += b.amount }
                }
            }

            // billsForEndBalance
            let billsForEnd = periodBills.reduce(0.0) { sum, b in
                if isSkipped(b.id, pk) { return sum }
                if isCurrent && isPaidInPeriod(b.id, pk) { return sum }
                if let aid = b.accountId, let acct = acctById[aid] {
                    if acct.isAccumulating == true { return sum }
                    let isPrimary = (acct.isPrimary == true) && acct.isAccumulating != true
                    if !isPrimary && isCurrent {
                        let need = unpaidByAcct[aid] ?? 0
                        if (transfers[aid] ?? 0) >= need { return sum }
                    }
                }
                return sum + billPeriodCost(b, pk)
            }

            let startBalance = running
            let endBalance = startBalance + pendingIncome - billsForEnd
            running = endBalance

            rows.append(PeriodRow(
                id: p.id, name: p.name, start: p.startDate, end: p.endDate,
                startBalance: startBalance, pendingIncome: pendingIncome,
                billsDeducted: billsDeducted, endBalance: endBalance,
                isCurrent: isCurrent, bills: periodBills, incomeItems: items
            ))
        }

        // Current calendar-month boundaries.
        let tc = comps(t)
        let monthEnd = ymd(tc.y, tc.m0 + 1, 0, 23, 59, 59)

        // Income This Month — future deposits this month not yet received.
        var incomeThisMonth = 0.0
        for r in rows {
            for it in r.incomeItems {
                let d = parse(it.payDate, 12, 0, 0)
                let dc = comps(d)
                let future = d > t
                let thisMonth = dc.m0 == tc.m0 && dc.y == tc.y
                let notEarly = !earlyPayments.contains("\(it.income.id)-\(r.start)")
                if future && thisMonth && notEarly { incomeThisMonth += it.income.fixedAmount ?? 0 }
            }
        }

        // Bills Remaining — granular spill-over rule.
        var billsRemaining = 0.0
        for r in rows {
            let pStart = parse(r.start, 0, 0, 0)
            let pEnd = parse(r.end, 23, 59, 59)
            if r.isCurrent { billsRemaining += r.billsDeducted; continue }
            if pStart > monthEnd { continue }
            if pEnd <= monthEnd { billsRemaining += r.billsDeducted; continue }
            // spill-over: only bills due on/before month end, at remaining amount
            for b in r.bills where !isSkipped(b.id, r.start) {
                if let due = billDueDate(b, pStart, pEnd), due <= monthEnd {
                    billsRemaining += max(0, b.amount - paidAmount(b.id, r.start))
                }
            }
        }

        // fundedThisPeriod correction (current row, confirmed transfers).
        var funded = 0.0
        if let cur = rows.first(where: { $0.isCurrent }) {
            var unpaidRemainByAcct: [String: Double] = [:]
            for b in cur.bills where !isSkipped(b.id, cur.start) && !isPaidInPeriod(b.id, cur.start) {
                if let aid = b.accountId { unpaidRemainByAcct[aid, default: 0] += (b.amount - paidAmount(b.id, cur.start)) }
            }
            for b in cur.bills {
                if isSkipped(b.id, cur.start) || isPaidInPeriod(b.id, cur.start) { continue }
                guard let aid = b.accountId, let acct = acctById[aid] else { continue }
                if acct.isPrimary == true || acct.isAccumulating == true { continue }
                if (transfers[aid] ?? 0) >= (unpaidRemainByAcct[aid] ?? 0) {
                    funded += b.amount - paidAmount(b.id, cur.start)
                }
            }
        }

        var tiles = ProjectionTiles()
        tiles.availableNow = availableNow
        tiles.incomeThisMonth = incomeThisMonth
        tiles.billsRemaining = billsRemaining
        tiles.availableThisMonth = availableNow + incomeThisMonth - billsRemaining + funded
        return (tiles, rows)
    }
}

extension AppStore {
    var projection: Projection {
        Projection(accounts: accounts, income: income, bills: bills, payPeriods: payPeriods,
                   billPayments: billPayments, billSkips: billSkips,
                   earlyPayments: earlyPayments, transfers: transfers)
    }
}
