# CLAUDE.md - Solivio

## Projet

Solivio est une plateforme open source de gestion operationnelle pour les
associations de solidarite (inscription a des distributions, benevoles,
beneficiaires, repartition des denrees). Licence AGPL v3.
Cible V1 : voir `specifications_fonctionnelles.md`. Construire pour une seule
association d'abord, generaliser ensuite.

## Stack

- Backend : Spring Boot 4 sur Java 25.
- Frontend : Next.js 16, React 19, TypeScript, Tailwind CSS.
- Base de donnees : PostgreSQL 18, un schema par association (multi-tenant).
- Authentification : Keycloak (OpenID Connect), deleguee.
- Evenementiel : Apache Kafka (mode KRaft).
- Secrets : OpenBao (jamais de secret en clair dans le code ou la config).
- Conteneurisation : Docker et Docker Compose.
- CI/CD : GitLab.

Toujours partir de la derniere version stable et verifier au demarrage.

## Architecture

- Monolithe modulaire. Modules : identite-acces, distributions, inscriptions,
  repartition, notifications, audit, socle-multi-association.
- Un module n'accede jamais aux tables ni aux internes d'un autre module.
  La communication passe par des interfaces explicites ou des evenements Kafka.
- Isolation multi-association : CRITIQUE. Toute requete est limitee a une seule
  association. Ne jamais ecrire de code pouvant lire les donnees d'une autre
  association. Toute nouvelle fonctionnalite touchant aux donnees doit etre
  couverte par la suite de tests d'isolation.
- Confidentialite : les donnees sensibles du beneficiaire (profil_beneficiaire)
  sont a acces restreint. Ne jamais les exposer au pointage ni dans les
  statistiques. Les statistiques sont toujours agregees et pseudonymisees.

## Regles de code (non negociables)

- Aucun emoji, nulle part : code, commentaires, messages de commit.
- Frontend : aucun emoji. Utiliser la bibliotheque d'icones du projet
  (par defaut lucide-react) a la place.
- Aucun caractere special ou typographique : pas de tiret cadratin, pas de
  guillemets courbes, pas de lignes ou separateurs decoratifs, pas de
  caracteres unicode decoratifs. Ponctuation ASCII simple uniquement
  (trait d'union, guillemets droits).
- Commentaires : ecrire comme un developpeur. Concis, expliquant l'intention
  et le pourquoi, jamais l'evidence. Pas de narration ni de meta-commentaire
  de style IA. Commentaires rediges en francais.
- Nommage : identifiants de code en anglais ; noms d'entites metier conformes
  au modele de donnees ; texte visible par l'utilisateur en francais.

## Tests (non negociables)

- Toujours ajouter ou mettre a jour les tests avec chaque fonctionnalite ou
  correction. Ne jamais omettre les tests de non-regression.
- Backend : couverture minimale de 80 pour cent mesuree par JaCoCo. Une
  modification qui fait passer sous 80 pour cent n'est pas terminee.
- Backend : tests unitaires (logique metier) et tests d'integration avec
  Testcontainers (vraie base, vrai Kafka).
- Frontend : tests unitaires des composants et tests de bout en bout des
  parcours critiques (inscription, pointage, repartition).

## Qualite

- Backend : Checkstyle doit passer avant tout commit.
- Frontend : le lint doit passer avant tout commit.
- Ne pas committer si les tests, la couverture, Checkstyle ou le lint echouent.

## Git

- Messages de commit : ne jamais ajouter Claude comme co-auteur. Aucune ligne
  "Co-authored-by: Claude" ni mention "Generated with Claude".
- Messages clairs et factuels, decrivant le quoi et le pourquoi du changement.

## Commandes

<!-- A finaliser apres l'echafaudage du projet (Maven ou Gradle, runner front).
     Valeurs ci-dessous donnees comme intention par defaut. -->

- Backend, build et tests : `./mvnw verify`
- Backend, couverture JaCoCo : `./mvnw verify` (rapport sous target/site/jacoco)
- Backend, Checkstyle : `./mvnw checkstyle:check`
- Frontend, lint : `npm run lint`
- Frontend, tests : `npm test`
- Environnement local complet : `docker compose up`

## References

- Specifications : `specifications_fonctionnelles.md`
- Modele de donnees : `modele_donnees.md`
- Architecture : `architecture_technique.md`
- Parcours : `parcours_utilisateurs.md`
- Vocabulaire : `glossaire.md`
