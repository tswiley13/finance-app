import SwiftUI
import WebKit
import Supabase

// MARK: - Edge-function calls (reuse the web app's Plaid backend)

private struct CreateLinkBody: Encodable { let user_id: String; let update_mode: Bool }
private struct ExchangeBody: Encodable { let public_token: String; let institution_name: String?; let accounts: AnyJSON? }
private struct SyncBody: Encodable { let household_id: String }

private struct LinkTokenResponse: Decodable { let link_token: String?; let error_message: String? }
private struct SyncResponse: Decodable { let synced: Int?; let loginRequired: Bool? }

extension AppStore {
    func plaidCreateLinkToken() async -> String? {
        do {
            let r: LinkTokenResponse = try await client.functions.invoke(
                "plaid-create-link-token",
                options: FunctionInvokeOptions(body: CreateLinkBody(user_id: userId, update_mode: false))
            )
            if let t = r.link_token { return t }
            errorMessage = r.error_message ?? "Could not start Plaid."
            return nil
        } catch {
            errorMessage = error.localizedDescription
            return nil
        }
    }

    func plaidExchange(publicToken: String, institutionName: String?, accounts: AnyJSON?) async {
        do {
            let _: AnyJSON = try await client.functions.invoke(
                "plaid-exchange-token",
                options: FunctionInvokeOptions(body: ExchangeBody(
                    public_token: publicToken, institution_name: institutionName, accounts: accounts))
            )
            await plaidSync()
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    // Remove one bank's Plaid link (accounts/balances stay; they stop syncing).
    func plaidDisconnect(itemId: String) async {
        do {
            try await client.from("plaid_items").delete().eq("id", value: itemId).execute()
            plaidItems.removeAll { $0.id == itemId }
            plaidConnected = !plaidItems.isEmpty
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func plaidSync() async {
        guard let hid = household?.id else { return }
        plaidSyncing = true
        defer { plaidSyncing = false }
        do {
            let r: SyncResponse = try await client.functions.invoke(
                "plaid-sync-balances",
                options: FunctionInvokeOptions(body: SyncBody(household_id: hid))
            )
            if r.loginRequired == true { plaidConnected = false }
            else if (r.synced ?? 0) > 0 { plaidConnected = true }
            await loadData()
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}

// MARK: - Embedded Plaid Link (WKWebView)

struct PlaidLinkView: NSViewRepresentable {
    let linkToken: String
    let onSuccess: (String, String?, AnyJSON?) -> Void
    let onExit: () -> Void

    func makeCoordinator() -> Coordinator { Coordinator(onSuccess: onSuccess, onExit: onExit) }

    func makeNSView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        config.userContentController.add(context.coordinator, name: "plaid")
        let wv = WKWebView(frame: .zero, configuration: config)
        wv.uiDelegate = context.coordinator
        wv.loadHTMLString(Self.html(token: linkToken), baseURL: URL(string: "https://stryde.money"))
        return wv
    }

    func updateNSView(_ nsView: WKWebView, context: Context) {}

    static func html(token: String) -> String {
        """
        <!DOCTYPE html><html><head><meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <script src="https://cdn.plaid.com/link/v2/stable/link-initialize.js"></script>
        <style>html,body{margin:0;height:100%;background:#13111F;}</style></head>
        <body><script>
        function post(m){ try{ window.webkit.messageHandlers.plaid.postMessage(m); }catch(e){} }
        var handler = Plaid.create({
          token: '\(token)',
          onSuccess: function(pt, md){ post({event:'success', public_token:pt, metadata:md}); },
          onExit: function(err, md){ post({event:'exit'}); },
          onLoad: function(){ handler.open(); },
          onEvent: function(){}
        });
        </script></body></html>
        """
    }

    class Coordinator: NSObject, WKScriptMessageHandler, WKUIDelegate {
        let onSuccess: (String, String?, AnyJSON?) -> Void
        let onExit: () -> Void
        init(onSuccess: @escaping (String, String?, AnyJSON?) -> Void, onExit: @escaping () -> Void) {
            self.onSuccess = onSuccess; self.onExit = onExit
        }

        func userContentController(_ ucc: WKUserContentController, didReceive message: WKScriptMessage) {
            guard let dict = message.body as? [String: Any], let event = dict["event"] as? String else { return }
            if event == "success" {
                let pt = dict["public_token"] as? String ?? ""
                let meta = dict["metadata"] as? [String: Any]
                let inst = (meta?["institution"] as? [String: Any])?["name"] as? String
                var acctJSON: AnyJSON? = nil
                if let accts = meta?["accounts"],
                   let d = try? JSONSerialization.data(withJSONObject: accts) {
                    acctJSON = try? JSONDecoder().decode(AnyJSON.self, from: d)
                }
                onSuccess(pt, inst, acctJSON)
            } else if event == "exit" {
                onExit()
            }
        }

        // Route OAuth pop-ups into the same web view.
        func webView(_ webView: WKWebView, createWebViewWith configuration: WKWebViewConfiguration,
                     for navigationAction: WKNavigationAction, windowFeatures: WKWindowFeatures) -> WKWebView? {
            if let url = navigationAction.request.url { webView.load(URLRequest(url: url)) }
            return nil
        }
    }
}

// Shared Plaid control: connect multiple banks, sync, disconnect per bank.
struct PlaidControls: View {
    @EnvironmentObject var store: AppStore
    var showSync: Bool = true
    @State private var linkEditing: Editing<String>?
    @State private var connecting = false
    @State private var pendingDisconnect: Editing<String>?   // holds an item id

    private var count: Int { store.plaidItems.count }

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(spacing: 10) {
                Image(systemName: "building.columns.fill").font(.system(size: 14)).foregroundStyle(Color.sAccent)
                VStack(alignment: .leading, spacing: 1) {
                    Text(count == 0 ? "Connect your bank"
                         : "\(count) bank\(count == 1 ? "" : "s") connected")
                        .font(.system(size: 13, weight: .semibold)).foregroundStyle(Color.sInk)
                    Text(count == 0 ? "Auto-pull balances with Plaid."
                         : "Balances sync from your banks via Plaid.")
                        .font(.system(size: 11)).foregroundStyle(Color.sMuted)
                }
                Spacer()
                if count > 0 && showSync {
                    pill(store.plaidSyncing ? "Syncing…" : "Sync", .filled, disabled: store.plaidSyncing) {
                        Task { await store.plaidSync() }
                    }
                }
                pill(connecting ? "Connecting…" : (count == 0 ? "Connect bank" : "Add bank"),
                     count == 0 ? .filled : .outline, disabled: connecting) {
                    connecting = true
                    Task {
                        if let t = await store.plaidCreateLinkToken() { linkEditing = Editing(t) }
                        connecting = false
                    }
                }
            }

            if count > 0 {
                VStack(spacing: 0) {
                    ForEach(store.plaidItems) { item in
                        HStack {
                            Image(systemName: "checkmark.circle.fill").font(.system(size: 11)).foregroundStyle(Color.sGood)
                            Text(item.institutionName ?? "Connected bank")
                                .font(.system(size: 12, weight: .medium)).foregroundStyle(Color.sInk)
                            Spacer()
                            Button { pendingDisconnect = Editing(item.id) } label: {
                                Text("Disconnect").font(.system(size: 11, weight: .semibold)).foregroundStyle(Color.sBad)
                            }.buttonStyle(.plain)
                        }
                        .padding(.vertical, 8)
                        .overlay(Rectangle().fill(Color.white.opacity(0.04)).frame(height: 1), alignment: .bottom)
                    }
                }
            }
        }
        .padding(16)
        .background(Color.sPanel)
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .overlay(RoundedRectangle(cornerRadius: 12).stroke(Color.sHair, lineWidth: 1))
        .alert("Disconnect this bank?", isPresented: Binding(
            get: { pendingDisconnect != nil },
            set: { if !$0 { pendingDisconnect = nil } }
        )) {
            Button("Disconnect", role: .destructive) {
                if let id = pendingDisconnect?.value { Task { await store.plaidDisconnect(itemId: id) } }
                pendingDisconnect = nil
            }
            Button("Cancel", role: .cancel) { pendingDisconnect = nil }
        } message: {
            Text("Its accounts and balances stay put — they just won't auto-sync until you reconnect.")
        }
        .sheet(item: $linkEditing) { e in
            if let t = e.value { PlaidLinkSheet(linkToken: t).environmentObject(store) }
        }
    }

    private enum Style { case filled, outline, danger }
    private func pill(_ title: String, _ style: Style, disabled: Bool, action: @escaping () -> Void) -> some View {
        let fg: Color = style == .filled ? .white : (style == .danger ? .sBad : .sAccent)
        return Button(action: action) {
            Text(title).font(.system(size: 12, weight: .semibold)).foregroundStyle(fg)
                .padding(.horizontal, 14).padding(.vertical, 8)
                .background(style == .filled ? Color.sAccent : Color.clear)
                .overlay(RoundedRectangle(cornerRadius: 8).stroke(
                    style == .filled ? Color.clear : (style == .danger ? Color.sBad.opacity(0.5) : Color.sAccent.opacity(0.5)),
                    lineWidth: 1))
                .clipShape(RoundedRectangle(cornerRadius: 8))
        }
        .buttonStyle(.plain).disabled(disabled)
    }
}

struct PlaidLinkSheet: View {
    @EnvironmentObject var store: AppStore
    let linkToken: String
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        VStack(spacing: 0) {
            HStack {
                Text("Connect your bank").font(.system(size: 15, weight: .semibold)).foregroundStyle(Color.sInk)
                Spacer()
                Button("Cancel") { dismiss() }.buttonStyle(.plain).foregroundStyle(Color.sMuted).font(.system(size: 13))
            }
            .padding(14)
            PlaidLinkView(
                linkToken: linkToken,
                onSuccess: { pt, inst, accts in
                    Task { await store.plaidExchange(publicToken: pt, institutionName: inst, accounts: accts) }
                    dismiss()
                },
                onExit: { dismiss() }
            )
        }
        .frame(width: 460, height: 640)
        .background(Color.sBg)
    }
}
