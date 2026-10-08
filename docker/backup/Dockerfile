# Service de sauvegarde (docker-compose.yml, service "backup").
# Meme image de base que la base de donnees : pg_dump a toujours la version majeure
# du serveur.
FROM postgres:18-alpine

RUN apk add --no-cache curl gnupg rclone supercronic tzdata

# Cle publique seulement : la cle privee reste hors du VPS, un serveur compromis ne
# peut pas dechiffrer les archives.
COPY cle-publique.asc /etc/solivio-sauvegarde/cle-publique.asc
COPY crontab /etc/solivio-sauvegarde/crontab
COPY --chmod=755 sauvegarde.sh /usr/local/bin/sauvegarde.sh

# Aucun fichier de configuration rclone : le remote est decrit par les variables
# RCLONE_CONFIG_R2_*.
ENV RCLONE_CONFIG=/dev/null

USER postgres
WORKDIR /tmp

HEALTHCHECK --interval=60s --timeout=5s --retries=3 CMD pgrep -x supercronic > /dev/null

ENTRYPOINT []
CMD ["supercronic", "-passthrough-logs", "/etc/solivio-sauvegarde/crontab"]
