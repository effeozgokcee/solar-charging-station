import React, { useEffect, useRef, memo } from "react";
import { Animated, Easing, View } from "react-native";
import Svg, { Circle, Line, Rect, Path, ClipPath, Defs, G } from "react-native-svg";

interface IconProps {
  size?: number;
}

function SunnyIcon({ size = 28 }: IconProps) {
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

  const c = size / 2;
  const r = size * 0.2;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Circle cx={c} cy={c} r={r} fill="#FFD60A" />
      </Svg>
      <Animated.View style={{ position: "absolute", top: 0, left: 0, transform: [{ rotate: spin }] }}>
        <Svg width={size} height={size}>
          {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => {
            const rad = (a * Math.PI) / 180;
            return (
              <Line
                key={a}
                x1={c + Math.cos(rad) * (r + 2)}
                y1={c + Math.sin(rad) * (r + 2)}
                x2={c + Math.cos(rad) * (r + size * 0.18)}
                y2={c + Math.sin(rad) * (r + size * 0.18)}
                stroke="#FFD60A"
                strokeWidth={1.5}
                strokeLinecap="round"
              />
            );
          })}
        </Svg>
      </Animated.View>
    </View>
  );
}

function PartlyCloudyIcon({ size = 28 }: IconProps) {
  const s = size / 40;
  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        {/* Sun peeking from top-right */}
        <Circle cx={28 * s} cy={10 * s} r={7 * s} fill="#FFD60A" />
        {[0, 60, 120, 180, 240, 300].map((a) => {
          const rad = (a * Math.PI) / 180;
          return (
            <Line
              key={a}
              x1={28 * s + Math.cos(rad) * 9 * s}
              y1={10 * s + Math.sin(rad) * 9 * s}
              x2={28 * s + Math.cos(rad) * 12 * s}
              y2={10 * s + Math.sin(rad) * 12 * s}
              stroke="#FFD60A"
              strokeWidth={1}
              strokeLinecap="round"
            />
          );
        })}
        {/* Cloud shape */}
        <Circle cx={10 * s} cy={26 * s} r={8 * s} fill="#8E8E93" />
        <Circle cx={20 * s} cy={22 * s} r={10 * s} fill="#8E8E93" />
        <Circle cx={30 * s} cy={26 * s} r={8 * s} fill="#8E8E93" />
        <Rect x={10 * s} y={26 * s} width={20 * s} height={8 * s} fill="#8E8E93" rx={2 * s} />
      </Svg>
    </View>
  );
}

function CloudyIcon({ size = 28 }: IconProps) {
  const s = size / 40;
  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        {/* Back cloud (darker) */}
        <Circle cx={16 * s} cy={16 * s} r={7 * s} fill="#636366" />
        <Circle cx={25 * s} cy={13 * s} r={9 * s} fill="#636366" />
        <Circle cx={33 * s} cy={16 * s} r={7 * s} fill="#636366" />
        <Rect x={16 * s} y={16 * s} width={17 * s} height={6 * s} fill="#636366" rx={2 * s} />
        {/* Front cloud (lighter) */}
        <Circle cx={8 * s} cy={26 * s} r={7 * s} fill="#8E8E93" />
        <Circle cx={18 * s} cy={22 * s} r={9 * s} fill="#8E8E93" />
        <Circle cx={28 * s} cy={26 * s} r={7 * s} fill="#8E8E93" />
        <Rect x={8 * s} y={26 * s} width={20 * s} height={6 * s} fill="#8E8E93" rx={2 * s} />
      </Svg>
    </View>
  );
}

function NightIcon({ size = 28 }: IconProps) {
  const pulse = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1500, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.4, duration: 1500, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [pulse]);

  const s = size / 40;
  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        {/* Crescent moon */}
        <Path
          d="M 20 5 A 15 15 0 1 0 20 35 A 10 10 0 1 1 20 5 Z"
          fill="#E5E5EA"
          transform={`scale(${s}) translate(0, 0)`}
        />
      </Svg>
      {/* Twinkling stars */}
      {[
        { x: 30 * s, y: 8 * s },
        { x: 8 * s, y: 12 * s },
        { x: 34 * s, y: 24 * s },
      ].map((star, i) => (
        <Animated.View
          key={i}
          style={{
            position: "absolute",
            left: star.x - 1.5,
            top: star.y - 1.5,
            width: 3,
            height: 3,
            borderRadius: 1.5,
            backgroundColor: "#FFFFFF",
            opacity: pulse,
          }}
        />
      ))}
    </View>
  );
}

export { SunnyIcon, PartlyCloudyIcon, CloudyIcon, NightIcon };

const WeatherIconMap: Record<string, React.ComponentType<IconProps>> = {
  sunny: SunnyIcon,
  partly_cloudy: PartlyCloudyIcon,
  cloudy: CloudyIcon,
  night: NightIcon,
};

function WeatherIcon({ weather, size = 28 }: { weather: string; size?: number }) {
  const Comp = WeatherIconMap[weather] || SunnyIcon;
  return <Comp size={size} />;
}

export default memo(WeatherIcon);
