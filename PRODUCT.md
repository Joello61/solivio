# PRODUCT.md - Solivio

Fiche produit courte. Le détail fonctionnel est dans `docs/specifications_fonctionnelles.md` et `docs/parcours_utilisateurs.md`.

## Pour qui

**Linkee Toulouse**, association de solidarité étudiante qui organise des distributions alimentaires. Une seule association utilise Solivio (`docs/architecture_technique.md`, ADR-001).

| Utilisateur | Ce qu'il fait dans Solivio |
|---|---|
| Responsable | Configure l'association, gère les membres, consulte les statistiques, exporte les données |
| Coordinateur | Crée et publie les distributions, gère les inscriptions, saisit les denrées, pilote le pointage |
| Bénévole | S'inscrit aux distributions et aux missions, pointe les bénéficiaires le jour J |
| Bénéficiaire | S'inscrit à une distribution, reçoit confirmations et rappels |

## Le problème

L'association gère ses distributions avec des tableurs et des messageries : inscriptions dispersées, listes d'attente tenues à la main, pointage sur papier, répartition des denrées calculée au jugé, rappels oubliés. Les données de personnes en situation de précarité circulent sans protection.

## Ce que Solivio apporte

- Des distributions avec créneaux et capacités, une liste d'attente automatique et des règles de fréquence.
- Un pointage rapide sur téléphone, qui n'expose jamais les données sociales des bénéficiaires.
- Le calcul de la dotation par bénéficiaire à partir des denrées disponibles.
- Les emails de confirmation, de promotion, de rappel et d'annulation, envoyés automatiquement.
- Des statistiques agrégées et pseudonymisées, et l'export des données de l'association.

## Principes produit

1. **Plus simple que le tableur.** Une fonction qui complique l'usage du jour J n'entre pas.
2. **Confidentialité par défaut.** Les données sensibles d'un bénéficiaire ne sont visibles que des rôles qui en ont besoin.
3. **Fiable le jour J.** Une panne pendant une distribution est inacceptable.
4. **Sobriété.** Chaque fonction est une dette de maintenance pour un projet porté par une personne.
5. **Non-enfermement.** Code ouvert (AGPL v3) et données exportables.

## Voix

Française, directe, bienveillante. On parle de personnes, pas de "cas". Pas de jargon technique côté bénéficiaire, pas d'emoji.

## Hors périmètre V1

Stocks permanents, dons, campagnes, workflow configurable, formulaires sur mesure, multi-antennes, SMS, interface de programmation publique, plusieurs associations sur une même instance.

## Preuves disponibles

Aucun retour d'usage réel n'est encore documenté : la mise en conditions réelles est la phase 6 de `docs/roadmap.md`. Ne jamais inventer de témoignage ni de chiffre d'usage.
