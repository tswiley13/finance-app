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

    static func freqLabel(_ f: String?) -> String {
        switch f ?? "monthly" {
        case "biweekly", "payday": return "Every 2 weeks"
        case "weekly":             return "Weekly"
        case "semi-monthly":       return "Twice a month"
        case "quarterly":          return "Quarterly"
        case "annually":           return "Yearly"
        case "one-time":           return "One-time"
        default:                   return "Monthly"
        }
    }

    // Estimated payoff month from "months remaining" (today + N months).
    static func payoffLabel(_ months: Int?) -> String? {
        guard let m = months, m > 0 else { return nil }
        let dt = Calendar.current.date(byAdding: .month, value: m, to: Date()) ?? Date()
        let f = DateFormatter()
        f.dateFormat = "MMM yyyy"
        return f.string(from: dt)
    }
}

// Local YYYY-MM-DD (never UTC) — mirrors the web app's localDateStr.
func localDateStr(_ date: Date = Date()) -> String {
    var cal = Calendar(identifier: .gregorian)
    cal.timeZone = TimeZone.current
    let c = cal.dateComponents([.year, .month, .day], from: date)
    return String(format: "%04d-%02d-%02d", c.year ?? 0, c.month ?? 0, c.day ?? 0)
}

// Parse "yyyy-MM-dd" in the local calendar at a given hour.
func parseLocalDate(_ s: String, hour: Int = 12) -> Date {
    var cal = Calendar(identifier: .gregorian); cal.timeZone = .current
    let p = s.prefix(10).split(separator: "-").compactMap { Int($0) }
    guard p.count == 3 else { return Date() }
    return cal.date(from: DateComponents(year: p[0], month: p[1], day: p[2], hour: hour)) ?? Date()
}

// "2026-09-18" -> "Sep 18"
func shortDate(_ s: String) -> String {
    let inF = DateFormatter(); inF.dateFormat = "yyyy-MM-dd"
    guard let d = inF.date(from: String(s.prefix(10))) else { return s }
    let outF = DateFormatter(); outF.dateFormat = "MMM d"
    return outF.string(from: d)
}
