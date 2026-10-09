#!/usr/bin/env bash
#
# Deploie Solivio sur le VPS, appele par les jobs de deploiement de .github/workflows/ci.yml.
# Tire les images deja construites et testees par la CI (GHCR, etiquette = SHA du
# commit), jamais de build sur le serveur : l'image testee est l'image deployee.
#
# Usage : ssh-deploy.sh <staging|production>
# Variables attendues (secrets de l'environnement GitHub correspondant) :
#   SSH_PRIVATE_KEY, SSH_HOST, SSH_USER, DEPLOY_PATH, IMAGE_BASE, IMAGE_TAG,
#   INFISICAL_PROJECT_ID, INFISICAL_CLIENT_ID, INFISICAL_CLIENT_SECRET
#
# Les secrets applicatifs ne sont jamais ecrits sur le disque du serveur : "infisical
# run" les injecte dans l'environnement de docker compose, avec une identite machine
# propre a chaque environnement (lecture seule).
#
# Backend et frontend basculent sans coupure (docker-rollout, ADR-010) : la nouvelle
# version demarre a cote de l'ancienne, Traefik ne lui envoie du trafic qu'une fois
# son controle de sante au vert, puis l'ancienne est arretee. Une nouvelle version qui
# ne devient jamais saine est retiree et l'ancienne continue de servir.
#
# Les migrations Flyway s'executent au demarrage du backend, pendant que l'ancienne
# version sert encore : une migration doit rester additive.

set -euo pipefail

ENVIRONMENT="${1:?Usage: ssh-deploy.sh <staging|production>}"

case "$ENVIRONMENT" in
  staging)
    COMPOSE_PROJECT="solivio-staging"
    OBSERVABILITY_FILE="docker-compose.staging.observability.yml"
    BRANCH="dev"
    ;;
  production)
    COMPOSE_PROJECT="solivio"
    OBSERVABILITY_FILE="docker-compose.prod.observability.yml"
    BRANCH="main"
    ;;
  *)
    echo "Environnement inconnu : $ENVIRONMENT" >&2
    exit 1
    ;;
esac

: "${SSH_PRIVATE_KEY:?}"
: "${SSH_HOST:?}"
: "${SSH_USER:?}"
: "${DEPLOY_PATH:?}"
: "${IMAGE_BASE:?}"
: "${IMAGE_TAG:?}"
: "${INFISICAL_PROJECT_ID:?}"
: "${INFISICAL_CLIENT_ID:?}"
: "${INFISICAL_CLIENT_SECRET:?}"

# Infisical tourne sur le VPS lui-meme, jamais expose : le script s'execute sur le
# serveur (SSH) et l'atteint en local.
INFISICAL_API_URL='http://localhost:8081'

# Version figee par commit et verifiee par empreinte. Le plugin est installe pour
# l'utilisateur SSH, partage avec Cobage qui epingle la meme version.
DOCKER_ROLLOUT_VERSION='v0.14'
DOCKER_ROLLOUT_COMMIT='a72a9632c38187abd6d8799e4a9d5054a67fe615'
DOCKER_ROLLOUT_SHA256='cdeaba6ae9eee3b0b606286e585bbda6787283d801a6ad6d9b9d2bc347fda05b'

SSH_KEY_FILE="$(mktemp)"
KNOWN_HOSTS_FILE="$(mktemp)"
trap 'rm -f "$SSH_KEY_FILE" "$KNOWN_HOSTS_FILE"' EXIT

printf '%s\n' "$SSH_PRIVATE_KEY" > "$SSH_KEY_FILE"
chmod 600 "$SSH_KEY_FILE"

# Confiance a la premiere connexion de chaque execution : une empreinte figee serait
# plus stricte mais demande un secret de plus a maintenir. Compromis assume.
ssh-keyscan -H "$SSH_HOST" > "$KNOWN_HOSTS_FILE" 2>/dev/null

BACKEND_IMAGE="${IMAGE_BASE}-backend:${IMAGE_TAG}"
FRONTEND_IMAGE="${IMAGE_BASE}-frontend:${IMAGE_TAG}"
BACKUP_IMAGE="${IMAGE_BASE}-backup:${IMAGE_TAG}"

echo "Deploiement de ${ENVIRONMENT}, images ${IMAGE_TAG}"

# shellcheck disable=SC2087
ssh -i "$SSH_KEY_FILE" -o UserKnownHostsFile="$KNOWN_HOSTS_FILE" "$SSH_USER@$SSH_HOST" bash -s <<REMOTE
set -euo pipefail
cd "$DEPLOY_PATH"

export COMPOSE_PROJECT_NAME="$COMPOSE_PROJECT"
export DEPLOYMENT_ENVIRONMENT="$ENVIRONMENT"
export BACKEND_IMAGE="$BACKEND_IMAGE"
export FRONTEND_IMAGE="$FRONTEND_IMAGE"
export BACKUP_IMAGE="$BACKUP_IMAGE"

# Les fichiers compose suivent exactement le commit dont les images ont ete
# construites (HEAD detache). Le fichier Traefik, non suivi, n'est pas touche.
# --force : le serveur ne garde aucune modification locale d'un fichier suivi ; une
# difference de fins de ligne (mvnw.cmd, corrige par #60) bloquait le checkout.
echo "=== Synchronisation du depot au commit ${IMAGE_TAG} ==="
git fetch --quiet origin "$BRANCH"
git checkout --quiet --force "$IMAGE_TAG"

COMPOSE_FILES="-f docker-compose.yml -f docker-compose.prod.traefik.yml -f $OBSERVABILITY_FILE"

# Affectation et export separes : un export combine a la substitution masquerait l'echec de la
# commande et set -e laisserait passer un jeton vide.
export INFISICAL_API_URL="$INFISICAL_API_URL"
INFISICAL_TOKEN="\$(infisical login --method=universal-auth --client-id="$INFISICAL_CLIENT_ID" --client-secret="$INFISICAL_CLIENT_SECRET" --silent --plain)"
export INFISICAL_TOKEN

run() {
  infisical run --projectId="$INFISICAL_PROJECT_ID" --env="$ENVIRONMENT" -- docker compose \$COMPOSE_FILES "\$@"
}

rollout() {
  infisical run --projectId="$INFISICAL_PROJECT_ID" --env="$ENVIRONMENT" -- docker rollout \$COMPOSE_FILES "\$@"
}

echo "=== Installation de docker-rollout ${DOCKER_ROLLOUT_VERSION} ==="
PLUGIN="\$HOME/.docker/cli-plugins/docker-rollout"
if ! echo "${DOCKER_ROLLOUT_SHA256}  \$PLUGIN" | sha256sum --check --status 2>/dev/null; then
  mkdir -p "\$(dirname "\$PLUGIN")"
  curl -fsSL "https://raw.githubusercontent.com/Wowu/docker-rollout/${DOCKER_ROLLOUT_COMMIT}/docker-rollout" -o "\$PLUGIN.tmp"
  echo "${DOCKER_ROLLOUT_SHA256}  \$PLUGIN.tmp" | sha256sum --check --quiet
  chmod +x "\$PLUGIN.tmp"
  mv "\$PLUGIN.tmp" "\$PLUGIN"
fi

echo "=== Recuperation des images ==="
run pull

echo "=== Base de donnees et sauvegarde ==="
run up -d --remove-orphans --wait --wait-timeout 300 postgres backup

# Au premier deploiement, docker-rollout se contente de demarrer le service ; le
# frontend attend alors un backend sain (depends_on).
echo "=== Backend ==="
rollout --timeout 300 backend

echo "=== Frontend ==="
rollout --timeout 120 frontend

echo "Deploiement termine (${ENVIRONMENT}, images ${IMAGE_TAG})."
REMOTE
