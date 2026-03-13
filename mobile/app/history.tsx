import React, { useState, useCallback } from "react";
import {
  ScrollView,
  View,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from "react-native";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useSimulation, SimulationStatus } from "../hooks/useSimulation";

const screenWidth = Dimensions.get("window").width - 32;

function SimpleChart({ data, label, color }: { data: number[]; label: string; color: string }) {
  if (data.length === 0) return null;
  const max = Math.max(...data, 1);
  const barWidth = Math.max(1, screenWidth / data.length);

  return (
    <View style={styles.chartCard}>
      <Text style={styles.chartTitle}>{label}</Text>
      <View style={styles.chartContainer}>
        <View style={styles.barsRow}>
          {data.map((val, i) => (
            <View
              key={i}
              style={[
                styles.bar,
                {
                  width: barWidth,
                  height: Math.max(1, (val / max) * 120),
                  backgroundColor: color,
                },
              ]}
            />
          ))}
        </View>
        <View style={styles.axisLabels}>
          <Text style={styles.axisText}>0W</Text>
          <Text style={styles.axisText}>{max.toFixed(1)}W</Text>
        </View>
      </View>
    </View>
  );
}

function BatteryChart({ data }: { data: number[] }) {
  if (data.length === 0) return null;
  const barWidth = Math.max(1, screenWidth / data.length);

  return (
    <View style={styles.chartCard}>
      <Text style={styles.chartTitle}>Batarya Seviyesi (%)</Text>
      <View style={styles.chartContainer}>
        <View style={styles.barsRow}>
          {data.map((val, i) => {
            const color = val > 50 ? "#4CAF50" : val > 20 ? "#FFC107" : "#F44336";
            return (
              <View
                key={i}
                style={[
                  styles.bar,
                  {
                    width: barWidth,
                    height: Math.max(1, (val / 100) * 80),
                    backgroundColor: color,
                    opacity: 0.7,
                  },
                ]}
              />
            );
          })}
        </View>
        <View style={styles.axisLabels}>
          <Text style={styles.axisText}>0%</Text>
          <Text style={styles.axisText}>100%</Text>
        </View>
      </View>
    </View>
  );
}

export default function HistoryScreen() {
  const { fetchHistory } = useSimulation(0);
  const [history, setHistory] = useState<SimulationStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const data = await fetchHistory();
      setHistory(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Veri alinamadi");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [fetchHistory]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadData();
    }, [loadData])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#F5A623" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.center]}>
        <MaterialCommunityIcons name="chart-line" size={64} color="#F44336" />
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (history.length === 0) {
    return (
      <View style={[styles.container, styles.center]}>
        <MaterialCommunityIcons name="chart-line" size={64} color="#666666" />
        <Text style={styles.emptyText}>Henuz veri yok</Text>
        <Text style={styles.emptySubtext}>Simulasyon calismaya basladikca veriler burada gorunecek</Text>
      </View>
    );
  }

  const solarData = history.map((h) => h.solar_watts);
  const consumptionData = history.map((h) => h.consumption_watts);
  const batteryData = history.map((h) => h.battery_percent);

  const timeLabels = history.filter((_, i) => i % Math.max(1, Math.floor(history.length / 6)) === 0);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F5A623" />}
    >
      <View style={styles.headerRow}>
        <Text style={styles.headerText}>Son 24 Saat</Text>
        <Text style={styles.dataPoints}>{history.length} veri noktasi</Text>
      </View>

      <View style={styles.timeLabelsRow}>
        {timeLabels.map((h, i) => (
          <Text key={i} style={styles.timeLabel}>{h.time}</Text>
        ))}
      </View>

      <SimpleChart data={solarData} label="Gunes Uretimi (W)" color="#F5A623" />
      <SimpleChart data={consumptionData} label="Tuketim (W)" color="#2196F3" />
      <BatteryChart data={batteryData} />
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
    padding: 32,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  headerText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  dataPoints: {
    color: "#AAAAAA",
    fontSize: 12,
  },
  timeLabelsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  timeLabel: {
    color: "#AAAAAA",
    fontSize: 10,
  },
  chartCard: {
    backgroundColor: "#16213E",
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  chartTitle: {
    color: "#AAAAAA",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 12,
  },
  chartContainer: {
    height: 140,
    justifyContent: "flex-end",
  },
  barsRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    height: 120,
  },
  bar: {
    borderRadius: 1,
  },
  axisLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  axisText: {
    color: "#666666",
    fontSize: 10,
  },
  errorText: {
    color: "#F44336",
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 12,
  },
  emptyText: {
    color: "#AAAAAA",
    fontSize: 16,
    marginTop: 12,
  },
  emptySubtext: {
    color: "#666666",
    fontSize: 13,
    marginTop: 4,
    textAlign: "center",
  },
});
