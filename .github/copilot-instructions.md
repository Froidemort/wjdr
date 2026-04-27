# Warhammer RPG GM helper assistant : AI instructions

## General instructions

- Always respond in French, unless the user explicitly asks you to respond in another language.
- Always provide a concise and clear answer to the user's question or request.
- Do not hallucinate, or provide false information. If you do not know the answer, say "Je ne sais pas" or "Je ne suis pas sûr".

## Project description & context

This project aim to create an assistant for a game master of the Warhammer RPG 2nd edition.
The main functionnalities are :
* Create, modify, and manager playablable characters (PC)
* Create and manage complete adventures organized in scenarios, chapters.
* Manage Warhammer rules :
  * Roll dice and calculate results
  * create and manage weapons, armors, and other items
  * create and manager spells.

## Used technologies & languages

This project uses Python 3.12+.
It aims to manage backend and frontend web application.
The libraties used are :
* *Pydantic* for data validation and management
* *SQLModel* + *SQLAlchemy* for database management, with _PostgreSQL_ as database
* *reflex* for frontend and backend web application (generates React components from Python)

Developpement libratries are :
* *pytest* for testing
* *ruff* for linting and formatting
* *sphinx* for documentation, with theme *furo* for documentation style.
* *uv* as package manager (use `uv sync --group dev` to install)

## Common commands

| Task | Command |
|------|---------|
| Install deps | `uv sync --group dev` |
| Run app (dev) | `reflex run` → http://localhost:3000 |
| Run all tests | `pytest` |
| Run by marker | `pytest -m unitary` / `-m integration` / `-m e2e` / `-m gui` |
| Lint | `ruff check .` |
| Format | `ruff format .` |

## Architecture

- **[src/wjdr/models.py](../src/wjdr/models.py)**: All SQLModel tables (~14+ tables with many-to-many via explicit link tables)
- **[src/wjdr/database.py](../src/wjdr/database.py)**: Session management (`get_session()` context manager); DB URL: `postgresql+psycopg://postgres:postgres@localhost:5432/wjdr`
- **[src/wjdr/rules/factory.py](../src/wjdr/rules/factory.py)**: Rules engine — character attribute generation, race modifiers, dice rolling
- **[src/wjdr/wjdr.py](../src/wjdr/wjdr.py)**: Reflex frontend pages (index, create-campaign, create-character, create-career)
- **[resources/rules/](../resources/rules/)**: JSON data files for skills, talents, physical traits, astral signs, and career definitions (all in French)

> Alembic migrations are not yet implemented — tables are created via `SQLModel.metadata.create_all()`.

## Code style

ALWAYS follow rules that are described in [pyproject.toml](../pyproject.toml) file, with *ruff* as linter and formatter.
- Line length: 240 characters
- Comments, docstrings, variables, functions, methods and class names MUST BE in **English**
- Labels, messages, and user interface text MUST BE in **French**

## SQLModel conventions

- Keep all SQLModel classes in `src/wjdr/models.py`.
- All models inherit from `reflex.Model` (which wraps SQLModel).
- Declare `__tablename__` with `cast(declared_attr, "TableName")`.
- Foreign keys use string names in `Field`: `Field(foreign_key="OtherTable.id")`.
- For relationships, use `Relationship` with `back_populates` and `link_model`. `link_model` must be a class defined in the same file, not a string.
- Avoid using base-table inheritance helpers and prefer explicit field declarations per table.

## Testing conventions

- Tests use session-scoped in-memory SQLite with `StaticPool` for isolation (see [tests/models/conftest.py](../tests/models/conftest.py)).
- A `fixed_random_seed` fixture is available in [tests/conftest.py](../tests/conftest.py) for deterministic dice roll tests.
- Pytest markers: `unitary`, `integration`, `e2e`, `gui`.
