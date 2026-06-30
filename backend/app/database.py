"""
Database Module
---------------
SQLAlchemy models and session management for user accounts
and persistent analysis history.
"""

import json
from datetime import datetime, timezone
from typing import Generator

from sqlalchemy import (
    create_engine, Column, Integer, String, Text, DateTime, ForeignKey,
)
from sqlalchemy.orm import declarative_base, sessionmaker, relationship, Session

from app.config import DATABASE_URL

# ---------------------------------------------------------------------------
# Engine & Session
# ---------------------------------------------------------------------------
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},  # needed for SQLite
    echo=False,
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency — yields a DB session, closes after request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_tables():
    """Create all tables if they don't exist."""
    Base.metadata.create_all(bind=engine)


# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationship
    sessions = relationship("AnalysisSession", back_populates="user", cascade="all, delete-orphan")


class AnalysisSession(Base):
    __tablename__ = "analysis_sessions"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(8), unique=True, nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    filename = Column(String(255), nullable=False)
    report_title = Column(String(255), default="Data Analysis Report")
    domain = Column(String(50), default="general")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Large JSON payloads stored as text
    data_overview_json = Column(Text, default="{}")
    preprocessing_report_json = Column(Text, default="{}")
    eda_results_json = Column(Text, default="{}")
    ml_results_json = Column(Text, default="{}")
    charts_json = Column(Text, default="[]")
    story_json = Column(Text, default="{}")
    chat_history_json = Column(Text, default="[]")

    # Relationship
    user = relationship("User", back_populates="sessions")

    # --- JSON helpers ---
    def _get_json(self, field: str):
        raw = getattr(self, field, None)
        if raw:
            try:
                return json.loads(raw)
            except (json.JSONDecodeError, TypeError):
                return {} if field.endswith("_json") and not field.startswith("chat") and not field.startswith("charts") else []
        return {} if not field.startswith("chat") and not field.startswith("charts") else []

    def _set_json(self, field: str, value):
        setattr(self, field, json.dumps(value, default=str))

    @property
    def data_overview(self):
        return self._get_json("data_overview_json")

    @data_overview.setter
    def data_overview(self, value):
        self._set_json("data_overview_json", value)

    @property
    def preprocessing_report(self):
        return self._get_json("preprocessing_report_json")

    @preprocessing_report.setter
    def preprocessing_report(self, value):
        self._set_json("preprocessing_report_json", value)

    @property
    def eda_results(self):
        return self._get_json("eda_results_json")

    @eda_results.setter
    def eda_results(self, value):
        self._set_json("eda_results_json", value)

    @property
    def ml_results(self):
        return self._get_json("ml_results_json")

    @ml_results.setter
    def ml_results(self, value):
        self._set_json("ml_results_json", value)

    @property
    def charts(self):
        return self._get_json("charts_json")

    @charts.setter
    def charts(self, value):
        self._set_json("charts_json", value)

    @property
    def story(self):
        return self._get_json("story_json")

    @story.setter
    def story(self, value):
        self._set_json("story_json", value)

    @property
    def chat_history(self):
        return self._get_json("chat_history_json")

    @chat_history.setter
    def chat_history(self, value):
        self._set_json("chat_history_json", value)

    def to_full_dict(self):
        """Return the full session data as a dict (for API responses)."""
        return {
            "session_id": self.session_id,
            "filename": self.filename,
            "report_title": self.report_title,
            "domain": self.domain,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "data_overview": self.data_overview,
            "preprocessing_report": self.preprocessing_report,
            "eda_results": self.eda_results,
            "ml_results": self.ml_results,
            "charts": self.charts,
            "story": self.story,
            "chat_history": self.chat_history,
        }

    def to_summary_dict(self):
        """Return a lightweight summary (for history listing)."""
        overview = self.data_overview
        return {
            "session_id": self.session_id,
            "filename": self.filename,
            "report_title": self.report_title,
            "domain": self.domain,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "rows": overview.get("rows", 0),
            "columns": overview.get("columns", 0),
        }
