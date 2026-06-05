-- V2 tenant: suppression de la dependance Keycloak dans le profil personne.
-- keycloak_id est remplace par compte_email qui fait le lien avec public.compte.
-- La contrainte UNIQUE sur email garantit l'integrite sans FK cross-schema.

ALTER TABLE personne
    DROP CONSTRAINT IF EXISTS uq_personne_keycloak_id,
    DROP COLUMN IF EXISTS keycloak_id;

ALTER TABLE personne
    ADD COLUMN IF NOT EXISTS compte_email VARCHAR(255);

-- Retrouve email deja present dans la colonne email
UPDATE personne SET compte_email = email WHERE compte_email IS NULL;

ALTER TABLE personne
    ADD CONSTRAINT uq_personne_compte_email UNIQUE (compte_email);
