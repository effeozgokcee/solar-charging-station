import { useState, useEffect, useCallback, useRef } from "react";

const API_URL =
  process.env.EXPO_PUBLIC_API_URL ?? "http://192.168.1.104:8000";

export interface SimulationStatus {
  time: string;
  solar_watts: number;
  consumption_watts: number;
  net_power: number;
  battery_percent: number;
  battery_wh: number;
  weather: string;
  phone_connected: boolean;
  efficiency: number;
  charging_status: "charging" | "discharging" | "idle";
}

export interface ControlInput {
  weather?: string;
  phone_connected?: boolean;
  speed?: number;
}

export function useSimulation(pollInterval = 2000) {
  const [status, setStatus] = useState<SimulationStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/status`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: SimulationStatus = await res.json();
      setStatus(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Connection failed");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchHistory = useCallback(async (): Promise<SimulationStatus[]> => {
    const res = await fetch(`${API_URL}/history`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }, []);

  const sendControl = useCallback(async (control: ControlInput) => {
    const res = await fetch(`${API_URL}/control`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(control),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data: SimulationStatus = await res.json();
    setStatus(data);
    return data;
  }, []);

  const resetSimulation = useCallback(async () => {
    const res = await fetch(`${API_URL}/reset`, { method: "POST" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data: SimulationStatus = await res.json();
    setStatus(data);
    return data;
  }, []);

  useEffect(() => {
    fetchStatus();
    intervalRef.current = setInterval(fetchStatus, pollInterval);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchStatus, pollInterval]);

  return { status, error, loading, fetchStatus, fetchHistory, sendControl, resetSimulation };
}
