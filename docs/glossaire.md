# Glossaire — Solivio

> Le vocabulaire partagé du projet, pour que chaque terme veuille dire la même chose pour tout le monde.

**Document de pilotage — version 1.0**
**Statut : référence de travail**
**Dernière mise à jour : juin 2026**

---

## Avertissement de lecture

Ce glossaire existe parce que Solivio s'adresse à des publics très différents : le porteur, les associations, des recruteurs, de futurs contributeurs. Un même mot peut signifier des choses différentes selon qui le lit. « Distribution » n'évoque pas la même chose pour un développeur et pour un bénévole ; « bénéficiaire » porte une charge sociale ; « tenant » est du jargon technique.

Ce document fixe le sens des termes tels qu'ils sont employés dans toute la série. En cas de doute sur un mot dans un autre document, c'est ici que l'on tranche. Lorsqu'un terme a un sens particulier dans Solivio, il est précisé.

Les définitions sont volontairement accessibles : un membre de bureau non technique doit pouvoir comprendre l'essentiel, et un développeur y retrouver la précision nécessaire.

---

## 1. Termes du domaine associatif

**Association.** L'organisation cliente de Solivio. Dans le produit, c'est l'entité racine à laquelle tout est rattaché. Une association possède ses membres, ses distributions, ses données, et sa configuration propre.

**Bénéficiaire.** Une personne qui reçoit l'aide distribuée par l'association. C'est la personne centrale du produit, et celle dont les données sont les plus sensibles. Le terme est employé sans connotation négative : s'inscrire comme bénéficiaire doit rester un acte digne et neutre.

**Bénévole.** Une personne qui donne de son temps à l'association : aide à la distribution, à l'accueil, à la logistique. Un bénévole peut aussi être bénéficiaire, et inversement.

**Coordinateur.** Le membre qui organise les distributions et coordonne les équipes sur son périmètre. Il crée les distributions, suit les inscriptions, supervise le pointage et la répartition.

**Responsable.** Le membre qui pilote l'association : configuration, gestion des membres et des rôles, vue d'ensemble et statistiques. C'est le rôle le plus large.

**Distribution.** L'événement central de Solivio : un moment où l'association distribue son aide, à une date et un lieu donnés. Une distribution a un cycle de vie (brouillon, publiée, en cours, terminée, annulée), des créneaux, des inscriptions, et des denrées.

**Créneau.** Une plage horaire au sein d'une distribution. Selon le mode choisi par l'association, il peut s'agir d'une plage unique pour tous, ou de plusieurs petites plages successives.

**Mode de créneau.** Le réglage, choisi par l'association pour chaque distribution, qui définit le fonctionnement des créneaux : *créneau unique* (une seule plage, service dans l'ordre d'arrivée) ou *créneaux découpés* (plusieurs petites plages, service selon l'horaire réservé).

**Inscription.** Le lien entre une personne et une distribution. Une inscription peut être celle d'un bénéficiaire ou d'un bénévole, et a un statut (confirmée, en liste d'attente, annulée).

**Liste d'attente.** La file des personnes inscrites au-delà de la capacité d'une distribution. Quand une place se libère, la personne suivante est promue automatiquement.

**Pointage.** L'action d'enregistrer, le jour de la distribution, qui est réellement présent. Il fiabilise les statistiques et limite le gaspillage. Lors du pointage, on ne voit que le nom et le statut, jamais les données sensibles.

**Présence.** Le résultat du pointage pour une inscription : présent, absent, ou non encore pointé.

**Absence (ou « no-show »).** Le fait, pour une personne inscrite, de ne pas se présenter. Solivio compte les absences pour aider l'association à les suivre.

**Denrée.** Un bien distribué lors d'une distribution (par exemple des pommes de terre, des yaourts). Dans Solivio, une denrée est rattachée à une distribution précise, avec une quantité.

**Conditionnement.** La manière dont une denrée est comptée à l'arrivée : un nombre de contenants (sacs, cartons, cagettes) multiplié par une quantité par contenant. Solivio calcule la quantité totale à partir du conditionnement.

**Répartition.** Le calcul qui détermine combien de chaque denrée donner à chaque bénéficiaire, à partir des quantités disponibles et du nombre de bénéficiaires. C'est une fonction distinctive de Solivio.

**Dotation.** Le résultat de la répartition pour une denrée : la quantité attribuée à chaque bénéficiaire (quantité totale divisée par le nombre de bénéficiaires, arrondie à l'inférieur, avec un plancher à 1).

**Reste à vivre.** L'argent dont dispose une personne par mois une fois ses charges fixes déduites. C'est un indicateur clé de précarité, recueilli dans le profil bénéficiaire.

**Passation de bureau.** Le renouvellement, souvent annuel, de l'équipe dirigeante d'une association. C'est un moment critique : beaucoup d'outils associatifs meurent à cette occasion, faute d'être repris par la nouvelle équipe.

---

## 2. Termes du produit

**Solivio.** Le nom du produit : une plateforme de gestion opérationnelle pour les associations de solidarité.

**V1, V2, V3.** Les versions successives du produit. La V1 est le périmètre minimal et verrouillé décrit dans les spécifications ; la V2 renforce et commence à généraliser ; la V3 transforme Solivio en plateforme. On ne construit une version qu'après que la précédente a prouvé sa valeur.

**Module.** Un domaine fonctionnel cohérent du produit (par exemple le module Distributions, le module Notifications). Dans l'architecture, les modules sont aussi les briques internes du backend, aux frontières nettes.

**Instance.** Une installation de Solivio. Depuis octobre 2026, une instance sert une seule association : Linkee Toulouse (`architecture_technique.md`, ADR-001). Une autre association utiliserait sa propre instance. Les anciennes notions de "multi-association", "multi-tenant" et "isolation entre associations" ne s'appliquent plus.

**Configuration.** L'ensemble des réglages propres à une association : nom, logo, couleurs, paramètres. Elle permet d'adapter l'apparence sans développement.

**Non-enfermement.** Le principe selon lequel une association peut à tout moment exporter et supprimer l'intégralité de ses données, et n'est jamais prisonnière de l'outil. Découle de l'open source et de l'export des données.

**Mobile-first.** L'approche de conception qui part du téléphone d'abord, puis enrichit pour les grands écrans. À distinguer de *mobile-only* : Solivio est mobile-first mais pleinement utilisable sur ordinateur.

**Responsive.** Se dit d'une interface qui s'adapte automatiquement à toutes les tailles d'écran (téléphone, tablette, ordinateur).

---

## 3. Termes techniques

**Monolithe modulaire.** Le style d'architecture du backend : une seule application déployable, mais découpée à l'intérieur en modules indépendants. À mi-chemin entre le monolithe classique (un seul bloc) et les microservices (plusieurs applications).

**Microservice.** Une application autonome, déployée séparément, responsable d'un domaine précis. Solivio n'en utilise pas en V1, mais son architecture est conçue pour en extraire plus tard, à partir des modules existants.

**Spring Modulith.** La bibliothèque qui décrit les modules du backend, vérifie automatiquement qu'aucun module n'accède aux internes d'un autre, et fournit les événements internes fiables.

**RBAC (contrôle d'accès par rôle).** Un modèle où les droits dépendent du rôle de la personne (responsable, coordinateur, etc.). C'est la base du contrôle d'accès de la V1.

**ABAC (contrôle d'accès par attributs).** Un modèle plus fin où les droits dépendent du contexte : qui agit, sur quoi, dans quelle situation (par exemple, un coordinateur n'agit que sur ses distributions). C'est un différenciateur de Solivio, déployé progressivement au-delà de la V1.

**Événementiel (ou « asynchrone »).** Un mode de communication où un module signale qu'un événement s'est produit (par exemple « inscription confirmée ») sans attendre de réponse, et où un autre module y réagit (par exemple en envoyant un email). Cela découple les modules.

**Registre de publication.** La table de la base de données où chaque événement interne est enregistré dans la même transaction que la donnée métier, puis marqué terminé une fois traité. Il garantit qu'un événement n'est jamais perdu, même en cas d'arrêt de l'application.

**JWT (JSON Web Token).** Le jeton signé que le backend délivre après la connexion et qui prouve l'identité et les rôles de l'utilisateur à chaque requête. Solivio gère lui-même son authentification, sans outil externe.

**OIDC (OpenID Connect).** Le protocole standard utilisé pour la connexion avec un compte Google.

**Infisical.** L'outil de gestion des secrets (mots de passe, clés) hébergé sur le serveur. Il injecte les secrets dans l'application au moment de son lancement, sans qu'ils soient jamais écrits dans le code.

**Expo.** La plateforme utilisée pour construire l'application mobile en React Native.

**Observabilité.** La capacité à comprendre ce qui se passe dans l'application en production grâce à ses journaux (Loki), ses métriques (Prometheus) et ses traces (Tempo), consultés dans Grafana.

**Spring Boot.** Le cadre de développement du backend, en langage Java.

**Next.js.** Le cadre de développement du frontend, en langage TypeScript, fondé sur React.

**PostgreSQL.** Le système de base de données relationnelle utilisé pour stocker les données.

**Docker.** L'outil de conteneurisation : il empaquette chaque composant dans un « conteneur » standardisé, ce qui rend l'application reproductible et facile à déployer ou à auto-héberger.

**CI/CD (intégration et déploiement continus).** La chaîne automatisée qui teste, construit et déploie le code à chaque modification. Assurée ici par GitHub Actions. Elle permet d'avancer sans régression.

**Testcontainers.** Un outil qui lance de vraies dépendances (ici la base de données PostgreSQL) dans des conteneurs jetables le temps des tests d'intégration.

**Flyway.** L'outil qui gère les évolutions de la structure de la base de données de façon versionnée et contrôlée.

**Migration.** Une modification versionnée de la structure de la base de données (ajout d'une table, d'un champ). Appliquée de façon contrôlée, y compris sur tous les schémas des associations.

---

## 4. Termes juridiques, données et licences

**RGPD.** Le Règlement général sur la protection des données, cadre européen qui encadre le traitement des données personnelles. Central pour Solivio, qui manipule des données sensibles.

**Responsable de traitement.** L'entité qui décide pourquoi et comment des données personnelles sont traitées. Dans Solivio, c'est chaque association.

**Sous-traitant.** L'entité qui traite les données pour le compte du responsable de traitement. Dans Solivio, c'est le porteur qui héberge la plateforme. Cette distinction emporte des obligations précises.

**Accord de sous-traitance (DPA).** Le contrat entre le responsable de traitement (l'association) et le sous-traitant (la plateforme), qui encadre le traitement des données. À mettre en place avec les associations.

**Données sensibles.** Dans ce projet, les données sociales et financières des bénéficiaires (situation, reste à vivre, statut). Elles sont protégées strictement et à accès restreint.

**Catégories particulières (au sens du RGPD).** Les données les plus protégées par le RGPD (origine, opinions, santé, etc.). À ne pas confondre avec les « données sensibles » au sens courant employé ci-dessus : les données collectées par Solivio sont sensibles socialement mais ne relèvent pas, en principe, de ces catégories particulières.

**Pseudonymisation.** Le fait de traiter des données sans exposer l'identité des personnes (par exemple dans les statistiques, où l'on compte les bénéficiaires sans les nommer). Différent de l'anonymisation, qui rend l'identification impossible de façon irréversible.

**Minimisation.** Le principe de ne collecter que les données strictement nécessaires. Appliqué dans la conception du profil bénéficiaire.

**Droit à l'effacement.** Le droit d'une personne (ou d'une association) à obtenir la suppression de ses données. Dans Solivio, cette suppression est réelle et complète sur demande.

**Open source.** Se dit d'un logiciel dont le code est public et librement réutilisable, selon les termes d'une licence. Solivio est open source, gage de transparence et de pérennité.

**AGPL (licence retenue par Solivio).** Une licence open source à fort copyleft, qui impose à quiconque propose le logiciel comme service en ligne de publier son code, y compris ses modifications. Choisie parce que Solivio est un service en ligne et que l'AGPL empêche qu'un tiers en fasse une version fermée sans rien partager.

**Copyleft.** Le principe selon lequel les versions dérivées d'un logiciel libre doivent rester libres. L'AGPL est une licence à fort copyleft.

**BSL (Business Source License).** Une licence dite "source ouverte mais non open source" : le code est visible et utilisable, mais avec des restrictions (notamment l'interdiction d'en faire un service concurrent), et il devient open source après un délai.

---

## 5. Acronymes en un coup d'œil

| Acronyme | Signification | Référence |
|---|---|---|
| ABAC | Contrôle d'accès par attributs | Section 3 |
| RBAC | Contrôle d'accès par rôle | Section 3 |
| RGPD | Règlement général sur la protection des données | Section 4 |
| DPA | Accord de sous-traitance (Data Processing Agreement) | Section 4 |
| OIDC | OpenID Connect (protocole d'authentification) | Section 3 |
| CI/CD | Intégration et déploiement continus | Section 3 |
| AGPL | Affero General Public License | Section 4 |
| BSL | Business Source License | Section 4 |
| JWT | JSON Web Token | Section 3 |
| V1 / V2 / V3 | Versions successives du produit | Section 2 |

---

## 6. Synthèse en une page

**Pourquoi ce document.** Parce que Solivio parle à des publics différents, et qu'un vocabulaire commun évite les malentendus entre le porteur, les associations, les recruteurs et les contributeurs.

**Les familles de termes.** Le domaine associatif (bénéficiaire, distribution, créneau, répartition, dotation…), le produit (instance, V1, non-enfermement, etc.), la technique (monolithe modulaire, Spring Modulith, registre de publication, JWT, ABAC, Infisical, etc.), et le juridique (RGPD, sous-traitant, AGPL, BSL, pseudonymisation, etc.).

**Les distinctions à ne pas confondre.** Bénéficiaire et bénévole (une même personne peut être les deux) ; mobile-first et mobile-only ; RBAC et ABAC ; données sensibles au sens courant et catégories particulières du RGPD ; AGPL et BSL.

**La règle.** En cas de doute sur un terme ailleurs dans la série, c'est ici qu'on tranche.

---

*Fin du glossaire. Fin de la série documentaire de Solivio.*
