import React, { useEffect, useRef, memo } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import Svg, {
  Rect, Circle, Line, Path, Text as SvgText, G, Defs, LinearGradient, Stop,
} from "react-native-svg";

interface Props {
  batteryPercent: number;
  chargingStatus: "charging" | "discharging" | "idle";
  solarWatts: number;
  phoneConnected: boolean;
}

function getBarColor(p: number): string {
  if (p > 60) return "#30D158";
  if (p > 20) return "#FF9F0A";
  return "#FF453A";
}

function StationIllustration({ batteryPercent, chargingStatus, solarWatts, phoneConnected }: Props) {
  const sunRotation = useRef(new Animated.Value(0)).current;
  const ledPulse = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    if (solarWatts > 0.1) {
      const anim = Animated.loop(
        Animated.timing(sunRotation, { toValue: 1, duration: 12000, easing: Easing.linear, useNativeDriver: true })
      );
      anim.start();
      return () => anim.stop();
    }
  }, [solarWatts, sunRotation]);

  useEffect(() => {
    if (chargingStatus === "charging") {
      const anim = Animated.loop(Animated.sequence([
        Animated.timing(ledPulse, { toValue: 1, duration: 800, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
        Animated.timing(ledPulse, { toValue: 0.3, duration: 800, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
      ]));
      anim.start();
      return () => anim.stop();
    } else {
      ledPulse.setValue(0.3);
    }
  }, [chargingStatus, ledPulse]);

  const spin = sunRotation.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });
  const barW = Math.max(2, (batteryPercent / 100) * 80);
  const barColor = getBarColor(batteryPercent);

  return (
    <View style={styles.container}>
      {/* Sun */}
      {solarWatts > 0.1 && (
        <Animated.View style={[styles.sun, { transform: [{ rotate: spin }] }]}>
          <Svg width={44} height={44}>
            <Circle cx={22} cy={22} r={8} fill="#FFD60A" />
            {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => {
              const rad = (a * Math.PI) / 180;
              return (
                <Line key={a} x1={22 + Math.cos(rad) * 11} y1={22 + Math.sin(rad) * 11}
                  x2={22 + Math.cos(rad) * 17} y2={22 + Math.sin(rad) * 17}
                  stroke="#FFD60A" strokeWidth={1.5} strokeLinecap="round" />
              );
            })}
          </Svg>
        </Animated.View>
      )}

      <Svg width={320} height={180} viewBox="0 0 320 180">
        <Defs>
          <LinearGradient id="panelGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#2a5a8c" />
            <Stop offset="1" stopColor="#1a3a5c" />
          </LinearGradient>
        </Defs>

        {/* Main Box */}
        <Rect x={60} y={80} width={200} height={90} rx={8} fill="#2C2C2E" stroke="#3A3A3C" strokeWidth={1} />

        {/* Solar Panel */}
        <G transform="skewX(-5) translate(8, 0)">
          <Rect x={70} y={30} width={170} height={50} rx={4} fill="url(#panelGrad)" stroke="#3A3A3C" strokeWidth={1} />
          {[0, 1, 2, 3].map((i) => (
            <Line key={`v${i}`} x1={70 + (i + 1) * 34} y1={32} x2={70 + (i + 1) * 34} y2={78} stroke="#2a5a8c" strokeWidth={0.8} />
          ))}
          <Line x1={72} y1={55} x2={238} y2={55} stroke="#2a5a8c" strokeWidth={0.8} />
        </G>

        {/* Panel supports */}
        <Line x1={100} y1={80} x2={90} y2={75} stroke="#3A3A3C" strokeWidth={2} />
        <Line x1={220} y1={80} x2={230} y2={75} stroke="#3A3A3C" strokeWidth={2} />

        {/* Battery bar on front */}
        <Rect x={80} y={105} width={90} height={14} rx={3} fill="#1C1C1E" stroke="#3A3A3C" strokeWidth={0.8} />
        <Rect x={82} y={107} width={barW} height={10} rx={2} fill={barColor} />
        <SvgText x={125} y={115} fill="rgba(235,235,245,0.6)" fontSize={8} textAnchor="middle" fontWeight="600">
          {batteryPercent.toFixed(0)}%
        </SvgText>

        {/* LED indicator */}
        <Circle cx={190} cy={112} r={4} fill={chargingStatus === "charging" ? "#30D158" : "#3A3A3C"} opacity={0.8} />
        <SvgText x={200} y={115} fill="rgba(235,235,245,0.3)" fontSize={7}>
          {chargingStatus === "charging" ? "CHG" : chargingStatus === "discharging" ? "DCH" : "IDLE"}
        </SvgText>

        {/* USB port */}
        <Rect x={255} y={115} width={12} height={20} rx={2} fill="#1C1C1E" stroke="#3A3A3C" strokeWidth={0.8} />
        <Rect x={257} y={119} width={8} height={6} rx={1} fill="#3A3A3C" />

        {/* Cable to phone */}
        {phoneConnected && (
          <>
            <Path d="M 267 125 C 280 125, 282 140, 290 140" stroke="#3A3A3C" strokeWidth={1.5} fill="none" />
            {/* Phone */}
            <Rect x={288} y={120} width={24} height={42} rx={4} fill="#2C2C2E" stroke="#3A3A3C" strokeWidth={1} />
            <Rect x={291} y={125} width={18} height={30} rx={2} fill="#1C1C1E" />
            <Circle cx={300} cy={158} r={1.5} fill="#3A3A3C" />
          </>
        )}

        {/* Labels */}
        <SvgText x={160} y={178} fill="rgba(235,235,245,0.3)" fontSize={9} textAnchor="middle">
          Solar Charging Station
        </SvgText>
      </Svg>

      {/* LED glow overlay */}
      {chargingStatus === "charging" && (
        <Animated.View style={[styles.ledGlow, { opacity: ledPulse }]} />
      )}
    </View>
  );
}

export default memo(StationIllustration);

const styles = StyleSheet.create({
  container: { alignItems: "center", justifyContent: "center", height: 200 },
  sun: { position: "absolute", top: 2, right: 30, zIndex: 1 },
  ledGlow: {
    position: "absolute", left: "56%", top: "56%",
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: "#30D158",
    shadowColor: "#30D158", shadowOpacity: 0.8, shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
  },
});
