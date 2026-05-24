# backend/routers/history.py
# GET /history   — fetch prediction logs from the database
# GET /stats     — aggregate dashboard statistics
# DELETE /history/{id} — delete a single log entry

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import json

from database import SessionLocal, PredictionLog

router = APIRouter(tags=["History"])

# ── Response schemas ─────────────────────────────────────────
class TopFeature(BaseModel):
    feature: str
    value:   float

class HistoryItem(BaseModel):
    id:           int
    amount:       Optional[float]
    time_sec:     Optional[float]
    fraud_prob:   float
    risk_score:   int
    is_fraud:     bool
    threshold:    Optional[float]
    top_features: List[TopFeature]
    created_at:   str             # ISO timestamp string

class StatsResponse(BaseModel):
    total_predictions: int
    fraud_detected:    int
    safe_transactions: int
    fraud_rate_pct:    float

class DeleteResponse(BaseModel):
    success: bool
    message: str

# ── Helper ───────────────────────────────────────────────────
def _log_to_dict(log: PredictionLog) -> HistoryItem:
    """Convert a PredictionLog ORM row to a HistoryItem."""
    try:
        top_features_raw = json.loads(log.shap_top or "[]")
        top_features = [
            TopFeature(
                feature=f.get("feature", "N/A"),
                value=float(f.get("value", 0.0))
            )
            for f in top_features_raw
        ]
    except Exception:
        top_features = []

    return HistoryItem(
        id           = log.id,
        amount       = log.amount,
        time_sec     = log.time_sec,
        fraud_prob   = round(log.fraud_prob or 0.0, 4),
        risk_score   = int(round((log.fraud_prob or 0.0) * 100)),
        is_fraud     = bool(log.is_fraud),
        threshold    = log.threshold,
        top_features = top_features,
        created_at   = log.created_at.isoformat() if log.created_at else "",
    )

# ── GET /history ─────────────────────────────────────────────
@router.get("/history", response_model=List[HistoryItem])
def get_history(
    limit:      int  = Query(50,    ge=1, le=500, description="Max rows to return"),
    offset:     int  = Query(0,     ge=0,          description="Rows to skip (pagination)"),
    fraud_only: bool = Query(False,                description="If true, return only fraud predictions"),
    min_score:  int  = Query(0,     ge=0, le=100,  description="Minimum risk score filter"),
):
    """
    Retrieve prediction history from the database.

    - **limit**      : how many records to return (max 500)
    - **offset**     : for pagination, skip this many records
    - **fraud_only** : if true, only return flagged fraud predictions
    - **min_score**  : only return predictions with risk_score >= this value
    """
    db = SessionLocal()
    try:
        q = db.query(PredictionLog).order_by(PredictionLog.created_at.desc())

        if fraud_only:
            q = q.filter(PredictionLog.is_fraud == True)

        if min_score > 0:
            min_prob = min_score / 100.0
            q = q.filter(PredictionLog.fraud_prob >= min_prob)

        logs = q.offset(offset).limit(limit).all()
        return [_log_to_dict(log) for log in logs]

    finally:
        db.close()

# ── GET /history/{id} ────────────────────────────────────────
@router.get("/history/{log_id}", response_model=HistoryItem)
def get_history_item(log_id: int):
    """Retrieve a single prediction log by its ID."""
    db = SessionLocal()
    try:
        log = db.query(PredictionLog).filter(PredictionLog.id == log_id).first()
        if not log:
            raise HTTPException(status_code=404, detail=f"Log {log_id} not found.")
        return _log_to_dict(log)
    finally:
        db.close()

# ── GET /stats ───────────────────────────────────────────────
@router.get("/stats", response_model=StatsResponse)
def get_stats():
    """
    Return aggregate statistics for the dashboard.

    - Total predictions made
    - Fraud detected count
    - Safe transaction count
    - Fraud rate as a percentage
    """
    db = SessionLocal()
    try:
        total = db.query(PredictionLog).count()
        fraud = db.query(PredictionLog).filter(PredictionLog.is_fraud == True).count()
        return StatsResponse(
            total_predictions = total,
            fraud_detected    = fraud,
            safe_transactions = total - fraud,
            fraud_rate_pct    = round(fraud / max(total, 1) * 100, 4),
        )
    finally:
        db.close()

# ── GET /stats/daily ─────────────────────────────────────────
@router.get("/stats/daily")
def get_daily_stats(days: int = Query(7, ge=1, le=90)):
    """
    Return per-day fraud and total counts for the bar chart.
    Used by the Dashboard page to render the 7-day bar chart.
    """
    from sqlalchemy import func, cast, Date, Integer
    db = SessionLocal()
    try:
        results = (
            db.query(
                cast(PredictionLog.created_at, Date).label("day"),
                func.count().label("total"),
                func.sum(
                    cast(PredictionLog.is_fraud, Integer)
                ).label("fraud"),
            )
            .group_by("day")
            .order_by("day")
            .limit(days)
            .all()
        )
        return [
            {
                "day"   : str(r.day),
                "total" : r.total,
                "fraud" : int(r.fraud or 0),
                "safe"  : r.total - int(r.fraud or 0),
            }
            for r in results
        ]
    finally:
        db.close()

# ── DELETE /history/{id} ─────────────────────────────────────
@router.delete("/history/{log_id}", response_model=DeleteResponse)
def delete_history_item(log_id: int):
    """Delete a single prediction log entry by ID."""
    db = SessionLocal()
    try:
        log = db.query(PredictionLog).filter(PredictionLog.id == log_id).first()
        if not log:
            raise HTTPException(status_code=404, detail=f"Log {log_id} not found.")
        db.delete(log)
        db.commit()
        return DeleteResponse(success=True, message=f"Log {log_id} deleted.")
    finally:
        db.close()

# ── DELETE /history ──────────────────────────────────────────
@router.delete("/history", response_model=DeleteResponse)
def clear_history():
    """Delete ALL prediction history. Use with caution."""
    db = SessionLocal()
    try:
        count = db.query(PredictionLog).count()
        db.query(PredictionLog).delete()
        db.commit()
        return DeleteResponse(success=True, message=f"Deleted {count} records.")
    finally:
        db.close()
