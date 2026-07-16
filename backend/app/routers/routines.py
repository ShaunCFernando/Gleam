import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..scoring import build_routine

router = APIRouter(prefix="/api/routines", tags=["routines"])


def _to_routine_out(slug: str, answers: schemas.QuizAnswers, db: Session) -> schemas.RoutineOut:
    steps = build_routine(db, answers)
    total = sum((s["pick"]["product"].price or 0) for s in steps if s["pick"])
    return schemas.RoutineOut(slug=slug, total_price=total, answers=answers, steps=steps)


@router.post("", response_model=schemas.RoutineOut)
def create_routine(answers: schemas.QuizAnswers, db: Session = Depends(get_db)):
    saved = models.SavedRoutine(
        slug=uuid.uuid4().hex[:10],
        skin_type=answers.skin_type,
        sensitivity=answers.sensitivity,
        concerns=answers.concerns,
        budget=answers.budget,
        routine_size=answers.routine_size,
    )
    db.add(saved)
    db.commit()
    db.refresh(saved)
    return _to_routine_out(saved.slug, answers, db)


@router.get("/{slug}", response_model=schemas.RoutineOut)
def get_routine(slug: str, db: Session = Depends(get_db)):
    saved = db.query(models.SavedRoutine).get(slug)
    if saved is None:
        raise HTTPException(status_code=404, detail="Routine not found")
    answers = schemas.QuizAnswers(
        skin_type=saved.skin_type,
        sensitivity=saved.sensitivity,
        concerns=saved.concerns,
        budget=saved.budget,
        routine_size=saved.routine_size,
    )
    # Recomputed live from current catalog data, so edits to products/pricing
    # are reflected even for previously shared links.
    return _to_routine_out(saved.slug, answers, db)
