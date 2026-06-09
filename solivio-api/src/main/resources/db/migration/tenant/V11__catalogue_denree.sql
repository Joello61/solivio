-- V11 tenant: catalogue des denrees de l'association
-- Alimente automatiquement lors de la saisie d'une denree dans une distribution.
-- Gerable manuellement par les responsables/admins.

CREATE TABLE IF NOT EXISTS catalogue_denree (
    id                UUID         NOT NULL DEFAULT gen_random_uuid(),
    libelle           VARCHAR(200) NOT NULL,
    date_creation     TIMESTAMPTZ  NOT NULL DEFAULT now(),
    date_modification TIMESTAMPTZ  NOT NULL DEFAULT now(),

    CONSTRAINT pk_catalogue_denree PRIMARY KEY (id)
);

-- Unicite insensible a la casse : riz et Riz sont la meme denree.
CREATE UNIQUE INDEX IF NOT EXISTS uq_catalogue_denree_libelle
    ON catalogue_denree(LOWER(libelle));
