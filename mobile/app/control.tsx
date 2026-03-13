import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  ScrollView, View, StyleSheet, Alert, TouchableOpacity, Animated, Dimensions,
} from "react-native";
import { Text, Snackbar } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import WeatherIcon from "../components/WeatherIcons";
import { DEVICES, DEVICE_ICONS } from "../components/DeviceIcons";
import { useSimulation } from "../hooks/useSimulation";

const SCREEN_W = Dimensions.get("window").width;

const SPEED_OPTIONS = [1, 5, 10, 60];
const WEATHER_OPTIONS = [
  { key: "sunny", label: "Sunny", borderColor: "#FFD60A" },
  { key: "partly_cloudy", label: "Partly Cloudy", borderColor: "#8E8E93" },
  { key: "cloudy", label: "Cloudy", borderColor: "#636366" },
  { key: "night", label: "Night", borderColor: "#5E5CE6" },
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
        onPressIn={() => Animated.spring(scale, { toValue: 0.97, tension: 200, friction: 10, useNativeDriver: true }).start()}
        onPressOut={() => Animated.spring(scale, { toValue: 1, tension: 200, friction: 10, useNativeDriver: true }).start()}
        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onPress(); }}>
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
}

// FIX 4: Rebuilt segmented control from scratch
function SpeedSegment({ value, onChange }: { value: number; onChange: (s: number) => void }) {
  const containerWidth = SCREEN_W - 64;
  const segmentWidth = (containerWidth - 4) / 4;
  const translateX = useRef(new Animated.Value(0)).current;

  const animateTo = (index: number) => {
    Animated.spring(translateX, {
      toValue: index * segmentWidth,
      tension: 80,
      friction: 12,
      useNativeDriver: true,
    }).start();
  };

  useEffect(() => {
    const idx = SPEED_OPTIONS.indexOf(value);
    if (idx >= 0) translateX.setValue(idx * segmentWidth);
  }, []);

  return (
    <View style={[styles.speedContainer, { width: containerWidth }]}>
      <Animated.View style={[styles.speedIndicator, {
        width: segmentWidth,
        transform: [{ translateX }],
      }]} />
      {SPEED_OPTIONS.map((s, index) => (
        <TouchableOpacity
          key={s}
          onPress={() => {
            animateTo(index);
            onChange(s);
          }}
          style={[styles.speedBtn, { width: segmentWidth }]}
          activeOpacity={1}
        >
          <Text style={[styles.speedText, value === s && styles.speedTextActive]}>
            {s}x
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// FIX 5: Device selector grid
function DeviceSelector({ selected, onSelect }: {
  selected: string;
  onSelect: (id: string, watts: number) => void;
}) {
  const cardWidth = (SCREEN_W - 64 - 16) / 3;

  return (
    <View style={styles.deviceGrid}>
      {DEVICES.map((device) => {
        const isSelected = selected === device.id;
        const IconComp = DEVICE_ICONS[device.id];
        const scaleRef = useRef(new Animated.Value(1)).current;

        const handlePress = () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          Animated.sequence([
            Animated.spring(scaleRef, { toValue: 0.95, tension: 200, friction: 10, useNativeDriver: true }),
            Animated.spring(scaleRef, { toValue: 1.05, tension: 200, friction: 10, useNativeDriver: true }),
            Animated.spring(scaleRef, { toValue: 1, tension: 200, friction: 10, useNativeDriver: true }),
          ]).start();
          onSelect(device.id, device.watts);
        };

        return (
          <Animated.View key={device.id} style={{ transform: [{ scale: scaleRef }] }}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handlePress}
              style={[styles.deviceCard, {
                width: cardWidth,
                backgroundColor: isSelected ? "#2C2C2E" : "#1C1C1E",
                borderColor: isSelected ? "#FFD60A" : "rgba(255,255,255,0.1)",
                borderWidth: isSelected ? 2 : 1,
              }]}
            >
              <IconComp size={28} color={isSelected ? "#FFD60A" : "rgba(235,235,245,0.5)"} />
              <Text style={[styles.deviceLabel, isSelected && styles.deviceLabelActive]}>
                {device.label}
              </Text>
              <Text style={styles.deviceWatts}>
                {device.watts > 0 ? `${device.watts}W` : "\u2014"}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        );
      })}
    </View>
  );
}

export default function ControlScreen() {
  const { status, sendControl, resetSimulation } = useSimulation();
  const [weather, setWeather] = useState(status?.weather || "sunny");
  const [deviceType, setDeviceType] = useState(status?.device_type || "none");
  const [speed, setSpeed] = useState(1);
  const [snackVisible, setSnackVisible] = useState(false);
  const [snackMessage, setSnackMessage] = useState("");

  const toast = useCallback((m: string) => { setSnackMessage(m); setSnackVisible(true); }, []);

  const handleWeather = async (w: string) => {
    setWeather(w);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try { await sendControl({ weather: w }); toast("Weather updated"); } catch { toast("Error: connection failed"); }
  };

  const handleDevice = async (id: string, watts: number) => {
    setDeviceType(id);
    try {
      await sendControl({
        device_type: id,
        consumption_watts: watts,
        phone_connected: id !== "none",
      });
      toast(id === "none" ? "Device disconnected" : `${DEVICES.find(d => d.id === id)?.label} connected`);
    } catch { toast("Error"); }
  };

  const handleSpeed = async (s: number) => {
    setSpeed(s);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try { await sendControl({ speed: s }); toast(`Speed: ${s}x`); } catch { toast("Error"); }
  };

  const handleReset = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert("Reset Simulation", "All simulation data will be reset.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Reset", style: "destructive",
        onPress: async () => {
          try {
            await resetSimulation();
            setWeather("sunny"); setDeviceType("none"); setSpeed(1);
            toast("Simulation reset");
          } catch { toast("Error"); }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} bounces>
        <FadeIn delay={0}>
          <Text style={styles.largeTitle}>Settings</Text>
        </FadeIn>

        {/* FIX 3: Weather selector with SVG icons */}
        <FadeIn delay={80}>
          <Text style={styles.sectionHeader}>WEATHER</Text>
          <View style={styles.groupCard}>
            {WEATHER_OPTIONS.map((opt, i) => (
              <PressableRow key={opt.key} onPress={() => handleWeather(opt.key)}>
                <View style={[styles.listRow, i < WEATHER_OPTIONS.length - 1 && styles.listRowBorder]}>
                  <View style={styles.listRowLeft}>
                    <View style={[styles.weatherIconWrap, {
                      borderColor: weather === opt.key ? opt.borderColor : "transparent",
                    }]}>
                      <WeatherIcon weather={opt.key} size={28} />
                    </View>
                    <Text style={styles.listRowText}>{opt.label}</Text>
                  </View>
                  {weather === opt.key && <Text style={styles.checkmark}>{"\u2713"}</Text>}
                </View>
              </PressableRow>
            ))}
          </View>
        </FadeIn>

        {/* FIX 5: Device selector */}
        <FadeIn delay={160}>
          <Text style={styles.sectionHeader}>DEVICE</Text>
          <DeviceSelector selected={deviceType} onSelect={handleDevice} />
          <Text style={styles.footnote}>
            {deviceType === "none"
              ? "No device connected"
              : `${DEVICES.find(d => d.id === deviceType)?.label} charging at ${DEVICES.find(d => d.id === deviceType)?.watts}W via USB`}
          </Text>
        </FadeIn>

        {/* FIX 4: Speed segment rebuilt */}
        <FadeIn delay={240}>
          <Text style={styles.sectionHeader}>SIMULATION SPEED</Text>
          <SpeedSegment value={speed} onChange={handleSpeed} />
          <Text style={styles.footnote}>Every 2 seconds advances {speed} minute(s)</Text>
        </FadeIn>

        {status && (
          <FadeIn delay={320}>
            <Text style={styles.sectionHeader}>CURRENT STATUS</Text>
            <View style={styles.groupCard}>
              <InfoRow label="Time" value={status.time} border />
              <InfoRow label="Battery" value={`${status.battery_percent}%`} border />
              <InfoRow label="Solar" value={`${status.solar_watts}W`} border />
              <InfoRow label="Consumption" value={`${status.consumption_watts}W`} />
            </View>
          </FadeIn>
        )}

        <FadeIn delay={400}>
          <TouchableOpacity style={styles.resetBtn} onPress={handleReset} activeOpacity={0.7}>
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000000" },
  content: { paddingHorizontal: 16, paddingBottom: 32 },
  largeTitle: { color: "#FFFFFF", fontSize: 34, fontWeight: "700", letterSpacing: -0.5, marginTop: 8, marginBottom: 8 },
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
  // FIX 3: Weather icon wrapper with border for selected state
  weatherIconWrap: {
    width: 36, height: 36, borderRadius: 18, borderWidth: 2,
    alignItems: "center", justifyContent: "center",
  },
  // FIX 4: Speed segment
  speedContainer: {
    height: 36, backgroundColor: "#2C2C2E", borderRadius: 10,
    flexDirection: "row", padding: 2, position: "relative",
  },
  speedIndicator: {
    position: "absolute", height: 32, backgroundColor: "#48484A",
    borderRadius: 8, top: 2, left: 2,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3, shadowRadius: 2, elevation: 3,
  },
  speedBtn: {
    height: 32, justifyContent: "center", alignItems: "center", zIndex: 1,
  },
  speedText: {
    fontSize: 14, fontWeight: "400", color: "rgba(235,235,245,0.6)",
  },
  speedTextActive: { fontWeight: "600", color: "#FFFFFF" },
  // FIX 5: Device grid
  deviceGrid: {
    flexDirection: "row", flexWrap: "wrap", gap: 8,
  },
  deviceCard: {
    height: 80, borderRadius: 12, alignItems: "center",
    justifyContent: "center", gap: 4,
  },
  deviceLabel: {
    color: "rgba(235,235,245,0.6)", fontSize: 11, fontWeight: "500", letterSpacing: -0.2,
  },
  deviceLabelActive: { color: "#FFFFFF" },
  deviceWatts: {
    color: "rgba(235,235,245,0.3)", fontSize: 10, letterSpacing: -0.2,
  },
  resetBtn: { marginTop: 32, alignItems: "center", paddingVertical: 14, minHeight: 44 },
  resetText: { color: "#FF453A", fontSize: 17, fontWeight: "400", letterSpacing: -0.3 },
  snackbar: { backgroundColor: "#1C1C1E" },
});
