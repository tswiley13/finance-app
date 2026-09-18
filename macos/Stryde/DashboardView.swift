import SwiftUI

struct DashboardView: View {
    @EnvironmentObject var store: AppStore
    @State private var exported = ""

    var body: some View {
        let (tiles, rows) = store.projection.compute()

        Page(title: greeting, subtitle: "Monthly projection") { w in
            // Export bar
            HStack(spacing: 8) {
                Spacer()
                exportButton(exported == "md" ? "Copied!" : "Copy AI Summary") {
                    copyToPasteboard(FinancialSummary.build(store: store, tiles: tiles, rows: rows).markdown); flash("md")
                }
                exportButton(exported == "csv" ? "Copied!" : "Copy CSV", outline: true) {
                    copyToPasteboard(FinancialSummary.build(store: store, tiles: tiles, rows: rows).csv); flash("csv")
                }
            }

            // Monthly Projection tiles
            HStack(spacing: 12) {
                StatTile(label: "Available Now", value: tiles.availableNow, accent: tiles.availableNow < 0 ? .sBad : .sGood)
                StatTile(label: "Income This Month", value: tiles.incomeThisMonth, accent: .sGood)
                StatTile(label: "Bills Remaining", value: tiles.billsRemaining, accent: .sBad)
                StatTile(label: "Available This Month", value: tiles.availableThisMonth,
                         accent: tiles.availableThisMonth < 0 ? .sBad : .sAccent)
            }

            if let err = store.errorMessage {
                Text(err).font(.system(size: 12)).foregroundStyle(Color.sBad)
            }

            if w >= 940 {
                HStack(alignment: .top, spacing: 16) {
                    periodsColumn(rows).frame(maxWidth: .infinity, alignment: .top)
                    accountsPanel.frame(width: 360, alignment: .top)
                }
            } else {
                periodsColumn(rows)
                accountsPanel
            }
        }
    }

    private func flash(_ w: String) {
        exported = w
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) { if exported == w { exported = "" } }
    }

    private func exportButton(_ title: String, outline: Bool = false, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Text(title).font(.system(size: 12, weight: .semibold))
                .foregroundStyle(outline ? Color.sAccent : .white)
                .padding(.horizontal, 14).padding(.vertical, 7)
                .background(outline ? Color.clear : Color.sAccent)
                .overlay(RoundedRectangle(cornerRadius: 8).stroke(outline ? Color.sAccent.opacity(0.5) : Color.clear, lineWidth: 1))
                .clipShape(RoundedRectangle(cornerRadius: 8))
        }
        .buttonStyle(.plain)
    }

    private var greeting: String {
        let h = Calendar.current.component(.hour, from: Date())
        let part = h < 12 ? "Good morning" : (h < 18 ? "Good afternoon" : "Good evening")
        let name = (store.household?.name).map { $0.split(separator: " ").first.map(String.init) ?? $0 }
        return name.map { "\(part), \($0)" } ?? part
    }

    // MARK: Pay-period cards

    @ViewBuilder
    private func periodsColumn(_ rows: [PeriodRow]) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Pay Periods")
                .font(.system(size: 10, weight: .semibold)).tracking(1).foregroundStyle(Color.sMuted)
            if rows.isEmpty {
                Panel(title: "Pay Periods", count: 0) { EmptyRow(text: "No upcoming pay periods") }
            } else {
                ForEach(rows) { PeriodCard(row: $0) }
            }
        }
    }

    // MARK: Accounts

    private var accountsPanel: some View {
        Panel(title: "Accounts", count: store.accounts.count) {
            if store.accounts.isEmpty {
                EmptyRow(text: "No accounts yet")
            } else {
                ForEach(store.accounts.sorted { $0.name < $1.name }) { a in
                    Row(name: a.name,
                        sub: accountSub(a),
                        amount: a.currentBalance ?? 0,
                        amountColor: a.accountType == "credit" ? .sBad : .sInk,
                        badge: a.isAccumulating == true ? "Accumulating" : (a.isPrimary == true ? "Primary" : nil))
                }
            }
        }
    }

    private func accountSub(_ a: Account) -> String {
        var parts: [String] = []
        if let b = a.bankName, !b.isEmpty { parts.append(b) }
        if let l = a.lastFour, !l.isEmpty { parts.append("••\(l)") }
        parts.append(a.accountType.capitalized)
        return parts.joined(separator: " · ")
    }
}

struct PeriodCard: View {
    @EnvironmentObject var store: AppStore
    let row: PeriodRow

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 3) {
                    HStack(spacing: 8) {
                        Text("\(shortDate(row.start)) — \(shortDate(row.end))")
                            .font(.system(size: 14, weight: .semibold)).foregroundStyle(Color.sInk)
                        if row.isCurrent {
                            Text("CURRENT")
                                .font(.system(size: 9, weight: .bold)).tracking(0.5)
                                .foregroundStyle(Color.sAccent)
                                .padding(.horizontal, 7).padding(.vertical, 2)
                                .background(Color.sAccent.opacity(0.15)).clipShape(Capsule())
                        }
                    }
                    Text(row.name).font(.system(size: 11)).foregroundStyle(Color.sMuted)
                }
                Spacer()
                VStack(alignment: .trailing, spacing: 2) {
                    Text("END BALANCE").font(.system(size: 9, weight: .semibold)).tracking(0.8).foregroundStyle(Color.sMuted)
                    Text(money(row.endBalance))
                        .font(.system(size: 20, weight: .medium, design: .monospaced))
                        .foregroundStyle(row.endBalance < 0 ? Color.sBad : Color.sGood)
                }
            }
            .padding(.bottom, 12)

            // Start / Income / Bills strip
            HStack(spacing: 0) {
                miniStat("Start", money(row.startBalance), .sMuted)
                divider
                miniStat("Income", "+\(money(row.pendingIncome))", .sGood)
                divider
                miniStat("Bills", "-\(money(row.billsDeducted))", .sBad)
            }
            .padding(.vertical, 10)
            .background(Color.white.opacity(0.03))
            .clipShape(RoundedRectangle(cornerRadius: 8))

            // Bills in this period
            if !row.bills.isEmpty {
                VStack(spacing: 0) {
                    ForEach(row.bills.prefix(row.isCurrent ? 100 : 6)) { b in
                        billRow(b)
                    }
                    if !row.isCurrent && row.bills.count > 6 {
                        Text("+ \(row.bills.count - 6) more")
                            .font(.system(size: 11)).foregroundStyle(Color.sMuted)
                            .frame(maxWidth: .infinity, alignment: .leading).padding(.top, 4)
                    }
                }
                .padding(.top, 12)
            }
        }
        .padding(18)
        .background(Color.sPanel)
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .overlay(RoundedRectangle(cornerRadius: 12).stroke(row.isCurrent ? Color.sAccent.opacity(0.35) : Color.sHair, lineWidth: 1))
    }

    @ViewBuilder
    private func billRow(_ b: Bill) -> some View {
        let key = "\(b.id)-\(row.start)"
        let rec = store.billPayments[key]
        let paid = (rec?.isPaid ?? false) || (rec?.paidAmount ?? 0) > 0
        let paidAmt = rec?.paidAmount ?? b.amount

        HStack(spacing: 10) {
            if row.isCurrent {
                Button {
                    Task {
                        if paid { await store.unmarkBillPaid(billId: b.id, periodStart: row.start) }
                        else { await store.markBillPaid(billId: b.id, periodStart: row.start, amount: b.amount) }
                    }
                } label: {
                    Image(systemName: paid ? "checkmark.circle.fill" : "circle")
                        .font(.system(size: 15))
                        .foregroundStyle(paid ? Color.sGood : Color.sMuted.opacity(0.6))
                }
                .buttonStyle(.plain)
            }
            Text(b.name)
                .font(.system(size: 12))
                .foregroundStyle(paid ? Color.sMuted : Color.sInk)
                .strikethrough(paid, color: Color.sMuted)
            Spacer()
            Text(money(paid ? paidAmt : b.amount))
                .font(.system(size: 12, design: .monospaced))
                .foregroundStyle(paid ? Color.sGood : Color.sMuted)
        }
        .padding(.vertical, 6)
    }

    private func miniStat(_ label: String, _ value: String, _ color: Color) -> some View {
        VStack(spacing: 3) {
            Text(label.uppercased()).font(.system(size: 9, weight: .semibold)).tracking(0.6).foregroundStyle(Color.sMuted)
            Text(value).font(.system(size: 13, weight: .medium, design: .monospaced)).foregroundStyle(color)
        }
        .frame(maxWidth: .infinity)
    }

    private var divider: some View { Rectangle().fill(Color.white.opacity(0.06)).frame(width: 1, height: 28) }
}
