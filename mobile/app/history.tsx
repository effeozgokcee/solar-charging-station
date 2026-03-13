import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  ScrollView, View, StyleSheet, ActivityIndicator,
  RefreshControl, Dimensions, Animated, TouchableOpacity,
} from "react-native";
import { Text } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import { LineChart } from "react-native-chart-kit";
import * as Haptics from "expo-haptics";
import WeatherAnimation from "../components/WeatherAnimation";
import { useSimulation, SimulationStatus } from "../hooks/useSimulation";

const screenW = Dimensions.get("window").width - 32;

const baseConfig = {
  backgroundColor: "transparent",
  backgroundGradientFrom: "#1C1C1E",
  backgroundGradientTo: "#1C1C1E",
  decimalPlaces: 1,
  labelColor: () => "rgba(235,235,245,0.3)",
  propsForBackgroundLines: { stroke: "rgba(255,255,255,0.05)" },
  propsForDots: { r: "2" },
};

const solarConfig = { ...baseConfig, color: (o = 1) => `rgba(255,214,10,${o})`, propsForDots: { ...baseConfig.propsForDots, stroke: "#FFD60A" } };
const loadConfig = { ...baseConfig, color: (o = 1) => `rgba(10,132,255,${o})`, propsForDots: { ...baseConfig.propsForDots, stroke: "#0A84FF" } };
const battConfig = { ...baseConfig, decimalPlaces: 0, color: (o = 1) => `rgba(48,209,88,${o})`, propsForDots: { ...baseConfig.propsForDots, stroke: "#30D158" } };

function sample(arr: number[], max: number): number[] {
  if (arr.length <= max) return arr;
  const step = Math.ceil(arr.length / max);
  return arr.filter((_, i) => i % step === 0);
}

function labels(h: SimulationStatus[], n: number): string[] {
  if (!h.length) return [""];
  const step = Math.max(1, Math.floor(h.length / n));
  const r: string[] = [];
  for (let i = 0; i < h.length; i += step) r.push(h[i].time);
  return r.length ? r : [""];
}

function FadeIn({ delay = 0, children }: { delay?: number; children: React.ReactNode }) {
  const o = useRef(new Animated.Value(0)).current;
  const y = useRef(new Animated.Value(20)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.spring(o, { toValue: 1, tension: 60, friction: 10, delay, useNativeDriver: true }),
      Animated.spring(y, { toValue: 0, tension: 60, friction: 10, delay, useNativeDriver: true }),
    ]).start();
  }, [o, y, delay]);
  return <Animated.View style={{ opacity: o, transform: [{ translateY: y }] }}>{children}</Animated.View>;
}

type Tab = "power" | "battery";

function SegmentControl({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  const slideX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(slideX, {
      toValue: active === "power" ? 0 : 1,
      tension: 80, friction: 12, useNativeDriver: true,
    }).start();
  }, [active, slideX]);

  const translateX = slideX.interpolate({ inputRange: [0, 1], outputRange: [2, (screenW - 16) / 2] });

  return (
    <View style={styles.segmentOuter}>
      <Animated.View style={[styles.segmentIndicator, { transform: [{ translateX }], width: (screenW - 16) / 2 - 2 }]} />
      <TouchableOpacity style={styles.segmentBtn} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onChange("power"); }}>
        <Text style={[styles.segmentText, active === "power" && styles.segmentActive]}>Power</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.segmentBtn} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onChange("battery"); }}>
        <Text style={[styles.segmentText, active === "battery" && styles.segmentActive]}>Battery</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function HistoryScreen() {
  const { status, fetchHistory } = useSimulation(0);
  const [history, setHistory] = useState<SimulationStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("power");

  const loadData = useCallback(async () => {
    try {
      const d = await fetchHistory();
      setHistory(d);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [fetchHistory]);

  useFocusEffect(useCallback(() => { setLoading(true); loadData(); }, [loadData]));

  if (loading && !refreshing) {
    return <SafeAreaView style={[styles.container, styles.center]}><ActivityIndicator size="large" color="#FFD60A" /></SafeAreaView>;
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <Text style={{ fontSize: 48 }}>{"\uD83D\uDCC9"}</Text>
        <Text style={styles.errorText}>{error}</Text>
      </SafeAreaView>
    );
  }

  if (!history.length) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <Text style={{ fontSize: 48 }}>{"\uD83D\uDCC8"}</Text>
        <Text style={styles.emptyText}>No data yet</Text>
        <Text style={styles.emptySubtext}>Data will appear as the simulation runs</Text>
      </SafeAreaView>
    );
  }

  const maxPts = 30;
  const lbls = labels(history, 6);
  const solarD = sample(history.map((h) => h.solar_watts), maxPts);
  const loadD = sample(history.map((h) => h.consumption_watts), maxPts);
  const battD = sample(history.map((h) => h.battery_percent), maxPts);
  const safe = (a: number[]) => (a.length ? a : [0]);

  const peakSolar = Math.max(...history.map((h) => h.solar_watts)).toFixed(1);
  const avgBattery = (history.reduce((s, h) => s + h.battery_percent, 0) / history.length).toFixed(0);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} bounces
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor="#FFD60A" />}>

        <FadeIn delay={0}>
          <View style={styles.headerRow}>
            <Text style={styles.largeTitle}>History</Text>
            {status && <WeatherAnimation weather={status.weather} size={40} />}
          </View>
          <Text style={styles.subtitle}>{history.length} data points</Text>
        </FadeIn>

        <FadeIn delay={80}>
          <SegmentControl active={tab} onChange={setTab} />
        </FadeIn>

        {tab === "power" ? (
          <>
            <FadeIn delay={160}>
              <View style={styles.chartCard}>
                <Text style={styles.chartTitle}>Solar Production</Text>
                <LineChart data={{ labels: lbls, datasets: [{ data: safe(solarD) }] }}
                  width={screenW - 32} height={200} chartConfig={solarConfig} bezier
                  style={styles.chart} withVerticalLines={false} />
              </View>
            </FadeIn>
            <FadeIn delay={240}>
              <View style={styles.chartCard}>
                <Text style={styles.chartTitle}>Consumption</Text>
                <LineChart data={{ labels: lbls, datasets: [{ data: safe(loadD) }] }}
                  width={screenW - 32} height={200} chartConfig={loadConfig} bezier
                  style={styles.chart} withVerticalLines={false} />
              </View>
            </FadeIn>
          </>
        ) : (
          <FadeIn delay={160}>
            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>Battery Level</Text>
              <LineChart data={{ labels: lbls, datasets: [{ data: safe(battD) }] }}
                width={screenW - 32} height={220} chartConfig={battConfig} bezier
                style={styles.chart} withVerticalLines={false} fromZero />
            </View>
          </FadeIn>
        )}

        <FadeIn delay={320}>
          <View style={styles.summaryRow}>
            <SummaryItem label="Peak" value={`${peakSolar}W`} color="#FFD60A" />
            <SummaryItem label="Points" value={`${history.length}`} color="#0A84FF" />
            <SummaryItem label="Avg Battery" value={`${avgBattery}%`} color="#30D158" />
          </View>
        </FadeIn>
      </ScrollView>
    </SafeAreaView>
  );
}

function SummaryItem({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={styles.summaryCard}>
      <Text style={[styles.summaryValue, { color }]}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000000" },
  center: { justifyContent: "center", alignItems: "center", padding: 32 },
  content: { paddingHorizontal: 16, paddingBottom: 32 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 8 },
  largeTitle: { color: "#FFFFFF", fontSize: 34, fontWeight: "700", letterSpacing: -0.5 },
  subtitle: { color: "rgba(235,235,245,0.3)", fontSize: 13, letterSpacing: -0.3, marginBottom: 16 },
  segmentOuter: {
    flexDirection: "row", backgroundColor: "#3A3A3C", borderRadius: 8,
    height: 32, marginBottom: 16, padding: 2, position: "relative",
  },
  segmentIndicator: {
    position: "absolute", top: 2, height: 28, backgroundColor: "#FFFFFF",
    borderRadius: 7, shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 2, shadowOffset: { width: 0, height: 1 },
  },
  segmentBtn: { flex: 1, justifyContent: "center", alignItems: "center", zIndex: 1, minHeight: 44 },
  segmentText: { color: "rgba(235,235,245,0.6)", fontSize: 13, fontWeight: "600", letterSpacing: -0.3 },
  segmentActive: { color: "#000000" },
  chartCard: { backgroundColor: "#1C1C1E", borderRadius: 20, padding: 16, marginVertical: 6 },
  chartTitle: { color: "rgba(235,235,245,0.6)", fontSize: 13, fontWeight: "600", letterSpacing: -0.3, marginBottom: 12 },
  chart: { borderRadius: 12 },
  summaryRow: { flexDirection: "row", gap: 8, marginTop: 8 },
  summaryCard: { flex: 1, backgroundColor: "#1C1C1E", borderRadius: 12, paddingVertical: 14, alignItems: "center", minHeight: 44 },
  summaryValue: { fontSize: 20, fontWeight: "700", letterSpacing: -0.5 },
  summaryLabel: { color: "rgba(235,235,245,0.3)", fontSize: 12, marginTop: 4, letterSpacing: -0.3 },
  errorText: { color: "#FF453A", fontSize: 17, fontWeight: "700", marginTop: 16 },
  emptyText: { color: "rgba(235,235,245,0.6)", fontSize: 17, marginTop: 16 },
  emptySubtext: { color: "rgba(235,235,245,0.3)", fontSize: 15, marginTop: 4, textAlign: "center" },
});
