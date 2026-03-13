import React, { useEffect, useRef, memo } from "react";
import { View, Animated, StyleSheet, Easing, TouchableOpacity } from "react-native";
import { Text } from "react-native-paper";
import Svg, { Circle, Line as SvgLine, Polygon } from "react-native-svg";
import * as Haptics from "expo-haptics";
import { SimulationStatus } from "../hooks/useSimulation";
import { DrawerContent } from "./InfoDrawer";

interface Props {
  status: SimulationStatus;
  onNodePress: (content: DrawerContent) => void;
}

const NODES = [
  { key: "panel", icon: "\u2600\uFE0F", label: "Panel", color: "#FFD60A" },
  { key: "charger", icon: "\u26A1", label: "Sarj Devresi", color: "#FF9F0A" },
  { key: "battery", icon: "\uD83D\uDD0B", label: "Batarya", color: "#30D158" },
  { key: "boost", icon: "\uD83D\uDD3C", label: "Boost", color: "#0A84FF" },
  { key: "usb", icon: "\uD83D\uDD0C", label: "USB", color: "#BF5AF2" },
];

const NODE_INFO: Record<string, DrawerContent> = {
  panel: {
    title: "Fotovoltaik Panel",
    unit: "Watt (W)",
    formula: "P = \u03B7 \u00D7 A \u00D7 G",
    explanation: "\u03B7=verimlilik, A=panel alan\u0131 (m\u00B2), G=g\u00FCne\u015F \u0131\u015F\u0131mas\u0131 (W/m\u00B2). Monokristal silikon h\u00FCcreler %15-22 verimle \u00E7al\u0131\u015F\u0131r. Bu sistemde 10W, 6-12V \u00E7\u0131k\u0131\u015Fl\u0131 panel kullan\u0131lmaktad\u0131r.",
    funFact: "D\u00FCnya \u00FCzerinde bir saatlik g\u00FCne\u015F enerjisi, t\u00FCm insanl\u0131\u011F\u0131n bir y\u0131ll\u0131k enerji ihtiyac\u0131n\u0131 kar\u015F\u0131layabilir.",
  },
  charger: {
    title: "\u015Earj Kontrol Devresi (CC/CV)",
    unit: "miliamper (mA)",
    formula: "Faz 1: I=sabit, Faz 2: V=sabit",
    explanation: "Sabit Ak\u0131m (CC) faz\u0131nda batarya h\u0131zla \u015Farj edilir. %80 dolunca Sabit Gerilim (CV) faz\u0131na ge\u00E7ilir, ak\u0131m yava\u015F\u00E7a d\u00FC\u015Fer. Bu y\u00F6ntem lityum-iyon bataryan\u0131n \u00F6mr\u00FCn\u00FC uzat\u0131r.",
    funFact: "CC/CV y\u00F6ntemi, lityum-iyon batarya \u015Farj\u0131n\u0131n alt\u0131n standard\u0131d\u0131r.",
  },
  battery: {
    title: "Lityum-\u0130yon Batarya",
    unit: "Watt-saat (Wh)",
    formula: "E = Q \u00D7 V = C \u00D7 V\u00B2 / 2",
    explanation: "Li-ion batarya 3.6-4.2V aras\u0131nda \u00E7al\u0131\u015F\u0131r. Nominal gerilim 3.7V'tur. 10000mAh kapasite = 37Wh enerji depolama. %20 alt\u0131 ve %95 \u00FCst\u00FC \u015Farj seviyelerinden ka\u00E7\u0131n\u0131l\u0131r (\u00F6m\u00FCr korumas\u0131).",
    funFact: "Tam dolu batarya, bir ak\u0131ll\u0131 telefonu yakla\u015F\u0131k 2.5 kez \u015Farj edebilir.",
  },
  boost: {
    title: "DC-DC Boost Converter",
    unit: "Y\u00FCzde (%)",
    formula: "V_out = V_in / (1 - D)",
    explanation: "D = duty cycle (0-1 aras\u0131). 3.7V giri\u015Fi 5V \u00E7\u0131k\u0131\u015Fa y\u00FCkseltmek i\u00E7in D\u22480.26 gerekir. Anahtarlamal\u0131 g\u00FC\u00E7 kayna\u011F\u0131 prensibiyle \u00E7al\u0131\u015F\u0131r. %85 verimlilik end\u00FCstri standard\u0131d\u0131r.",
    funFact: "\u0130deal (kay\u0131ps\u0131z) d\u00F6n\u00FC\u015F\u00FCm teorik olarak m\u00FCmk\u00FCn de\u011Fildir (termodinamik 2. yasa).",
  },
  usb: {
    title: "USB-A G\u00FC\u00E7 \u00C7\u0131k\u0131\u015F\u0131",
    unit: "Volt (V) / miliamper (mA)",
    formula: "P = V \u00D7 I = 5V \u00D7 1A = 5W",
    explanation: "USB 2.0 standard\u0131 maksimum 500mA (2.5W) sa\u011Flar. USB \u015Farj spesifikasyonu (CDP) 1.5A'e kadar izin verir. 5V sabit gerilim t\u00FCm USB cihazlarla uyumludur.",
    funFact: "USB-C Power Delivery ile 240W'a kadar g\u00FC\u00E7 aktar\u0131m\u0131 m\u00FCmk\u00FCnd\u00FCr.",
  },
};

function CircuitDiagram({ status, onNodePress }: Props) {
  const dashAnim = useRef(new Animated.Value(0)).current;
  const isFlowing = status.solar_watts > 0.1 || status.phone_connected;

  useEffect(() => {
    if (isFlowing) {
      const speed = Math.max(800, 3000 - (status.solar_watts / 10) * 2200);
      const anim = Animated.loop(
        Animated.timing(dashAnim, { toValue: 20, duration: speed, easing: Easing.linear, useNativeDriver: false })
      );
      anim.start();
      return () => anim.stop();
    } else {
      dashAnim.setValue(0);
    }
  }, [isFlowing, status.solar_watts, dashAnim]);

  const chargeCurrent = status.solar_watts > 0 ? ((status.solar_watts * 0.9 / 3.7) * 1000) : 0;
  const usbCurrent = status.phone_connected ? 1000 : 0;

  const nodeValues = [
    `${status.solar_watts.toFixed(1)} W`,
    `${chargeCurrent.toFixed(0)} mA`,
    `${status.battery_percent.toFixed(0)}% / ${status.battery_wh.toFixed(1)}Wh`,
    `\u03B7=${status.efficiency}%`,
    `5.0V / ${usbCurrent} mA`,
  ];

  const nodeW = 64;
  const gap = 12;
  const totalW = NODES.length * nodeW + (NODES.length - 1) * gap;
  const startX = 0;

  return (
    <View style={styles.container}>
      <Svg width={totalW} height={60}>
        {NODES.map((n, i) => {
          if (i === NODES.length - 1) return null;
          const x1 = startX + i * (nodeW + gap) + nodeW;
          const x2 = startX + (i + 1) * (nodeW + gap);
          const y = 26;
          const active = i < 2 ? status.solar_watts > 0.1 : status.phone_connected;
          const col = active ? "#FFD60A" : "#3A3A3C";
          return (
            <React.Fragment key={`line-${i}`}>
              <SvgLine x1={x1 + 2} y1={y} x2={x2 - 2} y2={y}
                stroke={col} strokeWidth={2} strokeDasharray="4,4" opacity={0.6} />
              <Polygon
                points={`${x2 - 6},${y - 4} ${x2 - 1},${y} ${x2 - 6},${y + 4}`}
                fill={col} opacity={0.6}
              />
            </React.Fragment>
          );
        })}
      </Svg>

      <View style={styles.nodesRow}>
        {NODES.map((node, i) => {
          const isActive =
            i === 0 ? status.solar_watts > 0.1 :
            i === 4 ? status.phone_connected :
            (status.solar_watts > 0.1 || status.phone_connected);

          return (
            <TouchableOpacity
              key={node.key}
              style={[styles.nodeWrap, { width: nodeW }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onNodePress(NODE_INFO[node.key]);
              }}
              activeOpacity={0.7}
            >
              <View style={[styles.nodeCircle, {
                borderColor: isActive ? node.color : "#3A3A3C",
                opacity: isActive ? 1 : 0.4,
              }]}>
                <Text style={styles.nodeIcon}>{node.icon}</Text>
              </View>
              <Text style={styles.nodeLabel} numberOfLines={1}>{node.label}</Text>
              <Text style={[styles.nodeValue, { color: isActive ? "rgba(235,235,245,0.85)" : "rgba(235,235,245,0.3)" }]}
                numberOfLines={1}>
                {nodeValues[i]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export default memo(CircuitDiagram);

const styles = StyleSheet.create({
  container: { paddingVertical: 8 },
  nodesRow: { flexDirection: "row", justifyContent: "space-between", marginTop: -34 },
  nodeWrap: { alignItems: "center" },
  nodeCircle: {
    width: 52, height: 52, borderRadius: 26, backgroundColor: "#2C2C2E",
    borderWidth: 2, justifyContent: "center", alignItems: "center",
  },
  nodeIcon: { fontSize: 22 },
  nodeLabel: { color: "rgba(235,235,245,0.6)", fontSize: 9, fontWeight: "500", marginTop: 4, textAlign: "center", letterSpacing: -0.2 },
  nodeValue: { fontSize: 8, fontWeight: "600", marginTop: 2, textAlign: "center", letterSpacing: -0.2 },
});
