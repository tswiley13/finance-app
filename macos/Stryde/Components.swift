import SwiftUI

struct StatTile: View {
    let label: String
    let value: Double
    let accent: Color
    var isCount: Bool = false
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Rectangle().fill(accent).frame(height: 2).frame(maxWidth: 40, alignment: .leading)
            Text(label.uppercased())
                .font(.system(size: 10, weight: .semibold)).tracking(1)
                .foregroundStyle(Color.sMuted)
            Text(isCount ? String(Int(value)) : money(value))
                .font(.system(size: 24, weight: .medium, design: .monospaced))
                .foregroundStyle(accent)
                .lineLimit(1).minimumScaleFactor(0.6)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(18)
        .background(Color.sPanel)
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .overlay(RoundedRectangle(cornerRadius: 12).stroke(Color.sHair, lineWidth: 1))
    }
}

struct Panel<Content: View>: View {
    let title: String
    let count: Int
    @ViewBuilder var content: Content
    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack {
                Text(title).font(.system(size: 14, weight: .semibold)).foregroundStyle(Color.sInk)
                Spacer()
                Text("\(count)").font(.system(size: 12)).foregroundStyle(Color.sMuted)
            }
            .padding(.bottom, 10)
            content
        }
        .padding(20)
        .background(Color.sPanel)
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .overlay(RoundedRectangle(cornerRadius: 12).stroke(Color.sHair, lineWidth: 1))
    }
}

struct Row: View {
    let name: String
    let sub: String
    var amount: Double? = nil
    var amountColor: Color = .sInk
    var trailing: String? = nil
    var badge: String? = nil
    var body: some View {
        HStack(alignment: .center) {
            VStack(alignment: .leading, spacing: 2) {
                Text(name).font(.system(size: 13, weight: .medium)).foregroundStyle(Color.sInk)
                if !sub.isEmpty {
                    Text(sub).font(.system(size: 11)).foregroundStyle(Color.sMuted)
                }
            }
            Spacer()
            if let badge {
                Text(badge)
                    .font(.system(size: 10, weight: .semibold))
                    .foregroundStyle(Color.sGood)
                    .padding(.horizontal, 8).padding(.vertical, 3)
                    .background(Color.sGood.opacity(0.12))
                    .clipShape(Capsule())
            }
            if let amount {
                VStack(alignment: .trailing, spacing: 2) {
                    Text(money(amount))
                        .font(.system(size: 13, design: .monospaced))
                        .foregroundStyle(amountColor)
                    if let trailing {
                        Text(trailing).font(.system(size: 10, design: .monospaced)).foregroundStyle(Color.sMuted)
                    }
                }
            }
        }
        .padding(.vertical, 9)
        .overlay(Rectangle().fill(Color.white.opacity(0.04)).frame(height: 1), alignment: .bottom)
    }
}

struct EmptyRow: View {
    let text: String
    var body: some View {
        Text(text)
            .font(.system(size: 12))
            .foregroundStyle(Color.sMuted)
            .frame(maxWidth: .infinity, alignment: .center)
            .padding(.vertical, 16)
    }
}
