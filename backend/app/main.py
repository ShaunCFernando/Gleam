import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routers import concerns, products, quiz, routines

app = FastAPI(title="Gleam API")

allowed_origins = [
    o.strip() for o in os.environ.get("ALLOWED_ORIGINS", "http://localhost:5173").split(",") if o.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(concerns.router)
app.include_router(products.router)
app.include_router(quiz.router)
app.include_router(routines.router)


@app.get("/api/health")
def health():
    return {"status": "ok"}
