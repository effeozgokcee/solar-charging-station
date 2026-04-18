import { Tabs } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View } from "react-native";
import Svg, { Circle, Rect, Path, Line as SvgLine, G } from "react-native-svg";

// Pure SVG tab icons — no emoji, crisp on all platforms
function SunIcon({ color }: { color: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={5} fill={color} />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => {
        const rad = (a * Math.PI) / 180;
        return (
          <SvgLine key={a} x1={12 + Math.cos(rad) * 7.5} y1={12 + Math.sin(rad) * 7.5}
            x2={12 + Math.cos(rad) * 10} y2={12 + Math.sin(rad) * 10}
            stroke={color} strokeWidth={1.5} strokeLinecap="round" />
        );
      })}
    </Svg>
  );
}

function ChartIcon({ color }: { color: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24">
      <Path d="M3 20 L8 13 L13 16 L21 6" stroke={color} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx={21} cy={6} r={2} fill={color} />
    </Svg>
  );
}

function BoltIcon({ color }: { color: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24">
      <Path d="M13 2L4 14h7l-2 8 9-12h-7l2-8z" fill={color} />
    </Svg>
  );
}

function BatteryIcon({ color }: { color: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24">
      <Rect x={2} y={6} width={18} height={12} rx={2} stroke={color} strokeWidth={1.8} fill="none" />
      <Rect x={22} y={9} width={2} height={6} rx={1} fill={color} />
      <Rect x={5} y={9} width={8} height={6} rx={1} fill={color} />
    </Svg>
  );
}

function GearIcon({ color }: { color: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={3} stroke={color} strokeWidth={1.8} fill="none" />
      <Path d="M12 1v3M12 20v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M1 12h3M20 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"
        stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
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
            height: 84,
            paddingTop: 8,
            paddingBottom: 28,
          },
          tabBarActiveTintColor: "#FFD60A",
          tabBarInactiveTintColor: "rgba(235,235,245,0.25)",
          tabBarLabelStyle: { fontSize: 10, fontWeight: "600", letterSpacing: 0.2, marginTop: 4 },
        }}
      >
        <Tabs.Screen name="index" options={{ title: "Dashboard", tabBarIcon: ({ color }) => <SunIcon color={color} /> }} />
        <Tabs.Screen name="history" options={{ title: "History", tabBarIcon: ({ color }) => <ChartIcon color={color} /> }} />
        <Tabs.Screen name="system" options={{ title: "System", tabBarIcon: ({ color }) => <BoltIcon color={color} /> }} />
        <Tabs.Screen name="device" options={{ title: "Cihaz", tabBarIcon: ({ color }) => <BatteryIcon color={color} />, tabBarActiveTintColor: "#30D158" }} />
        <Tabs.Screen name="control" options={{ title: "Settings", tabBarIcon: ({ color }) => <GearIcon color={color} /> }} />
      </Tabs>
    </View>
  );
}
