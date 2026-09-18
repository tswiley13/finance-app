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
    @Published var accounts: [Account] = []
    @Published var income: [Income] = []
    @Published var bills: [Bill] = []
    @Published var debts: [Debt] = []
    @Published var payPeriods: [PayPeriod] = []
    @Published var categories: [Category] = []
    @Published var budgets: [Budget] = []
    @Published var members: [Member] = []

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
        phase = .signedOut
    }

    func loadData() async {
        loadingData = true
        errorMessage = nil
        defer { loadingData = false }
        do {
            let uid = try await client.auth.session.user.id.uuidString.lowercased()

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
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}
