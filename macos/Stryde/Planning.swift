import SwiftUI

// MARK: - Budget

let BUDGET_TEMPLATE_NAMES = [
    "Housing / Rent", "Utilities", "Groceries", "Dining Out", "Transportation",
    "Auto & Gas", "Insurance", "Health & Medical", "Phone & Internet", "Subscriptions",
    "Entertainment", "Personal Care", "Clothing", "Childcare", "Pets",
    "Debt Payments", "Gifts & Donations", "Savings", "Miscellaneous",
]

struct BudgetLinePayload: Encodable { var householdId: String; var category: String; var amount: Double }

struct BudgetView: View {
    @EnvironmentObject var store: AppStore
    @State private var seeding = false

    private func billsMonthly(for cat: String) -> Double {
        let key = cat.trimmingCharacters(in: .whitespaces).lowercased()
        return store.bills
            .filter { $0.isActive != false && ($0.category ?? "").trimmingCharacters(in: .whitespaces).lowercased() == key }
            .reduce(0) { $0 + $1.amount * Finance.billMult($1.frequency) }
    }

    // Union of saved budget lines + any bill category not yet budgeted.
    private var rows: [(name: String, budget: Budget?)] {
        var map: [String: (name: String, budget: Budget?)] = [:]
        for b in store.budgets { map[b.category.lowercased()] = (b.category, b) }
        for c in Set(store.bills.filter { $0.isActive != false }
            .compactMap { $0.category }.map { $0.trimmingCharacters(in: .whitespaces) }.filter { !$0.isEmpty }) {
            if map[c.lowercased()] == nil { map[c.lowercased()] = (c, nil) }
        }
        return map.values.sorted { $0.name < $1.name }
    }

    var body: some View {
        let mIncome = Finance.monthlyIncome(store.income)
        let totalBudgeted = store.budgets.reduce(0) { $0 + $1.amount }
        let totalBills = Finance.monthlyBills(store.bills)
        let left = mIncome - totalBudgeted

        return Page(title: "Monthly Budget",
             subtitle: "Give every dollar a job. Your bills flow in by category — set targets for the rest.") { _ in
            if store.budgets.isEmpty {
                emptyState(totalBills: totalBills)
            } else {
                HStack(spacing: 12) {
                    StatTile(label: "Monthly Income", value: mIncome, accent: .sGood)
                    StatTile(label: "Budgeted", value: totalBudgeted, accent: .sAccent)
                    StatTile(label: "In Bills", value: totalBills, accent: .sWarn)
                    StatTile(label: "Left to Budget", value: left, accent: left < 0 ? .sBad : .sGood)
                }

                Panel(title: "Categories", count: rows.count) {
                    HStack {
                        Text("CATEGORY").font(.system(size: 9, weight: .semibold)).tracking(0.8).foregroundStyle(Color.sMuted)
                        Spacer()
                        Text("IN BILLS").font(.system(size: 9, weight: .semibold)).tracking(0.8).foregroundStyle(Color.sMuted).frame(width: 90, alignment: .trailing)
                        Text("BUDGETED").font(.system(size: 9, weight: .semibold)).tracking(0.8).foregroundStyle(Color.sMuted).frame(width: 120, alignment: .trailing)
                        Spacer().frame(width: 24)
                    }
                    .padding(.bottom, 6)
                    ForEach(rows, id: \.name) { r in
                        BudgetLineRow(category: r.name, existing: r.budget, billsAmt: billsMonthly(for: r.name))
                    }
                }
            }
        }
    }

    @ViewBuilder
    private func emptyState(totalBills: Double) -> some View {
        VStack(spacing: 14) {
            Image(systemName: "chart.pie.fill").font(.system(size: 34)).foregroundStyle(Color.sAccent)
            Text("Start your budget").font(.system(size: 18, weight: .bold, design: .rounded)).foregroundStyle(Color.sInk)
            Text("We'll set up common categories and pull your bills in automatically (\(money(totalBills))/mo). Adjust from there.")
                .font(.system(size: 13)).foregroundStyle(Color.sMuted).multilineTextAlignment(.center).frame(maxWidth: 420)
            Button {
                seedTemplate()
            } label: {
                Text(seeding ? "Setting up…" : "Create my budget")
                    .font(.system(size: 14, weight: .semibold)).foregroundStyle(.white)
                    .padding(.horizontal, 22).padding(.vertical, 11)
                    .background(Color.sAccent).clipShape(RoundedRectangle(cornerRadius: 8))
            }.buttonStyle(.plain).disabled(seeding)
        }
        .frame(maxWidth: .infinity).padding(.vertical, 40)
        .background(Color.sPanel).clipShape(RoundedRectangle(cornerRadius: 12))
        .overlay(RoundedRectangle(cornerRadius: 12).stroke(Color.sHair, lineWidth: 1))
    }

    private func seedTemplate() {
        guard let hid = store.household?.id, !seeding else { return }
        seeding = true
        var names = BUDGET_TEMPLATE_NAMES
        for c in Set(store.bills.compactMap { $0.category }.map { $0.trimmingCharacters(in: .whitespaces) }.filter { !$0.isEmpty }) {
            if !names.contains(where: { $0.lowercased() == c.lowercased() }) { names.append(c) }
        }
        Task {
            for n in names {
                let amt = (Double(round(billsMonthly(for: n) * 100)) / 100)
                await store.save("budgets", id: nil, BudgetLinePayload(householdId: hid, category: n, amount: amt))
            }
            seeding = false
        }
    }
}

struct BudgetLineRow: View {
    @EnvironmentObject var store: AppStore
    let category: String
    let existing: Budget?
    let billsAmt: Double
    @State private var text = ""

    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 2) {
                Text(category).font(.system(size: 13, weight: .medium)).foregroundStyle(Color.sInk)
                if billsAmt > 0 {
                    Text("from bills").font(.system(size: 11)).foregroundStyle(Color.sMuted)
                }
            }
            Spacer()
            Text(billsAmt > 0 ? money(billsAmt) : "—")
                .font(.system(size: 12, design: .monospaced)).foregroundStyle(billsAmt > 0 ? Color.sMuted : Color.sMuted.opacity(0.5))
                .frame(width: 90, alignment: .trailing)
            TextField("0", text: $text)
                .textFieldStyle(.plain).multilineTextAlignment(.trailing)
                .font(.system(size: 13, design: .monospaced)).foregroundStyle(Color.sInk)
                .padding(.horizontal, 10).padding(.vertical, 6)
                .background(Color.white.opacity(0.04)).clipShape(RoundedRectangle(cornerRadius: 6))
                .overlay(RoundedRectangle(cornerRadius: 6).stroke(Color.white.opacity(0.1), lineWidth: 1))
                .frame(width: 120)
                .onSubmit(save)
            Group {
                if let e = existing {
                    Button { Task { await store.remove("budgets", id: e.id) } } label: {
                        Image(systemName: "xmark").font(.system(size: 10)).foregroundStyle(Color.sBad)
                    }.buttonStyle(.plain)
                } else {
                    Spacer().frame(width: 12)
                }
            }
            .frame(width: 24)
        }
        .padding(.vertical, 8)
        .overlay(Rectangle().fill(Color.white.opacity(0.04)).frame(height: 1), alignment: .bottom)
        .onAppear { text = (existing?.amount).map { $0 == $0.rounded() ? String(Int($0)) : String($0) } ?? "" }
    }

    private func save() {
        let amt = Double(text.filter { "0123456789.".contains($0) }) ?? 0
        if let e = existing, e.amount == amt { return }
        Task { await store.save("budgets", id: existing?.id, BudgetLinePayload(householdId: store.household?.id ?? "", category: category, amount: amt)) }
    }
}
