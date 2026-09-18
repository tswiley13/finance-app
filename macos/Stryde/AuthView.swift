import SwiftUI

struct AuthView: View {
    @EnvironmentObject var store: AppStore
    @State private var email = ""
    @State private var password = ""

    var body: some View {
        VStack(spacing: 0) {
            Spacer()
            VStack(alignment: .leading, spacing: 6) {
                Text("Stryde")
                    .font(.system(size: 34, weight: .bold, design: .rounded))
                    .foregroundStyle(Color.sInk)
                Text("Stop hoping. Start knowing.")
                    .font(.system(size: 13))
                    .foregroundStyle(Color.sMuted)
            }
            .padding(.bottom, 28)

            VStack(spacing: 12) {
                field(title: "Email") {
                    TextField("", text: $email)
                        .textContentType(.username)
                        .textFieldStyle(.plain)
                }
                field(title: "Password") {
                    SecureField("", text: $password)
                        .textContentType(.password)
                        .textFieldStyle(.plain)
                        .onSubmit { Task { await store.signIn(email: email, password: password) } }
                }

                if let err = store.errorMessage {
                    Text(err)
                        .font(.system(size: 12))
                        .foregroundStyle(Color.sBad)
                        .frame(maxWidth: .infinity, alignment: .leading)
                }

                Button {
                    Task { await store.signIn(email: email, password: password) }
                } label: {
                    HStack {
                        if store.signingIn { ProgressView().controlSize(.small).tint(.black) }
                        Text(store.signingIn ? "Signing in…" : "Sign in")
                            .font(.system(size: 14, weight: .semibold))
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 10)
                    .background(Color.sAccent)
                    .foregroundStyle(Color.black)
                    .clipShape(RoundedRectangle(cornerRadius: 8))
                }
                .buttonStyle(.plain)
                .disabled(store.signingIn || email.isEmpty || password.isEmpty)
                .padding(.top, 4)
            }
            .frame(width: 340)
            .padding(24)
            .background(Color.sPanel)
            .clipShape(RoundedRectangle(cornerRadius: 14))
            .overlay(RoundedRectangle(cornerRadius: 14).stroke(Color.sHair, lineWidth: 1))

            Spacer()
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    @ViewBuilder
    private func field<Content: View>(title: String, @ViewBuilder _ content: () -> Content) -> some View {
        VStack(alignment: .leading, spacing: 5) {
            Text(title.uppercased())
                .font(.system(size: 10, weight: .semibold))
                .tracking(1)
                .foregroundStyle(Color.sMuted)
            content()
                .foregroundStyle(Color.sInk)
                .font(.system(size: 14))
                .padding(.horizontal, 12)
                .padding(.vertical, 9)
                .background(Color.white.opacity(0.04))
                .clipShape(RoundedRectangle(cornerRadius: 8))
                .overlay(RoundedRectangle(cornerRadius: 8).stroke(Color.white.opacity(0.1), lineWidth: 1))
        }
    }
}
