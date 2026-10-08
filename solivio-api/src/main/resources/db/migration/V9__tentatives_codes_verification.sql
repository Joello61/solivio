-- V9 : essais rates sur un code de verification a 6 chiffres (ADR-004).
-- Au-dela du seuil applicatif, le code est brule.
ALTER TABLE verification_code
    ADD COLUMN tentatives INTEGER NOT NULL DEFAULT 0;
