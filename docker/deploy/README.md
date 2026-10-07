# Déploiement

`.github/workflows/deploy.yml` construit les images une seule fois, après le succès du workflow `CI` sur un push, les pousse sur GHCR (étiquette : les 12 premiers caractères du SHA) puis appelle `ssh-deploy.sh` :

| Branche | Environnement GitHub | Projet Compose | Validation |
|---|---|---|---|
| `dev` | `staging` | `solivio-staging` | automatique |
| `main` | `production` | `solivio` | manuelle (reviewers requis) |

Le script synchronise le dépôt du serveur sur le commit testé (HEAD détaché), tire les images et relance la stack avec les secrets injectés par `infisical run`. Les migrations Flyway s'exécutent au démarrage du backend ; `docker compose up --wait` échoue si un conteneur n'atteint pas l'état sain.

## Prérequis sur le VPS (une fois par environnement)

1. **Répertoire de déploiement** : cloner le dépôt, par exemple dans `/opt/apps/solivio` (production) et `/opt/apps/solivio-staging` (préproduction).
2. **Routage Traefik** : copier `docker-compose.prod.traefik.yml.example` en `docker-compose.prod.traefik.yml` dans ce répertoire, remplacer le domaine et préfixer les routeurs et services de façon unique sur le serveur (`solivio`, `solivio-staging`). Le DNS du domaine doit pointer vers le VPS : Traefik obtient le certificat au premier appel HTTPS.
3. **Réseaux d'observabilité** : `observability-shared` (production) et `observability-staging` (préproduction) existent déjà, créés par le dépôt `infrastructure`.
4. **Accès à GHCR** : les images sont privées. Sur le serveur, une fois : `docker login ghcr.io -u <utilisateur> --password-stdin` avec un jeton limité à `read:packages`.
5. **Infisical** : un projet "Solivio" avec les environnements `staging` et `production`, renseignés avec les variables de `.env.example`, et une identité machine Universal Auth en lecture seule par environnement.
6. **Clé SSH** : une paire par environnement, la clé publique dans `~/.ssh/authorized_keys` de l'utilisateur de déploiement.
7. **Sauvegardes** : voir `docker/backup/README.md`.

## Environnements GitHub (Settings > Environments)

Créer `staging` et `production`, chacun avec ses propres secrets (mêmes noms, valeurs différentes) :

| Secret | Contenu |
|---|---|
| `SSH_PRIVATE_KEY` | Clé privée de déploiement de cet environnement |
| `SSH_HOST` | Adresse du VPS |
| `SSH_USER` | Utilisateur de déploiement |
| `DEPLOY_PATH` | Répertoire de déploiement (`/opt/apps/solivio` ou `/opt/apps/solivio-staging`) |
| `INFISICAL_PROJECT_ID` | Identifiant du projet Infisical "Solivio" |
| `INFISICAL_CLIENT_ID`, `INFISICAL_CLIENT_SECRET` | Identité machine de cet environnement |

Sur `production`, activer "Required reviewers" et restreindre les branches de déploiement à `main` ; sur `staging`, restreindre à `dev`.

## Rotation d'un secret

1. Générer la nouvelle valeur et la saisir dans Infisical (environnement concerné).
2. Relancer le dernier déploiement (bouton "Re-run" du workflow `Deploy`) ou, sur le serveur, `infisical run ... -- docker compose ... up -d`.
3. Pour `METRICS_SCRAPE_TOKEN`, mettre à jour le même jour le fichier de jeton de Prometheus dans le dépôt `infrastructure`.
4. Changer `SOLIVIO_AUTH_JWT_SECRET` déconnecte tous les utilisateurs : à faire hors des créneaux de distribution.

## Retour arrière

Relancer le workflow `Deploy` d'un commit antérieur (onglet Actions, "Re-run all jobs") : l'image de ce commit existe déjà sur GHCR. Une migration Flyway déjà appliquée ne se défait pas : les migrations restent additives pour que la version précédente fonctionne encore sur le nouveau schéma.
