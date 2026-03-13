import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  ScrollView, View, StyleSheet, Alert, TouchableOpacity, Animated, Easing,
} from "react-native";
import { Text, Switch, Snackbar } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import WeatherAnimation from "../components/WeatherAnimation";
import { useSimulation } from "../hooks/useSimulation";

const SPEED_OPTIONS = [1, 5, 10, 60];
const WEATHER_OPTIONS = [
  { key: "sunny", label: "Sunny" },
  { key: "partly_cloudy", label: "Partly Cloudy" },
  { key: "cloudy", label: "Cloudy" },
  { key: "night", label: "Night" },
];

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

function PressableRow({ children, onPress }: { children: React.ReactNode; onPress: () => void }) {
  const scale = useRef(new Animated.Value(1)).current;
  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity activeOpacity={0.8}
        onPressIn={() => Animated.spring(scale, { toValue: 0.96, tension: 200, friction: 10, useNativeDriver: true }).start()}
        onPressOut={() => Animated.spring(scale, { toValue: 1, tension: 200, friction: 10, useNativeDriver: true }).start()}
        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onPress(); }}>
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function ControlScreen() {
  const { status, sendControl, resetSimulation } = useSimulation();
  const [weather, setWeather] = useState(status?.weather || "sunny");
  const [phoneConnected, setPhoneConnected] = useState(status?.phone_connected || false);
  const [speed, setSpeed] = useState(1);
  const [snackVisible, setSnackVisible] = useState(false);
  const [snackMessage, setSnackMessage] = useState("");

  const speedSlide = useRef(new Animated.Value(0)).current;

  const toast = useCallback((m: string) => { setSnackMessage(m); setSnackVisible(true); }, []);

  const handleWeather = async (w: string) => {
    setWeather(w);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try { await sendControl({ weather: w }); toast("Weather updated"); } catch { toast("Error: connection failed"); }
  };

  const handlePhone = async (v: boolean) => {
    setPhoneConnected(v);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try { await sendControl({ phone_connected: v }); toast(v ? "Phone connected" : "Phone disconnected"); } catch { toast("Error"); }
  };

  const handleSpeed = async (s: number) => {
    const idx = SPEED_OPTIONS.indexOf(s);
    Animated.spring(speedSlide, { toValue: idx, tension: 80, friction: 12, useNativeDriver: true }).start();
    setSpeed(s);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try { await sendControl({ speed: s }); toast(`Speed: ${s}x`); } catch { toast("Error"); }
  };

  const handleReset = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert("Reset Simulation", "This will reset all simulation data.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Reset", style: "destructive",
        onPress: async () => {
          try {
            await resetSimulation();
            setWeather("sunny"); setPhoneConnected(false); setSpeed(1); speedSlide.setValue(0);
            toast("Simulation reset");
          } catch { toast("Error"); }
        },
      },
    ]);
  };

  const segW = (Dimensions_width - 48) / 4;
  const slideX = speedSlide.interpolate({ inputRange: [0, 1, 2, 3], outputRange: [2, segW + 2, segW * 2 + 2, segW * 3 + 2] });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} bounces>
        <FadeIn delay={0}>
          <Text style={styles.largeTitle}>Settings</Text>
        </FadeIn>

        {/* Weather Preview */}
        <FadeIn delay={80}>
          <View style={styles.previewRow}>
            <WeatherAnimation weather={weather} size={64} />
          </View>
        </FadeIn>

        {/* Weather Section */}
        <FadeIn delay={160}>
          <Text style={styles.sectionHeader}>WEATHER</Text>
          <View style={styles.groupCard}>
            {WEATHER_OPTIONS.map((opt, i) => (
              <PressableRow key={opt.key} onPress={() => handleWeather(opt.key)}>
                <View style={[styles.listRow, i < WEATHER_OPTIONS.length - 1 && styles.listRowBorder]}>
                  <View style={styles.listRowLeft}>
                    <WeatherAnimation weather={opt.key} size={28} />
                    <Text style={styles.listRowText}>{opt.label}</Text>
                  </View>
                  {weather === opt.key && <Text style={styles.checkmark}>{"\u2713"}</Text>}
                </View>
              </PressableRow>
            ))}
          </View>
        </FadeIn>

        {/* Phone Toggle */}
        <FadeIn delay={240}>
          <Text style={styles.sectionHeader}>DEVICE</Text>
          <View style={styles.groupCard}>
            <View style={styles.listRow}>
              <View style={styles.listRowLeft}>
                <Text style={{ fontSize: 20 }}>{"\uD83D\uDCF1"}</Text>
                <Text style={styles.listRowText}>Phone Connected</Text>
              </View>
              <Switch value={phoneConnected} onValueChange={handlePhone} color="#30D158" />
            </View>
          </View>
          <Text style={styles.footnote}>
            {phoneConnected ? "Phone is charging at 5W via USB" : "No device connected"}
          </Text>
        </FadeIn>

        {/* Speed */}
        <FadeIn delay={320}>
          <Text style={styles.sectionHeader}>SIMULATION SPEED</Text>
          <View style={styles.segmentOuter}>
            <Animated.View style={[styles.segmentIndicator, { transform: [{ translateX: slideX }], width: segW - 4 }]} />
            {SPEED_OPTIONS.map((s) => (
              <TouchableOpacity key={s} style={styles.segmentBtn}
                onPress={() => handleSpeed(s)}>
                <Text style={[styles.segmentText, speed === s && styles.segmentActive]}>{s}x</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.footnote}>Every 2 seconds advances {speed} minute(s)</Text>
        </FadeIn>

        {/* Status */}
        {status && (
          <FadeIn delay={400}>
            <Text style={styles.sectionHeader}>CURRENT STATUS</Text>
            <View style={styles.groupCard}>
              <InfoRow label="Time" value={status.time} border />
              <InfoRow label="Battery" value={`${status.battery_percent}%`} border />
              <InfoRow label="Solar" value={`${status.solar_watts}W`} border />
              <InfoRow label="Consumption" value={`${status.consumption_watts}W`} />
            </View>
          </FadeIn>
        )}

        {/* Reset */}
        <FadeIn delay={480}>
          <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
            <Text style={styles.resetText}>Reset Simulation</Text>
          </TouchableOpacity>
        </FadeIn>
      </ScrollView>

      <Snackbar visible={snackVisible} onDismiss={() => setSnackVisible(false)} duration={2000}
        style={styles.snackbar}>{snackMessage}</Snackbar>
    </SafeAreaView>
  );
}

function InfoRow({ label, value, border }: { label: string; value: string; border?: boolean }) {
  return (
    <View style={[styles.listRow, border && styles.listRowBorder]}>
      <Text style={styles.listRowText}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

// Get screen width for segment sizing
import { Dimensions } from "react-native";
const Dimensions_width = Dimensions.get("window").width;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000000" },
  content: { paddingHorizontal: 16, paddingBottom: 32 },
  largeTitle: { color: "#FFFFFF", fontSize: 34, fontWeight: "700", letterSpacing: -0.5, marginTop: 8, marginBottom: 8 },
  previewRow: { alignItems: "center", marginBottom: 8 },
  sectionHeader: {
    color: "rgba(235,235,245,0.6)", fontSize: 13, fontWeight: "400",
    letterSpacing: -0.1, marginTop: 24, marginBottom: 8, marginLeft: 16,
  },
  groupCard: { backgroundColor: "#1C1C1E", borderRadius: 12, overflow: "hidden" },
  listRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 14, minHeight: 44,
  },
  listRowBorder: { borderBottomWidth: 0.5, borderBottomColor: "rgba(84,84,88,0.65)" },
  listRowLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  listRowText: { color: "#FFFFFF", fontSize: 17, fontWeight: "400", letterSpacing: -0.3 },
  checkmark: { color: "#FFD60A", fontSize: 17, fontWeight: "600" },
  infoValue: { color: "rgba(235,235,245,0.6)", fontSize: 17, letterSpacing: -0.3 },
  footnote: { color: "rgba(235,235,245,0.3)", fontSize: 13, letterSpacing: -0.3, marginTop: 8, marginLeft: 16 },
  segmentOuter: {
    flexDirection: "row", backgroundColor: "#3A3A3C", borderRadius: 8,
    height: 32, padding: 2, position: "relative",
  },
  segmentIndicator: {
    position: "absolute", top: 2, height: 28, backgroundColor: "#FFFFFF",
    borderRadius: 7, shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 2, shadowOffset: { width: 0, height: 1 },
  },
  segmentBtn: { flex: 1, justifyContent: "center", alignItems: "center", zIndex: 1 },
  segmentText: { color: "rgba(235,235,245,0.6)", fontSize: 13, fontWeight: "600", letterSpacing: -0.3 },
  segmentActive: { color: "#000000" },
  resetBtn: { marginTop: 32, alignItems: "center", paddingVertical: 14 },
  resetText: { color: "#FF453A", fontSize: 17, fontWeight: "400", letterSpacing: -0.3 },
  snackbar: { backgroundColor: "#1C1C1E" },
});
