import SwiftUI

// Wraps an optional entity for `.sheet(item:)`; nil value = "new".
struct Editing<T>: Identifiable {
    let id = UUID()
    var value: T?
    init(_ value: T? = nil) { self.value = value }
}

// Dark input styling used across all editors.
struct SInput: ViewModifier {
    func body(content: Content) -> some View {
        content
            .textFieldStyle(.plain)
            .foregroundStyle(Color.sInk)
            .font(.system(size: 14))
            .padding(.horizontal, 12)
            .padding(.vertical, 9)
            .background(Color.white.opacity(0.045))
            .clipShape(RoundedRectangle(cornerRadius: 8))
            .overlay(RoundedRectangle(cornerRadius: 8).stroke(Color.white.opacity(0.1), lineWidth: 1))
    }
}
extension View { func sInput() -> some View { modifier(SInput()) } }

// Labeled field container.
struct SField<Content: View>: View {
    let label: String
    @ViewBuilder var content: Content
    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(label.uppercased())
                .font(.system(size: 10, weight: .semibold)).tracking(1)
                .foregroundStyle(Color.sMuted)
            content
        }
    }
}

struct STextField: View {
    let label: String
    var placeholder: String = ""
    @Binding var text: String
    var body: some View {
        SField(label: label) { TextField(placeholder, text: $text).sInput() }
    }
}

// Number field backed by an optional Double (blank = nil).
struct SNumberField: View {
    let label: String
    var placeholder: String = "0"
    var prefix: String? = "$"
    @Binding var value: Double?
    @State private var text = ""
    var body: some View {
        SField(label: label) {
            HStack(spacing: 6) {
                if let prefix { Text(prefix).foregroundStyle(Color.sMuted).font(.system(size: 14)) }
                TextField(placeholder, text: $text)
                    .textFieldStyle(.plain).foregroundStyle(Color.sInk).font(.system(size: 14))
                    .onChange(of: text) { _, t in value = Double(t.filter { "0123456789.".contains($0) }) }
            }
            .padding(.horizontal, 12).padding(.vertical, 9)
            .background(Color.white.opacity(0.045))
            .clipShape(RoundedRectangle(cornerRadius: 8))
            .overlay(RoundedRectangle(cornerRadius: 8).stroke(Color.white.opacity(0.1), lineWidth: 1))
        }
        .onAppear { text = value.map { $0 == $0.rounded() ? String(Int($0)) : String($0) } ?? "" }
    }
}

struct SIntField: View {
    let label: String
    var placeholder: String = ""
    @Binding var value: Int?
    @State private var text = ""
    var body: some View {
        SField(label: label) {
            TextField(placeholder, text: $text).sInput()
                .onChange(of: text) { _, t in value = Int(t.filter { $0.isNumber }) }
        }
        .onAppear { text = value.map(String.init) ?? "" }
    }
}

struct SPicker: View {
    let label: String
    @Binding var selection: String
    let options: [(String, String)]   // (value, display)
    var body: some View {
        SField(label: label) {
            Picker("", selection: $selection) {
                ForEach(options, id: \.0) { Text($0.1).tag($0.0) }
            }
            .labelsHidden()
            .pickerStyle(.menu)
            .padding(.horizontal, 6).padding(.vertical, 3)
            .background(Color.white.opacity(0.045))
            .clipShape(RoundedRectangle(cornerRadius: 8))
            .overlay(RoundedRectangle(cornerRadius: 8).stroke(Color.white.opacity(0.1), lineWidth: 1))
            .tint(Color.sInk)
        }
    }
}

struct SToggle: View {
    let label: String
    @Binding var isOn: Bool
    var body: some View {
        Toggle(isOn: $isOn) {
            Text(label).font(.system(size: 13)).foregroundStyle(Color.sInk)
        }
        .toggleStyle(.switch).tint(Color.sAccent)
    }
}

struct SDateField: View {
    let label: String
    @Binding var dateStr: String   // "yyyy-MM-dd" or ""
    @State private var date = Date()
    var body: some View {
        SField(label: label) {
            DatePicker("", selection: $date, displayedComponents: .date)
                .labelsHidden().datePickerStyle(.field)
                .onChange(of: date) { _, d in dateStr = localDateStr(d) }
        }
        .onAppear {
            let f = DateFormatter(); f.dateFormat = "yyyy-MM-dd"
            if let d = f.date(from: String(dateStr.prefix(10))) { date = d }
        }
    }
}

// Editor sheet chrome: title bar, scrollable body, Save / Cancel / optional Delete.
struct EditorSheet<Content: View>: View {
    let title: String
    var canSave: Bool = true
    var onSave: () -> Void
    var onDelete: (() -> Void)? = nil
    @ViewBuilder var content: Content
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        VStack(spacing: 0) {
            HStack {
                Text(title).font(.system(size: 17, weight: .bold, design: .rounded)).foregroundStyle(Color.sInk)
                Spacer()
                Button("Cancel") { dismiss() }
                    .buttonStyle(.plain).foregroundStyle(Color.sMuted).font(.system(size: 13))
            }
            .padding(20)

            ScrollView {
                VStack(alignment: .leading, spacing: 14) { content }
                    .padding(.horizontal, 20).padding(.bottom, 20)
            }

            HStack(spacing: 10) {
                if let onDelete {
                    Button { onDelete(); dismiss() } label: {
                        Text("Delete").font(.system(size: 13, weight: .medium))
                            .foregroundStyle(Color.sBad)
                            .padding(.horizontal, 16).padding(.vertical, 9)
                            .overlay(RoundedRectangle(cornerRadius: 8).stroke(Color.sBad.opacity(0.4), lineWidth: 1))
                    }.buttonStyle(.plain)
                }
                Spacer()
                Button { onSave(); dismiss() } label: {
                    Text("Save").font(.system(size: 14, weight: .semibold)).foregroundStyle(.white)
                        .padding(.horizontal, 22).padding(.vertical, 10)
                        .background(canSave ? Color.sAccent : Color.sAccent.opacity(0.3))
                        .clipShape(RoundedRectangle(cornerRadius: 8))
                }
                .buttonStyle(.plain).disabled(!canSave)
            }
            .padding(20)
            .background(Color.black.opacity(0.2))
        }
        .frame(width: 460, height: 620)
        .background(Color.sBg)
    }
}

// A header "+ Add" button used on every management screen.
struct AddButton: View {
    var title: String = "Add"
    var action: () -> Void
    var body: some View {
        Button(action: action) {
            HStack(spacing: 5) {
                Image(systemName: "plus").font(.system(size: 11, weight: .bold))
                Text(title).font(.system(size: 13, weight: .semibold))
            }
            .foregroundStyle(.white)
            .padding(.horizontal, 14).padding(.vertical, 8)
            .background(Color.sAccent)
            .clipShape(RoundedRectangle(cornerRadius: 8))
        }
        .buttonStyle(.plain)
    }
}
