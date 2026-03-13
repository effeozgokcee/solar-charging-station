import React, { useEffect, useRef, memo } from "react";
import { View, Animated, StyleSheet, Easing } from "react-native";
import Svg, { Rect, Path, Text as SvgText, Defs, LinearGradient, Stop } from "react-native-svg";

const AnimatedRect = Animated.createAnimatedComponent(Rect);

interface Props {
  percent: number;
  chargingStatus: "charging" | "discharging" | "idle";
}

function getColor(p: number): string {
  if (p > 60) return "#30D158";
  if (p > 20) return "#FF9F0A";
  return "#FF453A";
}

function AnimatedBattery({ percent, chargingStatus }: Props) {
  // SEPARATE values: fillAnim for layout (non-native), pulseScale/glowOpacity for transforms (native)
  const fillAnim = useRef(new Animated.Value(percent)).current;
  const pulseScale = useRef(new Animated.Value(1)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fillAnim, {
      toValue: percent,
      duration: 600,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false, // layout prop - must be false
    }).start();
  }, [percent, fillAnim]);

  useEffect(() => {
    if (chargingStatus === "charging") {
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
  }, [chargingStatus, pulseScale, glowOpacity]);

  const color = getColor(percent);
  const bw = 100, bh = 180;
  const bx = 15, by = 24;
  const bW = bw - 30, bH = bh - 36;
  const tipW = 28, tipH = 12;
  const pad = 5;
  const maxFill = bH - pad * 2;

  const fillH = fillAnim.interpolate({ inputRange: [0, 100], outputRange: [0, maxFill], extrapolate: "clamp" });
  const fillY = fillAnim.interpolate({ inputRange: [0, 100], outputRange: [by + bH - pad, by + pad], extrapolate: "clamp" });

  return (
    <View style={styles.wrapper}>
      {/* Glow ring - uses only native-driver-compatible props */}
      <Animated.View style={[styles.glowRing, {
        opacity: glowOpacity,
        borderColor: color,
      }]} />

      <Animated.View style={{ transform: [{ scale: pulseScale }] }}>
        <Svg width={bw} height={bh}>
          <Defs>
            <LinearGradient id="fill" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={color} stopOpacity="0.9" />
              <Stop offset="1" stopColor={color} stopOpacity="0.5" />
            </LinearGradient>
          </Defs>

          <Rect x={(bw - tipW) / 2} y={by - tipH + 3} width={tipW} height={tipH} rx={4} fill="#3A3A3C" />
          <Rect x={bx} y={by} width={bW} height={bH} rx={10} fill="none" stroke="#3A3A3C" strokeWidth={2.5} />

          <AnimatedRect x={bx + pad} y={fillY} width={bW - pad * 2} height={fillH} rx={6} fill="url(#fill)" />

          {chargingStatus === "charging" && (
            <Path d="M 48 65 L 40 90 L 48 90 L 42 115 L 60 82 L 52 82 L 58 65 Z" fill="rgba(255,255,255,0.85)" />
          )}

          <SvgText x={bw / 2} y={chargingStatus === "charging" ? by + bH / 2 + 30 : by + bH / 2 + 6}
            fill="#FFFFFF" fontSize={18} fontWeight="700" textAnchor="middle" letterSpacing={-0.5}>
            {percent.toFixed(1)}%
          </SvgText>
        </Svg>
      </Animated.View>

      <View style={[styles.statusBadge, {
        backgroundColor: chargingStatus === "charging" ? "rgba(48,209,88,0.15)" :
          chargingStatus === "discharging" ? "rgba(255,69,58,0.15)" : "rgba(142,142,147,0.1)",
      }]}>
        <Animated.Text style={[styles.statusText, {
          color: chargingStatus === "charging" ? "#30D158" :
            chargingStatus === "discharging" ? "#FF453A" : "rgba(235,235,245,0.3)",
        }]}>
          {chargingStatus === "charging" ? "Charging" : chargingStatus === "discharging" ? "Discharging" : "Idle"}
        </Animated.Text>
      </View>
    </View>
  );
}

export default memo(AnimatedBattery);

const styles = StyleSheet.create({
  wrapper: { alignItems: "center", paddingVertical: 8 },
  glowRing: {
    position: "absolute",
    width: 120,
    height: 200,
    borderRadius: 20,
    borderWidth: 1.5,
    top: 0,
  },
  statusBadge: {
    marginTop: 10,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 14,
  },
  statusText: {
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: -0.3,
  },
});
