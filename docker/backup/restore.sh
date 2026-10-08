#!/usr/bin/env bash
#
# Restaure une sauvegarde produite par backup.sh : remplace la base et les
# fichiers deposes du projet Compose cible. Destructif, demande une confirmation.
#
# Usage : BACKUP_GPG_PASSPHRASE=... COMPOSE_PROJECT_NAME=solivio restore.sh <archive.tar.gpg>
# Le backend est arrete pendant la restauration puis redemarre.

set -euo pipefail

ARCHIVE="${1:?Usage: restore.sh <archive.tar.gpg>}"
: "${BACKUP_GPG_PASSPHRASE:?BACKUP_GPG_PASSPHRASE doit etre definie}"
: "${COMPOSE_PROJECT_NAME:?COMPOSE_PROJECT_NAME doit etre definie (solivio ou solivio-staging)}"

TRAVAIL="$(mktemp -d)"
trap 'rm -rf "$TRAVAIL"' EXIT

conteneur() {
  docker ps -aq \
    --filter "label=com.docker.compose.project=${COMPOSE_PROJECT_NAME}" \
    --filter "label=com.docker.compose.service=$1"
}

POSTGRES="$(conteneur postgres)"
BACKEND="$(conteneur backend)"
if [ -z "$POSTGRES" ] || [ -z "$BACKEND" ]; then
  echo "Erreur : conteneurs postgres ou backend introuvables pour ${COMPOSE_PROJECT_NAME}." >&2
  exit 1
fi

read -r -p "Remplacer la base et les fichiers de ${COMPOSE_PROJECT_NAME} ? Taper le nom du projet : " REPONSE
if [ "$REPONSE" != "$COMPOSE_PROJECT_NAME" ]; then
  echo "Restauration annulee."
  exit 1
fi

gpg --batch --decrypt --pinentry-mode loopback --passphrase-fd 3 "$ARCHIVE" 3<<<"$BACKUP_GPG_PASSPHRASE" \
  | tar -C "$TRAVAIL" -xf -

docker stop "$BACKEND" > /dev/null

docker exec -i "$POSTGRES" sh -c 'pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists --no-owner' \
  < "$TRAVAIL/base.dump"

# Les fichiers sont reecrits par un conteneur temporaire monte sur les memes volumes,
# le backend etant arrete.
docker run --rm --volumes-from "$BACKEND" -i alpine:3.22 \
  sh -c 'find /var/solivio/uploads -mindepth 1 -delete && tar -C /var/solivio/uploads -xf -' \
  < "$TRAVAIL/uploads.tar"

docker start "$BACKEND" > /dev/null
echo "Restauration terminee depuis $ARCHIVE."
