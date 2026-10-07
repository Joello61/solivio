# Sauvegarde et restauration

`backup.sh` produit une archive chiffrée (GPG, AES-256) qui contient toujours ensemble la base PostgreSQL (`pg_dump`, format custom) et les fichiers déposés (logos, avatars). `restore.sh` remet les deux en place. `automated-backup.sh` enchaîne sauvegarde, copie hors du serveur (rclone, tout stockage compatible S3) et rétention.

Objectifs : perte de données maximale de 24 heures (sauvegarde quotidienne), remise en service en moins de 24 heures.

## Clé de chiffrement

`BACKUP_GPG_PASSPHRASE` est différente par environnement, rangée dans Infisical et dans un gestionnaire de mots de passe, jamais à côté des archives qu'elle protège ni dans le dépôt. Sans elle, une archive est irrécupérable.

## Mise en place sur le VPS (une fois par environnement)

1. Installer `rclone` et `gpg`, puis configurer un remote (`rclone config`) vers un stockage situé hors du VPS.
2. Créer un fichier d'environnement lisible par le seul utilisateur de déploiement (`chmod 600`), hors du dépôt, par exemple `~/.config/solivio/backup-production.env` :
   ```bash
   BACKUP_GPG_PASSPHRASE=...
   BACKUP_RCLONE_REMOTE=s3-backup:solivio-backups/production
   COMPOSE_PROJECT_NAME=solivio
   BACKUP_MONITORING_PUSH_URL=...
   ```
3. Planifier la sauvegarde quotidienne (crontab de l'utilisateur de déploiement) :
   ```cron
   30 2 * * * cd /opt/apps/solivio && set -a && . ~/.config/solivio/backup-production.env && set +a && docker/backup/automated-backup.sh >> ~/solivio-backup.log 2>&1
   ```
4. Dans Uptime Kuma, créer un moniteur "push" avec un délai de 26 heures et reporter son URL dans `BACKUP_MONITORING_PUSH_URL` : une sauvegarde qui ne s'exécute plus déclenche une alerte.

## Restauration

```bash
cd /opt/apps/solivio
rclone copy s3-backup:solivio-backups/production/solivio-backup-<horodatage>.tar.gpg ./backups/
BACKUP_GPG_PASSPHRASE=... COMPOSE_PROJECT_NAME=solivio docker/backup/restore.sh ./backups/solivio-backup-<horodatage>.tar.gpg
```

Le script demande de taper le nom du projet avant de remplacer quoi que ce soit, arrête le backend pendant l'opération puis le redémarre.

## Test de restauration

Une sauvegarde qui n'a jamais été restaurée n'est pas une sauvegarde. Après la mise en place, puis chaque trimestre :

1. Démarrer un projet Compose jetable à partir des images de production, sans Traefik ni observabilité : `COMPOSE_PROJECT_NAME=solivio-restauration`, mêmes variables qu'en production via `infisical run` mais avec `SMTP_HOST=smtp.invalid` (les rappels planifiés ne doivent envoyer aucun email aux personnes de la sauvegarde), puis `docker compose -f docker-compose.yml up -d`.
2. Y restaurer la dernière sauvegarde de production (`COMPOSE_PROJECT_NAME=solivio-restauration docker/backup/restore.sh ...`).
3. Vérifier par `docker compose exec` que la base contient les comptes et distributions attendus et que les fichiers déposés sont présents.
4. Supprimer le projet et ses volumes (`docker compose down -v`) : des données réelles de bénéficiaires ne restent jamais dans une copie, et jamais dans la préproduction.
5. Noter la date du test et la durée de la restauration dans le suivi d'exploitation.
