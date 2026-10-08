# Sauvegarde et restauration

Le service `backup` de `docker-compose.yml` sauvegarde chaque environnement toutes les nuits (01:30 UTC, `crontab`), sur le modèle de Cobage (ADR-009) :

1. `pg_dump --format=custom` de la base et archive des fichiers déposés (logos, avatars), toujours ensemble pour qu'une restauration ne laisse jamais une référence sans son fichier ;
2. chiffrement GPG pour la clé publique `cle-publique.asc`, versionnée et copiée dans l'image : la clé privée reste hors du VPS, un serveur compromis ne peut pas relire les archives ;
3. envoi vers le bucket Cloudflare R2 dédié, sous `production/AAAA-MM-JJ.tar.gpg` ou `staging/AAAA-MM-JJ.tar.gpg`, avec un jeton R2 limité à ce bucket et donné à ce seul service ;
4. rétention : les 7 derniers jours, plus la dernière sauvegarde de chacune des 4 dernières semaines et des 3 derniers mois ; chaque environnement ne purge que son préfixe ;
5. signal au moniteur "push" Uptime Kuma : `up` après succès, `down` dès un échec. Sans signal pendant 26 heures, Uptime Kuma alerte aussi.

Objectifs : perte de données maximale de 24 heures, remise en service en moins de 24 heures.

Lancement manuel, par exemple pour vérifier la chaîne complète : `docker exec solivio-backup-1 sauvegarde.sh` (ou `solivio-staging-backup-1`).

## Mise en place (une fois)

### Clé de chiffrement

Sur une machine de confiance, jamais sur le VPS :

```bash
gpg --quick-gen-key "Solivio sauvegardes <adresse@exemple>" default default never
gpg --armor --export "Solivio sauvegardes" > docker/backup/cle-publique.asc
gpg --armor --export-secret-keys "Solivio sauvegardes" > solivio-sauvegardes-cle-privee.asc
```

La clé privée et sa phrase de passe vont dans le gestionnaire de mots de passe, avec une seconde copie hors ligne. Sans elles, aucune archive n'est récupérable. La clé publique est committée : la changer demande un nouveau déploiement, les anciennes archives restant lisibles avec l'ancienne clé privée.

### Cloudflare R2

1. Créer le bucket `solivio-backups`, sans domaine public.
2. Créer un jeton API R2 "Object Read & Write" limité à ce seul bucket. Il sert aux deux environnements, séparés par leur préfixe.
3. Dans Infisical (projet Solivio, environnements `staging` et `production`) : `R2_ENDPOINT` (`https://<id-compte>.r2.cloudflarestorage.com`), `R2_BACKUPS_BUCKET`, `R2_BACKUPS_ACCESS_KEY_ID`, `R2_BACKUPS_SECRET_ACCESS_KEY`.

Ces secrets doivent exister avant le premier déploiement qui contient le service : Compose refuse de démarrer sans eux.

### Uptime Kuma

Un moniteur de type "Push" par environnement (`Solivio - Sauvegarde`, `Solivio (staging) - Sauvegarde`), intervalle de 26 heures, aucune nouvelle tentative. Dans Infisical, `BACKUP_HEARTBEAT_URL` reçoit l'URL interne du moniteur, sans ses paramètres : `http://<conteneur-uptime-kuma>:3001/api/push/<jeton>`. Uptime Kuma rejoint le réseau `default` de chaque projet Solivio (dépôt `infrastructure`), le service l'atteint donc sans passer par Internet.

## Restauration

Le déchiffrement se fait sur la machine qui détient la clé privée :

```bash
rclone copyto r2:solivio-backups/production/<date>.tar.gpg ./<date>.tar.gpg
gpg --decrypt --output sauvegarde.tar <date>.tar.gpg
scp sauvegarde.tar vps:/tmp/sauvegarde.tar
```

Puis sur le VPS :

```bash
cd /opt/apps/solivio
COMPOSE_PROJECT_NAME=solivio docker/backup/restore.sh /tmp/sauvegarde.tar
shred -u /tmp/sauvegarde.tar
```

Le script demande de taper le nom du projet avant de remplacer quoi que ce soit, arrête le backend et le service de sauvegarde pendant l'opération, puis les redémarre. Les archives en clair contiennent des données de bénéficiaires : les supprimer partout dès la restauration terminée.

## Test de restauration

Une sauvegarde qui n'a jamais été restaurée n'est pas une sauvegarde. Après la mise en place, puis chaque trimestre :

1. Déchiffrer la dernière archive comme ci-dessus.
2. La restaurer dans un PostgreSQL 18 jetable, sur la machine locale :
   ```bash
   tar -xf sauvegarde.tar
   docker run -d --name solivio-restauration -e POSTGRES_PASSWORD=test postgres:18-alpine
   docker exec -i solivio-restauration pg_restore -U postgres -d postgres --no-owner --no-privileges < base.dump
   docker exec solivio-restauration psql -U postgres -c "select count(*) from compte" -c "select count(*) from distribution"
   tar -tf uploads.tar | head
   ```
3. Vérifier que la restauration se termine sans erreur et que les compteurs et fichiers sont cohérents avec l'environnement.
4. Tout supprimer (`docker rm -f solivio-restauration`, archives et fichiers extraits) : des données réelles de bénéficiaires ne restent jamais dans une copie.
5. Noter la date, l'environnement et le résultat dans le journal ci-dessous.

| Date | Environnement | Résultat | Détail |
|---|---|---|---|
| 2026-10-08 | staging | Succès | `staging/2026-10-08.tar.gpg` (11 Ko, sauvegarde lancée à la main) téléchargé depuis R2, déchiffré sur la machine locale, restauré dans un PostgreSQL 18 jetable avec `pg_restore --no-owner --no-privileges`, code 0. Schéma à jour (V10), aucun compte ni distribution (préproduction encore vide), dossiers `avatars/` et `logos/` présents. Prochaine échéance : 2027-01-08, avec une archive de production. |
