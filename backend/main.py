import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Float, Integer, String, DateTime, Boolean
from sqlalchemy.orm import sessionmaker, declarative_base
from datetime import datetime

from services.model_loader import load_model, is_loaded

# ── Database ─────────────────────────────────────────────────
engine       = create_engine("sqlite:///./shieldpay.db", connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base         = declarative_base()

class PredictionLog(Base):
    __tablename__ = "predictions"
    id         = Column(Integer,  primary_key=True, index=True)
    amount     = Column(Float)
    time_sec   = Column(Float)
    fraud_prob = Column(Float)
    is_fraud   = Column(Boolean)
    threshold  = Column(Float,   default=0.5)
    shap_top   = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

Base.metadata.create_all(bind=engine)

import database as _db
_db.SessionLocal  = SessionLocal
_db.PredictionLog = PredictionLog

# ── Lifespan ──────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    print("ShieldPay starting up...")
    load_model()
    yield
    print("ShieldPay shutting down.")

# ── App ───────────────────────────────────────────────────────
app = FastAPI(
    title       = "ShieldPay Fraud Detection API",
    description = "Real-time credit card fraud detection with SHAP explainability",
    version     = "1.0.0",
    lifespan    = lifespan,
)

# ── CORS ──────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins     = ["http://localhost:5173", "http://localhost:3000", "*"],
    allow_credentials = True,
    allow_methods     = ["*"],
    allow_headers     = ["*"],
)

# ── Routers ───────────────────────────────────────────────────
from routers.predict import router as predict_router
from routers.batch   import router as batch_router
from routers.history import router as history_router

app.include_router(predict_router)
app.include_router(batch_router)
app.include_router(history_router)

# ── Health ────────────────────────────────────────────────────
@app.get("/")
def root():
    return {
        "service"      : "ShieldPay Fraud Detection API",
        "status"       : "online",
        "model_loaded" : is_loaded(),
        "docs"         : "/docs",
    }

@app.get("/health")
def health():
    return {
        "status"      : "ok",
        "model_ready" : is_loaded(),
        "timestamp"   : datetime.utcnow().isoformat(),
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
