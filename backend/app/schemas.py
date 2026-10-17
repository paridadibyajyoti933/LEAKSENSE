from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

# ----------------- Trainee Schemas -----------------
class TraineeBase(BaseModel):
    trainee_id: str = Field(..., example="ITI-DEL-042")
    full_name: str = Field(..., example="Rahul Sharma")
    iti_centre: str = Field(..., example="Govt ITI Pusa, New Delhi")
    trade: str = Field(default="Plumber")
    batch: str = Field(default="2025-2026")
    status: str = Field(default="active")

class TraineeCreate(TraineeBase):
    pass

class TraineeUpdate(BaseModel):
    full_name: Optional[str] = None
    iti_centre: Optional[str] = None
    trade: Optional[str] = None
    batch: Optional[str] = None
    status: Optional[str] = None

class TraineeResponse(TraineeBase):
    id: int
    enrollment_date: datetime
    created_at: datetime
    completed_sessions_count: Optional[int] = 0
    average_score: Optional[float] = None

    class Config:
        from_attributes = True


# ----------------- Telemetry Schemas -----------------
class TelemetryData(BaseModel):
    device_id: str = Field(..., example="UNOQ-001")
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    pressure_kpa: float = Field(..., example=150.0)
    vibration_a_rms: float = Field(..., example=0.12)
    vibration_b_rms: float = Field(..., example=0.18)
    dominant_freq_a: Optional[float] = 0.0
    dominant_freq_b: Optional[float] = 0.0
    energy_ratio: Optional[float] = 1.0
    pressure_deviation: Optional[float] = 0.0
    predicted_class: str = Field(..., example="Left")
    confidence: float = Field(..., ge=0.0, le=1.0, example=0.82)
    model_version: str = Field(default="demo-v1")
    source: str = Field(default="simulation", example="simulation")  # 'simulation' or 'hardware'
    session_id: Optional[int] = None
    # Waveform slices for live monitoring (if available)
    waveform_a: Optional[List[float]] = None
    waveform_b: Optional[List[float]] = None
    waveform_available: bool = False


# ----------------- Simulator Configuration -----------------
class SimulatorConfig(BaseModel):
    is_running: bool = True
    leak_location: str = Field(default="Left")  # No Leak, Left, Centre, Right
    leak_severity: str = Field(default="Medium")  # None, Small, Medium, Large
    pump_flow_percent: float = Field(default=75.0, ge=0.0, le=100.0)
    noise_level: float = Field(default=0.05, ge=0.0, le=0.5)
    conceal_from_trainee: bool = True


# ----------------- Session Schemas -----------------
class SessionCreate(BaseModel):
    trainee_id: int
    session_type: str = Field(default="assessment")  # practice, assessment
    difficulty: str = Field(default="medium")  # easy, medium, hard
    ground_truth_leak: str = Field(default="Left")  # No Leak, Left, Centre, Right
    leak_severity: str = Field(default="Medium")  # Small, Medium, Large
    trainer_notes: Optional[str] = None

class SessionSubmission(BaseModel):
    trainee_diagnosis: str = Field(..., example="Left")  # No Leak, Left, Centre, Right
    hints_used: int = Field(default=0, ge=0)
    attempts: int = Field(default=1, ge=1)
    duration_seconds: Optional[float] = None
    procedure_compliance: Optional[str] = "NOT_ASSESSED"  # COMPLIANT, NON_COMPLIANT, NOT_ASSESSED

class SessionTrainerUpdate(BaseModel):
    procedure_compliance: Optional[str] = None
    trainer_notes: Optional[str] = None
    status: Optional[str] = None

class SessionResponse(BaseModel):
    id: int
    session_code: str
    trainee_id: int
    trainee_name: Optional[str] = None
    trainee_code: Optional[str] = None
    session_type: str
    status: str
    difficulty: str
    # Ground truth: revealed in practice or completed assessment, concealed during active assessment
    ground_truth_leak: Optional[str] = None
    leak_severity: Optional[str] = None
    trainee_diagnosis: Optional[str] = None
    is_correct: Optional[bool] = None
    duration_seconds: Optional[float] = None
    hints_used: int = 0
    attempts: int = 1
    procedure_compliance: str = "NOT_ASSESSED"
    ai_prediction: Optional[str] = None
    ai_confidence: Optional[float] = None
    ai_model_source: str = "SIMULATED"
    score_correctness: Optional[float] = None
    score_time: Optional[float] = None
    score_independence: Optional[float] = None
    score_compliance: Optional[float] = None
    total_score: Optional[float] = None
    performance_category: Optional[str] = None
    trainer_notes: Optional[str] = None
    feedback_remarks: Optional[str] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ----------------- Device Schemas -----------------
class DeviceRegister(BaseModel):
    device_id: str
    name: str
    firmware_version: Optional[str] = "1.0.0-unoq"
    model_version: Optional[str] = "rf-acoustic-v1"
    ip_or_port: Optional[str] = None

class DeviceHeartbeat(BaseModel):
    device_id: str
    status: str = "connected"

class DeviceResponse(BaseModel):
    id: int
    device_id: str
    name: str
    status: str
    firmware_version: str
    model_version: str
    ip_or_port: Optional[str] = None
    last_heartbeat: Optional[datetime] = None
    last_telemetry_timestamp: Optional[datetime] = None
    is_active: bool

    class Config:
        from_attributes = True


# ----------------- Analytics & Overview Schemas -----------------
class OverviewMetrics(BaseModel):
    device_connection_status: str
    active_device_name: str
    is_live_hardware: bool
    active_session_code: Optional[str] = None
    active_session_trainee: Optional[str] = None
    current_prediction: str
    detection_confidence: float
    latest_pressure_kpa: Optional[float] = None
    vibration_a_rms: Optional[float] = None
    vibration_b_rms: Optional[float] = None
    completed_sessions_count: int
    average_trainee_accuracy: float
    average_diagnosis_time: float
    sensor_health_a: str
    sensor_health_b: str
    sensor_health_pressure: str
    cloud_sync_status: str
    pending_sync_count: int
