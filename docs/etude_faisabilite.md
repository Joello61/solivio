# Étude de faisabilité — Solivio

> Le projet est-il réellement réalisable, par qui, avec quelles ressources, et sous quelles conditions.

**Document fondateur — version 1.0**
**Statut : référence de travail**
**Dernière mise à jour : juin 2026**

---

## Avertissement de lecture

Ce document est volontairement le plus lucide de la série. Son rôle n'est pas de vendre le projet, mais de répondre froidement à une question : *peut-on vraiment le faire, dans les conditions réelles qui sont celles du porteur ?*

Une étude de faisabilité complaisante ne sert à rien. Celle-ci nomme les contraintes sans les adoucir, parce que c'est la seule façon de prendre des décisions justes en amont plutôt que de découvrir les murs en s'y cognant. Si certaines sections paraissent sévères, c'est délibéré : il vaut mieux qu'un document fasse cet inventaire qu'une désillusion à six mois.

Conclusion anticipée, pour poser le cadre : **le projet est faisable, mais seulement dans sa version étagée et sobre. Le projet dans son ambition maximale et immédiate ne l'est pas pour une personne seule.** Tout le document explicite cette nuance.

---

## 1. Objet et dimensions évaluées

La faisabilité d'un projet logiciel porté par une personne se mesure sur six dimensions. Une seule défaillante peut suffire à faire échouer l'ensemble.

| Dimension | Question posée |
|---|---|
| Technique | Les compétences et les technologies permettent-elles de le construire ? |
| Humaine et temporelle | Le porteur a-t-il le temps et l'énergie, dans la durée ? |
| Organisationnelle | Y a-t-il un terrain réel, des utilisateurs, une validation possible ? |
| Juridique et réglementaire | La conformité (notamment RGPD) est-elle atteignable par une personne seule ? |
| Économique | Les coûts sont-ils soutenables ? |
| De pérennité | Le projet peut-il survivre au-delà de son lancement ? |

---

## 2. Faisabilité technique

### 2.1 Adéquation entre le projet et le profil du porteur

C'est le point fort du dossier. Le porteur réunit un profil rare pour ce projet précis :

- **Une expérience fullstack en production.** Le porteur développe au quotidien une application de gestion de dossiers (domaine médical) sur une pile professionnelle complète : backend, frontend, conteneurisation, intégration continue, base de données relationnelle, et même packaging mobile et desktop. Ce n'est pas de l'expérience théorique : c'est de la mise en production réelle, avec de vrais utilisateurs et de vraies contraintes.
- **Une expertise directement applicable au cœur différenciant de Solivio.** Le travail académique du porteur porte sur la confidentialité par conception via le contrôle d'accès par attributs (ABAC). Or l'ABAC contextuel est précisément l'un des trois différenciateurs de Solivio identifiés dans l'analyse de la concurrence. Le porteur ne découvre pas le sujet le plus difficile du projet : il l'a étudié en profondeur. C'est un avantage considérable et peu commun.
- **Une familiarité avec les pratiques d'ingénierie qui comptent ici** : conteneurisation, intégration continue, tests d'intégration avec conteneurs jetables, pipelines. Ce sont exactement les outils nécessaires pour un projet multi-association maintenable.

Verdict partiel : sur le plan des compétences, le porteur est non seulement capable, mais particulièrement bien positionné pour ce projet en particulier.

### 2.2 La vraie difficulté technique : la nature multi-association

La difficulté n'est pas dans les fonctionnalités prises une à une (créer une distribution, inscrire un bénévole : ce sont des opérations classiques). Elle est dans les fondations :

- l'isolation stricte entre associations (une faille y est catastrophique) ;
- le contrôle d'accès contextuel (techniquement exigeant) ;
- la configurabilité sans bascule dans la sur-ingénierie.

Ces fondations sont difficiles, mais elles relèvent de problèmes connus et documentés, pour lesquels le porteur a les bases. Le risque n'est pas l'impossibilité technique ; c'est le **temps** que ces fondations exigent avant la moindre fonctionnalité visible (voir section 3).

### 2.3 La tension sur le choix de pile technique

Il faut nommer honnêtement un arbitrage qui pèse directement sur la faisabilité, et qui sera tranché dans `architecture_technique.md` :

| Option | Avantage | Coût en faisabilité |
|---|---|---|
| Pile professionnelle maîtrisée (celle du quotidien du porteur) | Vitesse maximale, risque minimal, le porteur est immédiatement productif | Apport moindre à la montée en compétence visée |
| Pile en cours d'apprentissage (celle des projets personnels) | Montée en compétence, valeur portfolio accrue, cohérence avec les objectifs de carrière | Vitesse réduite, risque accru, temps d'apprentissage à financer sur un budget temps déjà tendu |

Du strict point de vue de la faisabilité, **la pile maîtrisée est le choix le plus sûr** : un projet solo mené en parallèle d'une activité prenante a tout intérêt à minimiser les inconnues. Le désir légitime de monter en compétence sur une autre pile est un objectif de carrière, pas un objectif de faisabilité — et mélanger les deux est une cause classique d'enlisement. La décision finale est renvoyée au document d'architecture, mais l'étude de faisabilité recommande de ne pas cumuler deux paris (un projet ambitieux *et* une pile nouvelle) sur un budget temps contraint.

---

## 3. Faisabilité humaine et temporelle

C'est la dimension la plus critique, et la plus sous-estimée par tout porteur de projet solo. C'est ici que la plupart des projets de ce type échouent — non par incapacité technique, mais par épuisement du budget temps.

### 3.1 La réalité du budget temps

Le porteur est dans une transition de vie : fin d'études et d'alternance, recherche d'un poste, puis entrée en poste. Cette trajectoire a une conséquence directe et incontournable :

> Le temps disponible pour Solivio va probablement **diminuer**, pas augmenter, dans les mois qui viennent. Une prise de poste réduit fortement le temps et l'énergie résiduels pour un projet personnel exigeant.

Cela renverse l'intuition habituelle (« je commencerai vraiment quand j'aurai un poste stable »). En réalité, la période la plus propice à poser les fondations lourdes est probablement **maintenant ou avant la prise de poste**, tant que le temps est plus disponible. Une fois en poste, le projet doit pouvoir avancer par petites touches, sans dépendre de longues plages de concentration.

### 3.2 La conséquence sur la conception du projet

Cette contrainte n'est pas un détail : elle doit façonner le projet lui-même.

- Le projet doit être **découpé en incréments très courts**, chacun apportant une valeur autonome. Pas de chantier de trois mois sans rien de livrable.
- Les fondations lourdes (multi-association, contrôle d'accès) doivent être posées **en priorité et pendant la période de disponibilité maximale**, car elles n'apportent rien de visible mais conditionnent tout.
- Le périmètre doit être **impitoyablement réduit** (principe P7). Chaque fonctionnalité non essentielle est une menace directe sur la faisabilité temporelle.

### 3.3 Le risque d'épuisement

Mener un projet exigeant en parallèle d'une vie professionnelle est un marathon, pas un sprint. Les signes d'alerte classiques : périodes d'intensité suivies d'abandons, culpabilité, sentiment de dette envers les utilisateurs. La réponse n'est pas la volonté (elle s'épuise) mais la **structure** :

- des objectifs petits et atteignables plutôt qu'une vision écrasante toujours hors de portée ;
- l'acceptation que le projet avance lentement, et que c'est acceptable ;
- l'open source et l'auto-hébergement comme soupapes : si le porteur ralentit, les associations auto-hébergées ne sont pas pénalisées, ce qui réduit la pression.

### 3.4 Verdict partiel

La faisabilité temporelle est réelle **à condition** d'accepter un rythme lent, un périmètre réduit, et un découpage en incréments courts. Elle est illusoire si le projet est mené comme une course contre la montre vers une plateforme complète.

---

## 4. Faisabilité organisationnelle

### 4.1 L'atout : un terrain réel

Solivio n'est pas un projet hors-sol. Le porteur a accès à un terrain concret — une association étudiante de solidarité — qui sert de cas d'usage fondateur. C'est un avantage majeur sur les projets purement spéculatifs : il y a un besoin réel, des utilisateurs réels, et la possibilité de valider sur le terrain.

### 4.2 La condition non remplie à ce jour : la validation terrain explicite

Il faut être honnête sur ce point. À ce stade, le besoin a été **présumé et raisonné**, pas encore **observé et confirmé** auprès des utilisateurs réels de l'association. C'est la principale faiblesse organisationnelle actuelle.

Avant tout développement significatif, une étape est nécessaire : observer comment l'association gère réellement son activité aujourd'hui, où elle perd du temps, et confirmer que l'outil envisagé répond à un vrai point de douleur. Sans cette étape, le risque est de construire un outil techniquement excellent pour un problème mal compris.

Cette validation n'est pas coûteuse (quelques heures d'observation et d'échange), mais elle est **prioritaire**. Elle est inscrite comme préalable dans la roadmap.

### 4.3 Le risque d'adoption

Même un bon outil peut ne pas être adopté. Les freins identifiés dans l'analyse de la concurrence s'appliquent : le tableur est gratuit et déjà en place, les équipes associatives sont non techniques, et le renouvellement annuel des bureaux fragilise toute adoption durable. La faisabilité organisationnelle dépend donc autant de la **simplicité d'usage** que de la qualité technique.

---

## 5. Faisabilité juridique et réglementaire

### 5.1 L'enjeu : des données sensibles, un porteur seul

Solivio traite des données de personnes en situation de précarité — des données à caractère social, potentiellement sensibles. Le porteur, en hébergeant l'instance, devient **sous-traitant** au sens du RGPD, chaque association étant responsable de traitement. Cela emporte des obligations réelles.

### 5.2 Ce qui est atteignable par une personne seule

La bonne nouvelle : la conformité RGPD pour un projet de cette nature est atteignable, à condition d'intégrer les bons réflexes dès la conception plutôt que de les ajouter après. Les exigences réalistes :

- hébergement en Union européenne (déjà acté : l'infrastructure visée est européenne) ;
- minimisation des données collectées (ne collecter que le strict nécessaire) ;
- pseudonymisation dans les statistiques et les journaux ;
- accès restreint par défaut et traçabilité des actions sensibles (le contrôle d'accès et l'audit, déjà au cœur du projet) ;
- possibilité d'exporter et de supprimer les données (déjà prévue) ;
- des conditions d'utilisation et un accord de sous-traitance type, signés par chaque association.

La plupart de ces exigences **coïncident avec des choix de conception déjà retenus**. Le RGPD n'est donc pas un fardeau ajouté : il est largement aligné avec l'architecture envisagée.

### 5.3 Ce qui dépasse une personne seule

Il faut le dire clairement : la rédaction d'un accord de sous-traitance solide et de conditions d'utilisation juridiquement valables n'est pas du ressort d'un développeur. Le jour où des associations tierces s'inscrivent, un accompagnement juridique (même ponctuel, même via des modèles validés) sera nécessaire. Ce n'est pas un obstacle à la faisabilité, mais un coût et une dépendance à anticiper, pas à improviser.

### 5.4 Verdict partiel

Faisable, à condition de traiter la conformité comme un invariant de conception (ce qui est déjà le cas) et de ne pas improviser le volet contractuel le moment venu.

---

## 6. Faisabilité économique

Cette dimension est traitée en détail dans `modele_economique.md`. En synthèse : les coûts d'infrastructure sont de l'ordre d'une dizaine d'euros par mois au démarrage, couvrables par l'autofinancement. La faisabilité économique n'est pas un point dur. Le coût réel est le temps du porteur (traité en section 3), pas l'argent.

Verdict partiel : faisable sans réserve sur le plan financier.

---

## 7. Analyse consolidée des risques

Synthèse des risques majeurs, évalués selon leur probabilité et leur impact, avec la réponse prévue.

| Risque | Probabilité | Impact | Réponse prévue |
|---|---|---|---|
| Épuisement / abandon du porteur | Élevée | Critique | Périmètre réduit, incréments courts, open source comme soupape |
| Dérive de périmètre | Élevée | Élevé | Discipline de sobriété (P7), version étagée stricte |
| Besoin mal validé sur le terrain | Moyenne | Élevé | Observation terrain préalable, inscrite comme prioritaire |
| Faible adoption (concurrence du tableur) | Moyenne | Élevé | Simplicité d'usage supérieure au tableur, intégration plutôt que remplacement |
| Diminution du temps disponible (prise de poste) | Élevée | Moyen | Poser les fondations pendant la période de disponibilité, conception par petites touches |
| Non-conformité RGPD | Faible | Critique | Conformité par conception, accompagnement juridique le moment venu |
| Fuite de données entre associations | Faible | Critique | Isolation stricte par conception, tests d'isolation dédiés |
| Dépendance à une seule personne | Élevée | Élevé | Open source, auto-hébergement, structure dédiée à terme, documentation |
| Coûts financiers | Faible | Faible | Autofinancement, coûts marginaux |

Lecture : les risques critiques par leur impact (RGPD, fuite de données) ont une probabilité maîtrisable par la conception. Les risques les plus probables (épuisement, dérive, baisse de temps) sont des risques humains et de discipline, pas techniques. C'est cohérent avec le constat du modèle économique : le danger est humain avant d'être technique ou financier.

---

## 8. Scénarios

### 8.1 Scénario réaliste (le plus probable)

Le porteur pose les fondations pendant sa période de disponibilité, livre une première version utilisable par l'association pilote sur quelques distributions, puis avance lentement par incréments une fois en poste. Le projet ne devient pas une plateforme nationale, mais il rend un service réel à une ou deux associations, constitue une référence solide sur le CV, et reste vivant grâce à l'open source. **C'est un succès.**

### 8.2 Scénario favorable

Le besoin se confirme largement, d'autres associations adoptent l'outil, une structure dédiée se monte, des contributeurs rejoignent le projet, des financements arrivent. Solivio devient un commun numérique reconnu dans son secteur. Possible, mais ne doit pas être le scénario sur lequel on parie : il dépend de facteurs hors du contrôle du porteur.

### 8.3 Scénario d'échec

Le projet vise trop large d'emblée, les fondations n'en finissent pas, rien de visible n'est livré, le porteur s'épuise et abandonne. Aucun utilisateur réel n'a jamais touché l'outil. **C'est l'échec, et c'est le scénario que toute la conception cherche à éviter.** Il survient presque toujours par excès d'ambition initiale, jamais par manque de compétence.

---

## 9. Conditions de réussite

Le projet est faisable si, et seulement si, ces conditions sont tenues :

1. **Le périmètre de la première version est impitoyablement réduit.** Une distribution, des inscriptions, des rappels, un pointage. Rien de plus tant que ça ne tourne pas en réel.
2. **La validation terrain a lieu avant le développement significatif.** Observer avant de construire.
3. **Les fondations lourdes sont posées pendant la période de disponibilité maximale.**
4. **Le projet est découpé en incréments courts**, chacun livrable et utile.
5. **Le choix de pile ne cumule pas deux paris.** Soit la vitesse, soit l'apprentissage, pas les deux sur un budget temps contraint.
6. **L'ambition de plateforme reste un horizon, pas un point de départ.** On généralise après avoir réussi pour une association, jamais avant.

---

## 10. Verdict

**Le projet est faisable**, et le porteur est bien, voire particulièrement bien armé pour le mener — notamment grâce à son expérience en production et à son expertise sur le contrôle d'accès, qui est le cœur différenciant du produit.

**Mais cette faisabilité est conditionnelle.** Elle suppose une discipline de sobriété et un rythme lent assumé. Le même projet, mené avec une ambition maximale et immédiate, par une personne seule en parallèle d'une vie professionnelle, **n'est pas faisable** et conduirait au scénario d'échec.

La frontière entre les deux n'est pas la compétence : c'est la **discipline de périmètre**. C'est rassurant, car cette frontière est entièrement sous le contrôle du porteur.

---

## 11. Synthèse en une page

**Techniquement.** Faisable, et le porteur est très bien positionné : expérience fullstack en production, et expertise directe sur le contrôle d'accès qui est le cœur du produit. La difficulté est dans les fondations multi-association, pas dans les fonctionnalités.

**Humainement.** C'est le point critique. Le temps disponible va diminuer avec la prise de poste, pas augmenter. Le projet doit être conçu pour avancer lentement, par petites touches, avec un périmètre réduit. Le vrai risque est l'épuisement, pas l'incompétence.

**Organisationnellement.** Atout réel (un terrain concret), mais une condition encore non remplie : confirmer le besoin par l'observation avant de construire.

**Juridiquement.** Faisable, car la conformité RGPD coïncide largement avec les choix de conception déjà faits. Un accompagnement juridique ponctuel sera nécessaire le moment venu.

**Économiquement.** Aucun point dur : une dizaine d'euros par mois.

**Le verdict.** Faisable dans sa version étagée et sobre. Non faisable dans son ambition maximale immédiate. La différence se joue sur une seule variable, entièrement sous contrôle : la discipline de périmètre.

---

*Fin de l'étude de faisabilité. Document suivant : `specifications_fonctionnelles.md`.*
