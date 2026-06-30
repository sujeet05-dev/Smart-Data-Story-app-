"""
Smart Data Storytelling Tool - FastAPI Main Application
-------------------------------------------------------
REST API endpoints for authentication, data upload, analysis,
visualization, story generation, chat, PDF export, and history.
"""

import uuid
import os
import traceback
from datetime import datetime
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Dict, Any, Optional

from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.config import (
    UPLOAD_DIR, REPORTS_DIR, CHARTS_DIR, CORS_ORIGINS, MAX_FILE_SIZE_MB,
)
from app.database import get_db, create_tables, User, AnalysisSession
from app.auth import (
    get_current_user, hash_password, verify_password, create_access_token,
    UserCreate, UserLogin, UserResponse, TokenResponse,
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

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Create database tables on startup."""
    create_tables()
    yield

app = FastAPI(
    title="Smart Data Storytelling Tool",
    description="Transform raw datasets into meaningful insights, visualizations, and human-readable stories.",
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


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
# Helper — get a session owned by the current user
# ============================================================

def _get_user_session(
    session_id: str,
    user: User,
    db: Session,
) -> AnalysisSession:
    """Fetch an AnalysisSession that belongs to the given user. Raises 404 if not found."""
    session = (
        db.query(AnalysisSession)
        .filter(AnalysisSession.session_id == session_id, AnalysisSession.user_id == user.id)
        .first()
    )
    if not session:
        raise HTTPException(status_code=404, detail="Session not found. Please upload a dataset first.")
    return session


# ============================================================
# Health Check (public)
# ============================================================

@app.get("/")
async def root():
    return {
        "message": "Smart Data Storytelling Tool API",
        "version": "2.0.0",
        "status": "running",
        "docs": "/docs",
    }


@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}


# ============================================================
# Authentication Endpoints (public)
# ============================================================

@app.post("/api/auth/signup", response_model=TokenResponse)
async def signup(data: UserCreate, db: Session = Depends(get_db)):
    """Register a new user account."""
    # Check if username exists
    if db.query(User).filter(User.username == data.username).first():
        raise HTTPException(status_code=409, detail="Username already taken.")
    # Check if email exists
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(status_code=409, detail="Email already registered.")

    user = User(
        username=data.username,
        email=data.email,
        hashed_password=hash_password(data.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(user.id, user.username)
    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=user.id,
            username=user.username,
            email=user.email,
            created_at=user.created_at.isoformat() if user.created_at else None,
        ),
    )


@app.post("/api/auth/login", response_model=TokenResponse)
async def login(data: UserLogin, db: Session = Depends(get_db)):
    """Authenticate and receive a JWT token."""
    user = db.query(User).filter(User.username == data.username).first()
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid username or password.")

    token = create_access_token(user.id, user.username)
    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=user.id,
            username=user.username,
            email=user.email,
            created_at=user.created_at.isoformat() if user.created_at else None,
        ),
    )


@app.get("/api/auth/me", response_model=UserResponse)
async def get_me(user: User = Depends(get_current_user)):
    """Get the current authenticated user's profile."""
    return UserResponse(
        id=user.id,
        username=user.username,
        email=user.email,
        created_at=user.created_at.isoformat() if user.created_at else None,
    )


# ============================================================
# File Upload & Analysis Pipeline (protected)
# ============================================================

@app.post("/api/upload")
async def upload_and_analyze(
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Upload a CSV/Excel file and run the complete analysis pipeline.
    Results are persisted to the database for this user.
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

        # Step 7: Persist to database
        db_session = AnalysisSession(
            session_id=session_id,
            user_id=user.id,
            filename=file.filename,
            report_title=report_title,
            domain=domain,
        )
        db_session.data_overview = data_overview
        db_session.preprocessing_report = preprocessing_report
        db_session.eda_results = eda_results
        db_session.ml_results = ml_results
        db_session.charts = charts
        db_session.story = story
        db_session.chat_history = []

        db.add(db_session)
        db.commit()

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
# Session Data Retrieval (protected)
# ============================================================

@app.get("/api/session/{session_id}")
async def get_session(
    session_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve stored analysis results for a session."""
    session = _get_user_session(session_id, user, db)
    return JSONResponse(content=session.to_full_dict())


@app.get("/api/sessions")
async def list_sessions(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List all analysis sessions for the current user."""
    sessions = (
        db.query(AnalysisSession)
        .filter(AnalysisSession.user_id == user.id)
        .order_by(AnalysisSession.created_at.desc())
        .all()
    )
    return JSONResponse(content={
        "sessions": [s.to_summary_dict() for s in sessions]
    })


# ============================================================
# History Endpoints (protected)
# ============================================================

@app.get("/api/history")
async def get_history(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get the full analysis history for the logged-in user."""
    sessions = (
        db.query(AnalysisSession)
        .filter(AnalysisSession.user_id == user.id)
        .order_by(AnalysisSession.created_at.desc())
        .all()
    )
    return JSONResponse(content={
        "history": [s.to_summary_dict() for s in sessions]
    })


@app.delete("/api/session/{session_id}")
async def delete_session(
    session_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a specific analysis session from the user's history."""
    session = _get_user_session(session_id, user, db)
    db.delete(session)
    db.commit()
    return JSONResponse(content={"detail": "Session deleted successfully."})


# ============================================================
# Chat Endpoint (protected)
# ============================================================

@app.post("/api/chat")
async def chat(
    request: ChatRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Chat with the data using natural language questions."""
    session = _get_user_session(request.session_id, user, db)

    answer = chat_with_data(
        question=request.question,
        data_overview=session.data_overview,
        eda_results=session.eda_results,
        ml_results=session.ml_results,
        story=session.story,
    )

    # Persist chat history
    history = session.chat_history
    history.append({
        "question": request.question,
        "answer": answer,
        "timestamp": datetime.now().isoformat(),
    })
    session.chat_history = history
    db.commit()

    return ChatResponse(answer=answer, session_id=request.session_id)


# ============================================================
# PDF Export (protected)
# ============================================================

@app.get("/api/export/pdf/{session_id}")
async def export_pdf(
    session_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Generate and download a PDF report for the session."""
    session = _get_user_session(session_id, user, db)

    try:
        pdf_path = generate_pdf_report(
            title=session.report_title,
            story=session.story,
            data_overview=session.data_overview,
            preprocessing_report=session.preprocessing_report,
            session_id=session_id,
        )

        filename = f"{session.report_title.replace(' ', '_')}.pdf"
        return FileResponse(
            path=pdf_path,
            media_type="application/pdf",
            filename=filename,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF generation failed: {str(e)}")


# ============================================================
# Charts endpoint (protected)
# ============================================================

@app.get("/api/charts/{session_id}")
async def get_charts(
    session_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get all generated charts for a session."""
    session = _get_user_session(session_id, user, db)
    return JSONResponse(content={"charts": session.charts})


# ============================================================
# Story refresh endpoint (protected)
# ============================================================

@app.post("/api/story/refresh/{session_id}")
async def refresh_story(
    session_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Re-generate the data story (useful to retry with LLM)."""
    session = _get_user_session(session_id, user, db)

    story = generate_story(
        session.data_overview,
        session.eda_results,
        session.ml_results,
        session.preprocessing_report,
        session.domain,
    )

    session.story = story
    db.commit()
    return JSONResponse(content={"story": story})
