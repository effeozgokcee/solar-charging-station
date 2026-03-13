import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { Text } from "react-native-paper";

interface WeatherOption {
  key: string;
  label: string;
  emoji: string;
}

const OPTIONS: WeatherOption[] = [
  { key: "sunny", label: "Gunesli", emoji: "\u2600\uFE0F" },
  { key: "partly_cloudy", label: "Parcali", emoji: "\u26C5" },
  { key: "cloudy", label: "Bulutlu", emoji: "\u2601\uFE0F" },
  { key: "night", label: "Gece", emoji: "\uD83C\uDF19" },
];

interface WeatherSelectorProps {
  selected: string;
  onSelect: (weather: string) => void;
}

export default function WeatherSelector({ selected, onSelect }: WeatherSelectorProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hava Durumu</Text>
      <View style={styles.row}>
        {OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.key}
            style={[styles.button, selected === opt.key && styles.selected]}
            onPress={() => onSelect(opt.key)}
          >
            <Text style={styles.emoji}>{opt.emoji}</Text>
            <Text style={[styles.label, selected === opt.key && styles.selectedLabel]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  title: {
    color: "#AAAAAA",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  button: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    marginHorizontal: 4,
    backgroundColor: "#16213E",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "transparent",
  },
  selected: {
    borderColor: "#F5A623",
    backgroundColor: "#1E2D50",
  },
  emoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  label: {
    color: "#AAAAAA",
    fontSize: 11,
  },
  selectedLabel: {
    color: "#F5A623",
    fontWeight: "bold",
  },
});
