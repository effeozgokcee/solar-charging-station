import React, { useEffect, useRef, memo } from "react";
import { View, Animated, StyleSheet, Easing } from "react-native";
import Svg, {
  Rect,
  Line as SvgLine,
  Circle,
  Path,
  Text as SvgText,
  Polygon,
} from "react-native-svg";

interface EnergyFlowProps {
  netPower: number;
  solarWatts: number;
  phoneConnected: boolean;
}

function EnergyFlow({ netPower, solarWatts, phoneConnected }: EnergyFlowProps) {
  const dashOffset = useRef(new Animated.Value(0)).current;
  const dotPos = useRef(new Animated.Value(0)).current;
  const isFlowing = Math.abs(netPower) > 0.1 || solarWatts > 0.1;
  const isCharging = netPower > 0.1;

  useEffect(() => {
    if (isFlowing) {
      const direction = isCharging ? -1 : 1;
      const dashAnim = Animated.loop(
        Animated.timing(dashOffset, {
          toValue: direction * 20,
          duration: 600,
          easing: Easing.linear,
          useNativeDriver: false,
        })
      );
      const dotAnim = Animated.loop(
        Animated.timing(dotPos, {
          toValue: 1,
          duration: 1500,
          easing: Easing.linear,
          useNativeDriver: false,
        })
      );
      dashAnim.start();
      dotAnim.start();
      return () => { dashAnim.stop(); dotAnim.stop(); };
    } else {
      dashOffset.setValue(0);
      dotPos.setValue(0);
    }
  }, [isFlowing, isCharging, dashOffset, dotPos]);

  const width = 320;
  const height = 80;
  const panelX = 30;
  const batteryX = width / 2 - 12;
  const phoneX = width - 55;
  const lineY = 40;
  const line1Start = panelX + 35;
  const line1End = batteryX - 5;
  const line2Start = batteryX + 30;
  const line2End = phoneX - 5;

  const flowColor = isCharging ? "#F5A623" : netPower < -0.1 ? "#FF4444" : "#3A4A5C";

  const dotX = dotPos.interpolate({
    inputRange: [0, 0.5, 0.5001, 1],
    outputRange: isCharging
      ? [line1Start, line1End, line2Start, line2End]
      : [line2End, line2Start, line1End, line1Start],
  });

  return (
    <View style={styles.container}>
      <Svg width={width} height={height}>
        {/* Solar Panel Icon */}
        <Rect x={panelX - 5} y={lineY - 18} width={36} height={36} rx={4} fill="#16213E" stroke="#F5A623" strokeWidth={1.5} />
        <SvgLine x1={panelX + 1} y1={lineY - 12} x2={panelX + 25} y2={lineY - 12} stroke="#F5A623" strokeWidth={1} opacity={0.5} />
        <SvgLine x1={panelX + 1} y1={lineY - 4} x2={panelX + 25} y2={lineY - 4} stroke="#F5A623" strokeWidth={1} opacity={0.5} />
        <SvgLine x1={panelX + 1} y1={lineY + 4} x2={panelX + 25} y2={lineY + 4} stroke="#F5A623" strokeWidth={1} opacity={0.5} />
        <SvgLine x1={panelX + 1} y1={lineY + 12} x2={panelX + 25} y2={lineY + 12} stroke="#F5A623" strokeWidth={1} opacity={0.5} />
        <SvgLine x1={panelX + 9} y1={lineY - 16} x2={panelX + 9} y2={lineY + 16} stroke="#F5A623" strokeWidth={1} opacity={0.5} />
        <SvgLine x1={panelX + 18} y1={lineY - 16} x2={panelX + 18} y2={lineY + 16} stroke="#F5A623" strokeWidth={1} opacity={0.5} />
        <SvgText x={panelX + 13} y={lineY + 30} fill="#8892A4" fontSize={8} textAnchor="middle">Panel</SvgText>

        {/* Flow Line 1: Panel → Battery */}
        <SvgLine
          x1={line1Start}
          y1={lineY}
          x2={line1End}
          y2={lineY}
          stroke={solarWatts > 0.1 ? "#F5A623" : "#3A4A5C"}
          strokeWidth={2}
          strokeDasharray="6,4"
          opacity={0.7}
        />
        {solarWatts > 0.1 && (
          <Polygon
            points={`${line1End - 2},${lineY - 5} ${line1End + 5},${lineY} ${line1End - 2},${lineY + 5}`}
            fill="#F5A623"
          />
        )}

        {/* Battery Icon */}
        <Rect x={batteryX} y={lineY - 14} width={24} height={28} rx={3} fill="none" stroke="#00C851" strokeWidth={1.5} />
        <Rect x={batteryX + 8} y={lineY - 18} width={8} height={5} rx={2} fill="#3A4A5C" />
        <Rect x={batteryX + 3} y={lineY + 2} width={18} height={10} rx={2} fill="#00C851" opacity={0.6} />
        <SvgText x={batteryX + 12} y={lineY + 28} fill="#8892A4" fontSize={8} textAnchor="middle">Batarya</SvgText>

        {/* Flow Line 2: Battery → Phone */}
        {phoneConnected && (
          <>
            <SvgLine
              x1={line2Start}
              y1={lineY}
              x2={line2End}
              y2={lineY}
              stroke={flowColor}
              strokeWidth={2}
              strokeDasharray="6,4"
              opacity={0.7}
            />
            <Polygon
              points={`${line2End - 2},${lineY - 5} ${line2End + 5},${lineY} ${line2End - 2},${lineY + 5}`}
              fill={flowColor}
            />
          </>
        )}

        {/* Phone Icon */}
        {phoneConnected && (
          <>
            <Rect x={phoneX} y={lineY - 16} width={22} height={32} rx={4} fill="none" stroke="#2196F3" strokeWidth={1.5} />
            <SvgLine x1={phoneX + 7} y1={lineY + 12} x2={phoneX + 15} y2={lineY + 12} stroke="#2196F3" strokeWidth={1.5} strokeLinecap="round" />
            <SvgText x={phoneX + 11} y={lineY + 28} fill="#8892A4" fontSize={8} textAnchor="middle">Telefon</SvgText>
          </>
        )}
        {!phoneConnected && (
          <SvgText x={phoneX + 11} y={lineY + 5} fill="#3A4A5C" fontSize={9} textAnchor="middle">Bagli degil</SvgText>
        )}
      </Svg>

      {isFlowing && (
        <Animated.View
          style={[
            styles.flowDot,
            {
              backgroundColor: flowColor,
              shadowColor: flowColor,
              transform: [
                { translateX: dotX },
                { translateY: new Animated.Value(lineY - 4) },
              ],
            },
          ]}
        />
      )}
    </View>
  );
}

export default memo(EnergyFlow);

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#16213E",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 4,
    marginVertical: 8,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  flowDot: {
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
