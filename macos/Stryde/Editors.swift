import SwiftUI

func nilIfEmpty(_ s: String) -> String? { s.isEmpty ? nil : s }

private let billFreqOptions: [(String, String)] = [
    ("monthly", "Monthly"), ("semi-monthly", "Semi-monthly"), ("biweekly", "Every 2 weeks"),
    ("weekly", "Weekly"), ("quarterly", "Quarterly"), ("annually", "Yearly"), ("one-time", "One-time"),
]
private let incomeFreqOptions: [(String, String)] = [
    ("weekly", "Weekly"), ("biweekly", "Every 2 weeks"), ("semi-monthly", "Semi-monthly"), ("monthly", "Monthly"),
]
private let acctTypeOptions: [(String, String)] = [
    ("checking", "Checking"), ("savings", "Savings"), ("credit", "Credit"),
]

extension AppStore {
    var acctOptions: [(String, String)] {
        [("", "None")] + accounts.sorted { $0.name < $1.name }.map { ($0.id, $0.name) }
    }
    func categoryOptions(including current: String) -> [(String, String)] {
        var names = categories.map { $0.name }
        if names.isEmpty {
            names = ["Housing", "Utilities", "Insurance", "Subscriptions", "Loans",
                     "Transportation", "Food & Gas", "Savings", "Other"]
        }
        if !current.isEmpty && !names.contains(current) { names.insert(current, at: 0) }
        return names.map { ($0, $0) }
    }
    var ownerOptions: [(String, String)] {
        [("joint", "Joint")] + members.map { ($0.name, $0.name) }
    }
}

// MARK: - Bill

struct BillPayload: Encodable {
    var householdId: String
    var name: String
    var amount: Double
    var frequency: String
    var dueDay: Int
    var dueDay2: Int?
    var dueMonth: Int? = nil
    var dueDate: String?
    var paymentMethod: String
    var category: String
    var owner: String
    var accountId: String?
    var transferToAccountId: String?
    var isVariable: Bool
    var isActive: Bool
}

struct BillEditor: View {
    @EnvironmentObject var store: AppStore
    let existing: Bill?

    @State private var name: String
    @State private var amount: Double?
    @State private var frequency: String
    @State private var category: String
    @State private var owner: String
    @State private var dueDay: Int?
    @State private var dueDay2: Int?
    @State private var dueDate: String
    @State private var accountId: String
    @State private var transferId: String
    @State private var paymentMethod: String
    @State private var isVariable: Bool
    @State private var isActive: Bool

    init(existing: Bill?) {
        self.existing = existing
        _name = State(initialValue: existing?.name ?? "")
        _amount = State(initialValue: existing?.amount)
        _frequency = State(initialValue: existing?.frequency ?? "monthly")
        _category = State(initialValue: existing?.category ?? "")
        _owner = State(initialValue: existing?.owner ?? "joint")
        _dueDay = State(initialValue: existing?.dueDay)
        _dueDay2 = State(initialValue: existing?.dueDay2)
        _dueDate = State(initialValue: existing?.dueDate ?? "")
        _accountId = State(initialValue: existing?.accountId ?? "")
        _transferId = State(initialValue: existing?.transferToAccountId ?? "")
        _paymentMethod = State(initialValue: existing?.paymentMethod ?? "")
        _isVariable = State(initialValue: existing?.isVariable ?? false)
        _isActive = State(initialValue: existing?.isActive ?? true)
    }

    var body: some View {
        EditorSheet(
            title: existing == nil ? "New Bill" : "Edit Bill",
            canSave: !name.isEmpty && amount != nil,
            onSave: save,
            onDelete: existing.map { b in { Task { await store.remove("bills", id: b.id) } } }
        ) {
            STextField(label: "Name", placeholder: "e.g. Electric", text: $name)
            SNumberField(label: "Amount", value: $amount)
            SPicker(label: "Frequency", selection: $frequency, options: billFreqOptions)
            if frequency == "one-time" {
                SDateField(label: "Date", dateStr: $dueDate)
            } else if frequency == "semi-monthly" {
                HStack(spacing: 10) {
                    SIntField(label: "Due day", placeholder: "1", value: $dueDay)
                    SIntField(label: "2nd day", placeholder: "15", value: $dueDay2)
                }
            } else if frequency != "biweekly" && frequency != "payday" {
                SIntField(label: "Due day", placeholder: "1", value: $dueDay)
            }
            SPicker(label: "Category", selection: $category, options: store.categoryOptions(including: category))
            SPicker(label: "Owner", selection: $owner, options: store.ownerOptions)
            SPicker(label: "Pay from account", selection: $accountId, options: store.acctOptions)
            SPicker(label: "Transfer to (optional)", selection: $transferId, options: store.acctOptions)
            STextField(label: "Payment method", placeholder: "e.g. Checking", text: $paymentMethod)
            SToggle(label: "Variable amount", isOn: $isVariable)
            SToggle(label: "Active", isOn: $isActive)
        }
    }

    private func save() {
        let p = BillPayload(
            householdId: store.household?.id ?? "",
            name: name, amount: amount ?? 0, frequency: frequency,
            dueDay: dueDay ?? (frequency == "one-time" ? 0 : 1),
            dueDay2: frequency == "semi-monthly" ? dueDay2 : nil,
            dueDate: frequency == "one-time" ? nilIfEmpty(dueDate) : nil,
            paymentMethod: paymentMethod,
            category: category.isEmpty ? "Other" : category,
            owner: owner,
            accountId: nilIfEmpty(accountId),
            transferToAccountId: nilIfEmpty(transferId),
            isVariable: isVariable, isActive: isActive
        )
        Task { await store.save("bills", id: existing?.id, p) }
    }
}

// MARK: - Income

struct IncomePayload: Encodable {
    var householdId: String
    var name: String
    var owner: String
    var type: String
    var frequency: String
    var fixedAmount: Double
    var nextPayDate: String?
    var depositAccountId: String?
    var isActive: Bool
}

struct IncomeEditor: View {
    @EnvironmentObject var store: AppStore
    let existing: Income?

    @State private var name: String
    @State private var owner: String
    @State private var type: String
    @State private var frequency: String
    @State private var amount: Double?
    @State private var nextPayDate: String
    @State private var depositId: String
    @State private var isActive: Bool

    init(existing: Income?) {
        self.existing = existing
        _name = State(initialValue: existing?.name ?? "")
        _owner = State(initialValue: existing?.owner ?? "joint")
        _type = State(initialValue: existing?.type ?? "salary")
        _frequency = State(initialValue: existing?.frequency ?? "biweekly")
        _amount = State(initialValue: existing?.fixedAmount)
        _nextPayDate = State(initialValue: existing?.nextPayDate ?? localDateStr())
        _depositId = State(initialValue: existing?.depositAccountId ?? "")
        _isActive = State(initialValue: existing?.isActive ?? true)
    }

    var body: some View {
        EditorSheet(
            title: existing == nil ? "New Income" : "Edit Income",
            canSave: !name.isEmpty && amount != nil,
            onSave: save,
            onDelete: existing.map { i in { Task { await store.remove("income", id: i.id) } } }
        ) {
            STextField(label: "Name", placeholder: "e.g. Paycheck", text: $name)
            SNumberField(label: "Amount per check", value: $amount)
            SPicker(label: "Frequency", selection: $frequency, options: incomeFreqOptions)
            SDateField(label: "Next pay date", dateStr: $nextPayDate)
            SPicker(label: "Owner", selection: $owner, options: store.ownerOptions)
            SPicker(label: "Deposit account", selection: $depositId, options: store.acctOptions)
            SToggle(label: "Active", isOn: $isActive)
        }
    }

    private func save() {
        let p = IncomePayload(
            householdId: store.household?.id ?? "",
            name: name, owner: owner, type: type, frequency: frequency,
            fixedAmount: amount ?? 0,
            nextPayDate: nilIfEmpty(nextPayDate),
            depositAccountId: nilIfEmpty(depositId),
            isActive: isActive
        )
        Task { await store.save("income", id: existing?.id, p) }
    }
}

// MARK: - Account

struct AccountPayload: Encodable {
    var householdId: String
    var name: String
    var bankName: String?
    var lastFour: String?
    var accountType: String
    var currentBalance: Double
    var isPrimary: Bool
    var isAccumulating: Bool
    var accumulationTarget: Double?
    var dueDay: Int?
    var minimumBuffer: Double
}

struct AccountEditor: View {
    @EnvironmentObject var store: AppStore
    let existing: Account?

    @State private var name: String
    @State private var bankName: String
    @State private var lastFour: String
    @State private var accountType: String
    @State private var balance: Double?
    @State private var isPrimary: Bool
    @State private var isAccumulating: Bool
    @State private var target: Double?
    @State private var dueDay: Int?
    @State private var buffer: Double?

    init(existing: Account?) {
        self.existing = existing
        _name = State(initialValue: existing?.name ?? "")
        _bankName = State(initialValue: existing?.bankName ?? "")
        _lastFour = State(initialValue: existing?.lastFour ?? "")
        _accountType = State(initialValue: existing?.accountType ?? "checking")
        _balance = State(initialValue: existing?.currentBalance)
        _isPrimary = State(initialValue: existing?.isPrimary ?? false)
        _isAccumulating = State(initialValue: existing?.isAccumulating ?? false)
        _target = State(initialValue: existing?.accumulationTarget)
        _dueDay = State(initialValue: existing?.dueDay)
        _buffer = State(initialValue: existing?.minimumBuffer)
    }

    var body: some View {
        EditorSheet(
            title: existing == nil ? "New Account" : "Edit Account",
            canSave: !name.isEmpty,
            onSave: save,
            onDelete: existing.map { a in { Task { await store.remove("accounts", id: a.id) } } }
        ) {
            STextField(label: "Name", placeholder: "e.g. Wiley Spending", text: $name)
            HStack(spacing: 10) {
                STextField(label: "Bank", text: $bankName)
                STextField(label: "Last 4", text: $lastFour)
            }
            SPicker(label: "Type", selection: $accountType, options: acctTypeOptions)
            SNumberField(label: "Current balance", value: $balance)
            SToggle(label: "Primary (spending) account", isOn: $isPrimary)
            SToggle(label: "Accumulating (save toward a target)", isOn: $isAccumulating)
            if isAccumulating {
                SNumberField(label: "Target", value: $target)
                SIntField(label: "Due day", placeholder: "1", value: $dueDay)
            }
            SNumberField(label: "Minimum buffer", value: $buffer)
        }
    }

    private func save() {
        let p = AccountPayload(
            householdId: store.household?.id ?? "",
            name: name, bankName: nilIfEmpty(bankName), lastFour: nilIfEmpty(lastFour),
            accountType: accountType, currentBalance: balance ?? 0,
            isPrimary: isPrimary, isAccumulating: isAccumulating,
            accumulationTarget: isAccumulating ? target : nil,
            dueDay: isAccumulating ? dueDay : nil,
            minimumBuffer: buffer ?? 0
        )
        Task { await store.save("accounts", id: existing?.id, p) }
    }
}

// MARK: - Debt

struct DebtPayload: Encodable {
    var householdId: String
    var name: String
    var owner: String
    var category: String
    var balance: Double
    var originalBalance: Double?
    var interestRate: Double?
    var minimumPayment: Double?
    var termMonths: Int?
    var monthsRemaining: Int?
}

struct DebtEditor: View {
    @EnvironmentObject var store: AppStore
    let existing: Debt?

    @State private var name: String
    @State private var owner: String
    @State private var category: String
    @State private var balance: Double?
    @State private var original: Double?
    @State private var ratePct: Double?
    @State private var minPayment: Double?
    @State private var termMonths: Int?
    @State private var monthsRemaining: Int?

    init(existing: Debt?) {
        self.existing = existing
        _name = State(initialValue: existing?.name ?? "")
        _owner = State(initialValue: existing?.owner ?? "joint")
        _category = State(initialValue: existing?.category ?? "Loan")
        _balance = State(initialValue: existing?.balance)
        _original = State(initialValue: existing?.originalBalance)
        _ratePct = State(initialValue: existing?.interestRate.map { $0 * 100 })
        _minPayment = State(initialValue: existing?.minimumPayment)
        _termMonths = State(initialValue: existing?.termMonths)
        _monthsRemaining = State(initialValue: existing?.monthsRemaining)
    }

    var body: some View {
        EditorSheet(
            title: existing == nil ? "New Debt" : "Edit Debt",
            canSave: !name.isEmpty && balance != nil,
            onSave: save,
            onDelete: existing.map { d in { Task { await store.remove("debts", id: d.id) } } }
        ) {
            STextField(label: "Name", placeholder: "e.g. Capital One", text: $name)
            SNumberField(label: "Current balance", value: $balance)
            SNumberField(label: "Original balance", value: $original)
            SNumberField(label: "Interest rate (%)", prefix: nil, value: $ratePct)
            SNumberField(label: "Minimum payment", value: $minPayment)
            HStack(spacing: 10) {
                SIntField(label: "Loan term (months)", value: $termMonths)
                SIntField(label: "Months remaining", value: $monthsRemaining)
            }
            STextField(label: "Category", placeholder: "e.g. Auto loan", text: $category)
            SPicker(label: "Owner", selection: $owner, options: store.ownerOptions)
        }
    }

    private func save() {
        let p = DebtPayload(
            householdId: store.household?.id ?? "",
            name: name, owner: owner, category: category.isEmpty ? "Loan" : category,
            balance: balance ?? 0, originalBalance: original,
            interestRate: ratePct.map { $0 / 100 }, minimumPayment: minPayment,
            termMonths: termMonths, monthsRemaining: monthsRemaining
        )
        Task { await store.save("debts", id: existing?.id, p) }
    }
}
