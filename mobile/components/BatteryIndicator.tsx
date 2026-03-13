import React, { useEffect, useRef } from "react";
import { View, Animated, StyleSheet } from "react-native";
import { Text } from "react-native-paper";

interface BatteryIndicatorProps {
  percent: number;
  chargingStatus: "charging" | "discharging" | "idle";
}

function getBatteryColor(percent: number): string {
  if (percent > 50) return "#4CAF50";
  if (percent > 20) return "#FFC107";
  return "#F44336";
}

export default function BatteryIndicator({ percent, chargingStatus }: BatteryIndicatorProps) {
  const animatedWidth = useRef(new Animated.Value(percent)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(animatedWidth, {
      toValue: percent,
      duration: 500,
      useNativeDriver: false,
    }).start();
  }, [percent, animatedWidth]);

  useEffect(() => {
    if (chargingStatus === "charging") {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 0.6, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [chargingStatus, pulseAnim]);

  const color = getBatteryColor(percent);
  const fillWidth = animatedWidth.interpolate({
    inputRange: [0, 100],
    outputRange: ["0%", "100%"],
    extrapolate: "clamp",
  });

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.batteryBody, { opacity: pulseAnim }]}>
        <View style={styles.batteryTip} />
        <View style={styles.batteryOuter}>
          <Animated.View style={[styles.batteryFill, { width: fillWidth, backgroundColor: color }]} />
        </View>
      </Animated.View>
      <Text style={[styles.percentText, { color }]}>{percent.toFixed(1)}%</Text>
      <Text style={styles.statusText}>
        {chargingStatus === "charging" ? "Sarj Ediliyor" : chargingStatus === "discharging" ? "Desarj Oluyor" : "Bosta"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingVertical: 16,
  },
  batteryBody: {
    flexDirection: "row",
    alignItems: "center",
  },
  batteryOuter: {
    width: 200,
    height: 80,
    borderWidth: 3,
    borderColor: "#FFFFFF",
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#2A2A4A",
  },
  batteryTip: {
    position: "absolute",
    right: -10,
    width: 8,
    height: 30,
    backgroundColor: "#FFFFFF",
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
  },
  batteryFill: {
    height: "100%",
    borderRadius: 4,
  },
  percentText: {
    fontSize: 36,
    fontWeight: "bold",
    marginTop: 12,
  },
  statusText: {
    color: "#AAAAAA",
    fontSize: 14,
    marginTop: 4,
  },
});
