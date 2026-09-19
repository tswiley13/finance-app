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
}
