import React, { useState, useEffect, useRef } from "react";
import { ScrollView, View, StyleSheet, ActivityIndicator, Animated, TouchableOpacity } from "react-native";
import { Text } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import WeatherAnimation from "../components/WeatherAnimation";
import SunCycle from "../components/SunCycle";
import AnimatedBattery from "../components/AnimatedBattery";
import EnergyFlow from "../components/EnergyFlow";
import InfoDrawer, { DrawerContent } from "../components/InfoDrawer";
import { useSimulation } from "../hooks/useSimulation";

const CARD_INFO: Record<string, DrawerContent> = {
  solar: {
    title: "Solar Power (P)",
    unit: "Watt (W)",
    formula: "P = V \u00D7 I",
    explanation: "The solar panel converts photon energy into electrical energy. The generated power equals the product of panel voltage (V) and current (I). In this project, a 10W panel produces between 0\u201310W depending on sun angle and weather conditions.",
    funFact: "1 Watt = 1 Joule/second of energy flow.",
  },
  battery: {
    title: "Battery Capacity",
    unit: "Watt-hour (Wh) / Percent (%)",
    formula: "Wh = mAh \u00D7 V / 1000",
    explanation: "The lithium-ion battery converts chemical energy into electrical energy. Capacity is measured in Wh. This system uses a 3.7V \u00D7 10000mAh = 37Wh battery. Charge level is protected between 5% and 95% for battery longevity.",
    funFact: "A fully charged battery can charge a smartphone approximately 2.5 times.",
  },
  consumption: {
    title: "Power Consumption (P)",
    unit: "Watt (W)",
    formula: "P = 5V \u00D7 1A = 5W",
    explanation: "Per USB standards, phone charging draws 1A at 5V. Since the boost converter operates at 85% efficiency, the battery actually supplies 5W\u00F70.85=5.88W. This loss is converted to heat.",
    funFact: "USB-A standard output provides a maximum of 5W (5V\u00D71A).",
  },
  net: {
    title: "Net Power",
    unit: "Watt (W)",
    formula: "P_net = P_production - P_consumption",
    explanation: "Positive value: panel covers consumption and charges the battery. Negative value: production is insufficient, drawing from battery. Zero: perfect balance point.",
    funFact: "Law of conservation of energy: energy cannot be created, only transformed.",
  },
  efficiency: {
    title: "System Efficiency (\u03B7)",
    unit: "Percent (%)",
    formula: "\u03B7 = (P_output / P_input) \u00D7 100",
    explanation: "The boost converter (DC-DC step-up) loses energy while stepping up 3.7V battery voltage to 5V USB output. 85% efficiency means that for every 100J, 85J is converted to useful output.",
    funFact: "An ideal (lossless) conversion is theoretically impossible.",
  },
};

function FadeIn({ delay = 0, children }: { delay?: number; children: React.ReactNode }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.spring(opacity, { toValue: 1, tension: 60, friction: 10, delay, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, tension: 60, friction: 10, delay, useNativeDriver: true }),
    ]).start();
  }, [opacity, translateY, delay]);
  return <Animated.View style={{ opacity, transform: [{ translateY }] }}>{children}</Animated.View>;
}

function TappableStatCard({ value, unit, label, color, infoKey, onPress }: {
  value: string; unit: string; label: string; color: string; infoKey: string;
  onPress: (key: string) => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  return (
    <Animated.View style={[styles.statCard, { transform: [{ scale }] }]}>
      <TouchableOpacity
        activeOpacity={0.8}
        onPressIn={() => Animated.spring(scale, { toValue: 0.96, tension: 200, friction: 10, useNativeDriver: true }).start()}
        onPressOut={() => Animated.spring(scale, { toValue: 1, tension: 200, friction: 10, useNativeDriver: true }).start()}
        onPress={() => onPress(infoKey)}
      >
        <View style={styles.statCardInner}>
          <Text style={styles.infoIcon}>{"\u24D8"}</Text>
          <Text style={[styles.statValue, { color }]}>
            {value}<Text style={styles.statUnit}>{unit}</Text>
          </Text>
          <Text style={styles.statLabel}>{label}</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function DashboardScreen() {
  const { status, error, loading } = useSimulation();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [drawerContent, setDrawerContent] = useState<DrawerContent | null>(null);

  const openInfo = (key: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setDrawerContent(CARD_INFO[key]);
    setDrawerVisible(true);
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#FFD60A" />
        <Text style={styles.loadingText}>Connecting...</Text>
      </SafeAreaView>
    );
  }

  if (error || !status) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <Text style={{ fontSize: 48 }}>{"\uD83D\uDCF6"}</Text>
        <Text style={styles.errorTitle}>Connection Error</Text>
        <Text style={styles.errorDetail}>{error || "No data"}</Text>
      </SafeAreaView>
    );
  }

  const netColor = status.net_power >= 0 ? "#30D158" : "#FF453A";
  const weatherLabel =
    status.weather === "sunny" ? "Sunny" :
    status.weather === "partly_cloudy" ? "Partly Cloudy" :
    status.weather === "cloudy" ? "Cloudy" : "Night";

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} bounces>
        <FadeIn delay={0}>
          <View style={styles.header}>
            <Text style={styles.largeTitle}>Solar Station</Text>
            <Text style={styles.timeText}>{status.time}</Text>
          </View>
        </FadeIn>

        <FadeIn delay={80}>
          <View style={styles.weatherPillRow}>
            <View style={styles.weatherPill}>
              <WeatherAnimation weather={status.weather} size={28} />
              <Text style={styles.weatherPillText}>{weatherLabel}</Text>
            </View>
          </View>
        </FadeIn>

        <FadeIn delay={160}>
          <View style={styles.card}>
            <SunCycle time={status.time} />
          </View>
        </FadeIn>

        <FadeIn delay={240}>
          <EnergyFlow
            netPower={status.net_power}
            solarWatts={status.solar_watts}
            phoneConnected={status.phone_connected}
          />
        </FadeIn>

        <FadeIn delay={320}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => openInfo("battery")}
            style={styles.card}
          >
            <View style={styles.batteryCardHeader}>
              <Text style={styles.cardLabel}>Battery</Text>
              <Text style={styles.infoIcon}>{"\u24D8"}</Text>
            </View>
            <AnimatedBattery percent={status.battery_percent} chargingStatus={status.charging_status} />
          </TouchableOpacity>
        </FadeIn>

        <FadeIn delay={400}>
          <View style={styles.statsRow}>
            <TappableStatCard value={status.solar_watts.toFixed(1)} unit="W" label="Solar" color="#FFD60A" infoKey="solar" onPress={openInfo} />
            <TappableStatCard value={status.consumption_watts.toFixed(1)} unit="W" label="Load" color="#0A84FF" infoKey="consumption" onPress={openInfo} />
            <TappableStatCard value={status.net_power.toFixed(1)} unit="W" label="Net" color={netColor} infoKey="net" onPress={openInfo} />
          </View>
        </FadeIn>

        <FadeIn delay={480}>
          <TouchableOpacity onPress={() => openInfo("efficiency")} activeOpacity={0.8}>
            <View style={styles.efficiencyRow}>
              <View style={styles.efficiencyLeft}>
                <Text style={styles.effLabel}>Efficiency</Text>
                <Text style={styles.effValue}>{status.efficiency}%</Text>
              </View>
              <View style={styles.efficiencyRight}>
                <Text style={styles.effLabel}>Battery</Text>
                <Text style={styles.effValue}>{status.battery_wh.toFixed(1)} Wh</Text>
              </View>
              <Text style={styles.infoIconSmall}>{"\u24D8"}</Text>
            </View>
          </TouchableOpacity>
        </FadeIn>
      </ScrollView>

      <InfoDrawer visible={drawerVisible} content={drawerContent} onClose={() => setDrawerVisible(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000000" },
  center: { justifyContent: "center", alignItems: "center" },
  content: { paddingHorizontal: 16, paddingBottom: 32 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 16, marginTop: 8 },
  largeTitle: { color: "#FFFFFF", fontSize: 34, fontWeight: "700", letterSpacing: -0.5 },
  timeText: { color: "rgba(235,235,245,0.6)", fontSize: 17, fontWeight: "600", letterSpacing: -0.3 },
  weatherPillRow: { alignItems: "center", marginBottom: 12 },
  weatherPill: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "#3A3A3C", paddingHorizontal: 16, paddingVertical: 6,
    borderRadius: 18, height: 36,
  },
  weatherPillText: { color: "#FFFFFF", fontSize: 15, fontWeight: "500", letterSpacing: -0.3 },
  card: { backgroundColor: "#1C1C1E", borderRadius: 20, padding: 16, marginVertical: 6 },
  batteryCardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  cardLabel: { color: "rgba(235,235,245,0.6)", fontSize: 13, fontWeight: "600", letterSpacing: -0.3 },
  statsRow: { flexDirection: "row", gap: 8, marginTop: 8 },
  statCard: { flex: 1 },
  statCardInner: {
    backgroundColor: "#1C1C1E", borderRadius: 12,
    paddingVertical: 16, paddingHorizontal: 10, alignItems: "center", minHeight: 44,
  },
  statValue: { fontSize: 22, fontWeight: "700", letterSpacing: -0.5 },
  statUnit: { fontSize: 14, fontWeight: "400" },
  statLabel: { color: "rgba(235,235,245,0.3)", fontSize: 12, marginTop: 4, letterSpacing: -0.3 },
  infoIcon: { color: "rgba(235,235,245,0.2)", fontSize: 12, position: "absolute", top: 6, right: 8 },
  infoIconSmall: { color: "rgba(235,235,245,0.2)", fontSize: 12 },
  efficiencyRow: {
    flexDirection: "row", backgroundColor: "#1C1C1E", borderRadius: 12,
    padding: 16, marginTop: 8, alignItems: "center", minHeight: 44,
  },
  efficiencyLeft: { flex: 1 },
  efficiencyRight: { flex: 1 },
  effLabel: { color: "rgba(235,235,245,0.3)", fontSize: 12, letterSpacing: -0.3 },
  effValue: { color: "#FFFFFF", fontSize: 20, fontWeight: "700", letterSpacing: -0.5, marginTop: 2 },
  loadingText: { color: "rgba(235,235,245,0.6)", marginTop: 12, fontSize: 15 },
  errorTitle: { color: "#FF453A", fontSize: 20, fontWeight: "700", marginTop: 16 },
  errorDetail: { color: "rgba(235,235,245,0.3)", fontSize: 15, marginTop: 4 },
});
