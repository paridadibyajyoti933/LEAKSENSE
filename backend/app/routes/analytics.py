from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import TrainingSession, Trainee, Device, CloudSyncQueue
from ..simulation import rig_simulator
from ..cloud_sync import cloud_sync_manager
from .telemetry import LAST_HARDWARE_TIMESTAMP

router = APIRouter(prefix="/api/analytics", tags=["analytics"])

CLASSES = ["No Leak", "Left", "Centre", "Right"]

@router.get("/overview")
def get_overview_metrics(db: Session = Depends(get_db)):
    """Summary metrics for Overview Dashboard."""
    completed = db.query(TrainingSession).filter(TrainingSession.status == "COMPLETED").all()
    total_completed = len(completed)
    
    avg_accuracy = 0.0
    avg_time = 0.0
    if total_completed > 0:
        correct_count = sum(1 for s in completed if s.is_correct is True)
        avg_accuracy = round((correct_count / total_completed) * 100.0, 1)
        valid_times = [s.duration_seconds for s in completed if s.duration_seconds is not None]
        avg_time = round(sum(valid_times) / len(valid_times), 1) if valid_times else 0.0

    # Active running session
    active_sess = db.query(TrainingSession).filter(TrainingSession.status == "RUNNING").order_by(TrainingSession.started_at.desc()).first()

    # Hardware connection check
    is_live = (LAST_HARDWARE_TIMESTAMP is not None) and (datetime.utcnow() - LAST_HARDWARE_TIMESTAMP).total_seconds() < 5.0
    conn_status = "Live Arduino UNO Q Connected" if is_live else "Virtual Training Rig (Simulated)"
    dev_name = "Arduino UNO Q [Hardware]" if is_live else "Synthetic PVC Simulator [UNOQ-SIM]"

    # Current rig telemetry state
    sample_packet = rig_simulator.generate_packet()
    sync_status = cloud_sync_manager.get_sync_status(db)

    return {
        "device_connection_status": conn_status,
        "active_device_name": dev_name,
        "is_live_hardware": is_live,
        "active_session_code": active_sess.session_code if active_sess else None,
        "active_session_trainee": active_sess.trainee.full_name if active_sess and active_sess.trainee else None,
        "current_prediction": sample_packet["predicted_class"],
        "detection_confidence": sample_packet["confidence"],
        "latest_pressure_kpa": sample_packet["pressure_kpa"],
        "vibration_a_rms": sample_packet["vibration_a_rms"],
        "vibration_b_rms": sample_packet["vibration_b_rms"],
        "completed_sessions_count": total_completed,
        "average_trainee_accuracy": avg_accuracy,
        "average_diagnosis_time": avg_time,
        "sensor_health_a": "Normal (Hardware)" if is_live else "Simulated Stream",
        "sensor_health_b": "Normal (Hardware)" if is_live else "Simulated Stream",
        "sensor_health_pressure": "Normal (Hardware)" if is_live else "Simulated Stream",
        "cloud_sync_status": sync_status["status"],
        "pending_sync_count": sync_status["pending_count"]
    }

@router.get("/performance")
def get_performance_analytics(
    trainee_id: Optional[int] = None,
    difficulty: Optional[str] = None,
    session_type: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Computes performance metrics, confusion matrix, trends, and breakdowns.
    All data derived from actual SQLite records.
    """
    q = db.query(TrainingSession).filter(TrainingSession.status == "COMPLETED")
    if trainee_id:
        q = q.filter(TrainingSession.trainee_id == trainee_id)
    if difficulty and difficulty != "all":
        q = q.filter(TrainingSession.difficulty == difficulty)
    if session_type and session_type != "all":
        q = q.filter(TrainingSession.session_type == session_type)

    sessions = q.order_by(TrainingSession.completed_at.asc()).all()

    if not sessions:
        return {
            "has_data": False,
            "total_sessions": 0,
            "accuracy_percent": 0.0,
            "average_time_seconds": 0.0,
            "accuracy_over_time": [],
            "confusion_matrix": [],
            "location_performance": [],
            "difficulty_breakdown": [],
            "hint_dependency": []
        }

    total_sessions = len(sessions)
    correct_count = sum(1 for s in sessions if s.is_correct is True)
    accuracy_percent = round((correct_count / total_sessions) * 100.0, 1)
    durations = [s.duration_seconds for s in sessions if s.duration_seconds]
    avg_time = round(sum(durations) / len(durations), 1) if durations else 0.0

    # 1. Accuracy over time
    accuracy_over_time = []
    running_correct = 0
    for idx, s in enumerate(sessions, 1):
        if s.is_correct:
            running_correct += 1
        acc = round((running_correct / idx) * 100.0, 1)
        accuracy_over_time.append({
            "session_code": s.session_code,
            "index": idx,
            "date": s.completed_at.strftime("%d %b %H:%M") if s.completed_at else f"Sess {idx}",
            "cumulative_accuracy": acc,
            "session_score": s.total_score or 0.0,
            "duration": s.duration_seconds or 0.0,
            "is_correct": s.is_correct
        })

    # 2. Confusion Matrix of Trainee Answers (Actual vs Submitted)
    # Rows: Actual, Columns: Submitted
    matrix_counts = {actual: {pred: 0 for pred in CLASSES} for actual in CLASSES}
    for s in sessions:
        act = s.ground_truth_leak if s.ground_truth_leak in CLASSES else "No Leak"
        sub = s.trainee_diagnosis if s.trainee_diagnosis in CLASSES else "No Leak"
        matrix_counts[act][sub] += 1

    confusion_matrix = []
    for actual in CLASSES:
        row = {"actual": actual}
        for predicted in CLASSES:
            row[predicted] = matrix_counts[actual][predicted]
        confusion_matrix.append(row)

    # 3. Location Performance
    location_perf = []
    for loc in CLASSES:
        loc_sessions = [s for s in sessions if s.ground_truth_leak == loc]
        count = len(loc_sessions)
        correct = sum(1 for s in loc_sessions if s.is_correct is True)
        acc = round((correct / count) * 100.0, 1) if count > 0 else 0.0
        location_perf.append({
            "location": loc,
            "total_attempts": count,
            "correct_attempts": correct,
            "accuracy_percent": acc
        })

    # 4. Difficulty Breakdown
    diff_perf = []
    for diff in ["easy", "medium", "hard"]:
        d_sessions = [s for s in sessions if s.difficulty.lower() == diff]
        count = len(d_sessions)
        correct = sum(1 for s in d_sessions if s.is_correct is True)
        acc = round((correct / count) * 100.0, 1) if count > 0 else 0.0
        avg_d_time = round(sum(s.duration_seconds or 0.0 for s in d_sessions) / count, 1) if count > 0 else 0.0
        diff_perf.append({
            "difficulty": diff.capitalize(),
            "total_sessions": count,
            "accuracy_percent": acc,
            "average_time": avg_d_time
        })

    # 5. Hint Dependency
    hint_perf = []
    for h in [0, 1, 2, 3]:
        h_sessions = [s for s in sessions if s.hints_used == h]
        count = len(h_sessions)
        correct = sum(1 for s in h_sessions if s.is_correct is True)
        acc = round((correct / count) * 100.0, 1) if count > 0 else 0.0
        hint_perf.append({
            "hints_used": f"{h} Hints" if h > 0 else "0 Hints (Independent)",
            "count": count,
            "accuracy_percent": acc
        })

    return {
        "has_data": True,
        "total_sessions": total_sessions,
        "accuracy_percent": accuracy_percent,
        "average_time_seconds": avg_time,
        "accuracy_over_time": accuracy_over_time,
        "confusion_matrix": confusion_matrix,
        "location_performance": location_perf,
        "difficulty_breakdown": diff_perf,
        "hint_dependency": hint_perf
    }
