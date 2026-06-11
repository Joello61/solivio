-- V13 tenant: remplacer le champ lieu texte libre par un objet structure (Google Places)
-- Chaque colonne correspond a un champ retourne par l'API Places (place_id, geometry, address_components).
ALTER TABLE distribution DROP COLUMN IF EXISTS lieu;

ALTER TABLE distribution
    ADD COLUMN lieu_place_id         VARCHAR(255),
    ADD COLUMN lieu_nom              VARCHAR(255),
    ADD COLUMN lieu_adresse_formatee VARCHAR(500),
    ADD COLUMN lieu_latitude         DOUBLE PRECISION,
    ADD COLUMN lieu_longitude        DOUBLE PRECISION,
    ADD COLUMN lieu_numero_rue       VARCHAR(20),
    ADD COLUMN lieu_voie             VARCHAR(255),
    ADD COLUMN lieu_code_postal      VARCHAR(20),
    ADD COLUMN lieu_ville            VARCHAR(100);
