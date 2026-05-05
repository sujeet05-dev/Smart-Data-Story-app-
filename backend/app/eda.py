"""
Automated EDA Module
--------------------
Generates summary statistics, correlation matrix,
distribution analysis, and category frequency charts.
"""

import pandas as pd
import numpy as np
from typing import Dict, Any, List

from app.data_ingestion import detect_column_types


def summary_statistics(df: pd.DataFrame) -> Dict[str, Any]:
    """Generate comprehensive summary statistics for all column types."""
    col_types = detect_column_types(df)
    stats_report = {}

    # Numerical statistics
    numerical_stats = {}
    for col in col_types["numerical"]:
        col_data = df[col].dropna()
        if len(col_data) == 0:
            continue
        numerical_stats[col] = {
            "count": int(col_data.count()),
            "mean": round(float(col_data.mean()), 4),
            "median": round(float(col_data.median()), 4),
            "std": round(float(col_data.std()), 4),
            "min": round(float(col_data.min()), 4),
            "max": round(float(col_data.max()), 4),
            "q25": round(float(col_data.quantile(0.25)), 4),
            "q75": round(float(col_data.quantile(0.75)), 4),
            "skewness": round(float(col_data.skew()), 4),
            "kurtosis": round(float(col_data.kurtosis()), 4),
        }
    stats_report["numerical"] = numerical_stats

    # Categorical statistics
    categorical_stats = {}
    for col in col_types["categorical"]:
        col_data = df[col].dropna()
        if len(col_data) == 0:
            continue
        value_counts = col_data.value_counts()
        categorical_stats[col] = {
            "unique_values": int(col_data.nunique()),
            "most_common": str(value_counts.index[0]) if len(value_counts) > 0 else None,
            "most_common_count": int(value_counts.iloc[0]) if len(value_counts) > 0 else 0,
            "least_common": str(value_counts.index[-1]) if len(value_counts) > 0 else None,
            "top_5": {str(k): int(v) for k, v in value_counts.head(5).items()},
        }
    stats_report["categorical"] = categorical_stats

    return stats_report


def correlation_analysis(df: pd.DataFrame) -> Dict[str, Any]:
    """Compute correlation matrix and identify strong correlations."""
    numeric_df = df.select_dtypes(include=[np.number])
    if numeric_df.shape[1] < 2:
        return {"matrix": {}, "strong_correlations": []}

    corr_matrix = numeric_df.corr()

    # Find strong correlations (|r| > 0.5, excluding self-correlations)
    strong_correlations = []
    cols = corr_matrix.columns
    for i in range(len(cols)):
        for j in range(i + 1, len(cols)):
            r_val = corr_matrix.iloc[i, j]
            if abs(r_val) > 0.5 and not np.isnan(r_val):
                strength = "strong" if abs(r_val) > 0.7 else "moderate"
                direction = "positive" if r_val > 0 else "negative"
                strong_correlations.append({
                    "column_1": cols[i],
                    "column_2": cols[j],
                    "correlation": round(float(r_val), 4),
                    "strength": strength,
                    "direction": direction,
                })

    # Sort by absolute correlation value
    strong_correlations.sort(key=lambda x: abs(x["correlation"]), reverse=True)

    # Convert matrix to serializable format
    matrix_dict = {}
    for col in corr_matrix.columns:
        matrix_dict[col] = {
            k: round(float(v), 4) if not np.isnan(v) else 0
            for k, v in corr_matrix[col].items()
        }

    return {
        "matrix": matrix_dict,
        "strong_correlations": strong_correlations[:20],  # Top 20
    }


def distribution_analysis(df: pd.DataFrame) -> Dict[str, Any]:
    """Analyze distributions of numerical columns."""
    col_types = detect_column_types(df)
    distributions = {}

    for col in col_types["numerical"]:
        col_data = df[col].dropna()
        if len(col_data) == 0:
            continue

        skew = float(col_data.skew())
        if abs(skew) < 0.5:
            shape = "approximately normal"
        elif skew > 0:
            shape = "right-skewed (positive skew)"
        else:
            shape = "left-skewed (negative skew)"

        kurt = float(col_data.kurtosis())
        if abs(kurt) < 1:
            tail_type = "normal tails (mesokurtic)"
        elif kurt > 0:
            tail_type = "heavy tails (leptokurtic)"
        else:
            tail_type = "light tails (platykurtic)"

        # Create histogram data (bin edges and counts)
        counts, bin_edges = np.histogram(col_data, bins=min(30, len(col_data.unique())))
        distributions[col] = {
            "shape": shape,
            "tail_type": tail_type,
            "skewness": round(skew, 4),
            "kurtosis": round(kurt, 4),
            "histogram": {
                "counts": counts.tolist(),
                "bin_edges": [round(float(e), 4) for e in bin_edges.tolist()],
            },
        }

    return distributions


def category_frequency(df: pd.DataFrame) -> Dict[str, Any]:
    """Get frequency distributions for categorical columns."""
    col_types = detect_column_types(df)
    frequencies = {}

    for col in col_types["categorical"]:
        val_counts = df[col].value_counts()
        total = len(df[col].dropna())
        frequencies[col] = {
            "values": {str(k): int(v) for k, v in val_counts.head(15).items()},
            "percentages": {
                str(k): round(int(v) / max(total, 1) * 100, 2)
                for k, v in val_counts.head(15).items()
            },
            "total_unique": int(df[col].nunique()),
        }

    return frequencies


def run_eda(df: pd.DataFrame) -> Dict[str, Any]:
    """Run the full automated EDA pipeline."""
    return {
        "summary_statistics": summary_statistics(df),
        "correlation": correlation_analysis(df),
        "distributions": distribution_analysis(df),
        "category_frequency": category_frequency(df),
    }
