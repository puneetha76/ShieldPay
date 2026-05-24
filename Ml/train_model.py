# ============================================================
# ShieldPay — ML Training Script
# Run this BEFORE starting the backend
# Dataset: https://www.kaggle.com/datasets/mlg-ulb/creditcardfraud
# ============================================================

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import (
    classification_report, roc_auc_score,
    confusion_matrix, f1_score, precision_score, recall_score
)
from xgboost import XGBClassifier
from imblearn.over_sampling import SMOTE
import joblib, os, matplotlib.pyplot as plt, seaborn as sns

os.makedirs("models", exist_ok=True)

# ============================================================
# 1. LOAD DATA
# ============================================================
print("📂 Loading dataset...")
df = pd.read_csv("creditcard.csv")   # Download from Kaggle
print(f"Shape: {df.shape}")
print(f"Fraud rate: {df['Class'].mean()*100:.4f}%")

# ============================================================
# 2. EDA — quick look
# ============================================================
print("\n📊 Class distribution:")
print(df['Class'].value_counts())
print("\nAmount stats by class:")
print(df.groupby('Class')['Amount'].describe())

# ============================================================
# 3. PREPROCESSING
# ============================================================
# Features & target
X = df.drop('Class', axis=1)
y = df['Class']

# Scale Amount and Time (V1-V28 are already PCA-scaled)
scaler = StandardScaler()
X[['Time', 'Amount']] = scaler.fit_transform(X[['Time', 'Amount']])

# Train-test split (stratified)
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)
print(f"\nTrain: {X_train.shape}, Test: {X_test.shape}")

# ============================================================
# 4. HANDLE CLASS IMBALANCE WITH SMOTE
# ============================================================
print("\n⚖ Applying SMOTE to balance training set...")
smote = SMOTE(random_state=42)
X_train_res, y_train_res = smote.fit_resample(X_train, y_train)
print(f"After SMOTE — Fraud: {y_train_res.sum()}, Legit: {(y_train_res==0).sum()}")

# ============================================================
# 5. TRAIN XGBOOST
# ============================================================
print("\n🚀 Training XGBoost...")
model = XGBClassifier(
    n_estimators=300,
    max_depth=6,
    learning_rate=0.05,
    subsample=0.8,
    colsample_bytree=0.8,
    use_label_encoder=False,
    eval_metric='logloss',
    random_state=42,
    n_jobs=-1
)
model.fit(
    X_train_res, y_train_res,
    eval_set=[(X_test, y_test)],
    verbose=50
)

# ============================================================
# 6. EVALUATE
# ============================================================
y_pred  = model.predict(X_test)
y_prob  = model.predict_proba(X_test)[:, 1]

auc  = roc_auc_score(y_test, y_prob)
f1   = f1_score(y_test, y_pred)
prec = precision_score(y_test, y_pred)
rec  = recall_score(y_test, y_pred)

print("\n" + "="*50)
print("📈 MODEL EVALUATION")
print("="*50)
print(f"AUC-ROC  : {auc:.4f}")
print(f"F1 Score : {f1:.4f}")
print(f"Precision: {prec:.4f}")
print(f"Recall   : {rec:.4f}")
print("\nClassification Report:")
print(classification_report(y_test, y_pred, target_names=['Legit','Fraud']))

# Confusion matrix plot
cm = confusion_matrix(y_test, y_pred)
plt.figure(figsize=(6, 5))
sns.heatmap(cm, annot=True, fmt='d', cmap='Blues',
            xticklabels=['Predicted Legit','Predicted Fraud'],
            yticklabels=['Actual Legit','Actual Fraud'])
plt.title(f'Confusion Matrix — AUC: {auc:.3f}')
plt.tight_layout()
plt.savefig("models/confusion_matrix.png", dpi=150)
print("Saved confusion matrix → models/confusion_matrix.png")

# Feature importance
feat_imp = pd.Series(model.feature_importances_, index=X.columns)
top10 = feat_imp.nlargest(10)
plt.figure(figsize=(8, 5))
top10.sort_values().plot(kind='barh', color='steelblue')
plt.title('Top 10 Feature Importances (XGBoost)')
plt.tight_layout()
plt.savefig("models/feature_importance.png", dpi=150)
print("Saved feature importance → models/feature_importance.png")

# ============================================================
# 7. SAVE MODEL & SCALER
# ============================================================
joblib.dump(model,  "models/fraud_model.pkl")
joblib.dump(scaler, "models/scaler.pkl")
print("\n✅ Model saved → models/fraud_model.pkl")
print("✅ Scaler saved → models/scaler.pkl")
print("\n🎉 Training complete! Now run: uvicorn main:app --reload")
