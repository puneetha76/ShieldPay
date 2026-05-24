import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import roc_auc_score, f1_score, classification_report
import joblib, os

os.makedirs("models", exist_ok=True)

print("Loading dataset...")
df = pd.read_csv("creditcard.csv")

X = df.drop("Class", axis=1)
y = df["Class"]

# Scale
scaler = StandardScaler()
X[["Time","Amount"]] = scaler.fit_transform(X[["Time","Amount"]])

# Split
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

# Train Logistic Regression (very lightweight ~5MB vs XGBoost ~300MB)
print("Training Logistic Regression...")
model = LogisticRegression(
    C=0.01,
    max_iter=1000,
    class_weight="balanced",
    random_state=42,
    n_jobs=-1
)
model.fit(X_train, y_train)

# Evaluate
y_pred = model.predict(X_test)
y_prob = model.predict_proba(X_test)[:,1]
print(f"AUC-ROC : {roc_auc_score(y_test, y_prob):.4f}")
print(f"F1      : {f1_score(y_test, y_pred):.4f}")
print(classification_report(y_test, y_pred))

# Save
joblib.dump(model,  "models/fraud_model.pkl")
joblib.dump(scaler, "models/scaler.pkl")
print("✅ Models saved!")