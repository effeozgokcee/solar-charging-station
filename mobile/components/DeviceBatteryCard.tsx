import React, { useEffect, useRef, memo } from "react";
import { View, Animated, StyleSheet, Easing } from "react-native";
import { Text } from "react-native-paper";
import Svg, { Rect, Path, Defs, LinearGradient, Stop, Text as SvgText } from "react-native-svg";

const AnimatedRect = Animated.createAnimatedComponent(Rect);

interface Props {
  percent: number;
  isCharging: boolean;
  stateLabel: string;
  isLow: boolean;
  lowPowerMode: boolean;
  simPercent: number;
  voltage?: number;
  current?: number;
  powerWatts?: number;
}

function getColor(p: number): string {
  if (p > 60) return "#30D158";
  if (p > 20) return "#FF9F0A";
  return "#FF453A";
}

function DeviceBatteryCard({ percent, isCharging, stateLabel, isLow, lowPowerMode, simPercent, voltage, current, powerWatts }: Props) {
  const fillAnim = useRef(new Animated.Value(percent)).current;
  const pulseScale = useRef(new Animated.Value(1)).current;
  const lowPulse = useRef(new Animated.Value(0)).current;
  const simFillAnim = useRef(new Animated.Value(simPercent)).current;

  useEffect(() => {
    Animated.timing(fillAnim, {
      toValue: percent,
      duration: 600,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [percent, fillAnim]);

  useEffect(() => {
    Animated.timing(simFillAnim, {
      toValue: simPercent,
      duration: 600,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [simPercent, simFillAnim]);

  useEffect(() => {
    if (isCharging) {
      const anim = Animated.loop(Animated.sequence([
        Animated.timing(pulseScale, { toValue: 0.97, duration: 1200, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
        Animated.timing(pulseScale, { toValue: 1, duration: 1200, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
      ]));
      anim.start();
      return () => anim.stop();
    } else {
      pulseScale.setValue(1);
    }
  }, [isCharging, pulseScale]);

  useEffect(() => {
    if (isLow) {
      const anim = Animated.loop(Animated.sequence([
        Animated.timing(lowPulse, { toValue: 1, duration: 800, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
        Animated.timing(lowPulse, { toValue: 0, duration: 800, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
      ]));
      anim.start();
      return () => anim.stop();
    } else {
      lowPulse.setValue(0);
    }
  }, [isLow, lowPulse]);

  const color = getColor(percent);
  const bw = 80, bh = 140;
  const bx = 10, by = 20;
  const bW = bw - 20, bH = bh - 30;
  const tipW = 22, tipH = 10;
  const pad = 4;
  const maxFill = bH - pad * 2;

  const fillH = fillAnim.interpolate({ inputRange: [0, 100], outputRange: [0, maxFill], extrapolate: "clamp" });
  const fillY = fillAnim.interpolate({ inputRange: [0, 100], outputRange: [by + bH - pad, by + pad], extrapolate: "clamp" });

  const deviceBarWidth = fillAnim.interpolate({ inputRange: [0, 100], outputRange: [0, 1], extrapolate: "clamp" });
  const simBarWidth = simFillAnim.interpolate({ inputRange: [0, 100], outputRange: [0, 1], extrapolate: "clamp" });
  const diff = percent - simPercent;

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Cihaz Pili</Text>
        <View style={styles.liveBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>CANLI</Text>
        </View>
      </View>

      {/* Battery + Stats row */}
      <View style={styles.batteryRow}>
        {/* Battery SVG */}
        <View style={styles.batteryWrap}>
          {isLow && (
            <Animated.View style={[styles.lowPulseRing, { opacity: lowPulse, borderColor: "#FF453A" }]} />
          )}
          <Animated.View style={{ transform: [{ scale: pulseScale }] }}>
            <Svg width={bw} height={bh}>
              <Defs>
                <LinearGradient id="devFill" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor={color} stopOpacity="0.9" />
                  <Stop offset="1" stopColor={color} stopOpacity="0.5" />
                </LinearGradient>
              </Defs>
              <Rect x={(bw - tipW) / 2} y={by - tipH + 2} width={tipW} height={tipH} rx={3} fill="#3A3A3C" />
              <Rect x={bx} y={by} width={bW} height={bH} rx={8} fill="none" stroke="#3A3A3C" strokeWidth={2} />
              <AnimatedRect x={bx + pad} y={fillY} width={bW - pad * 2} height={fillH} rx={5} fill="url(#devFill)" />
              {isCharging && (
                <Path d="M 38 50 L 32 68 L 38 68 L 34 86 L 48 62 L 42 62 L 46 50 Z" fill="rgba(255,255,255,0.85)" />
              )}
              <SvgText x={bw / 2} y={by + bH / 2 + (isCharging ? 24 : 6)} fill="#FFFFFF" fontSize={15} fontWeight="700" textAnchor="middle">
                {percent}%
              </SvgText>
            </Svg>
          </Animated.View>
        </View>

        {/* Stats */}
        <View style={styles.statsColumn}>
          <StatItem label="Pil Seviyesi" value={`${percent}%`} color={color} />
          <StatItem label="Durum" value={stateLabel} color={isCharging ? "#30D158" : "#FFFFFF"} />
          <StatItem label="Guc" value={voltage && current ? `${voltage}V / ${current}mA / ${powerWatts}W` : "—"} color="#FFD60A" />
        </View>
      </View>

      {/* Comparison bars */}
      <View style={styles.compSection}>
        <View style={styles.compRow}>
          <Text style={styles.compLabel}>Cihazin</Text>
          <Text style={[styles.compValue, { color }]}>{percent}%</Text>
        </View>
        <View style={styles.barTrack}>
          <Animated.View style={[styles.barFill, { backgroundColor: color, transform: [{ scaleX: deviceBarWidth }] }]} />
        </View>

        <View style={[styles.compRow, { marginTop: 10 }]}>
          <Text style={styles.compLabel}>Simulasyon</Text>
          <Text style={[styles.compValue, { color: "#FFD60A" }]}>{simPercent.toFixed(1)}%</Text>
        </View>
        <View style={styles.barTrack}>
          <Animated.View style={[styles.barFill, { backgroundColor: "#FFD60A", transform: [{ scaleX: simBarWidth }] }]} />
        </View>

        <Text style={styles.diffText}>
          {diff > 0 ? `Cihaz %${diff.toFixed(0)} daha yuksek` : diff < 0 ? `Simulasyon %${Math.abs(diff).toFixed(0)} daha yuksek` : "Esit seviyede"}
        </Text>
      </View>
    </View>
  );
}

function StatItem({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={styles.statItem}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
    </View>
  );
}

export default memo(DeviceBatteryCard);

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#1C1C1E", borderRadius: 20, padding: 16, marginVertical: 6,
  },
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12,
  },
  headerTitle: { color: "rgba(235,235,245,0.6)", fontSize: 13, fontWeight: "600", letterSpacing: -0.3 }, // "Cihaz Pili"
  liveBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "rgba(48,209,88,0.12)", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#30D158" },
  liveText: { color: "#30D158", fontSize: 10, fontWeight: "700", letterSpacing: 0.5 },
  batteryRow: { flexDirection: "row", alignItems: "center", gap: 16 },
  batteryWrap: { alignItems: "center", justifyContent: "center" },
  lowPulseRing: {
    position: "absolute", width: 90, height: 150, borderRadius: 16, borderWidth: 2,
  },
  statsColumn: { flex: 1, gap: 8 },
  statItem: {
    backgroundColor: "#2C2C2E", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8,
  },
  statLabel: { color: "rgba(235,235,245,0.3)", fontSize: 11, letterSpacing: -0.2 },
  statValue: { fontSize: 16, fontWeight: "700", letterSpacing: -0.3, marginTop: 2 },
  compSection: { marginTop: 16, paddingTop: 16, borderTopWidth: 0.5, borderTopColor: "rgba(84,84,88,0.65)" },
  compRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  compLabel: { color: "rgba(235,235,245,0.6)", fontSize: 13, letterSpacing: -0.3 },
  compValue: { fontSize: 15, fontWeight: "700", letterSpacing: -0.3 },
  barTrack: {
    height: 6, backgroundColor: "#2C2C2E", borderRadius: 3, overflow: "hidden",
  },
  barFill: { height: 6, borderRadius: 3 },
  diffText: {
    color: "rgba(235,235,245,0.3)", fontSize: 12, letterSpacing: -0.2, marginTop: 8, textAlign: "center",
  },
});
