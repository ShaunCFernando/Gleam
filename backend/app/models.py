import uuid

from sqlalchemy import Boolean, Column, DateTime, Float, String, func
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.sql import expression

from .database import Base


class Concern(Base):
    __tablename__ = "concerns"

    id = Column(String, primary_key=True)
    label = Column(String, nullable=False)


class Product(Base):
    __tablename__ = "products"

    id = Column(String, primary_key=True)
    brand = Column(String, nullable=False)
    name = Column(String, nullable=False)
    category = Column(String, nullable=False, index=True)
    price = Column(Float, nullable=True)
    skin_types = Column(ARRAY(String), nullable=False, server_default=expression.text("'{}'"))
    concerns = Column(ARRAY(String), nullable=False, server_default=expression.text("'{}'"))
    sensitive_safe = Column(Boolean, nullable=False, default=False)
    actives = Column(Boolean, nullable=False, default=False)
    ingredient = Column(String, nullable=False)
    blurb = Column(String, nullable=False, default="")
    image_url = Column(String, nullable=True)
    # "curated": hand-tagged, has verified skin_type/concern/actives data — eligible
    # for quiz matching. "external": bulk-imported for browsing only (see
    # app/import_external.py) — no verified safety tags, never scored.
    source = Column(String, nullable=False, default="curated", server_default="curated")


class SavedRoutine(Base):
    """A quiz submission, addressable by a short slug so results can be shared."""

    __tablename__ = "saved_routines"

    slug = Column(String, primary_key=True, default=lambda: uuid.uuid4().hex[:10])
    skin_type = Column(String, nullable=False)
    sensitivity = Column(String, nullable=False)
    concerns = Column(ARRAY(String), nullable=False, server_default=expression.text("'{}'"))
    budget = Column(String, nullable=False)
    routine_size = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
