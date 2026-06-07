-- V4 tenant: module inscriptions
-- Table inscription, qui porte aussi la presence (pointage).
-- nom et prenom denormalises pour eviter un JOIN cross-module au pointage.

CREATE TABLE IF NOT EXISTS inscription (
    id                  UUID         NOT NULL DEFAULT gen_random_uuid(),
    distribution_id     UUID         NOT NULL,
    creneau_id          UUID,
    personne_id         UUID         NOT NULL,
    nom                 VARCHAR(100) NOT NULL,
    prenom              VARCHAR(100) NOT NULL,
    type                VARCHAR(15)  NOT NULL,
    statut              VARCHAR(20)  NOT NULL DEFAULT 'CONFIRMEE',
    rang_liste_attente  INTEGER,
    role_benevole       VARCHAR(100),
    presence            VARCHAR(15)  NOT NULL DEFAULT 'NON_POINTE',
    date_pointage       TIMESTAMPTZ,
    pointe_par_id       UUID,
    date_inscription    TIMESTAMPTZ  NOT NULL DEFAULT now(),

    CONSTRAINT pk_inscription PRIMARY KEY (id),
    CONSTRAINT fk_inscription_distribution FOREIGN KEY (distribution_id)
        REFERENCES distribution(id) ON DELETE CASCADE,
    CONSTRAINT fk_inscription_creneau FOREIGN KEY (creneau_id)
        REFERENCES creneau(id),
    CONSTRAINT fk_inscription_personne FOREIGN KEY (personne_id)
        REFERENCES personne(id),
    CONSTRAINT fk_inscription_pointe_par FOREIGN KEY (pointe_par_id)
        REFERENCES personne(id),
    CONSTRAINT ck_inscription_type CHECK (type IN ('BENEFICIAIRE','BENEVOLE')),
    CONSTRAINT ck_inscription_statut CHECK (
        statut IN ('CONFIRMEE','LISTE_ATTENTE','ANNULEE')
    ),
    CONSTRAINT ck_inscription_presence CHECK (
        presence IN ('NON_POINTE','PRESENT','ABSENT')
    )
);

-- RG2 : un beneficiaire ne peut etre inscrit qu'une fois par distribution (sauf si annule)
CREATE UNIQUE INDEX IF NOT EXISTS uq_inscription_beneficiaire_active
    ON inscription(distribution_id, personne_id)
    WHERE type = 'BENEFICIAIRE' AND statut != 'ANNULEE';

-- RG2 bis : un benevole ne peut s'inscrire qu'une fois par distribution (sauf si annule)
CREATE UNIQUE INDEX IF NOT EXISTS uq_inscription_benevole_active
    ON inscription(distribution_id, personne_id)
    WHERE type = 'BENEVOLE' AND statut != 'ANNULEE';

CREATE INDEX IF NOT EXISTS idx_inscription_distribution ON inscription(distribution_id);
CREATE INDEX IF NOT EXISTS idx_inscription_personne ON inscription(personne_id);
CREATE INDEX IF NOT EXISTS idx_inscription_liste_attente
    ON inscription(distribution_id, type, rang_liste_attente)
    WHERE statut = 'LISTE_ATTENTE';
