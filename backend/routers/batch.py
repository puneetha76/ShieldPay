# backend/routers/batch.py
# POST /batch-predict  — upload a CSV, get fraud scores for every row

from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import pandas as pd
import io

from services.preprocessor import preprocess_batch, FEATURE_COLS
from services.model_loader  import get_model, get_explainer
from services.explainer     import explain_batch
from database               import SessionLocal, PredictionLog
import json

router = APIRouter(prefix="/batch-predict", tags=["Batch Prediction"])

# ── Response schemas ─────────────────────────────────────────
class BatchRowResult(BaseModel):
    row:         int
    amount:      Optional[float]
    fraud_prob:  float
    risk_score:  int            # 0–100
    is_fraud:    bool
    risk_level:  str            # low / medium / high
    top_feature: str

class BatchResponse(BaseModel):
    total:       int
    fraud_count: int
    safe_count:  int
    fraud_rate:  float          # percentage e.g. 3.57
    results:     List[BatchRowResult]

# ── Route ────────────────────────────────────────────────────
@router.post("", response_model=BatchResponse)
async def batch_predict(
    file:      UploadFile = File(...),
    threshold: float      = 0.5,
    max_rows:  int        = 500,
):
    """
    Upload a CSV file of transactions and receive fraud predictions
    for every row.

    - **file**      : CSV with columns matching the Kaggle dataset
                      (Time, Amount, V1 … V28)
    - **threshold** : decision threshold for is_fraud flag (default 0.5)
    - **max_rows**  : cap on rows processed per request (default 500)

    Returns aggregate stats and a per-row result list.
    """

    # ── Validate file type ───────────────────────────────────
    if not file.filename.endswith(".csv"):
        raise HTTPException(
            status_code=400,
            detail="Only .csv files are supported."
        )

    # ── Load model ───────────────────────────────────────────
    model    = get_model()
    explainer = get_explainer()

    if model is None:
        raise HTTPException(
            status_code=503,
            detail="Model not loaded. Run ml/03_Training.ipynb first."
        )

    # ── Read CSV ─────────────────────────────────────────────
    contents = await file.read()
    try:
        df = pd.read_csv(io.StringIO(contents.decode("utf-8")))
    except Exception as e:
        raise HTTPException(
            status_code=422,
            detail=f"Could not parse CSV: {str(e)}"
        )

    if df.empty:
        raise HTTPException(status_code=422, detail="CSV file is empty.")

    # Cap rows
    df = df.head(max_rows)

    # ── Preprocess ───────────────────────────────────────────
    # preprocess_batch validates columns and scales Amount + Time
    rows_scaled = preprocess_batch(df)

    # ── Predict ──────────────────────────────────────────────
    probs    = model.predict_proba(rows_scaled)[:, 1]
    verdicts = (probs >= threshold).astype(bool)

    # ── SHAP top feature per row ─────────────────────────────
    shap_tops = explain_batch(explainer, rows_scaled, FEATURE_COLS)

    # ── Build result list ────────────────────────────────────
    results = []
    db      = SessionLocal()

    try:
        for i, (prob, is_fraud) in enumerate(zip(probs, verdicts)):
            prob_f     = float(prob)
            risk_score = int(round(prob_f * 100))
            risk_level = (
                "high"   if prob_f >= 0.70 else
                "medium" if prob_f >= 0.40 else
                "low"
            )
            amount     = float(df["Amount"].iloc[i]) if "Amount" in df.columns else None
            top_feat   = shap_tops[i].get("top_feature", "N/A") if shap_tops else "N/A"

            results.append(BatchRowResult(
                row         = i + 1,
                amount      = amount,
                fraud_prob  = round(prob_f, 4),
                risk_score  = risk_score,
                is_fraud    = bool(is_fraud),
                risk_level  = risk_level,
                top_feature = top_feat,
            ))

            # Log every fraud row to the database
            if is_fraud:
                log = PredictionLog(
                    amount     = amount,
                    time_sec   = float(df["Time"].iloc[i]) if "Time" in df.columns else 0.0,
                    fraud_prob = prob_f,
                    is_fraud   = True,
                    threshold  = threshold,
                    shap_top   = json.dumps([{"feature": top_feat, "value": 0.0}]),
                )
                db.add(log)

        db.commit()

    finally:
        db.close()

    # ── Aggregate stats ──────────────────────────────────────
    fraud_count = sum(1 for r in results if r.is_fraud)

    return BatchResponse(
        total       = len(results),
        fraud_count = fraud_count,
        safe_count  = len(results) - fraud_count,
        fraud_rate  = round(fraud_count / max(len(results), 1) * 100, 2),
        results     = results,
    )
