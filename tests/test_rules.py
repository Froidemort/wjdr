import pytest

from wjdr.models.rules import get_resources_rules_path, get_talent_from_json, get_skill_from_json


@pytest.mark.unitary
def test_get_resources_rules_path():
    path = get_resources_rules_path()
    assert path.is_dir()
    assert (path / "talents.json").is_file()
    assert (path / "skills.json").is_file()


@pytest.mark.unitary
def test_get_talent_from_json():
    talent = get_talent_from_json("Résistance")
    assert talent["name"] == "Résistance"
    assert "permanent_bonus" not in talent

    talent_with_specialization = get_talent_from_json("Sombre savoir", "Nécromancie")
    assert talent_with_specialization["name"] == "Sombre savoir"
    assert talent_with_specialization["specialization"] == "Nécromancie"

    with pytest.raises(ValueError):
        get_talent_from_json("NonExistentTalent")


@pytest.mark.unitary
def test_get_skills_from_json():
    skill = get_skill_from_json("Commérage")
    assert skill["name"] == "Commérage"
    assert "permanent_bonus" not in skill

    skill_with_specialization = get_skill_from_json("Connaissances académiques", "Histoire")
    assert skill_with_specialization["name"] == "Connaissances académiques"
    assert skill_with_specialization["specialization"] == "Histoire"

    with pytest.raises(ValueError):
        get_skill_from_json("NonExistentSkill")
