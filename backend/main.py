import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from models import ControlInput, HealthResponse, SimulationStatus
from simulator import SolarSimulator

simulator = SolarSimulator()


async def simulation_loop():
    while True:
        simulator.tick()
        await asyncio.sleep(2)


@asynccontextmanager
async def lifespan(app: FastAPI):
    task = asyncio.create_task(simulation_loop())
    yield
    task.cancel()
    try:
        await task
    except asyncio.CancelledError:
        pass


app = FastAPI(
    title="Solar Charging Station Simulator",
    description="Simulates a solar-powered phone charging station",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/status", response_model=SimulationStatus)
async def get_status():
    return simulator.get_status()


@app.get("/history", response_model=list[SimulationStatus])
async def get_history():
    return simulator.get_history()


@app.post("/control", response_model=SimulationStatus)
async def set_control(control: ControlInput):
    simulator.set_control(
        weather=control.weather,
        phone_connected=control.phone_connected,
        speed=control.speed,
    )
    return simulator.get_status()


@app.post("/reset", response_model=SimulationStatus)
async def reset_simulation():
    simulator.reset()
    return simulator.get_status()


@app.get("/health", response_model=HealthResponse)
async def health_check():
    return HealthResponse()
