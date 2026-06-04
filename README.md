# Solivio

Plateforme de gestion operationnelle pour les associations de solidarite etudiante.

[![pipeline status](https://gitlab.com/tchindajoel61/solivio/badges/main/pipeline.svg)](https://gitlab.com/tchindajoel61/solivio/-/pipelines)
[![coverage](https://gitlab.com/tchindajoel61/solivio/badges/main/coverage.svg)](https://gitlab.com/TON_USERNAME/solivio/-/pipelines)
[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)

---

## Description

Solivio est une plateforme web open source qui permet aux associations de solidarite etudiante de gerer leur activite operationnelle : organisation des distributions alimentaires, inscriptions des beneficiaires et benevoles, repartition equitable des denrees, notifications automatiques et suivi statistique.

Le projet est concu pour les petites et moyennes structures qui gerent aujourd'hui leur activite avec des tableurs et des messageries. Il respecte la confidentialite des donnees des personnes en situation de precarite et n'enferme aucune association dans l'outil.

La documentation complete du projet (note d'intention, specifications fonctionnelles, modele de donnees, architecture) est disponible dans le dossier [`docs/`](docs/).

---

## Fonctionnalites (V1)

- Gestion des distributions avec deux modes de creneau (plage unique ou creneaux decoupes par horaire)
- Inscription des beneficiaires et benevoles avec liste d'attente automatique
- Pointage confidentiel le jour de la distribution
- Calcul de la repartition des denrees par beneficiaire a partir du conditionnement
- Notifications email automatiques (confirmation, rappel, annulation)
- Statistiques aggregees et pseudonymisees
- Architecture multi-association : un espace isole par organisation

---

## Stack technique

| Couche | Technologie |
|---|---|
| Backend | Spring Boot 4, Java 25 |
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS v4 |
| Base de donnees | PostgreSQL 18 (un schema par association) |
| Authentification | Keycloak 26 (OIDC, pattern BFF) |
| Evenementiel | Apache Kafka 4 (KRaft) |
| Secrets | OpenBao 2 |
| Conteneurisation | Docker, Docker Compose |
| CI/CD | GitLab CI/CD |

---

## Prerequis

- Docker et Docker Compose
- Java 25 et Maven (ou utiliser le Maven wrapper inclus `./mvnw`)
- Node.js 24 LTS et npm
- Git

---

## Demarrage rapide

### 1. Cloner le depot

```bash
git clone https://gitlab.com/tchindajoel61/solivio.git
cd solivio
```

### 2. Demarrer l'infrastructure locale

```bash
docker compose -f docker-compose-dev.yml up -d
```

Cela demarre PostgreSQL, Keycloak, Kafka, OpenBao et Mailpit.
Attendre que tous les services soient sains (environ 30 secondes).

```bash
docker compose -f docker-compose-dev.yml ps
```

### 3. Demarrer le backend

```bash
cd solivio-api
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
```

L'API est disponible sur `http://localhost:8080`.
La documentation OpenAPI est disponible sur `http://localhost:8080/swagger-ui.html`.

### 4. Demarrer le frontend

```bash
cd solivio-frontend
npm install
npm run dev
```

L'application est disponible sur `http://localhost:3000`.

### 5. Acceder aux services locaux

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
├── docker-compose-dev.yml  # Stack de developpement
├── init-db-dev.sql         # Initialisation des bases de donnees (dev)
├── .env.example            # Variables d'environnement de production
├── .gitlab-ci.yml          # Pipeline CI/CD
└── README.md
```

---

## Tests

```bash
# Backend : tests unitaires et d'integration + verification de la couverture (80% minimum)
cd solivio-api && ./mvnw verify

# Frontend : tests unitaires avec couverture
cd solivio-frontend && npm run test:coverage

# Frontend : tests de bout en bout (necessite l'application en cours d'execution)
cd solivio-frontend && npm run test:e2e
```

---

## Documentation

La documentation complete est dans le dossier [`docs/`](docs/) :

| Document | Contenu |
|---|---|
| [`note_intention.md`](docs/note_intention.md) | Vision, probleme, positionnement |
| [`analyse_concurrence.md`](docs/analyse_concurrence.md) | Etat du marche et positionnement |
| [`modele_economique.md`](docs/modele_economique.md) | Licence AGPL, modele de perennite |
| [`etude_faisabilite.md`](docs/etude_faisabilite.md) | Analyse des ressources et risques |
| [`specifications_fonctionnelles.md`](docs/specifications_fonctionnelles.md) | Fonctionnalites detaillees |
| [`modele_donnees.md`](docs/modele_donnees.md) | Entites et relations |
| [`architecture_technique.md`](docs/architecture_technique.md) | Choix techniques justifies |
| [`parcours_utilisateurs.md`](docs/parcours_utilisateurs.md) | Experience par type d'utilisateur |
| [`roadmap.md`](docs/roadmap.md) | Plan de developpement |
| [`glossaire.md`](docs/glossaire.md) | Vocabulaire partage |

---

## Contribution

Les contributions sont les bienvenues.

1. Forker le projet
2. Creer une branche (`git checkout -b feature/ma-fonctionnalite`)
3. Committer les changements (`git commit -m "feat: description claire"`)
4. Pousser la branche (`git push origin feature/ma-fonctionnalite`)
5. Ouvrir une Merge Request sur GitLab

Les tests doivent passer et la couverture backend doit rester superieure a 80%.

---

## Licence

Ce projet est distribue sous licence **GNU Affero General Public License v3.0 (AGPL-3.0)**.

Cela signifie que toute version modifiee proposee comme service en ligne doit egalement etre publiee en open source. Voir le fichier [LICENSE](LICENSE) pour les details.

---

## Auteur

**Timothee Joel Tchinda Tchoffo**
Developpeur fullstack, etudiant en Master MIASHS a l'Universite Toulouse Jean Jaures.

Profil : [gitlab.com/tchindajoel61](https://gitlab.com/tchindajoel61)
Portfolio : [joeltech.dev](https://joeltech.dev)