import SwiftUI

struct BudgetLinePayload: Encodable { var householdId: String; var category: String; var amount: Double }

// The template: expense groups (income is pulled live from the Income page).
struct BudgetGroup: Identifiable {
    var id: String { name }
    let name: String
    let icon: String
    let color: Color
    let lines: [String]
}

let BUDGET_GROUPS: [BudgetGroup] = [
    .init(name: "Housing", icon: "house.fill", color: Color(red: 0x6C/255, green: 0x63/255, blue: 0xFF/255),
          lines: ["Rent / Mortgage", "Home Insurance", "Property Tax", "HOA Dues", "Repairs & Maintenance", "Furnishings"]),
    .init(name: "Utilities", icon: "bolt.fill", color: Color(red: 0xF5/255, green: 0x9E/255, blue: 0x0B/255),
          lines: ["Electricity", "Gas", "Water / Sewer / Trash", "Internet", "Phone", "Streaming / Cable"]),
    .init(name: "Transportation", icon: "car.fill", color: Color(red: 0x38/255, green: 0xBD/255, blue: 0xF8/255),
          lines: ["Car Payment", "Auto Insurance", "Fuel", "Maintenance & Repairs", "Registration", "Parking & Transit"]),
    .init(name: "Food", icon: "fork.knife", color: Color(red: 0x4A/255, green: 0xDE/255, blue: 0x80/255),
          lines: ["Groceries", "Dining Out", "Coffee"]),
    .init(name: "Health", icon: "heart.fill", color: Color(red: 0xF8/255, green: 0x71/255, blue: 0x71/255),
          lines: ["Health Insurance", "Doctor & Dentist", "Medications", "Fitness", "Pet Care"]),
    .init(name: "Personal", icon: "person.fill", color: Color(red: 0xE8/255, green: 0x7A/255, blue: 0xD6/255),
          lines: ["Clothing", "Personal Care", "Subscriptions", "Entertainment", "Hobbies"]),
    .init(name: "Family", icon: "figure.2.and.child.holdinghands", color: Color(red: 0xA9/255, green: 0x9D/255, blue: 0xFF/255),
          lines: ["Childcare", "Tuition / School", "Kids' Activities"]),
    .init(name: "Savings & Financial", icon: "banknote.fill", color: Color(red: 0x00/255, green: 0xD4/255, blue: 0xAA/255),
          lines: ["Emergency Fund", "Savings", "Investments", "Life Insurance"]),
    .init(name: "Debt Payments", icon: "creditcard.fill", color: Color(red: 0xFB/255, green: 0x92/255, blue: 0x3C/255),
          lines: ["Credit Cards", "Student Loans", "Personal Loans"]),
    .init(name: "Charity & Gifts", icon: "gift.fill", color: Color(red: 0xC0/255, green: 0x8C/255, blue: 0xFF/255),
          lines: ["Charitable Giving", "Religious Donations", "Gifts"]),
    .init(name: "Other", icon: "ellipsis.circle.fill", color: Color(red: 0x8B/255, green: 0x8F/255, blue: 0xA8/255),
          lines: ["Miscellaneous"]),
]

private let lineToGroup: [String: String] = {
    var m: [String: String] = [:]
    for g in BUDGET_GROUPS { for l in g.lines { m[l.lowercased()] = g.name } }
    return m
}()

extension AppStore {
    func groupFor(_ category: String) -> String {
        lineToGroup[category.trimmingCharacters(in: .whitespaces).lowercased()] ?? "Other"
    }
}

struct BudgetView: View {
    @EnvironmentObject var store: AppStore
    @State private var seeding = false
    @State private var collapsed: Set<String> = []
    @State private var newCat = ""
    @State private var confirmReset = false

    private func billsMonthly(for cat: String) -> Double {
        let key = cat.trimmingCharacters(in: .whitespaces).lowercased()
        return store.bills
            .filter { $0.isActive != false && ($0.category ?? "").trimmingCharacters(in: .whitespaces).lowercased() == key }
            .reduce(0) { $0 + $1.amount * Finance.billMult($1.frequency) }
    }

    // Budget rows grouped by their template group (custom lines fall to Other).
    private func linesForGroup(_ g: BudgetGroup) -> [(name: String, budget: Budget?)] {
        var map: [String: (String, Budget?)] = [:]
        // Saved rows that belong to this group.
        for b in store.budgets where store.groupFor(b.category) == g.name {
            map[b.category.lowercased()] = (b.category, b)
        }
        // Bill categories that belong to this group but aren't budgeted yet.
        for c in Set(store.bills.filter { $0.isActive != false }.compactMap { $0.category }
            .map { $0.trimmingCharacters(in: .whitespaces) }.filter { !$0.isEmpty })
        where store.groupFor(c) == g.name {
            if map[c.lowercased()] == nil { map[c.lowercased()] = (c, nil) }
        }
        return map.values.map { (name: $0.0, budget: $0.1) }.sorted { $0.name < $1.name }
    }

    var body: some View {
        let mIncome = Finance.monthlyIncome(store.income)
        let totalBudgeted = store.budgets.reduce(0) { $0 + $1.amount }
        let net = mIncome - totalBudgeted

        return Page(title: "Monthly Budget",
                    subtitle: "Give every dollar a job. Bills flow in by category — set targets for the rest.") { _ in
            if store.budgets.isEmpty {
                emptyState()
            } else {
                HStack {
                    Spacer()
                    Button { confirmReset = true } label: {
                        HStack(spacing: 5) {
                            Image(systemName: "arrow.triangle.2.circlepath").font(.system(size: 11, weight: .bold))
                            Text("Reset to template").font(.system(size: 12, weight: .semibold))
                        }
                        .foregroundStyle(Color.sMuted).padding(.horizontal, 12).padding(.vertical, 7)
                        .overlay(RoundedRectangle(cornerRadius: 8).stroke(Color.white.opacity(0.12), lineWidth: 1))
                    }.buttonStyle(.plain)
                }
                HStack(spacing: 12) {
                    StatTile(label: "Monthly Income", value: mIncome, accent: .sGreen)
                    StatTile(label: "Budgeted", value: totalBudgeted, accent: .sAccent)
                    StatTile(label: "Left to Budget", value: net, accent: net < 0 ? .sBad : .sGood)
                }

                if net != 0 {
                    Text(net < 0
                         ? "You've budgeted \(money(abs(net))) more than you bring in."
                         : "\(money(net)) still unassigned — a finished budget lands at $0 left.")
                        .font(.system(size: 12)).foregroundStyle(net < 0 ? Color.sBad : Color.sMuted)
                }

                // Income group (read-only, from actual income)
                incomeCard(total: mIncome)

                // Expense groups
                ForEach(BUDGET_GROUPS) { g in
                    let lines = linesForGroup(g)
                    if !lines.isEmpty { groupCard(g, lines: lines) }
                }

                // Add a custom line
                HStack(spacing: 8) {
                    TextField("Add a category (lands in Other)…", text: $newCat).sInput()
                    Button {
                        let n = newCat.trimmingCharacters(in: .whitespaces); guard !n.isEmpty else { return }
                        newCat = ""
                        Task { await store.save("budgets", id: nil, BudgetLinePayload(householdId: store.household?.id ?? "", category: n, amount: 0)) }
                    } label: {
                        Image(systemName: "plus").font(.system(size: 12, weight: .bold)).foregroundStyle(.white)
                            .padding(9).background(Color.sAccent).clipShape(RoundedRectangle(cornerRadius: 8))
                    }.buttonStyle(.plain)
                }
                .padding(.top, 4)
            }
        }
        .alert("Reset budget to template?", isPresented: $confirmReset) {
            Button("Reset", role: .destructive) { resetTemplate() }
            Button("Cancel", role: .cancel) {}
        } message: {
            Text("This clears your current budget lines and rebuilds the grouped template, pulling your bills back in.")
        }
    }

    private func resetTemplate() {
        guard let hid = store.household?.id, !seeding else { return }
        seeding = true
        Task {
            try? await store.client.from("budgets").delete().eq("household_id", value: hid).execute()
            var names = BUDGET_GROUPS.flatMap { $0.lines }
            for c in Set(store.bills.compactMap { $0.category }.map { $0.trimmingCharacters(in: .whitespaces) }.filter { !$0.isEmpty }) {
                if !names.contains(where: { $0.lowercased() == c.lowercased() }) { names.append(c) }
            }
            let payloads = names.map { BudgetLinePayload(householdId: hid, category: $0, amount: (Double(round(billsMonthly(for: $0) * 100)) / 100)) }
            await store.insertMany("budgets", payloads)
            seeding = false
        }
    }

    // MARK: income card

    private func incomeCard(total: Double) -> some View {
        VStack(spacing: 0) {
            HStack(spacing: 10) {
                Image(systemName: "arrow.down.circle.fill").font(.system(size: 15)).foregroundStyle(Color.sGreen)
                Text("Income").font(.system(size: 14, weight: .semibold)).foregroundStyle(Color.sInk)
                Spacer()
                Text(money(total)).font(.system(size: 14, weight: .semibold, design: .monospaced)).foregroundStyle(Color.sGreen)
            }
            .padding(.bottom, 8)
            ForEach(store.income.filter { $0.isActive != false }.sorted { ($0.fixedAmount ?? 0) * Finance.incMult($0.frequency) > ($1.fixedAmount ?? 0) * Finance.incMult($1.frequency) }) { i in
                HStack {
                    Text(i.name).font(.system(size: 13)).foregroundStyle(Color.sInk)
                    Text(Finance.freqLabel(i.frequency)).font(.system(size: 11)).foregroundStyle(Color.sMuted)
                    Spacer()
                    Text(money((i.fixedAmount ?? 0) * Finance.incMult(i.frequency))).font(.system(size: 13, design: .monospaced)).foregroundStyle(Color.sMuted)
                }
                .padding(.vertical, 7)
                .overlay(Rectangle().fill(Color.white.opacity(0.04)).frame(height: 1), alignment: .bottom)
            }
        }
        .padding(18)
        .background(Color.sPanel)
        .overlay(alignment: .leading) { Rectangle().fill(Color.sGreen).frame(width: 3) }
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .overlay(RoundedRectangle(cornerRadius: 12).stroke(Color.white.opacity(0.06), lineWidth: 1))
    }

    // MARK: group card

    private func groupCard(_ g: BudgetGroup, lines: [(name: String, budget: Budget?)]) -> some View {
        let subtotal = lines.reduce(0.0) { $0 + ($1.budget?.amount ?? 0) }
        let isOpen = !collapsed.contains(g.name)
        return VStack(spacing: 0) {
            Button {
                if isOpen { collapsed.insert(g.name) } else { collapsed.remove(g.name) }
            } label: {
                HStack(spacing: 10) {
                    Image(systemName: g.icon).font(.system(size: 13)).foregroundStyle(g.color).frame(width: 20)
                    Text(g.name).font(.system(size: 14, weight: .semibold)).foregroundStyle(Color.sInk)
                    Spacer()
                    Text(money(subtotal)).font(.system(size: 14, weight: .semibold, design: .monospaced)).foregroundStyle(Color.sInk)
                    Image(systemName: isOpen ? "chevron.up" : "chevron.down").font(.system(size: 11)).foregroundStyle(Color.sMuted)
                }
            }.buttonStyle(.plain)

            if isOpen {
                VStack(spacing: 0) {
                    HStack {
                        Spacer()
                        Text("IN BILLS").font(.system(size: 9, weight: .semibold)).tracking(0.6).foregroundStyle(Color.sMuted).frame(width: 90, alignment: .trailing)
                        Text("BUDGETED").font(.system(size: 9, weight: .semibold)).tracking(0.6).foregroundStyle(Color.sMuted).frame(width: 110, alignment: .trailing)
                        Spacer().frame(width: 22)
                    }
                    .padding(.top, 10).padding(.bottom, 2)
                    ForEach(lines, id: \.name) { line in
                        BudgetLineRow(category: line.name, existing: line.budget, billsAmt: billsMonthly(for: line.name), accent: g.color)
                    }
                }
            }
        }
        .padding(18)
        .background(Color.sPanel)
        .overlay(alignment: .leading) { Rectangle().fill(g.color).frame(width: 3) }
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .overlay(RoundedRectangle(cornerRadius: 12).stroke(Color.white.opacity(0.06), lineWidth: 1))
    }

    // MARK: empty state

    @ViewBuilder
    private func emptyState() -> some View {
        let totalBills = Finance.monthlyBills(store.bills)
        VStack(spacing: 14) {
            Image(systemName: "chart.pie.fill").font(.system(size: 34)).foregroundStyle(Color.sAccent)
            Text("Build your budget").font(.system(size: 18, weight: .bold, design: .rounded)).foregroundStyle(Color.sInk)
            Text("We'll set up the common expense groups — Housing, Utilities, Transportation, Food, Health and more — and pull your bills in automatically (\(money(totalBills))/mo). Adjust the targets from there.")
                .font(.system(size: 13)).foregroundStyle(Color.sMuted).multilineTextAlignment(.center).frame(maxWidth: 460)
            Button { seedTemplate() } label: {
                Text(seeding ? "Setting up…" : "Create my budget")
                    .font(.system(size: 14, weight: .semibold)).foregroundStyle(.white)
                    .padding(.horizontal, 22).padding(.vertical, 11).background(Color.sAccent).clipShape(RoundedRectangle(cornerRadius: 8))
            }.buttonStyle(.plain).disabled(seeding)
        }
        .frame(maxWidth: .infinity).padding(.vertical, 44)
        .background(Color.sPanel).clipShape(RoundedRectangle(cornerRadius: 12))
        .overlay(RoundedRectangle(cornerRadius: 12).stroke(Color.white.opacity(0.06), lineWidth: 1))
    }

    private func seedTemplate() {
        guard let hid = store.household?.id, !seeding else { return }
        seeding = true
        var names = BUDGET_GROUPS.flatMap { $0.lines }
        for c in Set(store.bills.compactMap { $0.category }.map { $0.trimmingCharacters(in: .whitespaces) }.filter { !$0.isEmpty }) {
            if !names.contains(where: { $0.lowercased() == c.lowercased() }) { names.append(c) }
        }
        let payloads = names.map { BudgetLinePayload(householdId: hid, category: $0, amount: (Double(round(billsMonthly(for: $0) * 100)) / 100)) }
        Task { await store.insertMany("budgets", payloads); seeding = false }
    }
}

struct BudgetLineRow: View {
    @EnvironmentObject var store: AppStore
    let category: String
    let existing: Budget?
    let billsAmt: Double
    var accent: Color = .sAccent
    @State private var text = ""

    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 2) {
                Text(category).font(.system(size: 13, weight: .medium)).foregroundStyle(Color.sInk)
                if billsAmt > 0 { Text("from bills").font(.system(size: 11)).foregroundStyle(Color.sMuted) }
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
                .frame(width: 110)
                .onSubmit(save)
            Group {
                if let e = existing {
                    Button { Task { await store.remove("budgets", id: e.id) } } label: {
                        Image(systemName: "xmark").font(.system(size: 10)).foregroundStyle(Color.sBad)
                    }.buttonStyle(.plain)
                } else { Spacer().frame(width: 12) }
            }.frame(width: 22)
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
