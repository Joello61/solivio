@AGENTS.md

# CLAUDE.md - Frontend (Next.js)

Ce fichier complète `../CLAUDE.md` (sources de vérité, pile, confidentialité, règles de code, tests, Git, workflow). **Il ne les recopie pas** : tout ce qui n'est pas spécifique au frontend s'applique ici sans modification.

Le frontend est responsable de l'expérience utilisateur, jamais de l'autorité métier ou d'autorisation, qui appartient au backend (`../solivio-api/CLAUDE.md`).

## 1. Sources de vérité spécifiques

| Document | Ce qu'il définit pour le frontend |
|---|---|
| `../docs/parcours_utilisateurs.md` | Parcours par rôle et écrans |
| `../docs/specifications_fonctionnelles.md` | Règles métier affichées, exigence mobile prioritaire |
| `../docs/glossaire.md` | Vocabulaire affiché à l'utilisateur |
| `../docs/architecture_technique.md` | Authentification, communication avec le backend |
| `../DESIGN.md` | Tokens, typographie, composants, règles d'évolution du système de design |

## 2. Versions

Next.js 16 (App Router), React 19, TypeScript strict, Tailwind CSS v4, composants internes basés sur `@base-ui/react` et le style shadcn, icônes `lucide-react`, formulaires `react-hook-form` et `zod` 4, données serveur `@tanstack/react-query`. Vérifier `package.json` avant toute supposition.

Next.js 16 diffère des versions antérieures : lire `node_modules/next/dist/docs/` et la documentation officielle avant d'utiliser une API. Points connus :

- `middleware.ts` est remplacé par `proxy.ts` (runtime Node.js).
- `next lint` n'existe plus : `npm run lint` lance ESLint directement.
- `useSearchParams()` doit être enveloppé dans une frontière `Suspense`.
- Le composant `Button` n'a pas de prop `asChild` : appliquer `buttonVariants()` sur un `Link`.
- Les variables `NEXT_PUBLIC_*` sont figées au build : jamais de configuration d'environnement qui ne serait fournie qu'à l'exécution par ce biais.

## 3. Architecture

- Pages dans `app/`, route group `(protected)` pour les écrans authentifiés.
- Composants Server par défaut ; `'use client'` uniquement quand l'interactivité l'exige.
- Composants par domaine dans `components/` ; primitives d'interface dans `components/ui`. Un composant n'est extrait que lorsqu'un motif se répète.
- Appels API centralisés dans `lib/api` ; jamais de `fetch` brut dispersé dans les composants.
- Types partagés dans `types/`, alignés sur les réponses réelles du backend.

## 4. Authentification

- Les jetons sont des cookies `HttpOnly` posés par le backend : le JavaScript ne les lit, ne les stocke et ne les manipule jamais.
- `proxy.ts` et les gardes de route sont un confort de navigation, jamais un contrôle de sécurité : le backend revalide tout.
- Un `404` du backend s'affiche comme une ressource introuvable, sans évoquer de permission.

## 5. Interface

- Texte visible en français ; aucun emoji, icônes `lucide-react` uniquement.
- Mobile d'abord : l'inscription et le pointage doivent être impeccables sur téléphone.
- Accessibilité visée WCAG 2.2 AA : HTML sémantique, labels visibles et associés, navigation clavier complète, focus visible, contrastes conformes, `prefers-reduced-motion` respecté.
- Couleurs et espacements via les tokens Tailwind de `app/globals.css`, jamais de valeur codée en dur hors du système de tokens.
- Ne jamais afficher de donnée de `profil_beneficiaire` hors des écrans explicitement autorisés par la spécification (jamais au pointage).

## 6. Formulaires

Validation `zod` (au blur et à la soumission), message d'erreur sous le champ indiquant quoi corriger, bouton désactivé pendant la soumission, succès discret. La validation frontend ne remplace jamais celle du backend.

## 7. Tests

- Unitaires : Vitest et Testing Library (`__tests__/`), environnement `happy-dom`.
- Bout en bout : Playwright (`__tests__/e2e/`), parcours critiques inscription, pointage, répartition. Les specs Playwright sont exclues de Vitest.
- Avant de terminer : `npm run lint`, `npx tsc --noEmit`, `npm test`, et `npm run build` si la tâche touche au routage ou à la configuration.
