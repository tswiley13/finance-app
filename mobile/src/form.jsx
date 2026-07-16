// Form primitives shared by the add/edit screens.
import { useState } from "react";
import {
  View, Text, TextInput, Pressable, Modal, ScrollView, StyleSheet, Platform,
} from "react-native";
import { c } from "./theme";

export function Field({ label, required, children, hint }) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={s.label}>
        {label}
        {required && <Text style={{ color: c.danger }}> *</Text>}
      </Text>
      {children}
      {!!hint && <Text style={s.hint}>{hint}</Text>}
    </View>
  );
}

export function Input({ value, onChangeText, placeholder, keyboardType, autoCapitalize = "sentences", multiline }) {
  return (
    <TextInput
      value={value == null ? "" : String(value)}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={c.textDim}
      keyboardType={keyboardType}
      autoCapitalize={autoCapitalize}
      multiline={multiline}
      style={[s.input, multiline && { height: 80, textAlignVertical: "top" }]}
    />
  );
}

/** Money input — strips anything that isn't a number or a single dot. */
export function MoneyInput({ value, onChangeText, placeholder = "0.00" }) {
  return (
    <View style={s.moneyWrap}>
      <Text style={s.moneyPrefix}>$</Text>
      <TextInput
        value={value == null ? "" : String(value)}
        onChangeText={(t) => {
          const cleaned = t.replace(/[^0-9.]/g, "").replace(/(\..*)\./g, "$1");
          onChangeText(cleaned);
        }}
        placeholder={placeholder}
        placeholderTextColor={c.textDim}
        keyboardType="decimal-pad"
        style={[s.input, { flex: 1, paddingLeft: 4, borderWidth: 0, backgroundColor: "transparent" }]}
      />
    </View>
  );
}

/** Dropdown. options: [{ label, value }] */
export function Select({ value, onChange, options, placeholder = "Select…" }) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <>
      <Pressable onPress={() => setOpen(true)} style={[s.input, s.selectRow]}>
        <Text style={{ color: selected ? c.text : c.textDim, fontSize: 15, flex: 1 }}>
          {selected ? selected.label : placeholder}
        </Text>
        <Text style={{ color: c.textFaint, fontSize: 12 }}>▼</Text>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={s.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={s.sheet} onPress={(e) => e.stopPropagation()}>
            <ScrollView bounces={false}>
              {options.map((o) => (
                <Pressable
                  key={String(o.value)}
                  onPress={() => { onChange(o.value); setOpen(false); }}
                  style={[s.option, o.value === value && { backgroundColor: "rgba(108,99,255,0.12)" }]}
                >
                  <Text style={{ color: o.value === value ? c.accent : c.text, fontSize: 15 }}>
                    {o.label}
                  </Text>
                  {o.value === value && <Text style={{ color: c.accent }}>✓</Text>}
                </Pressable>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

export function Toggle({ label, value, onValueChange, hint }) {
  return (
    <Pressable onPress={() => onValueChange(!value)} style={s.toggleRow}>
      <View style={{ flex: 1 }}>
        <Text style={{ color: c.text, fontSize: 14 }}>{label}</Text>
        {!!hint && <Text style={s.hint}>{hint}</Text>}
      </View>
      <View style={[s.track, value && { backgroundColor: c.accent }]}>
        <View style={[s.knob, value && { alignSelf: "flex-end" }]} />
      </View>
    </Pressable>
  );
}

export function Btn({ title, onPress, kind = "primary", disabled }) {
  const styles = {
    primary: { bg: c.accent, fg: "#13111F", border: c.accent },
    ghost: { bg: "transparent", fg: c.textMuted, border: c.border },
    danger: { bg: "rgba(248,113,113,0.08)", fg: c.danger, border: "rgba(248,113,113,0.4)" },
  }[kind];
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[
        s.btn,
        { backgroundColor: styles.bg, borderColor: styles.border },
        disabled && { opacity: 0.5 },
      ]}
    >
      <Text style={{ color: styles.fg, fontSize: 15, fontWeight: "700" }}>{title}</Text>
    </Pressable>
  );
}

export function FormError({ children }) {
  if (!children) return null;
  return (
    <View style={s.errorBox}>
      <Text style={{ color: c.danger, fontSize: 13 }}>{children}</Text>
    </View>
  );
}

export const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
].map((m, i) => ({ label: m, value: i + 1 }));

export const DAYS = Array.from({ length: 31 }, (_, i) => ({
  label: String(i + 1),
  value: i + 1,
}));

const s = StyleSheet.create({
  label: {
    fontSize: 11, fontWeight: "600", color: c.textFaint,
    letterSpacing: 1, textTransform: "uppercase", marginBottom: 7,
  },
  hint: { fontSize: 11, color: c.textDim, marginTop: 5, lineHeight: 15 },
  input: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 8, color: c.text, fontSize: 15,
    paddingHorizontal: 12, paddingVertical: Platform.OS === "ios" ? 12 : 9,
  },
  moneyWrap: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 8, paddingLeft: 12,
  },
  moneyPrefix: { color: c.textMuted, fontSize: 15 },
  selectRow: { flexDirection: "row", alignItems: "center" },
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", padding: 32 },
  sheet: {
    backgroundColor: c.panel, borderRadius: 14, borderWidth: 1,
    borderColor: c.borderHard, maxHeight: "70%", overflow: "hidden",
  },
  option: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 18, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: c.borderSoft,
  },
  toggleRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingVertical: 12, marginBottom: 4,
  },
  track: {
    width: 44, height: 26, borderRadius: 13, padding: 3,
    backgroundColor: "rgba(255,255,255,0.12)", justifyContent: "center",
  },
  knob: { width: 20, height: 20, borderRadius: 10, backgroundColor: "#fff" },
  btn: {
    borderWidth: 1, borderRadius: 8, paddingVertical: 14,
    alignItems: "center", justifyContent: "center",
  },
  errorBox: {
    backgroundColor: "rgba(248,113,113,0.08)", borderWidth: 1,
    borderColor: "rgba(248,113,113,0.2)", borderRadius: 8,
    padding: 10, marginBottom: 14,
  },
});
