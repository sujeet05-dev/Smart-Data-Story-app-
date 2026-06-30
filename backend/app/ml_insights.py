"""
ML Insights Module
------------------
Applies machine learning techniques to extract insights:
- K-Means clustering
- Regression analysis
- Classification (if categorical target)
- Trend and anomaly detection
"""

import pandas as pd
import numpy as np
from typing import Dict, Any, List, Optional
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.linear_model import LinearRegression, LogisticRegression
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    r2_score, mean_absolute_error, mean_squared_error,
    accuracy_score, classification_report
)
import warnings

from app.data_ingestion import detect_column_types

warnings.filterwarnings("ignore")


def _prepare_numeric_data(df: pd.DataFrame) -> pd.DataFrame:
    """Prepare numeric-only DataFrame with no missing values."""
    numeric_df = df.select_dtypes(include=[np.number]).dropna(axis=1)
    numeric_df = numeric_df.dropna()
    return numeric_df


def perform_clustering(df: pd.DataFrame, max_clusters: int = 6) -> Dict[str, Any]:
    """
    Apply K-Means clustering on numeric features.
    Automatically determines optimal k using inertia/elbow heuristic.
    """
    numeric_df = _prepare_numeric_data(df)
    if numeric_df.shape[1] < 2 or len(numeric_df) < 10:
        return {"error": "Not enough numeric data for clustering"}

    # Limit features for performance
    if numeric_df.shape[1] > 15:
        # Select top 15 features by variance
        variances = numeric_df.var().sort_values(ascending=False)
        numeric_df = numeric_df[variances.head(15).index]

    scaler = StandardScaler()
    scaled_data = scaler.fit_transform(numeric_df)

    # Find optimal k using inertia
    max_k = min(max_clusters, len(numeric_df) // 3, 10)
    if max_k < 2:
        max_k = 2

    inertias = []
    for k in range(2, max_k + 1):
        km = KMeans(n_clusters=k, random_state=42, n_init=5, max_iter=200)
        km.fit(scaled_data)
        inertias.append({"k": k, "inertia": round(float(km.inertia_), 2)})

    # Use elbow method: pick k where inertia drop rate decreases significantly
    if len(inertias) >= 3:
        diffs = [inertias[i]["inertia"] - inertias[i + 1]["inertia"] for i in range(len(inertias) - 1)]
        ratios = [diffs[i] / max(diffs[i + 1], 1) for i in range(len(diffs) - 1)]
        optimal_idx = next((i for i, r in enumerate(ratios) if r > 2), 0)
        optimal_k = inertias[optimal_idx + 1]["k"]
    else:
        optimal_k = 2

    # Final clustering with optimal k
    km = KMeans(n_clusters=optimal_k, random_state=42, n_init=5)
    labels = km.fit_predict(scaled_data)

    # Get cluster profiles
    df_clustered = numeric_df.copy()
    df_clustered["cluster"] = labels
    cluster_profiles = {}
    for c in range(optimal_k):
        cluster_data = df_clustered[df_clustered["cluster"] == c].drop(columns=["cluster"])
        cluster_profiles[f"Cluster {c}"] = {
            "size": int(len(cluster_data)),
            "percentage": round(len(cluster_data) / len(df_clustered) * 100, 1),
            "mean_values": {col: round(float(cluster_data[col].mean()), 4) for col in cluster_data.columns[:10]},
        }

    return {
        "optimal_k": optimal_k,
        "inertias": inertias,
        "cluster_profiles": cluster_profiles,
        "cluster_labels": labels.tolist(),
        "features_used": list(numeric_df.columns[:10]),
    }


def perform_regression(df: pd.DataFrame, target_col: Optional[str] = None) -> Dict[str, Any]:
    """
    Perform regression analysis.
    If no target is specified, attempts to auto-detect the most likely target.
    """
    col_types = detect_column_types(df)

    # Auto-detect target: pick the last numeric column or one with suggestive name
    if target_col is None:
        target_keywords = ["price", "amount", "sales", "revenue", "cost", "value", "total", "target", "profit"]
        for col in col_types["numerical"]:
            if any(kw in col.lower() for kw in target_keywords):
                target_col = col
                break
        if target_col is None and len(col_types["numerical"]) >= 2:
            target_col = col_types["numerical"][-1]

    if target_col is None or target_col not in df.columns:
        return {"error": "No suitable numeric target column found for regression"}

    numeric_df = _prepare_numeric_data(df)
    if target_col not in numeric_df.columns:
        return {"error": f"Target column '{target_col}' not available after preprocessing"}

    feature_cols = [c for c in numeric_df.columns if c != target_col]
    if len(feature_cols) == 0:
        return {"error": "No feature columns available for regression"}

    X = numeric_df[feature_cols]
    y = numeric_df[target_col]

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    # Random Forest Regressor for feature importance
    rf = RandomForestRegressor(n_estimators=50, random_state=42, max_depth=10, n_jobs=-1)
    rf.fit(X_train, y_train)
    y_pred = rf.predict(X_test)

    r2 = r2_score(y_test, y_pred)
    mae = mean_absolute_error(y_test, y_pred)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))

    # Feature importance
    importances = dict(zip(feature_cols, rf.feature_importances_))
    sorted_importance = dict(sorted(importances.items(), key=lambda x: x[1], reverse=True))
    top_features = {k: round(float(v), 4) for k, v in list(sorted_importance.items())[:10]}

    return {
        "target_column": target_col,
        "model": "RandomForestRegressor",
        "r2_score": round(float(r2), 4),
        "mae": round(float(mae), 4),
        "rmse": round(float(rmse), 4),
        "feature_importance": top_features,
        "top_predictor": list(top_features.keys())[0] if top_features else None,
        "sample_predictions": {
            "actual": y_test.head(10).tolist(),
            "predicted": [round(float(p), 4) for p in y_pred[:10]],
        },
    }


def perform_classification(df: pd.DataFrame, target_col: Optional[str] = None) -> Dict[str, Any]:
    """
    Perform classification if a categorical target is detected.
    """
    col_types = detect_column_types(df)

    if target_col is None:
        target_keywords = ["class", "label", "category", "type", "status", "result", "outcome", "target"]
        for col in col_types["categorical"]:
            if any(kw in col.lower() for kw in target_keywords):
                target_col = col
                break
        if target_col is None and len(col_types["categorical"]) > 0:
            # Pick last categorical with 2-10 classes
            for col in reversed(col_types["categorical"]):
                if 2 <= df[col].nunique() <= 10:
                    target_col = col
                    break

    if target_col is None or target_col not in df.columns:
        return {"error": "No suitable categorical target found for classification"}

    numeric_df = df.select_dtypes(include=[np.number]).dropna(axis=1)
    if numeric_df.shape[1] < 1:
        return {"error": "No numeric features for classification"}

    # Prepare target
    le = LabelEncoder()
    y = le.fit_transform(df[target_col].fillna("Unknown"))
    X = numeric_df.dropna()

    # Align indices
    common_idx = X.index.intersection(pd.Index(range(len(y))))
    X = X.loc[common_idx]
    y = y[common_idx]

    if len(X) < 20:
        return {"error": "Not enough samples for classification"}

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y if len(np.unique(y)) > 1 else None)

    rf = RandomForestClassifier(n_estimators=50, random_state=42, max_depth=10, n_jobs=-1)
    rf.fit(X_train, y_train)
    y_pred = rf.predict(X_test)

    accuracy = accuracy_score(y_test, y_pred)
    report = classification_report(y_test, y_pred, target_names=le.classes_.astype(str), output_dict=True, zero_division=0)

    # Feature importance
    importances = dict(zip(X.columns, rf.feature_importances_))
    sorted_importance = dict(sorted(importances.items(), key=lambda x: x[1], reverse=True))
    top_features = {k: round(float(v), 4) for k, v in list(sorted_importance.items())[:10]}

    # Clean up classification report for JSON
    clean_report = {}
    for key, val in report.items():
        if isinstance(val, dict):
            clean_report[str(key)] = {k: round(float(v), 4) for k, v in val.items()}
        else:
            clean_report[str(key)] = round(float(val), 4)

    return {
        "target_column": target_col,
        "model": "RandomForestClassifier",
        "accuracy": round(float(accuracy), 4),
        "classes": le.classes_.astype(str).tolist(),
        "classification_report": clean_report,
        "feature_importance": top_features,
        "top_predictor": list(top_features.keys())[0] if top_features else None,
    }


def detect_trends(df: pd.DataFrame) -> List[Dict[str, Any]]:
    """Detect numerical trends in the dataset."""
    col_types = detect_column_types(df)
    trends = []

    for col in col_types["numerical"]:
        data = df[col].dropna()
        if len(data) < 10:
            continue

        # Calculate rolling trend
        rolling_mean = data.rolling(window=max(len(data) // 10, 2)).mean().dropna()
        if len(rolling_mean) < 2:
            continue

        first_half_mean = float(rolling_mean.iloc[:len(rolling_mean) // 2].mean())
        second_half_mean = float(rolling_mean.iloc[len(rolling_mean) // 2:].mean())

        if first_half_mean != 0:
            pct_change = ((second_half_mean - first_half_mean) / abs(first_half_mean)) * 100
        else:
            pct_change = 0

        if abs(pct_change) > 5:
            direction = "increasing" if pct_change > 0 else "decreasing"
            trends.append({
                "column": col,
                "direction": direction,
                "change_percentage": round(pct_change, 2),
                "first_half_avg": round(first_half_mean, 4),
                "second_half_avg": round(second_half_mean, 4),
            })

    trends.sort(key=lambda x: abs(x["change_percentage"]), reverse=True)
    return trends[:10]


def detect_anomalies(df: pd.DataFrame) -> List[Dict[str, Any]]:
    """Detect anomalies (extreme outliers) in numerical columns."""
    col_types = detect_column_types(df)
    anomalies = []

    for col in col_types["numerical"]:
        data = df[col].dropna()
        if len(data) < 10:
            continue

        q1, q3 = data.quantile(0.25), data.quantile(0.75)
        iqr = q3 - q1
        if iqr == 0:
            continue

        extreme_low = q1 - 3 * iqr
        extreme_high = q3 + 3 * iqr
        extreme_outliers = data[(data < extreme_low) | (data > extreme_high)]

        if len(extreme_outliers) > 0:
            anomalies.append({
                "column": col,
                "anomaly_count": int(len(extreme_outliers)),
                "anomaly_percentage": round(len(extreme_outliers) / len(data) * 100, 2),
                "min_anomaly": round(float(extreme_outliers.min()), 4),
                "max_anomaly": round(float(extreme_outliers.max()), 4),
                "normal_range": [round(float(extreme_low), 4), round(float(extreme_high), 4)],
            })

    anomalies.sort(key=lambda x: x["anomaly_count"], reverse=True)
    return anomalies[:10]


def run_ml_analysis(df: pd.DataFrame) -> Dict[str, Any]:
    """Run all ML-based analysis."""
    results = {}

    # Clustering
    try:
        results["clustering"] = perform_clustering(df)
    except Exception as e:
        results["clustering"] = {"error": str(e)}

    # Regression
    try:
        results["regression"] = perform_regression(df)
    except Exception as e:
        results["regression"] = {"error": str(e)}

    # Classification
    try:
        results["classification"] = perform_classification(df)
    except Exception as e:
        results["classification"] = {"error": str(e)}

    # Trends
    try:
        results["trends"] = detect_trends(df)
    except Exception as e:
        results["trends"] = []

    # Anomalies
    try:
        results["anomalies"] = detect_anomalies(df)
    except Exception as e:
        results["anomalies"] = []

    return results
