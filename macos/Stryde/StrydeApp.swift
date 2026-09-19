import SwiftUI
import AppKit

@main
struct StrydeApp: App {
    @StateObject private var store = AppStore()

    var body: some Scene {
        WindowGroup {
            RootView()
                .environmentObject(store)
                .frame(minWidth: 940, minHeight: 640)
                .preferredColorScheme(.dark)
                .background(WindowConfigurator())
        }
        .windowStyle(.hiddenTitleBar)
        .defaultSize(width: 1100, height: 760)
    }
}

struct RootView: View {
    @EnvironmentObject var store: AppStore

    var body: some View {
        ZStack {
            Color.sBg.ignoresSafeArea()
            switch store.phase {
            case .loading:
                ProgressView().tint(.sAccent)
            case .signedOut:
                AuthView()
            case .signedIn:
                MainView()
            }
        }
        .task { await store.bootstrap() }
        .toolbar {
            ToolbarItem(placement: .navigation) {
                if store.phase == .signedIn {
                    Button { Task { await store.loadData() } } label: {
                        Image(systemName: "arrow.clockwise")
                    }
                    .help("Refresh")
                }
            }
        }
    }
}

// Keeps the seamless (hidden title bar) look while restoring native window
// behavior: a real transparent title bar (so double-click-to-zoom and dragging
// from the top strip work) and the app's dark color underneath.
struct WindowConfigurator: NSViewRepresentable {
    func makeNSView(context: Context) -> NSView {
        let v = NSView()
        DispatchQueue.main.async {
            guard let w = v.window else { return }
            w.titlebarAppearsTransparent = true
            w.titleVisibility = .hidden
            w.styleMask.insert(.fullSizeContentView)
            w.isMovableByWindowBackground = false
            w.backgroundColor = NSColor(red: 0x13/255, green: 0x11/255, blue: 0x1F/255, alpha: 1)
        }
        return v
    }
    func updateNSView(_ nsView: NSView, context: Context) {}
}
