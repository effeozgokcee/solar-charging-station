from pydantic import BaseModel
from typing import Literal, Optional


class SimulationStatus(BaseModel):
    time: str
    solar_watts: float
    consumption_watts: float
    net_power: float
    battery_percent: float
    battery_wh: float
    weather: str
    phone_connected: bool
    efficiency: float
    charging_status: Literal["charging", "discharging", "idle"]
    device_type: str = "none"


class ControlInput(BaseModel):
    weather: Optional[Literal["sunny", "partly_cloudy", "cloudy", "night"]] = None
    phone_connected: Optional[bool] = None
    speed: Optional[int] = None
    device_type: Optional[str] = None
    consumption_watts: Optional[float] = None


class HealthResponse(BaseModel):
    status: str = "ok"
