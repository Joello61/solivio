# DESIGN.md - Solivio

Système de design du frontend web, tel qu'il est implémenté dans `solivio_frontend/app/globals.css` et `solivio_frontend/components/ui/`. Ce document décrit l'existant et les règles pour le faire évoluer ; il ne remplace pas le code, qui reste la référence des valeurs exactes.

## 1. Intention

Solivio est utilisé par des bénévoles pressés le jour d'une distribution et par des bénéficiaires, souvent sur téléphone. L'interface doit être **plus simple que le tableur qu'elle remplace** (`docs/specifications_fonctionnelles.md`, section 7) : lisible d'un coup d'oeil, chaleureuse sans être enfantine, sobre sans être froide.

Principes :

- **Mobile d'abord** : inscription et pointage pensés pour une main et un petit écran, puis enrichis pour l'ordinateur.
- **L'information utile en premier** : date, lieu, places restantes avant tout décor.
- **Respect des personnes** : aucun visuel ni libellé stigmatisant, aucune donnée sensible affichée hors des écrans autorisés.
- **Sobriété** : un composant n'existe que parce qu'un besoin se répète.

## 2. Couleurs

Tokens définis en OKLCH dans `app/globals.css` (Tailwind CSS v4, `@theme inline`). Les composants n'utilisent que les tokens sémantiques, jamais une couleur codée en dur.

| Rôle | Token | Valeur (mode clair) |
|---|---|---|
| Primaire (teal) | `--primary` | `oklch(0.532 0.118 185)`, proche de `#0D9488` |
| Accent chaud (corail) | `--accent` | `oklch(0.706 0.213 47)`, proche de `#F97316` |
| Destructif | `--destructive` | `oklch(0.577 0.245 27)` |
| Fond | `--background` | blanc très légèrement chaud |
| Cartes | `--card` | blanc pur |
| Texte | `--foreground` | neutre très sombre |
| Bordures, champs | `--border`, `--input` | neutre clair |
| Succès | `--success` | vert, lisible en texte (`bg-success/10` pour un fond léger) |
| Avertissement | `--warning` | ambre, lisible en texte |
| Information | `--info` | bleu, lisible en texte |
| Corail en texte | `--accent-strong` | corail foncé (l'accent sert aux fonds) |
| Voile | `--overlay` | noir, dans les deux modes (modales, images) |
| Surfaces de marque | `--brand`, `--brand-deep`, `--on-brand` | turquoise et texte blanc identiques dans les deux modes : bandeaux, appels à l'action, texte posé sur une photo |

Palettes primitives : `teal`, `coral`, `neutral` (50 à 950). Le mode sombre (classe `.dark`, `next-themes`) redéfinit les mêmes tokens. Les primitives ne servent qu'à définir les tokens : un composant n'utilise ni primitive ni couleur Tailwind par défaut (`bg-white`, `red-*`...), ni variante `dark:` de couleur, puisque les tokens s'adaptent au mode. Un test (`__tests__/design/couleurs.test.ts`) le vérifie.

Règles :

- La couleur ne porte jamais seule une information : toujours couleur + icône + libellé (statut d'inscription, liste d'attente, présence).
- L'accent corail est réservé aux appels à l'action secondaires et aux mises en avant ; il n'est jamais utilisé pour une erreur.
- Contraste visé WCAG 2.2 AA. Point ouvert : le contraste du texte blanc sur l'accent et des textes `muted-foreground` n'a pas encore été vérifié par un outil automatisé (à faire avec `@axe-core/playwright` dans les tests de bout en bout).

## 3. Typographie

| Usage | Police | Variable |
|---|---|---|
| Texte courant | DM Sans | `--font-sans` |
| Titres (`h1` à `h4`) | Plus Jakarta Sans | `--font-display` |
| Code, identifiants | Geist Mono | `--font-mono` |

Chargées par `next/font/google` dans `app/layout.tsx`. Hiérarchie par la taille et la graisse ; chiffres tabulaires pour les quantités et les compteurs.

## 4. Formes, élévation, mouvement

- Rayon de base `--radius: 0.75rem`, échelle `--radius-xs` à `--radius-3xl`.
- Élévation en niveaux (`--shadow-xs` à `--shadow-2xl`) : à plat par défaut, ombre légère pour les cartes, plus marquée pour les menus et les modales. Ombres colorées (`--shadow-primary`, `--shadow-accent`) réservées aux boutons d'action principale.
- Animations courtes (180 à 350 ms) définies comme tokens `--animate-*`. Toutes sont désactivées sous `prefers-reduced-motion: reduce`.
- Échelle d'empilement `--z-base` à `--z-tooltip` : ne jamais utiliser de `z-index` arbitraire.

## 5. Composants

Primitives dans `components/ui/` (style shadcn `base-nova`, fondé sur `@base-ui/react`) : `button`, `input`, `password-input`, `textarea`, `select`, `checkbox`, `radio-group`, `switch`, `label`, `form-field`, `card`, `badge`, `alert`, `alert-dialog`, `dialog`, `tabs`, `tooltip`, `breadcrumb`, `separator`, `skeleton`, `spinner`, `empty-state`, `data-table`, `sonner` (notifications), `theme-toggle`.

Règles :

- Icônes : `lucide-react` uniquement ; jamais d'emoji.
- `Button` n'a pas de prop `asChild` : pour un lien stylé en bouton, appliquer `buttonVariants()` sur `Link`.
- États obligatoires pour tout écran de données : chargement (`skeleton`), vide (`empty-state` avec une action), erreur (message actionnable), succès discret (`sonner`).
- Formulaires : `form-field` associe libellé visible, champ et message d'erreur ; jamais de placeholder seul.
- Tableaux denses sur ordinateur, transformés en cartes priorisées sur mobile plutôt qu'un défilement horizontal.

## 6. Contenu

- Français, phrases courtes, vocabulaire du glossaire (`docs/glossaire.md`) : distribution, créneau, inscription, liste d'attente, pointage, dotation.
- Ton direct et bienveillant ; jamais de jargon technique côté bénéficiaire.
- Les messages d'erreur disent quoi faire, pas seulement ce qui ne va pas.
- Aucun caractère typographique décoratif (voir `CLAUDE.md`, section 8).

## 7. Accessibilité

Cible WCAG 2.2 AA : HTML sémantique, navigation clavier complète, focus toujours visible (`outline-ring`), gestion du focus à l'ouverture et à la fermeture des modales, `aria-live` pour les notifications, cibles tactiles confortables sur mobile, animations réduites sur demande du système.

## 8. Faire évoluer le système

- Une nouvelle couleur ou un nouveau rayon s'ajoute comme token dans `globals.css`, jamais en dur dans un composant.
- Un nouveau composant `ui` n'est créé que lorsqu'un motif se répète au moins deux fois.
- Toute évolution visible de ce système met à jour ce document.
