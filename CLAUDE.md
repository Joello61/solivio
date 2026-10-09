# CLAUDE.md - Solivio

Ce fichier est le guide permanent de Claude Code pour le projet **Solivio**.

Solivio est une plateforme open source (AGPL v3) de gestion opérationnelle pour **Linkee Toulouse**, association de solidarité étudiante : distributions alimentaires et inscriptions, bénévoles, bénéficiaires, pointage, répartition des denrées, événements, collectes, reconditionnement, notifications et statistiques.

Ce fichier définit des **règles de comportement**, pas des spécifications. Les exigences détaillées vivent dans `docs/`. Les règles propres au backend et au frontend sont dans `solivio-api/CLAUDE.md` et `solivio_frontend/CLAUDE.md`, qui complètent ce fichier sans le recopier.

## 1. Sources de vérité

| Document | Ce qu'il définit |
|---|---|
| `docs/note_intention.md` | Vision, public, intention du projet |
| `docs/specifications_fonctionnelles.md` | Périmètre V1, règles de gestion (`RG*`), exigences fonctionnelles et non fonctionnelles |
| `docs/parcours_utilisateurs.md` | Parcours par rôle, écrans, critères d'usage |
| `docs/modele_donnees.md` | Entités, invariants, contraintes, confidentialité des données |
| `docs/architecture_technique.md` | Architecture, modules, pile, exploitation, décisions `ADR-*` |
| `docs/glossaire.md` | Vocabulaire métier, noms d'entités |
| `docs/roadmap.md` | Séquencement et état d'avancement |
| `docs/modules/` | Documentation des modules générée par Spring Modulith |
| `PRODUCT.md` | Public, problème, principes produit, voix, hors périmètre |
| `DESIGN.md` | Système de design du frontend : tokens, typographie, composants, accessibilité |

Avant une fonctionnalité importante :

1. Identifier et lire les sections concernées de `docs/`.
2. Inspecter le code existant (le code, pas le souvenir de ce qui a été dit).
3. Vérifier les décisions déjà prises (`ADR-*`, règles `RG*`).
4. Signaler toute contradiction entre documents, ou entre documentation et code.
5. Si une décision documentée doit changer, mettre à jour le document concerné (nouvel ADR pour une décision d'architecture) plutôt que dévier silencieusement.

Ne jamais remplacer silencieusement une décision documentée par une préférence personnelle, y compris en matière de bibliothèque, de nommage ou de règle métier. Une question ouverte se signale à l'utilisateur, elle ne se tranche pas seul.

## 2. Vérification Internet obligatoire

La connaissance interne du modèle sur les frameworks et bibliothèques peut être obsolète. Avant d'implémenter quoi que ce soit qui dépend du comportement actuel d'une technologie, faire une recherche sur la documentation officielle de la version réellement installée : Spring Boot, Spring Security, Spring Modulith, Hibernate, Flyway, Jackson, Next.js, React, Tailwind CSS v4, Expo, PostgreSQL, Docker, GitHub Actions, Traefik, Grafana, ainsi que toute dépendance déjà présente dans `pom.xml` ou `package.json`.

Procédure : identifier la version installée, consulter la documentation officielle de cette version, vérifier les release notes et les API dépréciées, vérifier les recommandations de sécurité, puis implémenter.

Sources à privilégier, dans l'ordre : documentation officielle, release notes, dépôt officiel, avis de sécurité officiels, puis seulement sources communautaires si nécessaire.

## 3. Versioning

Toujours une version stable et officiellement supportée : jamais d'alpha, bêta, RC, milestone ni snapshot, jamais d'API dépréciée quand une alternative stable existe. Le critère est "stable, compatible avec la pile, supportée", pas "la plus récente". Ne jamais utiliser le tag Docker `latest`.

## 4. Stack

Décisions détaillées dans `docs/architecture_technique.md` (ADR-001 à ADR-010).

| Couche | Choix |
|---|---|
| Backend | Spring Boot 4 sur Java 25, monolithe modulaire vérifié par Spring Modulith |
| Événements internes | Spring Modulith, registre de publication JDBC (pas de broker de messages) |
| Base de données | PostgreSQL 18, un seul schéma, migrations Flyway |
| Authentification | Intégrée au backend : JWT (jjwt), Google OAuth 2.0, cookies HttpOnly ou Bearer pour le mobile |
| Frontend web | Next.js 16, React 19, TypeScript strict, Tailwind CSS v4, `lucide-react` |
| Mobile | Expo / React Native (Expo Router, NativeWind), gelé pendant la refonte du socle |
| Secrets | Variables d'environnement injectées par Infisical, jamais versionnées |
| Exploitation | Docker, Traefik, Grafana Alloy, Loki, Prometheus, Tempo, Grafana (dépôt `infrastructure` du VPS) |
| CI/CD | GitHub Actions, images GHCR |

Ne jamais changer cette pile par préférence du moment. Toute modification importante est discutée avec l'utilisateur et documentée par un nouvel ADR.

Une seule association utilise Solivio (ADR-001) : ne jamais réintroduire de notion de tenant, de schéma par association ou de choix d'association.

## 5. Architecture

- Monolithe modulaire. Modules : `identity`, `association`, `distribution`, `inscription`, `repartition`, `notification`, `statistique`, `evenement`, `collecte`, `reconditionnement`, `audit`, et `shared` pour les ports partagés.
- Un module n'accède jamais aux tables, repositories ou entités d'un autre module. La communication passe par des ports explicites ou des événements internes. Cette règle est vérifiée par le test de modularité Spring Modulith : un test rouge n'est jamais contourné, la violation est corrigée.
- Controllers minces ; logique métier dans le domaine et les services applicatifs, testable sans couche HTTP.
- Éviter l'abstraction prématurée, les patterns "pour faire propre" et les dépendances inutiles.

## 6. Confidentialité des données

Les bénéficiaires sont en situation de précarité : la confidentialité est critique.

- Les données sensibles du bénéficiaire (`profil_beneficiaire`) sont à accès restreint. Ne jamais les exposer au pointage, dans les statistiques, dans les journaux, dans les traces ni dans les messages d'erreur.
- Les statistiques sont toujours agrégées et pseudonymisées.
- Les journaux ne contiennent que des identifiants techniques (UUID), jamais de nom, email ou téléphone.
- Toute nouvelle donnée personnelle est minimisée et justifiée par la spécification.

## 7. Sécurité

- Toute autorisation est vérifiée côté backend ; le frontend et le mobile ne sont jamais une frontière de sécurité.
- À chaque accès à une ressource : authentification, rôle, et appartenance de la ressource à l'utilisateur quand c'est pertinent (IDOR). Une ressource inexistante ou non autorisée répond `404`.
- Validation et assainissement de toutes les entrées côté serveur ; requêtes paramétrées uniquement.
- Ne jamais committer de secret, clé d'API, mot de passe, jeton ou fichier `.env` contenant des secrets. Aucun secret en dur dans un fichier de configuration versionné, y compris comme valeur par défaut.
- Toute nouvelle dépendance ou fonctionnalité exposée est évaluée sous l'angle sécurité avant d'être ajoutée.

## 8. Règles de code (non négociables)

- Aucun emoji, nulle part : code, commentaires, logs, messages de commit, titres et descriptions de PR, documentation.
- Frontend et mobile : aucun emoji dans l'interface, utiliser la bibliothèque d'icônes du projet (`lucide-react` par défaut).
- Aucun caractère typographique ou décoratif : pas de tiret cadratin ni demi-cadratin, pas de guillemets courbes ni de guillemets français, pas de flèches unicode, pas de points de suspension unicode, pas de lignes ou séparateurs décoratifs (`-----`, commentaires encadrés de traits de dessin de boîte). Ponctuation ASCII simple uniquement (trait d'union, guillemets droits, `->`).
- Commentaires : rares, concis, écrits comme un développeur, en français. Ils expliquent l'intention et le pourquoi (décision inhabituelle, compromis, contrainte externe, comportement non évident), jamais l'évidence. Pas de narration ni de méta-commentaire.
- Nommage : identifiants de code en anglais ; noms d'entités métier conformes au modèle de données et au glossaire ; texte visible par l'utilisateur en français.
- Code simple et lisible, fonctions courtes, pas de code mort, pas de valeur magique, pas de duplication.

## 9. Tests (non négociables)

- Toujours ajouter ou mettre à jour les tests avec chaque fonctionnalité ou correction ; toute correction de bug reçoit un test de non-régression.
- Backend : couverture minimale de 80 pour cent des lignes, mesurée par JaCoCo et bloquante. Une modification qui fait passer sous 80 pour cent n'est pas terminée.
- Backend : tests unitaires (logique métier), tests d'intégration avec Testcontainers (vraie base PostgreSQL), tests de module Spring Modulith, test de modularité.
- Toute fonctionnalité touchant aux autorisations est couverte par des tests d'accès par rôle (autorisé et refusé).
- Frontend : tests unitaires des composants (Vitest, Testing Library) et tests de bout en bout des parcours critiques (Playwright : inscription, pointage, répartition).

## 10. Qualité

- Backend : Checkstyle et le test de modularité doivent passer.
- Frontend : `npm run lint` et `npx tsc --noEmit` doivent passer.
- Ne pas committer si les tests, la couverture, Checkstyle, la modularité ou le lint échouent.

## 11. Dépendances

Avant d'ajouter une dépendance : vérifier si Spring Boot, Spring Modulith ou Next.js fournit déjà la fonctionnalité ; vérifier la documentation officielle, la version stable, la compatibilité avec la pile, la maintenance active et les vulnérabilités connues ; vérifier qu'elle est réellement nécessaire. Ne jamais ajouter une dépendance pour économiser quelques lignes.

## 12. Docker et exploitation

- Images multi-étapes, utilisateur non root, contrôle de santé, versions explicites.
- PostgreSQL n'est jamais exposé hors du réseau Docker de l'application.
- L'application s'intègre à la stack du VPS : journaux JSON sur la sortie standard, métriques sur le port de gestion protégé par jeton, traces OTLP. Voir `docs/architecture_technique.md` sections 10 et 11.

## 13. Git

- Dépôt : `github.com/Joello61/solivio`, migré depuis GitLab en octobre 2026 ; les PR #1 à #32 reprennent les MR GitLab du même numéro.
- Branches : tout travail part de `dev`. `dev` correspond à la préproduction (staging), `main` à la production. Faire un `git fetch` avant toute fusion ou création de branche.
- Commits granulaires : un changement cohérent par commit, sans mélanger plusieurs sujets.
- Messages clairs et factuels, décrivant le quoi et le pourquoi.
- Ne jamais ajouter Claude comme co-auteur ni aucune attribution à Claude : pas de ligne `Co-Authored-By` mentionnant Claude, pas de mention "Generated with Claude", ni dans les commits ni dans les descriptions de PR/MR.
- Descriptions de PR/MR : ce qui a changé, pourquoi, tests effectués, impacts, risques.
- Ne jamais fusionner une PR/MR sans l'accord explicite de l'utilisateur.

## 14. Commandes

| Action | Commande |
|---|---|
| Backend, build, tests, couverture, Checkstyle, modularité | `cd solivio-api && ./mvnw verify` (rapport JaCoCo sous `target/site/jacoco`) |
| Backend, Checkstyle seul | `cd solivio-api && ./mvnw checkstyle:check` |
| Backend, démarrage local | `cd solivio-api && SPRING_PROFILES_ACTIVE=dev ./mvnw spring-boot:run` |
| Frontend, lint | `cd solivio_frontend && npm run lint` |
| Frontend, types | `cd solivio_frontend && npx tsc --noEmit` |
| Frontend, tests | `cd solivio_frontend && npm test` |
| Frontend, bout en bout | `cd solivio_frontend && npm run test:e2e` |
| Environnement local | `docker compose -f docker-compose-dev.yml up` |

## 15. Workflow de Claude

Avant toute modification importante :

1. Lire la demande.
2. Lire les documents de `docs/` concernés (section 1).
3. Inspecter le code et les tests existants.
4. Identifier les décisions déjà prises (`ADR-*`, `RG*`).
5. Vérifier la documentation officielle actuelle si la tâche dépend du comportement d'une technologie (section 2).
6. Vérifier les implications sécurité et confidentialité (sections 6 et 7).
7. Implémenter le changement minimal cohérent avec l'architecture (section 5).
8. Ajouter ou mettre à jour les tests (section 9).
9. Exécuter les vérifications (section 10).
10. Relire le diff.
11. Mettre à jour `docs/` quand la tâche fait évoluer une décision documentée.

Ne jamais commencer par une réécriture massive. Ne pas modifier de fichiers sans rapport avec la tâche.

## 16. Règle finale

Avant de coder : inspecter, comprendre, vérifier, rechercher, planifier. Puis : implémenter, tester, sécuriser, documenter.

Règle fondamentale : **"Do not guess when the answer can be verified."**
