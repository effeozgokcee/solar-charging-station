import { Tabs } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View, Text, Platform } from "react-native";

function TabIcon({ label, color }: { label: string; color: string }) {
  return <Text style={{ fontSize: 20, color }}>{label}</Text>;
}

export default function Layout() {
  return (
    <View style={{ flex: 1, backgroundColor: "#000000" }}>
      <StatusBar style="light" />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: "rgba(10,10,10,0.95)",
            borderTopWidth: 0,
            elevation: 0,
            height: Platform.OS === "web" ? 60 : 80,
            paddingTop: 6,
            paddingBottom: Platform.OS === "web" ? 8 : 26,
          },
          tabBarActiveTintColor: "#FFD60A",
          tabBarInactiveTintColor: "rgba(235,235,245,0.25)",
          tabBarLabelStyle: { fontSize: 10, fontWeight: "600", letterSpacing: 0.2, marginTop: 2 },
        }}
      >
        <Tabs.Screen name="index" options={{ title: "Dashboard", tabBarIcon: ({ color }) => <TabIcon label={"\u2600"} color={color} /> }} />
        <Tabs.Screen name="history" options={{ title: "History", tabBarIcon: ({ color }) => <TabIcon label={"\u2197"} color={color} /> }} />
        <Tabs.Screen name="system" options={{ title: "System", tabBarIcon: ({ color }) => <TabIcon label={"\u26A1"} color={color} /> }} />
        <Tabs.Screen name="device" options={{ title: "Cihaz", tabBarIcon: ({ color }) => <TabIcon label={"\u25AE"} color={color} />, tabBarActiveTintColor: "#30D158" }} />
        <Tabs.Screen name="control" options={{ title: "Settings", tabBarIcon: ({ color }) => <TabIcon label={"\u2699"} color={color} /> }} />
      </Tabs>
    </View>
  );
}
