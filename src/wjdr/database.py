"""Database configuration for SQLModel persistence layer."""

from __future__ import annotations

import os
from collections.abc import Generator
from contextlib import contextmanager
from pathlib import Path

from sqlmodel import Session, create_engine

from alembic import command
from alembic.config import Config

DEFAULT_DATABASE_URL = "postgresql+psycopg://postgres:postgres@localhost:5432/wjdr"

DATABASE_URL = os.getenv("DATABASE_URL", DEFAULT_DATABASE_URL)

# Keep one shared engine for the whole application.
engine = create_engine(DATABASE_URL, echo=False)


def _get_alembic_config() -> Config:
    """Build an Alembic configuration bound to the current database URL."""
    config = Config(str(Path(__file__).resolve().parents[2] / "alembic.ini"))
    config.set_main_option("sqlalchemy.url", DATABASE_URL)
    return config


def create_db_and_tables() -> None:
    """Apply all Alembic migrations up to the latest revision."""
    command.upgrade(_get_alembic_config(), "head")


@contextmanager
def get_session() -> Generator[Session, None, None]:
    """Yield a SQLModel session with commit/rollback handling."""
    with Session(engine) as session:
        try:
            yield session
            session.commit()
        except Exception:
            session.rollback()
            raise
