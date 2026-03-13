import React, { useState, useEffect, useRef } from "react";
import { ScrollView, View, StyleSheet, ActivityIndicator, Animated, Easing } from "react-native";
import { Text } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import StationIllustration from "../components/StationIllustration";
import CircuitDiagram from "../components/CircuitDiagram";
import InfoDrawer, { DrawerContent } from "../components/InfoDrawer";
import { useSimulation } from "../hooks/useSimulation";

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

const LEGEND_ITEMS = [
  { color: "#FFD60A", label: "G\u00fc\u00e7 Ak\u0131\u015f\u0131" },
  { color: "#0A84FF", label: "Veri Ak\u0131\u015f\u0131" },
  { color: "#3A3A3C", label: "Aktif De\u011fil" },
];

export default function SystemScreen() {
  const { status, error, loading } = useSimulation();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [drawerContent, setDrawerContent] = useState<DrawerContent | null>(null);

  // Gesture hint auto-fade
  const hintOpacity = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.timing(hintOpacity, { toValue: 0, duration: 600, useNativeDriver: true }).start();
    }, 3000);
    return () => clearTimeout(timer);
  }, [hintOpacity]);

  // Station breathing animation
  const breathe = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const anim = Animated.loop(Animated.sequence([
      Animated.timing(breathe, { toValue: 1.02, duration: 2000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(breathe, { toValue: 1, duration: 2000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]));
    anim.start();
    return () => anim.stop();
  }, [breathe]);

  const openDrawer = (content: DrawerContent) => {
    setDrawerContent(content);
    setDrawerVisible(true);
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#FFD60A" />
      </SafeAreaView>
    );
  }

  if (error || !status) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <Text style={{ fontSize: 48 }}>{"\u26A1"}</Text>
        <Text style={styles.errorText}>Baglanti Hatasi</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} bounces>
        <FadeIn delay={0}>
          <Text style={styles.largeTitle}>Sistem Semasi</Text>
          <Text style={styles.subtitle}>S\u00fcr\u00fckle {"\u2022"} Yak\u0131nla\u015ft\u0131r {"\u2022"} D\u00f6nd\u00fcr {"\u2022"} \u00c7ift dokun</Text>
        </FadeIn>

        <FadeIn delay={80}>
          <Animated.View style={[styles.illustrationCard, { transform: [{ scale: breathe }] }]}>
            <StationIllustration
              batteryPercent={status.battery_percent}
              chargingStatus={status.charging_status}
              solarWatts={status.solar_watts}
              phoneConnected={status.phone_connected}
            />
          </Animated.View>
        </FadeIn>

        <FadeIn delay={160}>
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>Devre Ak\u0131\u015f Semas\u0131</Text>
            <View style={styles.dividerLine} />
          </View>
        </FadeIn>

        <FadeIn delay={200}>
          <Animated.View style={[styles.gestureHint, { opacity: hintOpacity }]}>
            <Text style={styles.gestureHintText}>
              {"\uD83D\uDC46"} S\u00fcr\u00fckle {"\u2022"} {"\uD83E\uDD0F"} Yak\u0131nla\u015ft\u0131r {"\u2022"} {"\uD83D\uDD04"} D\u00f6nd\u00fcr {"\u2022"} {"\uD83D\uDC46\uD83D\uDC46"} Patlat
            </Text>
          </Animated.View>
        </FadeIn>

        <FadeIn delay={240}>
          <View style={styles.circuitCard}>
            <CircuitDiagram status={status} onNodePress={openDrawer} />
          </View>
        </FadeIn>

        <FadeIn delay={280}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.legendStrip} contentContainerStyle={styles.legendContent}>
            {LEGEND_ITEMS.map((item) => (
              <View key={item.label} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                <Text style={styles.legendLabel}>{item.label}</Text>
              </View>
            ))}
          </ScrollView>
        </FadeIn>

        <FadeIn delay={320}>
          <View style={styles.specCard}>
            <Text style={styles.specTitle}>Teknik Ozellikler</Text>
            <SpecRow label="Panel Gucu" value="10W (max)" />
            <SpecRow label="Batarya" value="10000mAh / 37Wh" />
            <SpecRow label="Batarya Gerilimi" value="3.7V nominal" />
            <SpecRow label="USB Cikis" value="5V / 1A (5W)" />
            <SpecRow label="Sarj Verimi" value="%90" />
            <SpecRow label="Boost Verimi" value="%85" />
            <SpecRow label="Koruma Araligi" value="%5 - %95" />
          </View>
        </FadeIn>

        <FadeIn delay={400}>
          <Text style={styles.hint}>Devre dugumlerine dokunarak detayli bilgi alin</Text>
        </FadeIn>

        <View style={{ height: 100 }} />
      </ScrollView>

      <InfoDrawer visible={drawerVisible} content={drawerContent} onClose={() => setDrawerVisible(false)} />
    </SafeAreaView>
  );
}

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.specRow}>
      <Text style={styles.specLabel}>{label}</Text>
      <Text style={styles.specValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000000" },
  center: { justifyContent: "center", alignItems: "center" },
  content: { paddingHorizontal: 16, paddingBottom: 32 },
  largeTitle: { color: "#FFFFFF", fontSize: 34, fontWeight: "700", letterSpacing: -0.5, marginTop: 8, marginBottom: 4 },
  subtitle: { color: "rgba(235,235,245,0.4)", fontSize: 13, fontWeight: "500", letterSpacing: -0.3, marginBottom: 16 },
  illustrationCard: {
    backgroundColor: "#1C1C1E", borderRadius: 20, padding: 16,
    alignItems: "center", marginBottom: 8,
  },
  dividerRow: { flexDirection: "row", alignItems: "center", marginVertical: 16, gap: 12 },
  dividerLine: { flex: 1, height: 0.5, backgroundColor: "rgba(84,84,88,0.65)" },
  dividerText: { color: "rgba(235,235,245,0.6)", fontSize: 13, fontWeight: "600", letterSpacing: -0.3 },
  gestureHint: {
    alignSelf: "center", backgroundColor: "rgba(255,214,10,0.1)",
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, marginBottom: 8,
  },
  gestureHintText: { color: "#FFD60A", fontSize: 11, fontWeight: "600", letterSpacing: -0.2 },
  circuitCard: {
    backgroundColor: "#1C1C1E", borderRadius: 20, padding: 16, marginBottom: 8,
  },
  legendStrip: { marginVertical: 8 },
  legendContent: { gap: 16, paddingHorizontal: 4 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendLabel: { color: "rgba(235,235,245,0.5)", fontSize: 12, fontWeight: "500", letterSpacing: -0.2 },
  specCard: {
    backgroundColor: "#1C1C1E", borderRadius: 12, overflow: "hidden", marginTop: 8,
  },
  specTitle: {
    color: "rgba(235,235,245,0.6)", fontSize: 13, fontWeight: "600",
    letterSpacing: -0.3, padding: 16, paddingBottom: 8,
  },
  specRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 12,
    borderTopWidth: 0.5, borderTopColor: "rgba(84,84,88,0.65)",
  },
  specLabel: { color: "#FFFFFF", fontSize: 15, letterSpacing: -0.3 },
  specValue: { color: "rgba(235,235,245,0.6)", fontSize: 15, letterSpacing: -0.3 },
  hint: {
    color: "rgba(235,235,245,0.3)", fontSize: 13, letterSpacing: -0.3,
    textAlign: "center", marginTop: 16,
  },
  errorText: { color: "#FF453A", fontSize: 17, fontWeight: "700", marginTop: 16 },
});
