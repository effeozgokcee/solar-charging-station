import React, { useEffect, useRef } from "react";
import { ScrollView, View, StyleSheet, Animated, Easing } from "react-native";
import { Text } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Rect, Path, Circle, Defs, LinearGradient, Stop, Text as SvgText } from "react-native-svg";
import { useDeviceBattery } from "../hooks/useDeviceBattery";
import { useSimulation } from "../hooks/useSimulation";

const AnimatedRect = Animated.createAnimatedComponent(Rect);

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

function getColor(p: number): string {
  if (p > 60) return "#30D158";
  if (p > 20) return "#FF9F0A";
  return "#FF453A";
}

function HeroBattery({ percent, isCharging, isLow }: { percent: number; isCharging: boolean; isLow: boolean }) {
  const fillAnim = useRef(new Animated.Value(percent)).current;
  const pulseScale = useRef(new Animated.Value(1)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;
  const lowPulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fillAnim, {
      toValue: percent,
      duration: 600,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [percent, fillAnim]);

  useEffect(() => {
    if (isCharging) {
      const pulse = Animated.loop(Animated.sequence([
        Animated.timing(pulseScale, { toValue: 0.96, duration: 1200, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
        Animated.timing(pulseScale, { toValue: 1, duration: 1200, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
      ]));
      const glow = Animated.loop(Animated.sequence([
        Animated.timing(glowOpacity, { toValue: 0.6, duration: 1400, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
        Animated.timing(glowOpacity, { toValue: 0.1, duration: 1400, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
      ]));
      pulse.start(); glow.start();
      return () => { pulse.stop(); glow.stop(); };
    } else {
      pulseScale.setValue(1);
      glowOpacity.setValue(0);
    }
  }, [isCharging, pulseScale, glowOpacity]);

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
  const bw = 120, bh = 200;
  const bx = 18, by = 26;
  const bW = bw - 36, bH = bh - 40;
  const tipW = 30, tipH = 12;
  const pad = 5;
  const maxFill = bH - pad * 2;

  const fillH = fillAnim.interpolate({ inputRange: [0, 100], outputRange: [0, maxFill], extrapolate: "clamp" });
  const fillY = fillAnim.interpolate({ inputRange: [0, 100], outputRange: [by + bH - pad, by + pad], extrapolate: "clamp" });

  return (
    <View style={styles.heroWrap}>
      {isLow && (
        <Animated.View style={[styles.lowRing, { opacity: lowPulse, borderColor: "#FF453A" }]} />
      )}
      {isCharging && (
        <Animated.View style={[styles.glowRing, { opacity: glowOpacity, borderColor: color }]} />
      )}
      <Animated.View style={{ transform: [{ scale: pulseScale }] }}>
        <Svg width={bw} height={bh}>
          <Defs>
            <LinearGradient id="heroFill" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={color} stopOpacity="0.9" />
              <Stop offset="1" stopColor={color} stopOpacity="0.5" />
            </LinearGradient>
          </Defs>
          <Rect x={(bw - tipW) / 2} y={by - tipH + 3} width={tipW} height={tipH} rx={4} fill="#3A3A3C" />
          <Rect x={bx} y={by} width={bW} height={bH} rx={12} fill="none" stroke="#3A3A3C" strokeWidth={2.5} />
          <AnimatedRect x={bx + pad} y={fillY} width={bW - pad * 2} height={fillH} rx={8} fill="url(#heroFill)" />
          {isCharging && (
            <Path d="M 56 70 L 46 100 L 56 100 L 50 130 L 70 90 L 60 90 L 66 70 Z" fill="rgba(255,255,255,0.85)" />
          )}
          <SvgText x={bw / 2} y={isCharging ? by + bH / 2 + 36 : by + bH / 2 + 8}
            fill="#FFFFFF" fontSize={22} fontWeight="700" textAnchor="middle" letterSpacing={-0.5}>
            {percent}%
          </SvgText>
        </Svg>
      </Animated.View>
    </View>
  );
}

export default function DeviceScreen() {
  const battery = useDeviceBattery();
  const { status } = useSimulation();

  const color = getColor(battery.percent);
  const simPercent = status?.battery_percent ?? 0;
  const diff = battery.percent - simPercent;

  const deviceBarScale = useRef(new Animated.Value(0)).current;
  const simBarScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(deviceBarScale, {
      toValue: battery.percent / 100,
      duration: 600,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [battery.percent, deviceBarScale]);

  useEffect(() => {
    Animated.timing(simBarScale, {
      toValue: simPercent / 100,
      duration: 600,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [simPercent, simBarScale]);

  if (battery.error) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <Text style={{ fontSize: 48 }}>{"\uD83D\uDD0B"}</Text>
        <Text style={styles.errorTitle}>Pil Bilgisi Alinamadi</Text>
        <Text style={styles.errorSub}>{battery.error}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} bounces>
        <FadeIn delay={0}>
          <View style={styles.header}>
            <Text style={styles.largeTitle}>Cihaz Pili</Text>
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>CANLI</Text>
            </View>
          </View>
        </FadeIn>

        {/* Hero battery */}
        <FadeIn delay={80}>
          <View style={styles.heroCard}>
            <HeroBattery percent={battery.percent} isCharging={battery.isCharging} isLow={battery.isLow} />
            <View style={[styles.statusBadge, {
              backgroundColor: battery.isCharging ? "rgba(48,209,88,0.15)" :
                battery.isLow ? "rgba(255,69,58,0.15)" : "rgba(142,142,147,0.1)",
            }]}>
              <Text style={[styles.statusText, {
                color: battery.isCharging ? "#30D158" : battery.isLow ? "#FF453A" : "rgba(235,235,245,0.3)",
              }]}>
                {battery.stateLabel}
              </Text>
            </View>
          </View>
        </FadeIn>

        {/* Stats grid */}
        <FadeIn delay={160}>
          <View style={styles.statsGrid}>
            <StatCard label="Pil Seviyesi" value={`${battery.percent}%`} color={color} />
            <StatCard label="Durum" value={battery.stateLabel} color={battery.isCharging ? "#30D158" : "#FFFFFF"} />
            <StatCard label="Dusuk Pil" value={battery.isLow ? "Evet" : "Hayir"} color={battery.isLow ? "#FF453A" : "#30D158"} />
            <StatCard label="Guc Tasarrufu" value={battery.lowPowerMode ? "Acik" : "Kapali"} color={battery.lowPowerMode ? "#FF9F0A" : "rgba(235,235,245,0.4)"} />
          </View>
        </FadeIn>

        {/* Comparison */}
        <FadeIn delay={240}>
          <View style={styles.compCard}>
            <Text style={styles.compTitle}>Karsilastirma</Text>

            <View style={styles.compRow}>
              <Text style={styles.compLabel}>Cihazin</Text>
              <Text style={[styles.compValue, { color }]}>{battery.percent}%</Text>
            </View>
            <View style={styles.barTrack}>
              <Animated.View style={[styles.barFill, { backgroundColor: color, transform: [{ scaleX: deviceBarScale }] }]} />
            </View>

            <View style={[styles.compRow, { marginTop: 12 }]}>
              <Text style={styles.compLabel}>Simulasyon Bataryasi</Text>
              <Text style={[styles.compValue, { color: "#FFD60A" }]}>{simPercent.toFixed(1)}%</Text>
            </View>
            <View style={styles.barTrack}>
              <Animated.View style={[styles.barFill, { backgroundColor: "#FFD60A", transform: [{ scaleX: simBarScale }] }]} />
            </View>

            <Text style={styles.diffText}>
              {diff > 0 ? `Cihaz simulasyondan %${diff.toFixed(0)} daha yuksek`
                : diff < 0 ? `Simulasyon cihazdan %${Math.abs(diff).toFixed(0)} daha yuksek`
                : "Esit seviyede"}
            </Text>
          </View>
        </FadeIn>

        {/* Last updated */}
        <FadeIn delay={320}>
          <Text style={styles.updatedText}>
            Son guncelleme: {battery.lastUpdated.toLocaleTimeString()}
          </Text>
        </FadeIn>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000000" },
  center: { justifyContent: "center", alignItems: "center" },
  content: { paddingHorizontal: 16, paddingBottom: 32 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 8, marginBottom: 16 },
  largeTitle: { color: "#FFFFFF", fontSize: 34, fontWeight: "700", letterSpacing: -0.5 },
  liveBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "rgba(48,209,88,0.12)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#30D158" },
  liveText: { color: "#30D158", fontSize: 11, fontWeight: "700", letterSpacing: 0.5 },
  heroCard: {
    backgroundColor: "#1C1C1E", borderRadius: 20, padding: 20, alignItems: "center", marginBottom: 8,
  },
  heroWrap: { alignItems: "center", justifyContent: "center" },
  glowRing: {
    position: "absolute", width: 140, height: 220, borderRadius: 24, borderWidth: 1.5,
  },
  lowRing: {
    position: "absolute", width: 140, height: 220, borderRadius: 24, borderWidth: 2,
  },
  statusBadge: {
    marginTop: 12, paddingHorizontal: 16, paddingVertical: 6, borderRadius: 14,
  },
  statusText: { fontSize: 13, fontWeight: "600", letterSpacing: -0.3 },
  statsGrid: {
    flexDirection: "row", flexWrap: "wrap", gap: 8, marginVertical: 8,
  },
  statCard: {
    width: "48%", backgroundColor: "#1C1C1E", borderRadius: 12,
    paddingVertical: 14, paddingHorizontal: 12, minHeight: 44,
    flexGrow: 1,
  },
  statLabel: { color: "rgba(235,235,245,0.3)", fontSize: 12, letterSpacing: -0.3 },
  statValue: { fontSize: 20, fontWeight: "700", letterSpacing: -0.5, marginTop: 4 },
  compCard: {
    backgroundColor: "#1C1C1E", borderRadius: 20, padding: 16, marginTop: 8,
  },
  compTitle: { color: "rgba(235,235,245,0.6)", fontSize: 13, fontWeight: "600", letterSpacing: -0.3, marginBottom: 16 },
  compRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  compLabel: { color: "rgba(235,235,245,0.6)", fontSize: 14, letterSpacing: -0.3 },
  compValue: { fontSize: 17, fontWeight: "700", letterSpacing: -0.3 },
  barTrack: { height: 8, backgroundColor: "#2C2C2E", borderRadius: 4, overflow: "hidden" },
  barFill: { height: 8, borderRadius: 4, transformOrigin: "left" },
  diffText: {
    color: "rgba(235,235,245,0.3)", fontSize: 13, letterSpacing: -0.3, marginTop: 12, textAlign: "center",
  },
  updatedText: {
    color: "rgba(235,235,245,0.2)", fontSize: 12, letterSpacing: -0.2, textAlign: "center", marginTop: 16,
  },
  errorTitle: { color: "#FF453A", fontSize: 20, fontWeight: "700", marginTop: 16 },
  errorSub: { color: "rgba(235,235,245,0.3)", fontSize: 15, marginTop: 4 },
});
