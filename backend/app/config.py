import os
from pathlib import Path
from pydantic import BaseModel

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(exist_ok=True, parents=True)

class Settings(BaseModel):
    APP_NAME: str = "LEAKSENSE"
    VERSION: str = "1.0.0"
    SUBTITLE: str = "Intelligent Diagnostic Training & Skill Assessment"
    
    # SQLite Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite:///{DATA_DIR}/leaksense.db")
    
    # Cloud sync (Firebase) feature flag
    FIREBASE_ENABLED: bool = os.getenv("ENABLE_FIREBASE", "false").lower() in ("true", "1", "yes")
    FIREBASE_PROJECT_ID: str = os.getenv("FIREBASE_PROJECT_ID", "")
    
    # Scoring Rubric Defaults
    WEIGHT_CORRECTNESS: float = 50.0
    WEIGHT_TIME: float = 20.0
    WEIGHT_INDEPENDENCE: float = 20.0
    WEIGHT_COMPLIANCE: float = 10.0
    
    # Telemetry simulation defaults
    DEFAULT_SAMPLING_RATE_HZ: int = 10
    ATTENUATION_COEFF: float = 0.08  # acoustic attenuation per distance unit
    
settings = Settings()
