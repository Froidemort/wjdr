---
description: Python data scripts rules
applyTo: "migrations/**/*.py"
---
- Python version in `.python-version`; deps in `pyproject.toml` (PEP 621).
- PEP 8 style via ruff (240 cols, `snake_case`, `PascalCase`, sorted imports); format with `ruff format`.
- PEP 484 / 585 / 604: annotate all functions; use `list[str]`, `X | None`.
- PEP 257: docstring on every module, public function and class; one-line summary.
- Scripts are re-runnable and write deterministic output.
- Read inputs from `migrations/`; no network calls except the Supabase client.
- Entry point under `if __name__ == "__main__":`.
