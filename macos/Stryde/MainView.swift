import SwiftUI

enum Section: String, CaseIterable, Identifiable {
    case dashboard, bills, income, accounts, debts, payperiods
    var id: String { rawValue }

    var title: String {
        switch self {
        case .dashboard:  return "Dashboard"
        case .bills:      return "Bills"
        case .income:     return "Income"
        case .accounts:   return "Accounts"
        case .debts:      return "Debts"
        case .payperiods: return "Pay Periods"
        }
    }

    var icon: String {
        switch self {
        case .dashboard:  return "square.grid.2x2"
        case .bills:      return "doc.text"
        case .income:     return "wallet.bifold"
        case .accounts:   return "creditcard"
        case .debts:      return "chart.line.downtrend.xyaxis"
        case .payperiods: return "calendar"
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
                    case .bills:      BillsView()
                    case .income:     IncomeView()
                    case .accounts:   AccountsView()
                    case .debts:      DebtsView()
                    case .payperiods: PayPeriodsView()
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

            Text("MAIN")
                .font(.system(size: 9, weight: .semibold)).tracking(1.2)
                .foregroundStyle(Color.sMuted)
                .padding(.horizontal, 18)
                .padding(.bottom, 6)

            ForEach(Section.allCases) { s in
                Button {
                    section = s
                } label: {
                    HStack(spacing: 10) {
                        Image(systemName: s.icon)
                            .font(.system(size: 13))
                            .frame(width: 18)
                        Text(s.title)
                            .font(.system(size: 13, weight: .medium))
                        Spacer()
                    }
                    .foregroundStyle(section == s ? Color.sAccent : Color.sMuted)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 9)
                    .background(section == s ? Color.sAccent.opacity(0.12) : .clear)
                    .clipShape(RoundedRectangle(cornerRadius: 8))
                }
                .buttonStyle(.plain)
                .padding(.horizontal, 10)
                .padding(.vertical, 1)
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
struct Page<Content: View>: View {
    @EnvironmentObject var store: AppStore
    let title: String
    var subtitle: String? = nil
    @ViewBuilder var content: Content

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack(alignment: .center) {
                VStack(alignment: .leading, spacing: 2) {
                    Text(title)
                        .font(.system(size: 22, weight: .bold, design: .rounded))
                        .foregroundStyle(Color.sInk)
                    if let subtitle {
                        Text(subtitle).font(.system(size: 12)).foregroundStyle(Color.sMuted)
                    }
                }
                Spacer()
                if store.loadingData {
                    ProgressView().controlSize(.small).tint(.sAccent)
                }
                Button { Task { await store.loadData() } } label: {
                    Image(systemName: "arrow.clockwise")
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundStyle(Color.sMuted)
                        .padding(8).background(Color.sPanel)
                        .clipShape(RoundedRectangle(cornerRadius: 8))
                }
                .buttonStyle(.plain).help("Refresh")
            }
            .padding(24)

            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    content
                }
                .padding(.horizontal, 24)
                .padding(.bottom, 32)
                .frame(maxWidth: 920, alignment: .leading)
            }
        }
    }
}
