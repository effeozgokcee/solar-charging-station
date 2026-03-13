// -*- coding: utf-8 -*-
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
  { key: "charger", icon: "\u26A1", label: "\u015Earj", color: "#FF9F0A", explodeX: 60, explodeY: -60 },
  { key: "battery", icon: "\uD83D\uDD0B", label: "Batarya", color: "#30D158", explodeX: 0, explodeY: 0 },
  { key: "boost", icon: "\uD83D\uDD3C", label: "Boost", color: "#0A84FF", explodeX: -60, explodeY: 60 },
  { key: "usb", icon: "\uD83D\uDD0C", label: "USB", color: "#BF5AF2", explodeX: 60, explodeY: 60 },
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

const CONNECTIONS = [
  { from: 0, to: 1, label: "DC" },
  { from: 1, to: 2, label: "CC/CV" },
  { from: 2, to: 3, label: "3.7V" },
  { from: 3, to: 4, label: "5V" },
];

const EXPLODE_DESC: Record<string, { name: string; desc: string }> = {
  panel: { name: "G\u00FCne\u015F Paneli", desc: "Foton \u2192 Elektrik d\u00F6n\u00FC\u015F\u00FCm\u00FC" },
  charger: { name: "\u015Earj Devresi", desc: "CC/CV ak\u0131m kontrol\u00FC" },
  battery: { name: "Li-ion Batarya", desc: "37Wh enerji depolama" },
  boost: { name: "DC-DC Converter", desc: "3.7V \u2192 5V y\u00FCkseltme" },
  usb: { name: "USB \u00C7\u0131k\u0131\u015F", desc: "5V / 1A g\u00FC\u00E7 da\u011F\u0131t\u0131m\u0131" },
};

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
    { icon: "\u26A1", label: "Devre", value: `${chargeCurrent.toFixed(0)}mA`, color: "#FF9F0A", active: status.solar_watts > 0.1, nodeKey: "charger" },
    { icon: "\uD83D\uDD0B", label: "Batarya", value: `${status.battery_percent.toFixed(0)}%`, color: "#30D158", active: true, nodeKey: "battery" },
    { icon: "\uD83D\uDD3C", label: "Boost", value: `\u03B7${status.efficiency}%`, color: "#0A84FF", active: status.phone_connected, nodeKey: "boost" },
    { icon: "\uD83D\uDD0C", label: "USB", value: `5V/${usbCurrent}mA`, color: "#BF5AF2", active: status.phone_connected, nodeKey: "usb" },
  ];

  return (
    <View style={styles.outer}>
      {/* Top Control Bar */}
      <View style={styles.controlBar}>
        <CtrlBtn icon="\uD83D\uDD0D\u2212" label="Uzakla\u015F" onPress={handleZoomOut} />
        <CtrlBtn icon="\uD83D\uDD0D+" label="Yakla\u015F" onPress={handleZoomIn} />
        <CtrlBtn icon="\u27F2" label="S\u0131f\u0131rla" onPress={handleReset} />
        <CtrlBtn
          icon={exploded ? "\u2715" : "\uD83D\uDCA5"}
          label={exploded ? "Kapat" : "A\u00E7"}
          onPress={handleExplode}
          active={exploded}
        />
      </View>

      {/* Canvas */}
      <View style={styles.canvasContainer} {...panResponder.panHandlers}>
        <Text style={styles.canvasLabel}>Devre \u015Eemas\u0131</Text>

        {/* Dot grid */}
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
          {/* Connection lines */}
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

          {/* Nodes */}
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
                <View style={[styles.valueBadge, { backgroundColor: `${node.color}15`, borderColor: `${node.color}40` }]}>
                  <Text style={[styles.valueBadgeText, { color: isActive ? node.color : "rgba(235,235,245,0.3)" }]}>
                    {nodeValues[i]}
                  </Text>
                </View>
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
              <Text style={styles.tutorialIcon}>{"\uD83D\uDC46"}</Text>
              <Text style={styles.tutorialText}>S\u00FCr\u00FCkle</Text>
              <Text style={styles.tutorialSub}>Devreyi hareket ettir</Text>
            </Animated.View>
            <Animated.View style={[styles.tutorialStep, {
              opacity: tutorialStep.interpolate({ inputRange: [0.5, 1, 1.5], outputRange: [0, 1, 0], extrapolate: "clamp" }),
            }]}>
              <Text style={styles.tutorialIcon}>{"\uD83E\uDD0F"}</Text>
              <Text style={styles.tutorialText}>Yak\u0131nla\u015Ft\u0131r</Text>
              <Text style={styles.tutorialSub}>{"\u0130"}ki parmakla yak\u0131nla\u015F/uzakla\u015F</Text>
            </Animated.View>
            <Animated.View style={[styles.tutorialStep, {
              opacity: tutorialStep.interpolate({ inputRange: [1.5, 2, 2.5], outputRange: [0, 1, 1], extrapolate: "clamp" }),
            }]}>
              <Text style={styles.tutorialIcon}>{"\uD83D\uDC46"}</Text>
              <Text style={styles.tutorialText}>Bile\u015Fene dokun</Text>
              <Text style={styles.tutorialSub}>Detayl\u0131 bilgi i\u00E7in dokun</Text>
            </Animated.View>
            <TouchableOpacity style={styles.tutorialBtn} onPress={dismissTutorial} activeOpacity={0.8}>
              <Text style={styles.tutorialBtnText}>Anlad\u0131m</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}
    </View>
  );
}

function CtrlBtn({ icon, label, onPress, active }: { icon: string; label: string; onPress: () => void; active?: boolean }) {
  const s = useRef(new Animated.Value(1)).current;
  return (
    <Animated.View style={{ transform: [{ scale: s }], flex: 1 }}>
      <TouchableOpacity activeOpacity={0.7}
        style={[styles.ctrlBtn, active && styles.ctrlBtnActive]}
        onPressIn={() => Animated.spring(s, { toValue: 0.95, tension: 200, friction: 10, useNativeDriver: true }).start()}
        onPressOut={() => Animated.spring(s, { toValue: 1, tension: 200, friction: 10, useNativeDriver: true }).start()}
        onPress={onPress}>
        <Text style={styles.ctrlBtnIcon}>{icon}</Text>
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
    backgroundColor: "#2C2C2E", borderRadius: 10, alignItems: "center",
    justifyContent: "center", paddingVertical: 8, minHeight: 44, minWidth: 44,
  },
  ctrlBtnActive: { backgroundColor: "#FFD60A" },
  ctrlBtnIcon: { fontSize: 16 },
  ctrlBtnLabel: { color: "rgba(235,235,245,0.6)", fontSize: 10, fontWeight: "500", marginTop: 2, letterSpacing: -0.2 },
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
  nodeWrap: { position: "absolute", alignItems: "center" },
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
  valueBadge: {
    marginTop: 4, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, borderWidth: 1,
  },
  valueBadgeText: { fontSize: 8, fontWeight: "700", letterSpacing: -0.2 },
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
