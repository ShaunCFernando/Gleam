"""Ported from the original seoul-shelf.jsx scoreProduct()/buildRoutine() logic.

Kept as backend-only domain logic (not DB rows) — it encodes matching rules,
not editable content.
"""

from sqlalchemy.orm import Session

from . import models

ROUTINES: dict[str, list[str]] = {
    "essential": ["cleanser", "toner", "moisturizer", "spf"],
    "balanced": ["cleanser", "toner", "serum", "moisturizer", "spf"],
    "full": ["cleanser", "toner", "essence", "serum", "moisturizer", "spf", "mask"],
}

STEP_META: dict[str, dict[str, str]] = {
    "cleanser": {"label": "Cleanse", "tip": "Massage onto damp skin for 60 seconds, morning and night."},
    "toner": {"label": "Tone", "tip": "Pat in with hands. Koreans skip the cotton pad to cut down on waste and friction."},
    "essence": {"label": "Essence", "tip": "The heart of the K-routine. Press into skin while it's still damp from toner."},
    "serum": {"label": "Treat", "tip": "Your targeted step. A few drops where the concern lives."},
    "moisturizer": {"label": "Moisturize", "tip": "Seal everything in. Don't skip this even on oily days."},
    "spf": {"label": "Protect", "tip": "Two finger-lengths, every morning. The single highest-impact step for tone and aging."},
    "mask": {"label": "Weekly treat", "tip": "1–2× per week, after cleansing, in place of (or before) your serum."},
}

BUDGET_PRESSURE = {"lean": 0.09, "mid": 0.03, "premium": 0.0}


def score_product(product: models.Product, answers, concern_labels: dict[str, str]) -> tuple[float, list[str]]:
    score = 0.0
    reasons: list[str] = []

    if answers.skin_type in product.skin_types:
        score += 2.5
        reasons.append(f"{answers.skin_type} skin")
    elif "all" in product.skin_types:
        score += 1.2
    else:
        score -= 1.5

    for c in answers.concerns:
        if c in product.concerns:
            score += 2
            label = concern_labels.get(c)
            if label:
                reasons.append(label.lower())

    if answers.sensitivity == "yes":
        if product.actives:
            score -= 100
        if product.sensitive_safe:
            score += 1
    elif answers.sensitivity == "somewhat" and product.actives:
        score -= 2

    score -= (product.price or 0) * BUDGET_PRESSURE[answers.budget]

    # de-dupe while preserving order
    seen = set()
    deduped = []
    for r in reasons:
        if r not in seen:
            seen.add(r)
            deduped.append(r)
    return score, deduped


def build_routine(db: Session, answers):
    concern_labels = {c.id: c.label for c in db.query(models.Concern).all()}
    categories = ROUTINES[answers.routine_size]
    # Only hand-tagged products carry verified skin_type/concern/actives data —
    # bulk-imported "external" products (see import_external.py) are browse-only
    # and must never be scored or silently recommended.
    all_products = (
        db.query(models.Product)
        .filter(models.Product.category.in_(categories), models.Product.source == "curated")
        .all()
    )
    by_category: dict[str, list[models.Product]] = {c: [] for c in categories}
    for p in all_products:
        by_category[p.category].append(p)

    steps = []
    for category in categories:
        ranked = []
        for p in by_category[category]:
            score, reasons = score_product(p, answers, concern_labels)
            if score > -50:
                ranked.append((score, reasons, p))
        ranked.sort(key=lambda r: r[0], reverse=True)

        pick = ranked[0] if len(ranked) > 0 else None
        alt = ranked[1] if len(ranked) > 1 else None
        meta = STEP_META[category]
        steps.append(
            {
                "category": category,
                "label": meta["label"],
                "tip": meta["tip"],
                "pick": {"product": pick[2], "score": pick[0], "reasons": pick[1]} if pick else None,
                "alt": {"product": alt[2], "score": alt[0], "reasons": alt[1]} if alt else None,
            }
        )
    return steps
