import { useState, useEffect, useCallback, useRef } from "react";
import * as Battery from "expo-battery";

export interface BatterySnapshot {
  percent: number;
  time: number;
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
  voltage: number;
  current: number;
  powerWatts: number;
  ratePerMinute: number;
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

// Realistic voltage curve based on battery percent
function estimateVoltage(percent: number, isCharging: boolean): number {
  if (isCharging) {
    // Charging: 4.0V at 0% → 4.35V at 100%
    return 4.0 + (percent / 100) * 0.35;
  }
  // Discharging: 3.3V at 0% → 4.1V at 100% (non-linear)
  if (percent > 80) return 3.9 + ((percent - 80) / 20) * 0.2;
  if (percent > 20) return 3.5 + ((percent - 20) / 60) * 0.4;
  return 3.3 + (percent / 20) * 0.2;
}

// When rate is too small to measure, estimate from charging state
// Typical phone: ~2500mA charging, ~300-500mA screen-on drain
function estimateCurrent(ratePerMin: number, isCharging: boolean, percent: number): number {
  if (Math.abs(ratePerMin) > 0.01) {
    // We have real rate data — calculate from it (assume 4000mAh battery)
    return Math.round(Math.abs(ratePerMin) * 4000 / 100);
  }
  // Rate too small to measure — use typical estimates
  if (isCharging) {
    if (percent > 80) return 1200; // Trickle charge above 80%
    if (percent > 50) return 2000;
    return 2500; // Fast charge below 50%
  }
  // Discharging — typical screen-on usage
  return 350;
}

const MAX_HISTORY = 180; // 3 minutes at 1s intervals

export function useDeviceBattery(): DeviceBatteryState {
  const [percent, setPercent] = useState(0);
  const [state, setState] = useState<Battery.BatteryState>(Battery.BatteryState.UNKNOWN);
  const [lowPowerMode, setLowPowerMode] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<BatterySnapshot[]>([]);
  const [ratePerMinute, setRatePerMinute] = useState(0);

  const historyRef = useRef<BatterySnapshot[]>([]);
  const lastPercentRef = useRef<number>(-1);

  const fetchAll = useCallback(async () => {
    try {
      const [level, battState, lpm] = await Promise.all([
        Battery.getBatteryLevelAsync(),
        Battery.getBatteryStateAsync(),
        Battery.isLowPowerModeEnabledAsync(),
      ]);
      const pct = Math.round(level * 1000) / 10; // 1 decimal precision
      const now = Date.now();

      setPercent(pct);
      setState(battState);
      setLowPowerMode(lpm);
      setLastUpdated(new Date());
      setError(null);

      // Only add to history if value actually changed or every 5 seconds
      const lastSnap = historyRef.current[historyRef.current.length - 1];
      const shouldRecord = !lastSnap || pct !== lastSnap.percent || (now - lastSnap.time > 5000);

      if (shouldRecord) {
        const snap: BatterySnapshot = { percent: pct, time: now };
        historyRef.current = [...historyRef.current.slice(-MAX_HISTORY + 1), snap];
        setHistory([...historyRef.current]);
      }

      // Calculate rate from available history
      const windowMs = 60000; // 1 minute window
      const cutoff = now - windowMs;
      const window = historyRef.current.filter(s => s.time >= cutoff);
      if (window.length >= 2) {
        const first = window[0];
        const last = window[window.length - 1];
        const dtMin = (last.time - first.time) / 60000;
        if (dtMin > 0.1) {
          setRatePerMinute(parseFloat(((last.percent - first.percent) / dtMin).toFixed(3)));
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
      subs.push(Battery.addBatteryLevelListener(({ batteryLevel }) => {
        setPercent(Math.round(batteryLevel * 1000) / 10);
        setLastUpdated(new Date());
      }));
      subs.push(Battery.addBatteryStateListener(({ batteryState }) => {
        setState(batteryState);
        setLastUpdated(new Date());
      }));
      subs.push(Battery.addLowPowerModeListener(({ lowPowerMode: lpm }) => {
        setLowPowerMode(lpm);
      }));
    } catch {}

    const interval = setInterval(fetchAll, 1000);
    return () => { subs.forEach(s => s.remove()); clearInterval(interval); };
  }, [fetchAll]);

  const isCharging = state === Battery.BatteryState.CHARGING;
  const isLow = percent < 20 && !isCharging;
  const voltage = estimateVoltage(percent, isCharging);
  const current = estimateCurrent(ratePerMinute, isCharging, percent);
  const powerWatts = parseFloat(((voltage * current) / 1000).toFixed(1));

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
    ratePerMinute,
    history,
  };
}
