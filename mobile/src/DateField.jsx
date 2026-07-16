// A small YYYY-MM-DD picker built from Selects.
//
// Deliberately avoids @react-native-community/datetimepicker: that's a native
// module, which would push the project out of Expo Go and into a dev build.
// Three dropdowns are plenty for picking a pay date.
import { View, Text, StyleSheet } from "react-native";
import { Select, MONTHS } from "./form";
import { c } from "./theme";

const pad = (n) => String(n).padStart(2, "0");

export function DateField({ value, onChange }) {
  // value: "YYYY-MM-DD" | ""
  const [y, m, d] = (value || "").split("-").map((v) => (v ? parseInt(v) : null));

  const thisYear = new Date().getFullYear();
  const years = Array.from({ length: 6 }, (_, i) => thisYear - 1 + i).map((v) => ({
    label: String(v), value: v,
  }));

  // Only offer days that exist in the chosen month.
  const daysInMonth = y && m ? new Date(y, m, 0).getDate() : 31;
  const days = Array.from({ length: daysInMonth }, (_, i) => ({
    label: String(i + 1), value: i + 1,
  }));

  const emit = (ny, nm, nd) => {
    if (!ny || !nm || !nd) return;
    // Clamp the day if the new month is shorter (e.g. Jan 31 -> Feb).
    const max = new Date(ny, nm, 0).getDate();
    onChange(`${ny}-${pad(nm)}-${pad(Math.min(nd, max))}`);
  };

  return (
    <View>
      <View style={s.row}>
        <View style={{ flex: 1.4 }}>
          <Select
            value={m}
            onChange={(v) => emit(y || thisYear, v, d || 1)}
            options={MONTHS}
            placeholder="Month"
          />
        </View>
        <View style={{ flex: 1 }}>
          <Select
            value={d}
            onChange={(v) => emit(y || thisYear, m || 1, v)}
            options={days}
            placeholder="Day"
          />
        </View>
        <View style={{ flex: 1 }}>
          <Select
            value={y}
            onChange={(v) => emit(v, m || 1, d || 1)}
            options={years}
            placeholder="Year"
          />
        </View>
      </View>
      {!!value && (
        <Text style={s.preview}>
          {new Date(value + "T12:00:00").toLocaleDateString("en-US", {
            weekday: "long", month: "long", day: "numeric", year: "numeric",
          })}
        </Text>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: "row", gap: 8 },
  preview: { color: c.textDim, fontSize: 11, marginTop: 6 },
});
