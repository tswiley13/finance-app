import SwiftUI

// Stryde's palette, matching the web app.
extension Color {
    static let sBg     = Color(red: 0x13/255, green: 0x11/255, blue: 0x1F/255)
    static let sPanel  = Color(red: 0x1A/255, green: 0x18/255, blue: 0x26/255)
    static let sAccent = Color(red: 0x6C/255, green: 0x63/255, blue: 0xFF/255)
    static let sGood   = Color(red: 0x00/255, green: 0xD4/255, blue: 0xAA/255)
    static let sGreen  = Color(red: 0x4A/255, green: 0xDE/255, blue: 0x80/255)
    static let sBad    = Color(red: 0xF8/255, green: 0x71/255, blue: 0x71/255)
    static let sWarn   = Color(red: 0xF5/255, green: 0x9E/255, blue: 0x0B/255)
    static let sMuted  = Color(red: 0x8B/255, green: 0x8F/255, blue: 0xA8/255)
    static let sInk    = Color(red: 0xF0/255, green: 0xF6/255, blue: 0xFC/255)
    static let sHair   = Color.white.opacity(0.06)
}

// Absolute value, 2 decimals, thousands commas, no sign or symbol: "2,977.00".
func num2(_ v: Double) -> String {
    let f = NumberFormatter(); f.numberStyle = .decimal
    f.minimumFractionDigits = 2; f.maximumFractionDigits = 2
    return f.string(from: NSNumber(value: abs(v))) ?? "0.00"
}

func money(_ v: Double) -> String {
    let f = NumberFormatter()
    f.numberStyle = .currency
    f.currencyCode = "USD"
    f.maximumFractionDigits = 2
    f.minimumFractionDigits = 2
    return f.string(from: NSNumber(value: v)) ?? "$0.00"
}
