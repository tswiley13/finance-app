import SwiftUI
import AppKit

struct HouseholdPatch: Encodable {
    var name: String? = nil
    var inviteCode: String? = nil
    var monthlyDiscretionary: Double? = nil
}
struct MemberAddPayload: Encodable { var householdId: String; var name: String; var role: String }

private func copyToClipboard(_ s: String) {
    NSPasteboard.general.clearContents()
    NSPasteboard.general.setString(s, forType: .string)
}

struct SettingsView: View {
    @EnvironmentObject var store: AppStore
    @State private var name = ""
    @State private var newMember = ""
    @State private var discretionary: Double?
    @State private var copied = ""

    private var inviteLink: String {
        "https://stryde.money/join?code=\(store.household?.inviteCode ?? "")"
    }

    var body: some View {
        Page(title: "Settings", subtitle: "Your household") { _ in
            // Household name
            Panel(title: "Household", count: store.members.count) {
                HStack(spacing: 8) {
                    TextField("Household name", text: $name).sInput()
                    saveButton("Save") {
                        Task { await store.save("households", id: store.household?.id, HouseholdPatch(name: name)) }
                    }
                }
                .padding(.top, 4)
            }

            // Invite
            Panel(title: "Invite a member", count: 0) {
                if let code = store.household?.inviteCode, !code.isEmpty {
                    VStack(alignment: .leading, spacing: 10) {
                        HStack {
                            VStack(alignment: .leading, spacing: 2) {
                                Text("INVITE CODE").font(.system(size: 9, weight: .semibold)).tracking(0.8).foregroundStyle(Color.sMuted)
                                Text(code).font(.system(size: 15, weight: .semibold, design: .monospaced)).foregroundStyle(Color.sInk)
                            }
                            Spacer()
                            saveButton(copied == "code" ? "Copied!" : "Copy code", outline: true) {
                                copyToClipboard(code); flash("code")
                            }
                        }
                        HStack {
                            Text(inviteLink).font(.system(size: 12)).foregroundStyle(Color.sMuted).lineLimit(1).truncationMode(.middle)
                            Spacer()
                            saveButton(copied == "link" ? "Copied!" : "Copy link", outline: true) {
                                copyToClipboard(inviteLink); flash("link")
                            }
                        }
                    }
                    .padding(.top, 4)
                } else {
                    HStack {
                        Text("No invite code yet.").font(.system(size: 13)).foregroundStyle(Color.sMuted)
                        Spacer()
                        saveButton("Generate code") {
                            let code = String((0..<8).map { _ in "abcdefghijklmnopqrstuvwxyz0123456789".randomElement()! })
                            Task { await store.save("households", id: store.household?.id, HouseholdPatch(inviteCode: code)) }
                        }
                    }
                    .padding(.top, 4)
                }
            }

            // Members
            Panel(title: "Members", count: store.members.count) {
                ForEach(store.members) { m in
                    HStack {
                        Text(m.name).font(.system(size: 13, weight: .medium)).foregroundStyle(Color.sInk)
                        Spacer()
                        if store.members.count > 1 {
                            Button { Task { await store.remove("household_members", id: m.id) } } label: {
                                Image(systemName: "trash").font(.system(size: 12)).foregroundStyle(Color.sBad)
                            }.buttonStyle(.plain)
                        }
                    }
                    .padding(.vertical, 9)
                    .overlay(Rectangle().fill(Color.white.opacity(0.04)).frame(height: 1), alignment: .bottom)
                }
                HStack(spacing: 8) {
                    TextField("Add a member name", text: $newMember).sInput()
                    saveButton("Add") {
                        let n = newMember.trimmingCharacters(in: .whitespaces)
                        guard !n.isEmpty, let hid = store.household?.id else { return }
                        newMember = ""
                        Task { await store.save("household_members", id: nil, MemberAddPayload(householdId: hid, name: n, role: "member")) }
                    }
                }
                .padding(.top, 10)
            }

            // Planning defaults
            Panel(title: "Planning", count: 0) {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Used by the AI export to describe spending beyond your set bills.")
                        .font(.system(size: 11)).foregroundStyle(Color.sMuted)
                    HStack(spacing: 8) {
                        SNumberField(label: "Avg. monthly discretionary spending", value: $discretionary)
                        saveButton("Save") {
                            Task { await store.save("households", id: store.household?.id, HouseholdPatch(monthlyDiscretionary: discretionary ?? 0)) }
                        }
                    }
                }
                .padding(.top, 4)
            }
        }
        .onAppear {
            name = store.household?.name ?? ""
            discretionary = store.household?.monthlyDiscretionary
        }
    }

    private func flash(_ which: String) {
        copied = which
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) { if copied == which { copied = "" } }
    }

    private func saveButton(_ title: String, outline: Bool = false, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Text(title).font(.system(size: 13, weight: .semibold))
                .foregroundStyle(outline ? Color.sAccent : .white)
                .padding(.horizontal, 16).padding(.vertical, 9)
                .background(outline ? Color.clear : Color.sAccent)
                .overlay(RoundedRectangle(cornerRadius: 8).stroke(outline ? Color.sAccent.opacity(0.5) : Color.clear, lineWidth: 1))
                .clipShape(RoundedRectangle(cornerRadius: 8))
        }
        .buttonStyle(.plain)
    }
}
