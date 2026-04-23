# TODO

Liste des TODO extraits du code source du projet.

## src/wjdr/database.py

1. Ligne 18
   Use Alembic to manage migrations instead of creating tables directly from the models.

## src/wjdr/models.py

1. Ligne 295
   add an SQL event to automatically coerce the currency to a correct resprensentation (1 gold crown = 20 silver shillings = 240 brass pennies).

2. Ligne 308
   add constraints to ensure that either damage_id or armour_points and armour_location are set, but not both.

3. Lignes 485-486 (multiligne)
   add constraints to ensure that total_attributes is always equal to base_attributes + the sum of the attributes of the current careers of the character.
   this contraints is complex to modelize, because it involves a lot of tables (PlayableCharacterTable, AttributesTable, CareerTable) and a lot of relationships (PlayableCharacterTable -> CareerTable through PlayableCharacterCareerLinkTable, CareerTable -> AttributesTable, PlayableCharacterTable -> AttributesTable for both base_attributes and total_attributes), but it is important to ensure data consistency.

4. Ligne 489
   consider adding a many-to-many relationship between PlayableCharacterTable and CampaignTable.

5. Lignes 505-511 (multiligne)
   add a NonPlayableCharacterTable with the same fields as PlayableCharacterTable.
   The differences are :
   - attributes of a non playable character are not split into base and total attributes, because they don't have careers and don't evolve with experience points.
   - a non playable character eventually have a career (optional), but not a list
   - a non playable character don't have "equipments", but "spoils".
   - race is not in an enum, but a free text field, or a link to a RaceTable, because there are a lot of non playable character races, and we should not limit them to the 4 playable.
   - a non playable character don't have personal details, description is enough to describe them. But, a "special rules" could be added.
   - a non playable character can be linked to a campaign, a scenario and a chapter, to know where they appear in the story.
