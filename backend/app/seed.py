from datetime import datetime, timedelta
import random
from sqlalchemy.orm import Session
from .database import engine, Base, SessionLocal
from .models import Trainee, TrainingSession, Device
from .scoring import calculate_session_score

def seed_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # Check if already seeded
    if db.query(Trainee).count() > 0:
        db.close()
        return

    # Seed Trainees
    trainees_data = [
        {"trainee_id": "ITI-DEL-042", "full_name": "Rahul Sharma", "iti_centre": "Govt ITI Pusa, New Delhi", "trade": "Plumber", "batch": "2025-26"},
        {"trainee_id": "ITI-MUM-108", "full_name": "Pooja Patil", "iti_centre": "Govt ITI Kurla, Mumbai", "trade": "Plumber", "batch": "2025-26"},
        {"trainee_id": "ITI-BLR-019", "full_name": "Karthik Gowda", "iti_centre": "Govt ITI Peenya, Bengaluru", "trade": "Plumbing & Sanitation", "batch": "2025-26"},
        {"trainee_id": "ITI-CHN-055", "full_name": "Ananya Sundaram", "iti_centre": "Govt ITI Guindy, Chennai", "trade": "Plumber", "batch": "2025-26"},
        {"trainee_id": "ITI-KOL-072", "full_name": "Amitava Roy", "iti_centre": "Govt ITI Gariahat, Kolkata", "trade": "Plumber", "batch": "2024-25"}
    ]

    trainee_objs = []
    for td in trainees_data:
        t = Trainee(**td, enrollment_date=datetime.utcnow() - timedelta(days=60))
        db.add(t)
        trainee_objs.append(t)
    db.commit()

    # Seed Hardware Device
    uno_device = Device(
        device_id="UNOQ-001",
        name="Arduino UNO Q Rig Module (Lab Bench A)",
        status="disconnected",
        firmware_version="1.0.4-unoq",
        model_version="rf-acoustic-v1.2",
        ip_or_port="COM3 / 192.168.1.105",
        last_heartbeat=datetime.utcnow() - timedelta(minutes=15)
    )
    db.add(uno_device)
    db.commit()

    # Seed historical sessions for analytics & confusion matrix
    classes = ["No Leak", "Left", "Centre", "Right"]
    diffs = ["easy", "medium", "hard"]

    # Pre-defined realistic training session records
    sample_scenarios = [
        ("Left", "Left", "easy", 22.0, 0, "COMPLIANT", "Small"),
        ("Left", "Left", "medium", 28.5, 0, "COMPLIANT", "Medium"),
        ("Right", "Right", "medium", 31.0, 0, "COMPLIANT", "Medium"),
        ("Centre", "Centre", "hard", 19.5, 0, "COMPLIANT", "Large"),
        ("No Leak", "No Leak", "easy", 35.0, 0, "NOT_ASSESSED", "None"),
        ("Left", "Centre", "hard", 45.0, 1, "COMPLIANT", "Small"),   # Mistake (mistook Left for Centre)
        ("Right", "Left", "medium", 42.0, 1, "NON_COMPLIANT", "Small"), # Mistake
        ("Centre", "Centre", "easy", 25.0, 0, "COMPLIANT", "Medium"),
        ("Right", "Right", "easy", 18.0, 0, "COMPLIANT", "Large"),
        ("No Leak", "Centre", "medium", 38.0, 1, "NOT_ASSESSED", "None"), # Mistake
        ("Left", "Left", "medium", 26.0, 0, "COMPLIANT", "Medium"),
        ("Centre", "Right", "hard", 33.0, 0, "COMPLIANT", "Medium"), # Mistake
        ("Right", "Right", "hard", 21.0, 0, "COMPLIANT", "Large"),
        ("No Leak", "No Leak", "medium", 29.0, 0, "COMPLIANT", "None"),
        ("Left", "Left", "hard", 17.5, 0, "COMPLIANT", "Medium")
    ]

    base_time = datetime.utcnow() - timedelta(days=7)

    for i, (actual, diagnosis, diff, duration, hints, comp, sev) in enumerate(sample_scenarios, 1):
        tr = trainee_objs[i % len(trainee_objs)]
        eval_res = calculate_session_score(
            ground_truth=actual,
            trainee_diagnosis=diagnosis,
            duration_seconds=duration,
            difficulty=diff,
            hints_used=hints,
            attempts=1,
            procedure_compliance=comp
        )

        sess_time = base_time + timedelta(hours=i * 10)
        s = TrainingSession(
            session_code=f"SESS-202610{10 + (i%5):02d}-{i:04d}",
            trainee_id=tr.id,
            session_type="assessment" if i % 3 != 0 else "practice",
            status="COMPLETED",
            difficulty=diff,
            ground_truth_leak=actual,
            leak_severity=sev,
            trainee_diagnosis=diagnosis,
            is_correct=eval_res["is_correct"],
            duration_seconds=duration,
            hints_used=hints,
            attempts=1,
            procedure_compliance=comp,
            ai_prediction=actual,  # Model predicted actual
            ai_confidence=round(random.uniform(0.82, 0.94), 2),
            ai_model_source="SIMULATED",
            score_correctness=eval_res["score_correctness"],
            score_time=eval_res["score_time"],
            score_independence=eval_res["score_independence"],
            score_compliance=eval_res["score_compliance"],
            total_score=eval_res["total_score"],
            performance_category=eval_res["performance_category"],
            feedback_remarks=eval_res["feedback_remarks"],
            trainer_notes="Standard ITI evaluation conducted.",
            started_at=sess_time - timedelta(seconds=int(duration)),
            completed_at=sess_time,
            created_at=sess_time - timedelta(minutes=5)
        )
        db.add(s)

    db.commit()
    db.close()
    print("Database successfully seeded with realistic demonstration records.")

if __name__ == "__main__":
    seed_database()
