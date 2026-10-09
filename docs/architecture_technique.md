# Architecture technique - Solivio

> Comment le produit est construit : style architectural, pile technique, exploitation, et décisions d'architecture (ADR).

**Document structurant - version 2.1**
**Statut : référence de travail**
**Dernière mise à jour : octobre 2026**

## Avertissement de lecture

Ce document décrit les choix techniques de Solivio et les décisions d'architecture qui les justifient (section 14, ADR). Il traduit en infrastructure les documents fonctionnels, avec deux contraintes :

1. **Une seule association.** Depuis octobre 2026, Solivio est construit pour Linkee Toulouse uniquement (ADR-001). Les briques pensées pour un déploiement multi-association (schéma par association, Keycloak, Kafka, OpenBao) ont été retirées : elles alourdissaient chaque évolution sans rien apporter à une association unique.
2. **Une discipline de livraison.** Le projet est porté par un développeur seul. Toute brique d'infrastructure doit se justifier par un besoin réel, et pouvoir être exploitée sur le VPS existant.

**Sur les versions.** Les versions bougent vite. Le principe directeur reste : partir de la dernière version stable et supportée, et la revérifier sur la documentation officielle avant toute installation ou mise à jour (règle de `CLAUDE.md`). Le tableau de la section 13 donne l'état de référence.

## 1. Vue d'ensemble

| Ensemble | Technologie | Rôle |
|---|---|---|
| Frontend web | Next.js (React, TypeScript, Tailwind CSS) | Interface web, rendu serveur des pages publiques |
| Application mobile | Expo (React Native, Expo Router, NativeWind) | Application mobile des bénévoles et bénéficiaires (ADR-007) |
| Backend | Spring Boot (Java) avec Spring Modulith | Logique métier, monolithe modulaire vérifié (ADR-002) |
| Données | PostgreSQL | Persistance, y compris le registre des événements internes |
| Exploitation | Docker, Traefik, Grafana Alloy, Loki, Prometheus, Tempo, Grafana, Infisical | Conteneurs, routage HTTPS, observabilité, secrets (stack commune du VPS) |

Enchaînement type d'une requête : le navigateur interagit avec Next.js ; les appels API arrivent sur Spring Boot, qui authentifie la requête (jeton JWT en cookie HttpOnly ou en en-tête `Authorization: Bearer` pour le mobile), vérifie les droits, lit ou écrit dans PostgreSQL et publie au besoin un événement interne (par exemple pour déclencher une notification). L'événement est enregistré dans la même transaction que la donnée métier, puis traité après validation de celle-ci (section 4).

## 2. Le style architectural : monolithe modulaire vérifié

### 2.1 La décision

Le backend est un **monolithe modulaire** : une seule application déployable, découpée en modules aux frontières nettes. Ce choix évite la complexité opérationnelle des microservices (déploiements multiples, cohérence distribuée), qui est le principal risque d'enlisement pour un développeur seul, tout en gardant le code organisé par domaine.

Depuis octobre 2026, les frontières ne reposent plus sur la seule discipline : **Spring Modulith** les vérifie automatiquement (ADR-002). Un test de modularité échoue dès qu'un module accède aux internes d'un autre, et ce test fait partie de la construction (`./mvnw verify`), donc de l'intégration continue.

### 2.2 Les modules

Chaque module est un sous-package direct de `com.solivio.api` :

| Module | Responsabilité |
|---|---|
| `identity` | Comptes, personnes, rôles, authentification, invitations, profil bénéficiaire |
| `association` | Configuration de l'association (nom, logo, couleurs, contact, fuseau, fréquence), export RGPD |
| `distribution` | Distributions, créneaux, lieux, cycle de vie |
| `inscription` | Inscriptions, listes d'attente, pointage (dont pointage ad hoc), rôles bénévoles |
| `repartition` | Denrées et calcul de dotation |
| `notification` | Emails déclenchés par les événements, rappels, email libre |
| `statistique` | Statistiques agrégées et pseudonymisées |
| `evenement` | Événements de l'association et participations |
| `collecte` | Missions de collecte |
| `reconditionnement` | Sessions de reconditionnement |
| `audit` | Journal des actions sensibles |
| `shared` | Ports et types partagés explicitement exposés aux autres modules |

### 2.3 Comment les modules communiquent

- **Appels synchrones par port** pour les besoins immédiats (par exemple le module `repartition` demande au module `inscription` le nombre d'inscrits). Le port est une interface publique du module appelé (ou de `shared`), jamais un accès direct à son repository ou à ses entités.
- **Événements internes** pour découpler les effets secondaires (par exemple `inscription` publie qu'une inscription est confirmée, `notification` envoie l'email). Voir section 4.

> Règle de conception : aucun module n'accède aux tables, repositories ou entités d'un autre module. Le test de modularité Spring Modulith en est le garant.

### 2.4 Structure interne d'un module

Chaque module suit une organisation en couches inspirée de l'architecture hexagonale :

- `domain` : règles métier pures (par exemple le calcul de dotation avec arrondi et plancher), testables sans base de données ;
- `application` : orchestration des cas d'usage, transactions, publication d'événements ;
- `infrastructure` : persistance (`persistence`), API HTTP (`web`), planification, intégrations externes.

Flux d'une requête : `Requête -> Validation -> Autorisation -> Service applicatif -> Domaine -> Persistance -> Réponse`. Les controllers restent minces.

## 3. Le backend : Spring Boot

### 3.1 Socle

Spring Boot 4 (Spring Framework 7, Spring Security 7) sur Java 25 (LTS). Spring Boot 4 apporte Jackson 3 (`tools.jackson.*`) et Hibernate 7 ; voir les notes de migration dans la mémoire du projet et les release notes officielles avant toute montée de version.

### 3.2 Persistance

JPA/Hibernate, avec **Flyway** comme seul maître du schéma : toute modification passe par une migration versionnée, jamais par une génération automatique ni une modification manuelle. Un seul schéma PostgreSQL (`public`) et un seul emplacement de migrations (ADR-001).

### 3.3 L'API

API REST, documentée automatiquement par OpenAPI (springdoc), exposée uniquement dans les profils de développement et de test. Les réponses d'erreur suivent une enveloppe unique, `{"error": {"code", "message", "details", "request_id"}}` : `code` est un identifiant stable destiné au client (`VALIDATION_FAILED`, `NOT_FOUND`, `UNAUTHENTICATED`...), `message` est lisible par l'utilisateur, `details` liste les champs invalides d'une validation, et `request_id` relie une erreur visible à ses journaux et traces. Une ressource inexistante ou non autorisée répond `404`, jamais une confirmation de son existence.

## 4. Les événements internes : Spring Modulith

### 4.1 Pourquoi pas Kafka

Kafka avait été retenu pour l'apprentissage et pour préparer une extraction en microservices. Pour une association unique sur un VPS, il ajoutait un service lourd à exploiter, et l'envoi des messages se faisait avant la validation de la transaction (un rollback pouvait quand même déclencher un email). Il est remplacé par les événements internes de Spring Modulith (ADR-003).

### 4.2 Fonctionnement

1. Un service transactionnel publie un événement (record Java) avec `ApplicationEventPublisher`.
2. Le **registre de publication** (table `event_publication`, starter JDBC) enregistre une entrée par écouteur concerné, dans la même transaction que la donnée métier. Si la transaction échoue, aucun événement n'existe.
3. Après validation, chaque écouteur `@ApplicationModuleListener` (asynchrone, dans sa propre transaction) traite l'événement. En cas de succès, l'entrée est marquée terminée (mode `archive`) ; en cas d'échec, elle reste en attente.
4. Les publications non terminées sont republiées au redémarrage, et une tâche planifiée relance celles en échec. Une alerte se déclenche si des publications restent bloquées.

Conséquence : la livraison est garantie **au moins une fois**. Un écouteur doit donc tolérer d'être exécuté deux fois pour le même événement (par exemple ne pas envoyer deux fois le même email si la trace d'envoi existe déjà).

### 4.3 Usages

- Notifications : confirmation d'inscription, promotion depuis la liste d'attente, désistement tardif d'un bénévole, annulation de distribution, d'événement, de mission de collecte ou de session de reconditionnement, rappel de la veille.
- Statistiques : calcul et enregistrement des statistiques à la clôture d'une distribution.

## 5. L'authentification

### 5.1 Le choix : authentification intégrée

L'authentification est assurée par le backend lui-même (ADR-004), sans fournisseur d'identité externe à héberger :

- connexion par email et mot de passe (haché en Argon2id), avec vérification de l'email et réinitialisation par code à usage unique ;
- connexion Google (OAuth 2.0 / OpenID Connect via Spring Security), avec rattachement au compte existant par email ;
- jeton d'accès JWT signé (HMAC-SHA256), de courte durée ;
- jeton de rafraîchissement aléatoire, stocké haché en base, avec rotation à chaque usage et révocation possible.

### 5.2 Transport des jetons

- **Navigateur** : jetons en cookies `HttpOnly`, `Secure` en production, `SameSite=Strict`. Le JavaScript du frontend ne les lit jamais.
- **Mobile (Expo)** : jetons conservés dans le stockage sécurisé de l'appareil (`expo-secure-store`) et envoyés en en-tête `Authorization: Bearer`.

Le backend accepte les deux modes. Derrière Traefik, Spring Boot doit faire confiance aux en-têtes `X-Forwarded-*` pour que les cookies reçoivent l'attribut `Secure`.

### 5.3 Rôles

`super_admin` (drapeau sur le compte), `admin`, `responsable`, `coordinateur`, `benevole`, `beneficiaire`. Les rôles sont portés dans le jeton et vérifiés côté backend (`@PreAuthorize`). Le frontend n'est jamais une frontière de sécurité.

## 6. La base de données : PostgreSQL

PostgreSQL 18, un seul schéma. Points clés :

- migrations Flyway uniquement ;
- le registre des événements internes vit dans la même base (table `event_publication` et son archive) ;
- sauvegardes planifiées (`pg_dump`) conservées hors du VPS, avec un test de restauration documenté ;
- la base n'est jamais exposée hors du réseau Docker de l'application.

## 7. Les secrets : Infisical

Aucun secret n'est écrit dans le code ni dans un fichier de configuration versionné (ADR-005). L'application lit ses secrets dans des variables d'environnement. En production, ces variables sont injectées au lancement par **Infisical**, déjà hébergé sur le VPS : le script de déploiement s'authentifie avec une identité machine dédiée à l'environnement, puis exécute `infisical run -- docker compose up -d`. Aucun fichier `.env` contenant des secrets n'existe sur le serveur.

Seule exception, imposée par Prometheus : le jeton de lecture des métriques est un fichier côté infrastructure, égal à la variable `METRICS_SCRAPE_TOKEN` de l'application.

L'application refuse de démarrer si un secret obligatoire manque (par exemple une clé de signature JWT absente ou trop courte), plutôt que de démarrer dans un état incohérent.

## 8. Le frontend web : Next.js

- Next.js 16 (App Router) sur React 19, TypeScript strict, Tailwind CSS v4, icônes `lucide-react`.
- Rendu serveur pour les pages publiques ; `proxy.ts` (remplaçant de `middleware.ts` depuis Next.js 16) pour les redirections d'authentification, qui ne sont qu'un confort : l'autorité reste le backend.
- Priorité au mobile : l'inscription et le pointage du jour J doivent être impeccables sur téléphone.
- Les variables `NEXT_PUBLIC_*` sont figées au moment de la construction de l'image : elles doivent être fournies en argument de build, jamais seulement à l'exécution.

## 9. L'application mobile : Expo

L'application mobile est une application **Expo / React Native** (Expo Router, NativeWind), distincte du frontend web (ADR-007). Elle consomme la même API que le web, en mode Bearer. Capacitor, un temps envisagé dans une version antérieure de ce document, n'est pas retenu.

Elle est gelée depuis la refonte du socle d'octobre 2026 : les changements d'API de cette refonte (retrait du choix d'association, du code d'association à l'inscription) seront repris lors de sa remise à niveau (ADR-007).

## 10. Conteneurisation et déploiement

- Images Docker multi-étapes, exécutées sans privilège root, avec contrôle de santé.
- En développement, Docker Compose lance PostgreSQL (et un serveur SMTP de test) ; backend et frontend tournent sur la machine ou en conteneur.
- En production, l'application est déployée sur le VPS commun derrière **Traefik** (HTTPS Let's Encrypt). Un seul hôte public : `/api`, `/oauth2` et `/login/oauth2` sont routés vers le backend, le reste vers le frontend, ce qui permet de garder des cookies `SameSite=Strict` sans CORS. Deux routes `/api` appartiennent au serveur Next.js (`/api/auth/server-refresh`, `/api/health`) et passent en priorité. Le frontend est donc construit sans URL d'API : une même image sert la préproduction et la production.
- Sauvegarde quotidienne de la base et des fichiers déposés par le service `backup`, chiffrée par clé publique et copiée sur Cloudflare R2, avec un test de restauration trimestriel (ADR-009, `docker/backup/README.md`).
- Environnements : la branche `dev` alimente la préproduction (`https://staging.solivio.joeltech.fr`, projet Compose `solivio-staging`), la branche `main` la production (`https://solivio.joeltech.fr`, projet `solivio`). Les deux tournent sur le même VPS, avec des secrets Infisical distincts.
- Intégration et déploiement continus : GitHub Actions, images publiées sur GHCR et étiquetées par SHA de commit, déploiement par script SSH avec Infisical (ADR-008), sans coupure grâce à `docker-rollout` (ADR-010). Les images ne sont jamais construites sur le serveur.

## 11. L'observabilité

L'application s'intègre à la stack d'observabilité commune du VPS (dépôt `infrastructure`) :

- **Journaux** : JSON au format ECS sur la sortie standard (profil `prod`), collectés par Grafana Alloy vers Loki. Chaque ligne porte le `request_id`, l'identifiant de trace (`traceId`, `spanId`) et, si la requête est authentifiée, l'identifiant (UUID) du compte (`account_id`). Aucune donnée personnelle ni aucune donnée de `profil_beneficiaire` n'est journalisée.
- **Identifiant de requête** : attribué à chaque requête (ou repris de l'en-tête `X-Request-Id` s'il est sûr), renvoyé dans l'en-tête de réponse et dans le corps de chaque erreur, pour relier une erreur signalée à ses journaux.
- **Métriques** : Micrometer, exposées au format Prometheus sur `/actuator/prometheus`, sur le port de gestion `8081` non routé par Traefik et protégé par le jeton `METRICS_SCRAPE_TOKEN` (en-tête `Authorization: Bearer`, comparaison à temps constant ; sans jeton configuré, les métriques sont inaccessibles). Le port de gestion expose aussi les sondes `/actuator/health/liveness` et `/actuator/health/readiness`, publiques et sans détail. Métriques techniques (HTTP, JVM, pool de connexions) et métiers :
  - `solivio_inscriptions_confirmees_total`, `solivio_inscriptions_promues_total`, `solivio_desistements_tardifs_total` ;
  - `solivio_distributions_terminees_total`, `solivio_distributions_annulees_total` ;
  - `solivio_evenements_publications_incompletes` et `solivio_evenements_publications_echouees`, état du registre des événements internes, support de l'alerte sur les emails non envoyés.
- **Traces** : OpenTelemetry (OTLP HTTP) vers Tempo dans le profil `prod` (`OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`, par défaut `http://tempo:4318/v1/traces`), y compris les interactions entre modules publiées par Spring Modulith. Seule la propagation W3C est acceptée. L'attribut `deployment.environment.name` vient de `DEPLOYMENT_ENVIRONMENT` (`staging` ou `production`).
- **Tableaux de bord et alertes** : provisionnés comme du code dans le dépôt `infrastructure` (Grafana) : tableau de bord "Solivio - Application" (variable d'environnement), six alertes de production (backend injoignable, réponses 5xx, latence, échecs de connexion, événements internes en échec, erreurs dans les journaux). La préproduction est collectée sur un réseau séparé (`observability-staging`), sans alerte.
- **Disponibilité** : moniteurs Uptime Kuma sur PostgreSQL (nom complet du conteneur), sur l'URL publique de santé de chaque environnement et sur les sauvegardes (moniteur "push").
- **Traçabilité métier** : assurée par le journal d'audit, distinct des journaux techniques.

## 12. La sécurité

- HTTPS partout ; HSTS et en-têtes de sécurité.
- Secrets injectés par Infisical, jamais versionnés.
- Jetons en cookies `HttpOnly`/`Secure`/`SameSite=Strict` ; la protection CSRF repose sur `SameSite=Strict` et un CORS strict (décision documentée, ADR-004).
- Limitation de débit et verrouillage temporaire sur la connexion, la vérification d'email et la réinitialisation du mot de passe.
- Contrôle d'accès côté backend uniquement ; validation et assainissement de toutes les entrées côté serveur.
- `profil_beneficiaire` à accès restreint, jamais exposé au pointage ni aux statistiques ; statistiques agrégées et pseudonymisées.
- Journal d'audit des actions sensibles ; hébergement en Union européenne ; dépendances surveillées en intégration continue.

## 13. Tableau des versions de référence

À revérifier avant toute installation ou mise à jour.

| Brique | Version de référence | Note |
|---|---|---|
| Java | 25 (LTS) | |
| Spring Boot | 4.1.x | Montée depuis 4.0.6 requise par Spring Modulith 2.1 |
| Spring Modulith | 2.1.x | Aligné sur Spring Boot 4.1 |
| Next.js | 16.2 | Sur React 19 |
| Expo | SDK 54 | React Native 0.81 ; mise à jour prévue à la reprise du mobile |
| PostgreSQL | 18 | |
| Traefik, Loki, Alloy, Prometheus, Tempo, Grafana, Infisical | Versions fixées dans le dépôt `infrastructure` | Stack commune du VPS |
| Tests d'intégration | Testcontainers (PostgreSQL) | |

## 14. Décisions d'architecture (ADR)

Chaque décision est numérotée. Une décision n'est jamais modifiée silencieusement : on en écrit une nouvelle qui la remplace.

### ADR-001 - Une seule association

- **Statut** : acceptée (octobre 2026).
- **Contexte** : Solivio visait à l'origine le réseau national Linkee, d'où un schéma PostgreSQL par association (multi-tenant). Linkee Toulouse est devenue une association locale autonome, seule utilisatrice du produit.
- **Décision** : un seul schéma, une seule configuration d'association (enregistrement unique). Suppression du routage de schéma, du choix d'association à la connexion, du code d'association à l'inscription, de l'administration des associations et du claim `tenant` du jeton.
- **Conséquences** : chaque fonctionnalité n'a plus à prouver son isolation entre associations. Si une autre association voulait un jour Solivio, elle déploierait sa propre instance (le code est sous AGPL), plutôt que de partager une base.

### ADR-002 - Spring Modulith pour vérifier les frontières de modules

- **Statut** : acceptée (octobre 2026).
- **Contexte** : la règle "un module n'accède jamais aux internes d'un autre" n'était garantie que par la discipline.
- **Décision** : Spring Modulith décrit les modules (`package-info.java`, `@ApplicationModule`, `@NamedInterface`) et un test (`ApplicationModules.verify()`) échoue en cas de violation ou de cycle. La documentation des modules est générée dans `docs/modules/`.
- **Conséquences** : toute violation bloque la construction. Nécessite Spring Boot 4.1 pour Spring Modulith 2.1.

### ADR-003 - Événements internes avec registre de publication, à la place de Kafka

- **Statut** : acceptée (octobre 2026). Remplace le choix de Kafka de la version 1.0 de ce document.
- **Contexte** : Kafka était surdimensionné pour une association unique, coûteux à exploiter sur le VPS, et ses envois avaient lieu avant la validation de la transaction.
- **Décision** : événements Spring publiés depuis les services transactionnels, traités par des écouteurs `@ApplicationModuleListener`, avec registre de publication JDBC (Spring Modulith), mode de complétion `archive`, republication au redémarrage et relance planifiée des échecs.
- **Conséquences** : plus de service Kafka ; aucun événement émis pour une transaction annulée ; livraison au moins une fois, donc écouteurs tolérants à la double exécution.

### ADR-004 - Authentification intégrée (JWT) plutôt que Keycloak

- **Statut** : acceptée (octobre 2026). Remplace le choix de Keycloak de la version 1.0 de ce document, jamais mis en œuvre dans le code.
- **Contexte** : l'authentification a été implémentée dans le backend (JWT, Google OAuth 2.0). Keycloak aurait ajouté un service lourd à héberger.
- **Décision** : conserver l'authentification intégrée et la durcir : limitation de débit, verrouillage temporaire, politique de mot de passe, rotation des jetons de rafraîchissement, prise en compte des en-têtes de proxy. CSRF désactivé côté Spring Security, compensé par des cookies `SameSite=Strict` et un CORS limité aux origines connues ; toute évolution qui relâcherait l'une de ces deux conditions doit réactiver une protection CSRF.
- **Conséquences** : la sécurité de l'authentification est sous la responsabilité du projet ; elle est couverte par des tests dédiés.

### ADR-005 - Secrets par variables d'environnement injectées par Infisical

- **Statut** : acceptée (octobre 2026). Remplace OpenBao.
- **Contexte** : OpenBao ne fournissait en pratique que la clé de signature JWT, et ajoutait un service à exploiter. Le VPS dispose déjà d'Infisical, utilisé par les autres projets.
- **Décision** : l'application lit uniquement des variables d'environnement ; Infisical les injecte en production ; un fichier `.env.example` documente la liste complète sans valeur réelle.
- **Conséquences** : plus de dépendance Spring Cloud Vault ; échec explicite au démarrage si un secret obligatoire manque.

### ADR-006 - Observabilité par la stack commune du VPS

- **Statut** : acceptée (octobre 2026).
- **Décision** : journaux JSON sur la sortie standard, métriques Prometheus sur un port de gestion protégé par jeton, traces OTLP vers Tempo, tableaux de bord et alertes dans le dépôt `infrastructure`.
- **Conséquences** : le nom du projet Compose (`solivio`, `solivio-staging`) doit figurer dans la liste des projets autorisés de l'infrastructure, sinon les journaux ne sont pas collectés.

### ADR-007 - Application mobile Expo

- **Statut** : acceptée (octobre 2026). Remplace la mention de Capacitor de la version 1.0 de ce document.
- **Décision** : l'application mobile reste une application Expo / React Native, distincte du frontend web, qui consomme l'API en mode Bearer.
- **Conséquences** : gelée depuis la refonte du socle, puis mise en suspens le 9 octobre 2026 au profit d'un frontend web pleinement responsive (`solivio_mobile/README.md`) ; à sa reprise : mise à jour du SDK, reprise des ruptures d'API ci-dessous, ajout de tests et d'un job d'intégration continue, builds via EAS.
- **Ruptures d'API à reprendre dans le mobile** (refonte d'octobre 2026) :
  - `POST /api/auth/switch-tenant` et `/api/admin/associations` n'existent plus : retirer l'écran `tenant-select`, `switchTenant()` et l'écran d'administration des associations ;
  - `TokenResponse` ne contient plus `tenants`, `MeResponse` ne contient plus `tenantActif` ;
  - l'inscription et la finalisation d'un compte Google ne prennent plus de `codeAssociation` ;
  - les erreurs suivent l'enveloppe `{"error": {"code", "message", "details", "request_id"}}` : le mobile lit encore `detail` (ProblemDetail) et n'affiche plus que des messages génériques ;
  - les mots de passe suivent la nouvelle politique (8 à 128 caractères, mots de passe courants refusés), et la connexion peut répondre `429` (limite de débit ou compte temporairement verrouillé).

### ADR-008 - GitHub Actions et GHCR

- **Statut** : acceptée (octobre 2026). Remplace GitLab CI/CD.
- **Décision** : intégration continue sur GitHub Actions (qualité, tests, couverture, analyse de sécurité), images sur GHCR étiquetées par SHA, déploiement par SSH avec Infisical ; `dev` vers la préproduction, `main` vers la production.
- **Conséquences** : migration du dépôt vers GitHub ; même modèle de déploiement que les autres projets hébergés sur le VPS.

### ADR-009 - Sauvegardes par un service dédié, chiffrées par clé publique, vers Cloudflare R2

- **Statut** : acceptée (octobre 2026). Remplace les scripts lancés par le cron du VPS, jamais mis en service.
- **Contexte** : une tâche cron sur l'hôte demandait une phrase de chiffrement et des clés de stockage en clair dans des fichiers du serveur, hors d'Infisical, et une configuration manuelle que rien ne versionne. Cobage, sur le même VPS, sauvegarde déjà depuis un conteneur vers R2.
- **Décision** : un service `backup` dans le fichier Compose de chaque environnement (image construite par la CI, planification par supercronic) exécute `pg_dump`, archive les fichiers déposés, chiffre pour une clé publique GPG versionnée et envoie l'archive dans un bucket R2 dédié, avec un jeton R2 limité à ce bucket et donné à ce seul service. Rétention dégressive (7 jours, 4 semaines, 3 mois) ; moniteur "push" Uptime Kuma.
- **Conséquences** : aucun secret ni configuration de sauvegarde sur l'hôte ; la clé privée vit hors du VPS, la restauration commence donc par un déchiffrement sur une machine de confiance ; les secrets R2 deviennent obligatoires au déploiement.

### ADR-010 - Déploiement sans coupure par docker-rollout derrière Traefik

- **Statut** : acceptée (octobre 2026).
- **Contexte** : `docker compose up` remplaçait backend et frontend en place, d'où une interruption à chaque déploiement, le temps que la nouvelle version démarre. Cobage a résolu ce problème avec `docker-rollout`.
- **Décision** : le script de déploiement bascule backend et frontend avec `docker-rollout` (v0.14, figé par commit et vérifié par empreinte) : la nouvelle version démarre à côté de l'ancienne, Traefik ne lui envoie du trafic qu'une fois son contrôle de santé au vert (readiness pour le backend), puis l'ancienne est vidée et arrêtée. Le vidage passe par le contrôle de santé : un fichier `/tmp/drain` le fait échouer, Traefik retire le conteneur du routage, puis l'arrêt gracieux termine les requêtes en cours. Pas de nginx : contrairement à Cobage (PHP-FPM), les deux applications servent HTTP elles-mêmes et Traefik découvre les conteneurs dynamiquement.
- **Conséquences** : une version qui ne devient jamais saine est retirée et l'ancienne continue de servir ; les migrations Flyway restent additives, l'ancienne version tournant sur le nouveau schéma pendant la bascule ; le nom des conteneurs backend et frontend change à chaque déploiement (`-1`, `-2`...), aucune surveillance ne doit le viser ; pendant le chevauchement (une à deux minutes), les tâches planifiées existent en double, un déploiement à 08:00 pourrait donc envoyer deux fois le rappel de la veille.

## 15. Synthèse

**Le style.** Un monolithe modulaire dont les frontières sont vérifiées par Spring Modulith, avec des événements internes fiables (registre de publication) pour découpler les effets secondaires.

**La pile.** Spring Boot 4 sur Java 25, PostgreSQL 18, Next.js 16 sur React 19, application mobile Expo ; authentification intégrée (JWT, Google) ; secrets Infisical ; Docker derrière Traefik ; observabilité Loki, Prometheus, Tempo, Grafana ; GitHub Actions.

**Le principe de prudence.** Pas de brique d'infrastructure sans besoin réel. Une association, une base, une application.
