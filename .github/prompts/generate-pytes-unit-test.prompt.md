# Prompt: Generate pytest unit tests for a selected function

You are an AI coding assistant working in the **WJDR** codebase.
Generate **pytest** unit tests for the selected Python function or method, following these rules:

## Context and goals
- This project uses **pytest** with markers defined in `pyproject.toml` (`unitary`, `integration`, `e2e`, `gui`).
- New unit tests should:
  - Live under the `tests/` directory.
  - Use the `@pytest.mark.unitary` marker.
  - Match the style of existing tests in `tests/test_models.py`, `tests/test_random.py`, and `tests/test_rules.py`.
- Prefer small, focused tests that cover both **happy paths** and a few key edge cases.

## When generating tests
1. **Locate or choose the test file**
   - If there is already a relevant test module (e.g. `tests/test_<module>.py`), add tests there.
   - Otherwise, propose a new file name like `tests/test_<module>.py` consistent with existing naming.

2. **Follow project conventions**
   - Use `pytest` style tests (functions, not classes).
   - Use the `fixed_seed` fixture from `tests/conftest.py` when testing functions that depend on randomness (e.g. those using `DicePool`, `dice_roll_map`, or factories like `primary_attribute_random_factory`).
   - For models from `wjdr.models.models`, import classes via the `wjdr` package (e.g. `from wjdr.models.models import Character`).
   - Use French names and Warhammer terminology as seen in existing tests and models.

3. **Structure of tests**
   - Start each new test file with the necessary imports (`pytest`, relevant models/functions).
   - Mark unit tests with `@pytest.mark.unitary`.
   - Include descriptive test function names like `test_<function>_<behavior>()`.
   - When appropriate, use `pytest.mark.parametrize` for table-driven cases.

4. **What to assert**
   - Assert:
     - return values,
     - important side-effects on models (fields updated, properties computed),
     - correct exceptions using `pytest.raises`.
   - Prefer explicit equality checks and simple predicates (`assert x == 42`, `assert not obj.is_cluttered`).

5. **Integration with existing tooling**
   - Ensure the generated tests work with `pytest` run from the repository root.
   - Do not introduce new test frameworks; stick to `pytest` and its existing markers.

## Output format

Return **only** the Python test code you propose to add or modify, without surrounding explanations. If multiple files are involved, clearly separate them with comments like `# File: tests/test_<module>.py`.