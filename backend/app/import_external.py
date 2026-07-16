"""Bulk-imports real, photographed products from Open Beauty Facts
(https://world.openbeautyfacts.org) — a free, open cosmetics database (ODbL /
CC-BY-SA for images), so the catalog isn't limited to hand-typed entries.

These imported rows are marked source="external": they have real brand/name/
photo/ingredient-list data, but NOT the verified skin_type/concern/actives
tags our quiz's safety-sensitive matching depends on. scoring.build_routine()
filters to source="curated" only, so external products only ever appear in
the /catalog browse page — never silently recommended.

As a bonus, this also does a conservative best-effort match to backfill real
photos onto the existing hand-curated products.

Run once (or occasionally, to refresh): `python -m app.import_external`
Polite by design: identifies itself with a real User-Agent and paces requests,
per Open Beauty Facts' API usage guidelines.
"""

import time

import requests

from . import models
from .database import SessionLocal
from .image_quality import fetch_and_check
from .text_format import format_ingredients

SEARCH_URL = "https://world.openbeautyfacts.org/cgi/search.pl"
HEADERS = {"User-Agent": "SeoulShelf/1.0 (local educational project; contact: dev@example.com)"}
FIELDS = "code,product_name,brands,image_front_url,image_url,ingredients_text"
PAGE_SIZE = 100
MAX_PAGES_PER_BRAND = 2
REQUEST_DELAY_SECONDS = 0.3

# A broad sweep of K-beauty / J-beauty / popular skincare brands to search by
# name. Open Beauty Facts' category tagging for cosmetics is too sparse to
# browse by category reliably, so we search per-brand and classify by
# keyword instead (see classify_category below).
BRANDS = [
    "COSRX", "Beauty of Joseon", "Round Lab", "Anua", "Isntree", "Numbuzin",
    "Missha", "Mixsoon", "Torriden", "Some By Mi", "Purito", "Illiyoon",
    "Etude", "Skin1004", "Mediheal", "I'm From", "Innisfree", "Laneige",
    "Sulwhasoo", "Klairs", "iUNIK", "Pyunkang Yul", "Dr. Jart", "Belif",
    "Goodal", "Aestura", "Ma:nyo", "Tirtir", "Abib", "Axis-Y", "Cosnori",
    "Holika Holika", "The Face Shop", "Nature Republic", "Banila Co",
    "Dr. Ceuracle", "Skinfood", "Mizon", "Benton", "Neogen", "Papa Recipe",
    "Heimish", "Jumiso", "Krave Beauty", "Make P:rem",
]

CATEGORY_KEYWORDS = [
    ("essence", ["essence"]),
    ("serum", ["serum", "ampoule"]),
    ("toner", ["toner", "skin softener", "toning lotion"]),
    ("cleanser", ["cleanser", "cleansing", "foam wash", "face wash"]),
    ("spf", ["sun cream", "suncream", "sunscreen", "spf", "sun stick", "sun serum"]),
    ("mask", ["sheet mask", " mask", "patch"]),
    ("moisturizer", ["cream", "lotion", "moisturiz", "moistur", "emulsion", "gel cream"]),
]


def classify_category(product_name: str) -> str | None:
    name = f" {product_name.lower()} "
    for category, keywords in CATEGORY_KEYWORDS:
        if any(kw in name for kw in keywords):
            return category
    return None


def search_brand(brand: str):
    results = []
    for page in range(1, MAX_PAGES_PER_BRAND + 1):
        resp = requests.get(
            SEARCH_URL,
            params={
                "search_terms": brand,
                "json": 1,
                "page_size": PAGE_SIZE,
                "page": page,
                "fields": FIELDS,
            },
            headers=HEADERS,
            timeout=15,
        )
        resp.raise_for_status()
        products = resp.json().get("products", [])
        results.extend(products)
        time.sleep(REQUEST_DELAY_SECONDS)
        if len(products) < PAGE_SIZE:
            break
    return results


def import_external_products(db):
    existing_ids = {row[0] for row in db.query(models.Product.id).all()}
    seen_codes = set()
    inserted = 0
    rejected_quality = 0
    by_category: dict[str, int] = {}

    for brand in BRANDS:
        try:
            raw_products = search_brand(brand)
        except requests.RequestException as exc:
            print(f"  ! skipped {brand}: {exc}")
            continue

        for p in raw_products:
            code = p.get("code")
            name = (p.get("product_name") or "").strip()
            image = p.get("image_front_url") or p.get("image_url")
            if not code or not name or not image or code in seen_codes:
                continue
            seen_codes.add(code)

            category = classify_category(name)
            if not category:
                continue

            product_id = f"obf-{code}"
            if product_id in existing_ids:
                continue

            # Reject anything that isn't a clear, plain-background photo —
            # a missing picture beats a bad one. See image_quality.py.
            passed, reason = fetch_and_check(image)
            if not passed:
                rejected_quality += 1
                continue

            db.add(
                models.Product(
                    id=product_id,
                    brand=(p.get("brands") or brand).split(",")[0].strip(),
                    name=name,
                    category=category,
                    price=None,
                    skin_types=[],
                    concerns=[],
                    sensitive_safe=False,
                    actives=False,
                    ingredient=format_ingredients(p.get("ingredients_text"), limit=3),
                    blurb="",
                    image_url=image,
                    source="external",
                )
            )
            existing_ids.add(product_id)
            inserted += 1
            by_category[category] = by_category.get(category, 0) + 1

        db.commit()
        print(f"  {brand}: {len(raw_products)} candidates seen so far, {inserted} imported total")

    print(f"Imported {inserted} external products: {by_category} ({rejected_quality} rejected for photo quality)")


def backfill_curated_images(db):
    """Best-effort, conservative: only sets image_url when brand matches, the
    OBF candidate classifies into the SAME category as the curated product
    (catches e.g. "Birch Juice Toner" vs "Birch Juice Sun Cream" — same brand
    and overlapping name words, but different products), at least two
    significant name words overlap, and the photo passes the quality bar.
    Never overwrites an image_url that's already set.
    """
    curated = (
        db.query(models.Product)
        .filter(models.Product.source == "curated", models.Product.image_url.is_(None))
        .all()
    )
    if not curated:
        return

    matched = 0
    for product in curated:
        brand_key = product.brand.lower().replace(":", "").replace(".", "")
        try:
            candidates = search_brand(product.brand)
        except requests.RequestException:
            continue

        curated_words = {w for w in product.name.lower().split() if len(w) >= 4}
        best = None
        for c in candidates:
            image = c.get("image_front_url") or c.get("image_url")
            c_brand = (c.get("brands") or "").lower().replace(":", "").replace(".", "")
            c_name = (c.get("product_name") or "").lower()
            if not image or (brand_key not in c_brand and c_brand not in brand_key):
                continue
            if classify_category(c_name) != product.category:
                continue
            # Require ALL significant curated-name words to appear (not just
            # some) — brand product lines often share a name prefix across
            # different real SKUs (e.g. "Birch Juice Moisturizing Toner" vs
            # "...Sun Cream"), and partial overlap isn't enough to tell them apart.
            if len(curated_words) >= 2 and curated_words.issubset(set(c_name.split())):
                if best is not None:
                    best = None  # ambiguous (more than one plausible match) — skip
                    break
                best = image

        if best:
            passed, reason = fetch_and_check(best)
            if not passed:
                continue
            product.image_url = best
            matched += 1
            print(f"  matched photo for {product.brand} {product.name}")

    db.commit()
    print(f"Backfilled photos onto {matched}/{len(curated)} curated products missing one.")


def run():
    db = SessionLocal()
    try:
        print("Importing external products from Open Beauty Facts...")
        import_external_products(db)
        print("\nBackfilling photos onto curated products...")
        backfill_curated_images(db)
    finally:
        db.close()


if __name__ == "__main__":
    run()
