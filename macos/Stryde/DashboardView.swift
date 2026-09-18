import SwiftUI

struct DashboardView: View {
    @EnvironmentObject var store: AppStore

    private var monthlyIncome: Double { Finance.monthlyIncome(store.income) }
    private var monthlyBills: Double { Finance.monthlyBills(store.bills) }
    private var totalBalances: Double {
        store.accounts.reduce(0) { sum, a in
            let bal = a.currentBalance ?? 0
            return sum + (a.accountType == "credit" ? -bal : bal)
        }
    }

    private var totalDebt: Double { store.debts.filter { $0.isPaidOff != true }.reduce(0) { $0 + $1.balance } }

    var body: some View {
        Page(title: store.household?.name ?? "Dashboard", subtitle: "Monthly overview") { w in
            // Stat tiles
            HStack(spacing: 12) {
                StatTile(label: "Total Balances", value: totalBalances, accent: totalBalances < 0 ? .sBad : .sGood)
                StatTile(label: "Monthly Income", value: monthlyIncome, accent: .sGood)
                StatTile(label: "Monthly Bills", value: monthlyBills, accent: .sWarn)
                StatTile(label: "Left Over / mo", value: monthlyIncome - monthlyBills,
                         accent: monthlyIncome - monthlyBills < 0 ? .sBad : .sAccent)
            }

            if let err = store.errorMessage {
                Text(err).font(.system(size: 12)).foregroundStyle(Color.sBad)
            }

            // Two columns when there's room, stacked otherwise.
            if w >= 900 {
                HStack(alignment: .top, spacing: 16) {
                    accountsPanel
                    billsPanel
                }
            } else {
                accountsPanel
                billsPanel
            }
        }
    }

    private var accountsPanel: some View {
        Panel(title: "Accounts", count: store.accounts.count) {
            if store.accounts.isEmpty {
                EmptyRow(text: "No accounts yet")
            } else {
                ForEach(store.accounts) { a in
                    Row(name: a.name,
                        sub: a.accountType.capitalized + (a.isPrimary == true ? " · Primary" : ""),
                        amount: (a.accountType == "credit" ? -1 : 1) * (a.currentBalance ?? 0),
                        amountColor: a.accountType == "credit" ? .sBad : .sInk)
                }
            }
        }
        .frame(maxWidth: .infinity, alignment: .top)
    }

    private var billsPanel: some View {
        Panel(title: "Recurring Bills", count: store.bills.filter { $0.isActive != false }.count) {
            let active = store.bills
                .filter { $0.isActive != false && Finance.billMult($0.frequency) > 0 }
                .sorted { $0.amount * Finance.billMult($0.frequency) > $1.amount * Finance.billMult($1.frequency) }
            if active.isEmpty {
                EmptyRow(text: "No recurring bills")
            } else {
                ForEach(active) { b in
                    Row(name: b.name,
                        sub: (b.category ?? "").isEmpty ? Finance.freqLabel(b.frequency) : "\(b.category!) · \(Finance.freqLabel(b.frequency))",
                        amount: b.amount * Finance.billMult(b.frequency),
                        amountColor: .sInk)
                }
            }
        }
        .frame(maxWidth: .infinity, alignment: .top)
    }
}

// MARK: - Building blocks

struct StatTile: View {
    let label: String
    let value: Double
    let accent: Color
    var isCount: Bool = false
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Rectangle().fill(accent).frame(height: 2).frame(maxWidth: 40, alignment: .leading)
            Text(label.uppercased())
                .font(.system(size: 10, weight: .semibold)).tracking(1)
                .foregroundStyle(Color.sMuted)
            Text(isCount ? String(Int(value)) : money(value))
                .font(.system(size: 24, weight: .medium, design: .monospaced))
                .foregroundStyle(accent)
                .lineLimit(1).minimumScaleFactor(0.6)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(18)
        .background(Color.sPanel)
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .overlay(RoundedRectangle(cornerRadius: 12).stroke(Color.sHair, lineWidth: 1))
    }
}

struct Panel<Content: View>: View {
    let title: String
    let count: Int
    @ViewBuilder var content: Content
    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack {
                Text(title).font(.system(size: 14, weight: .semibold)).foregroundStyle(Color.sInk)
                Spacer()
                Text("\(count)").font(.system(size: 12)).foregroundStyle(Color.sMuted)
            }
            .padding(.bottom, 10)
            content
        }
        .padding(20)
        .background(Color.sPanel)
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .overlay(RoundedRectangle(cornerRadius: 12).stroke(Color.sHair, lineWidth: 1))
    }
}

struct Row: View {
    let name: String
    let sub: String
    var amount: Double? = nil
    var amountColor: Color = .sInk
    var trailing: String? = nil
    var badge: String? = nil
    var body: some View {
        HStack(alignment: .center) {
            VStack(alignment: .leading, spacing: 2) {
                Text(name).font(.system(size: 13, weight: .medium)).foregroundStyle(Color.sInk)
                if !sub.isEmpty {
                    Text(sub).font(.system(size: 11)).foregroundStyle(Color.sMuted)
                }
            }
            Spacer()
            if let badge {
                Text(badge)
                    .font(.system(size: 10, weight: .semibold))
                    .foregroundStyle(Color.sGood)
                    .padding(.horizontal, 8).padding(.vertical, 3)
                    .background(Color.sGood.opacity(0.12))
                    .clipShape(Capsule())
            }
            if let amount {
                VStack(alignment: .trailing, spacing: 2) {
                    Text(money(amount))
                        .font(.system(size: 13, design: .monospaced))
                        .foregroundStyle(amountColor)
                    if let trailing {
                        Text(trailing).font(.system(size: 10, design: .monospaced)).foregroundStyle(Color.sMuted)
                    }
                }
            }
        }
        .padding(.vertical, 9)
        .overlay(Rectangle().fill(Color.white.opacity(0.04)).frame(height: 1), alignment: .bottom)
    }
}

struct EmptyRow: View {
    let text: String
    var body: some View {
        Text(text)
            .font(.system(size: 12))
            .foregroundStyle(Color.sMuted)
            .frame(maxWidth: .infinity, alignment: .center)
            .padding(.vertical, 16)
    }
}
