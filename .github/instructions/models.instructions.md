---
description: "Use when adding, modifying, or reviewing SQLModel tables, enums, link tables, or relationships in models.py. Covers table naming, foreign keys, many-to-many patterns, and enum conventions."
applyTo: "src/wjdr/models.py"
---
# Models conventions

All SQLModel table classes live exclusively in `src/wjdr/models.py`. Do not create model classes elsewhere.

## Base class

All table models inherit from `reflex.Model`, not directly from `SQLModel`:

```python
from reflex import Model

class MyTable(Model, table=True):
    ...
```

## Table naming

Always declare `__tablename__` explicitly using `cast(declared_attr, ...)`:

```python
from typing import cast
from sqlalchemy.ext.declarative import declared_attr

class MyTable(Model, table=True):
    __tablename__ = cast(declared_attr, "MyTable")
```

## Primary keys and foreign keys

- Use `int` as primary key (auto-incremented) by default. Use `uuid.UUID` only for media or externally referenced entities.
- Declare foreign keys as strings matching the target `__tablename__`:

```python
career_id: int = Field(foreign_key="CareerTable.id", primary_key=True)
```

## Many-to-many relationships

Always use an explicit link table class (never a string). The link class must be defined in the same file before it is referenced:

```python
class CareerCapacityLinkTable(Model, table=True):
    __tablename__ = cast(declared_attr, "CareerCapacityLinkTable")
    career_id: int = Field(foreign_key="CareerTable.id", primary_key=True)
    capacity_id: int = Field(foreign_key="CapacityTable.id", primary_key=True)

class CareerTable(Model, table=True):
    capacities: list["CapacityTable"] = Relationship(back_populates="careers", link_model=CareerCapacityLinkTable)
```

Link tables with extra fields (e.g., `order`, `skill_level`) are valid — declare them as additional columns on the link table.

## Enums

- Use `StrEnum` for enums displayed in the UI (values in French).
- Use `str, Enum` for enums used in database columns.
- Use `Enum` alone only when values are non-string (e.g., integers for `SkillLevelEnum`).
- Enum values (string literals) must be in **French**; class names and member names in **English**.

## File organisation

Maintain the existing section order in the file:
1. Enums
2. Link tables
3. Domain tables (Dice, Campaign, Character, Career, Object, Spell…)
