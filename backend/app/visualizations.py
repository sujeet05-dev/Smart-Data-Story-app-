"""
Visualization Engine
--------------------
Generates interactive Plotly charts for the dashboard.
Returns chart data as JSON (Plotly figure dictionaries).
"""

import pandas as pd
import numpy as np
import plotly.express as px
import plotly.graph_objects as go
from plotly.subplots import make_subplots
from typing import Dict, Any, List, Optional
import json

from app.data_ingestion import detect_column_types


def _fig_to_json(fig) -> Dict[str, Any]:
    """Convert a Plotly figure to a JSON-serializable dict."""
    return json.loads(fig.to_json())


def create_distribution_charts(df: pd.DataFrame, max_charts: int = 8) -> List[Dict[str, Any]]:
    """Create histogram/distribution charts for numerical columns."""
    col_types = detect_column_types(df)
    charts = []

    for col in col_types["numerical"][:max_charts]:
        data = df[col].dropna()
        if len(data) == 0:
            continue

        fig = px.histogram(
            df, x=col, nbins=30,
            title=f"Distribution of {col}",
            template="plotly_dark",
            color_discrete_sequence=["#6366f1"],
            opacity=0.85,
        )
        fig.update_layout(
            plot_bgcolor="rgba(0,0,0,0)",
            paper_bgcolor="rgba(0,0,0,0)",
            font=dict(color="#e2e8f0", size=12),
            title_font_size=16,
            xaxis_title=col,
            yaxis_title="Count",
            margin=dict(l=50, r=30, t=50, b=50),
        )
        charts.append({
            "id": f"dist_{col}",
            "title": f"Distribution of {col}",
            "type": "histogram",
            "column": col,
            "chart": _fig_to_json(fig),
        })

    return charts


def create_correlation_heatmap(df: pd.DataFrame) -> Optional[Dict[str, Any]]:
    """Create an interactive correlation heatmap."""
    numeric_df = df.select_dtypes(include=[np.number])
    if numeric_df.shape[1] < 2:
        return None

    # Limit to top 15 columns by variance for readability
    if numeric_df.shape[1] > 15:
        variances = numeric_df.var().sort_values(ascending=False)
        numeric_df = numeric_df[variances.head(15).index]

    corr = numeric_df.corr()

    fig = px.imshow(
        corr,
        text_auto=".2f",
        color_continuous_scale="RdBu_r",
        title="Correlation Heatmap",
        template="plotly_dark",
        zmin=-1, zmax=1,
    )
    fig.update_layout(
        plot_bgcolor="rgba(0,0,0,0)",
        paper_bgcolor="rgba(0,0,0,0)",
        font=dict(color="#e2e8f0", size=11),
        title_font_size=16,
        margin=dict(l=80, r=30, t=50, b=80),
        width=700,
        height=600,
    )

    return {
        "id": "correlation_heatmap",
        "title": "Correlation Heatmap",
        "type": "heatmap",
        "chart": _fig_to_json(fig),
    }


def create_scatter_plots(df: pd.DataFrame, correlations: List[Dict] = None, max_charts: int = 4) -> List[Dict[str, Any]]:
    """Create scatter plots for strongly correlated variable pairs."""
    charts = []

    if correlations:
        pairs = [(c["column_1"], c["column_2"]) for c in correlations[:max_charts]]
    else:
        col_types = detect_column_types(df)
        num_cols = col_types["numerical"]
        if len(num_cols) < 2:
            return charts
        pairs = [(num_cols[i], num_cols[j]) for i in range(min(2, len(num_cols))) for j in range(i + 1, min(4, len(num_cols)))]

    for x_col, y_col in pairs[:max_charts]:
        if x_col not in df.columns or y_col not in df.columns:
            continue

        fig = px.scatter(
            df, x=x_col, y=y_col,
            title=f"{x_col} vs {y_col}",
            template="plotly_dark",
            color_discrete_sequence=["#8b5cf6"],
            opacity=0.6,
            trendline="ols",
        )
        fig.update_layout(
            plot_bgcolor="rgba(0,0,0,0)",
            paper_bgcolor="rgba(0,0,0,0)",
            font=dict(color="#e2e8f0", size=12),
            title_font_size=16,
            margin=dict(l=50, r=30, t=50, b=50),
        )
        charts.append({
            "id": f"scatter_{x_col}_{y_col}",
            "title": f"{x_col} vs {y_col}",
            "type": "scatter",
            "columns": [x_col, y_col],
            "chart": _fig_to_json(fig),
        })

    return charts


def create_bar_charts(df: pd.DataFrame, max_charts: int = 6) -> List[Dict[str, Any]]:
    """Create bar charts for categorical columns."""
    col_types = detect_column_types(df)
    charts = []

    colors = ["#6366f1", "#8b5cf6", "#a78bfa", "#c4b5fd", "#818cf8", "#7c3aed"]

    for idx, col in enumerate(col_types["categorical"][:max_charts]):
        value_counts = df[col].value_counts().head(10)
        if len(value_counts) == 0:
            continue

        fig = px.bar(
            x=value_counts.index.astype(str),
            y=value_counts.values,
            title=f"Frequency of {col}",
            template="plotly_dark",
            color_discrete_sequence=[colors[idx % len(colors)]],
            labels={"x": col, "y": "Count"},
        )
        fig.update_layout(
            plot_bgcolor="rgba(0,0,0,0)",
            paper_bgcolor="rgba(0,0,0,0)",
            font=dict(color="#e2e8f0", size=12),
            title_font_size=16,
            margin=dict(l=50, r=30, t=50, b=50),
            xaxis_tickangle=-45,
        )
        charts.append({
            "id": f"bar_{col}",
            "title": f"Frequency of {col}",
            "type": "bar",
            "column": col,
            "chart": _fig_to_json(fig),
        })

    return charts


def create_box_plots(df: pd.DataFrame, max_charts: int = 6) -> List[Dict[str, Any]]:
    """Create box plots to visualize distributions and outliers."""
    col_types = detect_column_types(df)
    charts = []

    for col in col_types["numerical"][:max_charts]:
        fig = px.box(
            df, y=col,
            title=f"Box Plot: {col}",
            template="plotly_dark",
            color_discrete_sequence=["#6366f1"],
        )
        fig.update_layout(
            plot_bgcolor="rgba(0,0,0,0)",
            paper_bgcolor="rgba(0,0,0,0)",
            font=dict(color="#e2e8f0", size=12),
            title_font_size=16,
            margin=dict(l=50, r=30, t=50, b=50),
        )
        charts.append({
            "id": f"box_{col}",
            "title": f"Box Plot: {col}",
            "type": "box",
            "column": col,
            "chart": _fig_to_json(fig),
        })

    return charts


def create_line_charts(df: pd.DataFrame, max_charts: int = 4) -> List[Dict[str, Any]]:
    """Create line charts for time-based or sequential data."""
    col_types = detect_column_types(df)
    charts = []

    # If there are datetime columns, create time series charts
    if col_types["datetime"] and col_types["numerical"]:
        date_col = col_types["datetime"][0]
        df_sorted = df.sort_values(by=date_col)

        for num_col in col_types["numerical"][:max_charts]:
            fig = px.line(
                df_sorted, x=date_col, y=num_col,
                title=f"{num_col} Over Time",
                template="plotly_dark",
                color_discrete_sequence=["#6366f1"],
            )
            fig.update_layout(
                plot_bgcolor="rgba(0,0,0,0)",
                paper_bgcolor="rgba(0,0,0,0)",
                font=dict(color="#e2e8f0", size=12),
                title_font_size=16,
                margin=dict(l=50, r=30, t=50, b=50),
            )
            charts.append({
                "id": f"line_{num_col}",
                "title": f"{num_col} Over Time",
                "type": "line",
                "columns": [date_col, num_col],
                "chart": _fig_to_json(fig),
            })

    return charts


def create_cluster_chart(df: pd.DataFrame, cluster_labels: List[int], features: List[str]) -> Optional[Dict[str, Any]]:
    """Create a 2D scatter plot of clustering results."""
    if len(features) < 2:
        return None

    df_plot = df[features[:2]].copy()
    df_plot["Cluster"] = [str(c) for c in cluster_labels[:len(df_plot)]]

    fig = px.scatter(
        df_plot, x=features[0], y=features[1],
        color="Cluster",
        title="K-Means Clustering Results",
        template="plotly_dark",
        color_discrete_sequence=px.colors.qualitative.Set2,
        opacity=0.7,
    )
    fig.update_layout(
        plot_bgcolor="rgba(0,0,0,0)",
        paper_bgcolor="rgba(0,0,0,0)",
        font=dict(color="#e2e8f0", size=12),
        title_font_size=16,
        margin=dict(l=50, r=30, t=50, b=50),
    )

    return {
        "id": "cluster_scatter",
        "title": "K-Means Clustering Results",
        "type": "scatter",
        "chart": _fig_to_json(fig),
    }


def create_feature_importance_chart(feature_importance: Dict[str, float], title: str = "Feature Importance") -> Dict[str, Any]:
    """Create a horizontal bar chart of feature importances."""
    features = list(feature_importance.keys())
    importances = list(feature_importance.values())

    fig = px.bar(
        x=importances, y=features,
        orientation="h",
        title=title,
        template="plotly_dark",
        color=importances,
        color_continuous_scale="Viridis",
        labels={"x": "Importance", "y": "Feature"},
    )
    fig.update_layout(
        plot_bgcolor="rgba(0,0,0,0)",
        paper_bgcolor="rgba(0,0,0,0)",
        font=dict(color="#e2e8f0", size=12),
        title_font_size=16,
        margin=dict(l=120, r=30, t=50, b=50),
        yaxis=dict(autorange="reversed"),
        coloraxis_showscale=False,
    )

    return {
        "id": "feature_importance",
        "title": title,
        "type": "bar",
        "chart": _fig_to_json(fig),
    }


def generate_all_charts(df: pd.DataFrame, eda_results: Dict = None, ml_results: Dict = None) -> List[Dict[str, Any]]:
    """Generate all visualization charts for the dashboard."""
    all_charts = []

    # Distribution charts
    all_charts.extend(create_distribution_charts(df, max_charts=6))

    # Correlation heatmap
    heatmap = create_correlation_heatmap(df)
    if heatmap:
        all_charts.append(heatmap)

    # Scatter plots (use EDA correlations if available)
    correlations = eda_results.get("correlation", {}).get("strong_correlations", []) if eda_results else []
    all_charts.extend(create_scatter_plots(df, correlations, max_charts=4))

    # Bar charts for categorical data
    all_charts.extend(create_bar_charts(df, max_charts=4))

    # Box plots
    all_charts.extend(create_box_plots(df, max_charts=4))

    # Line charts (if time data exists)
    all_charts.extend(create_line_charts(df, max_charts=3))

    # ML-specific charts
    if ml_results:
        # Cluster chart
        clustering = ml_results.get("clustering", {})
        if "cluster_labels" in clustering and "features_used" in clustering:
            cluster_chart = create_cluster_chart(df, clustering["cluster_labels"], clustering["features_used"])
            if cluster_chart:
                all_charts.append(cluster_chart)

        # Feature importance (from regression or classification)
        for model_type in ["regression", "classification"]:
            model_result = ml_results.get(model_type, {})
            if "feature_importance" in model_result:
                title = f"Feature Importance ({model_type.title()})"
                fi_chart = create_feature_importance_chart(model_result["feature_importance"], title)
                fi_chart["id"] = f"fi_{model_type}"
                all_charts.append(fi_chart)

    return all_charts
