import React from "react";
import { ScrollView, View, StyleSheet, ActivityIndicator } from "react-native";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import BatteryIndicator from "../components/BatteryIndicator";
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
        <MaterialCommunityIcons name="wifi-off" size={64} color="#F44336" />
        <Text style={styles.errorText}>Baglanti Hatasi</Text>
        <Text style={styles.errorDetail}>{error || "Veri alinamadi"}</Text>
      </View>
    );
  }

  const netColor = status.net_power >= 0 ? "#4CAF50" : "#F44336";

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.timeRow}>
        <MaterialCommunityIcons name="clock-outline" size={20} color="#F5A623" />
        <Text style={styles.timeText}>{status.time}</Text>
        <View style={[styles.weatherBadge]}>
          <Text style={styles.weatherText}>
            {status.weather === "sunny"
              ? "\u2600\uFE0F Gunesli"
              : status.weather === "partly_cloudy"
              ? "\u26C5 Parcali Bulutlu"
              : status.weather === "cloudy"
              ? "\u2601\uFE0F Bulutlu"
              : "\uD83C\uDF19 Gece"}
          </Text>
        </View>
      </View>

      <BatteryIndicator percent={status.battery_percent} chargingStatus={status.charging_status} />

      <PowerGauge
        label="Gunes Uretimi"
        watts={status.solar_watts}
        icon="white-balance-sunny"
        color="#F5A623"
        subtitle={`Panel: 10W | Verim: ${status.efficiency}%`}
      />

      <PowerGauge
        label="Tuketim"
        watts={status.consumption_watts}
        icon="cellphone-charging"
        color="#2196F3"
        subtitle={status.phone_connected ? "Telefon bagli" : "Telefon bagli degil"}
      />

      <PowerGauge
        label="Net Guc"
        watts={status.net_power}
        icon={status.net_power >= 0 ? "trending-up" : "trending-down"}
        color={netColor}
        subtitle={`Batarya: ${status.battery_wh.toFixed(1)} Wh / 37.0 Wh`}
      />
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
    marginBottom: 8,
    gap: 8,
  },
  timeText: {
    color: "#F5A623",
    fontSize: 20,
    fontWeight: "bold",
  },
  weatherBadge: {
    backgroundColor: "#16213E",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  weatherText: {
    color: "#FFFFFF",
    fontSize: 13,
  },
  loadingText: {
    color: "#AAAAAA",
    marginTop: 12,
    fontSize: 14,
  },
  errorText: {
    color: "#F44336",
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 12,
  },
  errorDetail: {
    color: "#AAAAAA",
    fontSize: 13,
    marginTop: 4,
  },
});
