# Solivio mobile (Expo)

Application mobile de Solivio pour les bénévoles et les bénéficiaires : Expo SDK 54, React Native 0.81, Expo Router, NativeWind. Elle consomme la même API que le frontend web, en mode Bearer (ADR-007, `docs/architecture_technique.md`).

## Gelée, en attente de remise à niveau

Depuis octobre 2026, le code de ce dossier n'évolue plus. La refonte du socle est terminée (9 octobre 2026) ; la reprise du mobile viendra avec la revue des fonctionnalités. Il est exclu de l'intégration continue et des mises à jour automatiques de dépendances.

**L'application ne fonctionne plus avec l'API actuelle.** Les ruptures à reprendre sont listées dans l'ADR-007 (`docs/architecture_technique.md`).

Seule exception au gel : la clé Google Maps codée en dur dans `app.config.ts` a été retirée (correctif de sécurité). La clé se fournit désormais par la variable `GOOGLE_MAPS_API_KEY` au moment du build.

## Reprise

1. Mettre à jour vers le SDK Expo courant (guide de migration officiel, version par version).
2. Reprendre les ruptures d'API de l'ADR-007.
3. Ajouter un script de test, puis un job CI (lint, types, tests) dans `.github/workflows/ci.yml`.
4. Construire les binaires avec EAS, avec les secrets fournis par EAS et jamais committés.
