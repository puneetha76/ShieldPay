import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import joblib

BASE_DIR    = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_PATH  = os.path.join(BASE_DIR, "models", "fraud_model.pkl")
SCALER_PATH = os.path.join(BASE_DIR, "models", "scaler.pkl")

_model     = None
_scaler    = None
_explainer = None

def load_model():
    global _model, _scaler, _explainer

    print(f"Looking for model at: {MODEL_PATH}")

    if not os.path.exists(MODEL_PATH):
        print(f"❌ Model not found at {MODEL_PATH}")
        return

    if not os.path.exists(SCALER_PATH):
        print(f"❌ Scaler not found at {SCALER_PATH}")
        return

    _model  = joblib.load(MODEL_PATH)
    _scaler = joblib.load(SCALER_PATH)

    # Load SHAP only if enough memory
    try:
        import shap
        _explainer = shap.TreeExplainer(_model)
        print("✅ SHAP explainer ready")
    except Exception as e:
        print(f"⚠ SHAP not loaded (memory limit): {e}")
        _explainer = None

    print(f"✅ Model loaded  → {MODEL_PATH}")
    print(f"✅ Scaler loaded → {SCALER_PATH}")

def get_model():
    return _model

def get_scaler():
    return _scaler

def get_explainer():
    return _explainer

def is_loaded():
    return _model is not None and _scaler is not None