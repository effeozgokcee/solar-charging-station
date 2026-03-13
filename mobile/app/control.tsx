import React, { useState } from "react";
import { ScrollView, View, StyleSheet, Alert } from "react-native";
import { Text, Switch, Button, Snackbar } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import WeatherSelector from "../components/WeatherSelector";
import { useSimulation } from "../hooks/useSimulation";

const SPEED_OPTIONS = [1, 5, 10, 60];

export default function ControlScreen() {
  const { status, sendControl, resetSimulation } = useSimulation();
  const [weather, setWeather] = useState(status?.weather || "sunny");
  const [phoneConnected, setPhoneConnected] = useState(status?.phone_connected || false);
  const [speed, setSpeed] = useState(1);
  const [snackVisible, setSnackVisible] = useState(false);
  const [snackMessage, setSnackMessage] = useState("");

  const showToast = (msg: string) => {
    setSnackMessage(msg);
    setSnackVisible(true);
  };

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
    try {
      await sendControl({ phone_connected: connected });
      showToast(connected ? "Telefon baglandi" : "Telefon ayrildi");
    } catch {
      showToast("Hata: baglanti basarisiz");
    }
  };

  const handleSpeed = async (s: number) => {
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
              showToast("Simulasyon sifirlandi");
            } catch {
              showToast("Hata: sifirlama basarisiz");
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <WeatherSelector selected={weather} onSelect={handleWeather} />

      <View style={styles.card}>
        <View style={styles.switchRow}>
          <View style={styles.switchLabel}>
            <MaterialCommunityIcons name="cellphone" size={24} color="#2196F3" />
            <Text style={styles.switchText}>Telefon Baglantisi</Text>
          </View>
          <Switch
            value={phoneConnected}
            onValueChange={handlePhone}
            color="#F5A623"
          />
        </View>
        <Text style={styles.switchHint}>
          {phoneConnected ? "Telefon sarj ediliyor (5W)" : "Telefon bagli degil"}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Simulasyon Hizi</Text>
        <View style={styles.speedRow}>
          {SPEED_OPTIONS.map((s) => (
            <Button
              key={s}
              mode={speed === s ? "contained" : "outlined"}
              onPress={() => handleSpeed(s)}
              style={[styles.speedButton, speed === s && styles.speedButtonActive]}
              labelStyle={[styles.speedLabel, speed === s && styles.speedLabelActive]}
              compact
            >
              {s}x
            </Button>
          ))}
        </View>
        <Text style={styles.switchHint}>
          Her 2 saniyede {speed} dakika simulasyon ilerler
        </Text>
      </View>

      {status && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Mevcut Durum</Text>
          <View style={styles.statusGrid}>
            <StatusItem label="Saat" value={status.time} />
            <StatusItem label="Batarya" value={`${status.battery_percent}%`} />
            <StatusItem label="Gunes" value={`${status.solar_watts}W`} />
            <StatusItem label="Tuketim" value={`${status.consumption_watts}W`} />
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

function StatusItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statusItem}>
      <Text style={styles.statusLabel}>{label}</Text>
      <Text style={styles.statusValue}>{value}</Text>
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
    color: "#AAAAAA",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 12,
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
    color: "#666666",
    fontSize: 12,
    marginTop: 8,
  },
  speedRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  speedButton: {
    flex: 1,
    borderColor: "#F5A623",
  },
  speedButtonActive: {
    backgroundColor: "#F5A623",
  },
  speedLabel: {
    color: "#F5A623",
    fontSize: 14,
  },
  speedLabelActive: {
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
    color: "#AAAAAA",
    fontSize: 11,
    textTransform: "uppercase",
  },
  statusValue: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 2,
  },
  resetButton: {
    marginTop: 16,
    borderColor: "#F44336",
  },
  resetLabel: {
    color: "#F44336",
  },
  snackbar: {
    backgroundColor: "#16213E",
  },
});
