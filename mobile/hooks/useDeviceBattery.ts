import { useState, useEffect, useCallback, useRef } from "react";
import * as Battery from "expo-battery";

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
}

function getStateLabel(state: Battery.BatteryState): string {
  switch (state) {
    case Battery.BatteryState.CHARGING:
      return "Charging";
    case Battery.BatteryState.FULL:
      return "Full";
    case Battery.BatteryState.UNPLUGGED:
      return "On Battery";
    default:
      return "Unknown";
  }
}

export function useDeviceBattery(): DeviceBatteryState {
  const [percent, setPercent] = useState(0);
  const [state, setState] = useState<Battery.BatteryState>(Battery.BatteryState.UNKNOWN);
  const [lowPowerMode, setLowPowerMode] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    try {
      const [level, battState, lpm] = await Promise.all([
        Battery.getBatteryLevelAsync(),
        Battery.getBatteryStateAsync(),
        Battery.isLowPowerModeEnabledAsync(),
      ]);
      setPercent(Math.round(level * 100));
      setState(battState);
      setLowPowerMode(lpm);
      setLastUpdated(new Date());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Battery info unavailable");
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

    return () => {
      subs.forEach((s) => s.remove());
    };
  }, [fetchAll]);

  const isCharging = state === Battery.BatteryState.CHARGING;
  const isLow = percent < 20 && !isCharging;

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
  };
}
