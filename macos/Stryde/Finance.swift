import Foundation

// Monthly-average multipliers — identical to the web app's billMult/incMult.
// Biweekly = 26 checks/yr ÷ 12 (not ×2). One-time bills return 0 so they never
// count as recurring monthly cost.
enum Finance {
    static func billMult(_ freq: String?) -> Double {
        switch freq ?? "monthly" {
        case "payday", "biweekly": return 26.0 / 12.0
        case "weekly":             return 52.0 / 12.0
        case "semi-monthly":       return 2
        case "quarterly":          return 1.0 / 3.0
        case "annually":           return 1.0 / 12.0
        case "one-time":           return 0
        default:                   return 1
        }
    }

    static func incMult(_ freq: String) -> Double {
        switch freq {
        case "biweekly": return 26.0 / 12.0
        case "weekly":   return 52.0 / 12.0
        default:         return 1
        }
    }

    static func monthlyIncome(_ income: [Income]) -> Double {
        income
            .filter { $0.isActive != false }
            .reduce(0) { $0 + ($1.fixedAmount ?? 0) * incMult($1.frequency) }
    }

    static func monthlyBills(_ bills: [Bill]) -> Double {
        bills
            .filter { $0.isActive != false }
            .reduce(0) { $0 + $1.amount * billMult($1.frequency) }
    }
}
