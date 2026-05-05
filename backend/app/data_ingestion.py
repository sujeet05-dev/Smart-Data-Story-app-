"""
Data Ingestion Module
---------------------
Handles file upload, validation, reading CSV/Excel files,
and initial column type detection.
"""

import pandas as pd
import numpy as np
from pathlib import Path
from typing import Tuple, Dict, List, Any

from app.config import ALLOWED_EXTENSIONS, MAX_ROWS_FOR_PROCESSING


def validate_file(filename: str, file_size_bytes: int, max_mb: int = 200) -> Tuple[bool, str]:
    """Validate uploaded file by extension and size."""
    ext = Path(filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        return False, f"Unsupported file type '{ext}'. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
    if file_size_bytes > max_mb * 1024 * 1024:
        return False, f"File too large. Maximum allowed size is {max_mb}MB."
    return True, "File is valid."


def read_dataset(filepath: str) -> pd.DataFrame:
    """Read CSV or Excel file into a pandas DataFrame."""
    ext = Path(filepath).suffix.lower()
    if ext == ".csv":
        # Try different encodings
        for encoding in ["utf-8", "latin-1", "cp1252"]:
            try:
                df = pd.read_csv(filepath, encoding=encoding, low_memory=False)
                break
            except (UnicodeDecodeError, Exception):
                continue
        else:
            raise ValueError("Could not read CSV file with any supported encoding.")
    elif ext in (".xlsx", ".xls"):
        df = pd.read_excel(filepath, engine="openpyxl")
    else:
        raise ValueError(f"Unsupported file extension: {ext}")

    # Limit rows for performance
    if len(df) > MAX_ROWS_FOR_PROCESSING:
        df = df.sample(n=MAX_ROWS_FOR_PROCESSING, random_state=42).reset_index(drop=True)

    return df


def detect_column_types(df: pd.DataFrame) -> Dict[str, List[str]]:
    """
    Automatically detect column types:
    - numerical: int/float columns
    - categorical: object/category columns with limited unique values
    - datetime: columns parseable as dates
    - text: object columns with many unique values (likely free text)
    """
    numerical = []
    categorical = []
    datetime_cols = []
    text_cols = []

    for col in df.columns:
        # Try to parse as datetime
        if df[col].dtype == "object":
            try:
                parsed = pd.to_datetime(df[col], infer_datetime_format=True, errors="coerce")
                if parsed.notna().sum() > len(df) * 0.5:
                    datetime_cols.append(col)
                    continue
            except Exception:
                pass

        if pd.api.types.is_numeric_dtype(df[col]):
            numerical.append(col)
        elif pd.api.types.is_datetime64_any_dtype(df[col]):
            datetime_cols.append(col)
        elif df[col].dtype == "object" or df[col].dtype.name == "category":
            nunique = df[col].nunique()
            ratio = nunique / max(len(df), 1)
            if nunique <= 50 or ratio < 0.05:
                categorical.append(col)
            else:
                text_cols.append(col)

    return {
        "numerical": numerical,
        "categorical": categorical,
        "datetime": datetime_cols,
        "text": text_cols,
    }


def get_data_overview(df: pd.DataFrame) -> Dict[str, Any]:
    """Get a quick overview of the dataset."""
    col_types = detect_column_types(df)
    return {
        "rows": int(len(df)),
        "columns": int(len(df.columns)),
        "column_names": list(df.columns),
        "column_types": col_types,
        "dtypes": {col: str(df[col].dtype) for col in df.columns},
        "missing_values": {col: int(df[col].isna().sum()) for col in df.columns},
        "missing_percentage": {
            col: round(df[col].isna().sum() / max(len(df), 1) * 100, 2)
            for col in df.columns
        },
        "duplicated_rows": int(df.duplicated().sum()),
        "memory_usage_mb": round(df.memory_usage(deep=True).sum() / 1024 / 1024, 2),
        "sample_data": df.head(5).to_dict(orient="records"),
    }
