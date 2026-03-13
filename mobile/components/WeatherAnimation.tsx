import React, { useEffect, useRef, memo } from "react";
import { View, Animated, StyleSheet, Easing } from "react-native";
import Svg, { Circle, Line, Ellipse, Rect } from "react-native-svg";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

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
        duration: 8000,
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

  const center = size / 2;
  const sunR = size * 0.18;
  const rayLen = size * 0.12;
  const rayDist = size * 0.32;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <Circle cx={center} cy={center} r={sunR} fill="#F5A623" opacity={0.3} />
        <Circle cx={center} cy={center} r={sunR * 0.85} fill="#F5A623" opacity={0.6} />
        <Circle cx={center} cy={center} r={sunR * 0.7} fill="#FFD93D" />
      </Svg>
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { transform: [{ rotate: spin }] },
        ]}
      >
        <Svg width={size} height={size}>
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
            const rad = (angle * Math.PI) / 180;
            const x1 = center + Math.cos(rad) * (sunR + 4);
            const y1 = center + Math.sin(rad) * (sunR + 4);
            const x2 = center + Math.cos(rad) * (sunR + rayLen);
            const y2 = center + Math.sin(rad) * (sunR + rayLen);
            return (
              <Line
                key={angle}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="#F5A623"
                strokeWidth={2.5}
                strokeLinecap="round"
              />
            );
          })}
        </Svg>
      </Animated.View>
    </View>
  );
}

function CloudShape({ cx, cy, scale, color }: { cx: number; cy: number; scale: number; color: string }) {
  return (
    <>
      <Ellipse cx={cx} cy={cy} rx={20 * scale} ry={14 * scale} fill={color} />
      <Ellipse cx={cx - 14 * scale} cy={cy + 4 * scale} rx={14 * scale} ry={10 * scale} fill={color} />
      <Ellipse cx={cx + 14 * scale} cy={cy + 4 * scale} rx={16 * scale} ry={10 * scale} fill={color} />
      <Rect
        x={cx - 20 * scale}
        y={cy}
        width={40 * scale}
        height={12 * scale}
        fill={color}
        rx={4}
      />
    </>
  );
}

function PartlyCloudyAnimation({ size }: { size: number }) {
  const cloudX = useRef(new Animated.Value(0)).current;
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const cloudAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(cloudX, { toValue: 8, duration: 3000, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
        Animated.timing(cloudX, { toValue: -8, duration: 3000, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
      ])
    );
    const sunAnim = Animated.loop(
      Animated.timing(rotation, { toValue: 1, duration: 10000, easing: Easing.linear, useNativeDriver: true })
    );
    cloudAnim.start();
    sunAnim.start();
    return () => { cloudAnim.stop(); sunAnim.stop(); };
  }, [cloudX, rotation]);

  const spin = rotation.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });
  const center = size / 2;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ rotate: spin }] }]}>
        <Svg width={size} height={size}>
          <Circle cx={center - 10} cy={center - 12} r={size * 0.13} fill="#FFD93D" />
          {[0, 60, 120, 180, 240, 300].map((angle) => {
            const rad = (angle * Math.PI) / 180;
            const r = size * 0.13;
            return (
              <Line
                key={angle}
                x1={center - 10 + Math.cos(rad) * (r + 3)}
                y1={center - 12 + Math.sin(rad) * (r + 3)}
                x2={center - 10 + Math.cos(rad) * (r + 8)}
                y2={center - 12 + Math.sin(rad) * (r + 8)}
                stroke="#F5A623"
                strokeWidth={2}
                strokeLinecap="round"
              />
            );
          })}
        </Svg>
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateX: cloudX }] }]}>
        <Svg width={size} height={size}>
          <CloudShape cx={center + 8} cy={center + 8} scale={1.2} color="rgba(255,255,255,0.9)" />
        </Svg>
      </Animated.View>
    </View>
  );
}

function CloudyAnimation({ size }: { size: number }) {
  const cloud1X = useRef(new Animated.Value(0)).current;
  const cloud2X = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const a1 = Animated.loop(
      Animated.sequence([
        Animated.timing(cloud1X, { toValue: 10, duration: 4000, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
        Animated.timing(cloud1X, { toValue: -10, duration: 4000, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
      ])
    );
    const a2 = Animated.loop(
      Animated.sequence([
        Animated.timing(cloud2X, { toValue: -8, duration: 5000, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
        Animated.timing(cloud2X, { toValue: 8, duration: 5000, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
      ])
    );
    a1.start(); a2.start();
    return () => { a1.stop(); a2.stop(); };
  }, [cloud1X, cloud2X]);

  const center = size / 2;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateX: cloud1X }] }]}>
        <Svg width={size} height={size}>
          <CloudShape cx={center - 10} cy={center - 8} scale={1.3} color="#8892A4" />
        </Svg>
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateX: cloud2X }] }]}>
        <Svg width={size} height={size}>
          <CloudShape cx={center + 12} cy={center + 10} scale={1.0} color="#6B7A8D" />
        </Svg>
      </Animated.View>
    </View>
  );
}

function NightAnimation({ size }: { size: number }) {
  const stars = useRef(
    Array.from({ length: 12 }, () => ({
      x: Math.random() * size,
      y: Math.random() * size,
      r: 1 + Math.random() * 1.5,
      anim: new Animated.Value(Math.random()),
    }))
  ).current;

  useEffect(() => {
    const anims = stars.map((star) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(star.anim, { toValue: 0.2, duration: 800 + Math.random() * 1200, useNativeDriver: true }),
          Animated.timing(star.anim, { toValue: 1, duration: 800 + Math.random() * 1200, useNativeDriver: true }),
        ])
      )
    );
    anims.forEach((a) => a.start());
    return () => anims.forEach((a) => a.stop());
  }, [stars]);

  const center = size / 2;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <Circle cx={center} cy={center} r={size * 0.16} fill="#C5CAE9" opacity={0.9} />
        <Circle cx={center - size * 0.06} cy={center - size * 0.04} r={size * 0.13} fill="#1A1A2E" />
      </Svg>
      {stars.map((star, i) => (
        <Animated.View
          key={i}
          style={{
            position: "absolute",
            left: star.x,
            top: star.y,
            width: star.r * 2,
            height: star.r * 2,
            borderRadius: star.r,
            backgroundColor: "#FFFFFF",
            opacity: star.anim,
          }}
        />
      ))}
    </View>
  );
}

function WeatherAnimation({ weather, size = 120 }: WeatherAnimationProps) {
  switch (weather) {
    case "sunny":
      return <SunnyAnimation size={size} />;
    case "partly_cloudy":
      return <PartlyCloudyAnimation size={size} />;
    case "cloudy":
      return <CloudyAnimation size={size} />;
    case "night":
      return <NightAnimation size={size} />;
    default:
      return <SunnyAnimation size={size} />;
  }
}

export default memo(WeatherAnimation);

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
});
