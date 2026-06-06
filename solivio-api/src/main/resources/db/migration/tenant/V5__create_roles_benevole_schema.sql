-- V5 tenant: catalogue de roles benevoles et assignation par inscription.
-- Remplace le champ role_benevole VARCHAR(100) par un modele relationnel
-- permettant plusieurs roles cumulables assignes par le coordinateur.

ALTER TABLE inscription DROP COLUMN IF EXISTS role_benevole;

-- Catalogue de roles definis par l'association (2 niveaux : type + sous-type).
-- parent_id IS NULL  : role principal (ex: Distribution, Reapprovisionnement).
-- parent_id NOT NULL : sous-type      (ex: Distribution des patates).
CREATE TABLE IF NOT EXISTS type_role (
    id        UUID         NOT NULL DEFAULT gen_random_uuid(),
    parent_id UUID         REFERENCES type_role(id) ON DELETE CASCADE,
    libelle   VARCHAR(200) NOT NULL,
    actif     BOOLEAN      NOT NULL DEFAULT true,
    CONSTRAINT pk_type_role PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_type_role_parent
    ON type_role(parent_id) WHERE parent_id IS NOT NULL;

-- Roles assignes par le coordinateur a un benevole inscrit (0..N par inscription).
-- type_role_id est null si l'asso n'utilise pas de catalogue (libelle_libre requis).
CREATE TABLE IF NOT EXISTS role_benevole_inscription (
    id              UUID         NOT NULL DEFAULT gen_random_uuid(),
    inscription_id  UUID         NOT NULL REFERENCES inscription(id) ON DELETE CASCADE,
    type_role_id    UUID         REFERENCES type_role(id) ON DELETE SET NULL,
    libelle_libre   VARCHAR(200),
    CONSTRAINT pk_role_benevole_inscription PRIMARY KEY (id),
    CONSTRAINT ck_role_benevole_au_moins_un
        CHECK (type_role_id IS NOT NULL OR libelle_libre IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_role_benevole_inscription
    ON role_benevole_inscription(inscription_id);
