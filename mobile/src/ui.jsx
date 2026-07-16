import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { c, mono } from "./theme";

export function Panel({ style, children }) {
  return <View style={[s.panel, style]}>{children}</View>;
}

export function Label({ children, style }) {
  return <Text style={[s.label, style]}>{children}</Text>;
}

export function Money({ value, color, size = 15, weight = "500", style }) {
  const text = `${value < 0 ? "-" : ""}$${Math.abs(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
  return (
    <Text style={[mono, { color: color || c.text, fontSize: size, fontWeight: weight }, style]}>
      {text}
    </Text>
  );
}

/** One of the four Monthly Projection tiles. */
export function StatTile({ label, value, negative, flex = 1 }) {
  return (
    <View style={[s.tile, { flex }]}>
      <View style={s.tileBar} />
      <Label style={{ marginBottom: 8 }}>{label}</Label>
      <Money value={value} color={negative ? c.danger : c.success} size={20} />
    </View>
  );
}

export function Pill({ text, color = c.accent, bg = c.accentSoft }) {
  return (
    <View style={[s.pill, { backgroundColor: bg, borderColor: color }]}>
      <Text style={{ color, fontSize: 9, fontWeight: "700", letterSpacing: 0.6 }}>{text}</Text>
    </View>
  );
}

export function Loading({ text = "Loading…" }) {
  return (
    <View style={s.center}>
      <ActivityIndicator color={c.accent} />
      <Text style={{ color: c.textMuted, marginTop: 12, fontSize: 13 }}>{text}</Text>
    </View>
  );
}

export function Empty({ text }) {
  return (
    <View style={{ padding: 24, alignItems: "center" }}>
      <Text style={{ color: c.textFaint, fontSize: 13 }}>{text}</Text>
    </View>
  );
}

export function Message({ title, body }) {
  return (
    <View style={[s.center, { padding: 32 }]}>
      <Text style={{ color: c.text, fontSize: 19, fontWeight: "700", marginBottom: 8, textAlign: "center" }}>
        {title}
      </Text>
      <Text style={{ color: c.textMuted, fontSize: 14, textAlign: "center", lineHeight: 20 }}>
        {body}
      </Text>
    </View>
  );
}

/**
 * Every screen must clear this before touching `d.household` or rendering data.
 *
 * Without it a signed-in user with no household (or a failed load) reaches a
 * screen where `d.household` is null, and the first save crashes on
 * `d.household.id`. Returns an element to render, or null to carry on.
 */
export function dataGate(d) {
  if (d.loading) return <Loading />;
  if (d.error) {
    return <Message title="Something went wrong" body={d.error} />;
  }
  if (d.needsOnboarding || !d.household) {
    return (
      <Message
        title="Finish setting up"
        body="Set up your household on the web at stryde.money, then come back here."
      />
    );
  }
  return null;
}

export function Divider({ style }) {
  return <View style={[{ height: 1, backgroundColor: c.borderSoft }, style]} />;
}

const s = StyleSheet.create({
  panel: {
    backgroundColor: c.panel,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 12,
    padding: 16,
  },
  label: {
    fontSize: 10,
    color: c.textMuted,
    letterSpacing: 1,
    textTransform: "uppercase",
    fontWeight: "600",
  },
  tile: {
    backgroundColor: c.panel,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 12,
    padding: 14,
    overflow: "hidden",
  },
  tileBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "rgba(0,212,170,0.6)",
  },
  pill: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: c.bg },
});
