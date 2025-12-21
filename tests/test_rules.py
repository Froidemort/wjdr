import pytest

from wjdr.models.rules import get_resources_rules_path, get_skill_from_json, get_skill_from_string, get_talent_from_json, get_talent_from_string


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


@pytest.mark.unitary
@pytest.mark.parametrize(
    ("talent_str", "expected_name", "expected_specialization"),
    [
        ("Résistance", "Résistance", None),
        ("Sombre savoir (Nécromancie)", "Sombre savoir", "Nécromancie"),
    ],
)
def test_get_talent_from_string_parses_name_and_specialization(
    talent_str,
    expected_name,
    expected_specialization,
):
    talent = get_talent_from_string(talent_str)
    assert talent["name"] == expected_name
    if expected_specialization is None:
        assert "specialization" not in talent or talent.get("specialization") is None
    else:
        assert talent["specialization"] == expected_specialization


@pytest.mark.unitary
def test_get_talent_from_string_unknown_raises_value_error():
    with pytest.raises(ValueError):
        get_talent_from_string("Talent Inconnu (Spécialisation inconnue)")


@pytest.mark.unitary
@pytest.mark.parametrize(
    ("skill_str", "expected_name", "expected_specialization"),
    [
        ("Commérage", "Commérage", None),
        ("Connaissances académiques (Histoire)", "Connaissances académiques", "Histoire"),
    ],
)
def test_get_skill_from_string_parses_name_and_specialization(
    skill_str,
    expected_name,
    expected_specialization,
):
    skill = get_skill_from_string(skill_str)
    assert skill["name"] == expected_name
    if expected_specialization is None:
        assert "specialization" not in skill or skill.get("specialization") is None
    else:
        assert skill["specialization"] == expected_specialization


@pytest.mark.unitary
def test_get_skill_from_string_unknown_raises_value_error():
    with pytest.raises(ValueError):
        get_skill_from_string("Compétence Inconnue (Spécialisation inconnue)")
