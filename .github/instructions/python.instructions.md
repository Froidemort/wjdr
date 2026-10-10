---
description: Python data scripts rules
applyTo: "migrations/**/*.py"
---
- Python version from `.python-version`; deps in `pyproject.toml`.
- Type-annotate all functions.
- Scripts are re-runnable and write deterministic output.
- Read inputs from `migrations/`; no network calls.
- Entry point under `if __name__ == "__main__":`.
