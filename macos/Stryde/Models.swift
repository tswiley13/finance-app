import Foundation

// Column names map from snake_case via the decoder's convertFromSnakeCase.
// Extra columns returned by Supabase are simply ignored by Codable.

struct Household: Codable, Identifiable {
    var id: String
    var name: String
    var inviteCode: String?
    var monthlyDiscretionary: Double?
}

struct Member: Codable, Identifiable {
    var id: String
    var householdId: String
    var name: String
}

struct Account: Codable, Identifiable {
    var id: String
    var name: String
    var bankName: String?
    var lastFour: String?
    var accountType: String
    var currentBalance: Double?
    var isPrimary: Bool?
    var isAccumulating: Bool?
    var accumulationTarget: Double?
    var accumulationCurrent: Double?
    var dueDay: Int?
    var resetType: String?
    var resetDay: Int?
    var minimumBuffer: Double?
}

struct Income: Codable, Identifiable {
    var id: String
    var name: String
    var owner: String?
    var type: String?
    var frequency: String
    var fixedAmount: Double?
    var nextPayDate: String?
    var depositAccountId: String?
    var isActive: Bool?
}

struct Bill: Codable, Identifiable {
    var id: String
    var name: String
    var accountId: String?
    var transferToAccountId: String?
    var amount: Double
    var dueDay: Int?
    var dueDay2: Int?
    var dueMonth: Int?
    var dueDate: String?
    var frequency: String?
    var category: String?
    var owner: String?
    var paymentMethod: String?
    var isVariable: Bool?
    var isActive: Bool?
    var isPaid: Bool?
    var paidDate: String?
    var paidAmount: Double?
}

struct Debt: Codable, Identifiable {
    var id: String
    var name: String
    var owner: String?
    var category: String?
    var balance: Double
    var originalBalance: Double?
    var interestRate: Double?
    var minimumPayment: Double?
    var termMonths: Int?
    var monthsRemaining: Int?
    var isPaidOff: Bool?
    var payoffOrder: Int?
}

struct PayPeriod: Codable, Identifiable {
    var id: String
    var name: String
    var startDate: String
    var endDate: String
}

struct Category: Codable, Identifiable {
    var id: String
    var name: String
}

// Per-bill, per-period payment record (bill_payments, keyed by user_id).
struct BillPayment: Codable {
    var billId: String
    var periodStart: String
    var paidAmount: Double?
    var isPaid: Bool?
}

struct PlaidItem: Codable, Identifiable { var id: String; var institutionName: String? }
struct BillSkip: Codable { var billId: String; var periodStart: String }
struct EarlyPayment: Codable { var incomeId: String; var periodStart: String }
struct PeriodTransfer: Codable { var rowKey: String; var amount: Double; var periodStart: String }

struct Budget: Codable, Identifiable {
    var id: String
    var category: String
    var amount: Double
}
