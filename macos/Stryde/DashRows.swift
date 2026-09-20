import SwiftUI

func ordDay(_ n: Int) -> String {
    let s: String
    switch n % 100 { case 11, 12, 13: s = "th"
    default: switch n % 10 { case 1: s = "st"; case 2: s = "nd"; case 3: s = "rd"; default: s = "th" } }
    return "\(n)\(s)"
}

// Dashboard stat tile — teal top accent on all four; value color varies.
struct DashTile: View {
    let label: String
    let value: Double
    var color: Color = .sGood
    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            Rectangle()
                .fill(LinearGradient(colors: [Color.sGood.opacity(0.8), .clear], startPoint: .leading, endPoint: .trailing))
                .frame(height: 1)
            VStack(alignment: .leading, spacing: 10) {
                Text(label.uppercased())
                    .font(.system(size: 10, weight: .semibold)).tracking(1.5).foregroundStyle(Color.sMuted)
                Text((value < 0 ? "-$" : "$") + num2(value))
                    .font(.system(size: 26, weight: .medium, design: .monospaced))
                    .foregroundStyle(color).lineLimit(1).minimumScaleFactor(0.6)
            }
            .padding(.horizontal, 22).padding(.vertical, 20)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.sPanel)
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .overlay(RoundedRectangle(cornerRadius: 12).stroke(Color.white.opacity(0.06), lineWidth: 1))
    }
}

// Small pill button used across the dashboard (Paid / Got Paid / Transfer / …).
struct PillBtn: View {
    let title: String
    var tint: Color
    var solid: Bool = false
    var action: () -> Void
    var body: some View {
        Button(action: action) {
            Text(title).font(.system(size: 11, weight: .medium))
                .foregroundStyle(solid ? Color.black : tint)
                .padding(.horizontal, 10).padding(.vertical, 3)
                .background(solid ? tint : tint.opacity(0.1))
                .overlay(RoundedRectangle(cornerRadius: 5).stroke(solid ? .clear : tint.opacity(0.35), lineWidth: 1))
                .clipShape(RoundedRectangle(cornerRadius: 5))
        }.buttonStyle(.plain)
    }
}

struct LinkBtn: View {
    let title: String
    var color: Color = .sMuted
    var action: () -> Void
    var body: some View {
        Button(action: action) { Text(title).font(.system(size: 10)).underline().foregroundStyle(color) }
            .buttonStyle(.plain)
    }
}

// A bill row inside a pay-period card, with Paid / Partial / skip / Undo / Restore.
struct BillRowV: View {
    @EnvironmentObject var store: AppStore
    let bill: Bill
    let periodStart: String
    @State private var editAmt = false
    @State private var amtText = ""
    @State private var partialOpen = false
    @State private var partialText = ""

    private var rec: BillPayment? { store.billPayments["\(bill.id)-\(periodStart)"] }
    private var skipped: Bool { store.billSkips.contains("\(bill.id)-\(periodStart)") }
    private var paidAmt: Double { rec?.paidAmount ?? 0 }
    private var fullyPaid: Bool { (rec?.isPaid ?? false) || paidAmt >= bill.amount }
    private var partial: Bool { !fullyPaid && paidAmt > 0 }

    private var freqSub: String {
        switch bill.frequency ?? "monthly" {
        case "payday": return "Every Pay Day"
        case "biweekly": return "Biweekly"
        default: return bill.dueDay.map { "Due the \(ordDay($0))" } ?? "Monthly"
        }
    }

    var body: some View {
        Group {
            if skipped { skippedRow }
            else if fullyPaid { paidRow }
            else { unpaidRow }
        }
        .padding(.vertical, 7)
        .overlay(Rectangle().fill(Color.white.opacity(0.04)).frame(height: 1), alignment: .bottom)
    }

    private var skippedRow: some View {
        HStack {
            VStack(alignment: .leading, spacing: 2) {
                Text(bill.name).font(.system(size: 13, weight: .medium)).foregroundStyle(Color.sMuted)
                Text("Skipped").font(.system(size: 11)).foregroundStyle(Color(red: 0x5C/255, green: 0x60/255, blue: 0x80/255))
            }.opacity(0.6)
            Spacer()
            Text(money(bill.amount)).font(.system(size: 13, design: .monospaced)).foregroundStyle(Color(red: 0x5C/255, green: 0x60/255, blue: 0x80/255))
            PillBtn(title: "Restore", tint: .sAccent) { Task { await store.setBillSkipped(billId: bill.id, periodStart: periodStart, skipped: false) } }
        }
    }

    private var paidRow: some View {
        HStack {
            VStack(alignment: .leading, spacing: 2) {
                Text(bill.name).font(.system(size: 13, weight: .medium)).foregroundStyle(Color.sMuted).strikethrough(true, color: Color.sMuted)
                Text("Paid").font(.system(size: 11)).foregroundStyle(Color(red: 0x5C/255, green: 0x60/255, blue: 0x80/255))
            }.opacity(0.6)
            Spacer()
            Text(money(paidAmt > 0 ? paidAmt : bill.amount)).font(.system(size: 13, design: .monospaced))
                .foregroundStyle(Color(red: 0x5C/255, green: 0x60/255, blue: 0x80/255)).strikethrough(true)
            PillBtn(title: "Undo", tint: .sBad) { Task { await store.unmarkBillPaid(billId: bill.id, periodStart: periodStart) } }
        }
    }

    private var unpaidRow: some View {
        HStack(spacing: 6) {
            VStack(alignment: .leading, spacing: 2) {
                HStack(spacing: 6) {
                    Text(bill.name).font(.system(size: 13, weight: .medium)).foregroundStyle(Color.sInk)
                    if partial {
                        Text("PARTIAL").font(.system(size: 9, weight: .semibold))
                            .foregroundStyle(Color.sWarn).padding(.horizontal, 5).padding(.vertical, 1)
                            .background(Color.sWarn.opacity(0.15)).clipShape(RoundedRectangle(cornerRadius: 3))
                    }
                }
                Text(partial ? "\(money(paidAmt)) paid · \(money(bill.amount - paidAmt)) remaining" : freqSub)
                    .font(.system(size: 11)).foregroundStyle(Color.sMuted)
            }
            Spacer()
            if editAmt {
                TextField("", text: $amtText)
                    .textFieldStyle(.plain).multilineTextAlignment(.trailing).frame(width: 80)
                    .font(.system(size: 13, design: .monospaced)).foregroundStyle(Color.sInk)
                    .padding(.horizontal, 8).padding(.vertical, 4)
                    .background(Color(red: 0x2D/255, green: 0x2B/255, blue: 0x45/255))
                    .overlay(RoundedRectangle(cornerRadius: 6).stroke(Color.sAccent, lineWidth: 1))
                    .onSubmit { commitAmount() }
            } else {
                Text(money(bill.amount)).font(.system(size: 13, design: .monospaced))
                    .foregroundStyle(partial ? Color.sWarn : Color.sMuted)
                    .onTapGesture { amtText = String(format: "%.2f", bill.amount); editAmt = true }
            }
            if partialOpen {
                TextField("Amt paid", text: $partialText)
                    .textFieldStyle(.plain).frame(width: 80).font(.system(size: 12, design: .monospaced)).foregroundStyle(Color.sInk)
                    .padding(.horizontal, 6).padding(.vertical, 3)
                    .background(Color.sBg).overlay(RoundedRectangle(cornerRadius: 5).stroke(Color.sAccent, lineWidth: 1))
                PillBtn(title: "✓", tint: .sGood, solid: false) { commitPartial() }
                PillBtn(title: "✕", tint: .sBad) { partialOpen = false }
            } else {
                PillBtn(title: "Paid", tint: .sGreen) { Task { await store.markBillPaid(billId: bill.id, periodStart: periodStart, amount: bill.amount) } }
                PillBtn(title: partial ? "More" : "Partial", tint: .sWarn) { partialText = ""; partialOpen = true }
                PillBtn(title: "✕", tint: .sBad) { Task { await store.setBillSkipped(billId: bill.id, periodStart: periodStart, skipped: true) } }
            }
        }
    }

    private func commitAmount() {
        editAmt = false
        if let v = Double(amtText.filter { "0123456789.".contains($0) }), v != bill.amount {
            Task { await store.saveBillAmount(billId: bill.id, amount: v) }
        }
    }
    private func commitPartial() {
        partialOpen = false
        if let v = Double(partialText.filter { "0123456789.".contains($0) }), v > 0 {
            Task { await store.markBillPaid(billId: bill.id, periodStart: periodStart, amount: v) }
        }
    }
}

// An income row inside a pay-period card: Got Paid / Undo (received early).
struct IncomeRowV: View {
    @EnvironmentObject var store: AppStore
    let income: Income
    let payDate: String
    let periodStart: String

    private var early: Bool { store.earlyPayments.contains("\(income.id)-\(periodStart)") }
    private var future: Bool { parseLocalDate(payDate) > Date() }

    var body: some View {
        HStack(spacing: 10) {
            VStack(alignment: .leading, spacing: 2) {
                Text((early ? "✓ " : "") + income.name).font(.system(size: 13, weight: .medium))
                    .foregroundStyle(early ? Color.sGreen : Color.sInk)
                Text(shortDate(payDate) + (early ? " · Received early" : "")).font(.system(size: 11)).foregroundStyle(Color.sMuted)
            }
            Spacer()
            Text("+" + money(income.fixedAmount ?? 0)).font(.system(size: 13, design: .monospaced))
                .foregroundStyle(early ? Color.sGreen : Color.sMuted)
            if early {
                LinkBtn(title: "Undo") { Task { await store.setIncomeReceived(incomeId: income.id, periodStart: periodStart, received: false) } }
            } else if future {
                PillBtn(title: "Got Paid", tint: .sGreen) { Task { await store.setIncomeReceived(incomeId: income.id, periodStart: periodStart, received: true) } }
            }
        }
        .padding(.vertical, 6)
        .overlay(Rectangle().fill(Color.white.opacity(0.04)).frame(height: 1), alignment: .bottom)
    }
}
