# Déploiement

Le workflow `CI` (`.github/workflows/ci.yml`) construit les images une seule fois, après le succès de tous les contrôles sur un push, les pousse sur GHCR (étiquette : les 12 premiers caractères du SHA) puis appelle `ssh-deploy.sh` :

| Branche | Environnement | Domaine | Projet Compose | Répertoire sur le VPS |
|---|---|---|---|---|
| `dev` | `staging` | `staging.solivio.joeltech.fr` | `solivio-staging` | `/opt/apps/solivio-staging` |
| `main` | `production` | `solivio.joeltech.fr` | `solivio` | `/opt/apps/solivio` |

Le script synchronise le dépôt du serveur sur le commit testé (HEAD détaché), tire les images et relance la stack avec les secrets injectés par `infisical run`. Les migrations Flyway s'exécutent au démarrage du backend ; `docker compose up --wait` échoue si un conteneur n'atteint pas l'état sain.

Sur un dépôt privé, GitHub ne propose pas de validation manuelle avant un déploiement : le garde-fou de la production est la fusion de `dev` dans `main`, toujours faite à la main.

## Mise en service (une fois)

Les étapes sont dans l'ordre. Chaque bloc de commandes indique où il s'exécute.

### 1. DNS

Chez le registraire de `joeltech.fr`, deux enregistrements `A` vers le VPS :

```text
solivio.joeltech.fr          A   57.129.143.18
staging.solivio.joeltech.fr  A   57.129.143.18
```

Vérification (machine locale) : `dig +short solivio.joeltech.fr staging.solivio.joeltech.fr` affiche deux fois `57.129.143.18`.

### 2. Brevo (emails)

1. Senders, Domains & Dedicated IPs > Domains : authentifier `joeltech.fr` (enregistrements DKIM, DMARC et code Brevo à ajouter dans le DNS).
2. Senders : créer l'expéditeur `noreply@joeltech.fr` (c'est `SOLIVIO_MAIL_FROM`).
3. SMTP & API > SMTP : noter l'identifiant SMTP et générer une clé SMTP par environnement (`solivio-staging`, `solivio-production`). Une clé SMTP, pas une clé d'API.

### 3. Google Cloud

1. **Révoquer** l'ancien secret client OAuth et l'ancienne clé Maps, publiés dans l'historique git.
2. API et services > Identifiants > client OAuth : générer un nouveau secret, puis déclarer :
   - origines JavaScript autorisées : `https://solivio.joeltech.fr`, `https://staging.solivio.joeltech.fr` ;
   - URI de redirection autorisées : `https://solivio.joeltech.fr/login/oauth2/code/google`, `https://staging.solivio.joeltech.fr/login/oauth2/code/google`.
3. Nouvelle clé Maps restreinte par référent HTTP : `https://solivio.joeltech.fr/*`, `https://staging.solivio.joeltech.fr/*`.

### 4. Infisical (par tunnel SSH, `http://localhost:8081`)

1. Créer le projet **Solivio** et noter son identifiant (Project Settings) : c'est `INFISICAL_PROJECT_ID`.
2. Environnements : garder `staging`, et nommer celui de production avec le *slug* **`production`** (et non `prod`) : le script appelle `infisical run --env=production`.
3. Dans chaque environnement, créer les secrets suivants. Les valeurs générées le sont sur ta machine, une fois par environnement, jamais réutilisées entre les deux :

   | Secret | Valeur |
   |---|---|
   | `DB_NAME` | `solivio` |
   | `DB_USER` | `solivio` |
   | `DB_PASSWORD` | `openssl rand -base64 32` |
   | `SOLIVIO_AUTH_JWT_SECRET` | `openssl rand -base64 48` |
   | `METRICS_SCRAPE_TOKEN` | `openssl rand -hex 32` |
   | `FRONTEND_URL` | `https://staging.solivio.joeltech.fr` ou `https://solivio.joeltech.fr` |
   | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | client OAuth de l'étape 3 |
   | `GOOGLE_MAPS_API_KEY` | clé Maps de l'étape 3 |
   | `SMTP_HOST` | `smtp-relay.brevo.com` |
   | `SMTP_PORT` | `587` |
   | `SMTP_USERNAME`, `SMTP_PASSWORD` | identifiant et clé SMTP Brevo de cet environnement |
   | `SOLIVIO_MAIL_FROM` | `noreply@joeltech.fr` |
   | `BACKUP_GPG_PASSPHRASE` | `openssl rand -base64 32`, à copier aussi dans ton gestionnaire de mots de passe |

4. Access Control > Machine Identities : créer `solivio-staging-deploy` et `solivio-production-deploy` (Universal Auth), chacune en lecture seule sur son seul environnement du projet Solivio. Noter pour chacune le Client ID et générer un Client Secret.

### 5. Clés SSH de déploiement (machine locale)

Une clé par environnement, sans phrase de passe (elle est utilisée par GitHub Actions) :

```bash
ssh-keygen -t ed25519 -N "" -C "solivio-staging-deploy" -f ~/.ssh/solivio_staging_deploy
ssh-keygen -t ed25519 -N "" -C "solivio-production-deploy" -f ~/.ssh/solivio_production_deploy
# -f : sans lui, ssh-copy-id teste la connexion avec la cle de l'alias vps-ovh
# (ou de l'agent SSH), reussit, et croit a tort que la nouvelle cle est deja installee.
ssh-copy-id -f -i ~/.ssh/solivio_staging_deploy.pub vps-ovh
ssh-copy-id -f -i ~/.ssh/solivio_production_deploy.pub vps-ovh
```

Vérification, chaque clé seule comme le fera GitHub Actions (`IdentitiesOnly=yes` interdit toute autre clé) :

```bash
ssh -o IdentitiesOnly=yes -i ~/.ssh/solivio_staging_deploy ubuntu@57.129.143.18 'echo ok staging'
ssh -o IdentitiesOnly=yes -i ~/.ssh/solivio_production_deploy ubuntu@57.129.143.18 'echo ok production'
```

### 6. VPS

```bash
ssh vps-ovh

# Depot, une copie par environnement (HEAD detache a chaque deploiement)
git clone https://github.com/Joello61/solivio.git /opt/apps/solivio-staging
git clone https://github.com/Joello61/solivio.git /opt/apps/solivio

# Routage Traefik, fichier non suivi par git. git clone se place sur main, la branche
# par defaut ; l'exemple est lu sur dev pour ne dependre d'aucune mise en production.
cd /opt/apps/solivio
git show origin/dev:docker-compose.prod.traefik.yml.example > docker-compose.prod.traefik.yml
grep -c "solivio.joeltech.fr" docker-compose.prod.traefik.yml   # doit afficher 3

cd /opt/apps/solivio-staging
git show origin/dev:docker-compose.prod.traefik.yml.example \
  | sed -e 's/solivio\.joeltech\.fr/staging.solivio.joeltech.fr/g' \
        -e 's/routers\.solivio-/routers.solivio-staging-/g' \
        -e 's/services\.solivio-/services.solivio-staging-/g' \
        -e 's/service=solivio-/service=solivio-staging-/g' \
  > docker-compose.prod.traefik.yml
grep -c "solivio-staging-" docker-compose.prod.traefik.yml               # doit afficher 15
grep -c "staging.solivio.joeltech.fr" docker-compose.prod.traefik.yml    # doit afficher 3

# Acces aux images privees de GHCR : deja configure pour Cobage. A verifier :
grep -c ghcr.io ~/.docker/config.json   # 1 ou plus
```

Si le jeton GHCR du serveur n'a pas accès aux paquets de `Joello61/solivio`, le premier déploiement échouera au `pull` : refaire `docker login ghcr.io -u Joello61 --password-stdin` avec un jeton limité à `read:packages`.

### 7. GitHub (machine locale)

Créer les deux environnements et leurs secrets, mêmes noms, valeurs différentes. `gh secret set` lit la valeur sur l'entrée standard : rien ne s'affiche ni ne reste dans l'historique du shell.

```bash
R=Joello61/solivio
gh api -X PUT repos/$R/environments/staging --silent
gh api -X PUT repos/$R/environments/production --silent

for ENV in staging production; do
  gh secret set SSH_HOST  -R $R --env $ENV --body "57.129.143.18"
  gh secret set SSH_USER  -R $R --env $ENV --body "ubuntu"
  gh secret set INFISICAL_PROJECT_ID -R $R --env $ENV   # coller l'identifiant du projet
done

gh secret set DEPLOY_PATH -R $R --env staging    --body "/opt/apps/solivio-staging"
gh secret set DEPLOY_PATH -R $R --env production --body "/opt/apps/solivio"

gh secret set SSH_PRIVATE_KEY -R $R --env staging    < ~/.ssh/solivio_staging_deploy
gh secret set SSH_PRIVATE_KEY -R $R --env production < ~/.ssh/solivio_production_deploy

gh secret set INFISICAL_CLIENT_ID     -R $R --env staging      # identite solivio-staging-deploy
gh secret set INFISICAL_CLIENT_SECRET -R $R --env staging
gh secret set INFISICAL_CLIENT_ID     -R $R --env production   # identite solivio-production-deploy
gh secret set INFISICAL_CLIENT_SECRET -R $R --env production

gh secret list -R $R --env staging      # 7 secrets
gh secret list -R $R --env production   # 7 secrets
```

### 8. Premier déploiement en préproduction

Un push sur `dev` (par exemple la fusion de la PR qui contient ce fichier) lance la CI puis le job « Déploiement préproduction ». Suivi : onglet Actions du dépôt, ou `gh run watch -R Joello61/solivio`.

Vérifications :

```bash
# Machine locale
curl -fsS https://staging.solivio.joeltech.fr/api/health          # {"status":"ok"} (frontend)
curl -fsS -o /dev/null -w "%{http_code}\n" https://staging.solivio.joeltech.fr/api/distributions   # 401 (backend)

# VPS
cd /opt/apps/solivio-staging
docker compose -p solivio-staging ps          # postgres, backend, frontend : healthy
docker compose -p solivio-staging logs backend | tail -n 20
```

Puis dans le navigateur : inscription, email de vérification reçu (Brevo), connexion, connexion Google.

### 9. Observabilité (après le premier déploiement)

Les étapes sont détaillées dans la section « Ajout de Solivio » du README du dépôt `infrastructure` (PR #7) :

```bash
ssh vps-ovh
cd /opt/infrastructure
umask 077
read -rs JETON && printf '%s' "$JETON" > secrets/metrics_scrape_token_solivio_staging   # METRICS_SCRAPE_TOKEN de staging
sudo chown 65534:65534 secrets/metrics_scrape_token_solivio_staging
```

Même chose pour `metrics_scrape_token_solivio` après le premier déploiement de production. Ensuite : ajouter `|solivio|solivio-staging` à `OBSERVABILITY_ALLOWED_PROJECTS` dans le projet Infisical « Infrastructure », fusionner la PR #7, puis `git pull && ./deploy.sh` et `docker compose restart prometheus grafana`.

### 10. Sauvegardes

Voir `docker/backup/README.md` : fichier d'environnement de sauvegarde par environnement, crontab, moniteur « push » Uptime Kuma.

### 11. Production

Fusionner `dev` dans `main` (PR `dev` vers `main`) : la CI tourne sur `main` puis déploie la production. Mêmes vérifications qu'à l'étape 8 sur `https://solivio.joeltech.fr` et `/opt/apps/solivio`.

Mémoire du VPS : Solivio ajoute environ 3 Go en limite haute (backend 1 Go et frontend 512 Mo par environnement, plus PostgreSQL) ; surveiller le tableau de bord « VPS - Hôte » après la mise en production.

## Rotation d'un secret

1. Saisir la nouvelle valeur dans Infisical (environnement concerné).
2. Relancer le dernier déploiement : onglet Actions, dernière exécution de `CI` sur la branche, « Re-run all jobs ».
3. Pour `METRICS_SCRAPE_TOKEN`, mettre à jour le même jour le fichier de jeton de Prometheus (étape 9).
4. Changer `SOLIVIO_AUTH_JWT_SECRET` déconnecte tous les utilisateurs : à faire hors des créneaux de distribution.

## Retour arrière

Relancer la CI d'un commit antérieur de la branche (onglet Actions, « Re-run all jobs ») : son image existe déjà sur GHCR. Une migration Flyway déjà appliquée ne se défait pas : les migrations restent additives pour que la version précédente fonctionne encore sur le nouveau schéma.
