# Tests

| Type | Commande | Emplacement |
| --- | --- | --- |
| Unitaires (Vitest, projet `unit`) | `npm run test:unit` | `tests/unit/` |
| Composants (Vitest, projet `storybook`) | `npm run test:storybook` | `src/stories/` |
| E2E (Playwright) | `npm run test:e2e` | `tests/e2e/` |
| E2E sur build prévisualisé | `npm run test:e2e:deploy` | `playwright.deploy.config.ts` |
| Couverture | `npm run coverage` | rapport dans `coverage/` (ignoré par git) |

## Unitaires

Environnement Node, setup IndexedDB dans `tests/setup/`. Seuils de couverture configurés dans `vitest.config.ts` pour `services`, `stores`, `composables`, `utils`, `router` et `server`.

Un test ciblé : `npx vitest run --project unit tests/unit/<fichier>.test.ts`.

## E2E

- Serveur lancé par Playwright : `npm run dev` sur `127.0.0.1:4173` (config par défaut), `build` puis `preview` pour la config deploy.
- `PLAYWRIGHT_BASE_URL` : cible un déploiement existant au lieu du serveur local.
- Utilisateur connecté et Supabase simulé : fixture `tests/e2e/fixtures/supabaseAuth.ts` (voir le skill `e2e-auth-mock` dans `.github/skills/`).
- Installer les navigateurs si besoin : `npx playwright install`.

## Storybook

`npm run storybook` (port 6006). Les stories sont dans `src/stories/`.

## Qualité

```bash
./node_modules/.bin/eslint .   # lint complet
npm run typecheck
prek run --files <fichiers>    # hooks de qualité
```

CI (`.github/workflows/ci.yml`) : lint + typecheck, `npm audit`, tests unitaires, e2e, build.
