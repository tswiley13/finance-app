import Foundation
import AppKit

func copyToPasteboard(_ s: String) {
    NSPasteboard.general.clearContents()
    NSPasteboard.general.setString(s, forType: .string)
}

// Swift port of client/src/financialSummary.js — AI-ready Markdown + CSV.
enum FinancialSummary {

    private static func fmtMoney(_ n: Double) -> String { money(n) }
    private static func fmtDateLong(_ s: String) -> String {
        let f = DateFormatter(); f.dateFormat = "yyyy-MM-dd"
        guard let d = f.date(from: String(s.prefix(10))) else { return s }
        let o = DateFormatter(); o.dateFormat = "MMM d, yyyy"; return o.string(from: d)
    }
    private static func num(_ n: Double?) -> String { String(format: "%.2f", n ?? 0) }
    private static func pct(_ rate: Double?) -> String {
        guard let r = rate else { return "" }
        var s = String(format: "%.2f", r * 100)
        if s.hasSuffix(".00") { s = String(s.dropLast(3)) }
        return s + "%"
    }
    private static func acctKind(_ a: Account) -> String {
        if a.isPrimary == true && a.isAccumulating != true { return "primary checking (spending)" }
        if a.isAccumulating == true { return a.accumulationTarget != nil ? "sinking fund (saving toward a target)" : "sinking fund" }
        switch a.accountType { case "savings": return "savings"; case "credit": return "credit"; case "checking": return "checking"; default: return a.accountType }
    }
    private static func billCadence(_ b: Bill) -> String {
        switch b.frequency ?? "monthly" {
        case "one-time":     return b.dueDate.map { "one-time \(shortDate($0))" } ?? "one-time"
        case "payday":       return "every payday"
        case "biweekly":     return "biweekly"
        case "weekly":       return "weekly"
        case "semi-monthly": return "semi-monthly (\(b.dueDay ?? 0) & \(b.dueDay2 ?? 0))"
        case "quarterly":    return "quarterly"
        case "annually":     return "annually"
        default:             return b.dueDay.map { "monthly (due \($0))" } ?? "monthly"
        }
    }
    private static func incomePerMonth(_ i: Income) -> Double { (i.fixedAmount ?? 0) * Finance.incMult(i.frequency) }
    private static func billPerMonth(_ b: Bill) -> Double { b.amount * Finance.billMult(b.frequency) }
    private static func acctName(_ accounts: [Account], _ id: String?) -> String {
        accounts.first { $0.id == id }?.name ?? "—"
    }
    private static func csvCell(_ v: String) -> String {
        v.contains(where: { "\",\n".contains($0) }) ? "\"\(v.replacingOccurrences(of: "\"", with: "\"\""))\"" : v
    }

    @MainActor
    static func build(store: AppStore, tiles: ProjectionTiles, rows: [PeriodRow]) -> (markdown: String, csv: String) {
        let accounts = store.accounts, income = store.income, bills = store.bills
        let openDebts = store.debts.filter { $0.isPaidOff != true }.sorted { $0.balance > $1.balance }
        let recurring = bills.filter { $0.isActive != false && ($0.frequency ?? "monthly") != "one-time" }
            .sorted { $0.amount > $1.amount }
        let oneTime = bills.filter { $0.isActive != false && ($0.frequency ?? "monthly") == "one-time" }
            .sorted { ($0.dueDate ?? "") < ($1.dueDate ?? "") }
        let activeIncome = income.filter { $0.isActive != false }

        let totalAccounts = accounts.reduce(0) { $0 + ($1.currentBalance ?? 0) }
        let totalDebt = openDebts.reduce(0) { $0 + $1.balance }
        let totalMin = openDebts.reduce(0) { $0 + ($1.minimumPayment ?? 0) }
        let monthlyIncome = activeIncome.reduce(0) { $0 + incomePerMonth($1) }
        let monthlyBills = recurring.reduce(0) { $0 + billPerMonth($1) }
        let disc = store.household?.monthlyDiscretionary ?? 0
        let estFree = monthlyIncome - monthlyBills - disc
        let genStr = fmtDateLong(localDateStr())

        var md: [String] = []
        md.append("# Stryde Financial Summary")
        md.append("_Generated \(genStr)_")
        md.append("")
        md.append("You are helping me plan my personal finances. Below is a snapshot of my accounts, income, bills, debts, and my upcoming pay-period projection from my budgeting app. Please review it and help me with budgeting, saving, and debt payoff. Ask me anything you need.")
        md.append("")
        md.append("## Snapshot")
        md.append("- **Available now:** \(fmtMoney(tiles.availableNow))")
        md.append("- **Income remaining this month:** \(fmtMoney(tiles.incomeThisMonth))")
        md.append("- **Bills remaining this month:** \(fmtMoney(tiles.billsRemaining))")
        md.append("- **Projected available this month:** \(fmtMoney(tiles.availableThisMonth))")
        md.append("- **Total across accounts:** \(fmtMoney(totalAccounts))")
        md.append("- **Total debt (open):** \(fmtMoney(totalDebt))")
        md.append("- **Net position:** \(fmtMoney(totalAccounts - totalDebt))")
        md.append("- **Recurring monthly income (avg):** \(fmtMoney(monthlyIncome))")
        md.append("- **Recurring monthly bills (avg):** \(fmtMoney(monthlyBills))")
        if disc > 0 { md.append("- **Self-reported discretionary spending:** \(fmtMoney(disc))/mo") }
        md.append("- **Estimated monthly free cash (income − bills\(disc > 0 ? " − discretionary" : "")):** \(fmtMoney(estFree))")
        md.append("")
        if disc > 0 {
            md.append("> **Note:** discretionary spending above is a single self-reported estimate (\(fmtMoney(disc))/mo), not transaction data — it may not capture everything. Sanity-check the \"free cash\" figure against actual account balances before building a plan on it.")
        } else {
            md.append("> **Important — this export covers scheduled income and bills only. It does NOT include discretionary/variable spending (groceries beyond a set amount, dining, shopping, fuel, subscriptions not listed, cash, etc.).** If recurring income minus recurring bills looks like a large surplus but account balances are low, that gap is real spending happening outside these categories. Please account for it before advising how much is free to save or pay toward debt — ask me for a spending estimate rather than assuming the surplus is available.")
        }
        md.append("")

        md.append("## Accounts")
        if accounts.isEmpty { md.append("_None_") } else {
            md.append("| Account | Balance | Type |")
            md.append("|---|---|---|")
            for a in accounts { md.append("| \(a.name) | \(fmtMoney(a.currentBalance ?? 0)) | \(acctKind(a)) |") }
        }
        md.append("")

        md.append("## Income")
        if activeIncome.isEmpty { md.append("_None_") } else {
            md.append("| Source | Per check | Frequency | Monthly |")
            md.append("|---|---|---|---|")
            for i in activeIncome { md.append("| \(i.name) | \(fmtMoney(i.fixedAmount ?? 0)) | \(i.frequency) | \(fmtMoney(incomePerMonth(i))) |") }
            md.append("| **Total** | | | **\(fmtMoney(monthlyIncome))** |")
        }
        md.append("")

        md.append("## Bills")
        md.append("Recurring monthly obligation: **\(fmtMoney(monthlyBills))**")
        md.append("")
        if recurring.isEmpty { md.append("_No recurring bills_") } else {
            md.append("| Bill | Amount | Cadence | Account |")
            md.append("|---|---|---|---|")
            for b in recurring { md.append("| \(b.name) | \(fmtMoney(b.amount)) | \(billCadence(b)) | \(acctName(accounts, b.accountId)) |") }
        }
        md.append("")
        if !oneTime.isEmpty {
            md.append("**Upcoming one-time payments:**")
            md.append("")
            md.append("| Payment | Amount | Date |")
            md.append("|---|---|---|")
            for b in oneTime { md.append("| \(b.name) | \(fmtMoney(b.amount)) | \(b.dueDate.map { shortDate($0) } ?? "—") |") }
            md.append("")
        }

        md.append("## Debts")
        if openDebts.isEmpty { md.append("_No open debts_ 🎉") } else {
            md.append("| Debt | Balance | Original | APR | Min payment | Months left | Est. payoff |")
            md.append("|---|---|---|---|---|---|---|")
            for d in openDebts {
                let left = (d.monthsRemaining ?? 0) > 0 ? "\(d.monthsRemaining!)\(d.termMonths.map { " / \($0)" } ?? "")" : "—"
                md.append("| \(d.name) | \(fmtMoney(d.balance)) | \(d.originalBalance.map { fmtMoney($0) } ?? "—") | \(pct(d.interestRate).isEmpty ? "—" : pct(d.interestRate)) | \(fmtMoney(d.minimumPayment ?? 0)) | \(left) | \(Finance.payoffLabel(d.monthsRemaining) ?? "—") |")
            }
            md.append("| **Total** | **\(fmtMoney(totalDebt))** | | | **\(fmtMoney(totalMin))** | | |")
        }
        md.append("")

        if !rows.isEmpty {
            md.append("## Pay-period projection")
            md.append("Each period: starting balance + income − bills = projected end balance. **This is a bills-only projection — it assumes $0 of discretionary spending, so the end balances are a ceiling, not a realistic forecast.** For the current period, bills already paid or pre-funded from a separate account aren't subtracted again, so its Bills figure may be lower than the total still due this period.")
            md.append("")
            md.append("| Period | Start | Income | Bills | End balance |")
            md.append("|---|---|---|---|---|")
            for r in rows {
                let billsOut = r.startBalance + r.pendingIncome - r.endBalance
                let label = "\(shortDate(r.start))–\(shortDate(r.end))\(r.isCurrent ? " (current)" : "")"
                md.append("| \(label) | \(fmtMoney(r.startBalance)) | \(fmtMoney(r.pendingIncome)) | \(fmtMoney(billsOut)) | \(fmtMoney(r.endBalance)) |")
            }
            md.append("")
        }

        // CSV
        var csv: [[String]] = [["Category", "Name", "Amount", "Detail", "Balance"]]
        for a in accounts { csv.append(["Account", a.name, "", acctKind(a), num(a.currentBalance)]) }
        for i in activeIncome { csv.append(["Income", i.name, num(i.fixedAmount), "\(i.frequency) (monthly \(num(incomePerMonth(i))))", ""]) }
        for b in recurring { csv.append(["Bill", b.name, num(b.amount), billCadence(b), ""]) }
        for b in oneTime { csv.append(["One-time bill", b.name, num(b.amount), b.dueDate ?? "", ""]) }
        for d in openDebts {
            var parts = ["\(pct(d.interestRate)) APR", "min \(num(d.minimumPayment))"]
            if let o = d.originalBalance { parts.append("orig \(num(o))") }
            if (d.monthsRemaining ?? 0) > 0 { parts.append("\(d.monthsRemaining!) mo left\(d.termMonths.map { " of \($0)" } ?? "")") }
            if let p = Finance.payoffLabel(d.monthsRemaining) { parts.append("payoff \(p)") }
            csv.append(["Debt", d.name, "", parts.joined(separator: ", "), num(d.balance)])
        }
        if disc > 0 { csv.append(["Spending", "Discretionary (self-reported)", num(disc), "average per month", ""]) }
        for r in rows {
            let billsOut = r.startBalance + r.pendingIncome - r.endBalance
            let label = "\(shortDate(r.start))-\(shortDate(r.end))\(r.isCurrent ? " (current)" : "")"
            csv.append(["Period", label, "", "start \(num(r.startBalance)), income \(num(r.pendingIncome)), bills \(num(billsOut))", num(r.endBalance)])
        }
        let csvStr = csv.map { $0.map(csvCell).joined(separator: ",") }.joined(separator: "\n")

        return (md.joined(separator: "\n"), csvStr)
    }
}
