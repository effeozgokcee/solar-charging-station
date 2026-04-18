import React, { useEffect, useRef, memo } from "react";
import { View, Animated, StyleSheet, Easing, Dimensions } from "react-native";
import Svg, { Circle, Line as SvgLine, Text as SvgText } from "react-native-svg";

const SCREEN_W = Dimensions.get("window").width;

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
        Animated.timing(dotProgress, { toValue: 1, duration: 2000, easing: Easing.linear, useNativeDriver: false })
      );
      anim.start();
      return () => anim.stop();
    } else {
      dotProgress.setValue(0);
    }
  }, [isFlowing, dotProgress]);

  const w = SCREEN_W - 40;
  const h = 90;
  const nodeR = Math.min(26, w * 0.08);
  const y = 36;
  const n1x = w * 0.15;
  const n2x = w / 2;
  const n3x = w * 0.85;
  const fontSize = Math.min(20, w * 0.055);

  const lineColor = isCharging ? "#FFD60A" : netPower < -0.1 ? "#FF453A" : "rgba(84,84,88,0.3)";

  const dotX = dotProgress.interpolate({
    inputRange: [0, 1],
    outputRange: isCharging ? [n1x + nodeR + 4, n2x - nodeR - 4] : [n2x + nodeR + 4, n3x - nodeR - 4],
  });

  return (
    <View style={styles.container}>
      <Svg width={w} height={h}>
        <SvgLine x1={n1x + nodeR} y1={y} x2={n2x - nodeR} y2={y}
          stroke={solarWatts > 0.1 ? "#FFD60A" : "rgba(84,84,88,0.2)"}
          strokeWidth={2} strokeDasharray="4,4" opacity={0.6} />
        {phoneConnected && (
          <SvgLine x1={n2x + nodeR} y1={y} x2={n3x - nodeR} y2={y}
            stroke={lineColor} strokeWidth={2} strokeDasharray="4,4" opacity={0.6} />
        )}
        <Circle cx={n1x} cy={y} r={nodeR} fill="#1C1C1E" stroke="rgba(84,84,88,0.3)" strokeWidth={1} />
        <SvgText x={n1x} y={y + 5} fill="#FFD60A" fontSize={fontSize} textAnchor="middle">{"\u2600"}</SvgText>
        <SvgText x={n1x} y={y + nodeR + 14} fill="rgba(235,235,245,0.3)" fontSize={10} textAnchor="middle">Panel</SvgText>

        <Circle cx={n2x} cy={y} r={nodeR} fill="#1C1C1E" stroke="rgba(84,84,88,0.3)" strokeWidth={1} />
        <SvgText x={n2x} y={y + 5} fill="#30D158" fontSize={fontSize} textAnchor="middle">{"\uD83D\uDD0B"}</SvgText>
        <SvgText x={n2x} y={y + nodeR + 14} fill="rgba(235,235,245,0.3)" fontSize={10} textAnchor="middle">Battery</SvgText>

        <Circle cx={n3x} cy={y} r={nodeR} fill="#1C1C1E"
          stroke={phoneConnected ? "rgba(84,84,88,0.3)" : "rgba(84,84,88,0.1)"} strokeWidth={1} />
        <SvgText x={n3x} y={y + 5} fill={phoneConnected ? "#0A84FF" : "rgba(235,235,245,0.15)"}
          fontSize={fontSize} textAnchor="middle">{"\uD83D\uDCF1"}</SvgText>
        <SvgText x={n3x} y={y + nodeR + 14} fill="rgba(235,235,245,0.3)" fontSize={10} textAnchor="middle">
          {phoneConnected ? "Device" : "---"}
        </SvgText>
      </Svg>

      {isFlowing && (
        <Animated.View style={[styles.dot, {
          backgroundColor: lineColor, shadowColor: lineColor,
          transform: [{ translateX: dotX }, { translateY: new Animated.Value(y - 5) }],
        }]} />
      )}
    </View>
  );
}

export default memo(EnergyFlow);

const styles = StyleSheet.create({
  container: {
    backgroundColor: "rgba(28,28,30,0.8)", borderRadius: 20,
    paddingVertical: 14, paddingHorizontal: 4, marginBottom: 10,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
  },
  dot: {
    position: "absolute", width: 8, height: 8, borderRadius: 4,
    shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 6, elevation: 6,
  },
});
