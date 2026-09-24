import SwiftUI

enum Section: String, CaseIterable, Identifiable {
    case dashboard, monthly, budget, bills, income, accounts, categories, payperiods, debts, settings
    var id: String { rawValue }

    var title: String {
        switch self {
        case .dashboard:  return "Dashboard"
        case .monthly:    return "Monthly Overview"
        case .budget:     return "Budget"
        case .bills:      return "Bills"
        case .income:     return "Income"
        case .accounts:   return "Accounts"
        case .categories: return "Categories"
        case .payperiods: return "Pay Periods"
        case .debts:      return "Debts"
        case .settings:   return "Settings"
        }
    }

    var icon: String {
        switch self {
        case .dashboard:  return "square.grid.2x2"
        case .monthly:    return "chart.bar"
        case .budget:     return "chart.pie"
        case .bills:      return "doc.text"
        case .income:     return "wallet.bifold"
        case .accounts:   return "creditcard"
        case .categories: return "tag"
        case .payperiods: return "calendar"
        case .debts:      return "chart.line.downtrend.xyaxis"
        case .settings:   return "gearshape"
        }
    }

    // Sidebar grouping.
    var group: String {
        switch self {
        case .payperiods, .debts: return "Planning"
        case .settings:           return "Account"
        default:                  return "Main"
        }
    }
}

struct MainView: View {
    @EnvironmentObject var store: AppStore
    @State private var section: Section = .dashboard

    var body: some View {
        HStack(spacing: 0) {
            SidebarView(section: $section)
                .frame(width: 216)
            Rectangle().fill(Color.sHair).frame(width: 1)
            ZStack {
                Color.sBg
                Group {
                    switch section {
                    case .dashboard:  DashboardView()
                    case .monthly:    MonthlyOverviewView()
                    case .budget:     BudgetView()
                    case .bills:      BillsView()
                    case .income:     IncomeView()
                    case .accounts:   AccountsView()
                    case .categories: CategoriesView()
                    case .debts:      DebtsView()
                    case .payperiods: PayPeriodsView()
                    case .settings:   SettingsView()
                    }
                }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
        }
        .background(Color.sBg)
    }
}

struct SidebarView: View {
    @EnvironmentObject var store: AppStore
    @Binding var section: Section

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            VStack(alignment: .leading, spacing: 2) {
                Text("Stryde")
                    .font(.system(size: 22, weight: .bold, design: .rounded))
                    .foregroundStyle(Color.sInk)
                Text("Stop hoping. Start knowing.")
                    .font(.system(size: 10))
                    .foregroundStyle(Color.sMuted)
            }
            .padding(.horizontal, 18)
            .padding(.top, 24)
            .padding(.bottom, 22)

            ForEach(["Main", "Planning", "Account"], id: \.self) { grp in
                Text(grp.uppercased())
                    .font(.system(size: 9, weight: .semibold)).tracking(1.2)
                    .foregroundStyle(Color.sMuted)
                    .padding(.horizontal, 18)
                    .padding(.top, grp == "Main" ? 0 : 14)
                    .padding(.bottom, 6)

                ForEach(Section.allCases.filter { $0.group == grp }) { s in
                    Button { section = s } label: {
                        HStack(spacing: 10) {
                            Image(systemName: s.icon).font(.system(size: 13)).frame(width: 18)
                            Text(s.title).font(.system(size: 13, weight: .medium))
                            Spacer()
                        }
                        .foregroundStyle(section == s ? Color.sAccent : Color.sMuted)
                        .padding(.horizontal, 12).padding(.vertical, 8)
                        .background(section == s ? Color.sAccent.opacity(0.12) : .clear)
                        .clipShape(RoundedRectangle(cornerRadius: 8))
                    }
                    .buttonStyle(.plain)
                    .padding(.horizontal, 10).padding(.vertical, 1)
                }
            }

            Spacer()

            Button {
                Task { await store.signOut() }
            } label: {
                HStack(spacing: 10) {
                    Image(systemName: "rectangle.portrait.and.arrow.right")
                        .font(.system(size: 13)).frame(width: 18)
                    Text("Sign out").font(.system(size: 13, weight: .medium))
                    Spacer()
                }
                .foregroundStyle(Color.sMuted)
                .padding(.horizontal, 12).padding(.vertical, 9)
            }
            .buttonStyle(.plain)
            .padding(.horizontal, 10)
            .padding(.bottom, 16)
        }
        .frame(maxHeight: .infinity, alignment: .top)
        .background(Color.sBg)
    }
}

// Shared page scaffold: a title header with a refresh button, then content.
// Content is centered and grows with the window up to a comfortable cap, so a
// wide window fills gracefully instead of leaving dead space on one side.
// The content builder receives the current content width so a screen can lay
// itself out in columns when there's room.
struct Page<Content: View>: View {
    @EnvironmentObject var store: AppStore
    let title: String
    var subtitle: String? = nil
    @ViewBuilder var content: (CGFloat) -> Content

    private let hPad: CGFloat = 32

    var body: some View {
        GeometryReader { geo in
            let w = max(geo.size.width - hPad * 2, 0)

            VStack(spacing: 0) {
                HStack(alignment: .center) {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(title)
                            .font(.system(size: 24, weight: .bold, design: .rounded))
                            .foregroundStyle(Color.sInk)
                        if let subtitle {
                            Text(subtitle).font(.system(size: 12)).foregroundStyle(Color.sMuted)
                        }
                    }
                    Spacer()
                    Button { Task { await store.loadData() } } label: {
                        Image(systemName: "arrow.clockwise").font(.system(size: 13, weight: .semibold))
                            .foregroundStyle(Color.sMuted).frame(width: 34, height: 34)
                            .background(Color.sPanel).clipShape(RoundedRectangle(cornerRadius: 8))
                            .overlay(RoundedRectangle(cornerRadius: 8).stroke(Color.white.opacity(0.06), lineWidth: 1))
                    }
                    .buttonStyle(.plain).help("Refresh")
                    .overlay(alignment: .center) { if store.loadingData { ProgressView().controlSize(.small).tint(.sAccent) } }
                }
                .padding(.horizontal, hPad)
                .padding(.top, 24)
                .padding(.bottom, 12)

                ScrollView {
                    VStack(alignment: .leading, spacing: 16) { content(w) }
                        .padding(.horizontal, hPad)
                        .padding(.bottom, 32)
                        .frame(maxWidth: .infinity, alignment: .leading)
                }
            }
            .frame(width: geo.size.width, height: geo.size.height)
        }
    }
}
