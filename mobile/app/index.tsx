import React from "react";
import { ScrollView, View, StyleSheet, ActivityIndicator } from "react-native";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import WeatherAnimation from "../components/WeatherAnimation";
import SunCycle from "../components/SunCycle";
import AnimatedBattery from "../components/AnimatedBattery";
import EnergyFlow from "../components/EnergyFlow";
import PowerGauge from "../components/PowerGauge";
import { useSimulation } from "../hooks/useSimulation";

export default function DashboardScreen() {
  const { status, error, loading } = useSimulation();

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#F5A623" />
        <Text style={styles.loadingText}>Simulatora baglaniliyor...</Text>
      </View>
    );
  }

  if (error || !status) {
    return (
      <View style={[styles.container, styles.center]}>
        <MaterialCommunityIcons name="wifi-off" size={64} color="#FF4444" />
        <Text style={styles.errorText}>Baglanti Hatasi</Text>
        <Text style={styles.errorDetail}>{error || "Veri alinamadi"}</Text>
      </View>
    );
  }

  const netColor = status.net_power >= 0 ? "#00C851" : "#FF4444";

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.timeRow}>
        <MaterialCommunityIcons name="clock-outline" size={18} color="#F5A623" />
        <Text style={styles.timeText}>{status.time}</Text>
      </View>

      <View style={styles.weatherSection}>
        <WeatherAnimation weather={status.weather} size={120} />
        <Text style={styles.weatherLabel}>
          {status.weather === "sunny"
            ? "Gunesli"
            : status.weather === "partly_cloudy"
            ? "Parcali Bulutlu"
            : status.weather === "cloudy"
            ? "Bulutlu"
            : "Gece"}
        </Text>
      </View>

      <SunCycle time={status.time} />

      <EnergyFlow
        netPower={status.net_power}
        solarWatts={status.solar_watts}
        phoneConnected={status.phone_connected}
      />

      <View style={styles.batterySection}>
        <AnimatedBattery percent={status.battery_percent} chargingStatus={status.charging_status} />
      </View>

      <View style={styles.statsRow}>
        <View style={[styles.statCard, { borderTopColor: "#F5A623" }]}>
          <MaterialCommunityIcons name="white-balance-sunny" size={20} color="#F5A623" />
          <Text style={[styles.statValue, { color: "#F5A623" }]}>{status.solar_watts.toFixed(1)}</Text>
          <Text style={styles.statUnit}>W uretim</Text>
        </View>
        <View style={[styles.statCard, { borderTopColor: "#2196F3" }]}>
          <MaterialCommunityIcons name="cellphone-charging" size={20} color="#2196F3" />
          <Text style={[styles.statValue, { color: "#2196F3" }]}>{status.consumption_watts.toFixed(1)}</Text>
          <Text style={styles.statUnit}>W tuketim</Text>
        </View>
        <View style={[styles.statCard, { borderTopColor: netColor }]}>
          <MaterialCommunityIcons
            name={status.net_power >= 0 ? "trending-up" : "trending-down"}
            size={20}
            color={netColor}
          />
          <Text style={[styles.statValue, { color: netColor }]}>{status.net_power.toFixed(1)}</Text>
          <Text style={styles.statUnit}>W net</Text>
        </View>
      </View>

      <View style={styles.infoRow}>
        <Text style={styles.infoText}>Batarya: {status.battery_wh.toFixed(1)} / 37.0 Wh</Text>
        <Text style={styles.infoText}>Verim: {status.efficiency}%</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1A1A2E",
  },
  center: {
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginBottom: 4,
  },
  timeText: {
    color: "#F5A623",
    fontSize: 20,
    fontWeight: "bold",
  },
  weatherSection: {
    alignItems: "center",
    marginVertical: 4,
  },
  weatherLabel: {
    color: "#8892A4",
    fontSize: 13,
    marginTop: 4,
    letterSpacing: 1,
  },
  batterySection: {
    alignItems: "center",
    marginVertical: 4,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
    marginTop: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#16213E",
    borderRadius: 12,
    borderTopWidth: 3,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  statValue: {
    fontSize: 22,
    fontWeight: "bold",
    marginTop: 4,
  },
  statUnit: {
    color: "#8892A4",
    fontSize: 10,
    marginTop: 2,
    textTransform: "uppercase",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
    paddingHorizontal: 4,
  },
  infoText: {
    color: "#8892A4",
    fontSize: 12,
  },
  loadingText: {
    color: "#8892A4",
    marginTop: 12,
    fontSize: 14,
  },
  errorText: {
    color: "#FF4444",
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 12,
  },
  errorDetail: {
    color: "#8892A4",
    fontSize: 13,
    marginTop: 4,
  },
});
