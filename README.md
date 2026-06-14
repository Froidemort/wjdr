# Warhammer Sheet (M4)

Application offline-first de gestion de fiches Warhammer JDR V2.

Perimetre actuel:

- creer un personnage
- enregistrer en local
- rouvrir et modifier PV / Fortune / Destin
- exporter/importer JSON
- gerer un inventaire et l'equipement (quantite, poids, equipe)
- gerer l'argent en co / pa / s avec conversion automatique
- afficher les caracteristiques principales (CC, CT, F, E, Ag, Int, FM, Soc)
- afficher les caracteristiques secondaires (A, M, BF, BE, Mag, PF)
- editer les caracteristiques principales (base et avance)
- editer les caracteristiques secondaires (actions, mouvement, magie, folie)

## Commandes

```bash
npm install
npm run dev
npm run build
```

## Tests

```bash
npm run test:unit
npm run test:e2e
npm test
```

Smoke deploye preview/prod:

```bash
PLAYWRIGHT_BASE_URL=https://your-preview-url.vercel.app npm run test:e2e:deploy
```

## Deploy Vercel

Build Vercel:

```bash
npm run build
```

Points couverts:

- SPA fallback sur `/index.html`
- cache long sur assets Vite versionnes
- `no-cache` sur service worker et manifest
- smoke test deployee sur app shell, manifest et service worker

Documentation detaillee des tests M1:

- `docs/testing-m1.md`
