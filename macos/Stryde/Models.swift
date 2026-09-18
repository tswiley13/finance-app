import Foundation

// Column names map from snake_case via the decoder's convertFromSnakeCase.
// Extra columns returned by Supabase are simply ignored by Codable.

struct Household: Codable, Identifiable {
    var id: String
    var name: String
}

struct Member: Codable, Identifiable {
    var id: String
    var householdId: String
    var name: String
}

struct Account: Codable, Identifiable {
    var id: String
    var name: String
    var accountType: String
    var currentBalance: Double?
    var isPrimary: Bool?
}

struct Income: Codable, Identifiable {
    var id: String
    var name: String
    var fixedAmount: Double?
    var frequency: String
    var isActive: Bool?
}

struct Bill: Codable, Identifiable {
    var id: String
    var name: String
    var amount: Double
    var dueDay: Int?
    var frequency: String?
    var category: String?
    var isPaid: Bool?
    var isActive: Bool?
    var paidAmount: Double?
}
