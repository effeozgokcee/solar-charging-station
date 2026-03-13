import math
import random
from datetime import datetime, timedelta
from typing import List, Optional
from models import SimulationStatus


class SolarSimulator:
    MAX_SOLAR_POWER = 10.0  # 10W solar panel
    BATTERY_CAPACITY_WH = 37.0  # 10000mAh * 3.7V
    CHARGE_EFFICIENCY = 0.90
    DISCHARGE_EFFICIENCY = 0.95
    PHONE_DRAW_WATTS = 5.0  # 5V * 1A
    BOOST_EFFICIENCY = 0.85
    MIN_BATTERY_PERCENT = 5.0
    MAX_BATTERY_PERCENT = 95.0
    HISTORY_SIZE = 288  # 24h * 12 ticks/hour (5-min intervals)

    WEATHER_MULTIPLIERS = {
        "sunny": 1.0,
        "partly_cloudy": 0.6,
        "cloudy": 0.2,
        "night": 0.0,
    }

    def __init__(self):
        self.reset()

    def reset(self):
        self.simulated_time = datetime(2024, 6, 15, 6, 0, 0)
        self.battery_wh = self.BATTERY_CAPACITY_WH * 0.50
        self.weather = "sunny"
        self.phone_connected = False
        self.speed = 1
        self.history: List[SimulationStatus] = []
        self._tick_counter = 0

    def _solar_production(self) -> float:
        hour = self.simulated_time.hour + self.simulated_time.minute / 60.0
        if 6.0 <= hour <= 18.0:
            base_power = self.MAX_SOLAR_POWER * math.sin(math.pi * (hour - 6.0) / 12.0)
        else:
            base_power = 0.0

        weather_mult = self.WEATHER_MULTIPLIERS.get(self.weather, 1.0)
        noise = 1.0 + random.uniform(-0.05, 0.05)
        return max(0.0, base_power * weather_mult * noise)

    def _consumption(self) -> float:
        if not self.phone_connected:
            return 0.0
        return self.PHONE_DRAW_WATTS / self.BOOST_EFFICIENCY

    def tick(self):
        for _ in range(self.speed):
            self._single_tick()

    def _single_tick(self):
        solar_watts = self._solar_production()
        consumption_watts = self._consumption()

        charge_power = solar_watts * self.CHARGE_EFFICIENCY
        discharge_power = consumption_watts

        net_power = charge_power - discharge_power

        time_hours = 1.0 / 60.0  # 1 minute of simulated time
        energy_delta = net_power * time_hours

        new_battery_wh = self.battery_wh + energy_delta
        new_battery_wh = max(
            self.BATTERY_CAPACITY_WH * self.MIN_BATTERY_PERCENT / 100.0,
            min(self.BATTERY_CAPACITY_WH * self.MAX_BATTERY_PERCENT / 100.0, new_battery_wh),
        )
        self.battery_wh = new_battery_wh

        self.simulated_time += timedelta(minutes=1)

        self._tick_counter += 1
        if self._tick_counter >= 5:
            self._tick_counter = 0
            status = self._build_status(solar_watts, consumption_watts)
            self.history.append(status)
            if len(self.history) > self.HISTORY_SIZE:
                self.history = self.history[-self.HISTORY_SIZE:]

    def _build_status(self, solar_watts: float, consumption_watts: float) -> SimulationStatus:
        battery_percent = (self.battery_wh / self.BATTERY_CAPACITY_WH) * 100.0
        display_consumption = self.PHONE_DRAW_WATTS if self.phone_connected else 0.0
        net = solar_watts - display_consumption

        if net > 0.1:
            charging_status = "charging"
        elif net < -0.1:
            charging_status = "discharging"
        else:
            charging_status = "idle"

        overall_efficiency = self.CHARGE_EFFICIENCY * 100.0
        if self.phone_connected:
            overall_efficiency = self.BOOST_EFFICIENCY * 100.0

        return SimulationStatus(
            time=self.simulated_time.strftime("%H:%M"),
            solar_watts=round(solar_watts, 2),
            consumption_watts=round(display_consumption, 2),
            net_power=round(net, 2),
            battery_percent=round(battery_percent, 1),
            battery_wh=round(self.battery_wh, 2),
            weather=self.weather,
            phone_connected=self.phone_connected,
            efficiency=round(overall_efficiency, 1),
            charging_status=charging_status,
        )

    def get_status(self) -> SimulationStatus:
        solar_watts = self._solar_production()
        consumption_watts = self._consumption()
        return self._build_status(solar_watts, consumption_watts)

    def get_history(self) -> List[SimulationStatus]:
        return list(self.history)

    def set_control(self, weather: Optional[str], phone_connected: Optional[bool], speed: Optional[int]):
        if weather is not None and weather in self.WEATHER_MULTIPLIERS:
            self.weather = weather
        if phone_connected is not None:
            self.phone_connected = phone_connected
        if speed is not None and speed in (1, 5, 10, 60):
            self.speed = speed
