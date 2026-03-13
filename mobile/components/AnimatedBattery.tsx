import React, { useEffect, useRef, memo } from "react";
import { View, Animated, StyleSheet, Easing } from "react-native";
import Svg, { Rect, Path, Text as SvgText, Defs, LinearGradient, Stop } from "react-native-svg";

const AnimatedRect = Animated.createAnimatedComponent(Rect);

interface AnimatedBatteryProps {
  percent: number;
  chargingStatus: "charging" | "discharging" | "idle";
}

function getBatteryColor(percent: number): string {
  if (percent > 60) return "#00C851";
  if (percent > 20) return "#F5A623";
  return "#FF4444";
}

function AnimatedBattery({ percent, chargingStatus }: AnimatedBatteryProps) {
  const fillAnim = useRef(new Animated.Value(percent)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fillAnim, {
      toValue: percent,
      duration: 800,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [percent, fillAnim]);

  useEffect(() => {
    if (chargingStatus === "charging") {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 0.92, duration: 1000, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
        ])
      );
      const glow = Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, { toValue: 1, duration: 1200, useNativeDriver: false, easing: Easing.inOut(Easing.sin) }),
          Animated.timing(glowAnim, { toValue: 0, duration: 1200, useNativeDriver: false, easing: Easing.inOut(Easing.sin) }),
        ])
      );
      pulse.start();
      glow.start();
      return () => { pulse.stop(); glow.stop(); };
    } else {
      pulseAnim.setValue(1);
      glowAnim.setValue(0);
    }
  }, [chargingStatus, pulseAnim, glowAnim]);

  const color = getBatteryColor(percent);

  const batteryW = 80;
  const batteryH = 140;
  const bodyX = 10;
  const bodyY = 20;
  const bodyW = batteryW - 20;
  const bodyH = batteryH - 30;
  const tipW = 24;
  const tipH = 10;
  const fillPadding = 4;
  const maxFillH = bodyH - fillPadding * 2;

  const fillHeight = fillAnim.interpolate({
    inputRange: [0, 100],
    outputRange: [0, maxFillH],
    extrapolate: "clamp",
  });

  const fillY = fillAnim.interpolate({
    inputRange: [0, 100],
    outputRange: [bodyY + bodyH - fillPadding, bodyY + fillPadding],
    extrapolate: "clamp",
  });

  const shadowRadius = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 20],
  });

  const shadowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.6],
  });

  return (
    <View style={styles.wrapper}>
      <Animated.View
        style={[
          styles.glowContainer,
          {
            shadowColor: color,
            shadowRadius: shadowRadius,
            shadowOpacity: shadowOpacity,
            elevation: chargingStatus === "charging" ? 10 : 0,
            transform: [{ scale: pulseAnim }],
          },
        ]}
      >
        <Svg width={batteryW} height={batteryH}>
          <Defs>
            <LinearGradient id="fillGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={color} stopOpacity="1" />
              <Stop offset="1" stopColor={color} stopOpacity="0.6" />
            </LinearGradient>
          </Defs>

          <Rect
            x={(batteryW - tipW) / 2}
            y={bodyY - tipH + 2}
            width={tipW}
            height={tipH}
            rx={3}
            fill="#3A4A5C"
          />
          <Rect
            x={bodyX}
            y={bodyY}
            width={bodyW}
            height={bodyH}
            rx={8}
            fill="none"
            stroke="#3A4A5C"
            strokeWidth={3}
          />

          <AnimatedRect
            x={bodyX + fillPadding}
            y={fillY}
            width={bodyW - fillPadding * 2}
            height={fillHeight}
            rx={4}
            fill="url(#fillGrad)"
          />

          {chargingStatus === "charging" && (
            <Path
              d="M 38 55 L 32 75 L 38 75 L 34 95 L 48 70 L 42 70 L 46 55 Z"
              fill="#FFFFFF"
              opacity={0.9}
            />
          )}

          <SvgText
            x={batteryW / 2}
            y={bodyY + bodyH / 2 + (chargingStatus === "charging" ? 22 : 5)}
            fill="#FFFFFF"
            fontSize={14}
            fontWeight="bold"
            textAnchor="middle"
          >
            {percent.toFixed(1)}%
          </SvgText>
        </Svg>
      </Animated.View>

      <Animated.Text
        style={[
          styles.statusText,
          { color: chargingStatus === "charging" ? "#00C851" : chargingStatus === "discharging" ? "#FF4444" : "#8892A4" },
        ]}
      >
        {chargingStatus === "charging" ? "Sarj Ediliyor" : chargingStatus === "discharging" ? "Desarj Oluyor" : "Bosta"}
      </Animated.Text>
    </View>
  );
}

export default memo(AnimatedBattery);

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    paddingVertical: 8,
  },
  glowContainer: {
    shadowOffset: { width: 0, height: 0 },
  },
  statusText: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 8,
    letterSpacing: 1,
  },
});
