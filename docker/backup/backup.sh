#!/usr/bin/env bash
#
# Sauvegarde chiffree de Solivio : base PostgreSQL (pg_dump, format custom) et
# fichiers deposes (logos, avatars), toujours ensemble pour qu'une restauration
# ne laisse jamais une reference sans son fichier.
#
# Usage : BACKUP_GPG_PASSPHRASE=... COMPOSE_PROJECT_NAME=solivio backup.sh [repertoire]
# A lancer depuis le repertoire de deploiement. Ecrit
# <repertoire>/solivio-backup-<horodatage>.tar.gpg (par defaut ./backups).

set -euo pipefail

: "${BACKUP_GPG_PASSPHRASE:?BACKUP_GPG_PASSPHRASE doit etre definie}"
: "${COMPOSE_PROJECT_NAME:?COMPOSE_PROJECT_NAME doit etre definie (solivio ou solivio-staging)}"

SORTIE="${1:-./backups}"
HORODATAGE="$(date -u +%Y%m%dT%H%M%SZ)"
TRAVAIL="$(mktemp -d)"
trap 'rm -rf "$TRAVAIL"' EXIT

mkdir -p "$SORTIE"
chmod 700 "$SORTIE"

conteneur() {
  docker ps -q \
    --filter "label=com.docker.compose.project=${COMPOSE_PROJECT_NAME}" \
    --filter "label=com.docker.compose.service=$1"
}

POSTGRES="$(conteneur postgres)"
BACKEND="$(conteneur backend)"
if [ -z "$POSTGRES" ] || [ -z "$BACKEND" ]; then
  echo "Erreur : postgres ou backend ne tourne pas dans le projet ${COMPOSE_PROJECT_NAME}." >&2
  exit 1
fi

# Les identifiants sont lus dans le conteneur : aucun secret n'est passe en argument.
docker exec "$POSTGRES" sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' > "$TRAVAIL/base.dump"
docker exec "$BACKEND" tar -C /var/solivio/uploads -cf - . > "$TRAVAIL/uploads.tar"

ARCHIVE="$SORTIE/solivio-backup-${HORODATAGE}.tar.gpg"
tar -C "$TRAVAIL" -cf - base.dump uploads.tar \
  | gpg --batch --yes --symmetric --cipher-algo AES256 --pinentry-mode loopback \
        --passphrase-fd 3 --output "$ARCHIVE" 3<<<"$BACKUP_GPG_PASSPHRASE"
chmod 600 "$ARCHIVE"

echo "Sauvegarde ecrite : $ARCHIVE"
