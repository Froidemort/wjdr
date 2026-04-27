# TODO

Liste des TODO extraits du code source du projet.

## src/wjdr/models.py

1. Ligne 460
   add an SQL event to automatically coerce the currency to a correct resprensentation (1 gold crown = 20 silver shillings = 240 brass pennies).

2. Ligne 466
   add constraints to ensure that either damage_id or armour_points and armour_location are set, but not both.

3. Ligne 535
   add mental illness many-to-many relationship to list potential mental illness of the character.

4. Ligne 638
   use enum for astral_sign, because the number of astral sign is limited.

5. Lignes 659-660 (multiligne)
   add constraints to ensure that total_attributes is always equal to base_attributes + the sum of the attributes of the current careers of the character.
   this contraints is complex to modelize, because it involves a lot of tables (PlayableCharacterTable, AttributesTable, CareerTable) and a lot of relationships (PlayableCharacterTable -> CareerTable through PlayableCharacterCareerLinkTable, CareerTable -> AttributesTable, PlayableCharacterTable -> AttributesTable for both base_attributes and total_attributes), but it is important to ensure data consistency.

6. Ligne 663
   consider adding a many-to-many relationship between PlayableCharacterTable and CampaignTable.

## src/wjdr/rules/factory.py

1. Ligne 135
   implement the skill and talents for races.
