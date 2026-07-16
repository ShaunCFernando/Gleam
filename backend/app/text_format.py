"""Shared text formatting for ingredient lists: proper Title Case (with
chemistry acronyms and minor words handled), capped to the top N entries.
"""

import re

MINOR_WORDS = {"of", "and", "the", "in", "for", "with", "a", "an", "to", "from", "or"}
ACRONYMS = {"aha", "bha", "pha", "ha", "spf", "uv", "dna", "rna", "edta", "peg", "txa", "egf", "inci"}

_WORD_RE = re.compile(r"^([\(\[\"']*)([^\)\]\"']*?)([\)\]\"'.,;:]*)$")


def _cap_chunk(core: str) -> str:
    lower = core.lower()
    if lower == "ph":
        return "pH"
    if lower in ACRONYMS:
        return core.upper()
    idx = next((i for i, c in enumerate(core) if c.isalpha()), None)
    if idx is None:
        return core
    return core[:idx] + core[idx].upper() + core[idx + 1 :].lower()


def _cap_word(word: str) -> str:
    m = _WORD_RE.match(word)
    if not m:
        return word
    lead, core, trail = m.groups()
    if not core:
        return word

    # Capitalize each hyphen/slash-separated sub-part separately (e.g.
    # "low-molecular" -> "Low-Molecular", "caprylic/capric" -> "Caprylic/Capric")
    cased = re.sub(
        r"[^-/]+",
        lambda m: _cap_chunk(m.group(0)),
        core,
    )
    return lead + cased + trail


def titlecase_ingredient(text: str) -> str:
    """Title-cases a single ingredient phrase: chemistry acronyms (AHA, BHA,
    HA, pH, ...) stay uppercase/special-cased, minor words (of/and/the/...)
    stay lowercase unless they open or close the phrase.
    """
    words = text.split(" ")
    out = []
    for i, w in enumerate(words):
        if not w:
            out.append(w)
            continue
        bare = re.sub(r"[^\w%]", "", w).lower()
        if bare in MINOR_WORDS and 0 < i < len(words) - 1:
            out.append(bare)
        else:
            out.append(_cap_word(w))
    return " ".join(out)


def format_ingredients(raw_text: str, limit: int = 3) -> str:
    """Splits a raw (possibly messy, comma-separated INCI) ingredient string,
    keeps the first `limit` entries — INCI lists are ordered by concentration,
    so this naturally keeps the "main" ingredients — and Title Cases each.
    Falls back to a plain message if the text doesn't look like a real
    ingredient list (e.g. OCR garbage/instructions mixed into the label scan).
    """
    if not raw_text or not raw_text.strip():
        return "Ingredients not listed."

    tokens = [t.strip() for t in raw_text.split(",") if t.strip()]
    if not tokens:
        return "Ingredients not listed."

    # A real INCI entry is a short chemical/botanical name; a token with many
    # words is more likely OCR noise or leftover usage instructions.
    if any(len(t.split()) > 6 for t in tokens[:limit]):
        return "Ingredients not listed."

    top = tokens[:limit]
    return ", ".join(titlecase_ingredient(t) for t in top)
