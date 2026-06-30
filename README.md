# 🧠 Smart Data Storytelling Tool

> Transform raw datasets into meaningful insights, interactive visualizations, and human-readable stories using Machine Learning, Auto-EDA, and Generative AI.

![Python](https://img.shields.io/badge/Python-3.10+-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-green)
![React](https://img.shields.io/badge/React-19-blue)
![Tailwind](https://img.shields.io/badge/TailwindCSS-4-purple)
![License](https://img.shields.io/badge/license-MIT-gray)

---

## 🎯 What It Does

Upload a CSV or Excel file and the system will:

1. **Clean & Preprocess** — Automatically trim strings, delete duplicate rows, scan for outliers, and handle missing values with smart mean/median/mode imputations.
2. **Automated EDA** — Calculate summary statistics, variance, and detect skewness/distributions.
3. **ML Insights** — Cluster data points using K-Means and fit predictive trend-lines using Linear Regression.
4. **Interactive Visualizations** — Generate responsive Plotly charts (histograms, scatter plots, correlation heatmaps) that integrate seamlessly into the dark UI.
5. **AI Storytelling** — Deliver a structured insights report (headline, takeaways, segment breakdowns, predictive formulas, and action plan) powered by Google Gemini (with rule-based fallbacks).
6. **Chat with Data** — Query statistics, trends, and models in natural language using the conversational data console.
7. **PDF Report Export** — Generate and download a professional PDF report containing the data story.
8. **Persistent History** — Secure login/registration that persists your analyzed datasets in an SQLite database.

---

## 🏗️ Architecture

```
┌─────────────────────────┐     ┌──────────────────────────────────────────────┐
│       React + Vite      │     │               FastAPI Backend                │
│      Tailwind CSS 4     │────▶│                                              │
│     WebGL waves bg      │◀────│       ┌─────────────────┐  ┌──────────────┐  │
│  Plotly.js (Responsive) │     │       │ SQLAlchemy (DB) │  │  FPDF2 (PDF) │  │
└─────────────────────────┘     │       └─────────────────┘  └──────────────┘  │
                                │  ┌───────────────┐        ┌───────────────┐  │
                                │  │ Pandas/NumPy  │        │ Scikit-learn  │  │
                                │  └───────────────┘        └───────────────┘  │
                                │  ┌────────────────────────────────────────┐  │
                                │  │   Google Gemini API (Storytelling)     │  │
                                │  │   (Rule-based fallback if no key)      │  │
                                │  └────────────────────────────────────────┘  │
                                └──────────────────────────────────────────────┘
```

---

## 📂 Project Structure

```
Smart Data Storytelling Tool/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── auth.py              # JWT authentication logic
│   │   ├── database.py          # SQLAlchemy models (User, AnalysisSession)
│   │   ├── config.py            # App settings, DB path, Gemini variables
│   │   ├── data_ingestion.py    # File validator & dataset parser
│   │   ├── preprocessing.py     # Clean pipe, duplicates, outlier IQR
│   │   ├── eda.py               # Summary stats & distributions
│   │   ├── ml_insights.py       # K-Means & linear regression models
│   │   ├── visualizations.py    # Plotly figures generator (JSON)
│   │   ├── storytelling.py      # Gemini prompts, JSON extractor, fallbacks
│   │   ├── report_generator.py  # FPDF2 dynamic report compiler
│   │   └── main.py              # FastAPI routers & CORS endpoints
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Login.jsx        # SignUp/SignIn forms + WebGL wave shader
│   │   │   ├── Upload.jsx       # Drag/drop dropzone + preprocessing loaders
│   │   │   ├── Dashboard.jsx    # Overview, charts, story, ML, chat, & history panels
│   │   │   └── PlotlyChart.jsx  # Responsive Plotly container
│   │   ├── services/
│   │   │   └── api.js           # Axios router (automatic JWT headers)
│   │   ├── App.jsx              # Routing controller & auth lifecycle
│   │   ├── main.jsx             # React entry mounting
│   │   └── index.css            # Tailwind 4 directives & custom scrollbars
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
- (Optional) **Google Gemini API Key** (Get from [Google AI Studio](https://aistudio.google.com/apikey))

### Step 1: Backend Setup
1. Open a terminal and navigate to backend folder:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   venv\Scripts\activate        # On Windows powershell
   # source venv/bin/activate   # On macOS/Linux
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Configure environment parameters:
   ```bash
   copy .env.example .env
   # Open .env and add your GEMINI_API_KEY
   ```

### Step 2: Frontend Setup
1. Open another terminal in the root directory and navigate to frontend folder:
   ```bash
   cd frontend
   ```
2. Install node dependencies:
   ```bash
   npm install
   ```

### Step 3: Run the Application

**Terminal 1 — Run Backend Server:**
```bash
cd backend
venv\Scripts\activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 2 — Run Frontend Client:**
```bash
cd frontend
npm run dev
```

**Step 4: Launch App**
Open your browser and navigate to: **http://localhost:5173**

---

## 📡 API Endpoints Reference

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/api/auth/signup` | Register a new account | No |
| `POST` | `/api/auth/login` | Login and acquire JWT | No |
| `GET` | `/api/auth/me` | Fetch active user credentials | Yes |
| `POST` | `/api/upload` | Upload CSV/Excel and run clean/EDA/ML | Yes |
| `GET` | `/api/session/{id}` | Get completed analysis data | Yes |
| `GET` | `/api/sessions` | Fetch lists of past sessions | Yes |
| `GET` | `/api/history` | Identical to sessions list | Yes |
| `DELETE` | `/api/session/{id}` | Delete analysis session from DB | Yes |
| `POST` | `/api/chat` | Chat with data using LLM contexts | Yes |
| `GET` | `/api/export/pdf/{id}` | Download generated report PDF | Yes |
| `POST` | `/api/story/refresh/{id}`| Force-regenerate AI narrative | Yes |

---

## 🧪 Try it with Sample Data
A retail sample dataset is placed under `backend/sample_data/sample_sales_data.csv`. Stage it into the upload field to inspect the cleaning logs, regression trends, and segmentation models!
