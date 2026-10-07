# Modèle économique - Solivio

> Comment Solivio finance son existence, sous quelle licence il vit, et comment il dure sans dépendre d'une seule personne.

**Document fondateur - version 1.0**
**Statut : référence de travail**
**Dernière mise à jour : juin 2026**

> **Document archivé en octobre 2026.** Cette analyse a été écrite pour un déploiement national auprès de plusieurs associations. Solivio sert désormais uniquement Linkee Toulouse (`../architecture_technique.md`, ADR-001) : ce document ne fait plus foi et n'est conservé que comme historique.

## Avertissement de lecture

Ce document tranche deux décisions lourdes et engageantes :

1. **La licence open source** sous laquelle le code est publié. Ce choix est difficilement réversible une fois des contributeurs extérieurs impliqués, et il conditionne ce que d'autres peuvent faire du code.
2. **Le modèle de financement et de pérennité** : comment couvrir les coûts et faire survivre le projet dans le temps.

Une mise au point préalable, essentielle pour ne pas se tromper de cadre : **Solivio n'est pas une startup qui cherche à maximiser un profit.** C'est un projet d'utilité sociale à code ouvert. Son "modèle économique" ne vise pas à enrichir son auteur, mais à garantir trois choses : que les coûts soient couverts sans devenir un fardeau, que le projet survive à son créateur, et qu'aucune association ne soit jamais prisonnière de l'outil. Tout le document découle de ce cadre.

Les tarifs cités sont datés de juin 2026, donnés hors taxes, et doivent être revérifiés avant tout engagement. Aucun montant n'est inventé : les chiffres proviennent de sources publiques vérifiées.

## 1. La philosophie économique

### 1.1 Le constat qui change tout

L'analyse des coûts réels (détaillée en section 4) aboutit à une conclusion contre-intuitive mais déterminante :

> Faire tourner Solivio pour quelques associations coûte de l'ordre d'une dizaine d'euros par mois. La ressource rare de ce projet n'est pas l'argent, c'est le temps et l'énergie de son créateur.

Cette phrase oriente tout le modèle économique. Un projet logiciel classique cherche des revenus pour payer des serveurs et des salaires. Ici, les serveurs sont quasi gratuits à l'échelle visée, et il n'y a pas de salaire. Le vrai risque n'est pas financier : c'est l'épuisement du porteur et la dépendance du projet à une seule personne.

Le modèle économique de Solivio doit donc protéger en priorité contre **le risque humain** (burnout, abandon, facteur de bus), et accessoirement contre le risque financier, qui est faible à petite échelle et ne devient réel qu'en cas de fort succès.

### 1.2 Trois principes économiques

**E1 - Le coût d'usage doit rester nul pour les petites associations.** C'est une condition d'adoption, validée par l'analyse de la concurrence : face à des acteurs gratuits installés (HelloAsso, le tableur), faire payer une petite association de solidarité serait un contresens. La gratuité pour les petites structures n'est pas une promotion, c'est un invariant.

**E2 - Le financement doit suivre les coûts, pas les précéder.** On ne cherche pas de financement tant que les coûts sont couvrables de la poche du porteur (une dizaine d'euros par mois). On active des sources de financement uniquement quand l'échelle l'impose. Chercher des subventions pour un projet qui coûte 10 € par mois serait une perte d'énergie.

**E3 - La pérennité prime sur la captation de valeur.** Toute décision qui rendrait le projet plus rentable mais moins durable, ou qui enfermerait les associations, est écartée. C'est ce principe qui guide le choix de licence.

## 2. Le choix de la licence open source

C'est la décision la plus structurante du document. Elle répond à une question simple en apparence : *que veut-on autoriser, et interdire, à ceux qui réutilisent le code ?*

### 2.1 Les trois familles de licences en présence

| Licence | Type | Ce qu'elle impose | Risque qu'elle couvre |
|---|---|---|---|
| MIT / Apache 2.0 | Permissive | Presque rien : on peut réutiliser le code, même dans un produit fermé et commercial | Aucun. Maximise la diffusion, ne protège pas contre la récupération propriétaire |
| GPL v3 | Copyleft | Tout produit dérivé distribué doit rester sous GPL (code ouvert) | La récupération dans un logiciel fermé distribué |
| AGPL v3 | Copyleft réseau | Comme GPL, mais s'applique aussi quand le logiciel est offert comme service en ligne, sans être distribué | La récupération dans un service en ligne fermé |

### 2.2 Le piège que Solivio doit éviter

Solivio est un logiciel destiné à être utilisé **comme service en ligne** (une instance hébergée à laquelle les associations se connectent). C'est précisément le cas où la GPL classique montre sa limite, connue sous le nom de "faille SaaS" :

> Avec la GPL, une entreprise peut prendre le code de Solivio, l'améliorer, le proposer comme service en ligne payant, et n'avoir aucune obligation de publier ses améliorations - parce qu'elle ne *distribue* pas le logiciel, elle l'*exploite* à distance.

Pour un projet dont la nature même est d'être un service en ligne, c'est un risque réel : un acteur mieux doté pourrait construire une version fermée et commerciale sur le travail bénévole du porteur, sans rien rendre à la communauté.

### 2.3 La décision : AGPL v3

**Solivio est publié sous licence AGPL v3.**

Justification :

- L'AGPL ferme la faille SaaS : quiconque propose Solivio (ou une version modifiée) comme service en ligne **doit** publier le code source correspondant, y compris ses modifications. C'est exactement la protection dont un service en ligne a besoin.
- Elle garantit que le commun reste commun : les améliorations faites par d'autres reviennent à tous, plutôt que d'être captées dans un produit fermé.
- Elle n'empêche personne d'utiliser Solivio gratuitement, de l'héberger soi-même, ni de le modifier pour ses besoins. Elle n'impose le partage qu'à ceux qui en font un service pour autrui.
- Elle est cohérente avec la promesse faite aux associations : le code restera ouvert quoi qu'il arrive.

### 2.4 Les contreparties assumées

L'AGPL a un coût qu'il faut nommer honnêtement :

- Elle **réduit l'adoption par les entreprises**, qui évitent souvent l'AGPL par crainte de la contagion du copyleft. Mais les entreprises ne sont pas la cible de Solivio : ce n'est pas une perte pour ce projet.
- Elle peut **freiner certains contributeurs** habitués aux licences permissives. C'est un risque mineur au regard de la protection obtenue.

### 2.5 La porte laissée ouverte : le double licensing

Pour préserver l'avenir, le porteur conserve le **droit d'auteur sur son code** (via un accord de contribution pour les éventuels contributeurs extérieurs, à formaliser le jour où il y en a). Cela laisse ouverte, si besoin un jour, la possibilité d'un double licensing : le code reste AGPL pour tous, mais une licence commerciale séparée pourrait être proposée à une structure qui voudrait l'intégrer dans un produit fermé, en échange d'un soutien au projet. Cette porte n'est pas ouverte aujourd'hui ; elle est simplement préservée.

## 3. Le modèle hébergé contre auto-hébergé

Solivio existe sous deux formes, dont l'économie diffère.

### 3.1 L'instance hébergée (gérée par le porteur)

- Le porteur héberge une instance, sur laquelle plusieurs associations ont leur espace.
- Cette instance est **gratuite pour les petites associations**.
- Le porteur assume les coûts (faibles) et la maintenance (coûteuse en temps).
- C'est la voie d'entrée pour les associations sans aucune compétence technique - c'est-à-dire la cible principale.

### 3.2 L'auto-hébergement (par l'association ou un tiers)

- Une association disposant d'une compétence technique peut installer Solivio sur son propre serveur.
- Coût pour le porteur : nul. L'association assume tout.
- Intérêt : indépendance totale de l'association, et déchargement du porteur. C'est aussi la garantie de pérennité (le projet survit même si l'instance hébergée s'arrête).
- C'est rendu possible par l'open source et doit être facilité par une documentation d'installation soignée (prévue dans la roadmap).

### 3.3 Pourquoi les deux coexistent

L'instance hébergée maximise l'adoption (zéro friction pour les non-techniciens). L'auto-hébergement maximise la pérennité et décharge le porteur. Les deux servent des publics différents et se complètent. Aucune n'est sacrifiée.

## 4. La structure de coûts réelle

Voici ce que coûte réellement Solivio, à différentes échelles. Chiffres datés de juin 2026, hors taxes, à revérifier.

### 4.1 Coûts d'infrastructure (instance hébergée)

| Poste | Détail | Coût mensuel approximatif |
|---|---|---|
| Serveur | Hetzner CX32 (4 vCPU, 8 Go RAM, 80 Go) | environ 7 à 8 € |
| Sauvegardes | Option de sauvegarde Hetzner (de l'ordre de 20 % du prix serveur) | environ 1,5 € |
| Nom de domaine | Amorti sur l'année (de l'ordre de 10 à 15 € par an) | environ 1 € |
| Emails transactionnels | Palier gratuit suffisant au départ (voir 4.2) | 0 € |
| **Total au démarrage** | Quelques associations sur une seule instance | **environ 10 à 12 €** |

À noter : Hetzner a annoncé un ajustement de ses prix prenant effet au 1ᵉʳ avril 2026 ; les montants ci-dessus en tiennent compte de manière approximative et doivent être revérifiés. Une option encore moins chère existe (série CAX, processeurs ARM, entrée autour de 4 € par mois) si la pile technique le permet.

### 4.2 Emails transactionnels - un poste qui reste gratuit longtemps

Les rappels de distribution, confirmations et annulations sont des emails transactionnels. Les paliers gratuits des services spécialisés couvrent largement les besoins d'une petite association :

- Un service comme Brevo offre un palier gratuit de l'ordre de 300 emails par jour (environ 9 000 par mois).
- Un service comme Resend offre de l'ordre de 3 000 emails gratuits par mois.

Pour une association qui envoie quelques centaines de rappels par semaine, c'est gratuit. Les paliers payants ne deviennent nécessaires qu'à grande échelle (de l'ordre de 15 à 20 € par mois pour des dizaines de milliers d'emails).

### 4.3 Coûts à l'échelle (si le succès vient)

Si plusieurs dizaines d'associations adoptent l'outil :

- Le serveur peut devoir monter en gamme (de l'ordre de 15 à 35 € par mois pour une machine plus puissante), ou plusieurs instances peuvent être nécessaires.
- Les emails peuvent passer au palier payant.
- Une montée des coûts reste très modérée : on parle de quelques dizaines d'euros par mois pour servir des dizaines d'associations, pas de milliers.

### 4.4 Le coût qui n'apparaît pas dans le tableau

Le coût dominant est invisible dans une grille tarifaire : c'est le **temps du porteur** - développement, maintenance, corrections de sécurité, support aux associations, accompagnement à l'onboarding. C'est ce coût-là, et non l'infrastructure, qui peut faire mourir le projet. Le modèle de pérennité (section 6) s'attaque d'abord à lui.

## 5. Les sources de financement possibles

Le financement n'est pas nécessaire au démarrage (les coûts sont couvrables de la poche du porteur). Il le devient si l'échelle augmente. Voici les sources mobilisables, par ordre de pertinence croissante avec l'échelle.

### 5.1 Au démarrage : autofinancement

Tant que les coûts restent de l'ordre de 10 € par mois, le porteur les assume directement. C'est le plus simple et cela évite toute lourdeur administrative. Pas de recherche de financement prématurée (principe E2).

### 5.2 À l'usage : contributions volontaires

Sur le modèle d'HelloAsso, les associations utilisatrices et leurs sympathisants peuvent être invités à contribuer librement pour soutenir l'hébergement. Sans obligation, sans paywall. Cela peut couvrir l'infrastructure sans la rendre payante.

### 5.3 À l'échelle : subventions et fondations

Plusieurs dispositifs financent les projets associatifs et les communs numériques :

- les dispositifs publics de soutien à la vie associative (par exemple le Fonds pour le développement de la vie associative, FDVA, à vérifier quant à l'éligibilité d'un outil numérique) ;
- les fondations soutenant les communs numériques et les logiciels libres d'intérêt général ;
- les appels à projets liés à la lutte contre la précarité ou à la transition numérique du secteur associatif.

Important : la plupart de ces dispositifs exigent une **structure juridique** porteuse (voir 5.5).

### 5.4 À grande échelle : offre de service gérée

Si de grandes structures veulent une instance dédiée, du support garanti, ou des développements spécifiques, une **offre payante de service géré** peut être proposée - sans jamais rendre l'outil de base payant pour les petites associations. C'est le seul levier de revenu réellement envisagé, et seulement pour les structures qui en ont les moyens. C'est le pendant du "Plus par HelloAsso" : le cœur reste gratuit, l'accompagnement premium est payant.

### 5.5 La question de la structure juridique

Tant que le projet est petit, il peut rester une initiative personnelle. Mais pour recevoir des subventions, des dons défiscalisés, ou pour porter le projet collectivement, il faudra une structure : le plus naturel serait une **association loi 1901** dédiée au projet. Cela a deux vertus : cela ouvre les financements, et cela résout en partie le facteur de bus (le projet appartient à une structure, pas à une personne). Cette décision est à prendre le jour où l'échelle ou le besoin de financement l'impose, pas avant.

## 6. La pérennité : répondre au risque humain

C'est le cœur du modèle, parce que c'est le vrai risque (section 1.1). Cinq leviers.

**L1 - L'open source comme assurance-vie.** Sous AGPL, le code est public et réutilisable. Si le porteur s'arrête, n'importe qui peut reprendre une instance, et les associations qui s'auto-hébergent ne sont pas affectées. Le projet ne meurt pas avec son auteur.

**L2 - L'auto-hébergement comme filet.** Plus il y a d'associations capables de s'auto-héberger, moins le projet dépend de l'instance centrale et de son mainteneur. La documentation d'installation est donc un investissement de pérennité, pas un détail.

**L3 - La sobriété comme protection contre l'épuisement.** Un périmètre restreint (principe P7 de la note d'intention) limite la charge de maintenance. Chaque fonctionnalité ajoutée est une dette de maintenance future. Moins il y en a, plus le projet est tenable par une personne à temps partiel.

**L4 - La structure juridique comme dépersonnalisation.** À terme, porter le projet via une association loi 1901 permet d'accueillir d'autres contributeurs, de partager la responsabilité, et de survivre au départ de n'importe quel individu.

**L5 - La documentation comme transmission.** Un projet documenté (code, architecture, exploitation) peut être repris. Un projet dans la tête d'une seule personne meurt avec son indisponibilité. La documentation est un acte de pérennité.

## 7. Ce que Solivio ne fera jamais

Pour cadrer le modèle, voici les options explicitement exclues :

- **Faire payer les petites associations** pour l'usage de base. Invariant (E1).
- **Afficher de la publicité** ou monétiser les données. Inacceptable pour un outil gérant des données de précarité.
- **Vendre, louer ou exploiter commercialement les données** des associations ou des bénéficiaires. Jamais.
- **Fermer le code** ou créer une dépendance qui empêcherait une association de partir avec ses données.
- **Concurrencer HelloAsso sur la collecte de dons.** On s'y connecte, on ne le remplace pas (cohérent avec l'analyse de la concurrence).

## 8. Synthèse des décisions

| Décision | Choix retenu |
|---|---|
| Nature du projet | Projet d'utilité sociale open source, pas une startup à profit |
| Licence | AGPL v3 (protège contre la récupération en service fermé) |
| Droit d'auteur | Conservé par le porteur, pour garder ouverte l'option du double licensing |
| Coût pour les petites associations | Gratuit, sans condition. Invariant |
| Financement au démarrage | Autofinancement (coûts de l'ordre de 10 € par mois) |
| Financement à l'usage | Contributions volontaires, sans paywall |
| Financement à l'échelle | Subventions, fondations, offre de service géré payante pour grandes structures |
| Structure juridique | Association loi 1901, le jour où l'échelle ou le financement l'impose |
| Risque principal | Humain (épuisement, dépendance à une personne), pas financier |
| Réponse au risque | Open source, auto-hébergement, sobriété, structure dédiée, documentation |

## 9. Ce que ce document implique pour la suite

- L'**architecture technique** (`architecture_technique.md`) doit rendre l'auto-hébergement réellement simple (installation documentée, dépendances limitées), car l'auto-hébergement est un pilier de pérennité, pas une option secondaire.
- La **roadmap** (`roadmap.md`) doit inclure la documentation d'installation et d'exploitation comme un livrable à part entière, pas comme une tâche annexe.
- Les **spécifications fonctionnelles** doivent intégrer la possibilité, pour une association, d'exporter et de supprimer l'intégralité de ses données - c'est la traduction concrète de la promesse de non-enfermement.
- La mention de l'AGPL et de la gratuité doit figurer dans toute communication vers les associations : c'est un argument de confiance, pas une clause cachée.

## 10. Synthèse en une page

**La nature.** Solivio n'est pas une startup : c'est un commun numérique d'utilité sociale. Son but n'est pas le profit mais la pérennité et l'utilité.

**Le coût réel.** De l'ordre de 10 € par mois pour démarrer. L'infrastructure est quasi gratuite à petite échelle. La vraie ressource rare est le temps du porteur.

**La licence.** AGPL v3, parce que Solivio est un service en ligne et que l'AGPL est la seule licence qui empêche un tiers d'en faire un service fermé sans rien rendre. Le droit d'auteur est conservé pour garder l'avenir ouvert.

**La gratuité.** Invariante pour les petites associations. C'est une condition d'adoption face à des concurrents gratuits, et une exigence éthique.

**Le financement.** Inutile au début (autofinancement). Contributions volontaires à l'usage. Subventions, fondations et service géré payant pour grandes structures à l'échelle. Une association loi 1901 le jour où c'est nécessaire.

**Le vrai enjeu.** Survivre au risque humain. La réponse tient en cinq mots : ouverture, auto-hébergement, sobriété, structure, documentation.

*Fin du modèle économique. Document suivant : `etude_faisabilite.md`.*
