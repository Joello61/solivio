-- V10 : verrouillage temporaire d'un compte apres des echecs de connexion
-- consecutifs (ADR-004).
ALTER TABLE compte
    ADD COLUMN echecs_connexion   INTEGER     NOT NULL DEFAULT 0,
    ADD COLUMN verrouille_jusqu_a TIMESTAMPTZ;
