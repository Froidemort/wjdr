# AI assistant instructions for this repo

## Project overview
- This is a NiceGUI web app for Warhammer RPG 2nd Edition only.
- Domain logic is in Pydantic models under `src/wjdr/models/`.
- Game rules (skills, talents, careers) are data-driven from JSON in `resources/rules/` and consumed via `wjdr.models.rules`.

## Architecture and patterns
- Treat `wjdr` as the root package; imports should be absolute (e.g. `from wjdr.models.models import Character`) in new code, even though internal modules sometimes use relative imports.
- Core models:
  - are defined in `models.py` and use rich type hints and Pydantic validators.
  - Random generation helpers live in `factory.py` and `random.py`. Reuse them instead of re-implementing dice or race tables.
- Rules I/O:
  - New rule-based features should go in module `wjdr.models.rules` rather than reading files directly.
- UI patterns:
  - All UI is built with NiceGUI. Pages are functions decorated with `@ui.page`.
  - The `frame()` context manager in `views/theme.py` applies the global theme and standard header/footer; wrap new pages in `frame()` unless explicitly opting out.

## Workflows
- Dependency management uses `uv` with groups defined in `pyproject.toml` under `[dependency-groups]`:
  - `lint` (ruff, mypy, interrogate, pre-commit) and `test` (pytest, pytest-cov, pytest-mock) are nested into `dev`.
  - Prefer `uv sync` when adding instructions that require a fully set-up dev env.
- Running the app:
  - Entry point is `python -m wjdr.views.main`, which configures static files from `resources/` and runs NiceGUI on port 8080.
- Tests:
  - Use `pytest` with markers defined in `pyproject.toml` (`unitary`, `integration`, `e2e`, `gui`). Keep or add markers consistently in new tests.
  - Existing tests live in `tests/`; mirror their style and fixtures (notably `fixed_seed` in `tests/conftest.py` for deterministic randomness).
- Linting & typing:
  - Ruff config is in `pyproject.toml` (`[tool.ruff]`); run `ruff check src tests` for new instructions.

## Conventions for new code
- Use Pydantic models and `Field` metadata for new domain entities; follow existing naming (French labels, `serialization_alias` for abbreviations like `CC`, `CT`).
- Prefer adding behaviour as methods/properties on existing models (e.g. `Money.__add__`, `Character.max_clutter`) rather than scattering free functions.
- Keep random behaviour testable by:
  - Threading `seed` parameters where appropriate (as in `primary_attribute_random_factory`).
  - Reusing `DicePool` and `dice_roll_map` instead of `random.randint` directly.
- When extending rules JSON, write or update tests in `tests/test_rules.py` and access new data via `wjdr.models.rules` helpers.

## How to interact as an AI agent
- Stick to uv for dependency, linting, testing, and running instructions.
- When adding features touching both UI and models, update models/rules first with tests, then wire them into NiceGUI views.
- Avoid introducing new frameworks; stick to NiceGUI, Pydantic
- Use only pytest and its plugins for tests.
- Respect the existing French naming and Warhammer terminology in UI strings and rule names.
- Before proposing breaking changes to core models or JSON schemas, surface them explicitly in your explanation so the human can confirm.
