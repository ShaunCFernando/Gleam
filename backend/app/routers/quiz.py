import copy

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .. import models
from ..database import get_db
from ..quiz_config import QUIZ_STEPS

router = APIRouter(prefix="/api/quiz-config", tags=["quiz"])


@router.get("")
def get_quiz_config(db: Session = Depends(get_db)):
    steps = copy.deepcopy(QUIZ_STEPS)
    concerns = db.query(models.Concern).all()
    for step in steps:
        if step["id"] == "concerns":
            step["options"] = [{"value": c.id, "label": c.label} for c in concerns]
    return steps
