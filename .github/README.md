# BQALI

## Badges CI/CD & stack

[![Build & Test](https://github.com/ArezkiBazizi/Bqali/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/ArezkiBazizi/Bqali/actions/workflows/ci.yml)
[![Edge Functions (Deno)](https://github.com/ArezkiBazizi/Bqali/actions/workflows/supabase-edge-functions.yml/badge.svg?branch=main)](https://github.com/ArezkiBazizi/Bqali/actions/workflows/supabase-edge-functions.yml)

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20.19-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Expo](https://img.shields.io/badge/Expo-54-000020?logo=expo&logoColor=white)](https://docs.expo.dev/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![React Native](https://img.shields.io/badge/React%20Native-0.77-61DAFB?logo=react&logoColor=white)](https://reactnative.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-Auth%20%2B%20DB-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)

[![Licence](https://img.shields.io/badge/licence-projet%20priv%C3%A9-lightgrey.svg)](#licence)
[![Stars](https://img.shields.io/github/stars/ArezkiBazizi/Bqali.svg?style=social&label=Stars)](https://github.com/ArezkiBazizi/Bqali/stargazers)

> **Note :** ce dépôt n’utilise pas Java, Gradle, Docker ni SonarCloud (contrairement à un backend JVM classique). Les badges ci‑dessus reflètent la stack **Expo / TypeScript / Supabase**. Pour un badge **SonarCloud** ou **Docker**, il faudrait ajouter le service et le workflow correspondants.

Application mobile et web pour mettre en relation **commerçants** et **clients** autour de **paniers alimentaires** à prix réduit, dans une logique de lutte contre le gaspillage.

## Description

- **Côté client** : parcourir les offres à proximité, réserver un panier, vérifier la réservation par e-mail, présenter un **QR code** au retrait, suivre les **réservations** et échanger via le **chat** avec le marchand.
- **Côté marchand** : gérer les paniers, les ventes et les réservations depuis un espace dédié (tableau de bord, création / édition de paniers, etc.).
- **Authentification** : comptes utilisateurs avec rôles (client / marchand), session persistée.

L’backend repose sur **Supabase** (PostgreSQL, Auth, temps réel selon les besoins) et des **Edge Functions** pour les traitements serveur (ex. envoi d’e-mails transactionnels).

## Architecture technique

| Couche | Rôle |
|--------|------|
| **Client** | Expo (React Native) + React pour une base de code unique **iOS**, **Android** et **Web**. |
| **Navigation** | Routage fichier avec **Expo Router** (`app/`), layouts par rôle (`(customer)`, `(merchant)`, etc.). |
| **Données** | Client Supabase (`@supabase/supabase-js`), accès aux tables via politiques RLS côté projet. |
| **État UI** | **Zustand** pour l’état global léger ; **TanStack Query** pour le cache et les requêtes async. |
| **Backend** | **Supabase** (Postgres, Auth) ; **Edge Functions** (Deno) pour la logique hors navigateur (secrets, appels API tiers). |

## Technologies

- **Runtime & UI** : [Expo SDK 54](https://docs.expo.dev/), React 18, React Native 0.77, React Native Web
- **Langage** : TypeScript
- **Navigation** : Expo Router 5, React Navigation 7
- **Backend SaaS** : [Supabase](https://supabase.com/) (Auth, base de données, Edge Functions)
- **Qualité de code** : ESLint (flat config, `eslint-config-expo`), `tsc --noEmit`
- **Divers** : QR (`qrcode`), notifications Expo, géolocalisation, scanner code-barres, etc.

## GitHub Actions

Les workflows sont dans [`.github/workflows/`](.github/workflows/).

### CI — Lint & TypeScript (`ci.yml`)

- **Déclencheurs** : push et pull requests sur `main`, `master`, `develop` ; exécution manuelle (`workflow_dispatch`).
- **Environnement** : Ubuntu, **Node.js 20.19**, cache npm.
- **Étapes** : `npm ci` → `npm run lint` (Expo / ESLint) → `npm run typecheck` (TypeScript).
- **Concurrence** : une seule exécution par workflow et par branche (`cancel-in-progress`).

### Edge Functions (Deno) (`supabase-edge-functions.yml`)

- **Déclencheurs** : changements sous `supabase/functions/**` (push / PR sur les mêmes branches) ; exécution manuelle.
- **Étapes** : installation **Deno**, cache des dépendances Deno, `deno check` sur les `index.ts` des fonctions pour valider la syntaxe et les types par rapport au runtime Edge.

> Le **déploiement** des fonctions vers Supabase (secrets, `supabase link`, etc.) reste manuel ou via un autre pipeline ; le script `deploy:send-verification-email` du `package.json` sert de raccourci local une fois la CLI configurée.

## Prérequis

- Node.js **≥ 20.19** (recommandé pour alignement avec la CI)
- npm
- Compte [Expo](https://expo.dev/) si vous utilisez EAS ou des builds cloud
- Projet Supabase avec variables `EXPO_PUBLIC_SUPABASE_URL` et `EXPO_PUBLIC_SUPABASE_ANON_KEY` (fichier `.env`, non versionné)

## Démarrage

```bash
npm install
npx expo start
```

Scripts utiles : `npm run web`, `npm run lint`, `npm run typecheck`, `npm run android` / `npm run ios` (après prébuild natif si besoin).

## Licence

Projet privé — voir le dépôt pour les conditions d’usage.
