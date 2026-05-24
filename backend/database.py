# backend/database.py
# Shared database objects — populated at startup by main.py

SessionLocal  = None   # set by main.py lifespan
PredictionLog = None   # set by main.py lifespan