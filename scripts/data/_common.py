"""Shared bootstrap for the data scripts: paths, environment, logging and Supabase client."""

import logging
import os
from pathlib import Path

import dotenv
from supabase import Client, create_client

REPO_ROOT = Path(__file__).resolve().parents[2]
SOURCES_DIR = REPO_ROOT / "data" / "sources"
TMP_DIR = REPO_ROOT / "tmp"
LOG_FORMAT = "%(asctime)s - %(levelname)s - %(message)s"


def load_env() -> None:
    """Load the nearest dotenv file, searching upward from the script directory."""
    dotenv.load_dotenv(dotenv.find_dotenv())


def configure_logging(level: int = logging.WARNING, log_format: str | None = None) -> None:
    """Configure root logging."""
    logging.basicConfig(level=level, format=log_format)


def create_supabase_client(url_var: str = "VITE_SUPABASE_URL", key_var: str = "SUPABASE_KEY") -> Client:
    """Create a Supabase client from environment variables."""
    url = os.getenv(url_var)
    key = os.getenv(key_var)
    if not url or not key:
        raise RuntimeError(f"{url_var} and {key_var} must be set in the environment.")
    return create_client(url, key)
