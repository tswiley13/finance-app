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
    }
}

// Keeps the seamless (hidden title bar) look while restoring native behavior.
// The double-click-to-zoom is handled by a global mouse-down monitor so it
// works no matter what SwiftUI draws over the title-bar region.
struct WindowConfigurator: NSViewRepresentable {
    func makeNSView(context: Context) -> NSView {
        let v = NSView()
        DispatchQueue.main.async {
            guard let w = v.window else { return }
            w.titlebarAppearsTransparent = true
            w.titleVisibility = .hidden
            w.styleMask.insert(.fullSizeContentView)
            w.isMovableByWindowBackground = true   // drag from anywhere blank
            w.backgroundColor = NSColor(red: 0x13/255, green: 0x11/255, blue: 0x1F/255, alpha: 1)
            TitleBarZoom.install()
        }
        return v
    }
    func updateNSView(_ nsView: NSView, context: Context) {}
}

// Double-click in the top strip (past the traffic lights) toggles zoom.
enum TitleBarZoom {
    static var installed = false
    static func install() {
        guard !installed else { return }
        installed = true
        NSEvent.addLocalMonitorForEvents(matching: .leftMouseDown) { event in
            guard event.clickCount == 2, let w = event.window else { return event }
            let loc = event.locationInWindow           // origin: bottom-left
            if loc.x > 80 && loc.y >= w.frame.height - 32 {
                w.zoom(nil)
                return nil
            }
            return event
        }
    }
}
