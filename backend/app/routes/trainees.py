from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from ..models import Trainee, TrainingSession
from ..schemas import TraineeCreate, TraineeUpdate, TraineeResponse

router = APIRouter(prefix="/api/trainees", tags=["trainees"])

@router.get("", response_model=List[TraineeResponse])
def get_trainees(
    query: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    q = db.query(Trainee)
    if status and status != "all":
        q = q.filter(Trainee.status == status)
    if query:
        search = f"%{query}%"
        q = q.filter((Trainee.full_name.ilike(search)) | (Trainee.trainee_id.ilike(search)) | (Trainee.iti_centre.ilike(search)))
    
    trainees = q.order_by(Trainee.created_at.desc()).all()
    results = []
    for t in trainees:
        completed_sessions = [s for s in t.sessions if s.status == "COMPLETED" and s.total_score is not None]
        avg_score = round(sum(s.total_score for s in completed_sessions) / len(completed_sessions), 1) if completed_sessions else None
        
        item = TraineeResponse(
            id=t.id,
            trainee_id=t.trainee_id,
            full_name=t.full_name,
            iti_centre=t.iti_centre,
            trade=t.trade,
            batch=t.batch,
            status=t.status,
            enrollment_date=t.enrollment_date,
            created_at=t.created_at,
            completed_sessions_count=len(completed_sessions),
            average_score=avg_score
        )
        results.append(item)
    return results

@router.post("", response_model=TraineeResponse)
def create_trainee(trainee_in: TraineeCreate, db: Session = Depends(get_db)):
    existing = db.query(Trainee).filter(Trainee.trainee_id == trainee_in.trainee_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Trainee ID already exists")
    
    trainee = Trainee(**trainee_in.model_dump())
    db.add(trainee)
    db.commit()
    db.refresh(trainee)
    return TraineeResponse(
        id=trainee.id,
        trainee_id=trainee.trainee_id,
        full_name=trainee.full_name,
        iti_centre=trainee.iti_centre,
        trade=trainee.trade,
        batch=trainee.batch,
        status=trainee.status,
        enrollment_date=trainee.enrollment_date,
        created_at=trainee.created_at,
        completed_sessions_count=0,
        average_score=None
    )

@router.get("/{trainee_id}", response_model=TraineeResponse)
def get_trainee(trainee_id: int, db: Session = Depends(get_db)):
    t = db.query(Trainee).filter(Trainee.id == trainee_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Trainee not found")
    completed_sessions = [s for s in t.sessions if s.status == "COMPLETED" and s.total_score is not None]
    avg_score = round(sum(s.total_score for s in completed_sessions) / len(completed_sessions), 1) if completed_sessions else None
    return TraineeResponse(
        id=t.id,
        trainee_id=t.trainee_id,
        full_name=t.full_name,
        iti_centre=t.iti_centre,
        trade=t.trade,
        batch=t.batch,
        status=t.status,
        enrollment_date=t.enrollment_date,
        created_at=t.created_at,
        completed_sessions_count=len(completed_sessions),
        average_score=avg_score
    )

@router.put("/{trainee_id}", response_model=TraineeResponse)
def update_trainee(trainee_id: int, data: TraineeUpdate, db: Session = Depends(get_db)):
    t = db.query(Trainee).filter(Trainee.id == trainee_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Trainee not found")
    for field, val in data.model_dump(exclude_unset=True).items():
        setattr(t, field, val)
    db.commit()
    db.refresh(t)
    return TraineeResponse(
        id=t.id,
        trainee_id=t.trainee_id,
        full_name=t.full_name,
        iti_centre=t.iti_centre,
        trade=t.trade,
        batch=t.batch,
        status=t.status,
        enrollment_date=t.enrollment_date,
        created_at=t.created_at,
        completed_sessions_count=0,
        average_score=None
    )
