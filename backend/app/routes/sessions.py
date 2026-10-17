import time
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from ..models import TrainingSession, Trainee
from ..schemas import SessionCreate, SessionSubmission, SessionTrainerUpdate, SessionResponse
from ..scoring import calculate_session_score
from ..simulation import rig_simulator
from ..ml_adapter import ml_adapter
from ..cloud_sync import cloud_sync_manager

router = APIRouter(prefix="/api/sessions", tags=["sessions"])

def serialize_session(s: TrainingSession, is_trainer: bool = False) -> SessionResponse:
    # Role-based Ground Truth Protection
    # Conceal ground truth & AI prediction from trainee during active assessment
    hide_ground_truth = (not is_trainer) and (s.session_type == "assessment") and (s.status != "COMPLETED")
    
    return SessionResponse(
        id=s.id,
        session_code=s.session_code,
        trainee_id=s.trainee_id,
        trainee_name=s.trainee.full_name if s.trainee else "Unknown",
        trainee_code=s.trainee.trainee_id if s.trainee else "N/A",
        session_type=s.session_type,
        status=s.status,
        difficulty=s.difficulty,
        ground_truth_leak=None if hide_ground_truth else s.ground_truth_leak,
        leak_severity=None if hide_ground_truth else s.leak_severity,
        trainee_diagnosis=s.trainee_diagnosis,
        is_correct=s.is_correct,
        duration_seconds=s.duration_seconds,
        hints_used=s.hints_used if s.hints_used is not None else 0,
        attempts=s.attempts if s.attempts is not None else 1,
        procedure_compliance=s.procedure_compliance or "NOT_ASSESSED",
        ai_prediction=None if hide_ground_truth else s.ai_prediction,
        ai_confidence=None if hide_ground_truth else s.ai_confidence,
        ai_model_source=s.ai_model_source or "SIMULATED",
        score_correctness=s.score_correctness,
        score_time=s.score_time,
        score_independence=s.score_independence,
        score_compliance=s.score_compliance,
        total_score=s.total_score,
        performance_category=s.performance_category,
        trainer_notes=s.trainer_notes,
        feedback_remarks=s.feedback_remarks,
        started_at=s.started_at,
        completed_at=s.completed_at,
        created_at=s.created_at
    )

@router.get("", response_model=List[SessionResponse])
def get_sessions(
    role: str = Query("trainer", pattern="^(trainer|trainee)$"),
    trainee_id: Optional[int] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    q = db.query(TrainingSession)
    if trainee_id:
        q = q.filter(TrainingSession.trainee_id == trainee_id)
    if status and status != "all":
        q = q.filter(TrainingSession.status == status)
    
    sessions = q.order_by(TrainingSession.created_at.desc()).all()
    is_trainer = (role == "trainer")
    return [serialize_session(s, is_trainer=is_trainer) for s in sessions]

@router.post("", response_model=SessionResponse)
def create_session(sess_in: SessionCreate, db: Session = Depends(get_db)):
    trainee = db.query(Trainee).filter(Trainee.id == sess_in.trainee_id).first()
    if not trainee:
        raise HTTPException(status_code=404, detail="Trainee not found")

    code = f"SESS-{datetime.utcnow().strftime('%Y%m%d')}-{db.query(TrainingSession).count() + 1:04d}"
    
    session = TrainingSession(
        session_code=code,
        trainee_id=sess_in.trainee_id,
        session_type=sess_in.session_type,
        status="CREATED",
        difficulty=sess_in.difficulty,
        ground_truth_leak=sess_in.ground_truth_leak,
        leak_severity=sess_in.leak_severity,
        trainer_notes=sess_in.trainer_notes,
        created_at=datetime.utcnow()
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    # Configure rig simulator to match session ground truth
    rig_simulator.configure(
        leak_location=sess_in.ground_truth_leak,
        leak_severity=sess_in.leak_severity
    )

    return serialize_session(session, is_trainer=True)

@router.post("/{session_id}/start", response_model=SessionResponse)
def start_session(session_id: int, db: Session = Depends(get_db)):
    s = db.query(TrainingSession).filter(TrainingSession.id == session_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Session not found")
    
    s.status = "RUNNING"
    s.started_at = datetime.utcnow()
    
    # Configure rig simulator to active scenario
    rig_simulator.configure(
        leak_location=s.ground_truth_leak,
        leak_severity=s.leak_severity
    )
    
    db.commit()
    db.refresh(s)
    return serialize_session(s, is_trainer=True)

@router.post("/{session_id}/cancel", response_model=SessionResponse)
def cancel_session(session_id: int, db: Session = Depends(get_db)):
    s = db.query(TrainingSession).filter(TrainingSession.id == session_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Session not found")
    s.status = "CANCELLED"
    db.commit()
    db.refresh(s)
    return serialize_session(s, is_trainer=True)

@router.post("/{session_id}/submit", response_model=SessionResponse)
def submit_diagnosis(
    session_id: int,
    submission: SessionSubmission,
    role: str = Query("trainee"),
    db: Session = Depends(get_db)
):
    s = db.query(TrainingSession).filter(TrainingSession.id == session_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if s.status == "COMPLETED":
        raise HTTPException(status_code=400, detail="Session is already completed and locked")

    now = datetime.utcnow()
    duration = submission.duration_seconds
    if duration is None:
        if s.started_at:
            duration = max(1.0, (now - s.started_at).total_seconds())
        else:
            duration = 25.0

    # Capture current AI inference (for reference / comparison only, NOT ground truth)
    packet = rig_simulator.generate_packet(session_id=s.id)
    features = {
        "vibration_a_rms": packet["vibration_a_rms"],
        "vibration_b_rms": packet["vibration_b_rms"],
        "pressure_kpa": packet["pressure_kpa"]
    }
    ai_result = ml_adapter.infer(features)

    # Evaluate scoring rubric
    eval_result = calculate_session_score(
        ground_truth=s.ground_truth_leak,
        trainee_diagnosis=submission.trainee_diagnosis,
        duration_seconds=duration,
        difficulty=s.difficulty,
        hints_used=submission.hints_used,
        attempts=submission.attempts,
        procedure_compliance=submission.procedure_compliance or s.procedure_compliance
    )

    s.trainee_diagnosis = submission.trainee_diagnosis
    s.is_correct = eval_result["is_correct"]
    s.duration_seconds = round(duration, 1)
    s.hints_used = submission.hints_used
    s.attempts = submission.attempts
    s.procedure_compliance = submission.procedure_compliance or "NOT_ASSESSED"
    s.ai_prediction = ai_result["predicted_class"]
    s.ai_confidence = ai_result["confidence"]
    s.ai_model_source = ai_result["inference_source"]
    s.score_correctness = eval_result["score_correctness"]
    s.score_time = eval_result["score_time"]
    s.score_independence = eval_result["score_independence"]
    s.score_compliance = eval_result["score_compliance"]
    s.total_score = eval_result["total_score"]
    s.performance_category = eval_result["performance_category"]
    s.feedback_remarks = eval_result["feedback_remarks"]
    s.completed_at = now
    s.status = "COMPLETED"

    db.commit()
    db.refresh(s)

    # Queue for offline-first sync
    cloud_sync_manager.queue_record(db, "session", s.session_code, {
        "session_code": s.session_code,
        "trainee_id": s.trainee.trainee_id if s.trainee else None,
        "is_correct": s.is_correct,
        "total_score": s.total_score,
        "completed_at": s.completed_at.isoformat()
    })

    return serialize_session(s, is_trainer=True)

@router.put("/{session_id}/trainer", response_model=SessionResponse)
def update_trainer_session(session_id: int, update_data: SessionTrainerUpdate, db: Session = Depends(get_db)):
    s = db.query(TrainingSession).filter(TrainingSession.id == session_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Session not found")

    if update_data.procedure_compliance is not None:
        s.procedure_compliance = update_data.procedure_compliance
        # Recompute score if completed
        if s.status == "COMPLETED" and s.trainee_diagnosis:
            eval_result = calculate_session_score(
                ground_truth=s.ground_truth_leak,
                trainee_diagnosis=s.trainee_diagnosis,
                duration_seconds=s.duration_seconds or 30.0,
                difficulty=s.difficulty,
                hints_used=s.hints_used,
                attempts=s.attempts,
                procedure_compliance=s.procedure_compliance
            )
            s.score_compliance = eval_result["score_compliance"]
            s.total_score = eval_result["total_score"]
            s.performance_category = eval_result["performance_category"]
            s.feedback_remarks = eval_result["feedback_remarks"]

    if update_data.trainer_notes is not None:
        s.trainer_notes = update_data.trainer_notes

    if update_data.status is not None:
        s.status = update_data.status

    db.commit()
    db.refresh(s)
    return serialize_session(s, is_trainer=True)

@router.get("/{session_id}", response_model=SessionResponse)
def get_session(session_id: int, role: str = Query("trainer"), db: Session = Depends(get_db)):
    s = db.query(TrainingSession).filter(TrainingSession.id == session_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Session not found")
    return serialize_session(s, is_trainer=(role == "trainer"))
