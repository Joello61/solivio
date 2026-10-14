# DESIGN.md - Solivio

Système de design du frontend web, tel qu'il est implémenté dans `solivio_frontend/app/globals.css` et `solivio_frontend/components/ui/`. Ce document décrit l'existant et les règles pour le faire évoluer ; le code reste la référence des valeurs exactes. Le catalogue vivant des primitives est la page `/design` (développement uniquement).

## 1. Intention : une distribution, une feuille

Solivio remplace un tableur. Il n'est adopté que s'il est **plus simple et plus agréable** que lui (`PRODUCT.md`). Le système de design sert cette seule idée : chaque écran dit ce qui se passe et ce qu'il reste à faire.

Quatre motifs signature, chacun justifié par un besoin documenté :

- **Le rail.** Le cycle de vie d'une distribution, d'un événement, d'une session ou d'une mission est une position sur un trajet (Préparer, Publier, Remplir, Jour J, Bilan), avec une seule action principale. Le statut n'est pas qu'un badge.
- **Le billet.** Une inscription se présente comme un billet : jour, horaire, lieu, statut. S'inscrire doit être "aussi neutre et digne que réserver un créneau" (`docs/parcours_utilisateurs.md`, section 2).
- **La jauge.** Un seul composant de remplissage (confirmés, liste d'attente hachurée, places restantes) pour toutes les capacités.
- **La ligne dense.** Le meilleur du tableur sans sa fragilité : listes compactes à une ligne par personne, tableaux triables sur ordinateur.

Principes :

- **Mobile d'abord, jamais mobile uniquement** : l'inscription et le pointage sont pensés pour le pouce, la gestion reste confortable sur ordinateur.
- **L'information utile en premier** : jour, heure, lieu, places restantes, avant tout décor. Pas de photo d'illustration, pas d'icône décorative dans un carré coloré.
- **Une action principale par écran** ; les actions rares et destructrices vont dans le menu "Plus" (`ActionMenu`).
- **Respect des personnes** : aucun libellé stigmatisant, aucune donnée sensible hors des écrans autorisés, formes non genrées dans les statuts.
- **Sobriété du mouvement** : transitions d'état de 150 à 200 ms, aucune transition de page, tout désactivé sous `prefers-reduced-motion`.

## 2. Couleurs

Tokens en OKLCH dans `app/globals.css` (Tailwind CSS v4, `@theme inline`). Les composants n'utilisent que les tokens sémantiques, jamais une couleur codée en dur ni une variante `dark:` de couleur : les tokens s'adaptent au mode. Un test (`__tests__/design/couleurs.test.ts`) le vérifie.

| Rôle | Token | Clair | Sens |
|---|---|---|---|
| Papier | `--background` | `#F4F5F2` | Fond de page, légèrement vert |
| Carte | `--card` | blanc | Surfaces posées sur le papier |
| Encre | `--foreground` | `#14201A` | Texte, titres, toasts (en négatif) |
| Encre secondaire | `--muted-foreground` | `#56605A` | Texte d'appoint (contraste 6:1 sur le papier) |
| Papier enfoncé | `--muted` | `#ECEEEA` | Fond des contrôles segmentés, survols |
| Pin | `--primary` | `#17513F` | Action principale, confirmé, étape faite |
| Pin pâle | `--secondary` | `#E3EEE8` | Sélection, état ouvert |
| Citron | `--accent` | `#F3C93B` | **Maintenant** : en cours, jour J, étape courante. Toujours avec texte encre |
| Citron en texte | `--accent-strong` | `#7A5800` | Citron lisible sur papier |
| Bordures, champs | `--border`, `--input` | `#DCE0DA`, `#C9CFC8` | Le contour des champs est plus marqué que celui des cartes |
| Rouge | `--destructive` | `#B3261E` | Erreur et destruction, rien d'autre |
| Succès, attente, info | `--success`, `--warning`, `--info` | | Texte et icônes ; fonds légers par transparence (`bg-warning/12`) |
| Marque | `--brand`, `--brand-deep`, `--on-brand` | pin, blanc | Billet et bandeaux, identiques dans les deux modes |
| Voile | `--overlay` | noir | Modales et feuilles |

Le mode sombre (classe `.dark`, `next-themes`) redéfinit les mêmes tokens : papier vert très profond, pin éclairci (`#5FBF97`) avec texte sombre, citron inchangé.

Règles :

- La couleur ne porte jamais seule une information : couleur, libellé, et parfois une forme (point du statut en cours, hachures de la liste d'attente, pointillés du brouillon).
- Le citron est réservé à ce qui se passe maintenant. Le passé s'efface en gris.
- Contrastes vérifiés au calcul pour le texte (AA) ; audit automatisé `@axe-core/playwright` prévu au lot 10 de la refonte.

## 3. Typographie

| Usage | Police | Variable |
|---|---|---|
| Texte courant | Atkinson Hyperlegible Next | `--font-sans` |
| Titres et grands chiffres | Bricolage Grotesque | `--font-display` |
| Dates du billet, compteurs, en-têtes de tableau | Atkinson Hyperlegible Mono | `--font-mono` |

Chargées par `next/font/google` dans `app/layout.tsx`. Atkinson Hyperlegible a été dessinée pour la lisibilité (lettres sans ambiguïté), utile à un public large et divers.

- **Aucun texte sous 13 px** : `text-xs` est remonté à 13 px, et les tailles arbitraires en pixels sont interdites (test).
- **Échelle** : texte courant en `text-base` (16 px), texte d'appoint en `text-sm`, titres de page en `text-3xl` sur mobile et `text-4xl` sur ordinateur (`PageHeader`).
- **Chiffres** : `tabular-nums` pour les quantités et les compteurs.

## 4. Formes, élévation, mouvement

- **Rayons** : rayon de base `--radius: 0.625rem` (10 px) pour les boutons et les champs, `rounded-xl` pour les cartes, `rounded-2xl` pour le billet et les feuilles. Pas de champ en pilule ; la pilule est réservée aux statuts.
- **Élévation** : à plat par défaut, les cartes n'ont qu'une bordure. L'ombre est réservée à ce qui flotte (menus, feuilles, toasts) et aux modales. Pas d'ombre colorée.
- **Mouvement** : animations courtes (tokens `--animate-*`), toutes désactivées sous `prefers-reduced-motion: reduce`.
- **Empilement** : échelle `--z-base` à `--z-tooltip`, jamais de `z-index` arbitraire.

## 5. Composants

Primitives dans `components/ui/` (fondées sur `@base-ui/react`).

| Primitive | Rôle |
|---|---|
| `button` | Tailles `default` 44 px (cible tactile), `sm` 36 px (tableaux denses), `xl` 56 px (jour J). Variantes : `default` (pin), `outline`, `secondary`, `ghost`, `accent` (citron), `destructive` (discrète), `destructive-solid` (confirmation dans une boîte de dialogue uniquement), `link` |
| `input`, `password-input`, `textarea`, `select`, `checkbox`, `radio-group`, `switch`, `label`, `form-field` | Champs de 44 px, libellé visible en gras, aide et erreur sous le champ |
| `badge`, `statut` | `Statut` affiche un statut à partir de `lib/libelles.ts`, qui donne libellé et ton pour tous les modules |
| `jauge`, `rail`, `billet` | Motifs signature (section 1) |
| `page-header` | Titre, surtitre, contexte, lien retour, action principale |
| `segmented-control` | Filtre à choix unique, visuellement distinct d'un statut |
| `search-field` | Recherche avec effacement |
| `list-row` | Liste dense, une ligne par élément |
| `data-table` | Tableau triable sur ordinateur |
| `stat` | Un chiffre et ce qu'il compte, posé en ligne |
| `action-menu` | Menu "Plus" ; les actions destructrices sont séparées en bas |
| `sheet` | Panneau qui monte du bas sur téléphone, latéral sur ordinateur |
| `dialog`, `alert-dialog` | Confirmations |
| `card`, `empty-state`, `skeleton`, `spinner`, `alert`, `tabs`, `tooltip`, `breadcrumb`, `separator`, `sonner`, `theme-toggle` | Structure et états |

Règles :

- **Icônes** : `lucide-react` uniquement ; jamais d'emoji.
- **`Button` n'a pas de prop `asChild`** : pour un lien stylé en bouton, appliquer `buttonVariants()` sur `Link`.
- **Listes** : une liste de plus de quelques éléments est une liste dense (`List`, `ListRow`) ou un tableau, jamais une pile de cartes.
- **États obligatoires pour tout écran de données** : chargement (`skeleton`), vide (`empty-state` avec une action), erreur (message actionnable), succès discret (toast). Une action réversible propose "Annuler" dans le toast.
- **Formulaires** : une colonne, `form-field` associe libellé visible, champ, aide et erreur ; jamais de placeholder qui porte une valeur.

## 6. Contenu

- **Langue** : français, phrases courtes, vocabulaire du glossaire (`docs/glossaire.md`) : distribution, créneau, inscription, liste d'attente, pointage, dotation.
- **Libellés de statut** : centralisés dans `lib/libelles.ts`, sans forme "(e)".
- **Ton** : direct et bienveillant ; jamais de jargon technique côté bénéficiaire.
- **Messages d'erreur** : ils disent quoi faire, pas seulement ce qui ne va pas.
- **Typographie** : aucun caractère typographique décoratif (`CLAUDE.md`, section 8).

## 7. Accessibilité

Cible WCAG 2.2 AA :

- HTML sémantique et navigation clavier complète ;
- focus toujours visible (`outline-ring`) ;
- gestion du focus à l'ouverture et à la fermeture des modales et des feuilles ;
- `aria-live` pour les notifications ;
- jauges exposées en `meter`, étape courante du rail en `aria-current="step"` ;
- cibles tactiles de 44 px ;
- animations réduites sur demande du système.

## 8. Faire évoluer le système

- Une nouvelle couleur ou un nouveau rayon s'ajoute comme token dans `globals.css`, jamais en dur dans un composant.
- Un nouveau composant `ui` n'est créé que lorsqu'un motif se répète au moins deux fois, et il est ajouté au catalogue `/design`.
- Toute évolution visible de ce système met à jour ce document.
