"""
Configuration module for the Smart Data Storytelling Tool.
Loads environment variables and defines application settings.
"""

import os
import secrets
import warnings
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# --- Paths ---
BASE_DIR = Path(__file__).resolve().parent.parent
UPLOAD_DIR = BASE_DIR / "uploads"
REPORTS_DIR = BASE_DIR / "reports"
CHARTS_DIR = BASE_DIR / "charts"

# Create directories if they don't exist
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
REPORTS_DIR.mkdir(parents=True, exist_ok=True)
CHARTS_DIR.mkdir(parents=True, exist_ok=True)

# --- API Keys ---
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

# --- App Settings ---
MAX_FILE_SIZE_MB = int(os.getenv("MAX_FILE_SIZE_MB", 200))
ALLOWED_EXTENSIONS = {".csv", ".xlsx", ".xls"}
MAX_ROWS_FOR_PROCESSING = 500_000
CORS_ORIGINS = ["http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:5173"]

# --- LLM Settings ---
LLM_MODEL = "gemini-2.0-flash"
LLM_TEMPERATURE = 0.3
LLM_MAX_TOKENS = 4096

# --- Database ---
DATABASE_PATH = BASE_DIR / "data.db"
DATABASE_URL = f"sqlite:///{DATABASE_PATH}"

# --- JWT Authentication ---
_jwt_env = os.getenv("JWT_SECRET_KEY", "")
if not _jwt_env:
    warnings.warn(
        "JWT_SECRET_KEY not set in .env — using auto-generated key. "
        "All user sessions will be invalidated on server restart. "
        "Set JWT_SECRET_KEY in your .env file for persistent sessions.",
        stacklevel=1,
    )
    _jwt_env = secrets.token_hex(32)
JWT_SECRET_KEY = _jwt_env
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_HOURS = int(os.getenv("JWT_EXPIRE_HOURS", 24))
