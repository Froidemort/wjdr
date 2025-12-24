"""Rule module for models
This module groups all rule-related code for models.
There is three sources to define rules :
- hardcoded in static resources into json located in /resources/rules
- dynamically loaded from files located in environment variable WJDR_RULES_PATHS (not yet implemented)
- Directly in python module
The earlier has precedence over the first one, but a consistency check is done at the application startup
to ensure that rules are not duplicated (for example if a skill is named "Test Skill" in both sources, an warning will occur, and we take the first one)."""

from . import data_json, types

__all__ = ["data_json", "types"]
