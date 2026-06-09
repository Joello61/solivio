-- V10 tenant : contrainte d'unicite simple sur inscription(distribution_id, personne_id, type).
-- Remplace les deux index partiels (beneficiaire_active, benevole_active) introduits en V4.
-- Une reinscription apres annulation reutilise desormais la ligne existante (pas de nouvelle ligne).

-- Deduplication : en cas de lignes multiples pour le meme triplet (cas existants avant ce fix),
-- on conserve la plus recente en prioritisant les lignes actives sur les annulees.
DELETE FROM inscription
WHERE id IN (
    SELECT id FROM (
        SELECT id,
               ROW_NUMBER() OVER (
                   PARTITION BY distribution_id, personne_id, type
                   ORDER BY
                       CASE statut WHEN 'ANNULEE' THEN 1 ELSE 0 END ASC,
                       date_inscription DESC
               ) AS rn
        FROM inscription
    ) ranked
    WHERE rn > 1
);

DROP INDEX IF EXISTS uq_inscription_beneficiaire_active;
DROP INDEX IF EXISTS uq_inscription_benevole_active;

ALTER TABLE inscription
    ADD CONSTRAINT uq_inscription_distribution_personne_type
    UNIQUE (distribution_id, personne_id, type);
