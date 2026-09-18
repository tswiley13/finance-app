import SwiftUI

@main
struct StrydeApp: App {
    @StateObject private var store = AppStore()

    var body: some Scene {
        WindowGroup {
            RootView()
                .environmentObject(store)
                .frame(minWidth: 940, minHeight: 640)
                .preferredColorScheme(.dark)
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
