import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  ScrollView,
  View,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Animated,
} from "react-native";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { LineChart } from "react-native-chart-kit";
import WeatherAnimation from "../components/WeatherAnimation";
import { useSimulation, SimulationStatus } from "../hooks/useSimulation";

const screenWidth = Dimensions.get("window").width - 32;

const solarChartConfig = {
  backgroundColor: "#16213E",
  backgroundGradientFrom: "#16213E",
  backgroundGradientTo: "#1A1A2E",
  decimalPlaces: 1,
  color: (opacity = 1) => `rgba(245, 166, 35, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(136, 146, 164, ${opacity})`,
  propsForDots: { r: "2", strokeWidth: "1", stroke: "#F5A623" },
  propsForBackgroundLines: { stroke: "#2A2A4A" },
};

const consumptionChartConfig = {
  ...solarChartConfig,
  color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
  propsForDots: { r: "2", strokeWidth: "1", stroke: "#2196F3" },
};

const batteryChartConfig = {
  ...solarChartConfig,
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(0, 200, 81, ${opacity})`,
  propsForDots: { r: "2", strokeWidth: "1", stroke: "#00C851" },
};

function sampleData(data: number[], maxPoints: number): number[] {
  if (data.length <= maxPoints) return data;
  const step = Math.ceil(data.length / maxPoints);
  return data.filter((_, i) => i % step === 0);
}

function sampleLabels(history: SimulationStatus[], maxLabels: number): string[] {
  if (history.length === 0) return [""];
  const step = Math.max(1, Math.floor(history.length / maxLabels));
  const labels: string[] = [];
  for (let i = 0; i < history.length; i += step) {
    labels.push(history[i].time);
  }
  return labels.length > 0 ? labels : [""];
}

function FadeInCard({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 600, delay, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 600, delay, useNativeDriver: true }),
    ]).start();
  }, [opacity, translateY, delay]);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      {children}
    </Animated.View>
  );
}

export default function HistoryScreen() {
  const { status, fetchHistory } = useSimulation(0);
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
        <MaterialCommunityIcons name="chart-line" size={64} color="#FF4444" />
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (history.length === 0) {
    return (
      <View style={[styles.container, styles.center]}>
        <MaterialCommunityIcons name="chart-line" size={64} color="#3A4A5C" />
        <Text style={styles.emptyText}>Henuz veri yok</Text>
        <Text style={styles.emptySubtext}>Simulasyon calismaya basladikca veriler burada gorunecek</Text>
      </View>
    );
  }

  const maxPoints = 30;
  const labels = sampleLabels(history, 6);
  const solarData = sampleData(history.map((h) => h.solar_watts), maxPoints);
  const consumptionData = sampleData(history.map((h) => h.consumption_watts), maxPoints);
  const batteryData = sampleData(history.map((h) => h.battery_percent), maxPoints);
  const ensureNonEmpty = (arr: number[]) => (arr.length > 0 ? arr : [0]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F5A623" />}
    >
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          {status && <WeatherAnimation weather={status.weather} size={60} />}
          <View>
            <Text style={styles.headerText}>Son 24 Saat</Text>
            <Text style={styles.dataPoints}>{history.length} veri noktasi</Text>
          </View>
        </View>
      </View>

      <FadeInCard delay={0}>
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Gunes Uretimi (W)</Text>
          <LineChart
            data={{ labels, datasets: [{ data: ensureNonEmpty(solarData) }] }}
            width={screenWidth - 32}
            height={200}
            chartConfig={solarChartConfig}
            bezier
            style={styles.chart}
            withVerticalLines={false}
          />
        </View>
      </FadeInCard>

      <FadeInCard delay={150}>
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Tuketim (W)</Text>
          <LineChart
            data={{ labels, datasets: [{ data: ensureNonEmpty(consumptionData) }] }}
            width={screenWidth - 32}
            height={200}
            chartConfig={consumptionChartConfig}
            bezier
            style={styles.chart}
            withVerticalLines={false}
          />
        </View>
      </FadeInCard>

      <FadeInCard delay={300}>
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Batarya Seviyesi (%)</Text>
          <LineChart
            data={{ labels, datasets: [{ data: ensureNonEmpty(batteryData) }] }}
            width={screenWidth - 32}
            height={200}
            chartConfig={batteryChartConfig}
            bezier
            style={styles.chart}
            withVerticalLines={false}
            fromZero
          />
        </View>
      </FadeInCard>
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
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  dataPoints: {
    color: "#8892A4",
    fontSize: 12,
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
    color: "#8892A4",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 12,
  },
  chart: {
    borderRadius: 8,
  },
  errorText: {
    color: "#FF4444",
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 12,
  },
  emptyText: {
    color: "#8892A4",
    fontSize: 16,
    marginTop: 12,
  },
  emptySubtext: {
    color: "#3A4A5C",
    fontSize: 13,
    marginTop: 4,
    textAlign: "center",
  },
});
