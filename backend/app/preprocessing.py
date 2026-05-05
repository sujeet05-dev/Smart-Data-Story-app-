"""
Data Preprocessing Module
--------------------------
Handles cleaning, missing value imputation, outlier detection,
encoding, and feature scaling.
"""

import pandas as pd
import numpy as np
from typing import Dict, List, Any, Tuple
from scipy import stats


def handle_missing_values(df: pd.DataFrame, strategy: str = "auto") -> Tuple[pd.DataFrame, Dict[str, Any]]:
    """
    Handle missing values based on strategy.
    
    Strategies:
    - 'auto': mean for numeric, mode for categorical, drop if >60% missing
    - 'drop': drop rows with missing values
    - 'mean': fill numeric with mean, categorical with mode
    - 'median': fill numeric with median, categorical with mode
    """
    df = df.copy()
    report = {"dropped_columns": [], "filled_columns": {}, "dropped_rows": 0}

    # Drop columns with >60% missing values
    threshold = 0.6
    missing_ratio = df.isna().sum() / len(df)
    cols_to_drop = missing_ratio[missing_ratio > threshold].index.tolist()
    if cols_to_drop:
        df = df.drop(columns=cols_to_drop)
        report["dropped_columns"] = cols_to_drop

    if strategy == "drop":
        original_len = len(df)
        df = df.dropna().reset_index(drop=True)
        report["dropped_rows"] = original_len - len(df)
        return df, report

    for col in df.columns:
        if df[col].isna().sum() == 0:
            continue

        if pd.api.types.is_numeric_dtype(df[col]):
            if strategy in ("auto", "mean"):
                fill_val = df[col].mean()
                method = "mean"
            elif strategy == "median":
                fill_val = df[col].median()
                method = "median"
            else:
                fill_val = df[col].mean()
                method = "mean"
            df[col] = df[col].fillna(fill_val)
            report["filled_columns"][col] = {"method": method, "value": round(float(fill_val), 4)}
        else:
            mode_val = df[col].mode()
            if len(mode_val) > 0:
                fill_val = mode_val[0]
                df[col] = df[col].fillna(fill_val)
                report["filled_columns"][col] = {"method": "mode", "value": str(fill_val)}

    return df, report


def remove_duplicates(df: pd.DataFrame) -> Tuple[pd.DataFrame, int]:
    """Remove duplicate rows and return count removed."""
    original_len = len(df)
    df = df.drop_duplicates().reset_index(drop=True)
    removed = original_len - len(df)
    return df, removed


def detect_outliers(df: pd.DataFrame, method: str = "iqr", threshold: float = 1.5) -> Dict[str, Any]:
    """
    Detect outliers in numerical columns.
    
    Methods:
    - 'iqr': Interquartile Range method
    - 'zscore': Z-score method (threshold = number of std devs)
    """
    outlier_info = {}
    numeric_cols = df.select_dtypes(include=[np.number]).columns

    for col in numeric_cols:
        col_data = df[col].dropna()
        if len(col_data) == 0:
            continue

        if method == "iqr":
            q1 = col_data.quantile(0.25)
            q3 = col_data.quantile(0.75)
            iqr = q3 - q1
            lower_bound = q1 - threshold * iqr
            upper_bound = q3 + threshold * iqr
            outlier_mask = (col_data < lower_bound) | (col_data > upper_bound)
        elif method == "zscore":
            z_scores = np.abs(stats.zscore(col_data))
            outlier_mask = z_scores > threshold
            lower_bound = float(col_data.mean() - threshold * col_data.std())
            upper_bound = float(col_data.mean() + threshold * col_data.std())
        else:
            continue

        outlier_count = int(outlier_mask.sum())
        if outlier_count > 0:
            outlier_info[col] = {
                "count": outlier_count,
                "percentage": round(outlier_count / len(col_data) * 100, 2),
                "lower_bound": round(float(lower_bound), 4),
                "upper_bound": round(float(upper_bound), 4),
                "method": method,
            }

    return outlier_info


def encode_categoricals(df: pd.DataFrame, max_categories: int = 20) -> Tuple[pd.DataFrame, Dict[str, Any]]:
    """
    Encode categorical columns. Uses label encoding for columns with
    many categories and one-hot for columns with few categories.
    Returns the encoded DataFrame and encoding details.
    """
    df = df.copy()
    encoding_report = {}
    cat_cols = df.select_dtypes(include=["object", "category"]).columns

    for col in cat_cols:
        nunique = df[col].nunique()
        if nunique <= max_categories and nunique > 1:
            # One-hot encode
            dummies = pd.get_dummies(df[col], prefix=col, drop_first=True, dtype=int)
            df = pd.concat([df.drop(columns=[col]), dummies], axis=1)
            encoding_report[col] = {"method": "one_hot", "categories": nunique}
        elif nunique > max_categories:
            # Label encode
            df[col] = df[col].astype("category").cat.codes
            encoding_report[col] = {"method": "label_encoding", "categories": nunique}
        # If nunique <= 1, we skip (constant column)

    return df, encoding_report


def preprocess_pipeline(df: pd.DataFrame) -> Tuple[pd.DataFrame, Dict[str, Any]]:
    """
    Run the full preprocessing pipeline:
    1. Remove duplicates
    2. Handle missing values
    3. Detect outliers
    Returns cleaned DataFrame and comprehensive report.
    """
    report = {}

    # Step 1: Remove duplicates
    df, dup_count = remove_duplicates(df)
    report["duplicates_removed"] = dup_count

    # Step 2: Handle missing values
    df, missing_report = handle_missing_values(df, strategy="auto")
    report["missing_values"] = missing_report

    # Step 3: Detect outliers (info only, don't remove)
    outlier_info = detect_outliers(df, method="iqr")
    report["outliers"] = outlier_info

    report["final_shape"] = {"rows": len(df), "columns": len(df.columns)}

    return df, report
