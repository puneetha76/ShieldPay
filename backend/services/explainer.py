# backend/services/explainer.py
# Computes SHAP values for a single preprocessed row.

import numpy as np
from typing import Tuple, List, Dict
from pydantic import BaseModel

class ShapFeature(BaseModel):
    feature: str
    value:   float

def get_shap_values(
    explainer,
    row_scaled: np.ndarray,
    feature_names: List[str],
    top_n: int = 5
) -> Tuple[Dict[str, float], List[ShapFeature]]:
    """
    Compute SHAP values for one preprocessed row.

    Args:
        explainer:     shap.TreeExplainer instance
        row_scaled:    numpy array of shape (1, 30)
        feature_names: list of feature names in same order as row_scaled
        top_n:         how many top features to return

    Returns:
        shap_dict  — {feature_name: shap_value} for all features
        top_list   — top N features sorted by abs(shap_value), as ShapFeature objects
    """
    if explainer is None:
        # Return empty explanation if explainer not available
        empty = {f: 0.0 for f in feature_names}
        return empty, []

    # Compute raw SHAP values
    raw = explainer.shap_values(row_scaled)

    # XGBoost binary classifier returns either:
    #   - a list of 2 arrays  [shap_class0, shap_class1]
    #   - a single 2-D array  (newer shap versions)
    if isinstance(raw, list):
        sv = raw[1][0]        # fraud class, first (only) row
    else:
        sv = raw[0]           # single 2-D array, first row

    # Build full dict
    shap_dict = {
        feat: round(float(val), 5)
        for feat, val in zip(feature_names, sv)
    }

    # Top N by absolute value
    sorted_items = sorted(shap_dict.items(), key=lambda x: abs(x[1]), reverse=True)
    top_list = [
        ShapFeature(feature=feat, value=val)
        for feat, val in sorted_items[:top_n]
    ]

    return shap_dict, top_list


def explain_batch(
    explainer,
    rows_scaled: np.ndarray,
    feature_names: List[str]
) -> List[Dict[str, float]]:
    """
    Compute SHAP values for multiple rows (batch upload).

    Returns a list of dicts, one per row.
    Only returns the top feature name per row for performance.
    """
    if explainer is None:
        return [{"feature": "N/A", "value": 0.0}] * len(rows_scaled)

    raw = explainer.shap_values(rows_scaled)
    if isinstance(raw, list):
        sv_matrix = raw[1]
    else:
        sv_matrix = raw

    results = []
    for sv_row in sv_matrix:
        top_idx  = int(np.argmax(np.abs(sv_row)))
        results.append({
            "top_feature"       : feature_names[top_idx],
            "top_feature_value" : round(float(sv_row[top_idx]), 4),
        })

    return results