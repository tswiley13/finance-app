import SwiftUI

private let dim = Color(red: 0x5C/255, green: 0x60/255, blue: 0x80/255)

// MARK: - Pay-period card

struct PayCard: View {
    @EnvironmentObject var store: AppStore
    let row: PeriodRow
    @Binding var expanded: Set<String>

    private var isOpen: Bool { expanded.contains(row.id) }

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            Button { toggle() } label: { headerContent }.buttonStyle(.plain)
            if isOpen { bodyContent.padding(.top, 16) }
        }
        .padding(20)
        .background(Color.sPanel)
        .overlay(alignment: .leading) { Rectangle().fill(row.isCurrent ? Color.sAccent : .clear).frame(width: 3) }
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .overlay(RoundedRectangle(cornerRadius: 12).stroke(Color.white.opacity(0.06), lineWidth: 1))
    }

    private func toggle() { if isOpen { expanded.remove(row.id) } else { expanded.insert(row.id) } }

    private var incomeSummary: String {
        row.incomeItems.map { $0.income.name }.joined(separator: " · ")
    }

    private var headerContent: some View {
        HStack(alignment: .top) {
            VStack(alignment: .leading, spacing: 3) {
                HStack(spacing: 8) {
                    Text("\(shortDate(row.start)) — \(shortDate(row.end))")
                        .font(.system(size: 14, weight: .semibold)).foregroundStyle(Color.sInk)
                    if row.isCurrent {
                        Text("CURRENT").font(.system(size: 9, weight: .bold)).tracking(0.8).foregroundStyle(.white)
                            .padding(.horizontal, 8).padding(.vertical, 2).background(Color.sAccent).clipShape(RoundedRectangle(cornerRadius: 4))
                    }
                }
                if !incomeSummary.isEmpty {
                    Text(incomeSummary).font(.system(size: 11)).foregroundStyle(Color.sMuted)
                }
            }
            Spacer()
            HStack(spacing: 12) {
                VStack(alignment: .trailing, spacing: 3) {
                    Text("END BALANCE").font(.system(size: 9, weight: .semibold)).tracking(1).foregroundStyle(Color.sMuted)
                    Text((row.endBalance < 0 ? "-$" : "$") + num2(row.endBalance))
                        .font(.system(size: 22, weight: .medium, design: .monospaced))
                        .foregroundStyle(row.endBalance < 0 ? Color.sBad : Color.sGreen)
                }
                Text(isOpen ? "▲" : "▼").font(.system(size: 12)).foregroundStyle(Color(red: 0x6E/255, green: 0x76/255, blue: 0x81/255))
            }
        }
    }

    private var bodyContent: some View {
        let unpaid = row.bills.filter { !skipped($0) && !fullyPaid($0) }
        let paid = row.bills.filter { fullyPaid($0) }
        let skip = row.bills.filter { skipped($0) }
        return VStack(alignment: .leading, spacing: 0) {
            HStack(spacing: 8) {
                cell("Start", num2(row.startBalance), Color.sMuted, prefix: "$")
                cell(row.isCurrent ? "Pending Income" : "Income", num2(row.pendingIncome), Color.sGreen, prefix: "+$")
                cell("Bills", row.billsDeducted > 0 ? num2(row.billsDeducted) : "—", row.billsDeducted > 0 ? Color.sBad : Color.sMuted, prefix: row.billsDeducted > 0 ? "$" : "")
            }
            if !row.incomeItems.isEmpty {
                sectionHead("Income")
                ForEach(Array(row.incomeItems.enumerated()), id: \.offset) { _, it in
                    IncomeRowV(income: it.income, payDate: it.payDate, periodStart: row.start)
                }
            }
            if !row.bills.isEmpty {
                sectionHead("Bills")
                ForEach(unpaid + paid + skip) { BillRowV(bill: $0, periodStart: row.start) }
            }
        }
    }

    private func fullyPaid(_ b: Bill) -> Bool {
        let r = store.billPayments["\(b.id)-\(row.start)"]; return (r?.isPaid ?? false) || (r?.paidAmount ?? 0) >= b.amount
    }
    private func skipped(_ b: Bill) -> Bool { store.billSkips.contains("\(b.id)-\(row.start)") }

    private func cell(_ label: String, _ value: String, _ color: Color, prefix: String) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(label.uppercased()).font(.system(size: 9, weight: .semibold)).tracking(0.6).foregroundStyle(Color.sMuted)
            Text(prefix + value).font(.system(size: 14, design: .monospaced)).foregroundStyle(color)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.horizontal, 12).padding(.vertical, 10)
        .background(Color.white.opacity(0.03)).clipShape(RoundedRectangle(cornerRadius: 8))
    }

    private func sectionHead(_ t: String) -> some View {
        Text(t.uppercased()).font(.system(size: 9, weight: .semibold)).tracking(1.2).foregroundStyle(Color.sMuted)
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(.top, 12).padding(.bottom, 4)
            .overlay(Rectangle().fill(Color.white.opacity(0.05)).frame(height: 1), alignment: .top)
    }
}

// MARK: - Accounts panel (dashboard)

struct DashAccounts: View {
    @EnvironmentObject var store: AppStore
    @State private var linkEditing: Editing<String>?
    @State private var connecting = false

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack {
                Text("ACCOUNTS").font(.system(size: 11, weight: .semibold)).tracking(1).foregroundStyle(Color.sMuted)
                Spacer()
                if store.plaidConnected {
                    Button { Task { await store.plaidSync() } } label: {
                        Text(syncLabel).font(.system(size: 12, weight: .semibold)).foregroundStyle(store.plaidSyncing ? dim : Color.sAccent)
                    }.buttonStyle(.plain).disabled(store.plaidSyncing)
                }
                Text("\(store.accounts.count) total").font(.system(size: 11, design: .monospaced)).foregroundStyle(Color.sMuted)
            }
            .padding(.bottom, 16)

            if store.accounts.isEmpty {
                Text("No accounts added yet").font(.system(size: 13)).italic().foregroundStyle(dim).padding(.vertical, 16)
            } else {
                ForEach(store.accounts.sorted { $0.name < $1.name }) { acctRow($0) }
            }

            if !store.plaidConnected {
                Button {
                    connecting = true
                    Task { if let t = await store.plaidCreateLinkToken() { linkEditing = Editing(t) }; connecting = false }
                } label: {
                    Text(connecting ? "Connecting…" : "+ Connect Bank").font(.system(size: 13, weight: .semibold)).foregroundStyle(Color.sAccent)
                        .padding(.horizontal, 16).padding(.vertical, 8)
                        .overlay(RoundedRectangle(cornerRadius: 8).stroke(Color.sAccent.opacity(0.5), lineWidth: 1))
                }.buttonStyle(.plain).disabled(connecting)
                .padding(.top, 12)
            }
        }
        .padding(20).background(Color.sPanel)
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .overlay(RoundedRectangle(cornerRadius: 12).stroke(Color.white.opacity(0.06), lineWidth: 1))
        .sheet(item: $linkEditing) { e in if let t = e.value { PlaidLinkSheet(linkToken: t).environmentObject(store) } }
    }

    private var syncLabel: String {
        if store.plaidSyncing { return "Syncing…" }
        if let d = store.plaidLastSynced {
            let f = DateFormatter(); f.dateFormat = "h:mm a"; return "Synced \(f.string(from: d))"
        }
        return "Sync"
    }

    private func acctRow(_ a: Account) -> some View {
        HStack(alignment: .top) {
            VStack(alignment: .leading, spacing: 3) {
                HStack(spacing: 8) {
                    Text(a.name).font(.system(size: 13.5, weight: .medium)).foregroundStyle(Color.sInk)
                    if a.isPrimary == true { tag("Primary") }
                    if a.isAccumulating == true { tag("Accumulating") }
                }
                if let b = a.bankName, !b.isEmpty {
                    Text("\(b) ···\(a.lastFour ?? "")").font(.system(size: 11)).foregroundStyle(Color.sMuted)
                }
                if a.isAccumulating == true, let tgt = a.accumulationTarget, tgt > 0 {
                    GeometryReader { g in
                        ZStack(alignment: .leading) {
                            Capsule().fill(Color.white.opacity(0.06)).frame(height: 2)
                            Capsule().fill(LinearGradient(colors: [Color.sGood, Color.sAccent], startPoint: .leading, endPoint: .trailing))
                                .frame(width: g.size.width * min(1, (a.currentBalance ?? 0) / tgt), height: 2)
                        }
                    }.frame(height: 2).padding(.top, 6)
                }
            }
            Spacer()
            VStack(alignment: .trailing, spacing: 2) {
                Text("$\(num2(a.currentBalance ?? 0))").font(.system(size: 14, weight: .medium, design: .monospaced)).foregroundStyle(Color.sGood)
                if store.plaidConnected {
                    Text("via Plaid").font(.system(size: 10)).foregroundStyle(Color.sAccent)
                }
            }
        }
        .padding(.vertical, 12)
        .overlay(Rectangle().fill(Color.white.opacity(0.04)).frame(height: 1), alignment: .bottom)
    }

    private func tag(_ t: String) -> some View {
        Text(t.uppercased()).font(.system(size: 9, weight: .semibold)).tracking(0.8).foregroundStyle(Color.sAccent)
            .padding(.horizontal, 7).padding(.vertical, 2).background(Color.sAccent.opacity(0.15)).clipShape(RoundedRectangle(cornerRadius: 4))
    }
}

// MARK: - Where the money goes

struct WTMGPanel: View {
    @EnvironmentObject var store: AppStore

    var body: some View {
        let proj = store.projection
        let rows = proj.transferRows()
        let ps = proj.currentPeriodStart()
        let prefund = proj.nextPeriodPrefund()

        return VStack(alignment: .leading, spacing: 0) {
            HStack {
                Text("WHERE THE MONEY GOES").font(.system(size: 11, weight: .semibold)).tracking(1).foregroundStyle(Color.sMuted)
                Spacer()
                Text("This pay period").font(.system(size: 11, design: .monospaced)).foregroundStyle(Color.sMuted)
            }
            .padding(.bottom, 16)

            if rows.isEmpty && (prefund?.total ?? 0) <= 0 {
                Text("No allocations this period").font(.system(size: 13)).italic().foregroundStyle(dim).padding(.vertical, 16)
            }

            if !rows.isEmpty, let ps {
                Text("TRANSFERS").font(.system(size: 10, weight: .semibold)).tracking(0.8).foregroundStyle(Color.sMuted).padding(.bottom, 8)
                ForEach(rows) { TransferRowV(row: $0, periodStart: ps) }
            }

            if let pf = prefund, pf.total > 0 {
                prefundBlock(pf)
            }
        }
        .padding(20).background(Color.sPanel)
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .overlay(RoundedRectangle(cornerRadius: 12).stroke(Color.white.opacity(0.06), lineWidth: 1))
    }

    private func prefundBlock(_ pf: (label: String, total: Double, start: String)) -> some View {
        let transferred = store.nextTransfers["prefund"] ?? 0
        let done = transferred >= pf.total - 0.005
        return VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("NEXT PERIOD — \(pf.label)").font(.system(size: 10, weight: .semibold)).tracking(0.8).foregroundStyle(Color.sMuted)
                Spacer()
                Text("Pre-fund").font(.system(size: 10, weight: .semibold)).foregroundStyle(Color.sAccent)
            }
            HStack {
                Text((done ? "✓ " : "") + "Bills to transfer").font(.system(size: 13, weight: .medium)).foregroundStyle(done ? Color.sGreen : Color.sInk)
                Spacer()
                if done {
                    Text("$\(num2(transferred))").font(.system(size: 13, design: .monospaced)).foregroundStyle(Color.sGreen)
                    LinkBtn(title: "Undo") { Task { await store.setTransfer(rowKey: "prefund", amount: pf.total, periodStart: pf.start, done: false) } }
                } else {
                    Button { Task { await store.setTransfer(rowKey: "prefund", amount: pf.total, periodStart: pf.start, done: true) } } label: {
                        Text("Transfer $\(num2(pf.total))").font(.system(size: 11, weight: .semibold)).foregroundStyle(Color.sAccent)
                            .padding(.horizontal, 12).padding(.vertical, 4)
                            .background(Color.sAccent.opacity(0.12)).overlay(RoundedRectangle(cornerRadius: 6).stroke(Color.sAccent.opacity(0.25), lineWidth: 1)).clipShape(RoundedRectangle(cornerRadius: 6))
                    }.buttonStyle(.plain)
                }
            }
        }
        .padding(.top, 16)
        .overlay(Rectangle().fill(Color.white.opacity(0.06)).frame(height: 1), alignment: .top)
    }
}

struct TransferRowV: View {
    @EnvironmentObject var store: AppStore
    let row: Projection.TransferRow
    let periodStart: String

    var body: some View {
        let transferred = store.transfers[row.rowKey] ?? 0
        let done = transferred >= row.suggested - 0.005
        let remaining = max(0, row.suggested - transferred)
        return HStack {
            Text((done ? "✓ " : "") + row.label).font(.system(size: 13, weight: .medium)).foregroundStyle(done ? Color.sGreen : Color.sInk)
            Spacer()
            if done {
                LinkBtn(title: "Undo") { Task { await store.setTransfer(rowKey: row.rowKey, amount: row.suggested, periodStart: periodStart, done: false) } }
            } else {
                VStack(alignment: .trailing, spacing: 1) {
                    Text("$\(num2(remaining))").font(.system(size: 13, design: .monospaced)).foregroundStyle(transferred > 0 ? Color.sAccent : Color.sInk)
                    Text("remaining").font(.system(size: 10)).foregroundStyle(Color.sMuted)
                }
                PillBtn(title: "Transfer", tint: .sGood) { Task { await store.setTransfer(rowKey: row.rowKey, amount: row.suggested, periodStart: periodStart, done: true) } }
            }
        }
        .padding(.vertical, 10)
        .overlay(Rectangle().fill(Color.white.opacity(0.04)).frame(height: 1), alignment: .bottom)
    }
}
