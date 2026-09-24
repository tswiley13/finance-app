import SwiftUI

private let freqOptions: [(String, String)] = [
    ("monthly", "Monthly"), ("semi-monthly", "Semi-monthly (2 due dates)"), ("biweekly", "Biweekly"),
    ("payday", "Every Pay Day"), ("quarterly", "Quarterly"), ("annually", "Annually"), ("one-time", "One-time payment"),
]
private let paymentOptions: [(String, String)] = [
    ("", "Payment method"), ("auto", "Auto"), ("transfer", "Transfer"), ("zelle", "Zelle"), ("cashapp", "Cash App"),
    ("applepay", "Apple Pay"), ("venmo", "Venmo"), ("check", "Check"), ("manual", "Manual"),
]
private func monthName(_ n: Int) -> String {
    let f = DateFormatter(); return n >= 1 && n <= 12 ? f.monthSymbols[n - 1] : ""
}
private func ord(_ n: Int) -> String {
    let s: String
    switch n % 100 { case 11, 12, 13: s = "th"
    default: switch n % 10 { case 1: s = "st"; case 2: s = "nd"; case 3: s = "rd"; default: s = "th" } }
    return "\(n)\(s)"
}

struct BillDraft {
    var id: String?
    var name = ""
    var amount: Double?
    var frequency = "monthly"
    var dueDay: Int?
    var dueDay2: Int?
    var dueMonth: Int?
    var dueDate = ""
    var paymentMethod = ""
    var category = ""
    var accountId = ""
    var isTransfer = false
    var transferToId = ""
    var isActive = true

    init() {}
    init(from b: Bill) {
        id = b.id; name = b.name; amount = b.amount; frequency = b.frequency ?? "monthly"
        dueDay = b.dueDay; dueDay2 = b.dueDay2; dueMonth = b.dueMonth; dueDate = b.dueDate ?? ""
        paymentMethod = b.paymentMethod ?? ""; category = b.category ?? ""; accountId = b.accountId ?? ""
        isTransfer = b.transferToAccountId != nil; transferToId = b.transferToAccountId ?? ""; isActive = b.isActive ?? true
    }
    func payload(_ hid: String) -> BillPayload {
        BillPayload(
            householdId: hid, name: name, amount: amount ?? 0, frequency: frequency,
            dueDay: dueDay ?? (frequency == "one-time" ? 0 : 1),
            dueDay2: frequency == "semi-monthly" ? dueDay2 : nil,
            dueMonth: (frequency == "quarterly" || frequency == "annually") ? dueMonth : nil,
            dueDate: frequency == "one-time" ? nilIfEmpty(dueDate) : nil,
            paymentMethod: paymentMethod, category: category.isEmpty ? "Other" : category, owner: "joint",
            accountId: nilIfEmpty(accountId), transferToAccountId: isTransfer ? nilIfEmpty(transferToId) : nil,
            isVariable: false, isActive: isActive)
    }
}

struct BillsView: View {
    @EnvironmentObject var store: AppStore
    @State private var showAdd = false
    @State private var editingId: String?
    @State private var draft = BillDraft()

    private func isPaid(_ b: Bill) -> Bool { b.isPaid == true }
    private func oneTimeDone(_ b: Bill) -> Bool {
        (b.frequency ?? "") == "one-time" && (b.isPaid == true || (b.paidAmount ?? 0) >= b.amount)
    }

    var body: some View {
        let active = store.bills.filter { $0.isActive != false && !oneTimeDone($0) }
        let sorted = active.sorted { a, b in
            if isPaid(a) != isPaid(b) { return !isPaid(a) }
            return a.name.localizedCaseInsensitiveCompare(b.name) == .orderedAscending
        }
        let monthly = active.reduce(0.0) { $0 + $1.amount * Finance.billMult($1.frequency) }
        let remaining = active.filter { !isPaid($0) }.reduce(0.0) { $0 + $1.amount }

        return Page(title: "Bills") { _ in
            HStack {
                Spacer()
                AddButton(title: "Add Bill") { draft = BillDraft(); editingId = nil; showAdd = true }
            }

            if showAdd {
                BillFormPanel(draft: $draft, isEdit: false,
                              onSave: { save(); showAdd = false }, onCancel: { showAdd = false }, onDelete: nil)
            }

            HStack(spacing: 12) {
                billTile("Monthly Bills", monthly, .sInk, "est. total per month")
                billTile("Bills Remaining", remaining, .sBad, "still owed this month")
            }

            Panel(title: "All Bills", count: active.count) {
                if sorted.isEmpty {
                    EmptyRow(text: "No bills added yet")
                } else {
                    ForEach(sorted) { b in
                        BillRowItem(bill: b, paid: isPaid(b), editing: editingId == b.id,
                                    onEdit: {
                                        if editingId == b.id { editingId = nil }
                                        else { draft = BillDraft(from: b); showAdd = false; editingId = b.id }
                                    },
                                    onDelete: { Task { await store.remove("bills", id: b.id) } })
                        if editingId == b.id {
                            BillFormPanel(draft: $draft, isEdit: true,
                                          onSave: { save(); editingId = nil }, onCancel: { editingId = nil },
                                          onDelete: { Task { await store.remove("bills", id: b.id) }; editingId = nil })
                        }
                    }
                }
            }
        }
    }

    private func save() {
        Task { await store.save("bills", id: draft.id, draft.payload(store.household?.id ?? "")) }
    }

    private func billTile(_ label: String, _ value: Double, _ color: Color, _ caption: String) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(label.uppercased()).font(.system(size: 11, weight: .semibold)).tracking(0.6).foregroundStyle(Color.sMuted)
            Text(money(value)).font(.system(size: 22, weight: .semibold, design: .monospaced)).foregroundStyle(color)
            Text(caption).font(.system(size: 11)).foregroundStyle(Color.sMuted)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(18).background(Color.sPanel)
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .overlay(RoundedRectangle(cornerRadius: 12).stroke(Color.white.opacity(0.06), lineWidth: 1))
    }
}

// MARK: - Row

struct BillRowItem: View {
    @EnvironmentObject var store: AppStore
    let bill: Bill
    let paid: Bool
    let editing: Bool
    let onEdit: () -> Void
    let onDelete: () -> Void
    @State private var editAmt = false
    @State private var amtText = ""
    @State private var confirmDelete = false

    private var sub: String {
        var parts = [dueStr]
        if let c = bill.category, !c.isEmpty { parts.append(c) }
        if let p = bill.paymentMethod, !p.isEmpty { parts.append(p.capitalized) }
        var s = parts.joined(separator: " · ")
        if paid { s += " · PAID" }
        return s
    }
    private var dueStr: String {
        switch bill.frequency ?? "monthly" {
        case "payday": return "Every Pay Day"
        case "biweekly": return "Biweekly"
        case "quarterly": return "Quarterly"
        case "annually": return "Annually"
        case "one-time": return "One-time · " + (bill.dueDate.map { shortDate($0) } ?? "no date")
        case "semi-monthly": return "Due the \(ord(bill.dueDay ?? 0)) & \(ord(bill.dueDay2 ?? 0))"
        default: return bill.dueDay.map { "Due the \(ord($0))" } ?? "Monthly"
        }
    }

    var body: some View {
        HStack(alignment: .center, spacing: 8) {
            VStack(alignment: .leading, spacing: 3) {
                Text(bill.name).font(.system(size: 13.5, weight: .medium))
                    .foregroundStyle(paid ? Color.sMuted : Color.sInk).strikethrough(paid, color: Color.sMuted)
                Text(sub).font(.system(size: 11)).foregroundStyle(Color.sMuted)
            }
            Spacer()
            if editAmt {
                TextField("", text: $amtText)
                    .textFieldStyle(.plain).multilineTextAlignment(.trailing).frame(width: 100)
                    .font(.system(size: 14, design: .monospaced)).foregroundStyle(Color.sInk)
                    .padding(.horizontal, 8).padding(.vertical, 4)
                    .background(Color(red: 0x2D/255, green: 0x2B/255, blue: 0x45/255))
                    .overlay(RoundedRectangle(cornerRadius: 6).stroke(Color.sAccent, lineWidth: 1))
                    .onSubmit { commitAmt() }
            } else {
                Text(money(bill.amount)).font(.system(size: 14, weight: .medium, design: .monospaced)).foregroundStyle(Color.sGood)
                    .onTapGesture { amtText = String(format: "%.2f", bill.amount); editAmt = true }
                    .help("Click to edit")
            }
            outlineBtn(editing ? "Cancel" : "Edit", .sMuted, action: onEdit)
            if confirmDelete {
                outlineBtn("Confirm", .sBad) { onDelete(); confirmDelete = false }
                outlineBtn("Cancel", .sMuted) { confirmDelete = false }
            } else {
                outlineBtn("Delete", .sBad) { confirmDelete = true }
            }
        }
        .padding(.vertical, 12)
        .overlay(Rectangle().fill(Color.white.opacity(0.04)).frame(height: 1), alignment: .bottom)
    }

    private func commitAmt() {
        editAmt = false
        if let v = Double(amtText.filter { "0123456789.".contains($0) }), v != bill.amount {
            Task { await store.saveBillAmount(billId: bill.id, amount: v) }
        }
    }
    private func outlineBtn(_ title: String, _ color: Color, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Text(title).font(.system(size: 11)).foregroundStyle(color)
                .padding(.horizontal, 10).padding(.vertical, 4)
                .overlay(RoundedRectangle(cornerRadius: 6).stroke(color.opacity(0.35), lineWidth: 1))
        }.buttonStyle(.plain)
    }
}

// MARK: - Inline add/edit form

struct BillFormPanel: View {
    @EnvironmentObject var store: AppStore
    @Binding var draft: BillDraft
    let isEdit: Bool
    let onSave: () -> Void
    let onCancel: () -> Void
    let onDelete: (() -> Void)?
    @State private var confirmDelete = false

    private var monthBinding: Binding<String> {
        Binding(get: { draft.dueMonth.map(String.init) ?? "" }, set: { draft.dueMonth = Int($0) })
    }
    private var categoryOpts: [(String, String)] {
        var names = store.categories.map { $0.name }
        if names.isEmpty { names = ["Housing", "Utilities", "Insurance", "Subscriptions", "Loans", "Transportation", "Food & Gas", "Savings", "Other"] }
        if !draft.category.isEmpty && !names.contains(draft.category) { names.insert(draft.category, at: 0) }
        return [("", "Select category")] + names.map { ($0, $0) }
    }
    private var acctOpts: [(String, String)] {
        [("", draft.isTransfer ? "Transfer from which account?" : "Which account pays this?")]
        + store.accounts.sorted { $0.name < $1.name }.map { ($0.id, $0.name) }
    }
    private var transferOpts: [(String, String)] {
        [("", "Transfer to which account?")]
        + store.accounts.sorted { $0.name < $1.name }.map { ($0.id, $0.name + ($0.isAccumulating == true ? " (saving)" : "")) }
    }
    private let monthOpts: [(String, String)] = [("", "Due month")] + (1...12).map { (String($0), monthName($0)) }

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            if isEdit == false {
                Text("New Bill").font(.system(size: 13, weight: .semibold)).foregroundStyle(Color.sInk)
            }
            HStack(spacing: 12) {
                STextField(label: "Name", placeholder: "Bill name", text: $draft.name)
                SNumberField(label: "Amount", value: $draft.amount)
            }
            HStack(spacing: 12) {
                SPicker(label: "Frequency", selection: $draft.frequency, options: freqOptions)
                SPicker(label: "Payment method", selection: $draft.paymentMethod, options: paymentOptions)
            }
            HStack(spacing: 12) {
                SPicker(label: "Category", selection: $draft.category, options: categoryOpts)
                SPicker(label: "Account", selection: $draft.accountId, options: acctOpts)
            }
            dateRow
            SToggle(label: "This is a transfer to another account", isOn: $draft.isTransfer)
            if draft.isTransfer {
                SPicker(label: "Transfer to", selection: $draft.transferToId, options: transferOpts)
            }

            HStack(spacing: 8) {
                Button(action: onSave) {
                    Text(isEdit ? "Save Changes" : "Add Bill").font(.system(size: 13, weight: .semibold)).foregroundStyle(.white)
                        .padding(.horizontal, 16).padding(.vertical, 8)
                        .background(canSave ? Color.sAccent : Color.sAccent.opacity(0.4)).clipShape(RoundedRectangle(cornerRadius: 6))
                }.buttonStyle(.plain).disabled(!canSave)
                Button(action: onCancel) {
                    Text("Cancel").font(.system(size: 13)).foregroundStyle(Color.sMuted)
                        .padding(.horizontal, 16).padding(.vertical, 8)
                        .overlay(RoundedRectangle(cornerRadius: 6).stroke(Color.white.opacity(0.1), lineWidth: 1))
                }.buttonStyle(.plain)
                if isEdit, let onDelete {
                    Spacer()
                    if confirmDelete {
                        deleteBtn("Confirm Delete", filled: true) { onDelete() }
                        deleteBtn("Cancel", filled: false) { confirmDelete = false }
                    } else {
                        deleteBtn("Delete", filled: false) { confirmDelete = true }
                    }
                }
            }
            .padding(.top, 4)
        }
        .padding(16)
        .background(Color(red: 0x13/255, green: 0x11/255, blue: 0x1F/255))
        .overlay(RoundedRectangle(cornerRadius: 8).stroke(Color.sAccent.opacity(0.3), lineWidth: 1))
        .clipShape(RoundedRectangle(cornerRadius: 8))
        .padding(.vertical, isEdit ? 6 : 0)
    }

    private var canSave: Bool { !draft.name.isEmpty && draft.amount != nil }

    @ViewBuilder private var dateRow: some View {
        switch draft.frequency {
        case "one-time":
            SDateField(label: "Date", dateStr: $draft.dueDate)
        case "payday":
            EmptyView()
        case "semi-monthly":
            HStack(spacing: 12) {
                SIntField(label: "1st due", placeholder: "1", value: $draft.dueDay)
                SIntField(label: "2nd due", placeholder: "15", value: $draft.dueDay2)
            }
        case "quarterly", "annually":
            HStack(spacing: 12) {
                SPicker(label: "Due month", selection: monthBinding, options: monthOpts)
                SIntField(label: "Due day", placeholder: "1", value: $draft.dueDay)
            }
        default:
            SIntField(label: "Due day", placeholder: "1", value: $draft.dueDay)
        }
    }

    private func deleteBtn(_ title: String, filled: Bool, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Text(title).font(.system(size: 13, weight: filled ? .semibold : .regular)).foregroundStyle(Color.sBad)
                .padding(.horizontal, 16).padding(.vertical, 8)
                .overlay(RoundedRectangle(cornerRadius: 6).stroke(Color.sBad.opacity(filled ? 0.8 : 0.3), lineWidth: 1))
        }.buttonStyle(.plain)
    }
}
