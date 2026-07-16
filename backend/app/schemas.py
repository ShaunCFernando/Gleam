from typing import Literal, Optional

from pydantic import BaseModel, Field


class ConcernOut(BaseModel):
    id: str
    label: str

    class Config:
        from_attributes = True


class ProductOut(BaseModel):
    id: str
    brand: str
    name: str
    category: str
    price: Optional[float]
    skin_types: list[str]
    concerns: list[str]
    sensitive_safe: bool
    actives: bool
    ingredient: str
    blurb: str
    image_url: Optional[str]
    source: str

    class Config:
        from_attributes = True


class QuizAnswers(BaseModel):
    skin_type: Literal["oily", "dry", "combination", "normal"]
    sensitivity: Literal["yes", "somewhat", "no"]
    concerns: list[str] = Field(default_factory=list, max_length=3)
    budget: Literal["lean", "mid", "premium"]
    routine_size: Literal["essential", "balanced", "full"]


class ProductMatchOut(BaseModel):
    product: ProductOut
    score: float
    reasons: list[str]


class RoutineStepOut(BaseModel):
    category: str
    label: str
    tip: str
    pick: Optional[ProductMatchOut]
    alt: Optional[ProductMatchOut]


class RoutineOut(BaseModel):
    slug: str
    total_price: float
    answers: QuizAnswers
    steps: list[RoutineStepOut]
