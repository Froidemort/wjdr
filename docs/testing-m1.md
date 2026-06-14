# Tests M2

Ce document couvre la strategie de test pour le livrable M2:
- creer un personnage
- enregistrer en local (IndexedDB)
- rouvrir
- modifier PV/Fortune/Destin
- exporter/importer JSON
- gerer un inventaire et l'equipement

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
- CRUD repository Dexie (create/get/list/delete)
- tri par date de mise a jour
- erreurs metier (`Character data is invalid.`, `Character not found.`)
- erreur d'import (`Character import is invalid.`)

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
- retour a la liste et verification de persistance

## 3) Suite complete

```bash
npm test
```

## 4) Notes techniques

- Les tests unitaires repository utilisent `fake-indexeddb` pour simuler IndexedDB en environnement Node.
- Les tests E2E utilisent des `data-testid` sur les composants Ionic afin d'eviter les selections fragiles.
- Le test E2E est execute en `workers: 1` pour limiter les conflits de stockage local.
