import React, { useState, useRef, useCallback } from "react";
import {
  ScrollView,
  View,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Animated,
  Easing,
} from "react-native";
import { Text, Switch, Button, Snackbar } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import WeatherAnimation from "../components/WeatherAnimation";
import { useSimulation } from "../hooks/useSimulation";

const SPEED_OPTIONS = [1, 5, 10, 60];

const WEATHER_OPTIONS = [
  { key: "sunny", label: "Gunesli" },
  { key: "partly_cloudy", label: "Parcali" },
  { key: "cloudy", label: "Bulutlu" },
  { key: "night", label: "Gece" },
];

function AnimatedButton({
  children,
  onPress,
  selected,
  style,
}: {
  children: React.ReactNode;
  onPress: () => void;
  selected: boolean;
  style?: object;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.timing(scaleAnim, {
      toValue: 0.95,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.05,
        duration: 80,
        useNativeDriver: true,
        easing: Easing.out(Easing.back(2)),
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, style]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
      >
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function ControlScreen() {
  const { status, sendControl, resetSimulation } = useSimulation();
  const [weather, setWeather] = useState(status?.weather || "sunny");
  const [phoneConnected, setPhoneConnected] = useState(status?.phone_connected || false);
  const [speed, setSpeed] = useState(1);
  const [snackVisible, setSnackVisible] = useState(false);
  const [snackMessage, setSnackMessage] = useState("");

  const phoneSlide = useRef(new Animated.Value(phoneConnected ? 1 : 0)).current;
  const speedIndicator = useRef(new Animated.Value(0)).current;

  const showToast = useCallback((msg: string) => {
    setSnackMessage(msg);
    setSnackVisible(true);
  }, []);

  const handleWeather = async (w: string) => {
    setWeather(w);
    try {
      await sendControl({ weather: w });
      showToast("Hava durumu guncellendi");
    } catch {
      showToast("Hata: baglanti basarisiz");
    }
  };

  const handlePhone = async (connected: boolean) => {
    setPhoneConnected(connected);
    Animated.spring(phoneSlide, {
      toValue: connected ? 1 : 0,
      useNativeDriver: true,
      tension: 40,
      friction: 7,
    }).start();
    try {
      await sendControl({ phone_connected: connected });
      showToast(connected ? "Telefon baglandi" : "Telefon ayrildi");
    } catch {
      showToast("Hata: baglanti basarisiz");
    }
  };

  const handleSpeed = async (s: number) => {
    const idx = SPEED_OPTIONS.indexOf(s);
    Animated.spring(speedIndicator, {
      toValue: idx,
      useNativeDriver: true,
      tension: 50,
      friction: 8,
    }).start();
    setSpeed(s);
    try {
      await sendControl({ speed: s });
      showToast(`Hiz: ${s}x`);
    } catch {
      showToast("Hata: baglanti basarisiz");
    }
  };

  const handleReset = () => {
    Alert.alert(
      "Simulasyonu Sifirla",
      "Tum simulasyon verilerini sifirlamak istediginizden emin misiniz?",
      [
        { text: "Iptal", style: "cancel" },
        {
          text: "Sifirla",
          style: "destructive",
          onPress: async () => {
            try {
              await resetSimulation();
              setWeather("sunny");
              setPhoneConnected(false);
              setSpeed(1);
              phoneSlide.setValue(0);
              speedIndicator.setValue(0);
              showToast("Simulasyon sifirlandi");
            } catch {
              showToast("Hata: sifirlama basarisiz");
            }
          },
        },
      ]
    );
  };

  const phoneIconTranslate = phoneSlide.interpolate({
    inputRange: [0, 1],
    outputRange: [-20, 0],
  });
  const phoneIconOpacity = phoneSlide.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Weather Preview */}
      <View style={styles.weatherPreview}>
        <WeatherAnimation weather={weather} size={80} />
      </View>

      {/* Weather Selector */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Hava Durumu</Text>
        <View style={styles.weatherRow}>
          {WEATHER_OPTIONS.map((opt) => (
            <AnimatedButton
              key={opt.key}
              onPress={() => handleWeather(opt.key)}
              selected={weather === opt.key}
              style={{ flex: 1 }}
            >
              <View style={[styles.weatherBtn, weather === opt.key && styles.weatherBtnSelected]}>
                <WeatherAnimation weather={opt.key} size={36} />
                <Text style={[styles.weatherBtnLabel, weather === opt.key && styles.weatherBtnLabelSelected]}>
                  {opt.label}
                </Text>
              </View>
            </AnimatedButton>
          ))}
        </View>
      </View>

      {/* Phone Toggle */}
      <View style={styles.card}>
        <View style={styles.switchRow}>
          <View style={styles.switchLabel}>
            <Animated.View
              style={{
                transform: [{ translateX: phoneIconTranslate }],
                opacity: phoneIconOpacity,
              }}
            >
              <MaterialCommunityIcons name="cellphone" size={24} color="#2196F3" />
            </Animated.View>
            <Text style={styles.switchText}>Telefon Baglantisi</Text>
          </View>
          <Switch value={phoneConnected} onValueChange={handlePhone} color="#F5A623" />
        </View>
        <Text style={styles.switchHint}>
          {phoneConnected ? "Telefon sarj ediliyor (5W)" : "Telefon bagli degil"}
        </Text>
      </View>

      {/* Speed Selector */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Simulasyon Hizi</Text>
        <View style={styles.speedRow}>
          {SPEED_OPTIONS.map((s) => (
            <AnimatedButton
              key={s}
              onPress={() => handleSpeed(s)}
              selected={speed === s}
              style={{ flex: 1 }}
            >
              <View style={[styles.speedBtn, speed === s && styles.speedBtnActive]}>
                <Text style={[styles.speedBtnText, speed === s && styles.speedBtnTextActive]}>
                  {s}x
                </Text>
              </View>
            </AnimatedButton>
          ))}
        </View>
        <Text style={styles.switchHint}>Her 2 saniyede {speed} dakika simulasyon ilerler</Text>
      </View>

      {/* Status */}
      {status && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Mevcut Durum</Text>
          <View style={styles.statusGrid}>
            <StatusItem label="Saat" value={status.time} color="#F5A623" />
            <StatusItem label="Batarya" value={`${status.battery_percent}%`} color="#00C851" />
            <StatusItem label="Gunes" value={`${status.solar_watts}W`} color="#F5A623" />
            <StatusItem label="Tuketim" value={`${status.consumption_watts}W`} color="#2196F3" />
          </View>
        </View>
      )}

      <Button
        mode="outlined"
        onPress={handleReset}
        style={styles.resetButton}
        labelStyle={styles.resetLabel}
        icon="restart"
      >
        Simulasyonu Sifirla
      </Button>

      <Snackbar
        visible={snackVisible}
        onDismiss={() => setSnackVisible(false)}
        duration={2000}
        style={styles.snackbar}
      >
        {snackMessage}
      </Snackbar>
    </ScrollView>
  );
}

function StatusItem({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={styles.statusItem}>
      <Text style={styles.statusLabel}>{label}</Text>
      <Text style={[styles.statusValue, { color }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1A1A2E",
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  weatherPreview: {
    alignItems: "center",
    marginBottom: 8,
  },
  card: {
    backgroundColor: "#16213E",
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  sectionTitle: {
    color: "#8892A4",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 12,
  },
  weatherRow: {
    flexDirection: "row",
    gap: 6,
  },
  weatherBtn: {
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "transparent",
    backgroundColor: "#1A1A2E",
  },
  weatherBtnSelected: {
    borderColor: "#F5A623",
    backgroundColor: "#1E2D50",
  },
  weatherBtnLabel: {
    color: "#8892A4",
    fontSize: 10,
    marginTop: 4,
  },
  weatherBtnLabelSelected: {
    color: "#F5A623",
    fontWeight: "bold",
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  switchLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  switchText: {
    color: "#FFFFFF",
    fontSize: 16,
  },
  switchHint: {
    color: "#3A4A5C",
    fontSize: 12,
    marginTop: 8,
  },
  speedRow: {
    flexDirection: "row",
    gap: 8,
  },
  speedBtn: {
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#F5A623",
    alignItems: "center",
  },
  speedBtnActive: {
    backgroundColor: "#F5A623",
  },
  speedBtnText: {
    color: "#F5A623",
    fontSize: 15,
    fontWeight: "bold",
  },
  speedBtnTextActive: {
    color: "#1A1A2E",
  },
  statusGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  statusItem: {
    width: "50%",
    paddingVertical: 8,
  },
  statusLabel: {
    color: "#8892A4",
    fontSize: 11,
    textTransform: "uppercase",
  },
  statusValue: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 2,
  },
  resetButton: {
    marginTop: 16,
    borderColor: "#FF4444",
  },
  resetLabel: {
    color: "#FF4444",
  },
  snackbar: {
    backgroundColor: "#16213E",
  },
});
