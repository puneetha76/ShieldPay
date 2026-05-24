# backend/services/model_loader.py
# Loads and caches the ML model and SHAP explainer at startup.

import joblib, os, shap
from typing import Optional

# ── Paths (relative to where you run uvicorn) ───────────────
MODEL_PATH = os.getenv(
    "MODEL_PATH",
    "backend/models/fraud_model.pkl"
)

SCALER_PATH = os.getenv(
    "SCALER_PATH",
    "backend/models/scaler.pkl"
)

# ── Singletons ───────────────────────────────────────────────
_model    = None
_scaler   = None
_explainer = None

def load_model():
    """
    Called once at app startup (via main.py lifespan).
    Loads XGBoost model, StandardScaler, and SHAP TreeExplainer.
    """
    global _model, _scaler, _explainer

    if not os.path.exists(MODEL_PATH):
        print(f"⚠  Model not found at '{MODEL_PATH}'. Run 03_Training.ipynb first.")
        return

    if not os.path.exists(SCALER_PATH):
        print(f"⚠  Scaler not found at '{SCALER_PATH}'. Run 02_Preprocessing.ipynb first.")
        return

    _model    = joblib.load(MODEL_PATH)
    _scaler   = joblib.load(SCALER_PATH)
    _explainer = shap.TreeExplainer(_model)

    print(f"✅ Model loaded  → {MODEL_PATH}")
    print(f"✅ Scaler loaded → {SCALER_PATH}")
    print(f"✅ SHAP explainer ready")

def get_model():
    """Return the loaded model (or None if not loaded yet)."""
    return _model

def get_scaler():
    """Return the loaded scaler (or None if not loaded yet)."""
    return _scaler

def get_explainer():
    """Return the SHAP TreeExplainer (or None if not loaded yet)."""
    return _explainer

def is_loaded() -> bool:
    """Quick check — True if model and scaler are both available."""
    return _model is not None and _scaler is not None