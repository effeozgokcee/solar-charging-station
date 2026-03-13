import React, { useEffect, useRef } from "react";
import { ScrollView, View, StyleSheet, ActivityIndicator, Animated } from "react-native";
import { Text } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import WeatherAnimation from "../components/WeatherAnimation";
import SunCycle from "../components/SunCycle";
import AnimatedBattery from "../components/AnimatedBattery";
import EnergyFlow from "../components/EnergyFlow";
import { useSimulation } from "../hooks/useSimulation";

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

export default function DashboardScreen() {
  const { status, error, loading } = useSimulation();

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
        {/* Header */}
        <FadeIn delay={0}>
          <View style={styles.header}>
            <Text style={styles.largeTitle}>Solar Station</Text>
            <Text style={styles.timeText}>{status.time}</Text>
          </View>
        </FadeIn>

        {/* Weather Pill */}
        <FadeIn delay={80}>
          <View style={styles.weatherPillRow}>
            <View style={styles.weatherPill}>
              <WeatherAnimation weather={status.weather} size={28} />
              <Text style={styles.weatherPillText}>{weatherLabel}</Text>
            </View>
          </View>
        </FadeIn>

        {/* Sun Cycle */}
        <FadeIn delay={160}>
          <View style={styles.card}>
            <SunCycle time={status.time} />
          </View>
        </FadeIn>

        {/* Energy Flow */}
        <FadeIn delay={240}>
          <EnergyFlow
            netPower={status.net_power}
            solarWatts={status.solar_watts}
            phoneConnected={status.phone_connected}
          />
        </FadeIn>

        {/* Battery */}
        <FadeIn delay={320}>
          <View style={styles.card}>
            <AnimatedBattery percent={status.battery_percent} chargingStatus={status.charging_status} />
          </View>
        </FadeIn>

        {/* Stats Row */}
        <FadeIn delay={400}>
          <View style={styles.statsRow}>
            <StatCard value={status.solar_watts.toFixed(1)} unit="W" label="Solar" color="#FFD60A" />
            <StatCard value={status.consumption_watts.toFixed(1)} unit="W" label="Load" color="#0A84FF" />
            <StatCard value={status.net_power.toFixed(1)} unit="W" label="Net" color={netColor} />
          </View>
        </FadeIn>

        {/* Info */}
        <FadeIn delay={480}>
          <View style={styles.infoRow}>
            <Text style={styles.infoText}>{status.battery_wh.toFixed(1)} / 37.0 Wh</Text>
            <Text style={styles.infoText}>Eff. {status.efficiency}%</Text>
          </View>
        </FadeIn>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ value, unit, label, color }: { value: string; unit: string; label: string; color: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={[styles.statValue, { color }]}>{value}<Text style={styles.statUnit}>{unit}</Text></Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
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
  card: {
    backgroundColor: "#1C1C1E", borderRadius: 20, padding: 16, marginVertical: 6,
  },
  statsRow: { flexDirection: "row", gap: 8, marginTop: 8 },
  statCard: {
    flex: 1, backgroundColor: "#1C1C1E", borderRadius: 12,
    paddingVertical: 16, paddingHorizontal: 12, alignItems: "center",
  },
  statValue: { fontSize: 22, fontWeight: "700", letterSpacing: -0.5 },
  statUnit: { fontSize: 14, fontWeight: "400" },
  statLabel: { color: "rgba(235,235,245,0.3)", fontSize: 12, fontWeight: "400", marginTop: 4, letterSpacing: -0.3 },
  infoRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 12, paddingHorizontal: 4 },
  infoText: { color: "rgba(235,235,245,0.3)", fontSize: 13, letterSpacing: -0.3 },
  loadingText: { color: "rgba(235,235,245,0.6)", marginTop: 12, fontSize: 15 },
  errorTitle: { color: "#FF453A", fontSize: 20, fontWeight: "700", marginTop: 16 },
  errorDetail: { color: "rgba(235,235,245,0.3)", fontSize: 15, marginTop: 4 },
});
