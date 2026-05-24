# backend/routers/predict.py
# POST /predict — single transaction fraud prediction

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
import pandas as pd
import json

from services.preprocessor import preprocess_input
from services.model_loader import get_model, get_explainer
from services.explainer import get_shap_values
from database import SessionLocal, PredictionLog

router = APIRouter(prefix="/predict", tags=["Prediction"])

# ── Request schema ──────────────────────────────────────────
class TransactionIn(BaseModel):
    Time: float = 0.0
    Amount: float
    V1: float = 0.0; V2: float = 0.0; V3: float = 0.0
    V4: float = 0.0; V5: float = 0.0; V6: float = 0.0
    V7: float = 0.0; V8: float = 0.0; V9: float = 0.0
    V10: float = 0.0; V11: float = 0.0; V12: float = 0.0
    V13: float = 0.0; V14: float = 0.0; V15: float = 0.0
    V16: float = 0.0; V17: float = 0.0; V18: float = 0.0
    V19: float = 0.0; V20: float = 0.0; V21: float = 0.0
    V22: float = 0.0; V23: float = 0.0; V24: float = 0.0
    V25: float = 0.0; V26: float = 0.0; V27: float = 0.0
    V28: float = 0.0
    threshold: float = 0.5

# ── Response schema ─────────────────────────────────────────
class ShapFeature(BaseModel):
    feature: str
    value: float

class PredictionOut(BaseModel):
    fraud_probability: float
    is_fraud: bool
    risk_level: str
    risk_score: int
    shap_values: dict
    top_features: List[ShapFeature]
    threshold_used: float

# ── Route ───────────────────────────────────────────────────
@router.post("", response_model=PredictionOut)
def predict(tx: TransactionIn):

    model = get_model()
    explainer = get_explainer()

    if model is None:
        raise HTTPException(
            status_code=503,
            detail="Model not loaded."
        )

    # 1. Build feature dict
    tx_dict = tx.dict(exclude={"threshold"})

    # 2. Preprocess
    row_scaled = preprocess_input(tx_dict)

    # 3. Predict
    prob = float(model.predict_proba(row_scaled)[0][1])
    is_fraud = prob >= tx.threshold

    # 4. Risk level
    if prob >= 0.70:
        risk = "high"
    elif prob >= 0.40:
        risk = "medium"
    else:
        risk = "low"

    # 5. SHAP explanation
    shap_dict, top5 = get_shap_values(
        explainer,
        row_scaled,
        list(tx_dict.keys())
    )

    top5 = [
        {
            "feature": t.feature,
            "value": float(t.value)
        }
        for t in top5
    ]

    # 6. Log to database
    db = SessionLocal()

    try:
        log = PredictionLog(
            amount=tx.Amount,
            time_sec=tx.Time,
            fraud_prob=prob,
            is_fraud=is_fraud,
            threshold=tx.threshold,
            shap_top=json.dumps(top5)
        )

        db.add(log)
        db.commit()

    finally:
        db.close()

    return PredictionOut(
        fraud_probability=round(prob, 4),
        is_fraud=is_fraud,
        risk_level=risk,
        risk_score=int(round(prob * 100)),
        shap_values=shap_dict,
        top_features=top5,
        threshold_used=tx.threshold,
    )