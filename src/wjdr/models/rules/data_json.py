import json
from functools import cache
from pathlib import Path
from typing import Generator, Optional


@cache
def get_resources_rules_path() -> Path:
    """Get the path to the resources rules directory.

    Returns
    -------
    Path
        The path to the resources rules directory.
    """
    return Path("resources/rules")


@cache
def talents() -> list[dict]:
    """Load talents from the JSON rules file.

    Returns
    -------
    list[dict]
        List of talent definitions.
    """
    rules_path = get_resources_rules_path() / "talents.json"
    with rules_path.open("r", encoding="utf-8") as f:
        talents = json.load(f)
    return talents


@cache
def skills() -> list[dict]:
    """Load skills from the JSON rules file.

    Returns
    -------
    list[dict]
        List of skill definitions.
    """
    rules_path = get_resources_rules_path() / "skills.json"
    with rules_path.open("r", encoding="utf-8") as f:
        skills = json.load(f)
    return skills


def get_talent_from_json(name: str, specialization: Optional[str] = None) -> dict:
    """Retrieve a talent definition from the JSON rules file.

    Parameters
    ----------
    name : str
        The name of the talent.
    specialization : Optional[str], optional
        The specialization of the talent, by default None.

    Returns
    -------
    dict
        The talent definition.

    Raises
    ------
    ValueError
        If the talent is not found.
    """
    all_talents = talents()

    for talent in all_talents:
        if talent["name"] == name:
            if specialization is None or talent.get("specialization") == specialization:
                return talent
    raise ValueError(f"Talent {name} with specialization {specialization} not found.")


def get_skill_from_json(name: str, specialization: Optional[str] = None) -> dict:
    """Retrieve a skill definition from the JSON rules file.

    Parameters
    ----------
    name : str
        The name of the skill.

    Returns
    -------
    dict
        The skill definition.

    Raises
    ------
    ValueError
        If the skill is not found.
    """
    all_skills = skills()

    for skill in all_skills:
        if skill["name"] == name:
            if specialization is None or skill.get("specialization", None) == specialization:
                return skill
    raise ValueError(f"Skill {name} with specialization {specialization} not found.")


def get_talent_from_string(talent_str: str) -> dict:
    """Retrieve a talent definition from a string representation.

    Parameters
    ----------
    talent_str : str
        The string representation of the talent, formatted as "Name (Specialization)".

    Returns
    -------
    dict
        The talent definition.

    Raises
    ------
    ValueError
        If the talent is not found or the format is incorrect.
    """
    if "(" in talent_str and talent_str.endswith(")"):
        name, specialization = talent_str[:-1].split(" (", 1)
    else:
        name = talent_str
        specialization = None
    return get_talent_from_json(name, specialization)


def get_skill_from_string(skill_str: str) -> dict:
    """Retrieve a skill definition from a string representation.

    Parameters
    ----------
    skill_str : str
        The string representation of the skill, formatted as "Name (Specialization)".

    Returns
    -------
    dict
        The skill definition.

    Raises
    ------
    ValueError
        If the skill is not found or the format is incorrect.
    """
    if "(" in skill_str and skill_str.endswith(")"):
        name, specialization = skill_str[:-1].split(" (", 1)
    else:
        name = skill_str
        specialization = None
    return get_skill_from_json(name, specialization)


@cache
def map_careers_files() -> Generator[tuple[str, Path], None, None]:
    """Map career names to their JSON file paths.

    Returns
    -------
    dict[str, Path]
        A dictionary mapping career names to their JSON file paths.
    """
    career_dir = get_resources_rules_path() / "careers"
    career_files = career_dir.glob("*.json")
    for career_json in career_files:
        with career_json.open("r", encoding="utf-8") as f:
            career_data = json.load(f)
            yield career_data["name"], career_json


def get_career_from_json(name: str) -> dict:
    """Retrieve a career definition from the JSON rules file.

    Parameters
    ----------
    name : str
        The name of the career.

    Returns
    -------
    dict
        The career definition.

    Raises
    ------
    ValueError
        If the career is not found.
    """
    for name, career_json in map_careers_files():
        if name == name:
            with career_json.open("r", encoding="utf-8") as f:
                return json.load(f)
    raise ValueError(f"Career {name} not found.")
