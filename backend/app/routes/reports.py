from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import TrainingSession, Trainee
from ..reports import generate_session_pdf, generate_sessions_csv

router = APIRouter(prefix="/api/reports", tags=["reports"])

@router.get("/session/{session_id}/pdf")
def download_session_pdf(session_id: int, db: Session = Depends(get_db)):
    session = db.query(TrainingSession).filter(TrainingSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session_data = {
        "session_code": session.session_code,
        "completed_at": session.completed_at.strftime("%Y-%m-%d %H:%M") if session.completed_at else "Ongoing",
        "session_type": session.session_type,
        "difficulty": session.difficulty,
        "ground_truth_leak": session.ground_truth_leak,
        "trainee_diagnosis": session.trainee_diagnosis,
        "is_correct": session.is_correct,
        "duration_seconds": session.duration_seconds,
        "hints_used": session.hints_used,
        "procedure_compliance": session.procedure_compliance,
        "ai_prediction": session.ai_prediction,
        "ai_confidence": session.ai_confidence,
        "ai_model_source": session.ai_model_source,
        "score_correctness": session.score_correctness,
        "score_time": session.score_time,
        "score_independence": session.score_independence,
        "score_compliance": session.score_compliance,
        "total_score": session.total_score,
        "performance_category": session.performance_category,
        "feedback_remarks": session.feedback_remarks,
        "trainer_notes": session.trainer_notes
    }

    trainee = session.trainee
    trainee_data = {
        "trainee_id": trainee.trainee_id if trainee else "N/A",
        "full_name": trainee.full_name if trainee else "N/A",
        "iti_centre": trainee.iti_centre if trainee else "Govt ITI",
        "trade": trainee.trade if trainee else "Plumber",
        "batch": trainee.batch if trainee else "2025-26"
    }

    pdf_bytes = generate_session_pdf(session_data, trainee_data)
    filename = f"Leaksense_Report_{session.session_code}.pdf"

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.get("/export/csv")
def download_all_sessions_csv(db: Session = Depends(get_db)):
    sessions = db.query(TrainingSession).order_by(TrainingSession.completed_at.desc()).all()
    csv_str = generate_sessions_csv(sessions)
    return Response(
        content=csv_str,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=leaksense_training_sessions.csv"}
    )
