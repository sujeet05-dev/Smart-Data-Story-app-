# 🧠 Smart Data Storytelling Tool

> Transform raw datasets into meaningful insights, interactive visualizations, and human-readable stories using Machine Learning and Generative AI.

![Python](https://img.shields.io/badge/Python-3.10+-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-green)
![React](https://img.shields.io/badge/React-19-blue)
![Tailwind](https://img.shields.io/badge/TailwindCSS-4-purple)
![License](https://img.shields.io/badge/license-MIT-gray)

---

## 🎯 What It Does

Upload a CSV or Excel file and the system will:

1. **Clean & Preprocess** — Handle missing values, duplicates, outliers automatically
2. **Automated EDA** — Summary statistics, correlation analysis, distribution profiling
3. **ML Insights** — K-Means clustering, regression, classification, trend & anomaly detection
4. **Interactive Visualizations** — Plotly charts: histograms, heatmaps, scatter, bar, box, line
5. **AI Story Generation** — LLM-powered (Google Gemini) human-readable narratives
6. **Chat with Data** — Ask natural-language questions and get data-grounded answers
7. **PDF Report Export** — Download a professional analysis report

---

## 🏗️ Architecture

```
┌─────────────────┐     ┌──────────────────────────────────────┐
│   React + Vite  │────▶│           FastAPI Backend             │
│   Tailwind CSS  │◀────│                                      │
│   Plotly Charts │     │  ┌──────────┐  ┌──────────────────┐  │
└─────────────────┘     │  │ Pandas   │  │  Scikit-learn     │  │
                        │  │ NumPy    │  │  (Clustering,     │  │
                        │  │ SciPy    │  │   Regression,     │  │
                        │  └──────────┘  │   Classification) │  │
                        │                └──────────────────┘  │
                        │  ┌──────────────────────────────────┐│
                        │  │ Google Gemini API (Storytelling)  ││
                        │  │ Rule-based fallback if no API key ││
                        │  └──────────────────────────────────┘│
                        └──────────────────────────────────────┘
```

---

## 📂 Project Structure

```
Smart Data Storytelling Tool/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── config.py            # Configuration & environment
│   │   ├── data_ingestion.py    # File reading & column detection
│   │   ├── preprocessing.py     # Cleaning, outlier detection
│   │   ├── eda.py               # Automated EDA pipeline
│   │   ├── ml_insights.py       # ML analysis (clustering, regression, etc.)
│   │   ├── visualizations.py    # Plotly chart generation
│   │   ├── storytelling.py      # LLM integration & story generation
│   │   ├── report_generator.py  # PDF report creation
│   │   └── main.py              # FastAPI application & REST endpoints
│   ├── sample_data/
│   │   └── sample_sales_data.csv
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── FileUpload.jsx
│   │   │   ├── DashboardOverview.jsx
│   │   │   ├── ChartsPanel.jsx
│   │   │   ├── InsightsPanel.jsx
│   │   │   └── ChatInterface.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
└── README.md
```

---

## 🚀 Setup Instructions

### Prerequisites

- **Python 3.10+** installed
- **Node.js 18+** and npm installed
- (Optional) **Google Gemini API Key** for AI-powered storytelling

### Step 1: Backend Setup

```bash
# Navigate to backend
cd backend

# Create and activate virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux

# Install Python dependencies
pip install -r requirements.txt

# Configure environment (optional - for Gemini AI features)
copy .env.example .env
# Edit .env and add your GEMINI_API_KEY
```

### Step 2: Frontend Setup

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install
```

### Step 3: Run the Application

**Terminal 1 — Start Backend:**
```bash
cd backend
venv\Scripts\activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 2 — Start Frontend:**
```bash
cd frontend
npm run dev
```

### Step 4: Open the App

Open your browser and navigate to: **http://localhost:5173**

---

## 🔑 API Key Setup (Optional but Recommended)

For AI-powered storytelling and chat features, configure a Google Gemini API key:

1. Visit [Google AI Studio](https://aistudio.google.com/apikey)
2. Create a new API key
3. Add it to `backend/.env`:
   ```
   GEMINI_API_KEY=your_key_here
   ```

> **Note:** The tool works without an API key! It uses an intelligent rule-based fallback that generates insights from the statistical and ML analysis results.

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/upload` | Upload CSV/Excel and run full analysis |
| `GET` | `/api/session/{id}` | Retrieve session analysis results |
| `GET` | `/api/sessions` | List all analysis sessions |
| `POST` | `/api/chat` | Ask questions about the dataset |
| `GET` | `/api/export/pdf/{id}` | Download PDF report |
| `GET` | `/api/charts/{id}` | Get all charts for a session |
| `POST` | `/api/story/refresh/{id}` | Regenerate the AI story |

---

## 🧪 Testing with Sample Data

A sample retail sales dataset is included at `backend/sample_data/sample_sales_data.csv`. Upload it through the UI to see all features in action.

The sample dataset includes: Date, Region, Product Category, Revenue, Profit, Customer Demographics, Ratings, and more.

---

## 🔒 Edge Case Handling

- **Empty datasets** → Clear error message
- **Large files** → Auto-sampled to 500K rows for performance
- **Missing values** → Auto-imputed (mean/median/mode)
- **Incorrect formats** → Encoding detection with fallback
- **Imbalanced data** → Stratified ML splitting
- **No numeric columns** → Graceful degradation of charts/ML

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Tailwind CSS 4, Plotly.js, Lucide Icons |
| Backend | Python, FastAPI, Uvicorn |
| Data/ML | Pandas, NumPy, Scikit-learn, SciPy |
| Visualization | Plotly (interactive), Seaborn/Matplotlib |
| AI/LLM | Google Gemini API (with rule-based fallback) |
| PDF Export | FPDF2 |

---

## 📄 License

MIT License — feel free to use, modify, and distribute.
