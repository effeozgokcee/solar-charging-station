import React, { useEffect, useRef, memo } from "react";
import { View, Animated, StyleSheet } from "react-native";
import Svg, { Path, Circle, Defs, LinearGradient, Stop, Line, Text as SvgText } from "react-native-svg";

interface SunCycleProps {
  time: string;
}

function timeToHour(time: string): number {
  const parts = time.split(":");
  return parseInt(parts[0], 10) + parseInt(parts[1], 10) / 60;
}

function getSkyColors(hour: number): [string, string] {
  if (hour < 5 || hour > 20) return ["#0D1B2A", "#1A1A2E"];
  if (hour < 7) return ["#FF6B35", "#1A1A2E"];
  if (hour < 8) return ["#FF8C42", "#4A90D9"];
  if (hour < 17) return ["#4A90D9", "#87CEEB"];
  if (hour < 19) return ["#FF6B35", "#4A2C7A"];
  return ["#2C1654", "#0D1B2A"];
}

function SunCycle({ time }: SunCycleProps) {
  const hour = timeToHour(time);
  const isDaytime = hour >= 6 && hour <= 18;

  const width = 320;
  const height = 160;
  const cx = width / 2;
  const arcRadius = 130;
  const baseY = height - 20;

  const animX = useRef(new Animated.Value(0)).current;
  const animY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let targetX: number;
    let targetY: number;

    if (isDaytime) {
      const progress = (hour - 6) / 12;
      const angle = Math.PI * (1 - progress);
      targetX = cx + arcRadius * Math.cos(angle);
      targetY = baseY - arcRadius * Math.sin(angle);
    } else {
      const nightProgress = hour >= 18 ? (hour - 18) / 12 : (hour + 6) / 12;
      targetX = cx + arcRadius * Math.cos(Math.PI * nightProgress);
      targetY = baseY + 20;
    }

    Animated.parallel([
      Animated.spring(animX, { toValue: targetX, useNativeDriver: true, tension: 20, friction: 8 }),
      Animated.spring(animY, { toValue: targetY, useNativeDriver: true, tension: 20, friction: 8 }),
    ]).start();
  }, [hour, isDaytime, animX, animY, cx, arcRadius, baseY]);

  const [skyTop, skyBottom] = getSkyColors(hour);

  const arcPath = `M ${cx - arcRadius} ${baseY} A ${arcRadius} ${arcRadius} 0 0 1 ${cx + arcRadius} ${baseY}`;

  return (
    <View style={styles.container}>
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={skyTop} />
            <Stop offset="1" stopColor={skyBottom} />
          </LinearGradient>
        </Defs>

        <Path d={`M 0 0 H ${width} V ${height} H 0 Z`} fill="url(#skyGrad)" rx={12} />
        <Path d={arcPath} stroke="#8892A4" strokeWidth={1.5} fill="none" strokeDasharray="4,4" opacity={0.4} />
        <Line x1={cx - arcRadius} y1={baseY} x2={cx + arcRadius} y2={baseY} stroke="#8892A4" strokeWidth={1} opacity={0.3} />

        <SvgText x={cx - arcRadius + 5} y={baseY + 14} fill="#8892A4" fontSize={10}>06:00</SvgText>
        <SvgText x={cx - 10} y={baseY - arcRadius - 5} fill="#8892A4" fontSize={10}>12:00</SvgText>
        <SvgText x={cx + arcRadius - 30} y={baseY + 14} fill="#8892A4" fontSize={10}>18:00</SvgText>
      </Svg>

      <Animated.View
        style={[
          styles.celestialBody,
          {
            transform: [
              { translateX: Animated.subtract(animX, new Animated.Value(14)) },
              { translateY: Animated.subtract(animY, new Animated.Value(14)) },
            ],
          },
        ]}
      >
        {isDaytime ? (
          <Svg width={28} height={28}>
            <Circle cx={14} cy={14} r={10} fill="#FFD93D" />
            <Circle cx={14} cy={14} r={13} fill="#F5A623" opacity={0.2} />
          </Svg>
        ) : (
          <Svg width={28} height={28}>
            <Circle cx={14} cy={14} r={10} fill="#C5CAE9" opacity={0.9} />
            <Circle cx={10} cy={11} r={8} fill={skyTop} />
          </Svg>
        )}
      </Animated.View>
    </View>
  );
}

export default memo(SunCycle);

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    marginVertical: 8,
    borderRadius: 12,
    overflow: "hidden",
  },
  celestialBody: {
    position: "absolute",
    top: 0,
    left: 0,
  },
});
