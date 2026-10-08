# CLAUDE.md - Backend (Spring Boot)

Ce fichier complète `../CLAUDE.md` (sources de vérité, pile, confidentialité, règles de code, tests, Git, workflow). **Il ne les recopie pas** : tout ce qui n'est pas spécifique au backend s'applique ici sans modification.

Le backend est l'autorité métier, d'autorisation et de validation. Le frontend web et le mobile ne sont jamais une source de vérité.

## 1. Sources de vérité spécifiques

| Document | Ce qu'il définit pour le backend |
|---|---|
| `../docs/specifications_fonctionnelles.md` | Règles de gestion `RG*` à implémenter et tester |
| `../docs/modele_donnees.md` | Entités, invariants, contraintes à garantir en base |
| `../docs/architecture_technique.md` | Modules, événements, authentification, exploitation, ADR |
| `../docs/modules/` | Documentation générée des modules et de leurs dépendances |

## 2. Versions

Spring Boot 4 (Spring Framework 7, Spring Security 7, Hibernate 7, Jackson 3), Spring Modulith, Java 25, PostgreSQL 18. Vérifier les versions réelles dans `pom.xml` avant toute supposition. Points connus de Spring Boot 4 :

- Jackson 3 : `tools.jackson.databind.json.JsonMapper`, pas `com.fasterxml.jackson.databind.ObjectMapper` (sauf pour jjwt, qui utilise encore Jackson 2 en interne).
- Les starters sont modulaires (par exemple `spring-boot-starter-flyway`, `spring-boot-starter-webmvc`) avec leurs starters de test dédiés.
- `@AutoConfigureMockMvc` n'est pas disponible : utiliser `MockMvcBuilders.webAppContextSetup(...).apply(springSecurity())`.
- Spring Security 7 : `new DaoAuthenticationProvider(userDetailsService)` ; gérer `AuthorizationDeniedException` explicitement.

## 3. Modules et frontières

- Un module est un sous-package direct de `com.solivio.api`, décrit par un `package-info.java` annoté `@ApplicationModule`. Ce qu'un module expose aux autres est marqué `@NamedInterface` ; tout le reste est interne.
- Structure interne : `domain`, `application`, `infrastructure` (`persistence`, `web`, planification).
- Interaction entre modules : port d'un module exposé (souvent dans `shared`) ou événement interne. Jamais d'injection d'un repository, d'un service interne ou d'une entité d'un autre module.
- `ModularityTest` (`ApplicationModules.of(SolivioApiApplication.class).verify()`) doit rester vert. Une violation se corrige par un port ou un événement, jamais en assouplissant la vérification.

## 4. Événements internes

- Un événement est un `record` immuable, publié par `ApplicationEventPublisher` depuis un service transactionnel, après les écritures métier.
- Un écouteur est une méthode `@ApplicationModuleListener` (asynchrone, transaction propre, exécutée après validation).
- La livraison est garantie au moins une fois (registre `event_publication`) : un écouteur doit tolérer une double exécution.
- Un événement ne transporte que des identifiants et les données strictement nécessaires, jamais de donnée de `profil_beneficiaire`.
- Pas de broker de messages : ne jamais réintroduire Kafka ou équivalent sans ADR.

## 5. Base de données

- Flyway est le seul maître du schéma (`src/main/resources/db/migration`). Une migration publiée n'est jamais modifiée : on en ajoute une nouvelle.
- Un seul schéma (`public`). Aucune entité ne déclare de schéma par association.
- Contraintes en base chaque fois que possible : clés étrangères, unicité, `CHECK`, `NOT NULL`.
- Identifiants techniques UUID. Requêtes paramétrées uniquement.

## 6. API

- Contrôleurs minces : validation (`jakarta.validation`), autorisation (`@PreAuthorize`), délégation au service applicatif.
- Erreurs au format unique `{"error": {"code", "message", "details", "request_id"}}` ; un message d'erreur n'expose jamais de trace, de requête SQL, de chemin ni de donnée personnelle.
- Une ressource inexistante ou non autorisée répond `404`.
- Entrées utilisateur textuelles assainies (Jsoup) avant persistance.
- OpenAPI (springdoc) exposée uniquement en `dev` et `test`.

## 7. Authentification et autorisation

- JWT signé HMAC-SHA256 (jjwt), clé fournie par `SOLIVIO_AUTH_JWT_SECRET` ; démarrage refusé si elle manque ou est trop courte.
- Rôles en majuscules dans le jeton (`ROLE_COORDINATEUR`, etc.) : utiliser les majuscules dans `@PreAuthorize`.
- Jetons de rafraîchissement stockés hachés, rotation à chaque usage.
- Limitation de débit et verrouillage temporaire sur les points d'entrée d'authentification.
- Derrière Traefik : `server.forward-headers-strategy=framework` pour que `request.isSecure()` et l'adresse IP cliente soient corrects.

## 8. Observabilité

- Journaux JSON (format structuré Spring Boot) sur la sortie standard, avec `request_id` et l'UUID du compte dans le MDC. Jamais de donnée personnelle.
- Métriques Micrometer sur le port de gestion, protégées par `METRICS_SCRAPE_TOKEN` ; métriques métier préfixées `solivio_`.
- Traces OpenTelemetry (OTLP).

## 9. Tests

- Unitaires : logique de domaine et services (JUnit 5, Mockito, AssertJ).
- Intégration : `SolivioIntegrationTest` et Testcontainers PostgreSQL (`TestcontainersConfiguration`) ; nettoyage des données entre tests, jamais de dépendance à l'ordre d'exécution.
- Modules : `@ApplicationModuleTest` et l'API `Scenario` pour vérifier "action, événement publié, effet de l'écouteur".
- Autorisation : pour chaque point d'entrée protégé, au moins un cas autorisé et un cas refusé.
- Couverture JaCoCo de 80 pour cent des lignes, bloquante ; les exclusions sont listées dans `pom.xml` et ne s'étendent pas pour masquer un manque de tests.

## 10. Workflow backend

En complément du workflow de `../CLAUDE.md` :

1. Lire la documentation concernée (section 1).
2. Inspecter le code et les tests du module concerné, et ses dépendances déclarées.
3. Vérifier sur la documentation officielle les API Spring utilisées pour la version installée.
4. Implémenter dans le module concerné sans franchir ses frontières.
5. Ajouter les tests, puis lancer `./mvnw verify` (tests, couverture, Checkstyle, modularité).
6. Relire le diff et les migrations.
