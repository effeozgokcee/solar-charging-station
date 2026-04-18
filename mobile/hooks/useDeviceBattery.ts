import { useState, useEffect, useCallback, useRef } from "react";
import * as Battery from "expo-battery";

export interface BatterySnapshot {
  percent: number;
  time: number; // timestamp ms
}

export interface DeviceBatteryState {
  percent: number;
  isCharging: boolean;
  state: Battery.BatteryState;
  stateLabel: string;
  isLow: boolean;
  lowPowerMode: boolean;
  lastUpdated: Date;
  error: string | null;
  refresh: () => void;
  // Calculated power metrics
  voltage: number;
  current: number;       // mA
  powerWatts: number;     // W
  ratePerMinute: number;  // %/min change rate
  history: BatterySnapshot[];
}

function getStateLabel(state: Battery.BatteryState): string {
  switch (state) {
    case Battery.BatteryState.CHARGING:
      return "Sarj Oluyor";
    case Battery.BatteryState.FULL:
      return "Tam Dolu";
    case Battery.BatteryState.UNPLUGGED:
      return "Pil ile Calisiyor";
    default:
      return "Bilinmiyor";
  }
}

// Typical phone battery: 3.7V nominal, ~4.2V charging, ~3.5V discharging
function estimateVoltage(percent: number, isCharging: boolean): number {
  if (isCharging) {
    return 4.0 + (percent / 100) * 0.2; // 4.0V - 4.2V while charging
  }
  return 3.4 + (percent / 100) * 0.5; // 3.4V - 3.9V on battery
}

// Estimate current from rate of change (typical 4000mAh battery)
function estimateCurrent(ratePerMin: number, voltage: number): number {
  // rate is %/min, battery ~4000mAh
  // %/min * 4000mAh / 100 = mA equivalent
  const mA = Math.abs(ratePerMin) * 4000 / 100;
  return Math.round(mA);
}

const MAX_HISTORY = 120; // 2 minutes at 1s intervals

export function useDeviceBattery(): DeviceBatteryState {
  const [percent, setPercent] = useState(0);
  const [state, setState] = useState<Battery.BatteryState>(Battery.BatteryState.UNKNOWN);
  const [lowPowerMode, setLowPowerMode] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<BatterySnapshot[]>([]);
  const [ratePerMinute, setRatePerMinute] = useState(0);

  const historyRef = useRef<BatterySnapshot[]>([]);

  const fetchAll = useCallback(async () => {
    try {
      const [level, battState, lpm] = await Promise.all([
        Battery.getBatteryLevelAsync(),
        Battery.getBatteryStateAsync(),
        Battery.isLowPowerModeEnabledAsync(),
      ]);
      const pct = Math.round(level * 100);
      const now = Date.now();

      setPercent(pct);
      setState(battState);
      setLowPowerMode(lpm);
      setLastUpdated(new Date());
      setError(null);

      // Track history
      const snap: BatterySnapshot = { percent: pct, time: now };
      historyRef.current = [...historyRef.current.slice(-MAX_HISTORY + 1), snap];
      setHistory([...historyRef.current]);

      // Calculate rate from last 30 seconds of data
      const thirtySecsAgo = now - 30000;
      const recentHistory = historyRef.current.filter(s => s.time >= thirtySecsAgo);
      if (recentHistory.length >= 2) {
        const first = recentHistory[0];
        const last = recentHistory[recentHistory.length - 1];
        const dtMin = (last.time - first.time) / 60000;
        if (dtMin > 0.05) {
          setRatePerMinute((last.percent - first.percent) / dtMin);
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Pil bilgisi alinamadi");
    }
  }, []);

  useEffect(() => {
    fetchAll();

    const subs: Battery.Subscription[] = [];
    try {
      subs.push(
        Battery.addBatteryLevelListener(({ batteryLevel }) => {
          setPercent(Math.round(batteryLevel * 100));
          setLastUpdated(new Date());
        })
      );
      subs.push(
        Battery.addBatteryStateListener(({ batteryState }) => {
          setState(batteryState);
          setLastUpdated(new Date());
        })
      );
      subs.push(
        Battery.addLowPowerModeListener(({ lowPowerMode: lpm }) => {
          setLowPowerMode(lpm);
        })
      );
    } catch {
      // Listeners may not be available on all platforms
    }

    // Polling: her 1 saniyede guncelle
    const interval = setInterval(fetchAll, 1000);

    return () => {
      subs.forEach((s) => s.remove());
      clearInterval(interval);
    };
  }, [fetchAll]);

  const isCharging = state === Battery.BatteryState.CHARGING;
  const isLow = percent < 20 && !isCharging;
  const voltage = estimateVoltage(percent, isCharging);
  const current = estimateCurrent(ratePerMinute, voltage);
  const powerWatts = parseFloat(((voltage * current) / 1000).toFixed(2));

  return {
    percent,
    isCharging,
    state,
    stateLabel: getStateLabel(state),
    isLow,
    lowPowerMode,
    lastUpdated,
    error,
    refresh: fetchAll,
    voltage: parseFloat(voltage.toFixed(2)),
    current,
    powerWatts,
    ratePerMinute: parseFloat(ratePerMinute.toFixed(3)),
    history,
  };
}
