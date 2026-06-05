# Architecture technique — Solivio

> Comment le produit est construit : style architectural, pile technique, et chemin d'évolution vers les microservices.

**Document structurant — version 1.0**
**Statut : référence de travail**
**Dernière mise à jour : juin 2026**

---

## Avertissement de lecture

Ce document décrit les choix techniques de Solivio : le style d'architecture, les technologies, et la manière de les assembler. Il traduit en infrastructure les décisions des documents précédents, en respectant deux contraintes fortes posées par le porteur :

1. **Un objectif d'apprentissage assumé.** Le projet est aussi un terrain de montée en compétence sur des technologies que le porteur veut maîtriser (Spring Boot, Kafka, Keycloak, Vault/OpenBao, Next.js, conteneurisation, intégration continue). Ce n'est pas un caprice : c'est un objectif de carrière légitime, cohérent avec une trajectoire vers un rôle de Tech Lead.
2. **Une discipline de livraison.** Conformément à l'étude de faisabilité, l'architecture ne doit pas mettre en péril la livraison de la V1. C'est pourquoi le style retenu réconcilie apprentissage et livrabilité (voir section 2).

**Sur les versions.** Toutes les versions citées sont à jour au moment de la rédaction (juin 2026) et ont été vérifiées. Mais elles bougent vite — Spring Boot, Next.js, PostgreSQL et Kafka publient des versions toutes les quelques semaines à quelques mois. Le principe directeur est : **toujours partir de la dernière version stable, et la revérifier au démarrage effectif du projet.** Le tableau de la section 16 donne l'état de référence de juin 2026.

---

## 1. Vue d'ensemble

Solivio est composé de quatre grands ensembles techniques, tous conteneurisés :

| Ensemble | Technologie | Rôle |
|---|---|---|
| Frontend | Next.js (React, TypeScript) | L'interface web, rendue côté serveur pour les pages publiques |
| Backend | Spring Boot (Java) | La logique métier, organisée en monolithe modulaire |
| Authentification | Keycloak | La gestion des identités et des accès, déléguée |
| Données et secrets | PostgreSQL, Kafka, Vault/OpenBao | Persistance, événementiel asynchrone, gestion des secrets |

Le tout est conteneurisé avec Docker, intégré et déployé via GitLab CI/CD, et hébergé sur une infrastructure européenne (cohérent avec le RGPD et le modèle économique).

L'enchaînement type d'une requête depuis un navigateur : le navigateur interagit avec Next.js ; pour la connexion, Spring Boot joue le rôle de BFF (Backend for Frontend) et gère lui-même le flow OIDC avec Keycloak — les tokens ne transitent jamais par le navigateur, ils sont chiffrés dans des cookies HttpOnly. Pour les appels API, Spring Boot vérifie les droits, lit ou écrit dans PostgreSQL, publie au besoin des événements dans Kafka (par exemple pour déclencher une notification), et récupère ses secrets depuis OpenBao.

Depuis une application mobile Capacitor, le flow est différent : l'application gère elle-même le flow PKCE avec Keycloak et envoie le token en header `Authorization: Bearer`. Spring Boot accepte les deux modes de manière transparente.

---

## 2. Le style architectural : monolithe modulaire évolutif

### 2.1 La décision et sa justification

Le backend est un **monolithe modulaire** : une seule application déployable, mais découpée à l'intérieur en modules aux frontières nettes. Ce n'est ni un monolithe en bloc (le « gros tas » difficile à maintenir), ni des microservices (plusieurs applications déployées séparément).

Ce choix réconcilie les deux contraintes de l'avertissement :

- Il **permet d'apprendre** Kafka, Keycloak, Vault, la conteneurisation et l'intégration continue dès le départ, car ces briques fonctionnent à l'identique quel que soit le style monolithe ou microservices.
- Il **protège la livraison**, car il évite la complexité opérationnelle des microservices (déploiements multiples, cohérence distribuée, tracing inter-services) qui, pour un développeur seul, est le principal risque d'enlisement.
- Il **prépare l'évolution** : les modules ayant des frontières claires et communiquant par événements, on pourra en extraire un en microservice plus tard, comme un exercice d'apprentissage délibéré, sur une base stable. C'est d'ailleurs ainsi que procèdent la plupart des entreprises : monolithe d'abord, extraction ensuite.

### 2.2 Les modules internes

Le monolithe est découpé en modules correspondant aux domaines fonctionnels des spécifications :

| Module | Responsabilité |
|---|---|
| Identité et accès | Personnes, rôles, permissions, affiliations |
| Distributions | Distributions, créneaux, cycle de vie |
| Inscriptions | Inscriptions, listes d'attente, présence |
| Répartition | Denrées et calcul de dotation |
| Notifications | Envoi des emails sur événements |
| Audit | Journal des actions sensibles |
| Socle multi-association | Isolation, configuration, contexte tenant |

### 2.3 Comment les modules communiquent

Deux modes de communication, choisis pour préparer l'extraction future :

- **Appels synchrones par interface** pour les besoins immédiats (par exemple, le module Répartition demande au module Inscriptions le nombre d'inscrits). Ces appels passent par des interfaces explicites, jamais par un accès direct aux données internes d'un autre module.
- **Événements asynchrones via Kafka** pour découpler les modules (par exemple, à l'inscription d'un bénéficiaire, le module Inscriptions publie un événement ; le module Notifications le consomme et envoie l'email de confirmation). C'est ce découplage par événements qui rendra l'extraction en microservice indolore le moment venu, et c'est aussi le vecteur d'apprentissage de Kafka.

> Règle de conception : aucun module n'accède aux tables d'un autre module. Les frontières sont respectées comme si chaque module était déjà un service séparé. C'est la discipline qui garantit l'extraction future.

---

## 3. Le backend : Spring Boot

### 3.1 Versions et socle

Le backend repose sur **Spring Boot 4** (version 4.0.6 stable en juin 2026, construite sur Spring Framework 7 et Spring Security 7), exécuté sur **Java 25** (la version LTS publiée en septembre 2025, bénéficiant du support de première classe de Spring Boot 4). La version 4.1 est attendue peu après la rédaction ; le principe de partir de la dernière stable s'applique.

### 3.2 Structure interne d'un module

Chaque module suit une organisation en couches inspirée de l'architecture hexagonale, qui isole la logique métier des détails techniques :

- une couche **domaine** (les règles métier pures, par exemple le calcul de dotation avec arrondi et plancher) ;
- une couche **application** (l'orchestration des cas d'usage) ;
- une couche **infrastructure** (la persistance, l'accès à Kafka, les appels externes).

Cette isolation a un double bénéfice : elle rend la logique métier testable sans base de données, et elle facilite l'extraction future d'un module en service autonome.

### 3.3 Persistance

La persistance utilise **JPA/Hibernate**, avec **Flyway** pour la gestion versionnée des migrations de schéma. Les migrations sont rejouables et s'appliquent de façon contrôlée, y compris sur plusieurs schémas (voir la section base de données).

### 3.4 La réalisation de l'isolation multi-association

Le modèle de données posait le principe d'isolation sans en fixer la réalisation physique. Ce document tranche : **un schéma PostgreSQL par association** (stratégie schema-per-tenant). Hibernate gère nativement ce mode de multi-tenance : un résolveur de contexte détermine, à chaque requête, l'association concernée (à partir du jeton d'authentification ou du sous-domaine), et oriente automatiquement les requêtes vers le bon schéma.

Avantages, déjà énoncés dans le modèle de données et confirmés ici : isolation forte par construction, migration et sauvegarde par association, export et suppression propres d'une association entière.

### 3.5 L'API

Le backend expose une **API REST** documentée automatiquement via **OpenAPI**. La documentation générée sert autant au frontend qu'à la future ouverture d'une interface publique (prévue en V3). Spring Boot 4 introduisant un versionnage stable des points d'accès HTTP, l'API est versionnée dès le départ pour préparer les évolutions sans rupture.

---

## 4. L'authentification : Keycloak

### 4.1 Pourquoi déléguer l'authentification

Conformément au principe « déléguer la commodité » du modèle économique, l'authentification n'est pas reconstruite : elle est confiée à **Keycloak** (version 26 en juin 2026), une solution open source mature, désormais projet de la fondation CNCF, qui gère identités, connexion, double authentification, rôles et jetons selon les standards OpenID Connect et OAuth 2.0.

### 4.2 Deux clients Keycloak, deux patterns d'accès

Deux clients Keycloak sont configurés dans le realm `solivio` (exporté dans `keycloak/realm-solivio.json`) :

| Client | Type | Usage |
|---|---|---|
| `solivio-backend` | Confidentiel (secret) | BFF : Spring Boot gere le flow Authorization Code avec Keycloak pour les clients browser |
| `solivio-frontend` | Public (PKCE) | PKCE natif : l'application mobile Capacitor gere elle-meme son flow OIDC |

Les roles Solivio (`responsable`, `coordinateur`, `benevole`, `beneficiaire`) sont des roles de realm Keycloak, portes dans le claim `realm_access.roles` du JWT. Le claim `association_id` (attribut utilisateur Keycloak) identifie l'association du token et est lu par le backend pour router vers le bon schema tenant.

### 4.3 Pattern BFF (Backend for Frontend) pour les clients browser

Pour les clients browser (Next.js), Spring Boot joue le role de BFF stateless :

1. L'utilisateur est redirige vers `/oauth2/authorization/keycloak` (Spring Boot).
2. Spring Boot redirige vers Keycloak (Authorization Code + PKCE via `solivio-backend`).
3. Keycloak redirige vers le callback Spring Boot avec le code.
4. Spring Boot echange le code contre les tokens et les chiffre en cookies HttpOnly (AES-256-GCM, cle depuis OpenBao).
5. Les requetes API suivantes utilisent ces cookies ; Spring Boot dechiffre et valide le JWT.

Pour les clients mobiles (Capacitor), le flow PKCE est gere nativement par l'application, et le token est envoye en header `Authorization: Bearer`. Spring Boot accepte les deux modes via un `CompositeBearerTokenResolver`.

La cle de chiffrement des cookies est stockee dans OpenBao (`secret/solivio-api`, cle `cookie.encryption-key`) et injectee au demarrage via Spring Cloud Vault Config. Les cookies de token utilisent `SameSite=Strict` ; le cookie d'etat OAuth2 utilise `SameSite=Lax` (necessaire car Keycloak redirige depuis un domaine different).

### 4.4 Multi-association et Keycloak

Pour la V1 (une seule association pilote), un seul espace Keycloak suffit. Pour le multi-association, deux stratégies existent : la fonctionnalité **Organizations** de Keycloak (multi-tenance au sein d'un même realm, introduite récemment) ou un realm par association. La première est plus légère à exploiter et constitue la piste privilégiée ; le choix définitif est à valider au moment où la deuxième association arrive. En V1, ce point n'a pas à être tranché.

---

## 5. L'asynchrone et l'événementiel : Apache Kafka

### 5.1 Versions et mode de fonctionnement

L'événementiel asynchrone repose sur **Apache Kafka 4** (version 4.2 en juin 2026). Point important de cette génération : Kafka 4 fonctionne **exclusivement en mode KRaft**, ZooKeeper ayant été entièrement supprimé. Le déploiement en est simplifié — un composant de moins à exploiter, ce qui est une bonne nouvelle pour un projet porté par une personne.

### 5.2 Usages en V1

En V1, Kafka sert à :

- **découpler les notifications** : un événement « inscription confirmée » ou « distribution annulée » est publié par le module concerné et consommé par le module Notifications, qui envoie l'email ;
- **alimenter l'audit** de façon asynchrone, sans ralentir les opérations ;
- **préparer les traitements lourds futurs** (génération de documents en V2, par exemple) qui se grefferont naturellement sur ce socle événementiel.

### 5.3 Le double bénéfice

Kafka apporte ici deux choses à la fois : un découplage réel et utile dès la V1, et le support d'apprentissage que le porteur recherche. Surtout, c'est l'épine dorsale qui permettra d'extraire des modules en microservices plus tard : un module déjà découplé par événements peut devenir un service autonome sans réécriture de la communication.

---

## 6. La base de données : PostgreSQL

Le stockage relationnel repose sur **PostgreSQL 18** (version 18.4 en juin 2026). Choix justifié par sa robustesse, sa maturité, son support natif par Hibernate et Keycloak, et sa parfaite adéquation avec la stratégie schema-per-tenant.

Points clés :

- **Un schéma par association**, créé automatiquement lors de l'ajout d'une association (provisioning).
- **Migrations multi-schéma via Flyway** : un mécanisme central applique les migrations sur l'ensemble des schémas, de façon ordonnée et traçable.
- **Sauvegardes** régulières, par association lorsque c'est pertinent, conformément à l'exigence de pouvoir restaurer ou exporter une association isolément.

---

## 7. La gestion des secrets : Vault ou OpenBao

### 7.1 Le besoin

Les secrets (identifiants de base de données, clés d'API des services tiers, clés de signature des jetons) ne doivent jamais vivre en clair dans le code ni dans les fichiers de configuration. Une solution dédiée les centralise, les chiffre, et les distribue de façon contrôlée — au backend comme au frontend pour ce qui le concerne.

### 7.2 Un point de licence à connaître

Le porteur a cité Vault. Une précision importante, vérifiée en juin 2026, et qui touche directement l'engagement open source du projet :

- **HashiCorp Vault** est passé en 2023 sous licence **BSL 1.1** (Business Source License), qui n'est pas une licence open source au sens strict : elle autorise l'usage en production mais interdit d'offrir le logiciel en service hébergé concurrent de l'offre commerciale. HashiCorp ayant été racheté par IBM (début 2025), Vault est désormais un produit IBM. Chaque version repasse en open source (MPL 2.0) quatre ans après sa publication.
- **OpenBao** est le fork **open source** (licence MPL 2.0), né en réaction à ce changement, gouverné par la Linux Foundation, **compatible API avec Vault** (version 2.5 en février 2026, avec contributions notamment de GitLab et d'IBM).

### 7.3 La recommandation

Pour un projet sous licence AGPL et à vocation de service hébergé, **OpenBao est le choix le plus cohérent** : il est pleinement open source, sans ambiguïté de licence, et compatible API avec Vault — ce qui signifie que l'apprentissage est entièrement transférable (les concepts et l'interface sont les mêmes). Le porteur apprend donc exactement les mêmes mécanismes, tout en restant aligné avec l'éthique du projet.

À noter : pour l'usage interne de Solivio (gérer ses propres secrets), la licence BSL de Vault ne serait probablement pas bloquante, car Solivio n'offre pas Vault comme service. Mais OpenBao évite toute zone grise et s'inscrit dans la cohérence open source du projet. C'est un arbitrage à confirmer, la recommandation penche vers OpenBao.

---

## 8. Le frontend : Next.js

### 8.1 Versions et socle

Le frontend repose sur **Next.js 16** (version 16.2 en juin 2026, sur React 19), en **TypeScript**, avec **Tailwind CSS** pour le style. L'App Router est utilisé pour structurer l'application et gérer le contexte d'association.

### 8.2 Rôles du frontend

- **Rendu côté serveur** pour les pages publiques (page d'une association, futures pages de campagne), bénéfique pour l'accès et le référencement.
- **Contexte d'association** : le branding (logo, couleurs) est appliqué dynamiquement selon l'association, via le système de layouts.
- **Authentification via le BFF** : le frontend ne gere pas de tokens directement. Il redirige vers Spring Boot (`/oauth2/authorization/keycloak`), qui gere le flow OIDC et pose des cookies HttpOnly chiffres. Les appels API sont authentifies par ces cookies, transparents pour le code Next.js.
- **Support mobile** : le frontend Next.js est aussi la base de l'application mobile Capacitor. En contexte Capacitor, le flow PKCE est gere nativement avec le client `solivio-frontend` (voir section 4.3). Spring Boot accepte les deux modes via son `CompositeBearerTokenResolver`.
- **Priorité au mobile** : l'inscription des bénéficiaires et le pointage le jour J doivent être impeccables sur téléphone, conformément à l'exigence non fonctionnelle des spécifications.

### 8.3 CORS

Les origines autorisees pour les requetes cross-origin sont configurees via la propriete `solivio.cors.allowed-origins` (pas codee en dur). En dev : `http://localhost:3000`. En prod : l'URL publique du frontend. Les cookies de session etant `HttpOnly`, `credentials: true` est necessaire pour que le navigateur les envoie sur les requetes cross-origin vers le backend.

### 8.4 Vigilance sécurité

Next.js a connu en 2026 plusieurs avis de sécurité importants (contournements d'autorisation via le middleware, notamment). La règle est donc stricte : **se tenir à jour des correctifs de sécurité**, et ne jamais faire reposer une autorisation sensible uniquement sur le middleware frontend. L'autorité en matière de droits reste le backend.

---

## 9. La conteneurisation : Docker

Toute la pile est conteneurisée avec **Docker**. En développement, **Docker Compose** orchestre l'ensemble (backend, frontend, PostgreSQL, Keycloak, Kafka, OpenBao) pour reproduire localement un environnement proche de la production en une commande. Les images sont construites en plusieurs étapes (multi-stage) pour rester légères.

La conteneurisation sert aussi la promesse d'auto-hébergement du modèle économique : une association techniquement équipée doit pouvoir lancer Solivio à partir d'une configuration Docker documentée.

---

## 10. L'intégration et le déploiement continus : GitLab CI/CD

Le projet utilise **GitLab CI/CD**. Le pipeline type enchaîne :

1. **analyse statique et style** du code (backend et frontend) ;
2. **tests** : unitaires, d'intégration, fonctionnels (voir section 11) ;
3. **construction** des images Docker ;
4. **migrations** de base de données contrôlées ;
5. **déploiement** vers l'environnement cible.

L'intégration continue n'est pas un confort : c'est ce qui permet à un développeur seul d'avancer sans régression, et c'est aussi une compétence DevOps que le porteur veut consolider.

---

## 11. La stratégie de tests

La consigne du porteur est claire : tests unitaires, fonctionnels et d'intégration, systématiquement. Le détail :

| Type de test | Portée | Outil principal |
|---|---|---|
| Unitaires | Logique métier pure (calcul de dotation, règles de fréquence, listes d'attente) | Cadre de test Java standard |
| Intégration | Modules avec vraie base de données et vrai Kafka | Testcontainers (conteneurs jetables) |
| Fonctionnels / bout en bout | Parcours critiques (inscription, pointage, répartition) | Outils E2E côté frontend et API |
| Isolation multi-association | Vérifier qu'aucune association n'accède aux données d'une autre | Suite dédiée, écrite avant le code |
| Sécurité | Contrôle d'accès, validation des entrées | Tests ciblés et revue |

> La **suite d'isolation multi-association** est traitée à part car elle est critique : une fuite inter-association serait catastrophique (données de précarité). Ces tests sont écrits tôt et exécutés à chaque intégration. C'est la traduction technique de l'exigence d'isolation.

L'usage de **Testcontainers** est déjà familier au porteur, ce qui réduit le risque sur ce volet.

---

## 12. L'observabilité

Même un monolithe a besoin d'être observé. Trois piliers :

- **Journaux structurés** (au format exploitable), portant systématiquement l'identifiant de l'association concernée, pour pouvoir diagnostiquer sans confondre les associations.
- **Métriques applicatives** (temps de réponse, taux d'erreur), exposées par Spring Boot via son module de supervision.
- **Traçabilité métier** assurée par le journal d'audit (distinct des journaux techniques).

Une solution de visualisation (tableaux de bord de métriques) pourra être ajoutée quand l'échelle le justifiera ; en V1, l'essentiel est que les journaux et métriques existent et soient lisibles.

---

## 13. La sécurité

Synthèse des exigences techniques de sécurité, dont plusieurs sont déjà des invariants des documents précédents :

- chiffrement des échanges (HTTPS partout) ;
- secrets gérés par OpenBao, jamais en clair — y compris la cle de chiffrement des cookies (`secret/solivio-api`, cle `cookie.encryption-key`) ;
- tokens de session chiffres en AES-256-GCM dans des cookies HttpOnly (SameSite=Strict) — le navigateur ne voit jamais les JWT en clair ;
- CSRF protege par `csrf.spa()` de Spring Security 7 : cookie `XSRF-TOKEN` + header `X-XSRF-TOKEN` ;
- authentification déléguée à Keycloak, jetons vérifiés côté backend uniquement ;
- contrôle d'accès appliqué côté backend, jamais uniquement côté frontend ;
- validation stricte de toutes les entrées côté serveur ;
- limitation de débit par association et par point d'accès, pour éviter qu'une association ne dégrade le service des autres ;
- journal d'audit des actions sensibles ;
- hébergement en Union européenne ;
- mises à jour de sécurité suivies, en particulier sur Next.js et les dépendances.

---

## 14. Le chemin d'évolution vers les microservices

Le monolithe modulaire n'est pas une fin : c'est une base saine pour une extraction progressive, lorsque le porteur voudra approfondir les architectures distribuées sur un socle stable.

L'ordre d'extraction naturel, du plus simple au plus engageant :

1. **Le module Notifications** : déjà découplé par événements Kafka, faiblement couplé au reste, c'est le premier candidat évident. L'extraire en service autonome est un excellent premier exercice.
2. **Les traitements lourds** (génération de documents en V2) : naturellement asynchrones, ils se prêtent bien à un service dédié.
3. **Les modules métier de cœur** (distributions, inscriptions) : à n'extraire que si un besoin réel d'échelle ou d'autonomie le justifie, jamais par principe.

La règle de discipline reste : on extrait un service quand il y a une raison concrète (échelle, autonomie d'équipe, apprentissage délibéré), jamais pour faire des microservices par esthétique. Les frontières de modules respectées dès la V1 sont ce qui rend cette extraction possible sans douleur.

---

## 15. Convention de nommage du code

Point laissé ouvert par le modèle de données. Recommandation : choisir une convention unique (français sans accents, ou anglais) et s'y tenir partout. Le domaine et l'équipe étant francophones, le français sans accents est acceptable et cohérent avec la documentation ; l'anglais est plus courant dans l'écosystème technique et facilite l'ouverture à des contributeurs externes (cohérent avec l'open source). En l'absence de contrainte forte, l'anglais pour le code technique et le français pour le vocabulaire métier visible est un compromis répandu. Décision à acter au démarrage, sans enjeu bloquant.

---

## 16. Tableau des versions de référence

État vérifié en juin 2026. À revérifier au démarrage effectif : ces versions évoluent toutes les quelques semaines à quelques mois.

| Brique | Version de référence (juin 2026) | Note |
|---|---|---|
| Java | 25 (LTS, sept. 2025) | Support de première classe par Spring Boot 4 |
| Spring Boot | 4.0.6 | Sur Spring Framework 7, Spring Security 7 ; 4.1 attendue |
| Next.js | 16.2 | Sur React 19 |
| Node.js | LTS active | À confirmer au démarrage (la LTS courante) |
| PostgreSQL | 18.4 | |
| Keycloak | 26 | Fonctionnalité Organizations pour le multi-tenance |
| Apache Kafka | 4.2 | Mode KRaft exclusif, sans ZooKeeper |
| Gestion des secrets | OpenBao 2.5 | Recommandé plutôt que Vault (BSL) pour l'alignement open source |
| Conteneurisation | Docker / Docker Compose | |
| Intégration continue | GitLab CI/CD | |
| Tests d'intégration | Testcontainers | Déjà maîtrisé par le porteur |

---

## 17. Ce que ce document implique pour la suite

- La **roadmap** (`roadmap.md`) doit refléter l'ordre de construction : d'abord le socle (conteneurisation, base, Keycloak, OpenBao, squelette Spring Boot et Next.js), puis les modules métier, puis l'événementiel.
- Les **parcours utilisateurs** (`parcours_utilisateurs.md`) doivent tenir compte de la priorité mobile et de l'intégration Keycloak pour les écrans de connexion.
- La complexité réelle de cette pile (Spring Boot 4, Kafka, Keycloak, OpenBao, Next.js) confirme l'avertissement de l'étude de faisabilité : le périmètre fonctionnel de la V1 doit rester minimal pour que l'apprentissage de la pile reste tenable. Architecture riche, périmètre fonctionnel sobre.

---

## 18. Synthèse en une page

**Le style.** Un monolithe modulaire évolutif : une seule application déployable, découpée en modules à frontières nettes, communiquant par interfaces et par événements Kafka, conçue pour extraire des microservices plus tard. Cela réconcilie l'apprentissage voulu et la livraison à protéger.

**La pile (juin 2026).** Backend Spring Boot 4 sur Java 25 ; frontend Next.js 16 sur React 19 en TypeScript (base de l'app mobile Capacitor) ; authentification via BFF stateless — Spring Boot gere le flow OIDC avec Keycloak 26, tokens chiffres AES-256-GCM en cookies HttpOnly, fallback Bearer header pour Capacitor ; base PostgreSQL 18 en schéma par association ; événementiel Apache Kafka 4 en mode KRaft ; secrets gérés par OpenBao plutôt que Vault, pour l'alignement open source ; le tout conteneurisé avec Docker et livré par GitLab CI/CD.

**L'isolation.** Un schéma PostgreSQL par association, géré nativement par Hibernate, avec une suite de tests dédiée à la non-fuite inter-association.

**Les tests.** Unitaires, intégration (Testcontainers), fonctionnels, isolation et sécurité — systématiques.

**L'évolution.** Extraction progressive de microservices à partir du module Notifications, sur un socle stable, quand une raison concrète le justifie — jamais par principe.

**Le principe de prudence.** Architecture riche, périmètre fonctionnel sobre. C'est la condition pour que l'ambition technique ne mette pas la livraison en péril.

---

*Fin de l'architecture technique. Document suivant : `parcours_utilisateurs.md`.*
