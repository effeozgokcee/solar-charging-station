import React, { useState, useEffect, useRef } from "react";
import { ScrollView, View, StyleSheet, ActivityIndicator, Animated, TouchableOpacity, Dimensions } from "react-native";
import { Text } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import Svg, { Circle, Rect, Line as SvgLine, LinearGradient, Stop, Defs } from "react-native-svg";
import WeatherAnimation from "../components/WeatherAnimation";
import SunCycle from "../components/SunCycle";
import AnimatedBattery from "../components/AnimatedBattery";
import EnergyFlow from "../components/EnergyFlow";
import InfoDrawer, { DrawerContent } from "../components/InfoDrawer";
import { useSimulation } from "../hooks/useSimulation";
import { DEVICES } from "../components/DeviceIcons";
import { useDeviceBattery } from "../hooks/useDeviceBattery";

const SCREEN_W = Dimensions.get("window").width;

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
  const translateY = useRef(new Animated.Value(24)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.spring(opacity, { toValue: 1, tension: 50, friction: 10, delay, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, tension: 50, friction: 10, delay, useNativeDriver: true }),
    ]).start();
  }, [opacity, translateY, delay]);
  return <Animated.View style={{ opacity, transform: [{ translateY }] }}>{children}</Animated.View>;
}

function GlowCard({ children, style, onPress }: { children: React.ReactNode; style?: any; onPress?: () => void }) {
  const scale = useRef(new Animated.Value(1)).current;
  const content = (
    <Animated.View style={[styles.glowCard, style, { transform: [{ scale }] }]}>
      {children}
    </Animated.View>
  );
  if (!onPress) return content;
  return (
    <TouchableOpacity activeOpacity={0.9}
      onPressIn={() => Animated.spring(scale, { toValue: 0.97, tension: 300, friction: 10, useNativeDriver: true }).start()}
      onPressOut={() => Animated.spring(scale, { toValue: 1, tension: 300, friction: 10, useNativeDriver: true }).start()}
      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onPress(); }}>
      {content}
    </TouchableOpacity>
  );
}

function StatPill({ value, unit, label, color, onPress }: {
  value: string; unit: string; label: string; color: string; onPress: () => void;
}) {
  return (
    <GlowCard style={styles.statPill} onPress={onPress}>
      <View style={[styles.statDot, { backgroundColor: color }]} />
      <Text style={[styles.statPillValue, { color }]}>{value}<Text style={styles.statPillUnit}>{unit}</Text></Text>
      <Text style={styles.statPillLabel}>{label}</Text>
    </GlowCard>
  );
}

export default function DashboardScreen() {
  const { status, error, loading } = useSimulation();
  const battery = useDeviceBattery();
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
        <Svg width={64} height={64} viewBox="0 0 24 24">
          <Circle cx={12} cy={12} r={10} stroke="#FF453A" strokeWidth={2} fill="none" />
          <SvgLine x1={12} y1={7} x2={12} y2={13} stroke="#FF453A" strokeWidth={2} strokeLinecap="round" />
          <Circle cx={12} cy={16.5} r={1} fill="#FF453A" />
        </Svg>
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

  const deviceLabel = status.device_type && status.device_type !== "none"
    ? (DEVICES.find(d => d.id === status.device_type)?.label || "Load")
    : "Load";

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} bounces>
        {/* Header */}
        <FadeIn delay={0}>
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>Solar Station</Text>
              <Text style={styles.timeText}>{status.time}</Text>
            </View>
            <View style={styles.weatherChip}>
              <WeatherAnimation weather={status.weather} size={24} />
              <Text style={styles.weatherChipText}>{weatherLabel}</Text>
            </View>
          </View>
        </FadeIn>

        {/* Sun Cycle */}
        <FadeIn delay={60}>
          <GlowCard>
            <SunCycle time={status.time} />
          </GlowCard>
        </FadeIn>

        {/* Energy Flow */}
        <FadeIn delay={120}>
          <EnergyFlow netPower={status.net_power} solarWatts={status.solar_watts} phoneConnected={status.phone_connected} />
        </FadeIn>

        {/* Battery */}
        <FadeIn delay={180}>
          <GlowCard onPress={() => openInfo("battery")}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardLabel}>Battery</Text>
              <View style={styles.whBadge}>
                <Text style={styles.whText}>{status.battery_wh.toFixed(1)} Wh</Text>
              </View>
            </View>
            <AnimatedBattery percent={status.battery_percent} chargingStatus={status.charging_status} />
          </GlowCard>
        </FadeIn>

        {/* Stats */}
        <FadeIn delay={240}>
          <View style={styles.statsRow}>
            <StatPill value={status.solar_watts.toFixed(1)} unit="W" label="Solar" color="#FFD60A" onPress={() => openInfo("solar")} />
            <StatPill value={status.consumption_watts.toFixed(1)} unit="W" label={deviceLabel} color="#0A84FF" onPress={() => openInfo("consumption")} />
            <StatPill value={status.net_power.toFixed(1)} unit="W" label="Net" color={netColor} onPress={() => openInfo("net")} />
          </View>
        </FadeIn>

        {/* Efficiency bar */}
        <FadeIn delay={300}>
          <GlowCard onPress={() => openInfo("efficiency")}>
            <View style={styles.effRow}>
              <View style={styles.effItem}>
                <Text style={styles.effLabel}>Efficiency</Text>
                <Text style={styles.effValue}>{status.efficiency}%</Text>
              </View>
              <View style={styles.effDivider} />
              <View style={styles.effItem}>
                <Text style={styles.effLabel}>Stored</Text>
                <Text style={styles.effValue}>{status.battery_wh.toFixed(1)} Wh</Text>
              </View>
              <View style={styles.effDivider} />
              <View style={styles.effItem}>
                <Text style={styles.effLabel}>Status</Text>
                <Text style={[styles.effValue, {
                  color: status.charging_status === "charging" ? "#30D158" :
                    status.charging_status === "discharging" ? "#FF453A" : "rgba(235,235,245,0.4)",
                  fontSize: 14,
                }]}>
                  {status.charging_status === "charging" ? "Charging" :
                    status.charging_status === "discharging" ? "Discharging" : "Idle"}
                </Text>
              </View>
            </View>
          </GlowCard>
        </FadeIn>

        {/* Device battery mini */}
        <FadeIn delay={360}>
          <GlowCard>
            <View style={styles.cardHeader}>
              <Text style={styles.cardLabel}>Your Device</Text>
              <View style={[styles.liveDot, { backgroundColor: "#30D158" }]} />
            </View>
            <View style={styles.deviceRow}>
              <View style={styles.deviceMetric}>
                <Text style={[styles.deviceValue, { color: battery.percent > 60 ? "#30D158" : battery.percent > 20 ? "#FF9F0A" : "#FF453A" }]}>{battery.percent}%</Text>
                <Text style={styles.deviceLabel}>{battery.stateLabel}</Text>
              </View>
              <View style={styles.deviceDivider} />
              <View style={styles.deviceMetric}>
                <Text style={[styles.deviceValue, { color: "#FFD60A" }]}>{battery.voltage}V</Text>
                <Text style={styles.deviceLabel}>Voltage</Text>
              </View>
              <View style={styles.deviceDivider} />
              <View style={styles.deviceMetric}>
                <Text style={[styles.deviceValue, { color: "#0A84FF" }]}>{battery.current}mA</Text>
                <Text style={styles.deviceLabel}>Current</Text>
              </View>
              <View style={styles.deviceDivider} />
              <View style={styles.deviceMetric}>
                <Text style={[styles.deviceValue, { color: "#BF5AF2" }]}>{battery.powerWatts}W</Text>
                <Text style={styles.deviceLabel}>Power</Text>
              </View>
            </View>
          </GlowCard>
        </FadeIn>

        <View style={{ height: 20 }} />
      </ScrollView>
      <InfoDrawer visible={drawerVisible} content={drawerContent} onClose={() => setDrawerVisible(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000000" },
  center: { justifyContent: "center", alignItems: "center" },
  content: { paddingHorizontal: 20, paddingBottom: 32 },
  // Header
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, marginTop: 8 },
  greeting: { color: "#FFFFFF", fontSize: 32, fontWeight: "800", letterSpacing: -0.8 },
  timeText: { color: "rgba(235,235,245,0.4)", fontSize: 15, fontWeight: "500", letterSpacing: -0.3, marginTop: 2 },
  weatherChip: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "rgba(255,255,255,0.06)", paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)",
  },
  weatherChipText: { color: "rgba(235,235,245,0.7)", fontSize: 13, fontWeight: "500", letterSpacing: -0.2 },
  // Glow card
  glowCard: {
    backgroundColor: "rgba(28,28,30,0.8)", borderRadius: 20, padding: 16, marginBottom: 10,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.06)",
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  cardLabel: { color: "rgba(235,235,245,0.5)", fontSize: 13, fontWeight: "600", letterSpacing: 0.3, textTransform: "uppercase" },
  whBadge: { backgroundColor: "rgba(255,214,10,0.1)", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  whText: { color: "#FFD60A", fontSize: 12, fontWeight: "600" },
  // Stats
  statsRow: { flexDirection: "row", gap: 8 },
  statPill: { flex: 1, alignItems: "center", paddingVertical: 14, paddingHorizontal: 8, marginBottom: 10 },
  statDot: { width: 6, height: 6, borderRadius: 3, marginBottom: 8 },
  statPillValue: { fontSize: 22, fontWeight: "800", letterSpacing: -0.8 },
  statPillUnit: { fontSize: 13, fontWeight: "400" },
  statPillLabel: { color: "rgba(235,235,245,0.3)", fontSize: 11, marginTop: 4, fontWeight: "500", letterSpacing: 0.2 },
  // Efficiency
  effRow: { flexDirection: "row", alignItems: "center" },
  effItem: { flex: 1, alignItems: "center" },
  effDivider: { width: 1, height: 32, backgroundColor: "rgba(255,255,255,0.06)" },
  effLabel: { color: "rgba(235,235,245,0.3)", fontSize: 11, fontWeight: "500", letterSpacing: 0.2, marginBottom: 4 },
  effValue: { color: "#FFFFFF", fontSize: 18, fontWeight: "700", letterSpacing: -0.5 },
  // Device battery mini
  liveDot: { width: 8, height: 8, borderRadius: 4 },
  deviceRow: { flexDirection: "row", alignItems: "center", paddingTop: 4 },
  deviceMetric: { flex: 1, alignItems: "center" },
  deviceDivider: { width: 1, height: 28, backgroundColor: "rgba(255,255,255,0.06)" },
  deviceValue: { fontSize: 17, fontWeight: "700", letterSpacing: -0.5 },
  deviceLabel: { color: "rgba(235,235,245,0.3)", fontSize: 10, marginTop: 3, fontWeight: "500" },
  // Loading/Error
  loadingText: { color: "rgba(235,235,245,0.5)", marginTop: 16, fontSize: 15 },
  errorTitle: { color: "#FF453A", fontSize: 20, fontWeight: "700", marginTop: 20 },
  errorDetail: { color: "rgba(235,235,245,0.3)", fontSize: 15, marginTop: 6 },
});
