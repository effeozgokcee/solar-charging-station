import React, { useEffect, useRef } from "react";
import { ScrollView, View, StyleSheet, Animated, Easing, Dimensions } from "react-native";
import { Text } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Rect, Path, Defs, LinearGradient, Stop, Text as SvgText, Polyline, Line as SvgLine, Circle } from "react-native-svg";
import { useDeviceBattery, BatterySnapshot } from "../hooks/useDeviceBattery";
import { useSimulation } from "../hooks/useSimulation";

const SCREEN_W = Dimensions.get("window").width;
const AnimatedRect = Animated.createAnimatedComponent(Rect);

function FadeIn({ delay = 0, children }: { delay?: number; children: React.ReactNode }) {
  const o = useRef(new Animated.Value(0)).current;
  const y = useRef(new Animated.Value(24)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.spring(o, { toValue: 1, tension: 50, friction: 10, delay, useNativeDriver: true }),
      Animated.spring(y, { toValue: 0, tension: 50, friction: 10, delay, useNativeDriver: true }),
    ]).start();
  }, [o, y, delay]);
  return <Animated.View style={{ opacity: o, transform: [{ translateY: y }] }}>{children}</Animated.View>;
}

function getColor(p: number): string {
  if (p > 60) return "#30D158";
  if (p > 20) return "#FF9F0A";
  return "#FF453A";
}

// --- Circular progress ring ---
function BatteryRing({ percent, isCharging, isLow }: { percent: number; isCharging: boolean; isLow: boolean }) {
  const pulseScale = useRef(new Animated.Value(1)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isCharging) {
      const pulse = Animated.loop(Animated.sequence([
        Animated.timing(pulseScale, { toValue: 1.03, duration: 1500, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
        Animated.timing(pulseScale, { toValue: 1, duration: 1500, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
      ]));
      const glow = Animated.loop(Animated.sequence([
        Animated.timing(glowOpacity, { toValue: 0.5, duration: 1400, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
        Animated.timing(glowOpacity, { toValue: 0.1, duration: 1400, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
      ]));
      pulse.start(); glow.start();
      return () => { pulse.stop(); glow.stop(); };
    } else { pulseScale.setValue(1); glowOpacity.setValue(0); }
  }, [isCharging, pulseScale, glowOpacity]);

  const color = getColor(percent);
  const size = 180;
  const cx = size / 2, cy = size / 2;
  const r = 72;
  const strokeW = 8;
  const circumference = 2 * Math.PI * r;
  const dashOffset = circumference * (1 - percent / 100);

  return (
    <View style={styles.ringWrap}>
      {isCharging && <Animated.View style={[styles.ringGlow, { opacity: glowOpacity, borderColor: color }]} />}
      <Animated.View style={{ transform: [{ scale: pulseScale }] }}>
        <Svg width={size} height={size}>
          {/* Background ring */}
          <Circle cx={cx} cy={cy} r={r} stroke="rgba(255,255,255,0.06)" strokeWidth={strokeW} fill="none" />
          {/* Progress ring */}
          <Circle cx={cx} cy={cy} r={r} stroke={color} strokeWidth={strokeW} fill="none"
            strokeLinecap="round" strokeDasharray={`${circumference}`} strokeDashoffset={dashOffset}
            transform={`rotate(-90 ${cx} ${cy})`} />
          {/* Center text */}
          <SvgText x={cx} y={cy - 8} fill="#FFFFFF" fontSize={42} fontWeight="800" textAnchor="middle">{percent}</SvgText>
          <SvgText x={cx} y={cy + 16} fill="rgba(235,235,245,0.4)" fontSize={16} fontWeight="500" textAnchor="middle">%</SvgText>
          {isCharging && (
            <Path d={`M ${cx + 2} ${cy + 26} l -4 8 h4 l -3 8 l 8 -10 h -4 l 3 -6 Z`} fill={color} />
          )}
        </Svg>
      </Animated.View>
    </View>
  );
}

// --- Sparkline chart ---
function BatteryChart({ history }: { history: BatterySnapshot[] }) {
  const chartW = SCREEN_W - 72;
  const chartH = 100;
  const padL = 0, padR = 0, padT = 8, padB = 4;
  const innerW = chartW - padL - padR;
  const innerH = chartH - padT - padB;

  if (history.length < 3) {
    return (
      <View style={[styles.chartWrap, { height: chartH, justifyContent: "center", alignItems: "center" }]}>
        <Text style={styles.chartEmpty}>Veri toplanıyor...</Text>
      </View>
    );
  }

  const minT = history[0].time;
  const maxT = history[history.length - 1].time;
  const tRange = Math.max(maxT - minT, 1000);
  const vals = history.map(s => s.percent);
  const minV = Math.max(0, Math.min(...vals) - 3);
  const maxV = Math.min(100, Math.max(...vals) + 3);
  const vRange = Math.max(maxV - minV, 1);

  const points = history.map(s => {
    const x = padL + ((s.time - minT) / tRange) * innerW;
    const y = padT + (1 - (s.percent - minV) / vRange) * innerH;
    return `${x},${y}`;
  }).join(" ");

  // Gradient area path
  const lastX = padL + innerW;
  const firstX = padL;
  const areaPoints = `${points} ${lastX},${chartH} ${firstX},${chartH}`;

  return (
    <View style={styles.chartWrap}>
      <Svg width={chartW} height={chartH}>
        <Defs>
          <LinearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#30D158" stopOpacity="0.2" />
            <Stop offset="1" stopColor="#30D158" stopOpacity="0" />
          </LinearGradient>
        </Defs>
        {/* Fill area */}
        <Polyline points={areaPoints} fill="url(#chartGrad)" />
        {/* Line */}
        <Polyline points={points} fill="none" stroke="#30D158" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        {/* Current dot */}
        {(() => {
          const last = history[history.length - 1];
          const x = padL + ((last.time - minT) / tRange) * innerW;
          const y = padT + (1 - (last.percent - minV) / vRange) * innerH;
          return (
            <>
              <Circle cx={x} cy={y} r={5} fill="#30D158" opacity={0.3} />
              <Circle cx={x} cy={y} r={3} fill="#30D158" />
            </>
          );
        })()}
      </Svg>
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
    Animated.timing(deviceBarScale, { toValue: battery.percent / 100, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [battery.percent, deviceBarScale]);

  useEffect(() => {
    Animated.timing(simBarScale, { toValue: simPercent / 100, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [simPercent, simBarScale]);

  if (battery.error) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <Svg width={48} height={48} viewBox="0 0 24 24">
          <Rect x={2} y={6} width={18} height={12} rx={2} stroke="#FF453A" strokeWidth={1.8} fill="none" />
          <SvgLine x1={7} y1={12} x2={15} y2={12} stroke="#FF453A" strokeWidth={2} strokeLinecap="round" />
        </Svg>
        <Text style={styles.errorTitle}>Pil Bilgisi Alinamadi</Text>
        <Text style={styles.errorSub}>{battery.error}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} bounces>
        {/* Header */}
        <FadeIn delay={0}>
          <View style={styles.header}>
            <Text style={styles.largeTitle}>Cihaz Pili</Text>
            <View style={styles.liveBadge}>
              <View style={styles.liveDotAnim} />
              <Text style={styles.liveText}>CANLI</Text>
            </View>
          </View>
        </FadeIn>

        {/* Hero ring */}
        <FadeIn delay={60}>
          <View style={styles.heroCard}>
            <BatteryRing percent={battery.percent} isCharging={battery.isCharging} isLow={battery.isLow} />
            <View style={[styles.statusChip, {
              backgroundColor: battery.isCharging ? "rgba(48,209,88,0.12)" :
                battery.isLow ? "rgba(255,69,58,0.12)" : "rgba(142,142,147,0.08)",
            }]}>
              <Text style={[styles.statusChipText, {
                color: battery.isCharging ? "#30D158" : battery.isLow ? "#FF453A" : "rgba(235,235,245,0.3)",
              }]}>{battery.stateLabel}</Text>
            </View>
          </View>
        </FadeIn>

        {/* Power metrics */}
        <FadeIn delay={120}>
          <View style={styles.metricsRow}>
            <MetricTile icon="V" value={`${battery.voltage}`} unit="V" label="Voltaj" color="#FFD60A" />
            <MetricTile icon="A" value={`${battery.current}`} unit="mA" label="Akim" color="#0A84FF" />
            <MetricTile icon="W" value={`${battery.powerWatts}`} unit="W" label="Guc" color="#BF5AF2" />
          </View>
        </FadeIn>

        {/* Rate + Low Power row */}
        <FadeIn delay={80}>
          <View style={styles.metricsRow}>
            <View style={[styles.metricWide, styles.card]}>
              <Text style={styles.metricWideLabel}>Sarj Hizi</Text>
              <Text style={[styles.metricWideValue, {
                color: battery.ratePerMinute > 0 ? "#30D158" : battery.ratePerMinute < 0 ? "#FF453A" : "rgba(235,235,245,0.4)",
              }]}>
                {battery.ratePerMinute > 0 ? "+" : ""}{battery.ratePerMinute.toFixed(2)}
                <Text style={styles.metricWideUnit}> %/dk</Text>
              </Text>
            </View>
            <View style={[styles.metricWide, styles.card]}>
              <Text style={styles.metricWideLabel}>Guc Tasarrufu</Text>
              <Text style={[styles.metricWideValue, {
                color: battery.lowPowerMode ? "#FF9F0A" : "rgba(235,235,245,0.4)",
              }]}>{battery.lowPowerMode ? "Acik" : "Kapali"}</Text>
            </View>
          </View>
        </FadeIn>

        {/* Live chart */}
        <FadeIn delay={100}>
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.sectionTitle}>Pil Gecmisi</Text>
              <Text style={styles.sectionSub}>{battery.history.length} veri noktasi</Text>
            </View>
            <BatteryChart history={battery.history} />
          </View>
        </FadeIn>

        {/* Comparison */}
        <FadeIn delay={120}>
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Karsilastirma</Text>
            <View style={{ marginTop: 12 }}>
              <View style={styles.compRow}>
                <Text style={styles.compLabel}>Cihaz</Text>
                <Text style={[styles.compValue, { color }]}>{battery.percent}%</Text>
              </View>
              <View style={styles.barTrack}>
                <Animated.View style={[styles.barFill, { backgroundColor: color, transform: [{ scaleX: deviceBarScale }] }]} />
              </View>
              <View style={[styles.compRow, { marginTop: 14 }]}>
                <Text style={styles.compLabel}>Simulasyon</Text>
                <Text style={[styles.compValue, { color: "#FFD60A" }]}>{simPercent.toFixed(1)}%</Text>
              </View>
              <View style={styles.barTrack}>
                <Animated.View style={[styles.barFill, { backgroundColor: "#FFD60A", transform: [{ scaleX: simBarScale }] }]} />
              </View>
              <Text style={styles.diffText}>
                {diff > 0 ? `Cihaz %${diff.toFixed(0)} daha yuksek`
                  : diff < 0 ? `Simulasyon %${Math.abs(diff).toFixed(0)} daha yuksek`
                  : "Esit seviyede"}
              </Text>
            </View>
          </View>
        </FadeIn>

        <FadeIn delay={140}>
          <Text style={styles.updatedText}>Son guncelleme: {battery.lastUpdated.toLocaleTimeString()}</Text>
        </FadeIn>

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function MetricTile({ icon, value, unit, label, color }: {
  icon: string; value: string; unit: string; label: string; color: string;
}) {
  return (
    <View style={[styles.metricTile, styles.card]}>
      <View style={[styles.metricIcon, { backgroundColor: `${color}15` }]}>
        <Text style={[styles.metricIconText, { color }]}>{icon}</Text>
      </View>
      <Text style={[styles.metricTileValue, { color }]}>{value}<Text style={styles.metricTileUnit}>{unit}</Text></Text>
      <Text style={styles.metricTileLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000000" },
  center: { justifyContent: "center", alignItems: "center" },
  content: { paddingHorizontal: 16, paddingBottom: 80 },
  // Header
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 8, marginBottom: 20 },
  largeTitle: { color: "#FFFFFF", fontSize: 32, fontWeight: "800", letterSpacing: -0.8 },
  liveBadge: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "rgba(48,209,88,0.1)", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12,
    borderWidth: 1, borderColor: "rgba(48,209,88,0.2)",
  },
  liveDotAnim: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#30D158" },
  liveText: { color: "#30D158", fontSize: 11, fontWeight: "700", letterSpacing: 0.5 },
  // Hero
  heroCard: {
    backgroundColor: "rgba(28,28,30,0.8)", borderRadius: 24, paddingVertical: 28, paddingHorizontal: 20,
    alignItems: "center", marginBottom: 12, borderWidth: 1, borderColor: "rgba(255,255,255,0.06)",
  },
  ringWrap: { alignItems: "center", justifyContent: "center" },
  ringGlow: { position: "absolute", width: 200, height: 200, borderRadius: 100, borderWidth: 2 },
  statusChip: { marginTop: 16, paddingHorizontal: 16, paddingVertical: 6, borderRadius: 12 },
  statusChipText: { fontSize: 13, fontWeight: "600", letterSpacing: -0.2 },
  // Card base
  card: {
    backgroundColor: "rgba(28,28,30,0.8)", borderRadius: 16, padding: 16, marginBottom: 10,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.06)",
  },
  cardHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  sectionTitle: { color: "rgba(235,235,245,0.5)", fontSize: 13, fontWeight: "600", letterSpacing: 0.3, textTransform: "uppercase" },
  sectionSub: { color: "rgba(235,235,245,0.2)", fontSize: 11 },
  // Metrics
  metricsRow: { flexDirection: "row", gap: 6, marginBottom: 0 },
  metricTile: { flex: 1, alignItems: "center", paddingVertical: 12, paddingHorizontal: 4 },
  metricIcon: { width: 28, height: 28, borderRadius: 8, alignItems: "center", justifyContent: "center", marginBottom: 6 },
  metricIconText: { fontSize: 14, fontWeight: "800" },
  metricTileValue: { fontSize: 17, fontWeight: "800", letterSpacing: -0.5 },
  metricTileUnit: { fontSize: 11, fontWeight: "400" },
  metricTileLabel: { color: "rgba(235,235,245,0.3)", fontSize: 10, marginTop: 4, fontWeight: "500" },
  metricWide: { flex: 1 },
  metricWideLabel: { color: "rgba(235,235,245,0.3)", fontSize: 11, fontWeight: "500", letterSpacing: 0.2, marginBottom: 6 },
  metricWideValue: { fontSize: 22, fontWeight: "800", letterSpacing: -0.5 },
  metricWideUnit: { fontSize: 12, fontWeight: "400" },
  // Chart
  chartWrap: { marginTop: 4 },
  chartEmpty: { color: "rgba(235,235,245,0.2)", fontSize: 13 },
  // Comparison
  compRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  compLabel: { color: "rgba(235,235,245,0.5)", fontSize: 14, fontWeight: "500" },
  compValue: { fontSize: 16, fontWeight: "700", letterSpacing: -0.3 },
  barTrack: { height: 6, backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden" },
  barFill: { height: 6, borderRadius: 3 },
  diffText: { color: "rgba(235,235,245,0.25)", fontSize: 12, marginTop: 12, textAlign: "center" },
  updatedText: { color: "rgba(235,235,245,0.15)", fontSize: 11, textAlign: "center", marginTop: 12 },
  errorTitle: { color: "#FF453A", fontSize: 20, fontWeight: "700", marginTop: 20 },
  errorSub: { color: "rgba(235,235,245,0.3)", fontSize: 15, marginTop: 6 },
});
