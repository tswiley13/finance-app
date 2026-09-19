import SwiftUI

struct DashboardView: View {
    @EnvironmentObject var store: AppStore
    @State private var expanded: Set<String> = []
    @State private var initExpand = false
    @State private var toast = ""
    @State private var discText = ""

    var body: some View {
        let (tiles, rows) = store.projection.compute()
        let current = rows.first { $0.isCurrent }

        GeometryReader { geo in
            let w = geo.size.width
            let contentW = w - 64
            let gap: CGFloat = 12
            let leftW = (contentW - gap) * 1.45 / 2.45
            let rightW = (contentW - gap) - leftW

            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    header(current: current)
                        .padding(.horizontal, 32).padding(.top, 20).padding(.bottom, 16)
                    Rectangle().fill(Color.white.opacity(0.05)).frame(height: 1)

                    VStack(alignment: .leading, spacing: 0) {
                        projectionHeader(tiles: tiles, rows: rows).padding(.bottom, 16)
                        if !toast.isEmpty {
                            Text(toast).font(.system(size: 13)).foregroundStyle(Color.sGreen)
                                .padding(.horizontal, 14).padding(.vertical, 10)
                                .frame(maxWidth: .infinity, alignment: .leading)
                                .background(Color.sGreen.opacity(0.1))
                                .overlay(RoundedRectangle(cornerRadius: 8).stroke(Color.sGreen.opacity(0.3), lineWidth: 1))
                                .clipShape(RoundedRectangle(cornerRadius: 8)).padding(.bottom, 16)
                        }
                        tilesRow(tiles).padding(.bottom, 20)
                        spendingBar.padding(.bottom, 24)

                        if w >= 1000 {
                            HStack(alignment: .top, spacing: gap) {
                                VStack(spacing: 12) { ForEach(rows) { PayCard(row: $0, expanded: $expanded) } }
                                    .frame(width: leftW, alignment: .top)
                                VStack(spacing: 12) { DashAccounts(); WTMGPanel() }
                                    .frame(width: rightW, alignment: .top)
                            }
                        } else {
                            VStack(spacing: 12) { ForEach(rows) { PayCard(row: $0, expanded: $expanded) } }
                            DashAccounts(); WTMGPanel()
                        }
                    }
                    .padding(.horizontal, 32).padding(.top, 24).padding(.bottom, 60)
                }
            }
        }
        .background(Color.sBg)
        .onAppear {
            if !initExpand { if let c = current { expanded = [c.id] }; initExpand = true }
            discText = (store.household?.monthlyDiscretionary).map { $0 == $0.rounded() ? String(Int($0)) : String($0) } ?? ""
        }
    }

    // MARK: header

    private func header(current: PeriodRow?) -> some View {
        let h = Calendar.current.component(.hour, from: Date())
        let greet = h < 12 ? "Good morning" : (h < 17 ? "Good afternoon" : "Good evening")
        let full = store.members.first?.name ?? store.household?.name ?? "there"
        let first = full.split(separator: " ").first.map(String.init) ?? full
        let df = DateFormatter(); df.dateFormat = "EEEE, MMMM d, yyyy"

        return HStack(alignment: .center) {
            Circle().fill(LinearGradient(colors: [Color.sAccent, Color(red: 0x94/255, green: 0x8c/255, blue: 0xf2/255)], startPoint: .topLeading, endPoint: .bottomTrailing))
                .frame(width: 38, height: 38)
                .overlay(Text(String(first.prefix(1)).uppercased()).font(.system(size: 14, weight: .bold)).foregroundStyle(Color(red: 0x0D/255, green: 0x11/255, blue: 0x17/255)))
            VStack(alignment: .leading, spacing: 3) {
                Text("\(greet), \(first)").font(.system(size: 20, weight: .bold)).tracking(-0.4).foregroundStyle(Color.sInk)
                Text(df.string(from: Date())).font(.system(size: 12)).foregroundStyle(Color.sMuted)
            }
            Spacer()
            VStack(spacing: 6) {
                Text("Current Pay Period").font(.system(size: 13, weight: .semibold)).foregroundStyle(Color.sInk)
                if let c = current {
                    Text("\(shortDate(c.start)) — \(shortDate(c.end))").font(.system(size: 13, design: .monospaced)).foregroundStyle(Color.sGood)
                } else {
                    Text("No active period").font(.system(size: 13)).foregroundStyle(Color.sMuted)
                }
            }
            .padding(.horizontal, 16).padding(.vertical, 10)
            .background(Color.sAccent.opacity(0.08))
            .overlay(RoundedRectangle(cornerRadius: 10).stroke(Color.sAccent.opacity(0.2), lineWidth: 1))
            .clipShape(RoundedRectangle(cornerRadius: 10))
        }
    }

    // MARK: projection header + export

    private func projectionHeader(tiles: ProjectionTiles, rows: [PeriodRow]) -> some View {
        HStack {
            Text("Monthly Projection").font(.system(size: 24, weight: .bold, design: .rounded)).foregroundStyle(Color.sInk)
            Spacer()
            Menu {
                Button { copyExport(\.markdown); flash("Copied — paste into Claude or ChatGPT.") } label: { Label("Copy for AI", systemImage: "doc.on.doc") }
                Button { copyExport(\.csv); flash("CSV copied to clipboard.") } label: { Label("Copy CSV", systemImage: "tablecells") }
            } label: {
                HStack(spacing: 6) {
                    Image(systemName: "square.and.arrow.up").font(.system(size: 12, weight: .semibold))
                    Text("Export").font(.system(size: 13, weight: .semibold))
                }
                .foregroundStyle(Color(red: 0xA9/255, green: 0x9D/255, blue: 0xFF/255))
                .padding(.horizontal, 12).frame(height: 34)
                .background(Color.sAccent.opacity(0.12))
                .overlay(RoundedRectangle(cornerRadius: 8).stroke(Color.sAccent.opacity(0.35), lineWidth: 1))
                .clipShape(RoundedRectangle(cornerRadius: 8))
            }
            .menuStyle(.borderlessButton).fixedSize()
        }
    }

    private func copyExport(_ kp: KeyPath<(markdown: String, csv: String), String>) {
        let s = store.projection.compute()
        copyToPasteboard(FinancialSummary.build(store: store, tiles: s.tiles, rows: s.rows)[keyPath: kp])
    }
    private func flash(_ m: String) {
        toast = m; DispatchQueue.main.asyncAfter(deadline: .now() + 2) { if toast == m { toast = "" } }
    }

    // MARK: tiles

    private func tilesRow(_ t: ProjectionTiles) -> some View {
        HStack(spacing: 12) {
            DashTile(label: "Available Now", value: t.availableNow, color: .sGood)
            DashTile(label: "Income This Month", value: t.incomeThisMonth, color: .sGood)
            DashTile(label: "Bills Remaining", value: t.billsRemaining, color: .sBad)
            DashTile(label: "Available This Month", value: t.availableThisMonth, color: t.availableThisMonth < 0 ? .sBad : .sGreen)
        }
    }

    // MARK: spending bar

    private var spendingBar: some View {
        HStack(spacing: 10) {
            Text("Avg. monthly spending beyond bills")
                .font(.system(size: 13, weight: .semibold)).foregroundStyle(Color(red: 0xC9/255, green: 0xC6/255, blue: 0xE0/255))
            HStack(spacing: 2) {
                Text("$").font(.system(size: 13)).foregroundStyle(Color.sMuted)
                TextField("0", text: $discText)
                    .textFieldStyle(.plain).font(.system(size: 13, design: .monospaced)).foregroundStyle(Color(red: 0xF2/255, green: 0xF0/255, blue: 0xEB/255))
                    .frame(width: 70)
                    .onSubmit { Task { await store.saveDiscretionary(Double(discText.filter { "0123456789.".contains($0) }) ?? 0) } }
            }
            .padding(.horizontal, 10).padding(.vertical, 5)
            .background(Color.white.opacity(0.06))
            .overlay(RoundedRectangle(cornerRadius: 6).stroke(Color.white.opacity(0.12), lineWidth: 1))
            .clipShape(RoundedRectangle(cornerRadius: 6))
            Text("groceries beyond a set line, dining, shopping, fuel, cash — makes your AI export honest about what's actually free.")
                .font(.system(size: 12)).foregroundStyle(Color.sMuted).fixedSize(horizontal: false, vertical: true)
            Spacer(minLength: 0)
        }
        .padding(.horizontal, 14).padding(.vertical, 12)
        .background(Color.sAccent.opacity(0.06))
        .overlay(RoundedRectangle(cornerRadius: 10).stroke(Color.sAccent.opacity(0.18), lineWidth: 1))
        .clipShape(RoundedRectangle(cornerRadius: 10))
    }
}
