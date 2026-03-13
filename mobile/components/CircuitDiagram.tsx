import React, { useEffect, useRef, useState, memo, useCallback } from "react";
import {
  View, Animated, StyleSheet, Easing, TouchableOpacity,
  PanResponder, Dimensions, ScrollView,
} from "react-native";
import { Text } from "react-native-paper";
import Svg, {
  Circle, Line as SvgLine, Rect, Text as SvgText, G, Polygon,
} from "react-native-svg";
import * as Haptics from "expo-haptics";
import { SimulationStatus } from "../hooks/useSimulation";
import { DrawerContent } from "./InfoDrawer";

const SCREEN_W = Dimensions.get("window").width;

// Module-level flag: tutorial shows only once per app session
let tutorialDismissed = false;

const NODES = [
  { key: "panel", icon: "\u2600\uFE0F", label: "Panel", color: "#FFD60A", explodeX: -60, explodeY: -60 },
  { key: "charger", icon: "\u26A1", label: "Charger", color: "#FF9F0A", explodeX: 60, explodeY: -60 },
  { key: "battery", icon: "\uD83D\uDD0B", label: "Battery", color: "#30D158", explodeX: 0, explodeY: 0 },
  { key: "boost", icon: "\uD83D\uDD3C", label: "Boost", color: "#0A84FF", explodeX: -60, explodeY: 60 },
  { key: "usb", icon: "\uD83D\uDD0C", label: "USB", color: "#BF5AF2", explodeX: 60, explodeY: 60 },
];

const NODE_INFO: Record<string, DrawerContent> = {
  panel: {
    title: "Photovoltaic Panel",
    unit: "Watt (W)",
    formula: "P = \u03B7 \u00D7 A \u00D7 G",
    explanation: "\u03B7=efficiency, A=panel area (m\u00B2), G=solar irradiance (W/m\u00B2). Monocrystalline silicon cells operate at 15-22% efficiency. This system uses a 10W panel with 6-12V output.",
    funFact: "One hour of sunlight on Earth could meet all of humanity's energy needs for an entire year.",
  },
  charger: {
    title: "Charge Controller (CC/CV)",
    unit: "Milliamp (mA)",
    formula: "Phase 1: I=const, Phase 2: V=const",
    explanation: "During the Constant Current (CC) phase, the battery charges rapidly. At ~80% capacity, it switches to Constant Voltage (CV) phase, where current gradually decreases.",
    funFact: "The CC/CV method is the gold standard for lithium-ion battery charging.",
  },
  battery: {
    title: "Lithium-Ion Battery",
    unit: "Watt-hour (Wh)",
    formula: "E = Q \u00D7 V",
    explanation: "Li-ion battery operates between 3.6-4.2V. 10000mAh capacity = 37Wh energy storage. Protection range: 5%-95%.",
    funFact: "A fully charged battery can charge a smartphone approximately 2.5 times.",
  },
  boost: {
    title: "DC-DC Boost Converter",
    unit: "Percent (%)",
    formula: "V_out = V_in / (1 - D)",
    explanation: "Steps up 3.7V input to 5V output. D\u22480.26 duty cycle. 85% efficiency is the industry standard.",
    funFact: "An ideal lossless conversion is thermodynamically impossible.",
  },
  usb: {
    title: "USB-A Power Output",
    unit: "Volt (V) / mA",
    formula: "P = 5V \u00D7 1A = 5W",
    explanation: "USB charging specification provides 1A current at a constant 5V voltage.",
    funFact: "USB-C PD enables power delivery up to 240W.",
  },
};

const CONNECTIONS = [
  { from: 0, to: 1, label: "DC" },
  { from: 1, to: 2, label: "CC/CV" },
  { from: 2, to: 3, label: "3.7V" },
  { from: 3, to: 4, label: "5V" },
];

const EXPLODE_DESC: Record<string, { name: string; desc: string }> = {
  panel: { name: "Solar Panel", desc: "Photon \u2192 Electricity conversion" },
  charger: { name: "Charge Circuit", desc: "CC/CV current control" },
  battery: { name: "Li-ion Battery", desc: "37Wh energy storage" },
  boost: { name: "DC-DC Converter", desc: "3.7V \u2192 5V step-up" },
  usb: { name: "USB Output", desc: "5V / 1A power delivery" },
};

// --- SVG Button Icons (no emoji, renders reliably on iOS) ---
function ZoomOutIcon({ active }: { active?: boolean }) {
  const c = active ? "#000" : "rgba(235,235,245,0.7)";
  return (
    <Svg width={20} height={20} viewBox="0 0 20 20">
      <Circle cx={10} cy={10} r={8} stroke={c} strokeWidth={1.5} fill="none" />
      <SvgLine x1={6} y1={10} x2={14} y2={10} stroke={c} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

function ZoomInIcon({ active }: { active?: boolean }) {
  const c = active ? "#000" : "rgba(235,235,245,0.7)";
  return (
    <Svg width={20} height={20} viewBox="0 0 20 20">
      <Circle cx={10} cy={10} r={8} stroke={c} strokeWidth={1.5} fill="none" />
      <SvgLine x1={6} y1={10} x2={14} y2={10} stroke={c} strokeWidth={2} strokeLinecap="round" />
      <SvgLine x1={10} y1={6} x2={10} y2={14} stroke={c} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

function ResetIcon({ active }: { active?: boolean }) {
  const c = active ? "#000" : "rgba(235,235,245,0.7)";
  return (
    <Svg width={20} height={20} viewBox="0 0 20 20">
      <G fill="none" stroke={c} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
        <Polygon points="5,8 2,5 5,2" fill={c} stroke="none" />
        <SvgLine x1={3} y1={5} x2={3} y2={10} stroke={c} />
        <Rect x={3} y={5} width={0} height={0} />
      </G>
      <Circle cx={10} cy={10} r={7} stroke={c} strokeWidth={1.5} fill="none" />
      <SvgLine x1={3} y1={5} x2={7} y2={5} stroke={c} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}

function ExplodeIcon({ active, collapsed }: { active?: boolean; collapsed?: boolean }) {
  const c = active ? "#000" : "rgba(235,235,245,0.7)";
  if (collapsed) {
    // 4 arrows pointing inward
    return (
      <Svg width={20} height={20} viewBox="0 0 20 20">
        <Rect x={3} y={3} width={5} height={5} rx={1} fill={c} />
        <Rect x={12} y={3} width={5} height={5} rx={1} fill={c} />
        <Rect x={3} y={12} width={5} height={5} rx={1} fill={c} />
        <Rect x={12} y={12} width={5} height={5} rx={1} fill={c} />
      </Svg>
    );
  }
  // 4 small squares in corners (expand)
  return (
    <Svg width={20} height={20} viewBox="0 0 20 20">
      <Rect x={2} y={2} width={4} height={4} rx={1} fill={c} />
      <Rect x={14} y={2} width={4} height={4} rx={1} fill={c} />
      <Rect x={2} y={14} width={4} height={4} rx={1} fill={c} />
      <Rect x={14} y={14} width={4} height={4} rx={1} fill={c} />
      <SvgLine x1={7} y1={4} x2={13} y2={4} stroke={c} strokeWidth={1} strokeDasharray="2,2" />
      <SvgLine x1={7} y1={16} x2={13} y2={16} stroke={c} strokeWidth={1} strokeDasharray="2,2" />
      <SvgLine x1={4} y1={7} x2={4} y2={13} stroke={c} strokeWidth={1} strokeDasharray="2,2" />
      <SvgLine x1={16} y1={7} x2={16} y2={13} stroke={c} strokeWidth={1} strokeDasharray="2,2" />
    </Svg>
  );
}

interface Props {
  status: SimulationStatus;
  onNodePress: (content: DrawerContent) => void;
}

function CircuitDiagram({ status, onNodePress }: Props) {
  const pan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [currentZoom, setCurrentZoom] = useState(1);
  const [exploded, setExploded] = useState(false);
  const [focusedNode, setFocusedNode] = useState<number | null>(null);
  const [showTutorial, setShowTutorial] = useState(!tutorialDismissed);

  const lastScaleRef = useRef(1);
  const lastDistRef = useRef(0);
  const isPinchingRef = useRef(false);

  const nodePositions = useRef(NODES.map(() => new Animated.ValueXY({ x: 0, y: 0 }))).current;
  const nodeScales = useRef(NODES.map(() => new Animated.Value(1))).current;
  const nodeOpacities = useRef(NODES.map(() => new Animated.Value(1))).current;

  // Particles (3 per connection)
  const particles = useRef(
    CONNECTIONS.map(() => Array.from({ length: 3 }, () => new Animated.Value(0)))
  ).current;

  // Tutorial animation
  const tutorialOpacity = useRef(new Animated.Value(1)).current;
  const tutorialStep = useRef(new Animated.Value(0)).current;

  // --- Particle animation ---
  useEffect(() => {
    const isFlowing = status.solar_watts > 0.1 || status.phone_connected;
    if (!isFlowing) return;
    const speed = 3000;
    const anims = particles.flatMap((connP, ci) => {
      const isActive = ci < 2 ? status.solar_watts > 0.1 : status.phone_connected;
      if (!isActive) return [];
      return connP.map((p, pi) => {
        p.setValue(0);
        return Animated.loop(
          Animated.timing(p, {
            toValue: 1,
            duration: speed,
            delay: pi * (speed / 3),
            easing: Easing.linear,
            useNativeDriver: false,
          })
        );
      });
    });
    anims.forEach((a) => a.start());
    return () => anims.forEach((a) => a.stop());
  }, [status.solar_watts, status.phone_connected, particles]);

  // Tutorial auto-advance
  useEffect(() => {
    if (!showTutorial) return;
    const seq = Animated.sequence([
      Animated.timing(tutorialStep, { toValue: 0, duration: 0, useNativeDriver: true }),
      Animated.delay(2000),
      Animated.timing(tutorialStep, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.delay(2000),
      Animated.timing(tutorialStep, { toValue: 2, duration: 300, useNativeDriver: true }),
    ]);
    seq.start();
    return () => seq.stop();
  }, [showTutorial, tutorialStep]);

  // --- Gesture handling (pan + pinch only, no rotate) ---
  const getDist = (touches: any[]) => {
    if (touches.length < 2) return 0;
    const dx = touches[0].pageX - touches[1].pageX;
    const dy = touches[0].pageY - touches[1].pageY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const touches = evt.nativeEvent.touches;
        if (touches && touches.length === 2) {
          isPinchingRef.current = true;
          lastDistRef.current = getDist(touches);
        } else {
          isPinchingRef.current = false;
        }
        pan.extractOffset();
      },
      onPanResponderMove: (evt, gs) => {
        const touches = evt.nativeEvent.touches;
        if (touches && touches.length >= 2 && isPinchingRef.current) {
          const dist = getDist(touches);
          if (lastDistRef.current > 0 && dist > 0) {
            const delta = dist / lastDistRef.current;
            const ns = Math.max(0.5, Math.min(2.5, lastScaleRef.current * delta));
            scaleAnim.setValue(ns);
          }
        } else if (!isPinchingRef.current) {
          const maxP = SCREEN_W * 0.5;
          pan.setValue({
            x: Math.max(-maxP, Math.min(maxP, gs.dx)),
            y: Math.max(-200, Math.min(200, gs.dy)),
          });
        }
      },
      onPanResponderRelease: () => {
        pan.flattenOffset();
        if (isPinchingRef.current) {
          const cur = (scaleAnim as any)._value || 1;
          const snapped = Math.round(cur * 4) / 4;
          lastScaleRef.current = snapped;
          setCurrentZoom(snapped);
          Animated.spring(scaleAnim, { toValue: snapped, tension: 60, friction: 10, useNativeDriver: true }).start();
          isPinchingRef.current = false;
        }
      },
    })
  ).current;

  // --- Control bar actions ---
  const handleZoomIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const nz = Math.min(2.5, lastScaleRef.current + 0.25);
    lastScaleRef.current = nz;
    setCurrentZoom(nz);
    Animated.spring(scaleAnim, { toValue: nz, tension: 80, friction: 10, useNativeDriver: true }).start();
  };

  const handleZoomOut = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const nz = Math.max(0.5, lastScaleRef.current - 0.25);
    lastScaleRef.current = nz;
    setCurrentZoom(nz);
    Animated.spring(scaleAnim, { toValue: nz, tension: 80, friction: 10, useNativeDriver: true }).start();
  };

  const handleReset = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    lastScaleRef.current = 1;
    setCurrentZoom(1);
    setFocusedNode(null);
    NODES.forEach((_, i) => {
      Animated.spring(nodeScales[i], { toValue: 1, tension: 100, friction: 10, useNativeDriver: true }).start();
      Animated.spring(nodeOpacities[i], { toValue: 1, tension: 100, friction: 10, useNativeDriver: true }).start();
    });
    Animated.parallel([
      Animated.spring(pan, { toValue: { x: 0, y: 0 }, tension: 40, friction: 8, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, tension: 40, friction: 8, useNativeDriver: true }),
    ]).start();
  };

  const handleExplode = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const next = !exploded;
    setExploded(next);
    if (next) {
      lastScaleRef.current = 0.7;
      setCurrentZoom(0.7);
      Animated.spring(scaleAnim, { toValue: 0.7, tension: 50, friction: 9, useNativeDriver: true }).start();
    } else {
      lastScaleRef.current = 1;
      setCurrentZoom(1);
      Animated.spring(scaleAnim, { toValue: 1, tension: 50, friction: 9, useNativeDriver: true }).start();
    }
    NODES.forEach((node, i) => {
      Animated.spring(nodePositions[i], {
        toValue: next ? { x: node.explodeX, y: node.explodeY } : { x: 0, y: 0 },
        tension: 50, friction: 9, delay: i * 60, useNativeDriver: true,
      }).start();
    });
  };

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
      Animated.spring(nodeScales[i], { toValue: i === idx ? 1.05 : 1, tension: 100, friction: 10, useNativeDriver: true }).start();
      Animated.spring(nodeOpacities[i], { toValue: i === idx ? 1 : 0.4, tension: 100, friction: 10, useNativeDriver: true }).start();
    });
    onNodePress(NODE_INFO[NODES[idx].key]);
  }, [focusedNode, nodeScales, nodeOpacities, onNodePress]);

  const dismissNode = useCallback(() => {
    setFocusedNode(null);
    NODES.forEach((_, i) => {
      Animated.spring(nodeScales[i], { toValue: 1, tension: 100, friction: 10, useNativeDriver: true }).start();
      Animated.spring(nodeOpacities[i], { toValue: 1, tension: 100, friction: 10, useNativeDriver: true }).start();
    });
  }, [nodeScales, nodeOpacities]);

  const dismissTutorial = () => {
    tutorialDismissed = true;
    Animated.timing(tutorialOpacity, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => {
      setShowTutorial(false);
    });
  };

  // --- Layout ---
  const canvasW = SCREEN_W - 64;
  const nodeSize = 64;
  const nodeGap = (canvasW - nodeSize * 5) / 4;
  const centerY = 120;
  const getNodeX = (i: number) => i * (nodeSize + nodeGap) + nodeSize / 2;

  const chargeCurrent = status.solar_watts > 0 ? ((status.solar_watts * 0.9 / 3.7) * 1000) : 0;
  const usbCurrent = status.phone_connected ? 1000 : 0;

  const nodeValues = [
    `${status.solar_watts.toFixed(1)}W`,
    `${chargeCurrent.toFixed(0)}mA`,
    `${status.battery_percent.toFixed(0)}%`,
    `\u03B7${status.efficiency}%`,
    `${usbCurrent}mA`,
  ];

  const infoChips = [
    { icon: "\u2600\uFE0F", label: "Panel", value: `${status.solar_watts.toFixed(1)}W`, color: "#FFD60A", active: status.solar_watts > 0.1, nodeKey: "panel" },
    { icon: "\u26A1", label: "Circuit", value: `${chargeCurrent.toFixed(0)}mA`, color: "#FF9F0A", active: status.solar_watts > 0.1, nodeKey: "charger" },
    { icon: "\uD83D\uDD0B", label: "Battery", value: `${status.battery_percent.toFixed(0)}%`, color: "#30D158", active: true, nodeKey: "battery" },
    { icon: "\uD83D\uDD3C", label: "Boost", value: `\u03B7${status.efficiency}%`, color: "#0A84FF", active: status.phone_connected, nodeKey: "boost" },
    { icon: "\uD83D\uDD0C", label: "USB", value: `5V/${usbCurrent}mA`, color: "#BF5AF2", active: status.phone_connected, nodeKey: "usb" },
  ];

  return (
    <View style={styles.outer}>
      {/* Top Control Bar - SVG icons instead of emoji (FIX 1) */}
      <View style={styles.controlBar}>
        <CtrlBtn label="Zoom Out" onPress={handleZoomOut}>
          <ZoomOutIcon />
        </CtrlBtn>
        <CtrlBtn label="Zoom In" onPress={handleZoomIn}>
          <ZoomInIcon />
        </CtrlBtn>
        <CtrlBtn label="Reset" onPress={handleReset}>
          <ResetIcon />
        </CtrlBtn>
        <CtrlBtn
          label={exploded ? "Close" : "Explode"}
          onPress={handleExplode}
          active={exploded}
        >
          <ExplodeIcon active={exploded} collapsed={exploded} />
        </CtrlBtn>
      </View>

      {/* Canvas */}
      <View style={styles.canvasContainer} {...panResponder.panHandlers}>
        <Text style={styles.canvasLabel}>Circuit Diagram</Text>

        {/* Layer 1: Dot grid (background) */}
        <Svg width={canvasW + 16} height={280} style={StyleSheet.absoluteFill}>
          {Array.from({ length: Math.ceil((canvasW + 16) / 24) }, (_, i) =>
            Array.from({ length: Math.ceil(280 / 24) }, (_, j) => (
              <Circle key={`g${i}-${j}`} cx={i * 24 + 4} cy={j * 24 + 4} r={1.2} fill="rgba(255,255,255,0.05)" />
            ))
          ).flat()}
        </Svg>

        <Animated.View style={[styles.canvas, {
          transform: [{ translateX: pan.x }, { translateY: pan.y }, { scale: scaleAnim }],
        }]}>
          {/* Layer 2: Connection lines */}
          <Svg width={canvasW} height={280} style={StyleSheet.absoluteFill}>
            {CONNECTIONS.map((conn, ci) => {
              const x1 = getNodeX(conn.from) + nodeSize / 2 - 2;
              const x2 = getNodeX(conn.to) - nodeSize / 2 + 2;
              const y = centerY;
              const isActive = ci < 2 ? status.solar_watts > 0.1 : status.phone_connected;
              const lc = isActive ? "#FFD60A" : "#3A3A3C";
              const midX = (x1 + x2) / 2;
              return (
                <G key={`c-${ci}`}>
                  {isActive && (
                    <SvgLine x1={x1} y1={y} x2={x2} y2={y} stroke="#FFD60A" strokeWidth={10} opacity={0.08} strokeLinecap="round" />
                  )}
                  <SvgLine x1={x1} y1={y} x2={x2} y2={y}
                    stroke={lc} strokeWidth={isActive ? 3 : 2}
                    strokeDasharray={isActive ? undefined : "6,4"}
                    strokeLinecap="round" opacity={isActive ? 0.8 : 0.4} />
                  <Polygon
                    points={`${midX + 5},${y} ${midX - 3},${y - 4} ${midX - 3},${y + 4}`}
                    fill={lc} opacity={isActive ? 0.8 : 0.3} />
                  <Rect x={midX - 16} y={y - 20} width={32} height={15} rx={4}
                    fill="rgba(28,28,30,0.9)" stroke="rgba(84,84,88,0.3)" strokeWidth={0.5} />
                  <SvgText x={midX} y={y - 10} fill="rgba(235,235,245,0.5)" fontSize={8}
                    textAnchor="middle" fontWeight="600">{conn.label}</SvgText>
                </G>
              );
            })}
          </Svg>

          {/* Particles */}
          {CONNECTIONS.map((conn, ci) => {
            const x1 = getNodeX(conn.from) + nodeSize / 2 - 2;
            const x2 = getNodeX(conn.to) - nodeSize / 2 + 2;
            const y = centerY;
            const isActive = ci < 2 ? status.solar_watts > 0.1 : status.phone_connected;
            if (!isActive) return null;
            return particles[ci].map((p, pi) => {
              const px = p.interpolate({ inputRange: [0, 1], outputRange: [x1, x2] });
              return (
                <Animated.View key={`p-${ci}-${pi}`} style={[styles.particle, {
                  transform: [{ translateX: px }, { translateY: new Animated.Value(y - 6) }],
                }]}>
                  <Svg width={12} height={12}>
                    <Circle cx={6} cy={6} r={5} fill="#FFD60A" opacity={0.15} />
                    <Circle cx={6} cy={6} r={3} fill="#FFD60A" />
                  </Svg>
                </Animated.View>
              );
            });
          })}

          {/* Layer 3: Nodes */}
          {NODES.map((node, i) => {
            const nx = getNodeX(i);
            const isActive =
              i === 0 ? status.solar_watts > 0.1 :
              i === 4 ? status.phone_connected :
              (status.solar_watts > 0.1 || status.phone_connected);
            return (
              <Animated.View key={node.key} style={[styles.nodeWrap, {
                left: nx - nodeSize / 2,
                top: centerY - nodeSize / 2 - 10,
                width: nodeSize,
                opacity: nodeOpacities[i],
                transform: [...nodePositions[i].getTranslateTransform(), { scale: nodeScales[i] }],
              }]}>
                <TouchableOpacity activeOpacity={0.7} onPress={() => handleNodeTap(i)} style={styles.nodeTapTarget}>
                  <View style={[styles.nodeCard, {
                    borderColor: focusedNode === i ? node.color : isActive ? `${node.color}60` : "#3A3A3C",
                    borderWidth: focusedNode === i ? 2 : 1,
                  }]}>
                    <Text style={styles.nodeIcon}>{node.icon}</Text>
                    <Text style={[styles.nodeLabel, { color: isActive ? "rgba(235,235,245,0.85)" : "rgba(235,235,245,0.3)" }]}>
                      {node.label}
                    </Text>
                  </View>
                  {focusedNode === i && (
                    <TouchableOpacity style={styles.dismissBtn} onPress={dismissNode} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <Text style={styles.dismissText}>{"\u2715"}</Text>
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>
                {exploded && (
                  <View style={[styles.explodeCard, { borderLeftColor: node.color }]}>
                    <Text style={styles.explodeCardName}>{EXPLODE_DESC[node.key].name}</Text>
                    <Text style={[styles.explodeCardVal, { color: node.color }]}>{nodeValues[i]}</Text>
                    <Text style={styles.explodeCardDesc}>{EXPLODE_DESC[node.key].desc}</Text>
                  </View>
                )}
              </Animated.View>
            );
          })}

          {/* Layer 4: Value badges (rendered AFTER nodes, always on top) (FIX 2) */}
          {NODES.map((node, i) => {
            const nx = getNodeX(i);
            const isActive =
              i === 0 ? status.solar_watts > 0.1 :
              i === 4 ? status.phone_connected :
              (status.solar_watts > 0.1 || status.phone_connected);
            return (
              <Animated.View
                key={`badge-${node.key}`}
                pointerEvents="none"
                style={[styles.badgeWrap, {
                  left: nx - nodeSize / 2,
                  top: centerY + nodeSize / 2 - 6,
                  width: nodeSize,
                  opacity: nodeOpacities[i],
                  transform: [...nodePositions[i].getTranslateTransform(), { scale: nodeScales[i] }],
                }]}
              >
                <View style={[styles.valueBadge, {
                  backgroundColor: `${node.color}20`,
                  borderColor: `${node.color}60`,
                }]}>
                  <Text style={[styles.valueBadgeText, {
                    color: isActive ? node.color : "rgba(235,235,245,0.3)",
                  }]}>
                    {nodeValues[i]}
                  </Text>
                </View>
              </Animated.View>
            );
          })}
        </Animated.View>

        {/* Zoom indicator (always visible) */}
        <View style={styles.zoomPill}>
          <Text style={styles.zoomPillText}>{currentZoom.toFixed(2)}{"\u00D7"}</Text>
        </View>
      </View>

      {/* Bottom info strip */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        style={styles.infoStrip} contentContainerStyle={styles.infoStripContent}>
        {infoChips.map((chip) => (
          <TouchableOpacity key={chip.label} activeOpacity={0.7}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onNodePress(NODE_INFO[chip.nodeKey]); }}
            style={[styles.infoChip, {
              borderColor: chip.active ? `${chip.color}50` : "transparent",
              backgroundColor: chip.active ? `${chip.color}10` : "#2C2C2E",
            }]}>
            <Text style={styles.infoChipIcon}>{chip.icon}</Text>
            <Text style={[styles.infoChipLabel, { color: chip.active ? "rgba(235,235,245,0.6)" : "rgba(235,235,245,0.3)" }]}>
              {chip.label}:
            </Text>
            <Text style={[styles.infoChipValue, { color: chip.active ? chip.color : "rgba(235,235,245,0.4)" }]}>
              {chip.value}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Tutorial overlay */}
      {showTutorial && (
        <Animated.View style={[styles.tutorialOverlay, { opacity: tutorialOpacity }]}>
          <View style={styles.tutorialContent}>
            <Animated.View style={[styles.tutorialStep, {
              opacity: tutorialStep.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 0, 0], extrapolate: "clamp" }),
            }]}>
              <Text style={styles.tutorialIcon}>{"\u261D"}</Text>
              <Text style={styles.tutorialText}>Drag</Text>
              <Text style={styles.tutorialSub}>Move the circuit around</Text>
            </Animated.View>
            <Animated.View style={[styles.tutorialStep, {
              opacity: tutorialStep.interpolate({ inputRange: [0.5, 1, 1.5], outputRange: [0, 1, 0], extrapolate: "clamp" }),
            }]}>
              <Text style={styles.tutorialIcon}>{"\u270B"}</Text>
              <Text style={styles.tutorialText}>Pinch</Text>
              <Text style={styles.tutorialSub}>Pinch to zoom in/out</Text>
            </Animated.View>
            <Animated.View style={[styles.tutorialStep, {
              opacity: tutorialStep.interpolate({ inputRange: [1.5, 2, 2.5], outputRange: [0, 1, 1], extrapolate: "clamp" }),
            }]}>
              <Text style={styles.tutorialIcon}>{"\u261D"}</Text>
              <Text style={styles.tutorialText}>Tap a node</Text>
              <Text style={styles.tutorialSub}>Tap for detailed info</Text>
            </Animated.View>
            <TouchableOpacity style={styles.tutorialBtn} onPress={dismissTutorial} activeOpacity={0.8}>
              <Text style={styles.tutorialBtnText}>Got it</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}
    </View>
  );
}

function CtrlBtn({ label, onPress, active, children }: {
  label: string; onPress: () => void; active?: boolean; children: React.ReactNode;
}) {
  const s = useRef(new Animated.Value(1)).current;
  return (
    <Animated.View style={{ transform: [{ scale: s }], flex: 1 }}>
      <TouchableOpacity activeOpacity={0.7}
        style={[styles.ctrlBtn, active && styles.ctrlBtnActive]}
        onPressIn={() => Animated.spring(s, { toValue: 0.95, tension: 200, friction: 10, useNativeDriver: true }).start()}
        onPressOut={() => Animated.spring(s, { toValue: 1, tension: 200, friction: 10, useNativeDriver: true }).start()}
        onPress={onPress}>
        {children}
        <Text style={[styles.ctrlBtnLabel, active && styles.ctrlBtnLabelActive]}>{label}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default memo(CircuitDiagram);

const styles = StyleSheet.create({
  outer: { gap: 8 },
  controlBar: { flexDirection: "row", gap: 6, marginBottom: 4 },
  ctrlBtn: {
    backgroundColor: "#2C2C2E", borderRadius: 12, alignItems: "center",
    justifyContent: "center", paddingVertical: 8, width: 64, height: 56,
    minHeight: 44, minWidth: 44,
  },
  ctrlBtnActive: { backgroundColor: "#FFD60A" },
  ctrlBtnLabel: { color: "rgba(235,235,245,0.6)", fontSize: 10, fontWeight: "500", marginTop: 4, letterSpacing: -0.2 },
  ctrlBtnLabelActive: { color: "#000000" },
  canvasContainer: {
    height: 300, backgroundColor: "#000000", borderRadius: 16,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", overflow: "hidden", position: "relative",
  },
  canvasLabel: {
    position: "absolute", top: 8, left: 12, zIndex: 2,
    color: "rgba(235,235,245,0.2)", fontSize: 10, fontWeight: "600", letterSpacing: -0.2,
  },
  canvas: { flex: 1, position: "relative" },
  particle: { position: "absolute", width: 12, height: 12 },
  nodeWrap: { position: "absolute", alignItems: "center", zIndex: 5 },
  nodeTapTarget: { width: 64, height: 64, alignItems: "center", justifyContent: "center" },
  nodeCard: {
    width: 58, height: 58, borderRadius: 14, backgroundColor: "#2C2C2E",
    alignItems: "center", justifyContent: "center", overflow: "hidden",
  },
  nodeIcon: { fontSize: 22, marginBottom: 1 },
  nodeLabel: { fontSize: 9, fontWeight: "600", letterSpacing: -0.2 },
  dismissBtn: {
    position: "absolute", top: -4, right: -4, width: 20, height: 20, borderRadius: 10,
    backgroundColor: "rgba(255,69,58,0.9)", alignItems: "center", justifyContent: "center",
  },
  dismissText: { color: "#FFFFFF", fontSize: 10, fontWeight: "700" },
  // FIX 2: Badge rendered in separate layer above nodes
  badgeWrap: {
    position: "absolute", alignItems: "center",
    zIndex: 999, elevation: 10,
  },
  valueBadge: {
    paddingHorizontal: 6, paddingVertical: 3, borderRadius: 8,
    borderWidth: 1,
  },
  valueBadgeText: { fontSize: 9, fontWeight: "700", letterSpacing: -0.2 },
  explodeCard: {
    marginTop: 6, backgroundColor: "#1C1C1E", borderRadius: 8, borderLeftWidth: 3,
    paddingHorizontal: 8, paddingVertical: 6, width: 100, height: 60,
  },
  explodeCardName: { color: "rgba(235,235,245,0.85)", fontSize: 10, fontWeight: "700", letterSpacing: -0.2 },
  explodeCardVal: { fontSize: 14, fontWeight: "700", marginTop: 2, letterSpacing: -0.3 },
  explodeCardDesc: { color: "rgba(235,235,245,0.4)", fontSize: 8, marginTop: 2, letterSpacing: -0.2 },
  zoomPill: {
    position: "absolute", bottom: 10, right: 12,
    backgroundColor: "rgba(255,255,255,0.1)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10,
  },
  zoomPillText: { color: "rgba(235,235,245,0.5)", fontSize: 11, fontWeight: "600" },
  infoStrip: { maxHeight: 44 },
  infoStripContent: { gap: 8, paddingHorizontal: 2, alignItems: "center" },
  infoChip: {
    flexDirection: "row", alignItems: "center", height: 32, paddingHorizontal: 12,
    borderRadius: 16, borderWidth: 1, gap: 4,
  },
  infoChipIcon: { fontSize: 14 },
  infoChipLabel: { fontSize: 11, fontWeight: "500", letterSpacing: -0.2 },
  infoChipValue: { fontSize: 11, fontWeight: "700", letterSpacing: -0.2 },
  tutorialOverlay: {
    ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.85)",
    alignItems: "center", justifyContent: "center", borderRadius: 16, zIndex: 10,
  },
  tutorialContent: { alignItems: "center", padding: 32 },
  tutorialStep: { position: "absolute", alignItems: "center" },
  tutorialIcon: { fontSize: 48, marginBottom: 12 },
  tutorialText: { color: "#FFFFFF", fontSize: 22, fontWeight: "700", letterSpacing: -0.3 },
  tutorialSub: { color: "rgba(235,235,245,0.5)", fontSize: 14, marginTop: 4, letterSpacing: -0.2 },
  tutorialBtn: {
    marginTop: 120, backgroundColor: "#FFD60A", paddingHorizontal: 32, paddingVertical: 12,
    borderRadius: 12, minWidth: 120, alignItems: "center",
  },
  tutorialBtnText: { color: "#000000", fontSize: 16, fontWeight: "700", letterSpacing: -0.3 },
});
