"""Creates tables (if needed) and populates them from seed_data.py.

Run any time (including repeatedly): `python -m app.seed`
Upserts by id — inserts anything new in seed_data.py, leaves existing rows
alone, never wipes data. Safe to re-run after just adding entries.
"""

from . import models, seed_data
from .database import Base, SessionLocal, engine


def run():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        existing_concern_ids = {row[0] for row in db.query(models.Concern.id).all()}
        new_concerns = [c for c in seed_data.CONCERNS if c["id"] not in existing_concern_ids]
        if new_concerns:
            db.bulk_save_objects([models.Concern(**c) for c in new_concerns])
            print(f"Added {len(new_concerns)} new concerns")

        existing_product_ids = {row[0] for row in db.query(models.Product.id).all()}
        new_products = [p for p in seed_data.PRODUCTS if p["id"] not in existing_product_ids]
        if new_products:
            db.bulk_save_objects([models.Product(**p, source="curated") for p in new_products])
            print(f"Added {len(new_products)} new curated products")

        if not new_concerns and not new_products:
            print("Nothing new to seed — already up to date.")

        db.commit()
    finally:
        db.close()


if __name__ == "__main__":
    run()
