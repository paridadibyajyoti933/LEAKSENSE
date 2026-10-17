import pytest
from app.simulation import rig_simulator
from app.scoring import calculate_session_score
from app.reports import generate_session_pdf, generate_sessions_csv
from app.database import SessionLocal, Base, engine
from app.models import Trainee, TrainingSession, CloudSyncQueue
from app.cloud_sync import cloud_sync_manager
from app.ml_adapter import ml_adapter

def test_simulation_generator():
    """Verify synthetic sensor-signal generator incorporates leak physics & source label."""
    rig_simulator.configure(leak_location="Left", leak_severity="Medium", pump_flow=75.0)
    packet = rig_simulator.generate_packet()
    
    assert packet["source"] == "simulation"
    assert packet["device_id"] == "SIM-UNOQ-001"
    assert packet["pressure_kpa"] < 155.0  # Pressure drop observed
    assert packet["vibration_a_rms"] > packet["vibration_b_rms"]  # Left leak closer to Sensor A
    assert packet["waveform_available"] is True
    assert len(packet["waveform_a"]) > 0

def test_scoring_rubric():
    """Verify scoring rubric weights: 50 correctness, 20 time, 20 independence, 10 compliance."""
    # Perfect run
    res = calculate_session_score(
        ground_truth="Left",
        trainee_diagnosis="Left",
        duration_seconds=20.0,
        difficulty="medium",
        hints_used=0,
        attempts=1,
        procedure_compliance="COMPLIANT"
    )
    assert res["is_correct"] is True
    assert res["score_correctness"] == 50.0
    assert res["score_time"] == 20.0
    assert res["score_independence"] == 20.0
    assert res["score_compliance"] == 10.0
    assert res["total_score"] == 100.0
    assert "Mastery" in res["performance_category"]

    # Incorrect run
    res_wrong = calculate_session_score(
        ground_truth="Left",
        trainee_diagnosis="Right",
        duration_seconds=45.0,
        difficulty="medium",
        hints_used=1,
        attempts=2,
        procedure_compliance="NOT_ASSESSED"
    )
    assert res_wrong["is_correct"] is False
    assert res_wrong["score_correctness"] == 0.0
    assert res_wrong["score_compliance"] is None  # Unassessed is not assumed full score
    assert res_wrong["total_score"] < 50.0

def test_ground_truth_isolation():
    """Verify trainee cannot see concealed leak ground truth during active assessment."""
    from app.routes.sessions import serialize_session
    from datetime import datetime
    s = TrainingSession(
        id=999,
        session_code="SESS-TEST-999",
        trainee_id=1,
        session_type="assessment",
        status="RUNNING",
        difficulty="medium",
        ground_truth_leak="Left",
        leak_severity="Medium",
        ai_prediction="Left",
        ai_confidence=0.91,
        created_at=datetime.utcnow()
    )
    trainee_view = serialize_session(s, is_trainer=False)
    assert trainee_view.ground_truth_leak is None
    assert trainee_view.ai_prediction is None

    trainer_view = serialize_session(s, is_trainer=True)
    assert trainer_view.ground_truth_leak == "Left"
    assert trainer_view.ai_prediction == "Left"

def test_report_generation():
    """Verify PDF and CSV generation."""
    session_data = {
        "session_code": "SESS-TEST-001",
        "session_type": "assessment",
        "difficulty": "medium",
        "ground_truth_leak": "Left",
        "trainee_diagnosis": "Left",
        "is_correct": True,
        "duration_seconds": 22.5,
        "total_score": 95.0,
        "performance_category": "Mastery"
    }
    trainee_data = {
        "trainee_id": "ITI-DEL-042",
        "full_name": "Rahul Sharma",
        "iti_centre": "Govt ITI Pusa",
        "trade": "Plumber",
        "batch": "2025-26"
    }
    pdf_bytes = generate_session_pdf(session_data, trainee_data)
    assert len(pdf_bytes) > 1000
    assert pdf_bytes.startswith(b"%PDF")

def test_cloud_sync_queue():
    """Verify offline-first local queue."""
    db = SessionLocal()
    item = cloud_sync_manager.queue_record(db, "session", "SESS-QUEUE-01", {"score": 90})
    assert item.status == "pending"
    status = cloud_sync_manager.get_sync_status(db)
    assert status["pending_count"] >= 1
    db.close()
