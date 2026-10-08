#!/bin/sh
# shellcheck shell=busybox
#
# Sauvegarde quotidienne de Solivio, executee par supercronic dans le service "backup"
# (docker-compose.yml) : pg_dump de la base et archive des fichiers deposes, chiffrees
# ensemble pour la cle publique de sauvegarde, copiees sur Cloudflare R2, puis purge
# selon la retention. Un moniteur "push" Uptime Kuma recoit le resultat.
#
# Lancement manuel : docker exec <projet>-backup-1 sauvegarde.sh
#
# Variables (injectees par Infisical au deploiement) :
#   PGHOST, PGUSER, PGPASSWORD, PGDATABASE  connexion a la base
#   BACKUP_ENVIRONMENT                      production ou staging, prefixe dans le bucket
#   R2_BACKUPS_BUCKET                       bucket dedie aux sauvegardes
#   RCLONE_CONFIG_R2_*                      remote rclone "r2" (voir docker-compose.yml)
#   BACKUP_HEARTBEAT_URL                    optionnelle, URL push sans parametres

set -eu -o pipefail

: "${BACKUP_ENVIRONMENT:?}"
: "${R2_BACKUPS_BUCKET:?}"

CLE_PUBLIQUE=/etc/solivio-sauvegarde/cle-publique.asc
UPLOADS=/var/solivio/uploads
TAILLE_MIN_OCTETS=1024
GARDER_JOURS=7
GARDER_SEMAINES=4
GARDER_MOIS=3

DESTINATION="r2:${R2_BACKUPS_BUCKET}/${BACKUP_ENVIRONMENT}"
DATE_DU_JOUR="$(date -u +%F)"
TRAVAIL="$(mktemp -d)"

journal() {
  printf 'time=%s level=%s environment=%s msg="%s"\n' \
    "$(date -u +%FT%TZ)" "$1" "$BACKUP_ENVIRONMENT" "$2"
}

signaler() {
  [ -n "${BACKUP_HEARTBEAT_URL:-}" ] || return 0
  curl -fsS -m 10 -o /dev/null "${BACKUP_HEARTBEAT_URL}?status=$1&msg=$2" \
    || journal warn "signal Uptime Kuma non envoye"
}

terminer() {
  code=$?
  rm -rf "$TRAVAIL"
  if [ "$code" -ne 0 ]; then
    journal error "echec de la sauvegarde (code $code)"
    # Alerte immediate, sans attendre l'expiration du moniteur.
    signaler down echec
  fi
}
trap terminer EXIT

# Lit des dates AAAA-MM-JJ triees de la plus recente a la plus ancienne et ecrit
# celles qui ne sont retenues ni parmi les derniers jours, ni comme plus recente
# sauvegarde d'une des dernieres semaines ou des derniers mois.
dates_a_purger() {
  while read -r jour; do
    printf '%s %s %s\n' "$jour" "$(date -u -d "$jour" +%G-%V)" "${jour%-*}"
  done | awk -v j="$GARDER_JOURS" -v s="$GARDER_SEMAINES" -v m="$GARDER_MOIS" '
    {
      garder = NR <= j
      if (!($2 in semaines) && length(semaines) < s) { semaines[$2]; garder = 1 }
      if (!($3 in mois) && length(mois) < m) { mois[$3]; garder = 1 }
      if (!garder) print $1
    }'
}

journal info "debut de la sauvegarde"

pg_dump --format=custom --file="$TRAVAIL/base.dump"
tar -C "$UPLOADS" -cf "$TRAVAIL/uploads.tar" .

ARCHIVE="$TRAVAIL/${DATE_DU_JOUR}.tar.gpg"
# Repertoire GnuPG jetable : la cle publique est lue depuis le fichier, aucun trousseau
# n'est conserve dans le conteneur.
GNUPGHOME="$TRAVAIL/gnupg"
mkdir -m 700 "$GNUPGHOME"
export GNUPGHOME
tar -C "$TRAVAIL" -cf - base.dump uploads.tar \
  | gpg --batch --quiet --trust-model always --recipient-file "$CLE_PUBLIQUE" \
        --encrypt --output "$ARCHIVE"

TAILLE="$(stat -c %s "$ARCHIVE")"
if [ "$TAILLE" -lt "$TAILLE_MIN_OCTETS" ]; then
  journal error "archive suspecte ($TAILLE octets)"
  exit 1
fi

rclone copyto "$ARCHIVE" "$DESTINATION/${DATE_DU_JOUR}.tar.gpg"
journal info "archive envoyee : ${BACKUP_ENVIRONMENT}/${DATE_DU_JOUR}.tar.gpg ($TAILLE octets)"

# Le prefixe d'environnement isole la purge : celle de la preproduction ne touche
# jamais la production.
rclone lsf "$DESTINATION" --files-only \
  | sed -n 's/^\([0-9]\{4\}-[0-9]\{2\}-[0-9]\{2\}\)\.tar\.gpg$/\1/p' \
  | sort -r \
  | dates_a_purger \
  | while read -r jour; do
      rclone deletefile "$DESTINATION/${jour}.tar.gpg"
      journal info "sauvegarde purgee : ${BACKUP_ENVIRONMENT}/${jour}.tar.gpg"
    done

journal info "sauvegarde terminee"
signaler up OK
