import SwiftUI

private func ordinal(_ n: Int) -> String {
    let suffix: String
    switch n % 100 {
    case 11, 12, 13: suffix = "th"
    default:
        switch n % 10 {
        case 1: suffix = "st"; case 2: suffix = "nd"; case 3: suffix = "rd"
        default: suffix = "th"
        }
    }
    return "\(n)\(suffix)"
}

// MARK: - Bills

struct BillsView: View {
    @EnvironmentObject var store: AppStore

    var body: some View {
        let active = store.bills.filter { $0.isActive != false }
        let recurring = active
            .filter { Finance.billMult($0.frequency) > 0 }
            .sorted { $0.amount * Finance.billMult($0.frequency) > $1.amount * Finance.billMult($1.frequency) }
        let oneTime = active.filter { ($0.frequency ?? "") == "one-time" }

        Page(title: "Bills", subtitle: "Everything you owe on a schedule") { _ in
            HStack(spacing: 12) {
                StatTile(label: "Monthly Bills", value: Finance.monthlyBills(active), accent: .sWarn)
                StatTile(label: "Yearly Bills", value: Finance.monthlyBills(active) * 12, accent: .sWarn)
                StatTile(label: "Active Bills", value: Double(recurring.count), accent: .sAccent, isCount: true)
            }

            Panel(title: "Recurring", count: recurring.count) {
                if recurring.isEmpty {
                    EmptyRow(text: "No recurring bills")
                } else {
                    ForEach(recurring) { b in
                        Row(name: b.name, sub: billSub(b),
                            amount: b.amount, amountColor: .sInk,
                            trailing: "\(money(b.amount * Finance.billMult(b.frequency)))/mo")
                    }
                }
            }

            if !oneTime.isEmpty {
                Panel(title: "One-time", count: oneTime.count) {
                    ForEach(oneTime) { b in
                        Row(name: b.name, sub: (b.category ?? "Other"), amount: b.amount)
                    }
                }
            }
        }
    }

    private func billSub(_ b: Bill) -> String {
        var parts: [String] = []
        if let c = b.category, !c.isEmpty { parts.append(c) }
        parts.append(Finance.freqLabel(b.frequency))
        if let d = b.dueDay, d > 0, (b.frequency ?? "monthly") != "one-time" { parts.append("Due \(ordinal(d))") }
        return parts.joined(separator: " · ")
    }
}

// MARK: - Income

struct IncomeView: View {
    @EnvironmentObject var store: AppStore

    var body: some View {
        let active = store.income.filter { $0.isActive != false }
        let sorted = active.sorted {
            ($0.fixedAmount ?? 0) * Finance.incMult($0.frequency) > ($1.fixedAmount ?? 0) * Finance.incMult($1.frequency)
        }

        Page(title: "Income", subtitle: "What comes in each month") { _ in
            HStack(spacing: 12) {
                StatTile(label: "Monthly Income", value: Finance.monthlyIncome(active), accent: .sGood)
                StatTile(label: "Yearly Income", value: Finance.monthlyIncome(active) * 12, accent: .sGood)
                StatTile(label: "Sources", value: Double(active.count), accent: .sAccent, isCount: true)
            }

            Panel(title: "Income Sources", count: active.count) {
                if sorted.isEmpty {
                    EmptyRow(text: "No income added yet")
                } else {
                    ForEach(sorted) { i in
                        Row(name: i.name,
                            sub: Finance.freqLabel(i.frequency) + (i.owner.map { " · \($0.capitalized)" } ?? ""),
                            amount: i.fixedAmount ?? 0, amountColor: .sGood,
                            trailing: "\(money((i.fixedAmount ?? 0) * Finance.incMult(i.frequency)))/mo")
                    }
                }
            }
        }
    }
}

// MARK: - Accounts

struct AccountsView: View {
    @EnvironmentObject var store: AppStore

    var body: some View {
        let assets = store.accounts.filter { $0.accountType != "credit" }.reduce(0) { $0 + ($1.currentBalance ?? 0) }
        let credit = store.accounts.filter { $0.accountType == "credit" }.reduce(0) { $0 + ($1.currentBalance ?? 0) }
        let sorted = store.accounts.sorted { $0.name < $1.name }

        Page(title: "Accounts", subtitle: "Balances across your accounts") { _ in
            HStack(spacing: 12) {
                StatTile(label: "Cash & Savings", value: assets, accent: .sGood)
                StatTile(label: "Credit Owed", value: credit, accent: credit > 0 ? .sBad : .sMuted)
                StatTile(label: "Net", value: assets - credit, accent: assets - credit < 0 ? .sBad : .sAccent)
            }

            Panel(title: "Your Accounts", count: store.accounts.count) {
                if sorted.isEmpty {
                    EmptyRow(text: "No accounts yet")
                } else {
                    ForEach(sorted) { a in
                        Row(name: a.name,
                            sub: subFor(a),
                            amount: a.currentBalance ?? 0,
                            amountColor: a.accountType == "credit" ? .sBad : .sInk)
                    }
                }
            }
        }
    }

    private func subFor(_ a: Account) -> String {
        var parts = [a.accountType.capitalized]
        if a.isPrimary == true { parts.append("Primary") }
        return parts.joined(separator: " · ")
    }
}

// MARK: - Debts

struct DebtsView: View {
    @EnvironmentObject var store: AppStore

    var body: some View {
        let open = store.debts.filter { $0.isPaidOff != true }
        let totalBalance = open.reduce(0) { $0 + $1.balance }
        let totalMin = open.reduce(0) { $0 + ($1.minimumPayment ?? 0) }

        Page(title: "Debts", subtitle: "What you're paying down") { _ in
            HStack(spacing: 12) {
                StatTile(label: "Total Debt", value: totalBalance, accent: .sBad)
                StatTile(label: "Min Payments / mo", value: totalMin, accent: .sWarn)
                StatTile(label: "Open Debts", value: Double(open.count), accent: .sAccent, isCount: true)
            }

            Panel(title: "Debts", count: open.count) {
                if open.isEmpty {
                    EmptyRow(text: "No debts — nice.")
                } else {
                    ForEach(open) { d in
                        Row(name: d.name, sub: debtSub(d),
                            amount: d.balance, amountColor: .sBad,
                            trailing: d.minimumPayment.map { "\(money($0))/mo min" })
                    }
                }
            }
        }
    }

    private func debtSub(_ d: Debt) -> String {
        var parts: [String] = []
        if let c = d.category, !c.isEmpty { parts.append(c) }
        if let r = d.interestRate, r > 0 {
            parts.append(String(format: "%.2f%% APR", r * 100))
        }
        if let payoff = Finance.payoffLabel(d.monthsRemaining) {
            parts.append("Payoff \(payoff)")
        }
        return parts.joined(separator: " · ")
    }
}

// MARK: - Pay Periods

struct PayPeriodsView: View {
    @EnvironmentObject var store: AppStore

    var body: some View {
        Page(title: "Pay Periods", subtitle: "How your month is split up") { _ in
            Panel(title: "Pay Periods", count: store.payPeriods.count) {
                if store.payPeriods.isEmpty {
                    EmptyRow(text: "No pay periods yet")
                } else {
                    ForEach(store.payPeriods) { p in
                        Row(name: p.name,
                            sub: "\(shortDate(p.startDate)) – \(shortDate(p.endDate))",
                            amount: nil,
                            badge: isCurrent(p) ? "Current" : nil)
                    }
                }
            }
        }
    }

    private func isCurrent(_ p: PayPeriod) -> Bool {
        let f = DateFormatter(); f.dateFormat = "yyyy-MM-dd"
        guard let s = f.date(from: String(p.startDate.prefix(10))),
              let e = f.date(from: String(p.endDate.prefix(10))) else { return false }
        let now = Date()
        return now >= s && now <= Calendar.current.date(byAdding: .day, value: 1, to: e)!
    }
}
