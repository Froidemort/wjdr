import pytest
from sqlalchemy import CheckConstraint, Enum as SAEnum, Identity
from typing import Any, cast

from wjdr.models.sql_dump import (
    ArmourTable,
    CampaignTable,
    CareerCareerLinkTable,
    CareerSkillChoiceSkillFreeChoiceSkillLinkTable,
    CareerObjectLinkTable,
    CareerObjectObjectChoiceLinkTable,
    CareerSkillLinkTable,
    CareerTable,
    CareerTalentChoiceTalentFreeChoiceTalentLinkTable,
    CareerTalentLinkTable,
    CharacterCareerLinkTable,
    CharacterInventorySlotLinkTable,
    CharacterSkillLinkTable,
    CharacterSpellLinkTable,
    CharacterTable,
    CharacterTalentLinkTable,
    ChapterInventorySlotLinkTable,
    ChapterMediaLinkTable,
    ChapterTable,
    ChoiceSkillTable,
    ChoiceTalentTable,
    DiceTable,
    ExperienceTable,
    FreeChoiceSkillTable,
    FreeChoiceTalentTable,
    InventorySlotTable,
    MediaTable,
    MoneyTable,
    ObjectObjectChoiceLinkTable,
    ObjectTable,
    ObjectChoiceTable,
    EquipmentLink,
    PrimaryAttributesTable,
    Scenario,
    SecondaryAttributesTable,
    SkillChoiceSkillLinkTable,
    SkillTable,
    SpellTable,
    SpellCategoryTable,
    TalentTable,
    TalentChoiceSkillLinkTable,
    WeaponTable,
    WeaponWeaponAttributesTable,
    WeaponAttributesTable,
    dynamic_bonus,
    gender_enum,
    location,
    playable_race_enum,
    quality,
    skill_bonus,
)


pytestmark = pytest.mark.unitary


def _column(table, name):
    return _sa_table(table).columns[name]


def _sa_table(table):
    return cast(Any, table.__table__)


def _table_constraint_names(table, constraint_type):
    return {constraint.name for constraint in _sa_table(table).constraints if isinstance(constraint, constraint_type)}


def _table_indexes(table):
    return {index.name: tuple(column.name for column in index.columns) for index in _sa_table(table).indexes}


def _identity_present(table):
    return isinstance(_column(table, "id").identity, Identity)


def _foreign_key_targets(table, column_name):
    return {foreign_key.target_fullname for foreign_key in _column(table, column_name).foreign_keys}


def test_foundation_table_names_are_registered():
    assert _sa_table(ArmourTable).name == "ArmourTable"
    assert _sa_table(CampaignTable).name == "CampaignTable"
    assert _sa_table(CareerCareerLinkTable).name == "CareerCareerLinkTable"
    assert _sa_table(CareerSkillChoiceSkillFreeChoiceSkillLinkTable).name == "CareerSkillChoiceSkillFreeChoiceSkillLinkTable"
    assert _sa_table(CareerSkillLinkTable).name == "CareerSkillLinkTable"
    assert _sa_table(CareerTable).name == "CareerTable"
    assert _sa_table(CareerTalentChoiceTalentFreeChoiceTalentLinkTable).name == "CareerTalentChoiceTalentFreeChoiceTalentLinkTable"
    assert _sa_table(CareerTalentLinkTable).name == "CareerTalentLinkTable"
    assert _sa_table(CharacterCareerLinkTable).name == "CharacterCareerLinkTable"
    assert _sa_table(CharacterInventorySlotLinkTable).name == "CharacterInventorySlotLinkTable"
    assert _sa_table(CharacterSkillLinkTable).name == "CharacterSkillLinkTable"
    assert _sa_table(CharacterSpellLinkTable).name == "CharacterSpellLinkTable"
    assert _sa_table(CharacterTable).name == "CharacterTable"
    assert _sa_table(CharacterTalentLinkTable).name == "CharacterTalentLinkTable"
    assert _sa_table(Scenario).name == "Scenario"
    assert _sa_table(ChapterTable).name == "ChapterTable"
    assert _sa_table(ChapterMediaLinkTable).name == "ChapterMediaLinkTable"
    assert _sa_table(ChapterInventorySlotLinkTable).name == "ChapterInventorySlotLinkTable"
    assert _sa_table(MoneyTable).name == "MoneyTable"
    assert _sa_table(SkillTable).name == "SkillTable"
    assert _sa_table(TalentTable).name == "TalentTable"
    assert _sa_table(ChoiceSkillTable).name == "ChoiceSkillTable"
    assert _sa_table(FreeChoiceSkillTable).name == "FreeChoiceSkillTable"
    assert _sa_table(ChoiceTalentTable).name == "ChoiceTalentTable"
    assert _sa_table(FreeChoiceTalentTable).name == "FreeChoiceTalentTable"
    assert _sa_table(InventorySlotTable).name == "InventorySlotTable"
    assert _sa_table(ObjectChoiceTable).name == "ObjectChoiceTable"
    assert _sa_table(ObjectObjectChoiceLinkTable).name == "ObjectObjectChoiceLinkTable"
    assert _sa_table(ObjectTable).name == "ObjectTable"
    assert _sa_table(EquipmentLink).name == "EquipmentLink"
    assert _sa_table(PrimaryAttributesTable).name == "PrimaryAttributesTable"
    assert _sa_table(SecondaryAttributesTable).name == "SecondaryAttributesTable"
    assert _sa_table(ExperienceTable).name == "ExperienceTable"
    assert _sa_table(MediaTable).name == "MediaTable"
    assert _sa_table(SkillChoiceSkillLinkTable).name == "SkillChoiceSkillLinkTable"
    assert _sa_table(SpellTable).name == "SpellTable"
    assert _sa_table(WeaponAttributesTable).name == "WeaponAttributesTable"
    assert _sa_table(SpellCategoryTable).name == "SpellCategoryTable"
    assert _sa_table(TalentChoiceSkillLinkTable).name == "TalentChoiceSkillLinkTable"
    assert _sa_table(WeaponTable).name == "WeaponTable"
    assert _sa_table(WeaponWeaponAttributesTable).name == "WeaponWeaponAttributesTable"
    assert _sa_table(DiceTable).name == "DiceTable"


def test_foundation_identity_primary_keys_match_sql_dump():
    assert _identity_present(ChapterTable)
    assert _identity_present(ArmourTable)
    assert _identity_present(CareerSkillChoiceSkillFreeChoiceSkillLinkTable)
    assert _identity_present(CareerTalentChoiceTalentFreeChoiceTalentLinkTable)
    assert _identity_present(CareerObjectObjectChoiceLinkTable)
    assert _identity_present(EquipmentLink)
    assert _identity_present(PrimaryAttributesTable)
    assert _identity_present(SecondaryAttributesTable)
    assert _identity_present(ExperienceTable)
    assert _identity_present(MoneyTable)
    assert _identity_present(SkillTable)
    assert _identity_present(TalentTable)
    assert _identity_present(ChoiceSkillTable)
    assert _identity_present(FreeChoiceSkillTable)
    assert _identity_present(ChoiceTalentTable)
    assert _identity_present(FreeChoiceTalentTable)
    assert _identity_present(InventorySlotTable)
    assert _identity_present(ObjectChoiceTable)
    assert _identity_present(ObjectTable)
    assert _identity_present(MediaTable)
    assert _identity_present(SpellTable)
    assert _identity_present(WeaponTable)
    assert _identity_present(ArmourTable)
    assert _identity_present(WeaponAttributesTable)
    assert _identity_present(SpellCategoryTable)
    assert _identity_present(DiceTable)


def test_media_indexes_and_uniqueness_match_sql_dump():
    indexes = _table_indexes(MediaTable)

    assert indexes == {
        "MediaTable_short_name_index": ("short_name",),
        "MediaTable_short_name_relative_path_index": ("short_name", "relative_path"),
    }
    assert _column(MediaTable, "relative_path").unique is True


def test_object_indexes_match_sql_dump():
    assert _table_indexes(ObjectTable) == {
        "ObjectTable_name_index": ("name",),
        "ObjectTable_quality_index": ("quality",),
    }


def test_campaign_and_chapter_indexes_match_sql_dump():
    assert _table_indexes(CampaignTable) == {
        "CampaignTable_name_index": ("name",),
        "CampaignTable_gm_name_index": ("gm_name",),
    }
    assert _table_indexes(CharacterTable) == {"CharacterTable_name_index": ("name",)}
    assert _table_indexes(Scenario) == {"Scenario_name_index": ("name",)}
    assert _table_indexes(ChapterTable) == {"ChapterTable_name_index": ("name",)}
    assert _table_indexes(PrimaryAttributesTable) == {
        "PrimaryAttributesTable_attributes_index": (
            "fight_capacity",
            "shooting_capacity",
            "strength",
            "thoughness",
            "agility",
            "intelligence",
            "mental_strength",
            "sociability",
        )
    }
    assert _table_indexes(ExperienceTable) == {"ExperienceTable_available_spent_index": ("available", "spent")}


def test_campaign_table_columns_match_sql_dump():
    assert _column(CampaignTable, "id").unique is True
    assert _column(CampaignTable, "name").unique is True
    assert str(_column(CampaignTable, "start_date").server_default.arg) == "CLOCK_TIMESTAMP()"


def test_campaign_chapter_foreign_keys_match_translation():
    assert _foreign_key_targets(Scenario, "campaign_uuid") == {"CampaignTable.id"}
    assert _foreign_key_targets(ChapterTable, "scenario_uuid") == {"Scenario.id"}
    assert _foreign_key_targets(ChapterMediaLinkTable, "chapter_id") == {"ChapterTable.id"}
    assert _foreign_key_targets(ChapterMediaLinkTable, "media_id") == {"MediaTable.id"}
    assert _foreign_key_targets(ChapterInventorySlotLinkTable, "chapter_reward_id") == {"ChapterTable.id"}
    assert _foreign_key_targets(ChapterInventorySlotLinkTable, "inventory_slot_id") == {"InventorySlotTable.id"}


def test_character_core_foreign_keys_match_translation():
    assert _foreign_key_targets(CharacterTable, "primary_attributes_id") == {"PrimaryAttributesTable.id"}
    assert _foreign_key_targets(CharacterTable, "secondary_attributes_id") == {"SecondaryAttributesTable.id"}
    assert _foreign_key_targets(CharacterTable, "experience_id") == {"ExperienceTable.id"}
    assert _foreign_key_targets(CharacterTable, "profile_picture_id") == {"MediaTable.id"}


def test_rules_and_character_link_foreign_keys_match_translation():
    assert _foreign_key_targets(CareerTable, "primary_attributes_bonus_id") == {"PrimaryAttributesTable.id"}
    assert _foreign_key_targets(CareerTable, "secondary_attributes_id") == {"SecondaryAttributesTable.id"}
    assert _foreign_key_targets(CharacterSkillLinkTable, "character_id") == {"CharacterTable.id"}
    assert _foreign_key_targets(CharacterSkillLinkTable, "skill_id") == {"SkillTable.id"}
    assert _foreign_key_targets(CharacterTalentLinkTable, "character_id") == {"CharacterTable.id"}
    assert _foreign_key_targets(CharacterTalentLinkTable, "talent_id") == {"TalentTable.id"}
    assert _foreign_key_targets(CharacterCareerLinkTable, "character_id") == {"CharacterTable.id"}
    assert _foreign_key_targets(CharacterCareerLinkTable, "career_id") == {"CareerTable.id"}
    assert _foreign_key_targets(CareerSkillLinkTable, "career_id") == {"CareerTable.id"}
    assert _foreign_key_targets(CareerSkillLinkTable, "skill_id") == {"SkillTable.id"}
    assert _foreign_key_targets(CareerTalentLinkTable, "career_id") == {"CareerTable.id"}
    assert _foreign_key_targets(CareerTalentLinkTable, "talent_id") == {"TalentTable.id"}
    assert _foreign_key_targets(CareerCareerLinkTable, "upstream_career_id") == {"CareerTable.id"}
    assert _foreign_key_targets(CareerCareerLinkTable, "downstream_career_id") == {"CareerTable.id"}
    assert _foreign_key_targets(CharacterInventorySlotLinkTable, "character_id") == {"CharacterTable.id"}
    assert _foreign_key_targets(CharacterInventorySlotLinkTable, "inventory_slot_id") == {"InventorySlotTable.id"}
    assert _foreign_key_targets(CharacterSpellLinkTable, "character_id") == {"CharacterTable.id"}
    assert _foreign_key_targets(CharacterSpellLinkTable, "spell_id") == {"SpellTable.id"}


def test_choice_table_foreign_keys_match_translation():
    assert _foreign_key_targets(SkillChoiceSkillLinkTable, "skill_id") == {"SkillTable.id"}
    assert _foreign_key_targets(SkillChoiceSkillLinkTable, "choice_skill_id") == {"ChoiceSkillTable.id"}
    assert _foreign_key_targets(TalentChoiceSkillLinkTable, "talent_id") == {"TalentTable.id"}
    assert _foreign_key_targets(TalentChoiceSkillLinkTable, "choice_talent_id") == {"ChoiceTalentTable.id"}
    assert _foreign_key_targets(CareerSkillChoiceSkillFreeChoiceSkillLinkTable, "skill_id") == {"SkillTable.id"}
    assert _foreign_key_targets(CareerSkillChoiceSkillFreeChoiceSkillLinkTable, "choice_skill_id") == {"ChoiceSkillTable.id"}
    assert _foreign_key_targets(CareerSkillChoiceSkillFreeChoiceSkillLinkTable, "free_choice_skill_id") == {"FreeChoiceSkillTable.id"}
    assert _foreign_key_targets(CareerTalentChoiceTalentFreeChoiceTalentLinkTable, "talent_id") == {"TalentTable.id"}
    assert _foreign_key_targets(CareerTalentChoiceTalentFreeChoiceTalentLinkTable, "choice_talent_id") == {"ChoiceTalentTable.id"}
    assert _foreign_key_targets(CareerTalentChoiceTalentFreeChoiceTalentLinkTable, "free_choice_talent_id") == {"FreeChoiceTalentTable.id"}


def test_spell_table_foreign_keys_match_translation():
    assert _foreign_key_targets(SpellTable, "damage_id") == {"DiceTable.id"}
    assert _foreign_key_targets(SpellTable, "category_id") == {"SpellCategoryTable.id"}
    assert _foreign_key_targets(CharacterSpellLinkTable, "spell_id") == {"SpellTable.id"}


def test_equipment_and_object_foreign_keys_match_translation():
    assert _foreign_key_targets(ObjectTable, "value_money_id") == {"MoneyTable.id"}
    assert _foreign_key_targets(ObjectTable, "equipment_id") == {"EquipmentLink.id"}
    assert _foreign_key_targets(WeaponTable, "damage") == {"DiceTable.id"}
    assert _foreign_key_targets(WeaponTable, "attribute_id") == {"WeaponAttributesTable.id"}
    assert _foreign_key_targets(WeaponWeaponAttributesTable, "weapon_id") == {"WeaponTable.id"}
    assert _foreign_key_targets(WeaponWeaponAttributesTable, "weapon_attributes_id") == {"WeaponAttributesTable.id"}
    assert _foreign_key_targets(EquipmentLink, "weapon_id") == {"WeaponTable.id"}
    assert _foreign_key_targets(EquipmentLink, "armour_id") == {"ArmourTable.id"}
    assert _foreign_key_targets(InventorySlotTable, "object_id") == {"ObjectTable.id"}
    assert _foreign_key_targets(ObjectObjectChoiceLinkTable, "object_id") == {"ObjectTable.id"}
    assert _foreign_key_targets(ObjectObjectChoiceLinkTable, "object_choice_id") == {"ObjectChoiceTable.id"}
    assert _foreign_key_targets(CareerObjectObjectChoiceLinkTable, "object_id") == {"ObjectTable.id"}
    assert _foreign_key_targets(CareerObjectObjectChoiceLinkTable, "object_choice_id") == {"ObjectChoiceTable.id"}
    assert _foreign_key_targets(CareerObjectLinkTable, "career_id") == {"CareerTable.id"}
    assert _foreign_key_targets(CareerObjectLinkTable, "object_id") == {"CareerObjectObjectChoiceLinkTable.id"}
    assert _foreign_key_targets(CareerObjectLinkTable, "quantity") == {"DiceTable.id"}


def test_character_core_defaults_match_sql_dump():
    assert str(_column(SecondaryAttributesTable, "magic_points").server_default.arg) == "0"
    assert str(_column(SecondaryAttributesTable, "madness_points").server_default.arg) == "0"
    assert str(_column(ExperienceTable, "available").server_default.arg) == "0"
    assert str(_column(ExperienceTable, "spent").server_default.arg) == "0"


def test_character_gender_and_race_use_sql_dump_enums():
    gender_column = _column(CharacterTable, "gender")
    race_column = _column(CharacterTable, "race")

    assert isinstance(gender_column.type, SAEnum)
    assert gender_column.type.name == "gender_enum"
    assert list(gender_column.type.enums) == [member.value for member in gender_enum]

    assert isinstance(race_column.type, SAEnum)
    assert race_column.type.name == "playable_race_enum"
    assert list(race_column.type.enums) == [member.value for member in playable_race_enum]


def test_character_core_translation_keeps_character_owned_foreign_keys():
    assert not _column(CharacterTable, "primary_attributes_id").nullable
    assert not _column(CharacterTable, "secondary_attributes_id").nullable
    assert _column(CharacterTable, "experience_id").nullable
    assert _column(CharacterTable, "profile_picture_id").nullable


def test_career_table_name_uniqueness_matches_sql_dump():
    assert _column(CareerTable, "name").unique is True


def test_object_and_armour_use_sql_dump_enums():
    quality_column = _column(ObjectTable, "quality")
    location_column = _column(ArmourTable, "location")

    assert isinstance(quality_column.type, SAEnum)
    assert quality_column.type.name == "quality"
    assert list(quality_column.type.enums) == [member.value for member in quality]

    assert isinstance(location_column.type, SAEnum)
    assert location_column.type.name == "location"
    assert list(location_column.type.enums) == [member.value for member in location]


def test_character_skill_bonus_uses_sql_dump_enum_values():
    bonus_column = _column(CharacterSkillLinkTable, "bonus")

    assert isinstance(bonus_column.type, SAEnum)
    assert bonus_column.type.name == "skill_bonus"
    assert list(bonus_column.type.enums) == [member.value for member in skill_bonus]


def test_link_tables_use_composite_primary_keys():
    assert _column(CharacterSkillLinkTable, "character_id").primary_key is True
    assert _column(CharacterSkillLinkTable, "skill_id").primary_key is True
    assert _column(CharacterTalentLinkTable, "character_id").primary_key is True
    assert _column(CharacterTalentLinkTable, "talent_id").primary_key is True
    assert _column(CharacterCareerLinkTable, "character_id").primary_key is True
    assert _column(CharacterCareerLinkTable, "career_id").primary_key is True
    assert _column(CareerSkillLinkTable, "career_id").primary_key is True
    assert _column(CareerSkillLinkTable, "skill_id").primary_key is True
    assert _column(CareerTalentLinkTable, "career_id").primary_key is True
    assert _column(CareerTalentLinkTable, "talent_id").primary_key is True
    assert _column(CareerCareerLinkTable, "upstream_career_id").primary_key is True
    assert _column(CareerCareerLinkTable, "downstream_career_id").primary_key is True
    assert _column(CharacterInventorySlotLinkTable, "character_id").primary_key is True
    assert _column(CharacterInventorySlotLinkTable, "inventory_slot_id").primary_key is True
    assert _column(CharacterSpellLinkTable, "character_id").primary_key is True
    assert _column(CharacterSpellLinkTable, "spell_id").primary_key is True
    assert _column(SkillChoiceSkillLinkTable, "skill_id").primary_key is True
    assert _column(SkillChoiceSkillLinkTable, "choice_skill_id").primary_key is True
    assert _column(TalentChoiceSkillLinkTable, "talent_id").primary_key is True
    assert _column(TalentChoiceSkillLinkTable, "choice_talent_id").primary_key is True
    assert _column(WeaponWeaponAttributesTable, "weapon_id").primary_key is True
    assert _column(WeaponWeaponAttributesTable, "weapon_attributes_id").primary_key is True
    assert _column(ObjectObjectChoiceLinkTable, "object_id").primary_key is True
    assert _column(ObjectObjectChoiceLinkTable, "object_choice_id").primary_key is True
    assert _column(CareerObjectLinkTable, "career_id").primary_key is True
    assert _column(CareerObjectLinkTable, "object_id").primary_key is True


def test_character_career_link_translation_uses_uuid_to_match_career_primary_key():
    assert str(_column(CareerTable, "id").type) == "UUID"
    assert str(_column(CharacterCareerLinkTable, "career_id").type) == "UUID"


def test_translated_bridge_tables_remove_invalid_identity_foreign_keys():
    assert _column(WeaponWeaponAttributesTable, "weapon_id").identity is None
    assert _column(ObjectObjectChoiceLinkTable, "object_id").identity is None
    assert _column(TalentChoiceSkillLinkTable, "talent_id").identity is None


def test_object_and_inventory_defaults_match_sql_dump_translation():
    assert str(_column(ObjectTable, "clutter").server_default.arg) == "0"
    assert str(_column(InventorySlotTable, "quantity").server_default.arg) == "1"
    assert str(_column(CareerObjectLinkTable, "quantity").server_default.arg) == "1"


def test_career_skill_choice_check_constraint_matches_sql_dump():
    check_constraints = [
        constraint
        for constraint in _sa_table(CareerSkillChoiceSkillFreeChoiceSkillLinkTable).constraints
        if isinstance(constraint, CheckConstraint)
    ]

    assert len(check_constraints) == 1
    assert check_constraints[0].name == "career_skill_not_all_null"
    assert check_constraints[0].sqltext.text == "(skill_id IS NOT NULL) OR (choice_skill_id IS NOT NULL) OR (free_choice_skill_id IS NOT NULL)"


def test_career_talent_choice_table_preserves_nullable_polymorphic_columns():
    assert _column(CareerTalentChoiceTalentFreeChoiceTalentLinkTable, "talent_id").nullable
    assert _column(CareerTalentChoiceTalentFreeChoiceTalentLinkTable, "choice_talent_id").nullable
    assert _column(CareerTalentChoiceTalentFreeChoiceTalentLinkTable, "free_choice_talent_id").nullable


def test_link_tables_translate_invalid_identity_columns_to_composite_keys():
    assert _column(ChapterMediaLinkTable, "chapter_id").identity is None
    assert _column(ChapterMediaLinkTable, "media_id").identity is None
    assert _column(ChapterInventorySlotLinkTable, "chapter_reward_id").identity is None
    assert _column(ChapterInventorySlotLinkTable, "inventory_slot_id").identity is None
    assert _column(ChapterMediaLinkTable, "chapter_id").primary_key is True
    assert _column(ChapterMediaLinkTable, "media_id").primary_key is True
    assert _column(ChapterInventorySlotLinkTable, "chapter_reward_id").primary_key is True
    assert _column(ChapterInventorySlotLinkTable, "inventory_slot_id").primary_key is True


def test_chapter_medias_unique_column_is_preserved_alongside_media_link_table():
    assert _column(ChapterTable, "medias").unique is True


def test_dice_table_dynamic_bonus_enum_matches_sql_dump():
    dynamic_bonus_column = _column(DiceTable, "dynamic_bonus")

    assert isinstance(dynamic_bonus_column.type, SAEnum)
    assert dynamic_bonus_column.type.name == "dynamic_bonus"
    assert list(dynamic_bonus_column.type.enums) == [member.value for member in dynamic_bonus]


def test_dice_table_check_constraint_matches_sql_dump():
    check_constraints = [
        constraint.sqltext.text
        for constraint in _sa_table(DiceTable).constraints
        if isinstance(constraint, CheckConstraint)
    ]

    assert "COALESCE(faces, bonus, dynamic_bonus) IS NOT NULL" in check_constraints


def test_sql_dump_enums_preserve_values():
    assert [member.value for member in gender_enum] == ["masculin", "féminin", "autre"]
    assert [member.value for member in playable_race_enum] == ["nain", "humain", "elfe", "halfling"]
    assert [member.value for member in dynamic_bonus] == ["BE", "BF"]
    assert [member.value for member in skill_bonus] == ["0", "10", "20"]
    assert [member.value for member in quality] == ["exceptionelle", "bonne", "normale", "médiocre"]
    assert [member.value for member in location] == [
        "tete",
        "bras gauche",
        "bras droit",
        "corps",
        "jambe gauche",
        "jambe droite",
    ]