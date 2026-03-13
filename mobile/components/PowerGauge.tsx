import React from "react";
import { View, StyleSheet } from "react-native";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";

interface PowerGaugeProps {
  label: string;
  watts: number;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  color: string;
  subtitle?: string;
}

export default function PowerGauge({ label, watts, icon, color, subtitle }: PowerGaugeProps) {
  return (
    <View style={[styles.card, { borderLeftColor: color }]}>
      <View style={styles.row}>
        <MaterialCommunityIcons name={icon} size={28} color={color} />
        <View style={styles.textContainer}>
          <Text style={styles.label}>{label}</Text>
          <Text style={[styles.value, { color }]}>{watts.toFixed(1)} W</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#16213E",
    borderRadius: 12,
    padding: 16,
    marginVertical: 6,
    borderLeftWidth: 4,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  textContainer: {
    marginLeft: 12,
    flex: 1,
  },
  label: {
    color: "#AAAAAA",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  value: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 2,
  },
  subtitle: {
    color: "#888888",
    fontSize: 11,
    marginTop: 2,
  },
});
