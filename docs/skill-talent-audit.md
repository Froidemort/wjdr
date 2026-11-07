# Inventaire des compétences et talents

## Méthode et limites

Lancer depuis la racine `python scripts/data/audit_compendium_links.py` avec les dépendances Python du projet. Le programme lit le seed versionné `data/seed/public_data.sql` et le PDF local `data/sources/compendium_skills_talents.pdf`, sans charger de configuration, se connecter à une base ou écrire des données. Le seed est une entrée de référence nécessaire à cette comparaison, en dehors du répertoire des sources PDF.

Il charge uniquement les deux blocs INSERT dans SQLite en mémoire, extrait la première table détectée de chaque page et compare les noms après normalisation et quelques exceptions du script d'extraction existant. Les mentions sont comptées au niveau du nom, non de l'identifiant ou de la spécialisation. Ce n'est ni un importeur ni une preuve de l'exactitude des liens.

Tests du script : `python -m unittest discover -s tests/unit -p test_audit_compendium_links.py`.

## Résultats locaux

| Mesure | Résultat |
| --- | ---: |
| Lignes de compétences / noms distincts | 150 / 49 |
| Compétences spécialisées | 109 |
| Lignes de talents / noms distincts | 140 / 91 |
| Talents spécialisés | 55 |
| Lignes de compétences du PDF / mentions de talents | 49 / 55 |
| Mentions rapprochées par nom des deux côtés | 39 |
| Noms de compétences / talents non rapprochés | 2 / 9 |
| INSERT dans `skills_talents` dans ce seed | 0 |

Les divergences comprennent des pluriels, des orthographes et des noms tronqués ; elles nécessitent une vérification manuelle. L'absence d'INSERT dans ce fichier ne signifie pas que la table déployée est vide. Les autres tables du PDF et les effets hors de la colonne étudiée ne sont pas un inventaire exhaustif des règles.

## Cas métier et fiabilité

- Perception est une compétence de base liée à Int. Le seed décrit Acuité auditive comme « Perception des sons +20% », tandis que la cellule correspondante du PDF indique +10%. Ces sources divergent : ne pas calculer automatiquement et faire arbitrer la source de vérité.
- Calcul mental concerne plusieurs compétences avec une condition d'estimation pour Perception ; Connaissances des pièges concerne notamment la détection de pièges. Une association n'est pas une augmentation générale de la caractéristique.
- Force accrue mentionne directement Force ; Adresse au tir et Combat de rue concernent des actions particulières. Un modèle limité aux liens compétence–talent ne couvre donc pas tous les effets directs.
- Les noms spécialisés exigent une revue au cas par cas. Des rapprochements textuels automatiques peuvent créer des faux positifs ou omettre des liens.
- `listCharacterLinksBundle` enrichit uniquement les compétences possédées avec les talents également possédés. Les compétences de base absentes de la fiche ne sont donc pas déduites. `listCharacterLinksBundlesByIds`, utilisé pour les fiches groupées, ne les enrichit pas.
- Le cache des liens est en mémoire ; ce constat ne garantit pas leur disponibilité après rechargement hors ligne. Les erreurs de lecture ne doivent pas être interprétées comme une absence d'effets.
- `skills_talents_links.py` écrit vers `skills_talents_links` en chemin direct, mais vers `skills_talents` en réappliquant un dry run. Ne pas exécuter ce script pour corriger les données avant d'examiner cette incohérence et son initialisation de client à l'import.

## Périmètre retenu et suites

Pour #112, choix confirmé : afficher uniquement les liens disponibles entre compétences et talents possédés, leur description et leur contexte, avec une limite de couverture explicite. Aucun bonus n'est appliqué aux caractéristiques. Une relation signifie « potentiellement pertinent », pas « applicable à tous les tests ».

La vérification de la base réelle reste ouverte : compter les lignes de `skills`, `talents` et `skills_talents`, les compétences et talents non liés, puis contrôler manuellement les spécialisations et les exemples. Vérifier également l'actualisation et l'accès hors ligne sur des données réellement chargées ; ne pas exposer de données personnelles pour cet audit.

Ordre estimatif pour une couverture plus complète : inventaire et revue des données réelles (0,5–1,5 jour), correction des correspondances et arbitrage des sources (1–3 jours selon anomalies), puis modèle d'effets structurés, migration, synchronisation et tests (3–6 jours). Ces estimations restent indicatives tant que la couverture de la base et la décision sur les effets directs ne sont pas connues.
