#!/usr/bin/env bash
#
# Restaure une sauvegarde du service "backup" : remplace la base et les fichiers
# deposes du projet Compose cible. Destructif, demande une confirmation.
#
# L'archive est dechiffree au prealable sur une machine qui detient la cle privee,
# jamais sur le VPS (docker/backup/README.md) : ce script recoit le .tar en clair.
#
# Usage : COMPOSE_PROJECT_NAME=solivio restore.sh <sauvegarde.tar>
# Le backend et le service de sauvegarde sont arretes pendant la restauration.

set -euo pipefail

ARCHIVE="${1:?Usage: restore.sh <sauvegarde.tar>}"
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
SAUVEGARDE="$(conteneur backup)"
if [ -z "$POSTGRES" ] || [ -z "$BACKEND" ]; then
  echo "Erreur : conteneurs postgres ou backend introuvables pour ${COMPOSE_PROJECT_NAME}." >&2
  exit 1
fi

read -r -p "Remplacer la base et les fichiers de ${COMPOSE_PROJECT_NAME} ? Taper le nom du projet : " REPONSE
if [ "$REPONSE" != "$COMPOSE_PROJECT_NAME" ]; then
  echo "Restauration annulee."
  exit 1
fi

tar -C "$TRAVAIL" -xf "$ARCHIVE" base.dump uploads.tar

# Le service de sauvegarde ne doit pas archiver un etat a moitie restaure.
docker stop "$BACKEND" ${SAUVEGARDE:+"$SAUVEGARDE"} > /dev/null

docker exec -i "$POSTGRES" sh -c 'pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists --no-owner' \
  < "$TRAVAIL/base.dump"

# Les fichiers sont reecrits par un conteneur temporaire monte sur les memes volumes,
# le backend etant arrete. Ils sont rendus au proprietaire du volume (utilisateur du
# backend), qui peut differer de celui de l'environnement sauvegarde.
docker run --rm --volumes-from "$BACKEND" -i alpine:3.22 \
  sh -c 'cible=/var/solivio/uploads && proprietaire="$(stat -c %u:%g "$cible")" \
    && find "$cible" -mindepth 1 -delete && tar -C "$cible" -xf - && chown -R "$proprietaire" "$cible"' \
  < "$TRAVAIL/uploads.tar"

docker start "$BACKEND" ${SAUVEGARDE:+"$SAUVEGARDE"} > /dev/null
echo "Restauration terminee depuis $ARCHIVE."
