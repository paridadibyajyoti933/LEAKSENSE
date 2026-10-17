import csv
import io
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import TelemetryRecord, Device
from ..schemas import TelemetryData, SimulatorConfig
from ..simulation import rig_simulator
from ..ml_adapter import ml_adapter

router = APIRouter(prefix="/api/telemetry", tags=["telemetry"])

# In-memory buffer of recent telemetry for high-speed streaming
RECENT_TELEMETRY: List[Dict[str, Any]] = []
MAX_BUFFER = 120

# Tracking hardware connection
LAST_HARDWARE_PACKET: Optional[Dict[str, Any]] = None
LAST_HARDWARE_TIMESTAMP: Optional[datetime] = None

@router.get("/latest")
def get_latest_telemetry(db: Session = Depends(get_db)):
    """
    Returns latest telemetry packet from hardware or simulation.
    Explicitly tags source as 'hardware' or 'simulation'.
    """
    global LAST_HARDWARE_PACKET, LAST_HARDWARE_TIMESTAMP
    
    # Check if real hardware transmitted within the last 5 seconds
    if LAST_HARDWARE_PACKET and LAST_HARDWARE_TIMESTAMP and (datetime.utcnow() - LAST_HARDWARE_TIMESTAMP).total_seconds() < 5.0:
        return LAST_HARDWARE_PACKET
    
    # Otherwise generate from interactive simulator
    packet = rig_simulator.generate_packet()
    
    # Feed to ML adapter to update probabilities
    ml_res = ml_adapter.infer(
        {"vibration_a_rms": packet["vibration_a_rms"], "vibration_b_rms": packet["vibration_b_rms"], "pressure_kpa": packet["pressure_kpa"]}
    )
    packet["predicted_class"] = ml_res["predicted_class"]
    packet["confidence"] = ml_res["confidence"]
    packet["ml_details"] = ml_res
    
    RECENT_TELEMETRY.append(packet)
    if len(RECENT_TELEMETRY) > MAX_BUFFER:
        RECENT_TELEMETRY.pop(0)
        
    return packet

@router.post("/ingest", response_model=Dict[str, Any])
def ingest_device_telemetry(telemetry: TelemetryData, db: Session = Depends(get_db)):
    """
    Contract endpoint for Arduino UNO Q hardware or external telemetry publisher.
    Stores record in SQLite and updates live feed.
    """
    global LAST_HARDWARE_PACKET, LAST_HARDWARE_TIMESTAMP

    # Validate device existence or auto-register
    dev = db.query(Device).filter(Device.device_id == telemetry.device_id).first()
    if not dev:
        dev = Device(
            device_id=telemetry.device_id,
            name=f"Arduino UNO Q ({telemetry.device_id})",
            status="connected",
            firmware_version="1.0.0-unoq",
            model_version=telemetry.model_version or "rf-acoustic-v1",
            last_heartbeat=datetime.utcnow(),
            last_telemetry_timestamp=datetime.utcnow()
        )
        db.add(dev)
    else:
        dev.status = "connected"
        dev.last_heartbeat = datetime.utcnow()
        dev.last_telemetry_timestamp = datetime.utcnow()

    # Store telemetry record in DB
    record = TelemetryRecord(
        device_id=telemetry.device_id,
        session_id=telemetry.session_id,
        timestamp=telemetry.timestamp or datetime.utcnow(),
        pressure_kpa=telemetry.pressure_kpa,
        vibration_a_rms=telemetry.vibration_a_rms,
        vibration_b_rms=telemetry.vibration_b_rms,
        dominant_freq_a=telemetry.dominant_freq_a or 0.0,
        dominant_freq_b=telemetry.dominant_freq_b or 0.0,
        energy_ratio=telemetry.energy_ratio or 1.0,
        pressure_deviation=telemetry.pressure_deviation or 0.0,
        predicted_class=telemetry.predicted_class,
        confidence=telemetry.confidence,
        model_version=telemetry.model_version,
        source=telemetry.source  # 'hardware' or 'simulation'
    )
    db.add(record)
    db.commit()

    packet_dict = telemetry.model_dump()
    packet_dict["waveform_available"] = False  # genuine raw waveforms labeled unavailable unless raw stream sent

    if telemetry.source == "hardware":
        LAST_HARDWARE_PACKET = packet_dict
        LAST_HARDWARE_TIMESTAMP = datetime.utcnow()

    RECENT_TELEMETRY.append(packet_dict)
    if len(RECENT_TELEMETRY) > MAX_BUFFER:
        RECENT_TELEMETRY.pop(0)

    return {"status": "success", "received_at": datetime.utcnow().isoformat(), "source": telemetry.source}

@router.get("/simulator/config", response_model=SimulatorConfig)
def get_simulator_config():
    return SimulatorConfig(
        is_running=rig_simulator.is_running,
        leak_location=rig_simulator.leak_location,
        leak_severity=rig_simulator.leak_severity,
        pump_flow_percent=rig_simulator.pump_flow_percent,
        noise_level=rig_simulator.noise_level,
        conceal_from_trainee=rig_simulator.conceal_from_trainee
    )

@router.post("/simulator/config", response_model=SimulatorConfig)
def update_simulator_config(config: SimulatorConfig):
    rig_simulator.is_running = config.is_running
    rig_simulator.configure(
        leak_location=config.leak_location,
        leak_severity=config.leak_severity,
        pump_flow=config.pump_flow_percent,
        noise_level=config.noise_level
    )
    rig_simulator.conceal_from_trainee = config.conceal_from_trainee
    return config

@router.get("/diagnostics")
def get_sensor_diagnostics():
    """
    Detailed diagnostics panel for sensors and data pipeline.
    Never claims a physical sensor is healthy using simulated telemetry.
    """
    is_hardware = (LAST_HARDWARE_TIMESTAMP is not None) and (datetime.utcnow() - LAST_HARDWARE_TIMESTAMP).total_seconds() < 5.0
    
    if is_hardware:
        return {
            "mode": "LIVE_HARDWARE",
            "device_id": LAST_HARDWARE_PACKET.get("device_id", "UNOQ-001") if LAST_HARDWARE_PACKET else "UNKNOWN",
            "acoustic_sensor_a": "CONNECTED",
            "acoustic_sensor_b": "CONNECTED",
            "pressure_sensor": "CONNECTED",
            "last_packet_age_seconds": round((datetime.utcnow() - LAST_HARDWARE_TIMESTAMP).total_seconds(), 1) if LAST_HARDWARE_TIMESTAMP else None,
            "status_banner": "Live Hardware Telemetry Active",
            "sampling_frequency_hz": 10
        }
    else:
        return {
            "mode": "SIMULATION",
            "device_id": rig_simulator.device_id,
            "acoustic_sensor_a": "SIMULATED",
            "acoustic_sensor_b": "SIMULATED",
            "pressure_sensor": "SIMULATED",
            "last_packet_age_seconds": 0.1,
            "status_banner": "Simulated Rig Telemetry (Physical sensors UNKNOWN/OFFLINE)",
            "sampling_frequency_hz": 10
        }

@router.get("/export-csv")
def export_telemetry_csv(limit: int = 200, db: Session = Depends(get_db)):
    """Exports recent telemetry stream as CSV file."""
    records = db.query(TelemetryRecord).order_by(TelemetryRecord.timestamp.desc()).limit(limit).all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Timestamp", "DeviceID", "Source", "Pressure_kPa", "VibrationA_RMS",
        "VibrationB_RMS", "EnergyRatio", "PredictedClass", "Confidence", "ModelVersion"
    ])
    for r in records:
        writer.writerow([
            r.timestamp.isoformat(),
            r.device_id,
            r.source,
            r.pressure_kpa,
            r.vibration_a_rms,
            r.vibration_b_rms,
            r.energy_ratio,
            r.predicted_class,
            r.confidence,
            r.model_version
        ])
    return Response(content=output.getvalue(), media_type="text/csv", headers={"Content-Disposition": "attachment; filename=telemetry_export.csv"})
