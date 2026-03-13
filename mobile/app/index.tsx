import React, { useState, useEffect, useRef } from "react";
import { ScrollView, View, StyleSheet, ActivityIndicator, Animated, TouchableOpacity } from "react-native";
import { Text } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import WeatherAnimation from "../components/WeatherAnimation";
import SunCycle from "../components/SunCycle";
import AnimatedBattery from "../components/AnimatedBattery";
import EnergyFlow from "../components/EnergyFlow";
import InfoDrawer, { DrawerContent } from "../components/InfoDrawer";
import { useSimulation } from "../hooks/useSimulation";

const CARD_INFO: Record<string, DrawerContent> = {
  solar: {
    title: "Solar Power (P)",
    unit: "Watt (W)",
    formula: "P = V \u00D7 I",
    explanation: "G\u00fcne\u015f paneli, foton enerjisini elektrik enerjisine d\u00f6n\u00fc\u015ft\u00fcr\u00fcr. \u00dcretilen g\u00fc\u00e7, panel voltaj\u0131 (V) ile ak\u0131m\u0131n (I) \u00e7arp\u0131m\u0131na e\u015fittir. Bu projede 10W'l\u0131k panel, g\u00fcne\u015f a\u00e7\u0131s\u0131na ve hava ko\u015fullar\u0131na ba\u011fl\u0131 olarak 0\u201310W aras\u0131nda \u00fcretim yapar.",
    funFact: "1 Watt = 1 Joule/saniye enerji ak\u0131\u015f\u0131d\u0131r.",
  },
  battery: {
    title: "Batarya Kapasitesi",
    unit: "Watt-saat (Wh) / Y\u00fczde (%)",
    formula: "Wh = mAh \u00D7 V / 1000",
    explanation: "Lityum-iyon batarya, kimyasal enerjiyi elektriksel enerjiye d\u00f6n\u00fc\u015ft\u00fcr\u00fcr. Kapasite Wh cinsinden \u00f6l\u00e7\u00fcl\u00fcr. Bu sistemde 3.7V \u00d7 10000mAh = 37Wh kapasiteli batarya kullan\u0131lmaktad\u0131r. \u015earj seviyesi %5 alt\u0131na d\u00fc\u015fmez, %95 \u00fczerine \u00e7\u0131kmaz (batarya \u00f6mr\u00fc korumas\u0131).",
    funFact: "Tam dolu batarya, bir ak\u0131ll\u0131 telefonu yakla\u015f\u0131k 2.5 kez \u015farj edebilir.",
  },
  consumption: {
    title: "G\u00fc\u00e7 T\u00fcketimi (P)",
    unit: "Watt (W)",
    formula: "P = 5V \u00D7 1A = 5W",
    explanation: "USB standartlar\u0131na g\u00f6re telefon \u015farj\u0131 5V gerilimde 1A ak\u0131m \u00e7eker. Boost converter %85 verimle \u00e7al\u0131\u015ft\u0131\u011f\u0131ndan bataryadan asl\u0131nda 5W\u00f70.85=5.88W \u00e7ekilir. Bu kay\u0131p \u0131s\u0131ya d\u00f6n\u00fc\u015f\u00fcr.",
    funFact: "USB-A standart \u00e7\u0131k\u0131\u015f\u0131 maksimum 5W (5V\u00d71A) sa\u011flar.",
  },
  net: {
    title: "Net G\u00fc\u00e7",
    unit: "Watt (W)",
    formula: "P_net = P_\u00fcretim - P_t\u00fcketim",
    explanation: "Pozitif de\u011fer: panel t\u00fcketime yetip bataryay\u0131 da \u015farj ediyor. Negatif de\u011fer: \u00fcretim yetersiz, bataryadan \u00e7ekiliyor. S\u0131f\u0131r: tam denge noktas\u0131.",
    funFact: "Enerji korunumu yasas\u0131: enerji yarat\u0131lamaz, yaln\u0131zca d\u00f6n\u00fc\u015ft\u00fcr\u00fcl\u00fcr.",
  },
  efficiency: {
    title: "Sistem Verimlili\u011fi (\u03B7)",
    unit: "Y\u00fczde (%)",
    formula: "\u03B7 = (P_\u00e7\u0131k\u0131\u015f / P_giri\u015f) \u00D7 100",
    explanation: "Boost converter (DC-DC y\u00fckseltici), 3.7V batarya gerilimini 5V USB \u00e7\u0131k\u0131\u015f\u0131na y\u00fckseltirken enerji kaybeder. %85 verimlilik, her 100J'den 85J'nin kullan\u0131\u015fl\u0131 \u00e7\u0131k\u0131\u015fa d\u00f6n\u00fc\u015ft\u00fc\u011f\u00fc anlam\u0131na gelir.",
    funFact: "\u0130deal (kay\u0131ps\u0131z) d\u00f6n\u00fc\u015f\u00fcm teorik olarak m\u00fcmk\u00fcn de\u011fildir.",
  },
};

function FadeIn({ delay = 0, children }: { delay?: number; children: React.ReactNode }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.spring(opacity, { toValue: 1, tension: 60, friction: 10, delay, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, tension: 60, friction: 10, delay, useNativeDriver: true }),
    ]).start();
  }, [opacity, translateY, delay]);
  return <Animated.View style={{ opacity, transform: [{ translateY }] }}>{children}</Animated.View>;
}

function TappableStatCard({ value, unit, label, color, infoKey, onPress }: {
  value: string; unit: string; label: string; color: string; infoKey: string;
  onPress: (key: string) => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  return (
    <Animated.View style={[styles.statCard, { transform: [{ scale }] }]}>
      <TouchableOpacity
        activeOpacity={0.8}
        onPressIn={() => Animated.spring(scale, { toValue: 0.96, tension: 200, friction: 10, useNativeDriver: true }).start()}
        onPressOut={() => Animated.spring(scale, { toValue: 1, tension: 200, friction: 10, useNativeDriver: true }).start()}
        onPress={() => onPress(infoKey)}
      >
        <View style={styles.statCardInner}>
          <Text style={styles.infoIcon}>{"\u24D8"}</Text>
          <Text style={[styles.statValue, { color }]}>
            {value}<Text style={styles.statUnit}>{unit}</Text>
          </Text>
          <Text style={styles.statLabel}>{label}</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function DashboardScreen() {
  const { status, error, loading } = useSimulation();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [drawerContent, setDrawerContent] = useState<DrawerContent | null>(null);

  const openInfo = (key: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setDrawerContent(CARD_INFO[key]);
    setDrawerVisible(true);
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#FFD60A" />
        <Text style={styles.loadingText}>Connecting...</Text>
      </SafeAreaView>
    );
  }

  if (error || !status) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <Text style={{ fontSize: 48 }}>{"\uD83D\uDCF6"}</Text>
        <Text style={styles.errorTitle}>Connection Error</Text>
        <Text style={styles.errorDetail}>{error || "No data"}</Text>
      </SafeAreaView>
    );
  }

  const netColor = status.net_power >= 0 ? "#30D158" : "#FF453A";
  const weatherLabel =
    status.weather === "sunny" ? "Sunny" :
    status.weather === "partly_cloudy" ? "Partly Cloudy" :
    status.weather === "cloudy" ? "Cloudy" : "Night";

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} bounces>
        <FadeIn delay={0}>
          <View style={styles.header}>
            <Text style={styles.largeTitle}>Solar Station</Text>
            <Text style={styles.timeText}>{status.time}</Text>
          </View>
        </FadeIn>

        <FadeIn delay={80}>
          <View style={styles.weatherPillRow}>
            <View style={styles.weatherPill}>
              <WeatherAnimation weather={status.weather} size={28} />
              <Text style={styles.weatherPillText}>{weatherLabel}</Text>
            </View>
          </View>
        </FadeIn>

        <FadeIn delay={160}>
          <View style={styles.card}>
            <SunCycle time={status.time} />
          </View>
        </FadeIn>

        <FadeIn delay={240}>
          <EnergyFlow
            netPower={status.net_power}
            solarWatts={status.solar_watts}
            phoneConnected={status.phone_connected}
          />
        </FadeIn>

        <FadeIn delay={320}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => openInfo("battery")}
            style={styles.card}
          >
            <View style={styles.batteryCardHeader}>
              <Text style={styles.cardLabel}>Batarya</Text>
              <Text style={styles.infoIcon}>{"\u24D8"}</Text>
            </View>
            <AnimatedBattery percent={status.battery_percent} chargingStatus={status.charging_status} />
          </TouchableOpacity>
        </FadeIn>

        <FadeIn delay={400}>
          <View style={styles.statsRow}>
            <TappableStatCard value={status.solar_watts.toFixed(1)} unit="W" label="Solar" color="#FFD60A" infoKey="solar" onPress={openInfo} />
            <TappableStatCard value={status.consumption_watts.toFixed(1)} unit="W" label="Load" color="#0A84FF" infoKey="consumption" onPress={openInfo} />
            <TappableStatCard value={status.net_power.toFixed(1)} unit="W" label="Net" color={netColor} infoKey="net" onPress={openInfo} />
          </View>
        </FadeIn>

        <FadeIn delay={480}>
          <TouchableOpacity onPress={() => openInfo("efficiency")} activeOpacity={0.8}>
            <View style={styles.efficiencyRow}>
              <View style={styles.efficiencyLeft}>
                <Text style={styles.effLabel}>Verimlilik</Text>
                <Text style={styles.effValue}>{status.efficiency}%</Text>
              </View>
              <View style={styles.efficiencyRight}>
                <Text style={styles.effLabel}>Batarya</Text>
                <Text style={styles.effValue}>{status.battery_wh.toFixed(1)} Wh</Text>
              </View>
              <Text style={styles.infoIconSmall}>{"\u24D8"}</Text>
            </View>
          </TouchableOpacity>
        </FadeIn>
      </ScrollView>

      <InfoDrawer visible={drawerVisible} content={drawerContent} onClose={() => setDrawerVisible(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000000" },
  center: { justifyContent: "center", alignItems: "center" },
  content: { paddingHorizontal: 16, paddingBottom: 32 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 16, marginTop: 8 },
  largeTitle: { color: "#FFFFFF", fontSize: 34, fontWeight: "700", letterSpacing: -0.5 },
  timeText: { color: "rgba(235,235,245,0.6)", fontSize: 17, fontWeight: "600", letterSpacing: -0.3 },
  weatherPillRow: { alignItems: "center", marginBottom: 12 },
  weatherPill: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "#3A3A3C", paddingHorizontal: 16, paddingVertical: 6,
    borderRadius: 18, height: 36,
  },
  weatherPillText: { color: "#FFFFFF", fontSize: 15, fontWeight: "500", letterSpacing: -0.3 },
  card: { backgroundColor: "#1C1C1E", borderRadius: 20, padding: 16, marginVertical: 6 },
  batteryCardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  cardLabel: { color: "rgba(235,235,245,0.6)", fontSize: 13, fontWeight: "600", letterSpacing: -0.3 },
  statsRow: { flexDirection: "row", gap: 8, marginTop: 8 },
  statCard: { flex: 1 },
  statCardInner: {
    backgroundColor: "#1C1C1E", borderRadius: 12,
    paddingVertical: 16, paddingHorizontal: 10, alignItems: "center",
  },
  statValue: { fontSize: 22, fontWeight: "700", letterSpacing: -0.5 },
  statUnit: { fontSize: 14, fontWeight: "400" },
  statLabel: { color: "rgba(235,235,245,0.3)", fontSize: 12, marginTop: 4, letterSpacing: -0.3 },
  infoIcon: { color: "rgba(235,235,245,0.2)", fontSize: 12, position: "absolute", top: 6, right: 8 },
  infoIconSmall: { color: "rgba(235,235,245,0.2)", fontSize: 12 },
  efficiencyRow: {
    flexDirection: "row", backgroundColor: "#1C1C1E", borderRadius: 12,
    padding: 16, marginTop: 8, alignItems: "center",
  },
  efficiencyLeft: { flex: 1 },
  efficiencyRight: { flex: 1 },
  effLabel: { color: "rgba(235,235,245,0.3)", fontSize: 12, letterSpacing: -0.3 },
  effValue: { color: "#FFFFFF", fontSize: 20, fontWeight: "700", letterSpacing: -0.5, marginTop: 2 },
  loadingText: { color: "rgba(235,235,245,0.6)", marginTop: 12, fontSize: 15 },
  errorTitle: { color: "#FF453A", fontSize: 20, fontWeight: "700", marginTop: 16 },
  errorDetail: { color: "rgba(235,235,245,0.3)", fontSize: 15, marginTop: 4 },
});
