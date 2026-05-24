import os, joblib

BASE_DIR    = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_PATH  = os.path.join(BASE_DIR, "models", "fraud_model.pkl")
SCALER_PATH = os.path.join(BASE_DIR, "models", "scaler.pkl")

_model  = None
_scaler = None

def load_model():
    global _model, _scaler
    print(f"Looking for model at: {MODEL_PATH}")
    if not os.path.exists(MODEL_PATH):
        print(f"Model not found: {MODEL_PATH}")
        return
    if not os.path.exists(SCALER_PATH):
        print(f"Scaler not found: {SCALER_PATH}")
        return
    _model  = joblib.load(MODEL_PATH)
    _scaler = joblib.load(SCALER_PATH)
    print(f"✅ Model loaded successfully")

def get_model():
    return _model

def get_scaler():
    return _scaler

def get_explainer():
    return None

def is_loaded():
    return _model is not None and _scaler is not None