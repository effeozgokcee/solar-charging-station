import { useEffect } from "react";
import { Tabs } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View, Text, Platform } from "react-native";

function TabIcon({ label, color }: { label: string; color: string }) {
  return <Text style={{ fontSize: 22, color, lineHeight: 26 }}>{label}</Text>;
}

export default function Layout() {
  const isWeb = Platform.OS === "web";

  // Fix History.pushState crash on web
  useEffect(() => {
    if (isWeb && typeof window !== "undefined") {
      const origPush = window.history.pushState.bind(window.history);
      window.history.pushState = function (...args: any[]) {
        try {
          return origPush(...args);
        } catch {
          // Silently ignore dispatchEvent null error
        }
      };
      const origReplace = window.history.replaceState.bind(window.history);
      window.history.replaceState = function (...args: any[]) {
        try {
          return origReplace(...args);
        } catch {}
      };
    }
  }, [isWeb]);

  return (
    <View style={{ flex: 1, backgroundColor: "#000000" }}>
      <StatusBar style="light" />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: "#0A0A0A",
            borderTopWidth: 0.5,
            borderTopColor: "rgba(255,255,255,0.08)",
            elevation: 0,
            height: isWeb ? 56 : 88,
            paddingTop: 6,
            paddingBottom: isWeb ? 6 : 30,
          },
          tabBarActiveTintColor: "#FFD60A",
          tabBarInactiveTintColor: "rgba(235,235,245,0.3)",
          tabBarLabelStyle: { fontSize: 10, fontWeight: "500", marginTop: 2 },
          tabBarIconStyle: { marginBottom: -2 },
        }}
      >
        <Tabs.Screen name="index" options={{ title: "Dashboard", tabBarIcon: ({ color }) => <TabIcon label={"\u2600\uFE0F"} color={color} /> }} />
        <Tabs.Screen name="history" options={{ title: "History", tabBarIcon: ({ color }) => <TabIcon label={"\uD83D\uDCC8"} color={color} /> }} />
        <Tabs.Screen name="system" options={{ title: "System", tabBarIcon: ({ color }) => <TabIcon label={"\u26A1"} color={color} /> }} />
        <Tabs.Screen name="device" options={{ title: "Cihaz", tabBarIcon: ({ color }) => <TabIcon label={"\uD83D\uDD0B"} color={color} />, tabBarActiveTintColor: "#30D158" }} />
        <Tabs.Screen name="control" options={{ title: "Settings", tabBarIcon: ({ color }) => <TabIcon label={"\u2699\uFE0F"} color={color} /> }} />
      </Tabs>
    </View>
  );
}
