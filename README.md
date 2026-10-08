# Solivio

Plateforme de gestion opérationnelle de Linkee Toulouse, association de solidarité étudiante.

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)

## Description

Solivio est une plateforme open source (web et mobile) qui permet à Linkee Toulouse de gérer son activité opérationnelle : organisation des distributions alimentaires, inscriptions des bénéficiaires et bénévoles, pointage, répartition équitable des denrées, événements, missions de collecte, reconditionnement, notifications automatiques et suivi statistique.

Il remplace les tableurs et messageries utilisés jusqu'ici, respecte la confidentialité des données des personnes en situation de précarité et permet d'exporter toutes les données de l'association. Une autre association peut déployer sa propre instance (licence AGPL).

La documentation complète du projet (note d'intention, spécifications fonctionnelles, modèle de données, architecture) est disponible dans le dossier [`docs/`](docs/).

## Fonctionnalités (V1)

- Gestion des distributions avec deux modes de créneau (plage unique ou créneaux découpés par horaire)
- Inscription des bénéficiaires et bénévoles avec liste d'attente automatique
- Pointage confidentiel le jour de la distribution
- Calcul de la répartition des denrées par bénéficiaire à partir du conditionnement
- Notifications email automatiques (confirmation, rappel, annulation)
- Statistiques agrégées et pseudonymisées
- Événements, missions de collecte et sessions de reconditionnement
- Export des données de l'association

## Stack technique

| Couche | Technologie |
|---|---|
| Backend | Spring Boot 4, Java 25, Spring Modulith (modules vérifiés, événements internes) |
| Frontend web | Next.js 16, React 19, TypeScript, Tailwind CSS v4 |
| Mobile | Expo, React Native (gelé pendant la refonte du socle) |
| Base de données | PostgreSQL 18 |
| Authentification | JWT intégré au backend, connexion Google |
| Secrets | Variables d'environnement injectées par Infisical |
| Exploitation | Docker, Traefik, Loki, Prometheus, Tempo, Grafana |
| CI/CD | GitHub Actions et GHCR |

Les choix et leurs justifications sont dans [`docs/architecture_technique.md`](docs/architecture_technique.md) (ADR-001 à ADR-008).

## Prérequis

- Docker et Docker Compose
- Java 25 et Maven (ou utiliser le Maven wrapper inclus `./mvnw`)
- Node.js 24 LTS et npm
- Git

## Démarrage rapide

### 1. Cloner le dépôt

```bash
git clone https://github.com/Joello61/solivio.git
cd solivio
```

### 2. Démarrer l'infrastructure locale

```bash
docker compose -f docker-compose-dev.yml up -d
```

Cela démarre PostgreSQL et Mailpit (serveur SMTP de test).
Attendre que les services soient sains.

```bash
docker compose -f docker-compose-dev.yml ps
```

### 3. Démarrer le backend

```bash
cd solivio-api
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
```

Le profil `dev` fournit des valeurs locales non secrètes. Les variables attendues (dont la connexion Google, optionnelle en local) sont listées dans `.env.example` (racine du dépôt) et se passent en variables d'environnement.

L'API est disponible sur `http://localhost:8080`.
La documentation OpenAPI est disponible sur `http://localhost:8080/swagger-ui.html`.

### 4. Démarrer le frontend

```bash
cd solivio_frontend
npm install
npm run dev
```

L'application est disponible sur `http://localhost:3000`.

### 5. Accéder aux services locaux

| Service | URL | Identifiants |
|---|---|---|
| Application | http://localhost:3000 | - |
| API | http://localhost:8080 | - |
| Mailpit (emails) | http://localhost:8025 | - |

## Structure du projet

- `solivio-api/` : backend Spring Boot (`src/`, `pom.xml`, `Dockerfile`)
- `solivio_frontend/` : frontend Next.js (`app/`, `components/`, `lib/`, `Dockerfile`)
- `solivio_mobile/` : application mobile Expo (gelée pendant la refonte du socle)
- `docs/` : documentation du projet (`archive/` pour les documents historiques)
- `docker-compose-dev.yml` : services de développement (PostgreSQL, Mailpit)
- `docker-compose.yml` : stack déployée (préproduction et production), complétée sur le serveur par le routage Traefik (`docker-compose.prod.traefik.yml.example`) et le rattachement à l'observabilité (`docker-compose.*.observability.yml`)
- `docker/deploy/` : script et procédure de déploiement
- `docker/backup/` : sauvegarde, restauration et test de restauration
- `.github/workflows/ci.yml` : intégration continue puis déploiement (préproduction depuis `dev`, production depuis `main`)
- `CLAUDE.md` : règles de développement du projet

## Tests

```bash
# Backend : tests unitaires et d'intégration + vérification de la couverture (80% minimum)
cd solivio-api && ./mvnw verify

# Frontend : tests unitaires avec couverture
cd solivio_frontend && npm run test:coverage

# Frontend : tests de bout en bout (nécessite l'application en cours d'exécution)
cd solivio_frontend && npm run test:e2e
```

## Documentation

La documentation complète est dans le dossier [`docs/`](docs/) :

| Document | Contenu |
|---|---|
| [`note_intention.md`](docs/note_intention.md) | Vision, problème, positionnement |
| [`etude_faisabilite.md`](docs/etude_faisabilite.md) | Analyse des ressources et risques |
| [`specifications_fonctionnelles.md`](docs/specifications_fonctionnelles.md) | Fonctionnalités détaillées |
| [`modele_donnees.md`](docs/modele_donnees.md) | Entités et relations |
| [`architecture_technique.md`](docs/architecture_technique.md) | Choix techniques justifiés |
| [`parcours_utilisateurs.md`](docs/parcours_utilisateurs.md) | Expérience par type d'utilisateur |
| [`roadmap.md`](docs/roadmap.md) | Plan de développement |
| [`glossaire.md`](docs/glossaire.md) | Vocabulaire partagé |
| [`archive/`](docs/archive/) | Analyse de concurrence et modèle économique (périmètre national, historique) |

## Contribution

Les contributions sont les bienvenues.

1. Forker le projet
2. Créer une branche (`git checkout -b feature/ma-fonctionnalite`)
3. Committer les changements (`git commit -m "feat: description claire"`)
4. Pousser la branche (`git push origin feature/ma-fonctionnalite`)
5. Ouvrir une pull request vers `dev`

Les tests doivent passer et la couverture backend doit rester supérieure à 80 %. Les règles de développement sont dans [`CLAUDE.md`](CLAUDE.md).

## Licence

Ce projet est distribué sous licence **GNU Affero General Public License v3.0 (AGPL-3.0)**.

Cela signifie que toute version modifiée proposée comme service en ligne doit également être publiée en open source. Voir le fichier [LICENSE](LICENSE) pour les détails.

## Auteur

**Timothée Joël Tchinda Tchoffo**
Développeur fullstack, étudiant en Master MIASHS à l'Université Toulouse Jean Jaurès.

Profil : [github.com/Joello61](https://github.com/Joello61)
Portfolio : [joeltech.dev](https://joeltech.dev)