# TODO

Liste des TODO extraits du code source du projet.

## src/wjdr/models.py

4. Lignes 659-660 (multiligne)
   add constraints to ensure that total_attributes is always equal to base_attributes + the sum of the attributes of the current careers of the character.
   this contraints is complex to modelize, because it involves a lot of tables (PlayableCharacterTable, AttributesTable, CareerTable) and a lot of relationships (PlayableCharacterTable -> CareerTable through PlayableCharacterCareerLinkTable, CareerTable -> AttributesTable, PlayableCharacterTable -> AttributesTable for both base_attributes and total_attributes), but it is important to ensure data consistency.

5. Ligne 663
   consider adding a many-to-many relationship between PlayableCharacterTable and CampaignTable.

## src/wjdr/rules/factory.py

1. Ligne 135
   implement the skill and talents for races.

## Future improvements

1. Add a dedicated table for astral signs details (description, ascendant, appearance, specific traits), and link it to `PersonalDetailTable`.
