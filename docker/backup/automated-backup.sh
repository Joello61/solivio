#!/usr/bin/env bash
#
# Sauvegarde quotidienne, lancee par cron ou un timer systemd sur le VPS (jamais un
# conteneur de plus) : backup.sh, copie hors du serveur par rclone, retention.
#
# Variables attendues (fournies a cron par un fichier lisible par le seul
# utilisateur de deploiement, jamais committe) :
#   BACKUP_GPG_PASSPHRASE       obligatoire, differente par environnement
#   BACKUP_RCLONE_REMOTE        obligatoire, par exemple "s3-backup:solivio-backups"
#   COMPOSE_PROJECT_NAME        solivio ou solivio-staging
#   BACKUP_RETENTION_DAYS       optionnel, 14 par defaut
#   BACKUP_MONITORING_PUSH_URL  optionnel, moniteur "push" Uptime Kuma appele en cas
#                               de succes : l'absence de signal declenche l'alerte
#
# Usage, depuis le repertoire de deploiement : docker/backup/automated-backup.sh

set -euo pipefail

: "${BACKUP_RCLONE_REMOTE:?BACKUP_RCLONE_REMOTE doit etre definie}"
RETENTION="${BACKUP_RETENTION_DAYS:-14}"
REPERTOIRE="./backups"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SORTIE="$("$SCRIPT_DIR/backup.sh" "$REPERTOIRE")"
echo "$SORTIE"
ARCHIVE="$(sed -n 's/^Sauvegarde ecrite : //p' <<<"$SORTIE")"

rclone copy "$ARCHIVE" "$BACKUP_RCLONE_REMOTE" --checksum

find "$REPERTOIRE" -maxdepth 1 -name 'solivio-backup-*.tar.gpg' -mtime "+${RETENTION}" -delete
rclone delete "$BACKUP_RCLONE_REMOTE" --min-age "${RETENTION}d"

if [ -n "${BACKUP_MONITORING_PUSH_URL:-}" ]; then
  curl -fsS -m 10 "$BACKUP_MONITORING_PUSH_URL" > /dev/null \
    || echo "Avertissement : signal de succes non envoye (la sauvegarde a reussi)." >&2
fi
