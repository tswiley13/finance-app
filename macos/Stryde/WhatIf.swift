import SwiftUI

extension AppStore {
    struct ScenarioPayload: Encodable {
        var householdId: String; var name: String; var data: WhatIfData; var updatedAt: String
    }
    func saveScenario(id: String?, name: String, data: WhatIfData) async -> String? {
        let p = ScenarioPayload(householdId: household?.id ?? "", name: name, data: data,
                                updatedAt: ISO8601DateFormatter().string(from: Date()))
        do {
            if let id {
                try await client.from("what_if_scenarios").update(p).eq("id", value: id).execute()
                await loadData(); return id
            } else {
                struct R: Decodable { var id: String }
                let r: R = try await client.from("what_if_scenarios").insert(p).select("id").single().execute().value
                await loadData(); return r.id
            }
        } catch { errorMessage = error.localizedDescription; return nil }
    }
    func deleteScenario(id: String) async {
        do { try await client.from("what_if_scenarios").delete().eq("id", value: id).execute(); await loadData() }
        catch { errorMessage = error.localizedDescription }
    }
}

struct MonthlyOverviewView: View {
    @EnvironmentObject var store: AppStore

    @State private var whatIf = false
    @State private var data = WhatIfData()
    @State private var activeId: String?
    @State private var scenarioName = ""
    @State private var saved = ""
    @State private var newBillName = ""; @State private var newBillAmt = ""
    @State private var newIncName = "";  @State private var newIncAmt = ""

    // MARK: effective values (respect What-If overrides)

    private func billEnabled(_ b: Bill) -> Bool { data.bills[b.id]?.enabled ?? true }
    private func billMonthly(_ b: Bill) -> Double {
        if let a = data.bills[b.id]?.amount, let v = Double(a) { return v }
        return b.amount * Finance.billMult(b.frequency)
    }
    private func realBillMonthly(_ b: Bill) -> Double { b.amount * Finance.billMult(b.frequency) }
    private func incEnabled(_ i: Income) -> Bool { data.income[i.id]?.enabled ?? true }
    private func incMonthly(_ i: Income) -> Double {
        if let a = data.income[i.id]?.amount, let v = Double(a) { return v }
        return (i.fixedAmount ?? 0) * Finance.incMult(i.frequency)
    }

    private var recurringBills: [Bill] {
        store.bills.filter { $0.isActive != false && Finance.billMult($0.frequency) > 0 }
            .sorted { realBillMonthly($0) > realBillMonthly($1) }
    }
    private var incomeSources: [Income] {
        store.income.filter { $0.isActive != false }
            .sorted { incMonthly($0) > incMonthly($1) }
    }

    private var totalBills: Double {
        recurringBills.filter { billEnabled($0) }.reduce(0) { $0 + billMonthly($1) }
        + data.extraBills.filter { $0.enabled != false }.reduce(0) { $0 + (Double($1.amount) ?? 0) }
    }
    private var totalIncome: Double {
        incomeSources.filter { incEnabled($0) }.reduce(0) { $0 + incMonthly($1) }
        + data.extraIncome.filter { $0.enabled != false }.reduce(0) { $0 + (Double($1.amount) ?? 0) }
    }

    var body: some View {
        Page(title: "Monthly Overview",
             subtitle: "A full, typical month. Turn on What-If to model changes and save scenarios.") { w in
            HStack {
                Spacer()
                Button { whatIf.toggle() } label: {
                    HStack(spacing: 6) {
                        Image(systemName: whatIf ? "slider.horizontal.2.square.on.square" : "slider.horizontal.3").font(.system(size: 12, weight: .semibold))
                        Text(whatIf ? "Exit What-If" : "What-If Mode").font(.system(size: 13, weight: .semibold))
                    }
                    .foregroundStyle(whatIf ? .white : Color.sAccent)
                    .padding(.horizontal, 14).padding(.vertical, 8)
                    .background(whatIf ? Color.sWarn : Color.clear)
                    .overlay(RoundedRectangle(cornerRadius: 8).stroke(whatIf ? Color.clear : Color.sAccent.opacity(0.5), lineWidth: 1))
                    .clipShape(RoundedRectangle(cornerRadius: 8))
                }.buttonStyle(.plain)
            }

            if whatIf { scenarioBar }

            HStack(spacing: 12) {
                StatTile(label: "Monthly Income", value: totalIncome, accent: .sGood)
                StatTile(label: "Monthly Bills", value: totalBills, accent: whatIf ? .sWarn : .sBad)
                StatTile(label: "Left Over / mo", value: totalIncome - totalBills, accent: totalIncome - totalBills < 0 ? .sBad : .sAccent)
            }

            if w >= 900 {
                HStack(alignment: .top, spacing: 16) {
                    billsPanel.frame(maxWidth: .infinity, alignment: .top)
                    incomePanel.frame(maxWidth: .infinity, alignment: .top)
                }
            } else { billsPanel; incomePanel }
        }
    }

    // MARK: scenario bar

    private var scenarioBar: some View {
        HStack(spacing: 8) {
            Menu {
                Button("New scenario") { newScenario() }
                if !store.scenarios.isEmpty { Divider() }
                ForEach(store.scenarios) { s in Button(s.name) { load(s) } }
            } label: {
                HStack(spacing: 6) {
                    Image(systemName: "square.stack.3d.up").font(.system(size: 12))
                    Text(activeId == nil ? "Scenarios" : "Loaded").font(.system(size: 13, weight: .medium))
                }
                .foregroundStyle(Color.sInk).padding(.horizontal, 12).padding(.vertical, 8)
                .background(Color.white.opacity(0.05)).clipShape(RoundedRectangle(cornerRadius: 8))
            }
            .menuStyle(.borderlessButton).fixedSize()

            TextField("Scenario name", text: $scenarioName).sInput().frame(maxWidth: 220)

            Button { saveScenario() } label: {
                Text(saved == "1" ? "Saved!" : (activeId == nil ? "Save" : "Save changes"))
                    .font(.system(size: 13, weight: .semibold)).foregroundStyle(.white)
                    .padding(.horizontal, 14).padding(.vertical, 8).background(Color.sAccent).clipShape(RoundedRectangle(cornerRadius: 8))
            }.buttonStyle(.plain).disabled(scenarioName.trimmingCharacters(in: .whitespaces).isEmpty)

            if activeId != nil {
                iconButton("plus.square.on.square", "Duplicate") { duplicate() }
                iconButton("trash", "Delete", danger: true) { if let id = activeId { Task { await store.deleteScenario(id: id) }; newScenario() } }
            }
            Spacer()
            Button("Reset") { data = WhatIfData() }.buttonStyle(.plain).foregroundStyle(Color.sMuted).font(.system(size: 12))
        }
        .padding(12).background(Color.sPanel).clipShape(RoundedRectangle(cornerRadius: 10))
        .overlay(RoundedRectangle(cornerRadius: 10).stroke(Color.sWarn.opacity(0.25), lineWidth: 1))
    }

    private func iconButton(_ icon: String, _ help: String, danger: Bool = false, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Image(systemName: icon).font(.system(size: 13)).foregroundStyle(danger ? Color.sBad : Color.sMuted)
                .padding(8).background(Color.white.opacity(0.05)).clipShape(RoundedRectangle(cornerRadius: 8))
        }.buttonStyle(.plain).help(help)
    }

    // MARK: panels

    private var billsPanel: some View {
        Panel(title: "Bills (monthly)", count: recurringBills.count + data.extraBills.count) {
            if recurringBills.isEmpty && data.extraBills.isEmpty {
                EmptyRow(text: "No bills")
            } else {
                ForEach(recurringBills) { b in
                    WILineRow(name: b.name, sub: Finance.freqLabel(b.frequency),
                              enabled: billEnabled(b), monthly: billMonthly(b),
                              changed: whatIf && data.bills[b.id]?.amount != nil && Double(data.bills[b.id]!.amount ?? "") != realBillMonthly(b),
                              editable: whatIf, color: .sBad,
                              onToggle: { setBill(b.id, "enabled", !billEnabled(b)) },
                              onAmount: { setBill(b.id, "amount", $0) }, onDelete: nil)
                }
                ForEach(data.extraBills) { e in
                    WILineRow(name: e.name, sub: "hypothetical", enabled: e.enabled != false, monthly: Double(e.amount) ?? 0,
                              changed: false, editable: whatIf, color: .sBad,
                              onToggle: { toggleExtra(&data.extraBills, e.id) },
                              onAmount: { setExtraAmount(&data.extraBills, e.id, $0) },
                              onDelete: { data.extraBills.removeAll { $0.id == e.id } })
                }
                if whatIf { addLine(name: $newBillName, amt: $newBillAmt) { addExtra(&data.extraBills) } }
            }
        }
    }

    private var incomePanel: some View {
        Panel(title: "Income (monthly)", count: incomeSources.count + data.extraIncome.count) {
            if incomeSources.isEmpty && data.extraIncome.isEmpty {
                EmptyRow(text: "No income")
            } else {
                ForEach(incomeSources) { i in
                    WILineRow(name: i.name, sub: Finance.freqLabel(i.frequency),
                              enabled: incEnabled(i), monthly: incMonthly(i),
                              changed: whatIf && data.income[i.id]?.amount != nil,
                              editable: whatIf, color: .sGood,
                              onToggle: { setInc(i.id, "enabled", !incEnabled(i)) },
                              onAmount: { setInc(i.id, "amount", $0) }, onDelete: nil)
                }
                ForEach(data.extraIncome) { e in
                    WILineRow(name: e.name, sub: "hypothetical", enabled: e.enabled != false, monthly: Double(e.amount) ?? 0,
                              changed: false, editable: whatIf, color: .sGood,
                              onToggle: { toggleExtra(&data.extraIncome, e.id) },
                              onAmount: { setExtraAmount(&data.extraIncome, e.id, $0) },
                              onDelete: { data.extraIncome.removeAll { $0.id == e.id } })
                }
                if whatIf { addLine(name: $newIncName, amt: $newIncAmt) { addExtra(&data.extraIncome, income: true) } }
            }
        }
    }

    private func addLine(name: Binding<String>, amt: Binding<String>, add: @escaping () -> Void) -> some View {
        HStack(spacing: 6) {
            TextField("Add line…", text: name).sInput()
            TextField("$/mo", text: amt).sInput().frame(width: 90)
            Button { add() } label: {
                Image(systemName: "plus").font(.system(size: 11, weight: .bold)).foregroundStyle(.white)
                    .padding(8).background(Color.sAccent).clipShape(RoundedRectangle(cornerRadius: 6))
            }.buttonStyle(.plain)
        }
        .padding(.top, 8)
    }

    // MARK: mutations to `data`

    private func setBill(_ id: String, _ field: String, _ value: Any) {
        var ov = data.bills[id] ?? WIOverride()
        if field == "enabled" { ov.enabled = value as? Bool } else if field == "amount" { ov.amount = value as? String }
        data.bills[id] = ov
    }
    private func setInc(_ id: String, _ field: String, _ value: Any) {
        var ov = data.income[id] ?? WIOverride()
        if field == "enabled" { ov.enabled = value as? Bool } else if field == "amount" { ov.amount = value as? String }
        data.income[id] = ov
    }
    private func toggleExtra(_ list: inout [WIExtra], _ id: String) {
        if let i = list.firstIndex(where: { $0.id == id }) { list[i].enabled = !(list[i].enabled != false) }
    }
    private func setExtraAmount(_ list: inout [WIExtra], _ id: String, _ v: String) {
        if let i = list.firstIndex(where: { $0.id == id }) { list[i].amount = v }
    }
    private func addExtra(_ list: inout [WIExtra], income: Bool = false) {
        let name = (income ? newIncName : newBillName).trimmingCharacters(in: .whitespaces)
        let amt = income ? newIncAmt : newBillAmt
        guard !name.isEmpty else { return }
        list.append(WIExtra(id: UUID().uuidString, name: name, amount: amt.isEmpty ? "0" : amt, enabled: true))
        if income { newIncName = ""; newIncAmt = "" } else { newBillName = ""; newBillAmt = "" }
    }

    // MARK: scenario actions

    private func newScenario() { data = WhatIfData(); activeId = nil; scenarioName = "" }
    private func load(_ s: Scenario) { data = s.data; activeId = s.id; scenarioName = s.name; whatIf = true }
    private func saveScenario() {
        let name = scenarioName.trimmingCharacters(in: .whitespaces); guard !name.isEmpty else { return }
        Task {
            if let id = await store.saveScenario(id: activeId, name: name, data: data) {
                activeId = id; saved = "1"
                DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) { if saved == "1" { saved = "" } }
            }
        }
    }
    private func duplicate() {
        Task { if let id = await store.saveScenario(id: nil, name: scenarioName + " (copy)", data: data) { activeId = id; scenarioName += " (copy)" } }
    }
}

// A bill/income line that becomes editable in What-If mode.
struct WILineRow: View {
    let name: String
    let sub: String
    let enabled: Bool
    let monthly: Double
    let changed: Bool
    let editable: Bool
    let color: Color
    let onToggle: () -> Void
    let onAmount: (String) -> Void
    let onDelete: (() -> Void)?
    @State private var text = ""

    var body: some View {
        HStack(spacing: 10) {
            if editable {
                Button(action: onToggle) {
                    Image(systemName: enabled ? "checkmark.square.fill" : "square")
                        .font(.system(size: 15)).foregroundStyle(enabled ? Color.sAccent : Color.sMuted.opacity(0.6))
                }.buttonStyle(.plain)
            }
            VStack(alignment: .leading, spacing: 2) {
                Text(name).font(.system(size: 13, weight: .medium))
                    .foregroundStyle(enabled ? Color.sInk : Color.sMuted).strikethrough(!enabled, color: Color.sMuted)
                Text(sub).font(.system(size: 11)).foregroundStyle(Color.sMuted)
            }
            Spacer()
            if editable {
                TextField("0", text: $text)
                    .textFieldStyle(.plain).multilineTextAlignment(.trailing)
                    .font(.system(size: 13, design: .monospaced)).foregroundStyle(enabled ? Color.sInk : Color.sMuted)
                    .padding(.horizontal, 10).padding(.vertical, 6)
                    .background(changed ? Color.sWarn.opacity(0.1) : Color.white.opacity(0.04))
                    .clipShape(RoundedRectangle(cornerRadius: 6))
                    .overlay(RoundedRectangle(cornerRadius: 6).stroke(changed ? Color.sWarn.opacity(0.5) : Color.white.opacity(0.1), lineWidth: 1))
                    .frame(width: 110)
                    .onSubmit { onAmount(text) }
                if let onDelete {
                    Button(action: onDelete) { Image(systemName: "xmark").font(.system(size: 10)).foregroundStyle(Color.sBad) }.buttonStyle(.plain)
                } else { Spacer().frame(width: 12) }
            } else {
                Text(money(monthly)).font(.system(size: 13, design: .monospaced)).foregroundStyle(enabled ? color : Color.sMuted)
            }
        }
        .padding(.vertical, 8)
        .overlay(Rectangle().fill(Color.white.opacity(0.04)).frame(height: 1), alignment: .bottom)
        .onAppear { text = monthly == monthly.rounded() ? String(Int(monthly)) : String(format: "%.2f", monthly) }
    }
}
