from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db

router = APIRouter(prefix="/api/concerns", tags=["concerns"])


@router.get("", response_model=list[schemas.ConcernOut])
def list_concerns(db: Session = Depends(get_db)):
    return db.query(models.Concern).all()
