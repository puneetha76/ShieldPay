# backend/services/preprocessor.py
# Converts raw transaction dict → scaled numpy array ready for the model.

import numpy as np
import pandas as pd
from fastapi import HTTPException
from services.model_loader import get_scaler

# Feature order must match training data exactly
FEATURE_COLS = (
    ["Time", "Amount"] + [f"V{i}" for i in range(1, 29)]
)

def preprocess_input(tx_dict: dict) -> np.ndarray:
    """
    Takes a flat dict of transaction features and returns
    a (1, 30) scaled numpy array ready for model.predict_proba().

    Steps:
      1. Align columns to training order
      2. Fill any missing V features with 0
      3. Apply StandardScaler to Time and Amount only
         (V1-V28 are already PCA-scaled in the Kaggle dataset)

    Args:
        tx_dict: dict with keys Time, Amount, V1 ... V28

    Returns:
        np.ndarray of shape (1, 30)
    """
    scaler = get_scaler()
    if scaler is None:
        raise HTTPException(
            status_code=503,
            detail="Scaler not loaded. Run 02_Preprocessing.ipynb first."
        )

    # Build a DataFrame row with all 30 features in the right order
    row = pd.DataFrame(
        [[tx_dict.get(col, 0.0) for col in FEATURE_COLS]],
        columns=FEATURE_COLS
    )

    # Scale only Time and Amount
    row[["Time", "Amount"]] = scaler.transform(row[["Time", "Amount"]])

    return row.values  # shape (1, 30)


def preprocess_batch(df: pd.DataFrame) -> np.ndarray:
    """
    Preprocess a full DataFrame (from CSV batch upload).

    Args:
        df: DataFrame that must contain all FEATURE_COLS

    Returns:
        np.ndarray of shape (n_rows, 30)
    """
    scaler = get_scaler()
    if scaler is None:
        raise HTTPException(
            status_code=503,
            detail="Scaler not loaded. Run 02_Preprocessing.ipynb first."
        )

    # Validate columns
    missing = [c for c in FEATURE_COLS if c not in df.columns]
    if missing:
        raise HTTPException(
            status_code=422,
            detail=f"CSV is missing required columns: {missing}"
        )

    batch = df[FEATURE_COLS].copy().fillna(0.0)
    batch[["Time", "Amount"]] = scaler.transform(batch[["Time", "Amount"]])

    return batch.values