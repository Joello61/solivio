# Spécifications fonctionnelles - Solivio

> Ce que le produit fait concrètement, module par module, et où passe la ligne de la première version.

**Document structurant - version 1.1**
**Statut : référence de travail**
**Dernière mise à jour : juin 2026**

> Changement depuis la version 1.0 : ajout en V1 du module Répartition des denrées (calcul de dotation par bénéficiaire pour une distribution), à la demande du porteur, sur la base d'un besoin opérationnel réel observé.

## Avertissement de lecture

Ce document décrit les fonctionnalités de Solivio. C'est le premier document de la phase structurante : il traduit les intentions et les contraintes des documents fondateurs en fonctions concrètes.

Deux disciplines le gouvernent, héritées des documents précédents :

1. **La centralité du bénéficiaire et du cycle de distribution** (analyse de la concurrence) : c'est le cœur fonctionnel, celui qui doit être le plus soigné, parce que c'est là qu'aucun concurrent ne se trouve.
2. **La discipline de périmètre** (étude de faisabilité) : la première version est volontairement minimale. Tout ce qui peut attendre attend. Ce document distingue donc rigoureusement ce qui est fait tout de suite de ce qui est repoussé.

Ce document décrit le *quoi*, jamais le *comment*. Les structures de données relèvent de `modele_donnees.md`, les technologies de `architecture_technique.md`, l'expérience concrète de `parcours_utilisateurs.md`.

## 1. Méthode de cadrage : comment les fonctions sont priorisées

Chaque fonction est classée selon trois niveaux de priorité, qui correspondent aux versions du produit.

| Niveau | Signification | Version |
|---|---|---|
| Indispensable | Sans cette fonction, le produit ne rend pas son service de base | V1 |
| Important | Renforce nettement la valeur, mais le service de base fonctionne sans | V2 |
| Souhaitable | Étend le produit vers son ambition de plateforme | V3 et au-delà |

La règle d'or, héritée de l'étude de faisabilité : **on ne commence rien d'un niveau inférieur tant que le niveau supérieur ne tourne pas en conditions réelles.** On ne touche pas à la V2 tant que la V1 n'est pas utilisée par l'association pilote sur de vraies distributions.

Une distinction supplémentaire traverse tout le document : certaines fonctions sont **visibles** (l'utilisateur les voit et les utilise) et d'autres sont **fondatrices** (invisibles mais nécessaires au socle : confidentialité, contrôle d'accès, traçabilité). Les fonctions fondatrices sont en V1 même si elles n'apportent rien de visible, parce que tout le reste repose dessus.

## 2. Les acteurs fonctionnels

Rappel de la note d'intention, sous l'angle fonctionnel. Les intitulés exacts des rôles seront configurables à terme ; ceux-ci sont les rôles de référence.

| Acteur | Ce qu'il fait dans le produit |
|---|---|
| Responsable | Configure l'association, gère les membres et les droits, voit l'ensemble et les statistiques |
| Coordinateur | Crée et gère les distributions, coordonne bénévoles et bénéficiaires sur son périmètre |
| Bénévole | S'inscrit à des créneaux, consulte ses missions, participe au pointage le jour J |
| Bénéficiaire | S'inscrit à une distribution, reçoit les informations et rappels |

Rappel essentiel : un même individu peut cumuler plusieurs rôles (un bénéficiaire peut être bénévole). Le produit gère des personnes, pas des comptes cloisonnés par rôle.

## 3. Vue d'ensemble des modules

Voici la carte complète des modules, tous niveaux confondus. Les sections suivantes détaillent chacun. Cette vue d'ensemble sert à comprendre où va le produit, sans laisser croire que tout est pour tout de suite.

| Module | Rôle | Niveau |
|---|---|---|
| Comptes et accès | Authentification, rôles, droits | V1 (fondateur) |
| Configuration de l'association | Identité visuelle, paramètres de base | V1 |
| Distributions | Créer, planifier, gérer les distributions | V1 |
| Inscriptions | Inscrire bénéficiaires et bénévoles | V1 |
| Présence | Pointage le jour de la distribution | V1 |
| Répartition des denrées | Calcul de la dotation par bénéficiaire pour une distribution | V1 |
| Notifications | Emails automatiques (confirmation, rappel, annulation) | V1 |
| Statistiques de base | Indicateurs essentiels de pilotage | V1 |
| Ressources et stocks | Suivi des denrées et ressources | V2 |
| Dons | Suivi des dons, intégration de la collecte externe | V2 |
| Configurabilité étendue | Champs et types personnalisables par l'association | V2 |
| Statistiques avancées et exports | Tableaux de bord, exports pour financeurs | V2 |
| Notifications multicanal | Ajout du SMS et des notifications push | V2 |
| Moteur de workflow configurable | États et transitions définis par l'association | V3 |
| Constructeur de formulaires | Formulaires créés par l'association sans développement | V3 |
| Organisation multi-antennes | Hiérarchie association / antennes / équipes | V3 |
| Interface de programmation et webhooks | Connexion avec des outils tiers | V3 |
| Campagnes | Gestion de campagnes et page publique | V3 |

## 4. Détail fonctionnel des modules de la V1

### 4.1 Module Comptes et accès (fondateur)

**Objectif.** Permettre à chaque personne de se connecter, et garantir que chacun n'accède qu'à ce qui le concerne.

**Fonctions indispensables (V1) :**

- Création de compte et connexion sécurisée (email et mot de passe), réinitialisation de mot de passe.
- Attribution d'un ou plusieurs rôles à une personne, au sein d'une association.
- Contrôle d'accès fondé sur le rôle, avec les règles contextuelles essentielles :
  - un coordinateur agit sur les distributions de son périmètre ;
  - un bénévole voit les distributions auxquelles il est inscrit ;
  - un bénéficiaire ne voit que ses propres inscriptions ;
  - le responsable voit l'ensemble de son association.
- Traçabilité des actions sensibles (qui a fait quoi, quand) - fondation de l'audit et exigence RGPD.

**Précision sur le contrôle d'accès.** La V1 met en place un contrôle d'accès par rôle enrichi de ces quelques règles contextuelles. Le contrôle d'accès par attributs pleinement configurable (où l'association définit elle-même des règles fines) est un objectif de maturation, pas un prérequis de la V1. On commence par les règles contextuelles essentielles, on généralise ensuite. Ce choix concilie le différenciateur du produit avec la discipline de périmètre.

### 4.2 Une seule association (décision d'octobre 2026)

Cette section décrivait à l'origine un socle multi-association (isolation de plusieurs associations sur une même instance). Depuis octobre 2026, Solivio sert uniquement Linkee Toulouse : ce socle est retiré (`architecture_technique.md`, ADR-001).

**Ce qui reste exigé en V1 :**

- L'association peut exporter l'intégralité de ses données (traduction concrète de la promesse de non-enfermement).
- Toute donnée personnelle peut être supprimée à la demande de la personne concernée (RGPD).
- Une autre association qui voudrait utiliser Solivio déploie sa propre instance (code sous licence AGPL), sans partager de base.

### 4.3 Module Configuration de l'association

**Objectif.** Permettre à l'association d'adapter l'apparence et les paramètres de base à son identité.

**Fonctions indispensables (V1) :**

- Renseigner le nom de l'association, son logo, ses couleurs principales.
- Définir les paramètres de base : fuseau horaire, langue (français en V1), coordonnées de contact.
- Gérer la liste des membres et leurs rôles.

**Repoussé (V2 et au-delà) :** la personnalisation poussée (types de ressources sur mesure, champs de profil personnalisés, modèles de messages éditables) relève de la configurabilité étendue, traitée plus loin.

### 4.4 Module Distributions

C'est le cœur du produit. Il doit être la partie la plus soignée de la V1.

**Objectif.** Permettre de créer, planifier et gérer une distribution de bout en bout.

**Fonctions indispensables (V1) :**

- Créer une distribution : intitulé, date, lieu, description.
- Définir un ou plusieurs **créneaux horaires** au sein d'une distribution (pour étaler l'affluence - besoin opérationnel réel observé sur le terrain).
- Définir des **capacités** : nombre maximal de bénéficiaires, nombre de bénévoles attendus, éventuellement par créneau.
- Gérer le **cycle de vie** de la distribution selon des états fixes : brouillon, publiée, en cours, terminée, annulée.
- Publier une distribution (la rendre visible pour les inscriptions) et l'annuler (avec notification automatique des inscrits).
- Consulter la liste des inscrits (bénéficiaires et bénévoles) d'une distribution.

**Précision sur le cycle de vie.** En V1, les états et les transitions d'une distribution sont **fixes et codés en dur** (le cycle décrit ci-dessus). La possibilité pour chaque association de définir ses propres états et transitions (par exemple ajouter une étape de validation par un responsable) relève du moteur de workflow configurable, explicitement repoussé en V3. C'est une application directe de la discipline de périmètre : on code un cycle qui marche, on le rend configurable seulement quand le besoin réel de plusieurs associations différentes est confirmé.

### 4.5 Module Inscriptions

**Objectif.** Permettre aux bénéficiaires et aux bénévoles de s'inscrire à une distribution, en respectant les règles de l'association.

**Fonctions indispensables (V1) :**

Côté bénéficiaire :
- S'inscrire à une distribution (et à un créneau si plusieurs existent), tant que la capacité n'est pas atteinte.
- Être placé en **liste d'attente** si la capacité est atteinte, et être promu automatiquement si une place se libère.
- Annuler sa propre inscription (libérant une place).
- Consulter ses inscriptions en cours et passées.

Côté bénévole :
- S'inscrire sur un créneau d'une distribution.
- Se désinscrire, en alertant le coordinateur si c'est tardif.
- Consulter ses créneaux à venir et les rôles qui lui ont été attribués.

Côté coordinateur :
- Voir en temps réel le remplissage d'une distribution (inscrits, places restantes, liste d'attente).
- Attribuer un ou plusieurs rôles aux bénévoles inscrits (distribution, réapprovisionnement, gestion des cartons, etc.). Les rôles sont définis librement ou à partir d'un catalogue propre à l'association. Un même bénévole peut cumuler plusieurs rôles.
- Consulter le nombre d'absences passées de chaque bénéficiaire dans la liste des inscrits.

**Précision sur l'inscription manuelle.** Le coordinateur ne peut pas inscrire ni désinscrire une autre personne à la place de cette personne. Chaque utilisateur gère ses propres inscriptions. Le coordinateur peut néanmoins s'inscrire lui-même en tant que bénévole sur un créneau. Ce choix préserve l'autonomie de chaque utilisateur et simplifie le modèle de contrôle d'accès en V1.

**Règles de gestion clés (détaillées en section 6) :** la fréquence d'inscription d'un bénéficiaire peut être limitée (par exemple une fois par semaine), et le comportement en cas d'absence répétée est défini.

### 4.6 Module Présence (pointage)

**Objectif.** Savoir qui est réellement venu, pour fiabiliser les statistiques et limiter le gaspillage.

**Fonctions indispensables (V1) :**

- Pointer la présence des bénéficiaires le jour de la distribution (validation simple, depuis un téléphone ou un ordinateur).
- Pointer la présence des bénévoles.
- Marquer les absences (les inscrits non venus).

**Précision sur la confidentialité.** Lors du pointage, la personne qui pointe (souvent un bénévole) ne doit voir que le strict nécessaire : le nom et le statut d'inscription, pas l'ensemble des données sensibles du bénéficiaire. C'est une règle de confidentialité à appliquer dès la V1, cohérente avec le différenciateur du produit.

**Repoussé (V2) :** le pointage par code à scanner (type QR code) est un confort, pas une nécessité. La V1 se contente d'un pointage manuel par recherche dans la liste.

### 4.7 Module Répartition des denrées

C'est l'ajout de la version 1.1. Il répond à un besoin opérationnel réel et récurrent : le jour de la distribution, savoir combien donner de chaque denrée à chaque bénéficiaire, à partir de ce qui est disponible.

**Objectif.** Pour une distribution donnée, calculer automatiquement la dotation par bénéficiaire de chaque denrée disponible, afin de préparer une répartition aussi équitable que possible à partir de ce qui a été récupéré ce jour-là. En pratique, les bénéficiaires s'inscrivant à l'avance, l'association connaît le nombre d'inscrits et prépare la répartition sur cette base avant le jour J.

**Ce que ce module est, et n'est pas.** Ce module est un **calcul de répartition propre à une distribution**. Il ne gère pas d'inventaire dans le temps, ne reporte rien d'une distribution à l'autre, et ne se connecte pas aux dons. Il est volontairement éphémère et rattaché à une seule distribution. La gestion de stock permanente (entrées, sorties, seuils, report) reste le module Ressources et stocks, repoussé en V2 (voir section 5.1). Cette frontière est ce qui permet d'inclure la répartition en V1 sans rouvrir le chantier des stocks.

**Fonctions indispensables (V1) :**

- Pour une distribution, saisir la liste des denrées disponibles. Chaque denrée comporte : un libellé (par exemple "pommes de terre"), une unité (unités, kilogrammes, litres...), et une quantité saisie **en conditionnement** : un nombre de contenants multiplié par une quantité par contenant.
- L'application calcule automatiquement la **quantité totale** de chaque denrée. Exemple : 10 sacs x 100 pommes de terre = 1 000 pommes de terre.
- L'application calcule la **dotation par bénéficiaire** de chaque denrée, par division de la quantité totale par le nombre de bénéficiaires retenu, **arrondie à l'inférieur, avec un plancher à 1** : la dotation affichée n'est jamais 0 (voir la règle ci-dessous).
- L'application affiche le **reste** (la quantité non répartie). Exemple : 1 000 / 97 bénéficiaires = 10 par personne, reste 30. Ce que l'association fait du reste est laissé à sa décision sur le terrain.
- **Cas où il n'y a pas assez pour tout le monde.** Si la quantité totale est inférieure au nombre de bénéficiaires (la division donnerait moins de 1 par personne), la dotation est fixée à 1 par personne, mais la denrée s'épuise avant d'avoir servi tout le monde. L'application l'indique clairement : "1 par personne, mais seulement pour X bénéficiaires sur Y". Exemple : 50 yaourts pour 100 inscrits donnent 1 yaourt pour 50 personnes, et 50 personnes sans yaourt. L'application ne cherche pas à résoudre ce manque - il fait partie de la réalité du terrain - elle le rend visible pour que l'association décide en connaissance de cause.
- Le coordinateur choisit la **base de calcul** du nombre de bénéficiaires :
  - sur le nombre d'**inscrits** : c'est le mode par défaut et le plus courant, puisque les bénéficiaires s'inscrivent avant et que la répartition se prépare à l'avance ;
  - sur le nombre de **présents réels**, recalculé au fur et à mesure du pointage, comme option pour ajuster la répartition si l'affluence diffère sensiblement des inscriptions (par exemple pour répartir un reste entre les présents).
- Chaque denrée est calculée indépendamment : 1 000 pommes de terre pour 100 personnes donnent 10 par personne ; 250 yaourts pour 100 personnes donnent 2 par personne et 50 de reste ; 50 yaourts pour 100 personnes donnent 1 par personne pour 50 personnes seulement.

**Lien avec les autres modules.** Ce module s'appuie sur le module Inscriptions (base par défaut) et, en option, sur le module Présence (pour le recalcul sur les présents réels). C'est pourquoi il est placé au cœur du bloc opérationnel de la V1.

**Précision sur l'arrondi selon l'unité.** Pour les denrées comptées à l'unité (pommes de terre, yaourts), l'arrondi à l'inférieur donne un entier. Pour les denrées au poids ou au volume (légumes en vrac, lait), l'arrondi se fait à un palier pratique (par exemple au demi-kilo) plutôt qu'à l'entier ; ce palier est un raffinement de présentation, le principe reste l'arrondi à l'inférieur avec affichage du reste.

**Repoussé (V2 et au-delà) :** la connexion de ce calcul à un stock permanent (où les denrées proviendraient d'un inventaire alimenté par les dons), les denrées "à volonté" ou "selon disponibilité", et la répartition pondérée (donner plus à certains profils). En V1, la répartition est égalitaire et le calcul est autonome.

### 4.8 Module Notifications

**Objectif.** Automatiser les communications liées aux distributions, qui sont aujourd'hui faites à la main.

**Fonctions indispensables (V1), par email uniquement :**

- Confirmation automatique à l'inscription.
- Rappel automatique la veille de la distribution.
- Notification automatique en cas d'annulation de la distribution.
- Notification de promotion depuis la liste d'attente (une place s'est libérée).

**Repoussé (V2) :** l'envoi de messages groupés libres, les modèles de messages éditables par l'association, et les canaux supplémentaires (SMS, notifications push). En V1, les messages ont un contenu fixe et soigné, en français.

### 4.9 Module Statistiques de base

**Objectif.** Donner à l'association une vision chiffrée fiable de son activité, impossible à obtenir avec un tableur dispersé.

**Fonctions indispensables (V1) :**

- Par distribution : nombre d'inscrits, de présents, d'absents, taux de présence.
- Sur une période : nombre de distributions, de bénéficiaires distincts servis, de bénévoles mobilisés.
- Indicateurs présentés de façon simple et lisible sur un tableau de bord.

**Précision sur la confidentialité.** Les statistiques sont présentées de manière **agrégée et pseudonymisée**. On compte des bénéficiaires, on ne les expose pas nominativement dans les tableaux de bord. C'est une exigence RGPD et éthique, applicable dès la V1.

**Repoussé (V2 et au-delà) :** les exports détaillés pour les financeurs, les tableaux de bord avancés, et les statistiques de plaidoyer sur la précarité.

## 5. Détail fonctionnel des modules ultérieurs

Ces modules ne sont pas développés en V1. Ils sont décrits ici pour donner la vision complète et pour que le modèle de données (`modele_donnees.md`) ne se ferme pas la porte à leur ajout.

### 5.1 Ressources et stocks (V2)

Suivi des denrées et ressources : catalogue de types de ressources, entrées et sorties de stock, état du stock courant, lien automatique entre les ressources consommées et les distributions, alertes de seuil. Le modèle de ressource est volontairement générique (alimentaire, matériel, humain) pour servir des associations différentes.

**Frontière avec le module Répartition des denrées (V1).** Ce module de stocks gère un inventaire *permanent dans le temps* ; le module Répartition des denrées (section 4.7), lui, ne fait qu'un calcul *ponctuel rattaché à une distribution*. Quand ce module de stocks arrivera, il pourra alimenter la répartition (les denrées disponibles proviendraient alors du stock plutôt que d'une saisie manuelle), mais la répartition reste utilisable seule, sans inventaire permanent. Les deux ne se recouvrent pas : l'un est la mémoire des stocks, l'autre est le calcul du jour J.

### 5.2 Dons (V2)

Saisie des dons monétaires et matériels, gestion des donateurs (avec option d'anonymisation), connexion à la plateforme de collecte externe (récupération des dons en ligne sans la remplacer), lien des dons matériels vers le stock. La collecte de dons en ligne elle-même n'est jamais reconstruite : elle est déléguée (cohérent avec l'analyse de la concurrence et le modèle économique).

### 5.3 Configurabilité étendue (V2)

Permettre à l'association de définir ses propres types de ressources, ses champs de profil, et d'éditer les modèles de messages. C'est le premier pas réel vers la généralisation à des associations au fonctionnement différent.

### 5.4 Statistiques avancées et exports (V2)

Tableaux de bord approfondis, exports aux formats courants pour les rapports d'activité et les demandes de subvention, indicateurs de plaidoyer que l'association choisit de rendre publics ou non.

### 5.5 Notifications multicanal (V2)

Ajout du SMS et des notifications push aux côtés de l'email, et envoi de messages groupés ciblés par segment (bénévoles, bénéficiaires).

### 5.6 Moteur de workflow configurable (V3)

Permettre à chaque association de définir ses propres états et transitions sur les distributions et autres entités (par exemple ajouter une validation par un trésorier avant publication). C'est un différenciateur fort à terme, mais lourd à construire ; il n'a de sens qu'une fois plusieurs associations aux processus différents réellement présentes.

### 5.7 Constructeur de formulaires (V3)

Permettre à l'association de créer ses propres formulaires (inscription, enquête sociale, candidature bénévole) sans développement. Remplace à terme les champs personnalisés par une vraie collecte structurée et interrogeable.

### 5.8 Organisation multi-antennes (V3)

Gérer une hiérarchie association / antennes / équipes, avec un contrôle d'accès par antenne (un responsable régional ne voit que son antenne). **Point d'attention pour le modèle de données :** même si cette fonction est repoussée, le modèle de données doit être conçu pour ne pas rendre son ajout douloureux. C'est l'enseignement de la critique reçue en amont : anticiper la structure sans la construire tout de suite.

### 5.9 Interface de programmation et webhooks (V3)

Exposer une interface documentée et des notifications d'événements pour permettre aux associations de connecter leurs propres outils.

### 5.10 Campagnes (V3)

Gérer des campagnes (collecte, sensibilisation, recrutement) avec objectif, durée et page publique.

## 6. Règles de gestion clés

Ces règles métier transverses conditionnent le comportement du produit. Elles sont en V1 sauf mention contraire.

**RG1 - Fréquence d'inscription des bénéficiaires.** L'association peut définir une limite (par exemple : un bénéficiaire ne peut s'inscrire qu'à une distribution par semaine). En V1, cette limite est un paramètre simple ; sa configuration fine par l'association est un raffinement ultérieur. Précisions retenues en octobre 2026 : la limite par défaut est d'une distribution par semaine ; la semaine est la semaine calendaire (du lundi au dimanche) de la distribution visée ; les inscriptions confirmées et celles en liste d'attente comptent, celles des distributions annulées non.

**RG2 - Unicité par distribution.** Un bénéficiaire ne peut s'inscrire qu'une fois à une même distribution (cohérent avec la règle réelle "un colis par personne par distribution").

**RG3 - Liste d'attente.** Quand la capacité est atteinte, les nouvelles inscriptions vont en liste d'attente et sont promues automatiquement, dans l'ordre, dès qu'une place se libère.

**RG4 - Absences (no-show).** Le produit compte les absences des bénéficiaires inscrits non venus. En V1, il les enregistre et les rend visibles au coordinateur. Toute action automatique en cas d'absences répétées (signalement, restriction) est un raffinement ultérieur : on observe d'abord, on automatise ensuite.

**RG5 - Confidentialité par défaut.** L'accès aux données d'un bénéficiaire est restreint par défaut. Seuls les rôles autorisés voient les données sensibles ; les bénévoles au pointage voient le minimum. Les statistiques sont toujours agrégées et pseudonymisées.

**RG6 - Annulation et information.** Toute annulation de distribution déclenche une notification automatique de tous les inscrits. Aucun inscrit ne doit se déplacer pour rien faute d'information.

**RG7 - Non-enfermement.** Une association peut à tout moment exporter et supprimer l'intégralité de ses données.

**RG8 - Répartition des denrées.** La dotation par bénéficiaire d'une denrée est égale à la quantité totale divisée par le nombre de bénéficiaires retenu, **arrondie à l'inférieur, avec un plancher à 1** (la dotation n'est jamais 0). La quantité totale est calculée à partir du conditionnement (nombre de contenants x quantité par contenant). Le nombre de bénéficiaires retenu est, par défaut, le nombre d'inscrits ; le coordinateur peut choisir le nombre de présents réels. Lorsque la quantité totale est inférieure au nombre de bénéficiaires, la dotation est de 1 par personne et la denrée s'épuise avant d'avoir servi tout le monde : l'application affiche alors le nombre de bénéficiaires servis et le nombre de bénéficiaires sans, sans chercher à corriger ce manque. Le reste éventuel est affiché. Chaque denrée est calculée indépendamment. La répartition est égalitaire en V1.

## 7. Exigences non fonctionnelles

Ces exigences ne sont pas des fonctionnalités mais des qualités que le produit doit respecter. Elles sont aussi importantes que les fonctions.

| Exigence | Attendu |
|---|---|
| Simplicité d'usage | Plus simple à utiliser que le tableau qu'il remplace. C'est la condition d'adoption (analyse de la concurrence). Priorité absolue. |
| Accessibilité mobile | Approche responsive et mobile-first, mais jamais mobile-only : conçu pour le téléphone d'abord (surtout l'inscription des bénéficiaires et le pointage), tout en restant pleinement utilisable sur ordinateur, où se font la plupart des tâches de gestion. |
| Confidentialité | Données sensibles protégées par défaut, conformité RGPD par conception. |
| Cloisonnement des données sensibles | Le profil social d'un bénéficiaire n'est visible que des rôles autorisés, jamais au pointage ni dans les statistiques. |
| Fiabilité | Le produit doit fonctionner le jour J : une panne pendant une distribution est inacceptable. |
| Performance | Réactif même quand une distribution a plusieurs centaines d'inscrits. |
| Traçabilité | Les actions sensibles sont journalisées. |
| Sobriété | Pas de fonction superflue. Chaque ajout est une dette de maintenance (principe P7). |
| Langue | Français en V1. L'architecture ne doit pas empêcher l'ajout d'autres langues plus tard. |

L'exigence de **simplicité** mérite d'être soulignée : c'est elle, plus que la richesse fonctionnelle, qui déterminera l'adoption. Un produit pauvre mais limpide sera adopté ; un produit riche mais confus sera abandonné au profit du tableur.

## 8. Ce qui est explicitement hors périmètre

Rappel et complément de la note d'intention, au niveau fonctionnel :

- Pas de comptabilité associative complète.
- Pas de collecte de paiements ou de dons en ligne reconstruite (déléguée).
- Pas de gestion documentaire (déléguée à des services existants).
- Pas de communication grand public ni de marketing de masse.
- Pas de décision automatisée sur l'éligibilité d'un bénéficiaire : le produit outille des humains, il ne décide pas à leur place.
- Pas d'onboarding self-service de nouvelles associations en V1 (l'ajout d'une association se fait manuellement au départ).

## 9. Le périmètre V1 - la ligne dans le sable

Pour qu'il n'y ait aucune ambiguïté, voici la définition exacte de la première version. Tout ce qui n'est pas dans cette liste n'est pas dans la V1.

**La V1 de Solivio permet à une association :**

1. de gérer ses membres et leurs rôles, avec un accès restreint à ce qui les concerne ;
2. de configurer son identité de base (nom, logo, couleurs) ;
3. de créer, publier, gérer et annuler des distributions avec créneaux et capacités ;
4. d'inscrire des bénéficiaires et des bénévoles, avec liste d'attente et règles de fréquence ;
5. de pointer les présences le jour de la distribution, dans le respect de la confidentialité ;
6. de calculer la répartition des denrées par bénéficiaire pour une distribution, à partir du conditionnement et du nombre d'inscrits ou de présents ;
7. d'envoyer automatiquement par email les confirmations, rappels et annulations ;
8. de consulter des statistiques de base agrégées et pseudonymisées ;
9. le tout de façon traçable, avec export des données de l'association et suppression des données personnelles.

**La V1 ne fait rien d'autre.** Elle inclut le calcul de répartition des denrées pour une distribution (point 6), mais **pas** la gestion d'un stock permanent. Et elle ne fait ni dons, ni campagnes, ni workflow configurable, ni formulaires sur mesure, ni multi-antennes, ni interface de programmation, ni SMS. Ces fonctions viendront, dans l'ordre, après que la V1 aura prouvé sa valeur en conditions réelles.

## 10. Ce que ce document implique pour la suite

- Le **modèle de données** (`modele_donnees.md`) doit structurer en priorité les entités de la V1 (personnes, rôles, distributions, créneaux, inscriptions, présences), tout en anticipant les entités ultérieures (ressources, dons, antennes) pour ne pas se fermer de portes.
- L'**architecture technique** doit garantir la confidentialité des données des bénéficiaires et la fiabilité le jour J, qui sont des exigences non négociables.
- Les **parcours utilisateurs** (`parcours_utilisateurs.md`) doivent se concentrer sur les parcours de la V1, et viser la simplicité comme priorité de conception.
- La **roadmap** (`roadmap.md`) doit ordonner la construction : fondations d'abord, puis le cœur visible, puis les notifications et les statistiques.

## 11. Synthèse en une page

**Le cœur.** Le module Distributions et le module Inscriptions sont le cœur du produit. C'est là qu'est la différence, et c'est là que doit aller le soin.

**La V1, en neuf points.** Membres et rôles, configuration de base, distributions avec créneaux, inscriptions avec liste d'attente, pointage confidentiel, répartition des denrées par bénéficiaire, notifications email, statistiques agrégées, avec export des données. Rien de plus.

**Le reste.** Stocks, dons, configurabilité étendue, statistiques avancées et SMS viennent en V2. Workflow configurable, formulaires sur mesure, multi-antennes, interface de programmation et campagnes viennent en V3 - décrits ici pour que le modèle de données les anticipe, pas pour les construire maintenant.

**Les règles qui comptent.** Fréquence d'inscription, unicité par distribution, liste d'attente automatique, comptage des absences, confidentialité par défaut, information systématique en cas d'annulation, non-enfermement.

**L'exigence reine.** La simplicité. Plus simple que le tableur, ou rien. C'est la condition d'adoption, au-dessus de toute richesse fonctionnelle.

*Fin des spécifications fonctionnelles. Document suivant : `modele_donnees.md`.*
