"""
Configuration module for the Smart Data Storytelling Tool.
Loads environment variables and defines application settings.
"""

import os
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
