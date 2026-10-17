import asyncio
import json
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .database import engine, Base
from .seed import seed_database
from .simulation import rig_simulator
from .ml_adapter import ml_adapter
from .routes import trainees, sessions, telemetry, devices, analytics, reports, demo

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("leaksense")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB & Seed Data
    Base.metadata.create_all(bind=engine)
    try:
        seed_database()
    except Exception as e:
        logger.error(f"Seed database warning: {e}")
    yield

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    description="LEAKSENSE Intelligent Diagnostic Training & Skill Assessment API",
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(trainees.router)
app.include_router(sessions.router)
app.include_router(telemetry.router)
app.include_router(devices.router)
app.include_router(analytics.router)
app.include_router(reports.router)
app.include_router(demo.router)

# WebSocket Connection Manager for Real-Time Telemetry
class TelemetryConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, data: dict):
        for connection in list(self.active_connections):
            try:
                await connection.send_text(json.dumps(data))
            except Exception:
                self.disconnect(connection)

telemetry_manager = TelemetryConnectionManager()

@app.websocket("/ws/telemetry")
async def websocket_telemetry_endpoint(websocket: WebSocket):
    """
    Real-time streaming telemetry WebSocket.
    Streams packets every 200ms (5 Hz) for smooth real-time charts.
    """
    await telemetry_manager.connect(websocket)
    try:
        while True:
            # Check for incoming client messages (e.g. pause, scenario adjustments)
            try:
                client_msg = await asyncio.wait_for(websocket.receive_text(), timeout=0.2)
                data = json.loads(client_msg)
                if data.get("action") == "configure":
                    rig_simulator.configure(
                        leak_location=data.get("leak_location", rig_simulator.leak_location),
                        leak_severity=data.get("leak_severity", rig_simulator.leak_severity),
                        pump_flow=data.get("pump_flow", rig_simulator.pump_flow_percent),
                        noise_level=data.get("noise_level", rig_simulator.noise_level)
                    )
            except asyncio.TimeoutError:
                pass

            # Generate packet
            if rig_simulator.is_running:
                packet = rig_simulator.generate_packet()
                ml_res = ml_adapter.infer({
                    "vibration_a_rms": packet["vibration_a_rms"],
                    "vibration_b_rms": packet["vibration_b_rms"],
                    "pressure_kpa": packet["pressure_kpa"]
                })
                packet["predicted_class"] = ml_res["predicted_class"]
                packet["confidence"] = ml_res["confidence"]
                packet["ml_details"] = ml_res
                await websocket.send_text(json.dumps(packet))
            else:
                await asyncio.sleep(0.2)

    except WebSocketDisconnect:
        telemetry_manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        telemetry_manager.disconnect(websocket)

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": settings.VERSION,
        "simulator_running": rig_simulator.is_running,
        "firebase_enabled": settings.FIREBASE_ENABLED
    }
