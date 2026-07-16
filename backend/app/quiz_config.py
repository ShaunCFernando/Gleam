"""Static quiz copy/structure for every question except "concerns" (which is
sourced from the concerns table, since that list doubles as scoring data).
"""

QUIZ_STEPS = [
    {
        "id": "skin_type",
        "question": "How does your skin usually behave?",
        "hint": "By mid-afternoon on a normal day.",
        "type": "single",
        "options": [
            {"value": "oily", "label": "Oily", "detail": "Shiny early, prone to congestion"},
            {"value": "dry", "label": "Dry", "detail": "Tight, flaky, drinks up cream"},
            {"value": "combination", "label": "Combination", "detail": "Oily T-zone, normal-to-dry cheeks"},
            {"value": "normal", "label": "Balanced", "detail": "Rarely complains either way"},
        ],
    },
    {
        "id": "sensitivity",
        "question": "Does your skin react easily?",
        "hint": "Stinging, flushing, or breaking out from new products.",
        "type": "single",
        "options": [
            {"value": "yes", "label": "Yes, very reactive", "detail": "We'll exclude strong actives entirely"},
            {"value": "somewhat", "label": "Sometimes", "detail": "We'll go easy on exfoliants"},
            {"value": "no", "label": "Not really", "detail": "Full menu available"},
        ],
    },
    {
        "id": "concerns",
        "question": "What do you want to change?",
        "hint": "Pick up to three. The routine targets these directly.",
        "type": "multi",
        "max": 3,
        "options": [],  # filled in from the concerns table by the /api/quiz-config route
    },
    {
        "id": "budget",
        "question": "Budget for the full routine?",
        "hint": "K-beauty is kind to wallets. Even 'premium' here is modest.",
        "type": "single",
        "options": [
            {"value": "lean", "label": "Under $70", "detail": "Best value picks"},
            {"value": "mid", "label": "$70 – $130", "detail": "The sweet spot"},
            {"value": "premium", "label": "$130+", "detail": "Best match, price no object"},
        ],
    },
    {
        "id": "routine_size",
        "question": "How many steps do you actually want?",
        "hint": "Be honest. An unused 7-step routine loses to a used 4-step one.",
        "type": "single",
        "options": [
            {"value": "essential", "label": "Essential (4 steps)", "detail": "Cleanse, tone, moisturize, SPF"},
            {"value": "balanced", "label": "Balanced (5 steps)", "detail": "Adds a targeted serum"},
            {"value": "full", "label": "The full experience (7 steps)", "detail": "Essence, serum, and a weekly mask"},
        ],
    },
]
