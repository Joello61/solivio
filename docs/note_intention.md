# Note d'intention — Solivio

> Plateforme de gestion opérationnelle pour les associations de solidarité étudiante.

**Document fondateur — version 1.0**
**Statut : référence de travail**
**Dernière mise à jour : juin 2026**

> **Mise à jour d'octobre 2026.** Ce document fondateur décrit l'ambition d'origine : une plateforme mutualisée pour plusieurs associations du réseau Linkee. Depuis octobre 2026, Solivio sert uniquement Linkee Toulouse (`architecture_technique.md`, ADR-001). Les passages sur le multi-association, la mutualisation et les choix techniques d'origine (Keycloak, Kafka, OpenBao) sont conservés comme historique et ne font plus foi ; en cas d'écart, les spécifications, l'architecture et `CLAUDE.md` priment.

---

## Avertissement de lecture

Ce document est le premier d'une série de dix. Il définit le *pourquoi* et le *pour qui* du projet. Il ne décrit ni les fonctionnalités précises, ni le modèle de données, ni l'architecture technique : ces aspects sont traités dans les documents dédiés (`specifications_fonctionnelles.md`, `modele_donnees.md`, `architecture_technique.md`).

Son rôle est de poser un cadre stable. Toutes les décisions des documents suivants doivent pouvoir se justifier par rapport aux intentions exposées ici. Si une décision technique entre en contradiction avec cette note, c'est soit la décision qui est mauvaise, soit cette note qui doit être révisée consciemment — jamais ignorée silencieusement.

Les chiffres cités sont sourcés et datés. Ils ont vocation à être réactualisés : un chiffre sur la précarité étudiante a une durée de vie de douze à dix-huit mois.

---

## 1. Résumé exécutif

**Solivio** est une plateforme web de gestion opérationnelle destinée aux associations de solidarité, en premier lieu les associations étudiantes d'aide alimentaire.

Le constat de départ est simple : il existe un fossé numérique entre les grandes structures associatives, qui disposent d'équipes et d'outils dédiés, et la multitude de petites et moyennes associations qui réalisent un travail comparable sur le terrain mais gèrent tout avec des tableurs, des messageries et des formulaires gratuits détournés de leur usage. Ces outils improvisés fonctionnent un temps, puis s'effondrent dès que l'association grandit, que le bureau change, ou que le volume d'activité augmente.

Solivio vise à combler ce fossé en proposant un outil unique, configurable et respectueux des données sensibles, qui couvre le cœur opérationnel de ces associations : organiser des distributions, gérer les inscriptions des bénéficiaires et des bénévoles, suivre les ressources et les stocks, et piloter l'activité par des statistiques fiables.

Le projet repose sur trois partis pris structurants :

1. **Ne pas réinventer l'existant.** Les paiements, l'emailing de masse, le stockage de documents et l'authentification déléguée sont assurés par des services tiers éprouvés. Solivio se concentre sur ce que personne ne fait bien : la gestion opérationnelle métier des associations de solidarité.
2. **Architecture mutualisée dès le premier jour, fonctionnalités d'une seule association d'abord.** Le socle technique est conçu pour accueillir plusieurs associations indépendantes, mais les premières fonctionnalités sont construites et validées avec une association pilote réelle avant toute généralisation.
3. **Ouverture et pérennité.** Le code est destiné à être ouvert, afin qu'aucune association ne soit prisonnière de l'outil ni dépendante de la disponibilité d'une seule personne.

L'association fondatrice de référence est une association étudiante d'aide alimentaire basée à Toulouse, qui sert de terrain d'observation et de validation. Elle n'est pas le client unique du produit : elle en est le laboratoire.

---

## 2. Contexte

### 2.1 La précarité étudiante est un phénomène structurel, pas conjoncturel

La précarité étudiante n'est pas un effet passager de la crise sanitaire de 2020 ou du pic inflationniste de 2022-2023. C'est une réalité installée dans la durée.

- Selon l'Observatoire de la vie étudiante (OVE), environ un quart des étudiants déclarent des difficultés économiques importantes, et ce taux oscille autour de cette valeur depuis 2016. La crise sanitaire a rendu le problème visible ; elle ne l'a pas créé.
- Le baromètre IFOP-COP1 de la rentrée 2025 indique qu'environ un tiers des étudiants sautent régulièrement des repas pour des raisons financières, près de la moitié réduisent leurs portions, et environ un sur six a recours à l'aide alimentaire.
- Le baromètre de la FAGE (février 2025), mené auprès des bénéficiaires de ses épiceries solidaires, fait état de deux étudiants sur trois sautant des repas chaque semaine, dont une large majorité par manque d'argent, avec un impact négatif déclaré sur la réussite académique pour plus de huit bénéficiaires sur dix.

Ces chiffres proviennent de sources indépendantes et convergent : la précarité alimentaire étudiante touche structurellement une fraction significative de la population étudiante, et l'alimentation est devenue la première variable d'ajustement des budgets contraints.

> Note méthodologique : ces données sont citées à titre de cadrage. Elles seront réactualisées à chaque révision majeure de ce document. Les ordres de grandeur sont plus importants que les décimales.

### 2.2 La réponse associative est massive mais fragmentée

Face à ce constat, un tissu associatif dense s'est constitué : grandes structures nationales, fédérations étudiantes, épiceries solidaires, antennes locales, collectifs informels. Ces acteurs partagent un mode opératoire commun :

- récupérer des denrées (invendus, dons, achats) ;
- mobiliser des bénévoles ;
- organiser des distributions régulières ;
- accueillir des bénéficiaires, souvent sur inscription.

Ce mode opératoire est **identique dans sa structure** d'une association à l'autre, quels que soient la taille, la ville ou le type de denrées distribuées. C'est cette régularité qui rend un outil mutualisé pertinent : ce qui change d'une association à l'autre, ce sont les paramètres (qui distribue quoi, où, à qui, avec quelles règles), pas la mécanique de fond.

### 2.3 Le fossé numérique entre grandes et petites structures

C'est ici que se situe le véritable problème que Solivio entend résoudre.

Les grandes structures disposent de moyens : équipes salariées, applications dédiées, partenariats technologiques, budgets. Elles ont les ressources pour se doter d'outils sur mesure ou pour adopter des solutions du marché.

À l'opposé, la grande majorité des associations de solidarité étudiante — antennes locales, petites associations indépendantes, collectifs naissants — fonctionnent avec :

- des tableurs partagés pour les inscriptions et les stocks ;
- des messageries instantanées pour coordonner les bénévoles ;
- des formulaires gratuits pour collecter les inscriptions ;
- des outils de paiement tiers pour les dons ;
- la mémoire des personnes en poste pour tout le reste.

Cet assemblage fonctionne — jusqu'à ce qu'il ne fonctionne plus. Les points de rupture sont connus et récurrents :

- **La montée en charge** : un tableur tient pour 50 inscrits, pas pour 500.
- **Le renouvellement annuel des équipes** : dans une association étudiante, le bureau change chaque année. Les personnes qui maîtrisaient l'assemblage d'outils partent, et leurs successeurs héritent d'un système qu'ils ne comprennent pas. C'est l'une des premières causes de mortalité des outils associatifs.
- **La dispersion de l'information** : les données vivent dans cinq endroits différents, sans cohérence ni historique fiable.
- **La gestion amateur de données sensibles** : des informations sur des étudiants en situation de précarité circulent dans des tableurs et des messageries, sans cadre de confidentialité ni conformité réglementaire sérieuse.

---

## 3. Le problème que Solivio adresse

Le problème central tient en une phrase :

> Les associations de solidarité étudiante qui n'ont pas les moyens des grandes structures n'ont aucun outil métier adapté pour gérer leur activité opérationnelle de manière fiable, durable et respectueuse des données sensibles.

Ce problème se décompose en quatre manques précis :

**Manque 1 — L'absence d'outil métier centralisé.**
Aucune solution ne couvre spécifiquement le cycle de vie d'une distribution de solidarité : planification, inscription des bénéficiaires et des bénévoles, gestion des créneaux, pointage le jour J, suivi des stocks consommés, statistiques. Les outils existants sont soit trop généralistes (tableurs, formulaires), soit conçus pour d'autres usages (billetterie, gestion d'adhérents classique), soit réservés aux structures qui ont les moyens de les déployer.

**Manque 2 — La non-prise en compte du renouvellement des équipes.**
Aucun outil grand public ne pense la passation de pouvoir, qui est pourtant le rythme cardiaque de la vie associative étudiante. Un outil qui ne survit pas à un changement de bureau ne sert à rien sur le long terme.

**Manque 3 — La gestion non conforme des données sensibles.**
Les données de bénéficiaires en situation de précarité sont des données sociales sensibles. Leur gestion dans des tableurs partagés expose les associations à des risques réels, sans qu'elles en aient toujours conscience. Il manque un outil qui intègre la confidentialité et la conformité par conception.

**Manque 4 — L'enfermement et la fragilité.**
Les solutions sur mesure développées en interne meurent avec leur développeur. Les solutions propriétaires enferment les associations. Il manque une option qui garantisse aux associations de ne jamais perdre l'accès à leurs propres données ni dépendre de la survie d'un acteur unique.

---

## 4. Vision et proposition de valeur

### 4.1 La vision

Solivio veut devenir le **socle opérationnel de référence des associations de solidarité de proximité** : l'outil qu'une association adopte le jour où le tableur ne suffit plus, et qu'elle garde année après année, bureau après bureau, parce qu'il a été conçu pour durer.

L'ambition n'est pas de remplacer tout l'écosystème numérique d'une association. Elle est de devenir le **point central de sa gestion opérationnelle**, autour duquel gravitent les services tiers spécialisés.

### 4.2 La proposition de valeur

Pour une association de solidarité étudiante, Solivio promet :

- **Gagner du temps** sur les tâches répétitives : inscriptions, rappels, coordination, comptage.
- **Fiabiliser l'activité** : une seule source de vérité, un historique fiable, des statistiques exploitables.
- **Protéger les bénéficiaires** : confidentialité et conformité intégrées, sans expertise juridique requise de la part de l'association.
- **Survivre aux transitions** : passation de bureau facilitée, mémoire de l'association préservée.
- **Rester libre** : code ouvert, données exportables, aucun enfermement.

### 4.3 Ce qui rend Solivio différent

Trois caractéristiques distinguent Solivio des outils généralistes existants :

1. **Un outil métier, pas un outil générique détourné.** Solivio parle le langage des associations de solidarité (distributions, bénéficiaires, bénévoles, créneaux, stocks), là où les tableurs et les outils de billetterie obligent à tordre des concepts inadaptés.
2. **La configurabilité sans le sur-mesure.** Chaque association adapte l'outil à son fonctionnement par paramétrage, sans développement spécifique. Le détail de ce qui est configurable est défini dans les spécifications fonctionnelles ; le principe est posé ici.
3. **La pérennité comme engagement de conception.** Open source, multi-association, données exportables : ces choix ne sont pas des détails techniques mais des promesses faites aux associations.

---

## 5. Périmètre : ce que Solivio est, et ce qu'il n'est pas

Le principe directeur du périmètre est le suivant :

> Faire ce que personne ne fait bien. Déléguer ce que d'autres font mieux.

Ce principe est la première ligne de défense contre la dérive de périmètre, qui est le risque mortel d'un projet de cette nature.

### 5.1 Ce que Solivio construit (le cœur)

| Domaine | Justification |
|---|---|
| Gestion des distributions et événements de solidarité | C'est le cœur métier. Personne ne le couvre spécifiquement. |
| Inscription des bénéficiaires et des bénévoles | Indissociable des distributions. Logique métier spécifique (créneaux, règles de fréquence, listes d'attente). |
| Pointage et suivi de présence | Fiabilise les statistiques et limite le gaspillage. Inexistant dans les outils génériques. |
| Gestion des ressources et des stocks | Lien direct avec dons et distributions. Modèle générique réutilisable. |
| Profils membres et données associatives | Source de vérité centrale, avec confidentialité intégrée. |
| Pilotage et statistiques opérationnelles | Transforme l'activité en information exploitable et en données de plaidoyer. |
| Gestion mutualisée et droits d'accès contextuels | Le socle qui permet à plusieurs associations de coexister en toute sécurité. |

### 5.2 Ce que Solivio délègue (la commodité)

| Besoin | Solution déléguée | Justification |
|---|---|---|
| Dons et paiements en ligne | Service de collecte associatif établi | Reconstruire un système de paiement conforme serait coûteux, risqué et inutile. |
| Emails transactionnels | Service d'envoi spécialisé | La délivrabilité email est un métier à part entière. |
| Stockage de documents | Service de stockage objet ou suite bureautique existante | Aucune valeur ajoutée à reconstruire un gestionnaire de fichiers. |
| Authentification | Brique d'authentification éprouvée | La sécurité d'authentification est critique et standardisée ; mieux vaut s'appuyer sur l'existant. |

Le détail des intégrations est traité dans `architecture_technique.md`. Le principe, lui, est non négociable : tout ce qui relève de la commodité est délégué, pas reconstruit.

### 5.3 Ce qui est explicitement hors périmètre

Pour éviter toute ambiguïté, les éléments suivants ne font **pas** partie du projet Solivio :

- La comptabilité associative complète (bilan, compte de résultat, déclarations). Solivio suit les dons et les ressources, mais n'est pas un logiciel comptable.
- La communication grand public et le marketing (réseaux sociaux, newsletters de masse, campagnes publicitaires).
- La billetterie événementielle commerciale.
- Tout dispositif d'aide à la décision automatisée concernant l'attribution d'aide à un bénéficiaire. Solivio outille des humains ; il ne décide pas à leur place qui a droit à quoi.

---

## 6. Public cible

### 6.1 Les associations visées

Solivio cible en priorité :

- les **associations étudiantes d'aide alimentaire** de taille petite à moyenne, indépendantes ou affiliées, qui organisent des distributions régulières ;
- par extension, les **associations de solidarité de proximité** dont le fonctionnement repose sur des distributions, des bénévoles et des bénéficiaires (vestiaires solidaires, distribution de matériel scolaire, maraudes, etc.).

Le critère déterminant n'est pas le secteur exact, mais la **structure du fonctionnement** : si une association organise des événements récurrents mobilisant des ressources, des bénévoles et des bénéficiaires, elle entre dans la cible.

Sont hors cible (du moins en première intention) : les très grandes structures déjà outillées, les associations sans dimension de distribution, et les structures à but lucratif.

### 6.2 Les utilisateurs et leurs besoins

Solivio sert quatre grands types d'utilisateurs, dont les besoins et les niveaux d'accès diffèrent radicalement. Cette typologie est volontairement simplifiée ici ; le modèle de droits réel, plus fin et contextuel, est défini dans les documents techniques.

| Utilisateur | Qui | Besoin principal | Sensibilité |
|---|---|---|---|
| Responsable / bureau | Pilote l'association | Vision d'ensemble, configuration, statistiques | Accès large, responsabilité de conformité |
| Coordinateur | Organise les distributions | Créer et gérer des distributions, coordonner les équipes | Accès opérationnel, souvent limité à son périmètre |
| Bénévole | Donne de son temps | S'inscrire à des créneaux, connaître ses missions | Accès restreint à ce qui le concerne |
| Bénéficiaire | Reçoit l'aide | S'inscrire simplement et sans stigmatisation | Données les plus sensibles, accès minimal, confidentialité maximale |

Un même individu peut cumuler plusieurs rôles — un bénéficiaire peut être bénévole, un coordinateur reste un bénévole. Cette réalité est centrale et conditionne le modèle de droits ; elle est développée dans les documents techniques.

---

## 7. Principes directeurs

Ces principes sont les invariants du projet. Ils s'appliquent à toutes les décisions ultérieures.

**P1 — Architecture mutualisée dès le départ, fonctionnalités d'une association d'abord.**
Le socle est conçu pour plusieurs associations, mais on construit et on valide avec une association pilote avant de généraliser. On ne généralise jamais une fonctionnalité qui n'a pas été éprouvée sur le terrain.

**P2 — Déléguer la commodité, construire le cœur.**
Tout ce qui n'est pas le cœur métier de la solidarité opérationnelle est délégué à des services tiers. Cette règle prime sur la tentation de tout maîtriser.

**P3 — Le métier précède la technique.**
Les concepts métier (organisation, personne, événement, ressource, don) sont modélisés avant toute table de base de données. Un modèle métier juste permet d'évoluer dix ans ; un modèle métier faux impose une réécriture sous deux ou trois ans, quelle que soit la qualité de l'architecture technique.

**P4 — Le contrôle d'accès est contextuel.**
Les droits ne se résument pas à « lire / écrire / supprimer ». Ils dépendent du contexte : un coordinateur agit sur ses distributions, un bénévole voit ce à quoi il participe, un responsable d'antenne ne voit que son antenne. Ce contrôle d'accès fin et contextuel est un différenciant du produit, pas un détail.

**P5 — La confidentialité et la conformité par conception.**
La protection des données sensibles des bénéficiaires n'est pas une fonctionnalité ajoutée a posteriori. Elle est intégrée à la conception : minimisation des données, pseudonymisation dans les statistiques, accès restreint par défaut, traçabilité des actions sensibles, hébergement en Union européenne.

**P6 — La pérennité avant la fonctionnalité.**
Mieux vaut un périmètre restreint mais durable qu'un périmètre ambitieux mais fragile. Le code est ouvert, les données sont exportables, l'association n'est jamais prisonnière.

**P7 — La sobriété contre la sur-ingénierie.**
Chaque fonctionnalité, chaque couche technique, chaque option de configuration doit justifier son existence par un besoin réel et observé. La sophistication n'est jamais un objectif en soi. En cas de doute, on retire plutôt qu'on ajoute.

---

## 8. Positionnement par rapport à l'existant

Solivio ne se positionne pas frontalement contre les outils existants, mais dans l'espace qu'ils laissent vide.

- Face aux **tableurs et formulaires gratuits** : Solivio offre un outil métier structuré, qui survit à la montée en charge et au changement d'équipe.
- Face aux **plateformes de dons et de billetterie** : Solivio ne les concurrence pas, il s'y connecte. Elles gèrent l'argent et les inscriptions payantes ; Solivio gère l'opérationnel de terrain.
- Face aux **suites de gestion associative généralistes** : Solivio est plus spécialisé, plus léger, gratuit pour les petites structures, et ouvert.
- Face aux **outils internes des grandes structures** : Solivio s'adresse à celles qui n'ont pas ces moyens.

L'analyse détaillée de la concurrence, avec acteurs nommés et comparaison fonctionnelle, fait l'objet du document `archive/analyse_concurrence.md`.

---

## 9. Objectifs et critères de succès

### 9.1 Objectifs à court terme (pilote)

- Couvrir le cycle complet d'une distribution pour l'association pilote : de la création de la distribution au bilan post-distribution.
- Être utilisé en conditions réelles sur plusieurs distributions consécutives.
- Faire gagner un temps mesurable aux organisateurs par rapport à leur méthode actuelle.

### 9.2 Objectifs à moyen terme (généralisation)

- Permettre à une deuxième association, au fonctionnement différent, d'adopter l'outil par simple configuration, sans développement spécifique.
- Valider que le socle mutualisé tient avec plusieurs associations indépendantes.
- Ouvrir le code et documenter l'installation autonome.

### 9.3 Indicateurs de succès

Le succès se mesure à des signaux concrets, pas à des intentions :

- une association continue d'utiliser l'outil après un changement de bureau ;
- les organisateurs déclarent un gain de temps réel ;
- une deuxième association adopte l'outil sans intervention de développement ;
- aucune fuite de données entre associations ;
- l'outil reste maintenable par une seule personne à temps partiel, ou par une petite communauté.

### 9.4 Définition de l'échec

Il est sain de nommer ce qui constituerait un échec :

- un outil que l'association abandonne après deux distributions ;
- un outil que seul son créateur sait faire fonctionner ;
- un périmètre devenu si vaste qu'il n'est jamais livré ;
- une fuite de données sensibles.

---

## 10. Risques majeurs identifiés

Cette section nomme honnêtement les risques. Les stratégies de réponse détaillées relèvent de `etude_faisabilite.md` ; l'objectif ici est de ne rien laisser dans l'angle mort.

| Risque | Nature | Gravité |
|---|---|---|
| Dérive de périmètre | Le projet veut tout couvrir et n'est jamais livré. | Élevée |
| Faible adoption | L'outil est trop complexe pour des bénévoles non techniques. | Élevée |
| Renouvellement des équipes | L'outil ne survit pas au changement de bureau. | Élevée |
| Dépendance à une seule personne | Le projet meurt si son créateur s'arrête. | Élevée |
| Données sensibles | Fuite ou non-conformité réglementaire. | Critique |
| Concurrence gratuite | Des acteurs établis et gratuits occupent déjà une partie du terrain. | Moyenne |
| Disponibilité limitée du créateur | Projet mené en parallèle d'une activité professionnelle. | Moyenne |

La conception du produit intègre des réponses à plusieurs de ces risques : la sobriété de périmètre (P7) répond à la dérive, l'ouverture du code (P6) répond à la dépendance à une personne, la confidentialité par conception (P5) répond au risque sur les données.

---

## 11. Modèle de pérennité

Le modèle retenu est **ouvert et hybride** :

- le **code est ouvert**, hébergé publiquement, sous une licence à déterminer dans `archive/modele_economique.md` ;
- une **instance hébergée** est proposée gratuitement aux petites associations, dont l'infrastructure est gérée par le porteur du projet ;
- les associations qui en ont les moyens techniques peuvent **héberger elles-mêmes** l'outil ;
- un éventuel modèle de soutien financier, pour les structures les plus exigeantes ou pour assurer la maintenance, est étudié dans `archive/modele_economique.md`.

Ce modèle répond à une exigence morale autant que stratégique : une association qui confie sa gestion à Solivio ne doit jamais se retrouver bloquée si le projet ralentit ou s'arrête.

---

## 12. Ce que ce document ne tranche pas

Pour rester dans son rôle, cette note d'intention laisse délibérément ouverts des sujets traités ailleurs :

- la liste précise des fonctionnalités et leur découpage en versions → `specifications_fonctionnelles.md` et `roadmap.md` ;
- la comparaison nommée avec les outils concurrents → `archive/analyse_concurrence.md` ;
- le choix de licence et le modèle de soutien financier → `archive/modele_economique.md` ;
- la faisabilité au regard des ressources réelles → `etude_faisabilite.md` ;
- les concepts métier détaillés et le schéma de données → `modele_donnees.md` ;
- les choix de technologies et d'infrastructure → `architecture_technique.md` ;
- l'expérience concrète des utilisateurs → `parcours_utilisateurs.md` ;
- la définition partagée des termes → `glossaire.md`.

---

## 13. Synthèse en une page

**Quoi.** Une plateforme de gestion opérationnelle pour les associations de solidarité étudiante.

**Pour qui.** Les petites et moyennes associations qui font le même travail que les grandes structures, sans leurs moyens techniques.

**Pourquoi.** Parce qu'elles gèrent aujourd'hui une activité sensible et croissante avec des outils improvisés qui s'effondrent à la montée en charge, au changement de bureau, et au regard des exigences de confidentialité.

**Comment.** En construisant le cœur métier que personne ne couvre, en déléguant tout le reste à des services éprouvés, avec une architecture mutualisée, un contrôle d'accès contextuel, la confidentialité par conception, et un code ouvert.

**Avec qui.** Une association étudiante toulousaine d'aide alimentaire comme terrain de validation fondateur, avant toute généralisation.

**Engagement.** Sobriété, pérennité, et refus de l'enfermement.

---

*Fin de la note d'intention. Document suivant : `archive/analyse_concurrence.md`.*
