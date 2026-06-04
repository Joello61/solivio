# Solivio

Plateforme de gestion opérationnelle pour les associations de solidarité étudiante.

[![pipeline status](https://gitlab.com/tchindajoel61/solivio/badges/main/pipeline.svg)](https://gitlab.com/tchindajoel61/solivio/-/pipelines)
[![coverage](https://gitlab.com/tchindajoel61/solivio/badges/main/coverage.svg)](https://gitlab.com/TON_USERNAME/solivio/-/pipelines)
[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)

---

## Description

Solivio est une plateforme web open source qui permet aux associations de solidarité étudiante de gérer leur activité opérationnelle : organisation des distributions alimentaires, inscriptions des bénéficiaires et bénévoles, répartition équitable des denrées, notifications automatiques et suivi statistique.

Le projet est conçu pour les petites et moyennes structures qui gèrent aujourd'hui leur activité avec des tableurs et des messageries. Il respecte la confidentialité des données des personnes en situation de précarité et n'enferme aucune association dans l'outil.

La documentation complète du projet (note d'intention, spécifications fonctionnelles, modèle de données, architecture) est disponible dans le dossier [`docs/`](docs/).

---

## Fonctionnalités (V1)

- Gestion des distributions avec deux modes de créneau (plage unique ou créneaux découpés par horaire)
- Inscription des bénéficiaires et bénévoles avec liste d'attente automatique
- Pointage confidentiel le jour de la distribution
- Calcul de la répartition des denrées par bénéficiaire à partir du conditionnement
- Notifications email automatiques (confirmation, rappel, annulation)
- Statistiques agrégées et pseudonymisées
- Architecture multi-association : un espace isolé par organisation

---

## Stack technique

| Couche | Technologie |
|---|---|
| Backend | Spring Boot 4, Java 25 |
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS v4 |
| Base de données | PostgreSQL 18 (un schéma par association) |
| Authentification | Keycloak 26 (OIDC, pattern BFF) |
| Événementiel | Apache Kafka 4 (KRaft) |
| Secrets | OpenBao 2 |
| Conteneurisation | Docker, Docker Compose |
| CI/CD | GitLab CI/CD |

---

## Prérequis

- Docker et Docker Compose
- Java 25 et Maven (ou utiliser le Maven wrapper inclus `./mvnw`)
- Node.js 24 LTS et npm
- Git

---

## Démarrage rapide

### 1. Cloner le dépôt

```bash
git clone https://gitlab.com/tchindajoel61/solivio.git
cd solivio
```

### 2. Démarrer l'infrastructure locale

```bash
docker compose -f docker-compose-dev.yml up -d
```

Cela démarre PostgreSQL, Keycloak, Kafka, OpenBao et Mailpit.
Attendre que tous les services soient sains (environ 30 secondes).

```bash
docker compose -f docker-compose-dev.yml ps
```

### 3. Démarrer le backend

```bash
cd solivio-api
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
```

L'API est disponible sur `http://localhost:8080`.
La documentation OpenAPI est disponible sur `http://localhost:8080/swagger-ui.html`.

### 4. Démarrer le frontend

```bash
cd solivio-frontend
npm install
npm run dev
```

L'application est disponible sur `http://localhost:3000`.

### 5. Accéder aux services locaux

| Service | URL | Identifiants |
|---|---|---|
| Application | http://localhost:3000 | - |
| API | http://localhost:8080 | - |
| Keycloak admin | http://localhost:9090 | admin / admin |
| OpenBao UI | http://localhost:8200 | token: root |
| Mailpit (emails) | http://localhost:8025 | - |

---

## Structure du projet

```
solivio/
├── solivio-api/            # Backend Spring Boot
│   ├── src/
│   ├── pom.xml
│   └── Dockerfile
├── solivio-frontend/       # Frontend Next.js
│   ├── src/
│   ├── package.json
│   └── Dockerfile
├── docs/                   # Documentation du projet
│   ├── note_intention.md
│   ├── specifications_fonctionnelles.md
│   ├── modele_donnees.md
│   ├── architecture_technique.md
│   └── ...
├── docker-compose.yml      # Stack de production
├── docker-compose-dev.yml  # Stack de développement
├── init-db-dev.sql         # Initialisation des bases de données (dev)
├── .env.example            # Variables d'environnement de production
├── .gitlab-ci.yml          # Pipeline CI/CD
└── README.md
```

---

## Tests

```bash
# Backend : tests unitaires et d'intégration + vérification de la couverture (80% minimum)
cd solivio-api && ./mvnw verify

# Frontend : tests unitaires avec couverture
cd solivio-frontend && npm run test:coverage

# Frontend : tests de bout en bout (nécessite l'application en cours d'exécution)
cd solivio-frontend && npm run test:e2e
```

---

## Documentation

La documentation complète est dans le dossier [`docs/`](docs/) :

| Document | Contenu |
|---|---|
| [`note_intention.md`](docs/note_intention.md) | Vision, problème, positionnement |
| [`analyse_concurrence.md`](docs/analyse_concurrence.md) | État du marché et positionnement |
| [`modele_economique.md`](docs/modele_economique.md) | Licence AGPL, modèle de pérennité |
| [`etude_faisabilite.md`](docs/etude_faisabilite.md) | Analyse des ressources et risques |
| [`specifications_fonctionnelles.md`](docs/specifications_fonctionnelles.md) | Fonctionnalités détaillées |
| [`modele_donnees.md`](docs/modele_donnees.md) | Entités et relations |
| [`architecture_technique.md`](docs/architecture_technique.md) | Choix techniques justifiés |
| [`parcours_utilisateurs.md`](docs/parcours_utilisateurs.md) | Expérience par type d'utilisateur |
| [`roadmap.md`](docs/roadmap.md) | Plan de développement |
| [`glossaire.md`](docs/glossaire.md) | Vocabulaire partagé |

---

## Contribution

Les contributions sont les bienvenues.

1. Forker le projet
2. Créer une branche (`git checkout -b feature/ma-fonctionnalite`)
3. Committer les changements (`git commit -m "feat: description claire"`)
4. Pousser la branche (`git push origin feature/ma-fonctionnalite`)
5. Ouvrir une Merge Request sur GitLab

Les tests doivent passer et la couverture backend doit rester supérieure à 80%.

---

## Licence

Ce projet est distribué sous licence **GNU Affero General Public License v3.0 (AGPL-3.0)**.

Cela signifie que toute version modifiée proposée comme service en ligne doit également être publiée en open source. Voir le fichier [LICENSE](LICENSE) pour les détails.

---

## Auteur

**Timothée Joël Tchinda Tchoffo**
Développeur fullstack, étudiant en Master MIASHS à l'Université Toulouse Jean Jaurès.

Profil : [gitlab.com/tchindajoel61](https://gitlab.com/tchindajoel61)
Portfolio : [joeltech.dev](https://joeltech.dev)