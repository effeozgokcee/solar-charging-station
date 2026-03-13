import React, { useEffect, useRef, memo } from "react";
import { View, Animated, StyleSheet, Easing } from "react-native";
import Svg, { Circle, Line, Ellipse, Rect } from "react-native-svg";

interface WeatherAnimationProps {
  weather: string;
  size?: number;
}

function SunnyAnimation({ size }: { size: number }) {
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 10000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    anim.start();
    return () => anim.stop();
  }, [rotation]);

  const spin = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const c = size / 2;
  const r = size * 0.16;

  return (
    <View style={[styles.box, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <Circle cx={c} cy={c} r={r * 1.4} fill="#FFD60A" opacity={0.15} />
        <Circle cx={c} cy={c} r={r * 1.1} fill="#FFD60A" opacity={0.3} />
        <Circle cx={c} cy={c} r={r} fill="#FFD60A" />
      </Svg>
      <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ rotate: spin }] }]}>
        <Svg width={size} height={size}>
          {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => {
            const rad = (a * Math.PI) / 180;
            return (
              <Line
                key={a}
                x1={c + Math.cos(rad) * (r + 5)}
                y1={c + Math.sin(rad) * (r + 5)}
                x2={c + Math.cos(rad) * (r + size * 0.12)}
                y2={c + Math.sin(rad) * (r + size * 0.12)}
                stroke="#FFD60A"
                strokeWidth={2}
                strokeLinecap="round"
              />
            );
          })}
        </Svg>
      </Animated.View>
    </View>
  );
}

function CloudEl({ cx, cy, s, color }: { cx: number; cy: number; s: number; color: string }) {
  return (
    <>
      <Ellipse cx={cx} cy={cy} rx={18 * s} ry={12 * s} fill={color} />
      <Ellipse cx={cx - 12 * s} cy={cy + 4 * s} rx={12 * s} ry={9 * s} fill={color} />
      <Ellipse cx={cx + 12 * s} cy={cy + 4 * s} rx={14 * s} ry={9 * s} fill={color} />
      <Rect x={cx - 18 * s} y={cy} width={36 * s} height={10 * s} fill={color} rx={3} />
    </>
  );
}

function PartlyCloudyAnimation({ size }: { size: number }) {
  const cloudX = useRef(new Animated.Value(0)).current;
  const sunRotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const c = Animated.loop(Animated.sequence([
      Animated.timing(cloudX, { toValue: 6, duration: 3500, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
      Animated.timing(cloudX, { toValue: -6, duration: 3500, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
    ]));
    const s = Animated.loop(Animated.timing(sunRotation, { toValue: 1, duration: 12000, easing: Easing.linear, useNativeDriver: true }));
    c.start(); s.start();
    return () => { c.stop(); s.stop(); };
  }, [cloudX, sunRotation]);

  const spin = sunRotation.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });
  const cx = size / 2;

  return (
    <View style={[styles.box, { width: size, height: size }]}>
      <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ rotate: spin }] }]}>
        <Svg width={size} height={size}>
          <Circle cx={cx - 8} cy={cx - 10} r={size * 0.11} fill="#FFD60A" />
          {[0, 72, 144, 216, 288].map((a) => {
            const rad = (a * Math.PI) / 180;
            const rr = size * 0.11;
            return (
              <Line key={a} x1={cx - 8 + Math.cos(rad) * (rr + 3)} y1={cx - 10 + Math.sin(rad) * (rr + 3)}
                x2={cx - 8 + Math.cos(rad) * (rr + 7)} y2={cx - 10 + Math.sin(rad) * (rr + 7)}
                stroke="#FFD60A" strokeWidth={1.5} strokeLinecap="round" />
            );
          })}
        </Svg>
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateX: cloudX }] }]}>
        <Svg width={size} height={size}>
          <CloudEl cx={cx + 6} cy={cx + 6} s={1.1} color="rgba(235,235,245,0.85)" />
        </Svg>
      </Animated.View>
    </View>
  );
}

function CloudyAnimation({ size }: { size: number }) {
  const c1 = useRef(new Animated.Value(0)).current;
  const c2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const a1 = Animated.loop(Animated.sequence([
      Animated.timing(c1, { toValue: 8, duration: 4500, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
      Animated.timing(c1, { toValue: -8, duration: 4500, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
    ]));
    const a2 = Animated.loop(Animated.sequence([
      Animated.timing(c2, { toValue: -6, duration: 5500, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
      Animated.timing(c2, { toValue: 6, duration: 5500, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
    ]));
    a1.start(); a2.start();
    return () => { a1.stop(); a2.stop(); };
  }, [c1, c2]);

  const cx = size / 2;
  return (
    <View style={[styles.box, { width: size, height: size }]}>
      <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateX: c1 }] }]}>
        <Svg width={size} height={size}>
          <CloudEl cx={cx - 8} cy={cx - 6} s={1.2} color="rgba(174,174,178,0.7)" />
        </Svg>
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateX: c2 }] }]}>
        <Svg width={size} height={size}>
          <CloudEl cx={cx + 10} cy={cx + 8} s={0.9} color="rgba(142,142,147,0.6)" />
        </Svg>
      </Animated.View>
    </View>
  );
}

function NightAnimation({ size }: { size: number }) {
  const stars = useRef(
    Array.from({ length: 10 }, () => ({
      x: Math.random() * size,
      y: Math.random() * size,
      r: 1 + Math.random() * 1.2,
      anim: new Animated.Value(Math.random()),
    }))
  ).current;

  useEffect(() => {
    const anims = stars.map((s) =>
      Animated.loop(Animated.sequence([
        Animated.timing(s.anim, { toValue: 0.15, duration: 900 + Math.random() * 1000, useNativeDriver: true }),
        Animated.timing(s.anim, { toValue: 1, duration: 900 + Math.random() * 1000, useNativeDriver: true }),
      ]))
    );
    anims.forEach((a) => a.start());
    return () => anims.forEach((a) => a.stop());
  }, [stars]);

  const cx = size / 2;
  return (
    <View style={[styles.box, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <Circle cx={cx} cy={cx} r={size * 0.15} fill="rgba(209,209,214,0.9)" />
        <Circle cx={cx - size * 0.05} cy={cx - size * 0.04} r={size * 0.12} fill="#000000" />
      </Svg>
      {stars.map((s, i) => (
        <Animated.View key={i} style={{
          position: "absolute", left: s.x, top: s.y,
          width: s.r * 2, height: s.r * 2, borderRadius: s.r,
          backgroundColor: "#FFFFFF", opacity: s.anim,
        }} />
      ))}
    </View>
  );
}

function WeatherAnimation({ weather, size = 120 }: WeatherAnimationProps) {
  switch (weather) {
    case "sunny": return <SunnyAnimation size={size} />;
    case "partly_cloudy": return <PartlyCloudyAnimation size={size} />;
    case "cloudy": return <CloudyAnimation size={size} />;
    case "night": return <NightAnimation size={size} />;
    default: return <SunnyAnimation size={size} />;
  }
}

export default memo(WeatherAnimation);

const styles = StyleSheet.create({
  box: { alignItems: "center", justifyContent: "center" },
});
