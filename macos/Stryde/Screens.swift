import SwiftUI

private func ordinal(_ n: Int) -> String {
    switch n % 100 {
    case 11, 12, 13: return "\(n)th"
    default:
        switch n % 10 {
        case 1: return "\(n)st"; case 2: return "\(n)nd"; case 3: return "\(n)rd"
        default: return "\(n)th"
        }
    }
}

// A row that acts as a button (tap to edit).
private struct TapRow<Content: View>: View {
    let action: () -> Void
    @ViewBuilder var content: Content
    var body: some View {
        Button(action: action) { content }
            .buttonStyle(.plain)
    }
}

private struct AddBar: View {
    let title: String
    let action: () -> Void
    var body: some View {
        HStack { Spacer(); AddButton(title: title, action: action) }
    }
}

// MARK: - Income

struct IncomeView: View {
    @EnvironmentObject var store: AppStore
    @State private var editing: Editing<Income>?

    var body: some View {
        let active = store.income.filter { $0.isActive != false }
        let sorted = active.sorted {
            ($0.fixedAmount ?? 0) * Finance.incMult($0.frequency) > ($1.fixedAmount ?? 0) * Finance.incMult($1.frequency)
        }

        Page(title: "Income", subtitle: "What comes in each month") { _ in
            PlaidControls(showSync: true)
            AddBar(title: "Add income") { editing = Editing(nil) }

            HStack(spacing: 12) {
                StatTile(label: "Monthly Income", value: Finance.monthlyIncome(active), accent: .sGood)
                StatTile(label: "Yearly Income", value: Finance.monthlyIncome(active) * 12, accent: .sGood)
                StatTile(label: "Sources", value: Double(active.count), accent: .sAccent, isCount: true)
            }

            Panel(title: "Income Sources", count: active.count) {
                if sorted.isEmpty {
                    EmptyRow(text: "No income yet — add one above")
                } else {
                    ForEach(sorted) { i in
                        TapRow { editing = Editing(i) } content: {
                            Row(name: i.name,
                                sub: Finance.freqLabel(i.frequency) + (i.owner.map { " · \($0.capitalized)" } ?? ""),
                                amount: i.fixedAmount ?? 0, amountColor: .sGood,
                                trailing: "\(money((i.fixedAmount ?? 0) * Finance.incMult(i.frequency)))/mo")
                        }
                    }
                }
            }
        }
        .sheet(item: $editing) { IncomeEditor(existing: $0.value).environmentObject(store) }
    }
}

// MARK: - Accounts

struct AccountsView: View {
    @EnvironmentObject var store: AppStore
    @State private var editing: Editing<Account>?

    var body: some View {
        let assets = store.accounts.filter { $0.accountType != "credit" }.reduce(0) { $0 + ($1.currentBalance ?? 0) }
        let credit = store.accounts.filter { $0.accountType == "credit" }.reduce(0) { $0 + ($1.currentBalance ?? 0) }
        let sorted = store.accounts.sorted(by: primaryFirst)

        Page(title: "Accounts", subtitle: "Balances across your accounts") { _ in
            PlaidControls(showSync: true)
            AddBar(title: "Add account") { editing = Editing(nil) }

            HStack(spacing: 12) {
                StatTile(label: "Cash & Savings", value: assets, accent: .sGood)
                StatTile(label: "Credit Owed", value: credit, accent: credit > 0 ? .sBad : .sMuted)
                StatTile(label: "Net", value: assets - credit, accent: assets - credit < 0 ? .sBad : .sAccent)
            }

            Panel(title: "Your Accounts", count: store.accounts.count) {
                if sorted.isEmpty {
                    EmptyRow(text: "No accounts yet — add one above")
                } else {
                    ForEach(sorted) { a in
                        TapRow { editing = Editing(a) } content: {
                            Row(name: a.name, sub: subFor(a),
                                amount: a.currentBalance ?? 0,
                                amountColor: a.accountType == "credit" ? .sBad : .sInk,
                                badge: a.isAccumulating == true ? "Accumulating" : (a.isPrimary == true ? "Primary" : nil))
                        }
                    }
                }
            }
        }
        .sheet(item: $editing) { AccountEditor(existing: $0.value).environmentObject(store) }
    }

    private func subFor(_ a: Account) -> String {
        var parts = [a.accountType.capitalized]
        if let b = a.bankName, !b.isEmpty { parts.insert(b, at: 0) }
        return parts.joined(separator: " · ")
    }
}

// MARK: - Categories

struct CategoryPayload: Encodable { var householdId: String; var name: String }

struct CategoriesView: View {
    @EnvironmentObject var store: AppStore
    @State private var newName = ""

    var body: some View {
        Page(title: "Categories", subtitle: "Group your bills") { _ in
            Panel(title: "Add Category", count: store.categories.count) {
                HStack(spacing: 8) {
                    TextField("Category name", text: $newName).sInput()
                    Button {
                        let name = newName.trimmingCharacters(in: .whitespaces)
                        guard !name.isEmpty else { return }
                        newName = ""
                        Task { await store.save("categories", id: nil, CategoryPayload(householdId: store.household?.id ?? "", name: name)) }
                    } label: {
                        Text("Add").font(.system(size: 13, weight: .semibold)).foregroundStyle(.white)
                            .padding(.horizontal, 16).padding(.vertical, 9)
                            .background(Color.sAccent).clipShape(RoundedRectangle(cornerRadius: 8))
                    }.buttonStyle(.plain)
                }
                .padding(.top, 4)
            }

            Panel(title: "Your Categories", count: store.categories.count) {
                if store.categories.isEmpty {
                    EmptyRow(text: "No categories yet")
                } else {
                    ForEach(store.categories.sorted { $0.name < $1.name }) { c in
                        HStack {
                            Text(c.name).font(.system(size: 13, weight: .medium)).foregroundStyle(Color.sInk)
                            Spacer()
                            Button {
                                Task { await store.remove("categories", id: c.id) }
                            } label: {
                                Image(systemName: "trash").font(.system(size: 12)).foregroundStyle(Color.sBad)
                            }.buttonStyle(.plain)
                        }
                        .padding(.vertical, 9)
                        .overlay(Rectangle().fill(Color.white.opacity(0.04)).frame(height: 1), alignment: .bottom)
                    }
                }
            }
        }
    }
}

// MARK: - Debts

struct DebtsView: View {
    @EnvironmentObject var store: AppStore
    @State private var editing: Editing<Debt>?

    var body: some View {
        let open = store.debts.filter { $0.isPaidOff != true }
        let totalBalance = open.reduce(0) { $0 + $1.balance }
        let totalMin = open.reduce(0) { $0 + ($1.minimumPayment ?? 0) }

        Page(title: "Debts", subtitle: "What you're paying down") { _ in
            AddBar(title: "Add debt") { editing = Editing(nil) }

            HStack(spacing: 12) {
                StatTile(label: "Total Debt", value: totalBalance, accent: .sBad)
                StatTile(label: "Min Payments / mo", value: totalMin, accent: .sWarn)
                StatTile(label: "Open Debts", value: Double(open.count), accent: .sAccent, isCount: true)
            }

            Panel(title: "Debts", count: open.count) {
                if open.isEmpty {
                    EmptyRow(text: "No debts — add one above")
                } else {
                    ForEach(open) { d in
                        TapRow { editing = Editing(d) } content: {
                            Row(name: d.name, sub: debtSub(d),
                                amount: d.balance, amountColor: .sBad,
                                trailing: d.minimumPayment.map { "\(money($0))/mo min" })
                        }
                    }
                }
            }
        }
        .sheet(item: $editing) { DebtEditor(existing: $0.value).environmentObject(store) }
    }

    private func debtSub(_ d: Debt) -> String {
        var parts: [String] = []
        if let c = d.category, !c.isEmpty { parts.append(c) }
        if let r = d.interestRate, r > 0 { parts.append(String(format: "%.2f%% APR", r * 100)) }
        if let payoff = Finance.payoffLabel(d.monthsRemaining) { parts.append("Payoff \(payoff)") }
        return parts.joined(separator: " · ")
    }
}

// MARK: - Pay Periods

struct PayPeriodsView: View {
    @EnvironmentObject var store: AppStore
    @State private var confirmRegen = false
    @State private var regenerating = false
    @State private var expanded: Set<String> = []

    var body: some View {
        let rows = store.projection.compute().rows
        Page(title: "Pay Periods", subtitle: "Each period's income, bills, and projected end balance") { _ in
            HStack(spacing: 8) {
                Text("Built from your biweekly/weekly income and next pay dates.")
                    .font(.system(size: 11)).foregroundStyle(Color.sMuted)
                Spacer()
                Button { confirmRegen = true } label: {
                    HStack(spacing: 5) {
                        Image(systemName: "arrow.triangle.2.circlepath").font(.system(size: 11, weight: .bold))
                        Text(regenerating ? "Regenerating…" : "Regenerate").font(.system(size: 13, weight: .semibold))
                    }
                    .foregroundStyle(Color.sAccent).padding(.horizontal, 14).padding(.vertical, 8)
                    .overlay(RoundedRectangle(cornerRadius: 8).stroke(Color.sAccent.opacity(0.5), lineWidth: 1))
                }.buttonStyle(.plain).disabled(regenerating)
            }
            if rows.isEmpty {
                Panel(title: "Pay Periods", count: 0) { EmptyRow(text: "No upcoming pay periods — Regenerate to build them") }
            } else {
                ForEach(rows) { PayCard(row: $0, expanded: $expanded) }
            }
        }
        .alert("Regenerate pay periods?", isPresented: $confirmRegen) {
            Button("Regenerate", role: .destructive) {
                regenerating = true
                Task { await store.regeneratePayPeriods(); regenerating = false }
            }
            Button("Cancel", role: .cancel) {}
        } message: {
            Text("This replaces all pay periods with a fresh set built from your income cadence. Any per-period marks are keyed by date and will still line up.")
        }
    }
}
