"""
Smart Data Storytelling Tool - FastAPI Main Application
-------------------------------------------------------
REST API endpoints for data upload, analysis, visualization,
story generation, chat, and PDF export.
"""

import uuid
import os
import json
import traceback
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, Optional

from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from app.config import (
    UPLOAD_DIR, REPORTS_DIR, CHARTS_DIR, CORS_ORIGINS, MAX_FILE_SIZE_MB,
)
from app.data_ingestion import validate_file, read_dataset, get_data_overview, detect_column_types
from app.preprocessing import preprocess_pipeline
from app.eda import run_eda
from app.ml_insights import run_ml_analysis
from app.visualizations import generate_all_charts
from app.storytelling import (
    detect_dataset_domain, generate_report_title, generate_story, chat_with_data,
)
from app.report_generator import generate_pdf_report


# ============================================================
# App Initialization
# ============================================================

app = FastAPI(
    title="Smart Data Storytelling Tool",
    description="Transform raw datasets into meaningful insights, visualizations, and human-readable stories.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory session storage (for production, use Redis/DB)
sessions: Dict[str, Dict[str, Any]] = {}


# ============================================================
# Request / Response Models
# ============================================================

class ChatRequest(BaseModel):
    session_id: str
    question: str

class ChatResponse(BaseModel):
    answer: str
    session_id: str


# ============================================================
# Health Check
# ============================================================

@app.get("/")
async def root():
    return {
        "message": "Smart Data Storytelling Tool API",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
    }


@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}


# ============================================================
# File Upload & Analysis Pipeline
# ============================================================

@app.post("/api/upload")
async def upload_and_analyze(file: UploadFile = File(...)):
    """
    Upload a CSV/Excel file and run the complete analysis pipeline.
    Returns session_id and all analysis results.
    """
    # Validate file
    content = await file.read()
    file_size = len(content)
    is_valid, message = validate_file(file.filename, file_size, MAX_FILE_SIZE_MB)
    if not is_valid:
        raise HTTPException(status_code=400, detail=message)

    # Generate session ID
    session_id = str(uuid.uuid4())[:8]

    # Save file
    file_path = str(UPLOAD_DIR / f"{session_id}_{file.filename}")
    with open(file_path, "wb") as f:
        f.write(content)

    try:
        # Step 1: Read dataset
        df = read_dataset(file_path)
        if df.empty:
            raise HTTPException(status_code=400, detail="The uploaded file is empty or contains no readable data.")

        data_overview = get_data_overview(df)

        # Step 2: Preprocess
        df_clean, preprocessing_report = preprocess_pipeline(df)

        # Step 3: Run EDA
        eda_results = run_eda(df_clean)

        # Step 4: Run ML Analysis
        ml_results = run_ml_analysis(df_clean)

        # Step 5: Generate Charts
        charts = generate_all_charts(df_clean, eda_results, ml_results)

        # Step 6: Detect domain and generate story
        domain = detect_dataset_domain(data_overview)
        report_title = generate_report_title(domain, data_overview)
        story = generate_story(data_overview, eda_results, ml_results, preprocessing_report, domain)

        # Store session
        sessions[session_id] = {
            "session_id": session_id,
            "filename": file.filename,
            "file_path": file_path,
            "created_at": datetime.now().isoformat(),
            "data_overview": data_overview,
            "preprocessing_report": preprocessing_report,
            "eda_results": eda_results,
            "ml_results": ml_results,
            "charts": charts,
            "domain": domain,
            "report_title": report_title,
            "story": story,
            "chat_history": [],
        }

        return JSONResponse(content={
            "session_id": session_id,
            "filename": file.filename,
            "report_title": report_title,
            "domain": domain,
            "data_overview": data_overview,
            "preprocessing_report": preprocessing_report,
            "eda_results": eda_results,
            "ml_results": ml_results,
            "charts": charts,
            "story": story,
        })

    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


# ============================================================
# Session Data Retrieval
# ============================================================

@app.get("/api/session/{session_id}")
async def get_session(session_id: str):
    """Retrieve stored analysis results for a session."""
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found. Please upload a dataset first.")

    session = sessions[session_id]
    return JSONResponse(content={
        "session_id": session_id,
        "filename": session["filename"],
        "report_title": session["report_title"],
        "domain": session["domain"],
        "data_overview": session["data_overview"],
        "preprocessing_report": session["preprocessing_report"],
        "eda_results": session["eda_results"],
        "ml_results": session["ml_results"],
        "charts": session["charts"],
        "story": session["story"],
        "chat_history": session["chat_history"],
    })


@app.get("/api/sessions")
async def list_sessions():
    """List all available sessions."""
    return JSONResponse(content={
        "sessions": [
            {
                "session_id": sid,
                "filename": s["filename"],
                "report_title": s["report_title"],
                "domain": s["domain"],
                "created_at": s["created_at"],
                "rows": s["data_overview"]["rows"],
                "columns": s["data_overview"]["columns"],
            }
            for sid, s in sessions.items()
        ]
    })


# ============================================================
# Chat Endpoint
# ============================================================

@app.post("/api/chat")
async def chat(request: ChatRequest):
    """Chat with the data using natural language questions."""
    if request.session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found. Please upload a dataset first.")

    session = sessions[request.session_id]

    answer = chat_with_data(
        question=request.question,
        data_overview=session["data_overview"],
        eda_results=session["eda_results"],
        ml_results=session["ml_results"],
        story=session["story"],
    )

    # Store chat history
    session["chat_history"].append({
        "question": request.question,
        "answer": answer,
        "timestamp": datetime.now().isoformat(),
    })

    return ChatResponse(answer=answer, session_id=request.session_id)


# ============================================================
# PDF Export
# ============================================================

@app.get("/api/export/pdf/{session_id}")
async def export_pdf(session_id: str):
    """Generate and download a PDF report for the session."""
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found.")

    session = sessions[session_id]

    try:
        pdf_path = generate_pdf_report(
            title=session["report_title"],
            story=session["story"],
            data_overview=session["data_overview"],
            preprocessing_report=session["preprocessing_report"],
            session_id=session_id,
        )

        filename = f"{session['report_title'].replace(' ', '_')}.pdf"
        return FileResponse(
            path=pdf_path,
            media_type="application/pdf",
            filename=filename,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF generation failed: {str(e)}")


# ============================================================
# Charts endpoint
# ============================================================

@app.get("/api/charts/{session_id}")
async def get_charts(session_id: str):
    """Get all generated charts for a session."""
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found.")

    return JSONResponse(content={"charts": sessions[session_id]["charts"]})


# ============================================================
# Story refresh endpoint
# ============================================================

@app.post("/api/story/refresh/{session_id}")
async def refresh_story(session_id: str):
    """Re-generate the data story (useful to retry with LLM)."""
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found.")

    session = sessions[session_id]

    story = generate_story(
        session["data_overview"],
        session["eda_results"],
        session["ml_results"],
        session["preprocessing_report"],
        session["domain"],
    )

    session["story"] = story
    return JSONResponse(content={"story": story})
