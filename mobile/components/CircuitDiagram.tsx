import React, { useEffect, useRef, useState, memo, useCallback } from "react";
import { View, Animated, StyleSheet, Easing, TouchableOpacity, PanResponder, Dimensions } from "react-native";
import { Text } from "react-native-paper";
import Svg, { Circle, Line as SvgLine, Rect, Text as SvgText, G, Defs, LinearGradient, Stop } from "react-native-svg";
import * as Haptics from "expo-haptics";
import { SimulationStatus } from "../hooks/useSimulation";
import { DrawerContent } from "./InfoDrawer";

const SCREEN_W = Dimensions.get("window").width;

// --- Node definitions ---
const NODES = [
  { key: "panel", icon: "\u2600\uFE0F", label: "Panel", color: "#FFD60A", explodeX: -100, explodeY: -70 },
  { key: "charger", icon: "\u26A1", label: "Sarj", color: "#FF9F0A", explodeX: 100, explodeY: -70 },
  { key: "battery", icon: "\uD83D\uDD0B", label: "Batarya", color: "#30D158", explodeX: 0, explodeY: 0 },
  { key: "boost", icon: "\uD83D\uDD3C", label: "Boost", color: "#0A84FF", explodeX: -100, explodeY: 70 },
  { key: "usb", icon: "\uD83D\uDD0C", label: "USB", color: "#BF5AF2", explodeX: 100, explodeY: 70 },
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
    explanation: "Sabit Ak\u0131m (CC) faz\u0131nda batarya h\u0131zla \u015Farj edilir. %80 dolunca Sabit Gerilim (CV) faz\u0131na ge\u00E7ilir, ak\u0131m yava\u015F\u00E7a d\u00FC\u015Fer.",
    funFact: "CC/CV y\u00F6ntemi, lityum-iyon batarya \u015Farj\u0131n\u0131n alt\u0131n standard\u0131d\u0131r.",
  },
  battery: {
    title: "Lityum-\u0130yon Batarya",
    unit: "Watt-saat (Wh)",
    formula: "E = Q \u00D7 V",
    explanation: "Li-ion batarya 3.6-4.2V aras\u0131nda \u00E7al\u0131\u015F\u0131r. 10000mAh kapasite = 37Wh enerji depolama. %5-%95 koruma aral\u0131\u011F\u0131.",
    funFact: "Tam dolu batarya, bir telefonu yakla\u015F\u0131k 2.5 kez \u015Farj edebilir.",
  },
  boost: {
    title: "DC-DC Boost Converter",
    unit: "Y\u00FCzde (%)",
    formula: "V_out = V_in / (1 - D)",
    explanation: "3.7V giri\u015Fi 5V \u00E7\u0131k\u0131\u015Fa y\u00FCkseltir. D\u22480.26 duty cycle. %85 verimlilik end\u00FCstri standard\u0131d\u0131r.",
    funFact: "\u0130deal kay\u0131ps\u0131z d\u00F6n\u00FC\u015F\u00FCm termodinamik olarak m\u00FCmk\u00FCn de\u011Fildir.",
  },
  usb: {
    title: "USB-A G\u00FC\u00E7 \u00C7\u0131k\u0131\u015F\u0131",
    unit: "Volt (V) / mA",
    formula: "P = 5V \u00D7 1A = 5W",
    explanation: "USB \u015Farj spesifikasyonu 5V sabit gerilimde 1A ak\u0131m sa\u011Flar.",
    funFact: "USB-C PD ile 240W'a kadar g\u00FC\u00E7 aktar\u0131m\u0131 m\u00FCmk\u00FCnd\u00FCr.",
  },
};

// --- Connection definitions ---
const CONNECTIONS = [
  { from: 0, to: 1 }, { from: 1, to: 2 }, { from: 2, to: 3 }, { from: 3, to: 4 },
];

interface Props {
  status: SimulationStatus;
  onNodePress: (content: DrawerContent) => void;
}

function CircuitDiagram({ status, onNodePress }: Props) {
  // --- Gesture state ---
  const pan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const scale = useRef(new Animated.Value(1)).current;
  const rotation = useRef(new Animated.Value(0)).current;
  const [exploded, setExploded] = useState(false);
  const [focusedNode, setFocusedNode] = useState<number | null>(null);
  const [zoomLabel, setZoomLabel] = useState("");
  const zoomOpacity = useRef(new Animated.Value(0)).current;
  const lastTapRef = useRef(0);
  const lastScaleRef = useRef(1);
  const lastRotRef = useRef(0);
  const lastDistRef = useRef(0);
  const lastAngleRef = useRef(0);
  const isPinchingRef = useRef(false);

  // Node explode positions
  const nodePositions = useRef(NODES.map(() => new Animated.ValueXY({ x: 0, y: 0 }))).current;
  const nodeScales = useRef(NODES.map(() => new Animated.Value(1))).current;
  const nodeOpacities = useRef(NODES.map(() => new Animated.Value(1))).current;

  // Particle animations
  const particles = useRef(
    CONNECTIONS.map(() =>
      Array.from({ length: 4 }, () => new Animated.Value(0))
    )
  ).current;

  // Badge pulse
  const badgePulse = useRef(new Animated.Value(1)).current;
  const badgeScale = useRef(new Animated.Value(1)).current;

  // --- Particle animation ---
  useEffect(() => {
    const isFlowing = status.solar_watts > 0.1 || status.phone_connected;
    if (!isFlowing) return;

    const speed = Math.max(600, 2500 - (status.solar_watts / 10) * 1900);
    const count = status.solar_watts < 2 ? 2 : 4;

    const anims = particles.flatMap((connParticles, ci) => {
      const isActive =
        ci < 2 ? status.solar_watts > 0.1 :
        status.phone_connected;
      if (!isActive) return [];
      return connParticles.slice(0, count).map((p, pi) => {
        p.setValue(0);
        return Animated.loop(
          Animated.timing(p, {
            toValue: 1,
            duration: speed,
            delay: pi * (speed / count),
            easing: Easing.linear,
            useNativeDriver: false,
          })
        );
      });
    });

    anims.forEach((a) => a.start());
    return () => anims.forEach((a) => a.stop());
  }, [status.solar_watts, status.phone_connected, particles]);

  // Badge pulse
  useEffect(() => {
    const anim = Animated.loop(Animated.sequence([
      Animated.timing(badgePulse, { toValue: 0.7, duration: 1000, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
      Animated.timing(badgePulse, { toValue: 1, duration: 1000, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
    ]));
    anim.start();
    return () => anim.stop();
  }, [badgePulse]);

  // Value change bounce
  const prevSolarRef = useRef(status.solar_watts);
  useEffect(() => {
    if (Math.abs(status.solar_watts - prevSolarRef.current) > 0.3) {
      Animated.sequence([
        Animated.spring(badgeScale, { toValue: 1.15, tension: 200, friction: 8, useNativeDriver: true }),
        Animated.spring(badgeScale, { toValue: 1, tension: 200, friction: 8, useNativeDriver: true }),
      ]).start();
    }
    prevSolarRef.current = status.solar_watts;
  }, [status.solar_watts, badgeScale]);

  // --- Gesture handling ---
  const getDist = (touches: any[]) => {
    if (touches.length < 2) return 0;
    const dx = touches[0].pageX - touches[1].pageX;
    const dy = touches[0].pageY - touches[1].pageY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const getAngle = (touches: any[]) => {
    if (touches.length < 2) return 0;
    return Math.atan2(
      touches[1].pageY - touches[0].pageY,
      touches[1].pageX - touches[0].pageX,
    ) * (180 / Math.PI);
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,

      onPanResponderGrant: (evt) => {
        const touches = evt.nativeEvent.touches;
        // 3-finger reset
        if (touches && touches.length >= 3) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          Animated.parallel([
            Animated.spring(pan, { toValue: { x: 0, y: 0 }, tension: 40, friction: 8, useNativeDriver: true }),
            Animated.spring(scale, { toValue: 1, tension: 40, friction: 8, useNativeDriver: true }),
            Animated.spring(rotation, { toValue: 0, tension: 30, friction: 10, useNativeDriver: true }),
          ]).start();
          lastScaleRef.current = 1;
          lastRotRef.current = 0;
          return;
        }

        // Double tap detection
        const now = Date.now();
        if (touches && touches.length === 1 && now - lastTapRef.current < 300) {
          handleDoubleTap();
        }
        lastTapRef.current = now;

        if (touches && touches.length === 2) {
          isPinchingRef.current = true;
          lastDistRef.current = getDist(touches);
          lastAngleRef.current = getAngle(touches);
        } else {
          isPinchingRef.current = false;
        }
        pan.extractOffset();
      },

      onPanResponderMove: (evt, gestureState) => {
        const touches = evt.nativeEvent.touches;
        if (touches && touches.length >= 2 && isPinchingRef.current) {
          // Pinch zoom
          const dist = getDist(touches);
          if (lastDistRef.current > 0 && dist > 0) {
            const delta = dist / lastDistRef.current;
            const newScale = Math.max(0.5, Math.min(3.0, lastScaleRef.current * delta));
            scale.setValue(newScale);
          }
          // Rotate
          const angle = getAngle(touches);
          const angleDelta = angle - lastAngleRef.current;
          const newRot = Math.max(-45, Math.min(45, lastRotRef.current + angleDelta));
          rotation.setValue(newRot);
        } else if (!isPinchingRef.current) {
          // Pan
          const nx = Math.max(-SCREEN_W, Math.min(SCREEN_W, gestureState.dx));
          const ny = Math.max(-300, Math.min(300, gestureState.dy));
          pan.setValue({ x: nx, y: ny });
        }
      },

      onPanResponderRelease: (evt) => {
        pan.flattenOffset();
        const touches = evt.nativeEvent.touches;
        if (isPinchingRef.current) {
          // Snap scale
          const currentScale = (scale as any)._value || 1;
          const snapped = Math.round(currentScale * 4) / 4;
          lastScaleRef.current = snapped;
          Animated.spring(scale, { toValue: snapped, tension: 60, friction: 10, useNativeDriver: true }).start();

          // Show zoom label
          setZoomLabel(`${snapped.toFixed(2)}\u00D7`);
          Animated.sequence([
            Animated.timing(zoomOpacity, { toValue: 1, duration: 150, useNativeDriver: true }),
            Animated.delay(800),
            Animated.timing(zoomOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
          ]).start();

          // Spring rotation back
          lastRotRef.current = 0;
          Animated.spring(rotation, { toValue: 0, tension: 30, friction: 10, useNativeDriver: true }).start();

          isPinchingRef.current = false;
        }
      },
    })
  ).current;

  // --- Double tap explode ---
  const handleDoubleTap = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const newExploded = !exploded;
    setExploded(newExploded);

    NODES.forEach((node, i) => {
      Animated.spring(nodePositions[i], {
        toValue: newExploded ? { x: node.explodeX, y: node.explodeY } : { x: 0, y: 0 },
        tension: 50, friction: 9, delay: i * 60,
        useNativeDriver: true,
      }).start();
      if (i === 2 && newExploded) {
        Animated.spring(nodeScales[i], { toValue: 1.2, tension: 50, friction: 9, useNativeDriver: true }).start();
      } else {
        Animated.spring(nodeScales[i], { toValue: 1, tension: 50, friction: 9, useNativeDriver: true }).start();
      }
    });
  }, [exploded, nodePositions, nodeScales]);

  // --- Node tap ---
  const handleNodeTap = useCallback((idx: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (focusedNode === idx) {
      setFocusedNode(null);
      NODES.forEach((_, i) => {
        Animated.spring(nodeScales[i], { toValue: 1, tension: 100, friction: 10, useNativeDriver: true }).start();
        Animated.spring(nodeOpacities[i], { toValue: 1, tension: 100, friction: 10, useNativeDriver: true }).start();
      });
      return;
    }

    setFocusedNode(idx);
    NODES.forEach((_, i) => {
      Animated.spring(nodeScales[i], {
        toValue: i === idx ? 1.3 : 1, tension: 100, friction: 10, useNativeDriver: true,
      }).start();
      Animated.spring(nodeOpacities[i], {
        toValue: i === idx ? 1 : 0.3, tension: 100, friction: 10, useNativeDriver: true,
      }).start();
    });

    onNodePress(NODE_INFO[NODES[idx].key]);
  }, [focusedNode, nodeScales, nodeOpacities, onNodePress]);

  // --- Compute node layout ---
  const canvasW = SCREEN_W - 48;
  const nodeW = 62;
  const nodeGap = (canvasW - nodeW * 5) / 4;
  const centerY = 130;

  const getNodeX = (i: number) => i * (nodeW + nodeGap) + nodeW / 2;
  const getNodeY = () => centerY;

  // Real-time values
  const chargeCurrent = status.solar_watts > 0 ? ((status.solar_watts * 0.9 / 3.7) * 1000) : 0;
  const usbCurrent = status.phone_connected ? 1000 : 0;
  const nodeValues = [
    [`${status.solar_watts.toFixed(1)}W`],
    [`${chargeCurrent.toFixed(0)}mA`],
    [`${status.battery_percent.toFixed(0)}%`, `${status.battery_wh.toFixed(1)}Wh`],
    [`\u03B7${status.efficiency}%`, "3.7\u21925V"],
    ["5.0V", `${usbCurrent}mA`],
  ];

  const rotateStr = rotation.interpolate({ inputRange: [-45, 45], outputRange: ["-45deg", "45deg"] });

  return (
    <View style={styles.canvasOuter} {...panResponder.panHandlers}>
      {/* Grid background */}
      <Svg width={canvasW + 16} height={300} style={StyleSheet.absoluteFill}>
        {Array.from({ length: Math.ceil((canvasW + 16) / 20) }, (_, i) =>
          Array.from({ length: 15 }, (_, j) => (
            <Circle key={`g${i}-${j}`} cx={i * 20} cy={j * 20} r={1} fill="rgba(255,255,255,0.04)" />
          ))
        ).flat()}
      </Svg>

      <Animated.View style={[styles.canvas, {
        transform: [
          { translateX: pan.x }, { translateY: pan.y },
          { scale }, { rotate: rotateStr },
        ],
      }]}>
        {/* Connection tubes */}
        <Svg width={canvasW} height={300} style={StyleSheet.absoluteFill}>
          {CONNECTIONS.map((conn, ci) => {
            const x1 = getNodeX(conn.from) + nodeW / 2;
            const x2 = getNodeX(conn.to) - nodeW / 2 + 8;
            const y = centerY;
            const isActive = ci < 2 ? status.solar_watts > 0.1 : status.phone_connected;
            const tubeColor = isActive ? "#FFD60A" : "#2C2C2E";
            const glowColor = isActive ? "#FFD60A" : "transparent";

            return (
              <G key={`conn-${ci}`}>
                {/* Shadow tube */}
                <SvgLine x1={x1} y1={y + 3} x2={x2} y2={y + 3}
                  stroke="#0A0A0A" strokeWidth={4} strokeLinecap="round" opacity={0.5} />
                {/* Neon glow layers */}
                {isActive && (
                  <>
                    <SvgLine x1={x1} y1={y} x2={x2} y2={y} stroke={glowColor} strokeWidth={18} opacity={0.06} strokeLinecap="round" />
                    <SvgLine x1={x1} y1={y} x2={x2} y2={y} stroke={glowColor} strokeWidth={10} opacity={0.12} strokeLinecap="round" />
                    <SvgLine x1={x1} y1={y} x2={x2} y2={y} stroke={glowColor} strokeWidth={6} opacity={0.3} strokeLinecap="round" />
                  </>
                )}
                {/* Main tube */}
                <SvgLine x1={x1} y1={y} x2={x2} y2={y}
                  stroke={tubeColor} strokeWidth={4} strokeLinecap="round" />
                {/* Highlight tube */}
                <SvgLine x1={x1} y1={y - 2} x2={x2} y2={y - 2}
                  stroke={isActive ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.05)"}
                  strokeWidth={1.5} strokeLinecap="round" />
                {/* Arrow */}
                <SvgLine x1={x2 - 8} y1={y - 5} x2={x2} y2={y}
                  stroke={tubeColor} strokeWidth={2.5} strokeLinecap="round" />
                <SvgLine x1={x2 - 8} y1={y + 5} x2={x2} y2={y}
                  stroke={tubeColor} strokeWidth={2.5} strokeLinecap="round" />
              </G>
            );
          })}
        </Svg>

        {/* Animated particles */}
        {CONNECTIONS.map((conn, ci) => {
          const x1 = getNodeX(conn.from) + nodeW / 2;
          const x2 = getNodeX(conn.to) - nodeW / 2 + 8;
          const y = centerY;
          const isActive = ci < 2 ? status.solar_watts > 0.1 : status.phone_connected;
          if (!isActive) return null;
          const count = status.solar_watts < 2 ? 2 : 4;

          return particles[ci].slice(0, count).map((p, pi) => {
            const px = p.interpolate({ inputRange: [0, 1], outputRange: [x1, x2] });
            return (
              <Animated.View key={`p-${ci}-${pi}`} style={[styles.particle, {
                transform: [{ translateX: px }, { translateY: new Animated.Value(y - 6) }],
              }]}>
                <Svg width={12} height={12}>
                  <Circle cx={6} cy={6} r={5} fill="#FFD60A" opacity={0.15} />
                  <Circle cx={6} cy={6} r={3} fill="#FFD60A" opacity={0.4} />
                  <Circle cx={6} cy={6} r={1.5} fill="#FFD60A" />
                </Svg>
              </Animated.View>
            );
          });
        })}

        {/* Nodes */}
        {NODES.map((node, i) => {
          const nx = getNodeX(i);
          const isActive =
            i === 0 ? status.solar_watts > 0.1 :
            i === 4 ? status.phone_connected :
            (status.solar_watts > 0.1 || status.phone_connected);

          return (
            <Animated.View
              key={node.key}
              style={[styles.nodeWrap, {
                left: nx - nodeW / 2,
                top: centerY - 50,
                width: nodeW,
                opacity: nodeOpacities[i],
                transform: [
                  ...nodePositions[i].getTranslateTransform(),
                  { scale: nodeScales[i] },
                ],
              }]}
            >
              <TouchableOpacity activeOpacity={0.7} onPress={() => handleNodeTap(i)}>
                {/* 3D shadow block */}
                <View style={[styles.nodeShadowBottom, { backgroundColor: "#111111" }]} />
                <View style={[styles.nodeShadowRight, { backgroundColor: "#151515" }]} />

                {/* Main node face */}
                <View style={[styles.nodeCard, {
                  borderColor: isActive ? node.color : "#3A3A3C",
                  borderWidth: isActive ? 2 : 1,
                }]}>
                  {/* Top highlight strip */}
                  <View style={[styles.nodeHighlight, { backgroundColor: isActive ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.03)" }]} />
                  <Text style={styles.nodeIcon}>{node.icon}</Text>
                  <Text style={[styles.nodeLabel, { color: isActive ? "rgba(235,235,245,0.85)" : "rgba(235,235,245,0.3)" }]}>
                    {node.label}
                  </Text>
                </View>

                {/* Value badges */}
                <Animated.View style={[styles.badgeWrap, { opacity: badgePulse, transform: [{ scale: badgeScale }] }]}>
                  {nodeValues[i].map((val, vi) => (
                    <View key={vi} style={[styles.badge, {
                      backgroundColor: `${node.color}15`,
                      borderColor: `${node.color}40`,
                    }]}>
                      <Text style={[styles.badgeText, { color: isActive ? node.color : "rgba(235,235,245,0.3)" }]}>
                        {val}
                      </Text>
                    </View>
                  ))}
                </Animated.View>
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </Animated.View>

      {/* Zoom indicator */}
      <Animated.View style={[styles.zoomIndicator, { opacity: zoomOpacity }]}>
        <Text style={styles.zoomText}>{zoomLabel}</Text>
      </Animated.View>

      {/* State badge */}
      <View style={styles.stateBadge}>
        <Text style={styles.stateText}>
          {exploded ? "Exploded" : "Normal"}
        </Text>
      </View>
    </View>
  );
}

export default memo(CircuitDiagram);

const styles = StyleSheet.create({
  canvasOuter: {
    height: 340,
    backgroundColor: "#000000",
    borderRadius: 20,
    overflow: "hidden",
    position: "relative",
  },
  canvas: {
    flex: 1,
    position: "relative",
  },
  particle: {
    position: "absolute",
    width: 12,
    height: 12,
  },
  nodeWrap: {
    position: "absolute",
    alignItems: "center",
  },
  nodeShadowBottom: {
    position: "absolute",
    bottom: -6,
    left: 4,
    right: -4,
    height: 8,
    borderRadius: 8,
    opacity: 0.6,
  },
  nodeShadowRight: {
    position: "absolute",
    top: 4,
    right: -5,
    width: 6,
    bottom: -4,
    borderRadius: 4,
    opacity: 0.4,
  },
  nodeCard: {
    width: 60,
    height: 72,
    borderRadius: 14,
    backgroundColor: "#2C2C2E",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  nodeHighlight: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
  },
  nodeIcon: { fontSize: 24, marginBottom: 2 },
  nodeLabel: { fontSize: 9, fontWeight: "600", letterSpacing: -0.2 },
  badgeWrap: { alignItems: "center", marginTop: 6, gap: 2 },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  badgeText: { fontSize: 8, fontWeight: "700", letterSpacing: -0.2 },
  zoomIndicator: {
    position: "absolute",
    top: 12,
    alignSelf: "center",
    backgroundColor: "rgba(44,44,46,0.9)",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
  },
  zoomText: { color: "#FFFFFF", fontSize: 15, fontWeight: "700", letterSpacing: -0.3 },
  stateBadge: {
    position: "absolute",
    bottom: 10,
    right: 12,
    backgroundColor: "rgba(44,44,46,0.7)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  stateText: { color: "rgba(235,235,245,0.3)", fontSize: 10, fontWeight: "500" },
});
