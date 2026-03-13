// -*- coding: utf-8 -*-
import { Tabs } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View, Text } from "react-native";

function TabIcon({ label, color }: { label: string; color: string }) {
  return <Text style={{ fontSize: 22, color }}>{label}</Text>;
}

export default function Layout() {
  return (
    <View style={{ flex: 1, backgroundColor: "#000000" }}>
      <StatusBar style="light" />
      <Tabs
        screenOptions={{
          headerStyle: { backgroundColor: "#000000", shadowColor: "transparent", elevation: 0 },
          headerTintColor: "#FFFFFF",
          headerTitleStyle: { fontWeight: "700", fontSize: 17, letterSpacing: -0.3 },
          tabBarStyle: {
            backgroundColor: "rgba(0,0,0,0.85)",
            borderTopWidth: 0.5,
            borderTopColor: "rgba(84,84,88,0.3)",
            paddingTop: 4,
          },
          tabBarActiveTintColor: "#FFD60A",
          tabBarInactiveTintColor: "rgba(235,235,245,0.3)",
          tabBarLabelStyle: { fontSize: 10, fontWeight: "500", letterSpacing: -0.2 },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Ana Ekran",
            headerShown: false,
            tabBarIcon: ({ color }) => <TabIcon label={"\u2600\uFE0F"} color={color} />,
          }}
        />
        <Tabs.Screen
          name="history"
          options={{
            title: "Ge\u00E7mi\u015F",
            headerShown: false,
            tabBarIcon: ({ color }) => <TabIcon label={"\uD83D\uDCC8"} color={color} />,
          }}
        />
        <Tabs.Screen
          name="system"
          options={{
            title: "Sistem",
            headerShown: false,
            tabBarIcon: ({ color }) => <TabIcon label={"\u26A1"} color={color} />,
          }}
        />
        <Tabs.Screen
          name="control"
          options={{
            title: "Kontrol",
            headerShown: false,
            tabBarIcon: ({ color }) => <TabIcon label={"\u2699\uFE0F"} color={color} />,
          }}
        />
      </Tabs>
    </View>
  );
}
