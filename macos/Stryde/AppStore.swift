import Foundation
import Supabase

@MainActor
final class AppStore: ObservableObject {
    enum Phase { case loading, signedOut, signedIn }

    @Published var phase: Phase = .loading
    @Published var errorMessage: String?
    @Published var signingIn = false
    @Published var loadingData = false

    @Published var household: Household?
    @Published var userId: String = ""
    @Published var accounts: [Account] = []
    @Published var income: [Income] = []
    @Published var bills: [Bill] = []
    @Published var debts: [Debt] = []
    @Published var payPeriods: [PayPeriod] = []
    @Published var categories: [Category] = []
    @Published var budgets: [Budget] = []
    @Published var members: [Member] = []

    // Per-period state (keyed "id-periodStart"), all scoped by user_id.
    @Published var billPayments: [String: BillPayment] = [:]
    @Published var billSkips: Set<String> = []
    @Published var earlyPayments: Set<String> = []
    @Published var transfers: [String: Double] = [:]        // current period row_key -> amount
    @Published var plaidConnected = false
    @Published var plaidSyncing = false

    let client: SupabaseClient

    init() {
        let decoder = JSONDecoder()
        decoder.keyDecodingStrategy = .convertFromSnakeCase
        let encoder = JSONEncoder()
        encoder.keyEncodingStrategy = .convertToSnakeCase
        client = SupabaseClient(
            supabaseURL: URL(string: Config.supabaseURL)!,
            supabaseKey: Config.supabaseAnonKey,
            options: SupabaseClientOptions(
                db: .init(encoder: encoder, decoder: decoder),
                auth: .init(storage: UserDefaultsLocalStorage())
            )
        )
    }

    func bootstrap() async {
        do {
            _ = try await client.auth.session
            phase = .signedIn
            await loadData()
        } catch {
            phase = .signedOut
        }
    }

    func signIn(email: String, password: String) async {
        guard !signingIn else { return }
        signingIn = true
        errorMessage = nil
        defer { signingIn = false }
        do {
            try await client.auth.signIn(email: email, password: password)
            phase = .signedIn
            await loadData()
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func signOut() async {
        try? await client.auth.signOut()
        household = nil
        accounts = []
        income = []
        bills = []
        debts = []
        payPeriods = []
        categories = []
        budgets = []
        members = []
        billPayments = [:]
        billSkips = []
        earlyPayments = []
        transfers = [:]
        phase = .signedOut
    }

    func loadData() async {
        loadingData = true
        errorMessage = nil
        defer { loadingData = false }
        do {
            let uid = try await client.auth.session.user.id.uuidString.lowercased()
            userId = uid

            // Household the user created, else the one they're a member of.
            var resolved: Household?
            let created: [Household] = try await client
                .from("households").select().eq("created_by", value: uid).execute().value
            if let h = created.first {
                resolved = h
            } else {
                let members: [Member] = try await client
                    .from("household_members").select().eq("user_id", value: uid).execute().value
                if let hid = members.first?.householdId {
                    let hh: [Household] = try await client
                        .from("households").select().eq("id", value: hid).execute().value
                    resolved = hh.first
                }
            }

            guard let hh = resolved else {
                errorMessage = "No household found for this account."
                return
            }
            household = hh

            accounts = try await client
                .from("accounts").select().eq("household_id", value: hh.id).execute().value
            income = try await client
                .from("income").select().eq("household_id", value: hh.id).execute().value
            bills = try await client
                .from("bills").select().eq("household_id", value: hh.id).execute().value
            debts = try await client
                .from("debts").select().eq("household_id", value: hh.id)
                .order("payoff_order", ascending: true).execute().value
            payPeriods = try await client
                .from("pay_periods").select().eq("household_id", value: hh.id)
                .order("start_date", ascending: true).execute().value
            categories = try await client
                .from("categories").select().eq("household_id", value: hh.id)
                .order("name", ascending: true).execute().value
            budgets = try await client
                .from("budgets").select().eq("household_id", value: hh.id).execute().value
            members = try await client
                .from("household_members").select().eq("household_id", value: hh.id).execute().value

            // Per-period tables are scoped by user_id. Tolerate missing tables.
            if let rows: [BillPayment] = try? await client
                .from("bill_payments").select("bill_id, period_start, paid_amount, is_paid")
                .eq("user_id", value: uid).execute().value {
                billPayments = Dictionary(rows.map { ("\($0.billId)-\($0.periodStart)", $0) }) { a, _ in a }
            }
            if let rows: [BillSkip] = try? await client
                .from("bill_skips").select("bill_id, period_start")
                .eq("user_id", value: uid).execute().value {
                billSkips = Set(rows.map { "\($0.billId)-\($0.periodStart)" })
            }
            if let rows: [EarlyPayment] = try? await client
                .from("income_early_payments").select("income_id, period_start")
                .eq("user_id", value: uid).execute().value {
                earlyPayments = Set(rows.map { "\($0.incomeId)-\($0.periodStart)" })
            }
            if let rows: [PlaidItemRow] = try? await client
                .from("plaid_items").select("id").eq("user_id", value: uid).limit(1).execute().value {
                plaidConnected = !rows.isEmpty
            }
            if let rows: [PeriodTransfer] = try? await client
                .from("period_transfers").select("row_key, amount, period_start")
                .eq("user_id", value: uid).execute().value {
                let today = localDateStr()
                let sorted = payPeriods.sorted { $0.startDate < $1.startDate }
                if let cur = sorted.first(where: { $0.startDate <= today && $0.endDate >= today }) {
                    transfers = Dictionary(
                        rows.filter { $0.periodStart == cur.startDate }.map { ($0.rowKey, $0.amount) }
                    ) { a, _ in a }
                }
            }
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}
