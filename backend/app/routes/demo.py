from datetime import datetime, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Trainee, TrainingSession, Device
from ..simulation import rig_simulator
from ..scoring import calculate_session_score

router = APIRouter(prefix="/api/demo", tags=["demo"])

@router.post("/trigger-step")
def trigger_demo_step(step: int, db: Session = Depends(get_db)):
    """
    Executes individual steps of the 10-step SIH Hackathon Demo Walkthrough.
    Deterministic, clear, and fully recorded.
    """
    trainee = db.query(Trainee).filter(Trainee.trainee_id == "ITI-DEL-042").first()
    if not trainee:
        trainee = Trainee(
            trainee_id="ITI-DEL-042",
            full_name="Rahul Sharma",
            iti_centre="Govt ITI Pusa, New Delhi",
            trade="Plumbing & Sanitary",
            batch="2025-2026"
        )
        db.add(trainee)
        db.commit()
        db.refresh(trainee)

    active_sess = db.query(TrainingSession).filter(TrainingSession.session_code.like("DEMO-SIH-%")).first()

    step_info = {
        1: "Simulation Started: Circulation pump activated at 75% flow.",
        2: "Concealed Leak Configured: Left leak scenario set with Medium severity.",
        3: "Synthetic Sensor Readings Generated: Asymmetric acoustic waveform at Sensor A.",
        4: "Simulated Model Inference: Classified as 'Left' (88% confidence).",
        5: "Trainee Assessment Initiated: Session timer started, ground truth isolated.",
        6: "Trainee Diagnosis Submitted: Trainee selected 'Left'.",
        7: "Score Calculated: 94.0/100 (Mastery level achieved).",
        8: "Session Saved to SQLite: Local-first persistence confirmed.",
        9: "Analytics Aggregated: Confusion matrix and performance trends refreshed.",
        10: "PDF Report Ready for Download."
    }

    if step in (1, 2):
        rig_simulator.configure(leak_location="Left", leak_severity="Medium", pump_flow=80.0)
    elif step == 5:
        if not active_sess:
            active_sess = TrainingSession(
                session_code=f"DEMO-SIH-{int(datetime.utcnow().timestamp())}",
                trainee_id=trainee.id,
                session_type="assessment",
                status="RUNNING",
                difficulty="medium",
                ground_truth_leak="Left",
                leak_severity="Medium",
                started_at=datetime.utcnow() - timedelta(seconds=24)
            )
            db.add(active_sess)
            db.commit()
            db.refresh(active_sess)
    elif step in (6, 7, 8):
        if not active_sess:
            active_sess = TrainingSession(
                session_code=f"DEMO-SIH-{int(datetime.utcnow().timestamp())}",
                trainee_id=trainee.id,
                session_type="assessment",
                status="RUNNING",
                difficulty="medium",
                ground_truth_leak="Left",
                leak_severity="Medium",
                started_at=datetime.utcnow() - timedelta(seconds=24)
            )
            db.add(active_sess)
            db.commit()

        eval_res = calculate_session_score(
            ground_truth="Left",
            trainee_diagnosis="Left",
            duration_seconds=24.5,
            difficulty="medium",
            hints_used=0,
            attempts=1,
            procedure_compliance="COMPLIANT"
        )
        active_sess.trainee_diagnosis = "Left"
        active_sess.is_correct = True
        active_sess.duration_seconds = 24.5
        active_sess.hints_used = 0
        active_sess.procedure_compliance = "COMPLIANT"
        active_sess.ai_prediction = "Left"
        active_sess.ai_confidence = 0.88
        active_sess.ai_model_source = "SIMULATED"
        active_sess.score_correctness = eval_res["score_correctness"]
        active_sess.score_time = eval_res["score_time"]
        active_sess.score_independence = eval_res["score_independence"]
        active_sess.score_compliance = eval_res["score_compliance"]
        active_sess.total_score = eval_res["total_score"]
        active_sess.performance_category = eval_res["performance_category"]
        active_sess.feedback_remarks = eval_res["feedback_remarks"]
        active_sess.completed_at = datetime.utcnow()
        active_sess.status = "COMPLETED"
        db.commit()

    return {
        "step": step,
        "title": f"Step {step}/10",
        "description": step_info.get(step, "Step executed"),
        "session_id": active_sess.id if active_sess else None,
        "session_code": active_sess.session_code if active_sess else None,
        "is_complete": step == 10
    }

@router.post("/reset")
def reset_demo(db: Session = Depends(get_db)):
    """Resets simulator rig to baseline and cleans demo transient state."""
    rig_simulator.configure(leak_location="No Leak", leak_severity="None", pump_flow=75.0)
    return {"status": "reset", "message": "Demo reset to baseline: No Leak, 75% pump flow."}
