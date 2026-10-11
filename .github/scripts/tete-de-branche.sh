#!/usr/bin/env bash
# Verifie, juste avant un deploiement, que le commit de cette execution est encore
# la tete de la branche. GitHub ne garde qu'une execution en attente par groupe de
# concurrence : lors de fusions rapprochees, l'execution du dernier commit peut etre
# remplacee par celle d'un commit plus ancien, qui deploierait alors un etat depasse.
# Dans ce cas on ne deploie pas, et on relance la CI sur la tete de la branche si
# aucune execution n'est deja prevue pour elle.
#
# Ecrit a_jour=true|false dans GITHUB_OUTPUT. Requiert GH_TOKEN (actions: write).
set -euo pipefail

tete=$(gh api "repos/${GITHUB_REPOSITORY}/commits/${GITHUB_REF_NAME}" --jq .sha)
if [ "$tete" = "$GITHUB_SHA" ]; then
  echo "a_jour=true" >> "$GITHUB_OUTPUT"
  exit 0
fi

echo "a_jour=false" >> "$GITHUB_OUTPUT"
echo "::notice::${GITHUB_SHA:0:12} n'est plus la tete de ${GITHUB_REF_NAME} (${tete:0:12}) : pas de deploiement."

prevues=$(gh run list --repo "$GITHUB_REPOSITORY" --workflow ci.yml --commit "$tete" \
  --json status --jq '[.[] | select(.status != "completed")] | length')
if [ "$prevues" -gt 0 ]; then
  echo "::notice::Une execution est deja prevue pour ${tete:0:12}."
else
  # GitHub n'accepte workflow_dispatch que si main declare ce declencheur : avant la
  # premiere promotion de ce workflow en production, la relance echoue. Le job passe
  # alors en rouge pour qu'on relance la CI a la main plutot que de rester sur un
  # deploiement depasse.
  if ! gh workflow run ci.yml --repo "$GITHUB_REPOSITORY" --ref "$GITHUB_REF_NAME"; then
    echo "::error::Relance impossible : relancer la CI de ${tete:0:12} a la main."
    exit 1
  fi
  echo "::notice::CI relancee sur la tete de ${GITHUB_REF_NAME}."
fi
