import SwiftUI

struct AuthView: View {
    @EnvironmentObject var store: AppStore
    @State private var email = ""
    @State private var password = ""
    @FocusState private var focus: Field?

    enum Field { case email, password }

    private var canSubmit: Bool { !email.isEmpty && !password.isEmpty && !store.signingIn }

    var body: some View {
        GeometryReader { geo in
            let wide = geo.size.width > 840
            HStack(spacing: 0) {
                if wide {
                    brandPanel
                        .frame(width: geo.size.width * 0.46)
                }
                formPanel
                    .frame(maxWidth: .infinity)
            }
            .frame(width: geo.size.width, height: geo.size.height)
        }
        .background(Color.sBg)
    }

    // MARK: Left brand panel

    private var brandPanel: some View {
        ZStack {
            LinearGradient(
                colors: [
                    Color(red: 0x2A/255, green: 0x1E/255, blue: 0x5C/255),
                    Color(red: 0x6C/255, green: 0x63/255, blue: 0xFF/255).opacity(0.55),
                    Color(red: 0x13/255, green: 0x11/255, blue: 0x1F/255),
                ],
                startPoint: .topLeading, endPoint: .bottomTrailing
            )
            // Soft glows
            Circle().fill(Color.sGood.opacity(0.22)).frame(width: 320).blur(radius: 120)
                .offset(x: -120, y: -160)
            Circle().fill(Color.sAccent.opacity(0.35)).frame(width: 360).blur(radius: 140)
                .offset(x: 140, y: 200)

            VStack(alignment: .leading, spacing: 0) {
                logoMark
                    .padding(.bottom, 22)

                Text("Stryde")
                    .font(.system(size: 46, weight: .bold, design: .rounded))
                    .foregroundStyle(.white)
                Text("Stop hoping. Start knowing.")
                    .font(.system(size: 15, weight: .medium))
                    .foregroundStyle(.white.opacity(0.7))
                    .padding(.top, 4)

                VStack(alignment: .leading, spacing: 16) {
                    feature("dollarsign.circle.fill", "See every dollar before it moves")
                    feature("calendar", "Plan it out pay period by pay period")
                    feature("checkmark.shield.fill", "Always know what's safe to spend")
                }
                .padding(.top, 40)

                Spacer()

                Text("© 2026 Black Sheep Dev Group LLC")
                    .font(.system(size: 11))
                    .foregroundStyle(.white.opacity(0.4))
            }
            .padding(48)
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        }
    }

    private var logoMark: some View {
        RoundedRectangle(cornerRadius: 16, style: .continuous)
            .fill(
                LinearGradient(colors: [.white.opacity(0.95), .white.opacity(0.75)],
                               startPoint: .top, endPoint: .bottom)
            )
            .frame(width: 62, height: 62)
            .overlay(
                Text("S")
                    .font(.system(size: 38, weight: .heavy, design: .rounded))
                    .foregroundStyle(
                        LinearGradient(colors: [Color.sAccent, Color(red: 0x2A/255, green: 0x1E/255, blue: 0x5C/255)],
                                       startPoint: .top, endPoint: .bottom)
                    )
            )
            .shadow(color: .black.opacity(0.3), radius: 16, y: 8)
    }

    private func feature(_ icon: String, _ text: String) -> some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .font(.system(size: 15, weight: .semibold))
                .foregroundStyle(.white)
                .frame(width: 30, height: 30)
                .background(.white.opacity(0.14))
                .clipShape(RoundedRectangle(cornerRadius: 9, style: .continuous))
            Text(text)
                .font(.system(size: 14, weight: .medium))
                .foregroundStyle(.white.opacity(0.9))
        }
    }

    // MARK: Right form panel

    private var formPanel: some View {
        VStack(alignment: .leading, spacing: 0) {
            Spacer()

            VStack(alignment: .leading, spacing: 6) {
                Text("Welcome back")
                    .font(.system(size: 26, weight: .bold, design: .rounded))
                    .foregroundStyle(Color.sInk)
                Text("Sign in to your household.")
                    .font(.system(size: 14))
                    .foregroundStyle(Color.sMuted)
            }
            .padding(.bottom, 26)

            field(title: "Email", field: .email) {
                TextField("you@example.com", text: $email)
                    .textContentType(.username)
            }
            .padding(.bottom, 14)

            field(title: "Password", field: .password) {
                SecureField("••••••••", text: $password)
                    .textContentType(.password)
                    .onSubmit { submit() }
            }

            if let err = store.errorMessage {
                HStack(spacing: 6) {
                    Image(systemName: "exclamationmark.triangle.fill").font(.system(size: 11))
                    Text(err).font(.system(size: 12))
                }
                .foregroundStyle(Color.sBad)
                .padding(.top, 12)
            }

            Button(action: submit) {
                HStack(spacing: 8) {
                    if store.signingIn {
                        ProgressView().controlSize(.small).tint(.white)
                    }
                    Text(store.signingIn ? "Signing in…" : "Sign in")
                        .font(.system(size: 15, weight: .semibold))
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 12)
                .foregroundStyle(.white)
                .background(
                    LinearGradient(
                        colors: canSubmit
                            ? [Color.sAccent, Color(red: 0x8B/255, green: 0x5C/255, blue: 0xFF/255)]
                            : [Color.sAccent.opacity(0.3), Color.sAccent.opacity(0.3)],
                        startPoint: .leading, endPoint: .trailing
                    )
                )
                .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
                .shadow(color: canSubmit ? Color.sAccent.opacity(0.4) : .clear, radius: 14, y: 6)
            }
            .buttonStyle(.plain)
            .disabled(!canSubmit)
            .padding(.top, 24)

            Spacer()
        }
        .frame(maxWidth: 380)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .padding(.horizontal, 40)
    }

    @ViewBuilder
    private func field<Content: View>(title: String, field: Field, @ViewBuilder _ content: () -> Content) -> some View {
        VStack(alignment: .leading, spacing: 7) {
            Text(title.uppercased())
                .font(.system(size: 10, weight: .semibold)).tracking(1.2)
                .foregroundStyle(Color.sMuted)
            content()
                .textFieldStyle(.plain)
                .focused($focus, equals: field)
                .foregroundStyle(Color.sInk)
                .font(.system(size: 14))
                .padding(.horizontal, 14)
                .padding(.vertical, 11)
                .background(Color.white.opacity(0.045))
                .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
                .overlay(
                    RoundedRectangle(cornerRadius: 10, style: .continuous)
                        .stroke(focus == field ? Color.sAccent : Color.white.opacity(0.1),
                                lineWidth: focus == field ? 1.5 : 1)
                )
        }
    }

    private func submit() {
        guard canSubmit else { return }
        Task { await store.signIn(email: email, password: password) }
    }
}
