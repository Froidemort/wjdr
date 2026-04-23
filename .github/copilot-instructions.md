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

This project uses Python 3.11+.
It aims to manage backend and frontend web application.
The libraties used are :
* *Pydantic* for data validation and management
* *SQLModel* for database management, with _PostgreSQL_ as database
* *reflex* for frontend and backend web application

Developpement libratries are :
* *pytest* for testing
* *ruff* for linting and formatting
* *sphinx* for documentation, with theme *furo* for documentation style.

## Code style

ALWAYS follow rules that are described in [pyproject.toml](../pyproject.toml) file, with *ruff* as linter and formatter.
Comments, docstrings, variables, functions, methods and classes names MUST BE in english. Labels, messages, and user interface MUST BE in french.

### SQLModel conventions

- Keep all SQLModel classes in `src/wjdr/models.py`.
- Declare `__tablename__` with `cast(declared_attr, "TableName")`.
- For relationships, use `Relationship` with `back_populates` and `link_model`. `link_model` should be a class defined in the same file, not a string.
- Avoid using base-table inheritance helpers and prefer explicit field declarations per table.
