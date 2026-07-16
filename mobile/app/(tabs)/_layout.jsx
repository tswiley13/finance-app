import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { c } from "../../src/theme";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: c.accent,
        tabBarInactiveTintColor: c.textDim,
        tabBarStyle: {
          backgroundColor: c.bg,
          borderTopColor: c.border,
          borderTopWidth: 1,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
        sceneContainerStyle: { backgroundColor: c.bg },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, size }) => <Ionicons name="grid-outline" size={size - 3} color={color} />,
        }}
      />
      <Tabs.Screen
        name="monthly"
        options={{
          title: "Monthly",
          tabBarIcon: ({ color, size }) => <Ionicons name="bar-chart-outline" size={size - 3} color={color} />,
        }}
      />
      <Tabs.Screen
        name="bills"
        options={{
          title: "Bills",
          tabBarIcon: ({ color, size }) => <Ionicons name="receipt-outline" size={size - 3} color={color} />,
        }}
      />
      <Tabs.Screen
        name="accounts"
        options={{
          title: "Accounts",
          tabBarIcon: ({ color, size }) => <Ionicons name="card-outline" size={size - 3} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, size }) => <Ionicons name="settings-outline" size={size - 3} color={color} />,
        }}
      />
    </Tabs>
  );
}
