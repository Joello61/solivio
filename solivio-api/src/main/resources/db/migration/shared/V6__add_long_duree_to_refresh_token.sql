-- V6: ajoute la colonne long_duree sur refresh_token.
-- Permet de propaguer la preference "rester connecte" lors des rotations de token.
-- DEFAULT true : comportement identique a l'ancien code (refresh etendait toujours la session).
ALTER TABLE refresh_token
    ADD COLUMN IF NOT EXISTS long_duree BOOLEAN NOT NULL DEFAULT true;
