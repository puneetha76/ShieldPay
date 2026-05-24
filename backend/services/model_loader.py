import joblib, os, shap

# Fix paths — use absolute path relative to this file
BASE_DIR   = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_PATH  = os.path.join(BASE_DIR, "models", "fraud_model.pkl")
SCALER_PATH = os.path.join(BASE_DIR, "models", "scaler.pkl")

_model     = None
_scaler    = None
_explainer = None

def load_model():
    global _model, _scaler, _explainer

    print(f"Looking for model at: {MODEL_PATH}")
    print(f"Looking for scaler at: {SCALER_PATH}")

    if not os.path.exists(MODEL_PATH):
        print(f"Model not found at {MODEL_PATH}")
        return

    if not os.path.exists(SCALER_PATH):
        print(f"Scaler not found at {SCALER_PATH}")
        return

    _model     = joblib.load(MODEL_PATH)
    _scaler    = joblib.load(SCALER_PATH)
    _explainer = shap.TreeExplainer(_model)

    print(f"✅ Model loaded  → {MODEL_PATH}")
    print(f"✅ Scaler loaded → {SCALER_PATH}")
    print(f"✅ SHAP explainer ready")

def get_model():
    return _model

def get_scaler():
    return _scaler

def get_explainer():
    return _explainer

def is_loaded():
    return _model is not None and _scaler is not None