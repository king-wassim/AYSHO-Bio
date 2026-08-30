# Tests & CI

La CI (`.github/workflows/ci.yml`) est déclenchée sur chaque push vers `main`/`develop`
et chaque pull request : lint, typecheck, tests, builds Docker de vérification, scans.

## Suite de tests

### Frontend (Vitest + Testing Library, jsdom)

```bash
cd frontend
npm run test          # vitest run
npm run test:watch
npm run typecheck     # tsc --noEmit (effectué aussi en CI)
npx eslint src --ext .ts,.tsx
```

Fichiers :

- `frontend/src/lib/api.test.ts` : `resolveMediaUrl`, `joinApi`, `optimizeMediaUrl`
  (URLs Cloudinary absolues / relative / opts de rendu).
- `frontend/src/store/CatalogContext.test.tsx` : normalisation des réponses Strapi v5
  (formes `attributes` et flat), résolution des médias, gestion d'erreurs réseau.
- `frontend/vitest.config.ts` force `VITE_STRAPI_URL=''` (mode same-origin quel que soit
  le `.env` local) et `jsdom` avec setup Testing Library.

### Backend (lint + tsc + build Strapi)

```bash
cd backend
npm run lint
npx tsc --noEmit
npm run build         # strapi build
```

Pas de tests unitaires pour le moment (le CLI `vitest` est configuré mais aucun fichier de
test) : la CI exécute le lint/tsc/build et le boot du container avec PostgreSQL de test.

## Qualité / sécurité CI

- Trivy (filesystem, severité CRITICAL/HIGH) → résultats publiés sur GitHub Security.
- `npm audit --audit-level=high` (frontend + backend) — ne bloque pas le build (exploits
  de dev tolérés).
- Vérification du boot réel des images : frontend `/health` sur :80, backend `/api/health`
  branché sur un PostgreSQL de test.

## CD

`.github/workflows/cd.yml` : sur `push main` → build & push GHCR (tags `sha-long` + `latest`)
→ SSH VPS → `deploy.sh` (pull, `up -d`, destructions smoke tests HTTPS). Voir
[deployment.md](./deployment.md).