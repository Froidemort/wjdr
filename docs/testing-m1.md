# Tests M4

Ce document couvre la strategie de test pour le livrable M4:
- creer un personnage
- enregistrer en local (IndexedDB)
- rouvrir
- modifier PV/Fortune/Destin
- exporter/importer JSON
- gerer un inventaire et l'équipement
- gerer la monnaie co/pa/s avec coercition automatique
- afficher les caracteristiques principales et secondaires
- editer les caracteristiques principales (base et avance)
- editer les caracteristiques secondaires

## 1) Tests unitaires

Commande:

```bash
npm run test:unit
```

Couverture actuelle:
- `tests/unit/character.test.ts`
- `tests/unit/characterRepository.test.ts`

Points verifies:
- creation de personnage (defaults, trim du nom, id)
- calcul base + advance des caracteristiques
- clamp des ressources (PV/Fortune/Destin)
- validation du modele metier
- serialisation JSON d'export
- parsing et validation d'un import JSON
- normalisation et validation de l'inventaire
- conversion monetaire automatique (co/pa/s)
- CRUD repository Dexie (create/get/list/delete)
- tri par date de mise a jour
- erreurs metier (`Character data is invalid.`, `Character not found.`)
- erreur d'import (`Character import is invalid.`)
- calcul bonus force = dizaines de F
- calcul bonus endurance = dizaines de E
- initialisation des caracteristiques secondaires (actions, mouvement, magie, folie)
- validation des contraintes des caracteristiques secondaires
- import retrocompatible des caracteristiques secondaires (defaults si manquants)
- formatage des caracteristiques principales en pourcentage (CC, CT, F, E, Ag, Int, FM, Soc)

## 2) Tests fonctionnels E2E

Commande:

```bash
npm run test:e2e
```

Configuration:
- `playwright.config.ts`
- serveur de test: `npm run dev -- --host 127.0.0.1 --port 4173`

Scenario M1 couvert:
- creation d'un personnage depuis l'ecran liste
- ouverture automatique de la fiche
- modification rapide des ressources en mode jeu
- passage en mode edition et sauvegarde
- export JSON (telechargement)
- import du fichier JSON exporte
- edition des ressources et de l'inventaire/equipement
- coercition monetaire en edition (40 pa -> 2 co, 15 s -> 1 pa et 3 s)
- edition des caracteristiques principales en mode edition
- retour a la liste et verification de persistance
- verification que les sections de caracteristiques principales et secondaires s'affichent
- verification que les valeurs editables (A, M, Mag, PF) s'affichent en edition

## 3) Suite complete

```bash
npm test
```

## 4) Notes techniques

- Les tests unitaires repository utilisent `fake-indexeddb` pour simuler IndexedDB en environnement Node.
- Les tests E2E utilisent des `data-testid` sur les composants Ionic afin d'eviter les selections fragiles.
- Le test E2E est execute en `workers: 1` pour limiter les conflits de stockage local.
