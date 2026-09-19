import Foundation

extension AppStore {
    // Generic upsert/delete for the household-scoped tables. Editors build a
    // snake_cased payload (the client encoder handles the casing) and call these.
    func save<T: Encodable>(_ table: String, id: String?, _ payload: T) async {
        do {
            if let id {
                try await client.from(table).update(payload).eq("id", value: id).execute()
            } else {
                try await client.from(table).insert(payload).execute()
            }
            await loadData()
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func remove(_ table: String, id: String) async {
        do {
            try await client.from(table).delete().eq("id", value: id).execute()
            await loadData()
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    // MARK: mark a bill paid within a pay period (bill_payments, keyed by user_id)

    struct BillPaymentPayload: Encodable {
        var userId: String
        var billId: String
        var periodStart: String
        var paidAmount: Double
        var isPaid: Bool
        var paidDate: String?
    }

    func markBillPaid(billId: String, periodStart: String, amount: Double) async {
        let p = BillPaymentPayload(userId: userId, billId: billId, periodStart: periodStart,
                                   paidAmount: amount, isPaid: true, paidDate: localDateStr())
        do {
            try await client.from("bill_payments")
                .upsert(p, onConflict: "user_id,bill_id,period_start").execute()
            await loadData()
        } catch { errorMessage = error.localizedDescription }
    }

    // Rebuild pay periods from biweekly/weekly income (port of the web logic).
    struct PayPeriodInsert: Encodable {
        var householdId: String; var name: String
        var startDay: Int; var endDay: Int; var startDate: String; var endDate: String
    }
    func regeneratePayPeriods() async {
        guard let hid = household?.id else { return }
        var cal = Calendar(identifier: .gregorian); cal.timeZone = .current
        do {
            let incomeRows: [Income] = try await client.from("income").select().eq("household_id", value: hid).execute().value
            let paychecks = incomeRows.filter { $0.isActive != false && $0.frequency != "monthly" && $0.nextPayDate != nil }
            try await client.from("pay_periods").delete().eq("household_id", value: hid).execute()
            guard !paychecks.isEmpty else {
                payPeriods = []
                errorMessage = "No pay periods generated — add a biweekly or weekly income with a next pay date, then regenerate."
                await loadData(); return
            }
            let today = cal.startOfDay(for: Date())
            let year = cal.component(.year, from: today)
            let endOfYear = cal.date(from: DateComponents(year: year, month: 12, day: 31, hour: 23, minute: 59, second: 59))!
            let lookback = today.addingTimeInterval(-60 * 86400)

            var allDates: [Date] = []
            for inc in paychecks {
                let base = parseLocalDate(inc.nextPayDate!, hour: 12)
                let interval = inc.frequency == "weekly" ? 7 : 14
                var current = base
                while current > today { current = cal.date(byAdding: .day, value: -interval, to: current)! }
                while current > lookback { current = cal.date(byAdding: .day, value: -interval, to: current)! }
                current = cal.date(byAdding: .day, value: interval, to: current)!
                var cursor = current
                while cursor <= endOfYear { allDates.append(cursor); cursor = cal.date(byAdding: .day, value: interval, to: cursor)! }
            }
            allDates.sort()
            var unique: [Date] = []
            for d in allDates where unique.isEmpty || !cal.isDate(unique.last!, inSameDayAs: d) { unique.append(d) }

            var periods: [PayPeriodInsert] = []
            for i in unique.indices {
                let start = unique[i]
                let end = i < unique.count - 1
                    ? cal.date(byAdding: .day, value: -1, to: unique[i + 1])!
                    : cal.date(byAdding: .day, value: 13, to: start)!
                periods.append(PayPeriodInsert(
                    householdId: hid, name: "Pay Period \(i + 1)",
                    startDay: cal.component(.day, from: start), endDay: cal.component(.day, from: end),
                    startDate: localDateStr(start), endDate: localDateStr(end)))
            }
            if !periods.isEmpty { try await client.from("pay_periods").insert(periods).execute() }
            await loadData()
        } catch { errorMessage = error.localizedDescription }
    }

    // Mark a "where the money goes" transfer done (or undone) for a period.
    struct TransferPayload: Encodable { var userId: String; var rowKey: String; var amount: Double; var periodStart: String }
    func setTransfer(rowKey: String, amount: Double, periodStart: String, done: Bool) async {
        do {
            try await client.from("period_transfers").delete()
                .eq("user_id", value: userId).eq("row_key", value: rowKey).eq("period_start", value: periodStart).execute()
            if done {
                try await client.from("period_transfers")
                    .insert(TransferPayload(userId: userId, rowKey: rowKey, amount: amount, periodStart: periodStart)).execute()
            }
            await loadData()
        } catch { errorMessage = error.localizedDescription }
    }

    func unmarkBillPaid(billId: String, periodStart: String) async {
        do {
            try await client.from("bill_payments").delete()
                .eq("user_id", value: userId)
                .eq("bill_id", value: billId)
                .eq("period_start", value: periodStart)
                .execute()
            await loadData()
        } catch { errorMessage = error.localizedDescription }
    }

    // Skip / restore a bill within a period (bill_skips).
    struct SkipPayload: Encodable { var userId: String; var billId: String; var periodStart: String }
    func setBillSkipped(billId: String, periodStart: String, skipped: Bool) async {
        do {
            try await client.from("bill_skips").delete()
                .eq("user_id", value: userId).eq("bill_id", value: billId).eq("period_start", value: periodStart).execute()
            if skipped {
                try await client.from("bill_skips").insert(SkipPayload(userId: userId, billId: billId, periodStart: periodStart)).execute()
            }
            await loadData()
        } catch { errorMessage = error.localizedDescription }
    }

    // Mark income received early (income_early_payments).
    struct EarlyPayload: Encodable { var userId: String; var incomeId: String; var periodStart: String }
    func setIncomeReceived(incomeId: String, periodStart: String, received: Bool) async {
        do {
            try await client.from("income_early_payments").delete()
                .eq("user_id", value: userId).eq("income_id", value: incomeId).eq("period_start", value: periodStart).execute()
            if received {
                try await client.from("income_early_payments").insert(EarlyPayload(userId: userId, incomeId: incomeId, periodStart: periodStart)).execute()
            }
            await loadData()
        } catch { errorMessage = error.localizedDescription }
    }

    // Inline-edit a bill's template amount.
    struct AmountPayload: Encodable { var amount: Double }
    func saveBillAmount(billId: String, amount: Double) async {
        do { try await client.from("bills").update(AmountPayload(amount: amount)).eq("id", value: billId).execute(); await loadData() }
        catch { errorMessage = error.localizedDescription }
    }

    // Save the household's average discretionary spending.
    struct DiscretionaryPayload: Encodable { var monthlyDiscretionary: Double }
    func saveDiscretionary(_ value: Double) async {
        guard let hid = household?.id else { return }
        do { try await client.from("households").update(DiscretionaryPayload(monthlyDiscretionary: value)).eq("id", value: hid).execute(); await loadData() }
        catch { errorMessage = error.localizedDescription }
    }
}
