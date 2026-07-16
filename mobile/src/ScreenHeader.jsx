import { View, Text, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { c } from "./theme";

/** Back header for stack screens pushed from the More tab. */
export function ScreenHeader({ title, action }) {
  const router = useRouter();
  return (
    <View style={s.header}>
      <Pressable onPress={() => router.back()} hitSlop={10} style={s.back}>
        <Ionicons name="chevron-back" size={22} color={c.accent} />
      </Pressable>
      <Text style={s.title}>{title}</Text>
      <View style={s.action}>{action}</View>
    </View>
  );
}

const s = StyleSheet.create({
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 12, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: c.border,
  },
  back: { width: 60 },
  title: { color: c.text, fontSize: 17, fontWeight: "700" },
  action: { width: 60, alignItems: "flex-end" },
});
