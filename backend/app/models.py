from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey
)
from sqlalchemy.orm import relationship
from .database import Base

class Trainee(Base):
    __tablename__ = "trainees"

    id = Column(Integer, primary_key=True, index=True)
    trainee_id = Column(String(50), unique=True, index=True, nullable=False)
    full_name = Column(String(100), nullable=False)
    iti_centre = Column(String(150), nullable=False)
    trade = Column(String(50), default="Plumber", nullable=False)
    batch = Column(String(50), default="2025-2026", nullable=False)
    enrollment_date = Column(DateTime, default=datetime.utcnow)
    status = Column(String(20), default="active")  # active, archived
    created_at = Column(DateTime, default=datetime.utcnow)

    sessions = relationship("TrainingSession", back_populates="trainee", cascade="all, delete-orphan")


class TrainingSession(Base):
    __tablename__ = "training_sessions"

    id = Column(Integer, primary_key=True, index=True)
    session_code = Column(String(50), unique=True, index=True, nullable=False)
    trainee_id = Column(Integer, ForeignKey("trainees.id"), nullable=False)
    session_type = Column(String(20), default="practice", nullable=False)  # practice, assessment
    status = Column(String(20), default="CREATED", nullable=False)  # CREATED, READY, RUNNING, COMPLETED, CANCELLED
    difficulty = Column(String(20), default="medium", nullable=False)  # easy, medium, hard
    
    # Concealed during assessment until submitted / approved
    ground_truth_leak = Column(String(20), nullable=False)  # No Leak, Left, Centre, Right
    leak_severity = Column(String(20), default="Medium")     # None, Small, Medium, Large
    
    # Trainee response
    trainee_diagnosis = Column(String(20), nullable=True)
    is_correct = Column(Boolean, nullable=True)
    
    # Diagnostic time and behaviour
    duration_seconds = Column(Float, nullable=True)
    hints_used = Column(Integer, default=0)
    attempts = Column(Integer, default=1)
    procedure_compliance = Column(String(30), default="NOT_ASSESSED")  # COMPLIANT, NON_COMPLIANT, NOT_ASSESSED
    
    # Machine Learning reference (clearly separated from ground truth)
    ai_prediction = Column(String(20), nullable=True)
    ai_confidence = Column(Float, nullable=True)
    ai_model_source = Column(String(20), default="SIMULATED")  # SIMULATED, HARDWARE_MODEL
    
    # Automatic Skill Assessment Scores
    score_correctness = Column(Float, nullable=True)
    score_time = Column(Float, nullable=True)
    score_independence = Column(Float, nullable=True)
    score_compliance = Column(Float, nullable=True)
    total_score = Column(Float, nullable=True)
    performance_category = Column(String(50), nullable=True)  # Mastery, Proficient, Needs Practice, Novice
    
    trainer_notes = Column(Text, nullable=True)
    feedback_remarks = Column(Text, nullable=True)
    
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    trainee = relationship("Trainee", back_populates="sessions")


class Device(Base):
    __tablename__ = "devices"

    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(100), nullable=False)
    status = Column(String(20), default="disconnected")  # connected, disconnected, simulated
    firmware_version = Column(String(50), default="1.0.0-unoq")
    model_version = Column(String(50), default="rf-acoustic-v1")
    ip_or_port = Column(String(50), nullable=True)
    last_heartbeat = Column(DateTime, nullable=True)
    last_telemetry_timestamp = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class TelemetryRecord(Base):
    __tablename__ = "telemetry_records"

    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(String(50), index=True, nullable=False)
    session_id = Column(Integer, ForeignKey("training_sessions.id"), nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    pressure_kpa = Column(Float, nullable=False)
    vibration_a_rms = Column(Float, nullable=False)
    vibration_b_rms = Column(Float, nullable=False)
    dominant_freq_a = Column(Float, default=0.0)
    dominant_freq_b = Column(Float, default=0.0)
    energy_ratio = Column(Float, default=1.0)
    pressure_deviation = Column(Float, default=0.0)
    predicted_class = Column(String(20), nullable=False)
    confidence = Column(Float, nullable=False)
    model_version = Column(String(50), default="v1.0")
    source = Column(String(20), default="simulation")  # hardware, simulation


class CloudSyncQueue(Base):
    __tablename__ = "cloud_sync_queue"

    id = Column(Integer, primary_key=True, index=True)
    entity_type = Column(String(50), nullable=False)  # session, trainee, telemetry
    entity_id = Column(String(100), nullable=False)
    payload_json = Column(Text, nullable=False)
    status = Column(String(20), default="pending")    # pending, synced, failed
    attempts = Column(Integer, default=0)
    last_attempt_at = Column(DateTime, nullable=True)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
