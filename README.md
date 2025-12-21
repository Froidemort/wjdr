# WJDR

WJDR is a web application built with [NiceGUI](https://nicegui.io) to help a Game Master (GM) create and manage Warhammer RPG (2nd Edition) campaigns.

## Features

- Character creation wizard with multiple steps (campaign info, identity, attributes, career)
- Warhammer-specific rules modeled
- Themed UI with a custom dark fantasy palette
- TBD: Warhammer Agent, monster creator, maps manager...

## Installation

This project is designed to be used with [`uv`](https://docs.astral.sh/uv/).

### Using uv (recommended)

From the project root:

```bash
uv sync
```

This installs the application plus development dependencies (linting and testing).

## Running the application

To start the NiceGUI server locally:

```bash
python -m wjdr.views.main
```

Then open your browser at `http://localhost:8080/`.

The character creation page is available at `http://localhost:8080/character`.

## Development

### Code style and linting

This project uses:

- [ruff](https://github.com/astral-sh/ruff) for linting
- [interrogate](https://github.com/econchick/interrogate) for docstring coverage

Run common checks from the project root:

```bash
ruff check src tests
interrogate -c pyproject.toml src
```

If you have [`pre-commit`](https://pre-commit.com/) installed and configured, hooks will run automatically on commit and push.

### Testing

Tests are written with `pytest` and live in the `tests/` directory.

Run the full test suite:

```bash
pytest
```

Run unit tests only:

```bash
pytest -m unitary
```

Run tests with coverage:

```bash
pytest --cov=wjdr --cov-report=term-missing
```

## Configuration and rules data

Rules data (skills, talents, careers) are stored as JSON files under `resources/rules/`. The application loads them at runtime via helper functions in `wjdr.models.rules`.

If you extend the rules (add skills, talents, or careers), keep the JSON structure consistent with the existing files and update or add tests under `tests/`.

