from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import or_
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db

router = APIRouter(prefix="/api/products", tags=["products"])


@router.get("", response_model=list[schemas.ProductOut])
def list_products(
    q: Optional[str] = None,
    category: Optional[str] = None,
    skin_type: Optional[str] = None,
    concern: Optional[str] = None,
    max_price: Optional[float] = None,
    source: Optional[str] = None,
    sort: str = "name",
    db: Session = Depends(get_db),
):
    query = db.query(models.Product)

    if source:
        query = query.filter(models.Product.source == source)
    if q:
        like = f"%{q}%"
        query = query.filter(or_(models.Product.name.ilike(like), models.Product.brand.ilike(like)))
    if category:
        query = query.filter(models.Product.category == category)
    if skin_type:
        query = query.filter(models.Product.skin_types.any(skin_type))
    if concern:
        query = query.filter(models.Product.concerns.any(concern))
    if max_price is not None:
        query = query.filter(models.Product.price <= max_price)

    if sort == "price_asc":
        query = query.order_by(models.Product.price.asc())
    elif sort == "price_desc":
        query = query.order_by(models.Product.price.desc())
    else:
        query = query.order_by(models.Product.brand.asc(), models.Product.name.asc())

    return query.all()


@router.get("/{product_id}", response_model=schemas.ProductOut)
def get_product(product_id: str, db: Session = Depends(get_db)):
    product = db.query(models.Product).get(product_id)
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return product
