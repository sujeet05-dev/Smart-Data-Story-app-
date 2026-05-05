"""
LLM Storytelling Module
-----------------------
Integrates with Google Gemini API to generate human-readable
data stories, insights, and answers from structured analysis results.
"""

import json
from typing import Dict, Any, Optional

import google.generativeai as genai
from app.config import GEMINI_API_KEY, LLM_MODEL, LLM_TEMPERATURE, LLM_MAX_TOKENS


def _get_model():
    """Initialize and return the Gemini model."""
    if not GEMINI_API_KEY or GEMINI_API_KEY == "your_gemini_api_key_here":
        return None
    genai.configure(api_key=GEMINI_API_KEY)
    return genai.GenerativeModel(LLM_MODEL)


def _truncate_for_context(data: Any, max_length: int = 8000) -> str:
    """Truncate data to fit within context window."""
    text = json.dumps(data, indent=2, default=str)
    if len(text) > max_length:
        text = text[:max_length] + "\n... [truncated for brevity]"
    return text


def detect_dataset_domain(data_overview: Dict) -> str:
    """Use heuristic + LLM to detect the domain/type of the dataset."""
    column_names = [c.lower() for c in data_overview.get("column_names", [])]
    all_cols = " ".join(column_names)

    # Heuristic domain detection
    domain_keywords = {
        "finance": ["revenue", "profit", "loss", "stock", "price", "investment", "portfolio", "interest", "dividend", "market"],
        "sales": ["sales", "quantity", "product", "customer", "order", "discount", "purchase", "store", "shop"],
        "healthcare": ["patient", "diagnosis", "symptom", "blood", "heart", "disease", "hospital", "medicine", "treatment"],
        "education": ["student", "grade", "score", "exam", "school", "course", "gpa", "attendance", "teacher"],
        "hr": ["employee", "salary", "department", "hire", "attrition", "performance", "position", "manager"],
        "real_estate": ["property", "house", "sqft", "bedroom", "bathroom", "lot", "listing", "mortgage", "rent"],
        "marketing": ["campaign", "click", "impression", "conversion", "engagement", "reach", "bounce", "visitor"],
        "ecommerce": ["cart", "checkout", "shipping", "return", "review", "rating", "sku", "inventory"],
        "energy": ["energy", "power", "consumption", "solar", "wind", "emission", "carbon", "electricity"],
        "transportation": ["trip", "distance", "fare", "route", "vehicle", "driver", "passenger", "fuel"],
    }

    scores = {}
    for domain, keywords in domain_keywords.items():
        score = sum(1 for kw in keywords if kw in all_cols)
        if score > 0:
            scores[domain] = score

    if scores:
        return max(scores, key=scores.get)
    return "general"


def generate_report_title(domain: str, data_overview: Dict) -> str:
    """Generate a professional report title."""
    domain_titles = {
        "finance": "Financial Performance Analysis Report",
        "sales": "Sales Performance Analysis Report",
        "healthcare": "Healthcare Data Analysis Report",
        "education": "Educational Performance Analysis Report",
        "hr": "Human Resources Analytics Report",
        "real_estate": "Real Estate Market Analysis Report",
        "marketing": "Marketing Campaign Analysis Report",
        "ecommerce": "E-Commerce Analytics Report",
        "energy": "Energy Consumption Analysis Report",
        "transportation": "Transportation Analytics Report",
        "general": "Comprehensive Data Analysis Report",
    }
    return domain_titles.get(domain, "Data Analysis Report")


def generate_story(
    data_overview: Dict,
    eda_results: Dict,
    ml_results: Dict,
    preprocessing_report: Dict,
    domain: str = "general",
) -> Dict[str, Any]:
    """
    Generate a comprehensive data story using the Gemini LLM.
    Falls back to rule-based generation if API is not available.
    """
    model = _get_model()

    # Build context summary for the LLM
    context = _build_analysis_context(data_overview, eda_results, ml_results, preprocessing_report, domain)

    if model:
        try:
            return _generate_with_llm(model, context, domain)
        except Exception as e:
            print(f"LLM generation failed: {e}. Falling back to rule-based.")
            return _generate_rule_based(data_overview, eda_results, ml_results, preprocessing_report, domain)
    else:
        return _generate_rule_based(data_overview, eda_results, ml_results, preprocessing_report, domain)


def _build_analysis_context(
    data_overview: Dict, eda_results: Dict, ml_results: Dict, preprocessing_report: Dict, domain: str
) -> str:
    """Build structured context for the LLM prompt."""
    context_parts = []

    # Dataset overview
    context_parts.append(f"DATASET DOMAIN: {domain}")
    context_parts.append(f"DATASET SIZE: {data_overview.get('rows', 0)} rows × {data_overview.get('columns', 0)} columns")
    context_parts.append(f"COLUMNS: {', '.join(data_overview.get('column_names', []))}")

    # Missing values summary
    missing = data_overview.get("missing_values", {})
    total_missing = sum(missing.values())
    if total_missing > 0:
        context_parts.append(f"MISSING VALUES: {total_missing} total across {sum(1 for v in missing.values() if v > 0)} columns")

    # Preprocessing
    context_parts.append(f"DUPLICATES REMOVED: {preprocessing_report.get('duplicates_removed', 0)}")

    # Key statistics
    num_stats = eda_results.get("summary_statistics", {}).get("numerical", {})
    if num_stats:
        context_parts.append("KEY NUMERICAL STATISTICS:")
        for col, stats in list(num_stats.items())[:10]:
            context_parts.append(f"  {col}: mean={stats.get('mean')}, median={stats.get('median')}, std={stats.get('std')}, min={stats.get('min')}, max={stats.get('max')}")

    # Correlations
    correlations = eda_results.get("correlation", {}).get("strong_correlations", [])
    if correlations:
        context_parts.append("STRONG CORRELATIONS:")
        for c in correlations[:10]:
            context_parts.append(f"  {c['column_1']} ↔ {c['column_2']}: r={c['correlation']} ({c['strength']} {c['direction']})")

    # ML Results
    regression = ml_results.get("regression", {})
    if "r2_score" in regression:
        context_parts.append(f"REGRESSION: Target={regression.get('target_column')}, R²={regression.get('r2_score')}, Top predictor={regression.get('top_predictor')}")

    classification = ml_results.get("classification", {})
    if "accuracy" in classification:
        context_parts.append(f"CLASSIFICATION: Target={classification.get('target_column')}, Accuracy={classification.get('accuracy')}, Top predictor={classification.get('top_predictor')}")

    clustering = ml_results.get("clustering", {})
    if "optimal_k" in clustering:
        context_parts.append(f"CLUSTERING: {clustering.get('optimal_k')} clusters found")
        for name, profile in clustering.get("cluster_profiles", {}).items():
            context_parts.append(f"  {name}: {profile.get('size')} records ({profile.get('percentage')}%)")

    # Trends
    trends = ml_results.get("trends", [])
    if trends:
        context_parts.append("TRENDS DETECTED:")
        for t in trends[:5]:
            context_parts.append(f"  {t['column']}: {t['direction']} by {t['change_percentage']}%")

    # Anomalies
    anomalies = ml_results.get("anomalies", [])
    if anomalies:
        context_parts.append("ANOMALIES DETECTED:")
        for a in anomalies[:5]:
            context_parts.append(f"  {a['column']}: {a['anomaly_count']} anomalous values ({a['anomaly_percentage']}%)")

    # Distributions
    distributions = eda_results.get("distributions", {})
    if distributions:
        context_parts.append("DISTRIBUTION SHAPES:")
        for col, dist in list(distributions.items())[:8]:
            context_parts.append(f"  {col}: {dist.get('shape')}")

    # Outliers
    outliers = preprocessing_report.get("outliers", {})
    if outliers:
        context_parts.append("OUTLIERS:")
        for col, info in list(outliers.items())[:5]:
            context_parts.append(f"  {col}: {info.get('count')} outliers ({info.get('percentage')}%)")

    return "\n".join(context_parts)


def _add_compat_fields(story: Dict[str, Any]) -> Dict[str, Any]:
    """Add backward-compatible fields derived from new story structure for PDF export."""
    if "executive_summary" not in story:
        story["executive_summary"] = story.get("the_big_picture", story.get("one_liner", ""))
    if "key_findings" not in story:
        takeaways = story.get("key_takeaways", [])
        story["key_findings"] = [
            f"{t.get('title', '')}: {t.get('detail', '')}" if isinstance(t, dict) else str(t)
            for t in takeaways
        ]
    if "recommendations" not in story:
        actions = story.get("action_items", [])
        story["recommendations"] = [
            a.get("action", str(a)) if isinstance(a, dict) else str(a)
            for a in actions
        ]
    return story


def _generate_with_llm(model, context: str, domain: str) -> Dict[str, Any]:
    """Generate a simple, clear data story using Gemini LLM."""
    prompt = f"""You are a friendly data storyteller. Your job is to explain data analysis results in simple, clear language that anyone can understand — even someone with zero data background.

Think of yourself as a journalist writing a data story for a general audience.

ANALYSIS CONTEXT:
{context}

RULES:
1. Use simple, everyday language. No jargon. Explain like you're talking to a smart friend over coffee.
2. Every statement MUST be backed by the actual data above. NEVER make up numbers or statistics.
3. Use specific column names, values, and percentages from the data.
4. Make insights actionable — tell the reader what matters and what to do about it.
5. Use comparisons to make numbers relatable (e.g. "that's like X out of every Y").

Return ONLY valid JSON (no markdown, no code blocks) with this structure:
{{
    "headline": "A catchy 5-10 word headline capturing the single most important finding",
    "one_liner": "One clear sentence summarizing what this entire dataset tells us",
    "the_big_picture": "3-4 sentences: What is this data? How big is it? What is the overall story? Write as if explaining to someone seeing it for the first time.",
    "key_takeaways": [
        {{"title": "Short title (3-5 words)", "detail": "1-2 sentence plain-language explanation of why this matters", "type": "positive"}},
        {{"title": "Another takeaway", "detail": "Explanation", "type": "negative"}},
        {{"title": "Another takeaway", "detail": "Explanation", "type": "neutral"}},
        {{"title": "Another takeaway", "detail": "Explanation", "type": "warning"}},
        {{"title": "Another takeaway", "detail": "Explanation", "type": "positive"}}
    ],
    "data_quality_story": "2-3 sentences: Is the data clean and trustworthy? Were there missing values or duplicates? How were they handled?",
    "patterns_and_relationships": "A paragraph about interesting patterns. Say 'When X goes up, Y also goes up' instead of 'correlation of 0.85'. Make it intuitive.",
    "segmentation_insights": "A paragraph about natural groupings found. Describe groups in relatable terms like 'budget shoppers' vs 'premium buyers' rather than 'Cluster 0'.",
    "predictive_insights": "A paragraph about what the data can predict. What factors matter most? How reliable are the predictions? Keep it simple.",
    "anomalies_and_concerns": "A paragraph about anything unusual or worrying. Weird values? Unexpected patterns? Explain why they matter.",
    "action_items": [
        {{"action": "A specific, doable recommendation", "why": "The data-backed reason this matters"}},
        {{"action": "Another recommendation", "why": "Why it matters"}},
        {{"action": "Another recommendation", "why": "Why it matters"}}
    ],
    "story_narrative": "A 3-4 paragraph flowing narrative telling the complete data story. Write like a magazine article — engaging, clear, and insightful. Start with the big picture, explore the interesting findings, and end with what to do next."
}}"""

    response = model.generate_content(
        prompt,
        generation_config=genai.types.GenerationConfig(
            temperature=LLM_TEMPERATURE,
            max_output_tokens=LLM_MAX_TOKENS,
        ),
    )

    # Parse the LLM response
    try:
        text = response.text.strip()
        # Remove markdown code blocks if present
        if text.startswith("```"):
            text = text.split("\n", 1)[1]
        if text.endswith("```"):
            text = text.rsplit("\n", 1)[0]
        if text.startswith("json"):
            text = text[4:].strip()
        story = json.loads(text)
        story["generated_by"] = "gemini"
        return _add_compat_fields(story)
    except (json.JSONDecodeError, Exception) as e:
        # If JSON parsing fails, wrap the raw text
        return _add_compat_fields({
            "headline": "Data Analysis Complete",
            "one_liner": response.text[:200] if response.text else "Analysis complete.",
            "the_big_picture": response.text[:500] if response.text else "",
            "key_takeaways": [{"title": "See full narrative", "detail": response.text[:300] if response.text else "See details below.", "type": "neutral"}],
            "story_narrative": response.text or "",
            "generated_by": "gemini_raw",
            "parse_error": str(e),
        })


def _generate_rule_based(
    data_overview: Dict, eda_results: Dict, ml_results: Dict, preprocessing_report: Dict, domain: str
) -> Dict[str, Any]:
    """Generate a simple, clear data story using rules (fallback when LLM is unavailable)."""
    rows = data_overview.get("rows", 0)
    cols = data_overview.get("columns", 0)
    col_names = data_overview.get("column_names", [])
    missing = data_overview.get("missing_values", {})
    total_missing = sum(missing.values())
    dup_removed = preprocessing_report.get("duplicates_removed", 0)
    correlations = eda_results.get("correlation", {}).get("strong_correlations", [])
    regression = ml_results.get("regression", {})
    classification = ml_results.get("classification", {})
    clustering = ml_results.get("clustering", {})
    trends = ml_results.get("trends", [])
    anomalies = ml_results.get("anomalies", [])
    outliers = preprocessing_report.get("outliers", {})
    distributions = eda_results.get("distributions", {})
    num_stats = eda_results.get("summary_statistics", {}).get("numerical", {})
    domain_label = domain.replace("_", " ").title()

    # ── Headline ──
    headline = f"Your {domain_label} Data at a Glance"
    if trends and abs(trends[0]["change_percentage"]) > 10:
        t = trends[0]
        headline = f"{t['column']} is {t['direction'].title()} by {abs(t['change_percentage']):.0f}%"
    elif correlations:
        c = correlations[0]
        headline = f"Strong Link Between {c['column_1']} and {c['column_2']}"
    elif "r2_score" in regression and regression["r2_score"] > 0.7:
        headline = f"{regression['target_column']} Can Be Predicted Accurately"

    # ── One-liner ──
    one_liner = f"This {domain_label.lower()} dataset has {rows:,} records across {cols} columns"
    if correlations:
        one_liner += ", with notable relationships between key variables."
    elif trends:
        one_liner += ", showing clear directional trends."
    else:
        one_liner += "."

    # ── The Big Picture ──
    col_preview = ", ".join(col_names[:5])
    extra = f" and {len(col_names) - 5} more" if len(col_names) > 5 else ""
    the_big_picture = (
        f"You're looking at a {domain_label.lower()} dataset with {rows:,} records and {cols} variables "
        f"including {col_preview}{extra}. "
    )
    if total_missing > 0:
        missing_cols = sum(1 for v in missing.values() if v > 0)
        the_big_picture += f"We found and fixed {total_missing:,} missing values across {missing_cols} columns. "
    if dup_removed > 0:
        the_big_picture += f"{dup_removed:,} duplicate rows were removed. "
    the_big_picture += "The data is now clean and ready for analysis."

    # ── Key Takeaways ──
    key_takeaways = []

    for corr in correlations[:2]:
        direction_word = "move together" if corr["direction"] == "positive" else "move in opposite directions"
        key_takeaways.append({
            "title": f"{corr['column_1']} & {corr['column_2']} are linked",
            "detail": f"These two {direction_word} — when one changes, the other follows (strength: {abs(corr['correlation']):.0%}).",
            "type": "neutral",
        })

    if "r2_score" in regression:
        r2 = regression["r2_score"]
        quality = "very accurately" if r2 > 0.8 else "fairly well" if r2 > 0.6 else "with moderate success"
        key_takeaways.append({
            "title": f"We can predict {regression['target_column']}",
            "detail": f"Using the other columns, '{regression['target_column']}' can be predicted {quality}. The biggest factor is '{regression.get('top_predictor', 'unknown')}'.",
            "type": "positive" if r2 > 0.6 else "neutral",
        })

    if "accuracy" in classification:
        acc = classification["accuracy"]
        key_takeaways.append({
            "title": f"{classification['target_column']} categories identified",
            "detail": f"The system correctly classifies '{classification['target_column']}' {acc*100:.0f}% of the time, primarily based on '{classification.get('top_predictor', 'unknown')}'.",
            "type": "positive" if acc > 0.7 else "neutral",
        })

    for t in trends[:2]:
        key_takeaways.append({
            "title": f"{t['column']} is {t['direction']}",
            "detail": f"This shows a {abs(t['change_percentage']):.1f}% {'rise' if t['direction'] == 'increasing' else 'drop'} from the first half to the second half of the data.",
            "type": "positive" if t["direction"] == "increasing" else "warning",
        })

    if anomalies:
        a = anomalies[0]
        key_takeaways.append({
            "title": f"Unusual values in {a['column']}",
            "detail": f"Found {a['anomaly_count']} data points outside the normal range — could be errors or genuine outliers worth checking.",
            "type": "warning",
        })

    if "optimal_k" in clustering:
        k = clustering["optimal_k"]
        largest_pct = max((p["percentage"] for p in clustering.get("cluster_profiles", {}).values()), default=0)
        key_takeaways.append({
            "title": f"{k} distinct groups found",
            "detail": f"The data naturally splits into {k} clusters. The largest group holds {largest_pct:.0f}% of all records.",
            "type": "neutral",
        })

    # Pad to 5 takeaways minimum
    for col, stats in list(num_stats.items())[:max(0, 5 - len(key_takeaways))]:
        key_takeaways.append({
            "title": f"{col} varies widely",
            "detail": f"Ranges from {stats['min']:.2f} to {stats['max']:.2f} with an average of {stats['mean']:.2f}.",
            "type": "neutral",
        })

    # ── Data Quality ──
    data_quality = f"The dataset started with {rows:,} records. "
    if dup_removed > 0:
        data_quality += f"We removed {dup_removed:,} duplicate rows. "
    if total_missing > 0:
        data_quality += "Missing values were filled automatically — numbers got their average, and text fields got the most common value. "
    else:
        data_quality += "Great news: no missing values were found. "
    if outliers:
        data_quality += f"Outliers were spotted in {len(outliers)} columns but kept in, since they could be meaningful. "
    data_quality += "Overall, the data is clean and reliable."

    # ── Patterns ──
    patterns = ""
    if correlations:
        patterns = "Some interesting connections stand out. "
        for corr in correlations[:3]:
            if corr["direction"] == "positive":
                patterns += f"When '{corr['column_1']}' goes up, '{corr['column_2']}' tends to go up too. "
            else:
                patterns += f"'{corr['column_1']}' and '{corr['column_2']}' move in opposite directions — as one rises, the other falls. "
    skewed = [col for col, dist in distributions.items() if "skewed" in dist.get("shape", "")]
    if skewed:
        patterns += f"Some columns ({', '.join(skewed[:3])}) have lopsided distributions — most values cluster on one side."
    if not patterns:
        patterns = "No particularly strong relationships stood out between variables."

    # ── Segmentation ──
    segmentation = ""
    if "cluster_profiles" in clustering:
        k = clustering["optimal_k"]
        segmentation = f"The data naturally falls into {k} distinct groups. "
        for name, profile in clustering["cluster_profiles"].items():
            segmentation += f"{name} has {profile['size']} records ({profile['percentage']}% of total). "
        segmentation += "Each group has different characteristics that could represent different types of behavior or categories."
    else:
        segmentation = "No clear natural groupings were found in this dataset."

    # ── Predictive ──
    predictive = ""
    if "r2_score" in regression:
        r2 = regression["r2_score"]
        quality = "very reliably" if r2 > 0.8 else "fairly well" if r2 > 0.6 else "with some accuracy"
        predictive += f"We can predict '{regression['target_column']}' {quality} using the other columns. "
        if regression.get("feature_importance"):
            top3 = list(regression["feature_importance"].keys())[:3]
            predictive += f"The top factors are: {', '.join(top3)}. "
    if "accuracy" in classification:
        predictive += f"For classifying '{classification['target_column']}', the model gets it right {classification['accuracy']*100:.0f}% of the time. "
    if not predictive:
        predictive = "No strong predictive patterns were found for this dataset."

    # ── Anomalies ──
    anomaly_story = ""
    if anomalies:
        anomaly_story = f"We spotted unusual values in {len(anomalies)} columns. "
        for a in anomalies[:3]:
            anomaly_story += f"'{a['column']}' has {a['anomaly_count']} values outside the normal range. "
        anomaly_story += "These deserve a closer look — they could be data entry mistakes or genuinely exceptional cases."
    else:
        anomaly_story = "Nothing unusual stood out — the data looks consistent and well-behaved."

    # ── Action Items ──
    action_items = []
    if correlations:
        c = correlations[0]
        action_items.append({
            "action": f"Explore the link between {c['column_1']} and {c['column_2']}",
            "why": f"They have a {c['strength']} {c['direction']} relationship — changes in one may predict changes in the other.",
        })
    if anomalies:
        a = anomalies[0]
        action_items.append({
            "action": f"Review the {a['anomaly_count']} unusual values in '{a['column']}'",
            "why": "These outliers could be data errors or genuine exceptions that need attention.",
        })
    if trends:
        t = trends[0]
        action_items.append({
            "action": f"Monitor the {t['direction']} trend in '{t['column']}'",
            "why": f"A {abs(t['change_percentage']):.1f}% shift could signal something important.",
        })
    if "r2_score" in regression and regression["r2_score"] > 0.6:
        action_items.append({
            "action": f"Use '{regression.get('top_predictor')}' to forecast '{regression['target_column']}'",
            "why": f"The prediction model is reliable (accuracy: {regression['r2_score']:.0%}).",
        })
    if not action_items:
        action_items = [
            {"action": "Collect more data to strengthen the analysis", "why": "Larger datasets produce more reliable insights."},
            {"action": "Set up dashboards to track key metrics over time", "why": "Regular monitoring catches trends early."},
            {"action": "Share these findings with your team", "why": "Data-driven decisions work best when everyone is aligned."},
        ]

    # ── Full Narrative ──
    narrative = the_big_picture + "\n\n"
    narrative += "Looking deeper into the numbers, "
    if patterns and "No particularly" not in patterns:
        narrative += patterns.lower()
    else:
        narrative += "the variables appear to behave independently of each other. "
    if segmentation and "No clear" not in segmentation:
        narrative += segmentation
    if predictive and "No strong" not in predictive:
        narrative += predictive
    narrative += "\n\n"
    narrative += "Based on this analysis, the most important next steps are: "
    for ai in action_items[:3]:
        narrative += f"{ai['action'].lower()} (because {ai['why'].lower().rstrip('.')}). "

    story = {
        "headline": headline,
        "one_liner": one_liner,
        "the_big_picture": the_big_picture,
        "key_takeaways": key_takeaways[:7],
        "data_quality_story": data_quality,
        "patterns_and_relationships": patterns,
        "segmentation_insights": segmentation,
        "predictive_insights": predictive,
        "anomalies_and_concerns": anomaly_story,
        "action_items": action_items[:5],
        "story_narrative": narrative,
        "generated_by": "rule_based",
    }
    return _add_compat_fields(story)


def chat_with_data(
    question: str,
    data_overview: Dict,
    eda_results: Dict,
    ml_results: Dict,
    story: Dict,
) -> str:
    """
    Answer user questions about the dataset using LLM with data context.
    Falls back to rule-based if LLM is unavailable.
    """
    model = _get_model()

    # Build compact context
    context = _truncate_for_context({
        "overview": {
            "rows": data_overview.get("rows"),
            "columns": data_overview.get("columns"),
            "column_names": data_overview.get("column_names"),
        },
        "statistics": eda_results.get("summary_statistics", {}),
        "correlations": eda_results.get("correlation", {}).get("strong_correlations", [])[:10],
        "ml_regression": {k: v for k, v in ml_results.get("regression", {}).items() if k != "sample_predictions"},
        "ml_classification": {k: v for k, v in ml_results.get("classification", {}).items() if k != "classification_report"},
        "trends": ml_results.get("trends", [])[:5],
        "anomalies": ml_results.get("anomalies", [])[:5],
        "key_findings": story.get("key_findings", []),
    }, max_length=6000)

    if model:
        try:
            prompt = f"""You are a helpful data analyst assistant. The user has uploaded a dataset and wants to understand it better.

DATASET CONTEXT:
{context}

USER QUESTION: {question}

RULES:
1. Answer ONLY based on the data context provided. Do NOT make up statistics.
2. If the answer cannot be determined from the data, say so clearly.
3. Use simple, non-technical language.
4. Be concise but thorough.
5. Reference specific column names and values when possible.

Answer:"""

            response = model.generate_content(
                prompt,
                generation_config=genai.types.GenerationConfig(
                    temperature=0.2,
                    max_output_tokens=1024,
                ),
            )
            return response.text.strip()
        except Exception as e:
            return _rule_based_chat(question, data_overview, eda_results, ml_results)
    else:
        return _rule_based_chat(question, data_overview, eda_results, ml_results)


def _rule_based_chat(question: str, data_overview: Dict, eda_results: Dict, ml_results: Dict) -> str:
    """Simple rule-based chat responses when LLM is unavailable."""
    q = question.lower()

    # Check for common patterns
    if any(w in q for w in ["feature", "important", "affect", "impact", "influence", "predict"]):
        for model_type in ["regression", "classification"]:
            result = ml_results.get(model_type, {})
            if "feature_importance" in result:
                features = list(result["feature_importance"].items())[:5]
                target = result.get("target_column", "the target")
                response = f"Based on the analysis, the most important features affecting '{target}' are:\n\n"
                for i, (feat, imp) in enumerate(features, 1):
                    response += f"{i}. **{feat}** (importance: {imp:.4f})\n"
                return response

    if any(w in q for w in ["correlation", "relationship", "related", "connected"]):
        correlations = eda_results.get("correlation", {}).get("strong_correlations", [])
        if correlations:
            response = "Here are the strongest relationships found in the data:\n\n"
            for c in correlations[:5]:
                direction = "increases" if c["direction"] == "positive" else "decreases"
                response += f"• **{c['column_1']}** and **{c['column_2']}**: When one {direction}, the other tends to as well (r={c['correlation']:.2f})\n"
            return response

    if any(w in q for w in ["trend", "increasing", "decreasing", "growing", "declining", "dropping"]):
        trends = ml_results.get("trends", [])
        if trends:
            response = "Here are the trends detected in the data:\n\n"
            for t in trends[:5]:
                response += f"• **{t['column']}**: {t['direction']} by {abs(t['change_percentage']):.1f}%\n"
            return response

    if any(w in q for w in ["outlier", "anomaly", "unusual", "abnormal"]):
        anomalies = ml_results.get("anomalies", [])
        if anomalies:
            response = "Anomalies detected in the data:\n\n"
            for a in anomalies[:5]:
                response += f"• **{a['column']}**: {a['anomaly_count']} unusual values ({a['anomaly_percentage']}% of data)\n"
            return response

    if any(w in q for w in ["summary", "overview", "describe", "about"]):
        return (
            f"This dataset contains **{data_overview.get('rows', 0):,} rows** and "
            f"**{data_overview.get('columns', 0)} columns**. "
            f"Columns include: {', '.join(data_overview.get('column_names', [])[:10])}. "
            f"There are {sum(1 for v in data_overview.get('missing_values', {}).values() if v > 0)} "
            f"columns with missing values."
        )

    return (
        "I can help you understand your data! Try asking about:\n"
        "• **Feature importance** — What features affect the target most?\n"
        "• **Correlations** — Which variables are related?\n"
        "• **Trends** — Are values increasing or decreasing?\n"
        "• **Anomalies** — Are there unusual values?\n"
        "• **Summary** — Give me an overview of the data\n\n"
        "*Note: For more detailed answers, configure a Gemini API key in the .env file.*"
    )
