import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { c } from "../../src/theme";

const icon = (name) => ({ color, size }) => <Ionicons name={name} size={size - 3} color={color} />;

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: c.accent,
        tabBarInactiveTintColor: c.textDim,
        tabBarStyle: { backgroundColor: c.bg, borderTopColor: c.border, borderTopWidth: 1 },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
        sceneContainerStyle: { backgroundColor: c.bg },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Dashboard", tabBarIcon: icon("grid-outline") }} />
      <Tabs.Screen name="monthly" options={{ title: "Monthly", tabBarIcon: icon("bar-chart-outline") }} />
      <Tabs.Screen name="bills" options={{ title: "Bills", tabBarIcon: icon("receipt-outline") }} />
      <Tabs.Screen name="income" options={{ title: "Income", tabBarIcon: icon("wallet-outline") }} />
      <Tabs.Screen name="more" options={{ title: "More", tabBarIcon: icon("ellipsis-horizontal") }} />
    </Tabs>
  );
}
