# Workflows GitHub Actions

## `ci.yml`

- Déclenché sur les pushes vers `main` / `master` / `develop`, sur toutes les **pull requests**, et manuellement (**Actions** → **CI** → **Run workflow**).
- Étapes : `npm ci` → `npm run lint` → `npm run typecheck`.
- **Prérequis** : commiter `package-lock.json` pour que `npm ci` fonctionne sur le runner.

## `supabase-edge-functions.yml`

- Vérifie les Edge Functions avec **Deno** (`deno check` sur chaque `supabase/functions/**/index.ts`).
- Ne se lance que si des fichiers sous `supabase/functions/` changent (ou via exécution manuelle).

## Dépannage

- Si le lint échoue en local, exécuter `npm ci` (ou `npm install`) pour aligner les paquets avec le lockfile.
- Pour ajouter plus tard un build **EAS** ou des déploiements, créer un workflow dédié avec les secrets (`EXPO_TOKEN`, etc.) dans **Settings → Secrets and variables → Actions**.
