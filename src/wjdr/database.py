"""Database configuration for SQLModel persistence layer."""

from __future__ import annotations

import os
from collections.abc import Generator
from contextlib import contextmanager

from sqlmodel import Session, SQLModel, create_engine

DEFAULT_DATABASE_URL = "postgresql+psycopg://postgres:postgres@localhost:5432/wjdr"

DATABASE_URL = os.getenv("DATABASE_URL", DEFAULT_DATABASE_URL)

# Keep one shared engine for the whole application.
engine = create_engine(DATABASE_URL, echo=False)

# TODO: Use Alembic to manage migrations instead of creating tables directly from the models.
def create_db_and_tables() -> None:
    """Create all SQLModel tables.

    This helper is intended for local/dev bootstrap. In production,
    Alembic migrations should be used.
    """
    from wjdr import models  # noqa: F401

    SQLModel.metadata.create_all(engine)


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
