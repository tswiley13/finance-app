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

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            // Header
            HStack(alignment: .center) {
                VStack(alignment: .leading, spacing: 2) {
                    Text(store.household?.name ?? "Dashboard")
                        .font(.system(size: 22, weight: .bold, design: .rounded))
                        .foregroundStyle(Color.sInk)
                    Text("Monthly overview")
                        .font(.system(size: 12))
                        .foregroundStyle(Color.sMuted)
                }
                Spacer()
                Button {
                    Task { await store.loadData() }
                } label: {
                    Image(systemName: "arrow.clockwise")
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundStyle(Color.sMuted)
                        .padding(8)
                        .background(Color.sPanel)
                        .clipShape(RoundedRectangle(cornerRadius: 8))
                }
                .buttonStyle(.plain)
                .help("Refresh")

                Button {
                    Task { await store.signOut() }
                } label: {
                    Text("Sign out")
                        .font(.system(size: 12, weight: .medium))
                        .foregroundStyle(Color.sMuted)
                        .padding(.horizontal, 12).padding(.vertical, 8)
                        .background(Color.sPanel)
                        .clipShape(RoundedRectangle(cornerRadius: 8))
                }
                .buttonStyle(.plain)
            }
            .padding(24)

            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    // Stat tiles
                    HStack(spacing: 12) {
                        StatTile(label: "Total Balances", value: totalBalances, accent: totalBalances < 0 ? .sBad : .sGood)
                        StatTile(label: "Monthly Income", value: monthlyIncome, accent: .sGood)
                        StatTile(label: "Monthly Bills", value: monthlyBills, accent: .sWarn)
                        StatTile(label: "Left Over / mo", value: monthlyIncome - monthlyBills,
                                 accent: monthlyIncome - monthlyBills < 0 ? .sBad : .sAccent)
                    }

                    if store.loadingData {
                        HStack { ProgressView().controlSize(.small).tint(.sAccent); Text("Loading…").foregroundStyle(Color.sMuted).font(.system(size: 12)) }
                    }
                    if let err = store.errorMessage {
                        Text(err).font(.system(size: 12)).foregroundStyle(Color.sBad)
                    }

                    // Accounts
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

                    // Bills (monthly)
                    Panel(title: "Recurring Bills", count: store.bills.filter { $0.isActive != false }.count) {
                        let active = store.bills
                            .filter { $0.isActive != false && Finance.billMult($0.frequency) > 0 }
                            .sorted { $0.amount * Finance.billMult($0.frequency) > $1.amount * Finance.billMult($1.frequency) }
                        if active.isEmpty {
                            EmptyRow(text: "No recurring bills")
                        } else {
                            ForEach(active) { b in
                                Row(name: b.name,
                                    sub: (b.category ?? "").isEmpty ? monthlyLabel(b) : "\(b.category!) · \(monthlyLabel(b))",
                                    amount: b.amount * Finance.billMult(b.frequency),
                                    amountColor: .sInk)
                            }
                        }
                    }
                }
                .padding(.horizontal, 24)
                .padding(.bottom, 32)
            }
        }
    }

    private func monthlyLabel(_ b: Bill) -> String {
        switch b.frequency ?? "monthly" {
        case "biweekly", "payday": return "every 2 weeks"
        case "weekly": return "weekly"
        case "semi-monthly": return "twice a month"
        case "quarterly": return "quarterly"
        case "annually": return "yearly"
        default: return "monthly"
        }
    }
}

// MARK: - Building blocks

struct StatTile: View {
    let label: String
    let value: Double
    let accent: Color
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Rectangle().fill(accent).frame(height: 2).frame(maxWidth: 40, alignment: .leading)
            Text(label.uppercased())
                .font(.system(size: 10, weight: .semibold)).tracking(1)
                .foregroundStyle(Color.sMuted)
            Text(money(value))
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
    let amount: Double
    var amountColor: Color = .sInk
    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 2) {
                Text(name).font(.system(size: 13, weight: .medium)).foregroundStyle(Color.sInk)
                if !sub.isEmpty {
                    Text(sub).font(.system(size: 11)).foregroundStyle(Color.sMuted)
                }
            }
            Spacer()
            Text(money(amount))
                .font(.system(size: 13, design: .monospaced))
                .foregroundStyle(amountColor)
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
