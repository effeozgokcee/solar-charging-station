import React, { useEffect, useRef, memo } from "react";
import { View, Animated, StyleSheet, Easing } from "react-native";
import Svg, { Circle, Line as SvgLine, Rect, Text as SvgText, Path } from "react-native-svg";

interface Props {
  netPower: number;
  solarWatts: number;
  phoneConnected: boolean;
}

function EnergyFlow({ netPower, solarWatts, phoneConnected }: Props) {
  const dotProgress = useRef(new Animated.Value(0)).current;
  const isFlowing = solarWatts > 0.1 || Math.abs(netPower) > 0.1;
  const isCharging = netPower > 0.1;

  useEffect(() => {
    if (isFlowing) {
      const anim = Animated.loop(
        Animated.timing(dotProgress, {
          toValue: 1,
          duration: 2000,
          easing: Easing.linear,
          useNativeDriver: false, // translateX from interpolation
        })
      );
      anim.start();
      return () => anim.stop();
    } else {
      dotProgress.setValue(0);
    }
  }, [isFlowing, dotProgress]);

  const w = 320;
  const h = 100;
  const nodeR = 28;
  const y = 38;
  const n1x = 50;
  const n2x = w / 2;
  const n3x = w - 50;

  const lineColor = isCharging ? "#FFD60A" : netPower < -0.1 ? "#FF453A" : "rgba(84,84,88,0.3)";

  const dotX = dotProgress.interpolate({
    inputRange: [0, 1],
    outputRange: isCharging ? [n1x + nodeR + 4, n2x - nodeR - 4] : [n2x + nodeR + 4, n3x - nodeR - 4],
  });

  return (
    <View style={styles.container}>
      <Svg width={w} height={h}>
        {/* Lines */}
        <SvgLine x1={n1x + nodeR} y1={y} x2={n2x - nodeR} y2={y}
          stroke={solarWatts > 0.1 ? "#FFD60A" : "rgba(84,84,88,0.2)"}
          strokeWidth={2} strokeDasharray="4,4" opacity={0.6} />
        {phoneConnected && (
          <SvgLine x1={n2x + nodeR} y1={y} x2={n3x - nodeR} y2={y}
            stroke={lineColor} strokeWidth={2} strokeDasharray="4,4" opacity={0.6} />
        )}

        {/* Node 1: Solar */}
        <Circle cx={n1x} cy={y} r={nodeR} fill="#1C1C1E" stroke="rgba(84,84,88,0.3)" strokeWidth={1} />
        <SvgText x={n1x} y={y + 5} fill="#FFD60A" fontSize={22} textAnchor="middle">{"\u2600"}</SvgText>
        <SvgText x={n1x} y={y + nodeR + 16} fill="rgba(235,235,245,0.3)" fontSize={11} textAnchor="middle">Panel</SvgText>

        {/* Node 2: Battery */}
        <Circle cx={n2x} cy={y} r={nodeR} fill="#1C1C1E" stroke="rgba(84,84,88,0.3)" strokeWidth={1} />
        <SvgText x={n2x} y={y + 5} fill="#30D158" fontSize={22} textAnchor="middle">{"\uD83D\uDD0B"}</SvgText>
        <SvgText x={n2x} y={y + nodeR + 16} fill="rgba(235,235,245,0.3)" fontSize={11} textAnchor="middle">Battery</SvgText>

        {/* Node 3: Phone */}
        <Circle cx={n3x} cy={y} r={nodeR} fill="#1C1C1E"
          stroke={phoneConnected ? "rgba(84,84,88,0.3)" : "rgba(84,84,88,0.1)"} strokeWidth={1} />
        <SvgText x={n3x} y={y + 5} fill={phoneConnected ? "#0A84FF" : "rgba(235,235,245,0.15)"}
          fontSize={22} textAnchor="middle">{"\uD83D\uDCF1"}</SvgText>
        <SvgText x={n3x} y={y + nodeR + 16} fill="rgba(235,235,245,0.3)" fontSize={11} textAnchor="middle">
          {phoneConnected ? "Phone" : "---"}
        </SvgText>
      </Svg>

      {/* Animated dot */}
      {isFlowing && (
        <Animated.View style={[styles.dot, {
          backgroundColor: lineColor,
          shadowColor: lineColor,
          transform: [{ translateX: dotX }, { translateY: new Animated.Value(y - 5) }],
        }]} />
      )}
    </View>
  );
}

export default memo(EnergyFlow);

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#1C1C1E",
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 4,
    marginVertical: 8,
  },
  dot: {
    position: "absolute",
    width: 8,
    height: 8,
    borderRadius: 4,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 6,
  },
});
