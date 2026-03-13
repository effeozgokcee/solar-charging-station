import React, { useEffect, useRef, memo } from "react";
import { View, Animated, StyleSheet } from "react-native";
import Svg, { Path, Circle, Defs, LinearGradient, Stop, Text as SvgText } from "react-native-svg";

interface SunCycleProps {
  time: string;
}

function timeToHour(t: string): number {
  const p = t.split(":");
  return parseInt(p[0], 10) + parseInt(p[1], 10) / 60;
}

function getSkyColors(h: number): [string, string] {
  if (h < 5 || h > 20) return ["#000000", "#0D0D0D"];
  if (h < 7) return ["#1A0A00", "#000000"];
  if (h < 8) return ["#1A1000", "#0A0A14"];
  if (h < 17) return ["#0A1628", "#000000"];
  if (h < 19) return ["#1A0A14", "#000000"];
  return ["#0A0A14", "#000000"];
}

function SunCycle({ time }: SunCycleProps) {
  const hour = timeToHour(time);
  const isDaytime = hour >= 6 && hour <= 18;
  const w = 340;
  const h = 180;
  const cx = w / 2;
  const arcR = 135;
  const baseY = h - 24;

  const posX = useRef(new Animated.Value(cx)).current;
  const posY = useRef(new Animated.Value(baseY)).current;

  useEffect(() => {
    let tx: number, ty: number;
    if (isDaytime) {
      const p = (hour - 6) / 12;
      const a = Math.PI * (1 - p);
      tx = cx + arcR * Math.cos(a);
      ty = baseY - arcR * Math.sin(a);
    } else {
      tx = cx;
      ty = baseY + 10;
    }
    Animated.parallel([
      Animated.spring(posX, { toValue: tx, tension: 40, friction: 8, useNativeDriver: true }),
      Animated.spring(posY, { toValue: ty, tension: 40, friction: 8, useNativeDriver: true }),
    ]).start();
  }, [hour, isDaytime, posX, posY, cx, arcR, baseY]);

  const [skyTop, skyBottom] = getSkyColors(hour);
  const arcPath = `M ${cx - arcR} ${baseY} A ${arcR} ${arcR} 0 0 1 ${cx + arcR} ${baseY}`;

  return (
    <View style={styles.container}>
      <Svg width={w} height={h}>
        <Defs>
          <LinearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={skyTop} />
            <Stop offset="1" stopColor={skyBottom} />
          </LinearGradient>
        </Defs>
        <Path d={`M 0 0 H ${w} V ${h} H 0 Z`} fill="url(#sky)" rx={20} />
        <Path d={arcPath} stroke="rgba(255,255,255,0.08)" strokeWidth={1.5} fill="none" strokeDasharray="4,6" />
        <SvgText x={cx - arcR + 8} y={baseY + 14} fill="rgba(235,235,245,0.3)" fontSize={11} fontWeight="400">6 AM</SvgText>
        <SvgText x={cx - 10} y={baseY - arcR - 6} fill="rgba(235,235,245,0.3)" fontSize={11} fontWeight="400">12 PM</SvgText>
        <SvgText x={cx + arcR - 32} y={baseY + 14} fill="rgba(235,235,245,0.3)" fontSize={11} fontWeight="400">6 PM</SvgText>
      </Svg>
      <Animated.View style={[styles.body, {
        transform: [
          { translateX: Animated.subtract(posX, new Animated.Value(16)) },
          { translateY: Animated.subtract(posY, new Animated.Value(16)) },
        ],
      }]}>
        {isDaytime ? (
          <Svg width={32} height={32}>
            <Circle cx={16} cy={16} r={14} fill="#FFD60A" opacity={0.15} />
            <Circle cx={16} cy={16} r={10} fill="#FFD60A" opacity={0.4} />
            <Circle cx={16} cy={16} r={7} fill="#FFD60A" />
          </Svg>
        ) : (
          <Svg width={32} height={32}>
            <Circle cx={16} cy={16} r={9} fill="rgba(209,209,214,0.8)" />
            <Circle cx={12} cy={13} r={7} fill={skyTop} />
          </Svg>
        )}
      </Animated.View>
    </View>
  );
}

export default memo(SunCycle);

const styles = StyleSheet.create({
  container: { alignItems: "center", marginVertical: 8, borderRadius: 20, overflow: "hidden" },
  body: { position: "absolute", top: 0, left: 0 },
});
